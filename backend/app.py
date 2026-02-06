from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import re
import random
from datetime import datetime, timedelta, timezone
import firebase_admin
from firebase_admin import credentials, firestore
import traceback

# ==============================================================================
# CONFIGURAÇÃO DE DIRETÓRIOS E APP
# ==============================================================================

base_dir = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(base_dir, 'dist')
OEE_UPLOAD_FOLDER = os.path.join(base_dir, 'oee_uploads')

# Fallback para localizar a pasta dist caso esteja fora da pasta backend
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(os.path.dirname(base_dir), 'dist')

if not os.path.exists(OEE_UPLOAD_FOLDER):
    os.makedirs(OEE_UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
CORS(app) # Permite requisições de outras origens (ex: Vercel)

# ==============================================================================
# FIREBASE SETUP
# ==============================================================================

db_firestore = None
DATA_CACHE = None 

firebase_env = os.getenv("FIREBASE_CREDENTIALS")

try:
    cred = None
    if firebase_env:
        # Modo Produção: Credenciais via Secret/Env
        cred_dict = json.loads(firebase_env)
        cred = credentials.Certificate(cred_dict)
    else:
        # Modo Local: Procura pelo arquivo JSON de chave
        possible_keys = ['serviceAccountKey.json', 'firebase_credentials.json']
        for key in possible_keys:
            path = os.path.join(base_dir, key)
            if os.path.exists(path):
                cred = credentials.Certificate(path)
                break

    if cred:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db_firestore = firestore.client()
        print("[INFO] Firestore conectado.")
    else:
        print("[WARN] Firestore offline. Usando apenas memória RAM.")

except Exception as e:
    print(f"[ERROR] Falha na conexão Firebase: {e}")

# ==============================================================================
# IMPORTAÇÃO DO ENGINE OEE
# ==============================================================================

oee_service = None
try:
    try:
        from backend import oee_service
    except ImportError:
        import oee_service
except ImportError:
    print("[WARN] Módulo oee_service não encontrado.")

@app.errorhandler(Exception)
def handle_exception(e):
    """Captura erros globais para não travar a API."""
    traceback.print_exc()
    return jsonify({"sucesso": False, "erro": str(e)}), 500

# ==============================================================================
# LÓGICA DE PERSISTÊNCIA (LAB MANAGER GERAL)
# ==============================================================================

def save_db(data):
    global DATA_CACHE
    DATA_CACHE = data
    if not db_firestore: return
    try:
        db_firestore.collection('lab_data').document('main').set(data)
    except Exception as e:
        print(f"Erro ao salvar: {e}")

def load_db():
    global DATA_CACHE
    if DATA_CACHE is not None: return DATA_CACHE
    
    empty_schema = {"baths": [], "protocols": [], "logs": []}
    if not db_firestore: return empty_schema
    
    try:
        doc = db_firestore.collection('lab_data').document('main').get()
        if doc.exists:
            data = doc.to_dict()
            # Garante que chaves novas existam no objeto vindo do banco
            for key in empty_schema:
                if key not in data: data[key] = []
            DATA_CACHE = data
            return data
        save_db(empty_schema)
        return empty_schema
    except:
        return empty_schema

def add_log(db, action, bath_id, details):
    log_entry = {
        "id": int(datetime.now().timestamp() * 1000) + random.randint(1, 9999),
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "action": action,
        "bath": bath_id,
        "details": details
    }
    if 'logs' not in db: db['logs'] = []
    db['logs'].insert(0, log_entry)
    db['logs'] = db['logs'][:200] # Limite de histórico operacional

# ==============================================================================
# PROCESSAMENTO DE DADOS (MONITORAMENTO)
# ==============================================================================

def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

def identificar_nome_padrao(linha, db_protocols=[]):
    """Tenta casar o nome do teste do Digatron com os protocolos cadastrados."""
    texto = str(linha).upper().replace('_', '').replace('-', '').replace(' ', '')
    for p in db_protocols:
        slug = str(p['name']).upper().replace('_', '').replace('-', '').replace(' ', '')
        if slug and slug in texto:
            return p['name']
    parts = str(linha).split('_')
    return parts[-1].strip() if len(parts) > 1 else "Desconhecido"

def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    duracao = next((p['duration'] for p in db_protocols if p['name'].upper() in nome_protocolo.upper()), 0)
    if not duracao: return "A calcular"
    try:
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except: return "-"

def atualizar_progresso_em_tempo_real(db):
    """Calcula porcentagem de conclusão e encerra testes expirados."""
    global DATA_CACHE
    # Offset manual de 3h para horário de Brasília (evita utcnow deprecated)
    agora = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)
    mudou = False
    
    for bath in db.get('baths', []):
        for c in bath.get('circuits', []):
            if c.get('status') == 'running':
                try:
                    t_ini = datetime.strptime(c.get('startTime'), "%d/%m/%Y %H:%M")
                    t_fim = datetime.strptime(c.get('previsao'), "%d/%m/%Y %H:%M")
                    total = (t_fim - t_ini).total_seconds()
                    passado = (agora - t_ini).total_seconds()
                    
                    if agora >= t_fim:
                        c.update({'status': 'finished', 'progress': 100})
                        add_log(db, "Auto Concluir", bath['id'], f"{c['id']} finalizado por tempo.")
                        mudou = True
                    else:
                        pct = (passado / total) * 100 if total > 0 else 0
                        c['progress'] = round(max(0, min(99.9, pct)), 1)
                        DATA_CACHE = db 
                except: pass
            elif c.get('status') == 'finished' and c.get('progress') != 100:
                c['progress'] = 100
                mudou = True

    if mudou: save_db(db)

# ==============================================================================
# ROTAS API - MÓDULO OEE
# ==============================================================================

@app.route('/api', methods=['GET'])
def api_base():
    """Rota base para confirmar que a API está viva e evitar 404 na Vercel."""
    return jsonify({
        "status": "online",
        "service": "LabManager API",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/oee/upload', methods=['POST'])
def upload_oee():
    if not oee_service: return jsonify({"sucesso": False, "erro": "Módulo OEE indisponível"}), 503
    if 'file' not in request.files: return jsonify({"sucesso": False, "erro": "Arquivo não enviado"}), 400
    
    file = request.files['file']
    mes, ano = request.form.get('mes'), request.form.get('ano')
    if not mes or not ano: return jsonify({"sucesso": False, "erro": "Data base incompleta"}), 400

    path = os.path.join(OEE_UPLOAD_FOLDER, f"upload_{int(datetime.now().timestamp())}.xlsx")
    file.save(path)
    
    try:
        res = oee_service.processar_upload_oee(path, mes, ano)
    finally:
        if os.path.exists(path): os.remove(path)
        
    return jsonify(res)

@app.route('/api/oee/calculate', methods=['POST'])
def calculate_oee():
    if not oee_service: return jsonify({"erro": "Service Off"}), 503
    return jsonify(oee_service.calcular_indicadores_oee(request.json))

@app.route('/api/oee/update_circuit', methods=['POST'])
def update_oee_circuit():
    if not oee_service: return jsonify({"erro": "Service Off"}), 503
    data = request.json
    return jsonify(oee_service.atualizar_circuito(data.get('id'), data.get('action')))

@app.route('/api/oee/save_history', methods=['POST'])
def save_oee_history():
    if not oee_service: return jsonify({"erro": "Service Off"}), 503
    d = request.json
    return jsonify(oee_service.save_history(d.get('kpi'), d.get('mes'), d.get('ano')))

@app.route('/api/oee/history', methods=['GET'])
def get_oee_history():
    """Lista todos os fechamentos salvos no banco."""
    if oee_service: return jsonify(oee_service.listar_historico())
    return jsonify({"sucesso": False}), 500

@app.route('/api/oee/history/delete', methods=['POST'])
def delete_oee_record():
    """Remove um mês específico do histórico."""
    if not oee_service: return jsonify({"sucesso": False}), 503
    d = request.json
    return jsonify(oee_service.delete_history_record(d.get('mes'), d.get('ano')))

# ==============================================================================
# ROTAS API - LAB MANAGER (MONITORAMENTO)
# ==============================================================================

@app.route('/api/data', methods=['GET'])
def get_lab_data():
    db = load_db()
    atualizar_progresso_em_tempo_real(db)
    return jsonify(db)

@app.route('/api/import', methods=['POST'])
def import_digatron_text():
    text = request.json.get('text', '')
    if not text: return jsonify({'sucesso': False}), 400
    
    db = load_db()
    protocols = db.get('protocols', [])
    atualizados = []
    
    # Regex para pegar número do circuito e data de início
    matches = re.finditer(r"Circuit\s*0*(\d+).*?(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})", text, re.IGNORECASE)
    
    for m in matches:
        cid_num, t_start = m.group(1), m.group(2)
        end_of_line = text.find('\n', m.end())
        line = text[m.start():end_of_line if end_of_line != -1 else len(text)]
        
        # Padrão de bateria MOURA (ex: 12345-ABC)
        bat_match = re.search(r"(\d{5,}-[\w-]+)", line)
        bat_id = bat_match.group(1) if bat_match else "Desconhecido"
        
        protocol_name = identificar_nome_padrao(line, protocols)
        t_prev = calcular_previsao_fim(t_start, protocol_name, protocols)
        
        for bath in db['baths']:
            for c in bath['circuits']:
                if apenas_numeros(c['id']) == apenas_numeros(cid_num):
                    c.update({
                        'status': 'running',
                        'startTime': t_start,
                        'previsao': t_prev,
                        'batteryId': bat_id,
                        'protocol': protocol_name,
                        'progress': 0
                    })
                    atualizados.append(c['id'])
    
    save_db(db)
    return jsonify({"sucesso": True, "count": len(atualizados)})

@app.route('/api/baths/add', methods=['POST'])
def add_new_bath():
    d = request.json
    db = load_db()
    db['baths'].append({"id": d['bathId'], "temp": d.get('temp', 25), "circuits": []})
    db['baths'].sort(key=lambda x: x['id'])
    save_db(db)
    return jsonify(db)

@app.route('/api/baths/delete', methods=['POST'])
def delete_bath():
    d = request.json
    db = load_db()
    db['baths'] = [b for b in db['baths'] if b['id'] != d['bathId']]
    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/add', methods=['POST'])
def add_new_circuit():
    d = request.json
    db = load_db()
    cid = f"C-{d['circuitId']}" if not str(d['circuitId']).startswith("C-") else d['circuitId']
    for b in db['baths']:
        if b['id'] == d['bathId']:
            b['circuits'].append({"id": cid, "status": "free", "batteryId": None, "previsao": "-"})
            break
    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/status', methods=['POST'])
def update_circuit_status():
    d = request.json
    db = load_db()
    for b in db['baths']:
        if b['id'] == d['bathId']:
            for c in b['circuits']:
                if c['id'] == d['circuitId']:
                    if d['status'] == 'free':
                        c.update({
                            'status': 'free', 'batteryId': None, 'protocol': None, 
                            'previsao': '-', 'startTime': None, 'progress': 0
                        })
                    else:
                        c['status'] = d['status']
                    break
    save_db(db)
    return jsonify(db)

@app.route('/api/protocols/add', methods=['POST'])
def add_new_protocol():
    d = request.json
    db = load_db()
    name = str(d.get('name')).upper()
    db['protocols'].append({"id": name, "name": name, "duration": int(d['duration'])})
    save_db(db)
    return jsonify(db)

# ==============================================================================
# FRONTEND SERVER (PARA DEPLOY MONOLÍTICO)
# ==============================================================================

@app.route('/')
def index():
    if os.path.exists(os.path.join(DIST_DIR, 'index.html')):
        return send_from_directory(DIST_DIR, 'index.html')
    return "API Online. Frontend não localizado."

@app.route('/<path:path>')
def static_proxy(path):
    if os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

# ==============================================================================
# STARTUP
# ==============================================================================

if __name__ == '__main__':
    # Porta dinâmica para o Render
    port = int(os.environ.get("PORT", 5000))
    # use_reloader=False é vital para manter os dados no GLOBAL_DB do oee_service
    app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)