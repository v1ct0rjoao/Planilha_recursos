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
# 1. CONFIGURAÇÃO DE AMBIENTE E DIRETÓRIOS
# ==============================================================================

base_dir = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(base_dir, 'dist')
OEE_UPLOAD_FOLDER = os.path.join(base_dir, 'oee_uploads')

# Garante que a pasta dist é localizada corretamente para servir o frontend
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(os.path.dirname(base_dir), 'dist')

# Garante a existência da pasta para processamento temporário de ficheiros Excel
if not os.path.exists(OEE_UPLOAD_FOLDER):
    os.makedirs(OEE_UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')

# CORS Reforçado: Essencial para evitar erros de ligação entre domínios (Vercel -> Render)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# ==============================================================================
# 2. INICIALIZAÇÃO DO FIREBASE (FIRESTORE)
# ==============================================================================

db_firestore = None
DATA_CACHE = None # Cache em memória para resposta instantânea e economia de cota

firebase_env = os.getenv("FIREBASE_CREDENTIALS")

try:
    cred = None
    if firebase_env:
        # Modo Produção: Credenciais via variável de ambiente
        cred_dict = json.loads(firebase_env)
        cred = credentials.Certificate(cred_dict)
    else:
        # Modo Desenvolvimento: Procura ficheiros de chave locais
        possible_keys = ['firebase_credentials.json', 'serviceAccountKey.json']
        for key_file in possible_keys:
            key_path = os.path.join(base_dir, key_file)
            if os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
                break

    if cred:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db_firestore = firestore.client()
        print("[INFO] Ligação ao Firebase estabelecida.")
    else:
        print("[WARN] Credenciais não encontradas. O sistema rodará apenas em memória RAM.")

except Exception as e:
    print(f"[ERROR] Falha na ligação ao Firebase: {e}")

# ==============================================================================
# 3. IMPORTAÇÃO DO MÓDULO OEE
# ==============================================================================

oee_service = None
try:
    try:
        from backend import oee_service
    except ImportError:
        import oee_service
except ImportError:
    print("[WARN] Módulo 'oee_service' não encontrado.")

@app.errorhandler(Exception)
def handle_exception(e):
    """Captura e reporta erros globais para evitar queda do serviço."""
    traceback.print_exc()
    return jsonify({"sucesso": False, "erro": str(e)}), 500

# ==============================================================================
# 4. LÓGICA DE NEGÓCIO E PERSISTÊNCIA (MONITORIZAÇÃO)
# ==============================================================================

def save_db(data):
    """Persiste o estado atual no Firestore e atualiza o cache local."""
    global DATA_CACHE
    DATA_CACHE = data
    if not db_firestore: return True
    try:
        db_firestore.collection('lab_data').document('main').set(data)
        return True
    except Exception as e:
        print(f"Erro ao guardar no Firebase: {e}")
        return False

def load_db():
    """Carrega o estado do laboratório (Prioridade: Cache > Firebase)."""
    global DATA_CACHE
    if DATA_CACHE is not None: return DATA_CACHE
    
    empty_schema = {"baths": [], "protocols": [], "logs": []}
    if not db_firestore: return empty_schema
    
    try:
        doc = db_firestore.collection('lab_data').document('main').get()
        if doc.exists:
            data = doc.to_dict()
            for key in empty_schema:
                if key not in data: data[key] = []
            DATA_CACHE = data
            return data
        return empty_schema
    except:
        return empty_schema

def apenas_numeros(texto):
    """Extrai apenas algarismos para comparação robusta de IDs."""
    return re.sub(r'\D', '', str(texto))

def identificar_nome_padrao(linha, db_protocols=[]):
    """Tenta associar o texto do Digatron a um protocolo registado no sistema."""
    texto_limpo = str(linha).upper().replace('_', '').replace('-', '').replace(' ', '')
    for p in db_protocols:
        nome_db = str(p['name']).upper().replace('_', '').replace('-', '').replace(' ', '')
        if nome_db and nome_db in texto_limpo:
            return p['name']
    return "Desconhecido"

def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    """Calcula a data final estimada com base na duração do protocolo."""
    duracao = next((p['duration'] for p in db_protocols if p['name'].upper() in nome_protocolo.upper()), 0)
    if duracao == 0: return "A calcular"
    try:
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except: return "-"

def atualizar_progresso_realtime(db):
    """Calcula percentagem de conclusão e encerra testes expirados."""
    global DATA_CACHE
    # Offset de 3 horas para fuso horário de Brasília
    agora = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)
    mudou = False
    
    for bath in db.get('baths', []):
        for c in bath.get('circuits', []):
            if c.get('status') == 'running':
                try:
                    ini = datetime.strptime(c.get('startTime'), "%d/%m/%Y %H:%M")
                    fim = datetime.strptime(c.get('previsao'), "%d/%m/%Y %H:%M")
                    total = (fim - ini).total_seconds()
                    passado = (agora - ini).total_seconds()
                    
                    if agora >= fim:
                        c.update({'status': 'finished', 'progress': 100})
                        mudou = True
                    else:
                        percent = round(max(0, min(99.9, (passado / total) * 100)), 1)
                        c['progress'] = percent
                        DATA_CACHE = db 
                except: pass
            elif c.get('status') == 'finished' and c.get('progress') != 100:
                c['progress'] = 100
                mudou = True

    if mudou: save_db(db)

# ==============================================================================
# 5. ROTAS DA API
# ==============================================================================

@app.route('/api', methods=['GET'])
def api_ping():
    """Validação de vitalidade da API para evitar erros 404."""
    return jsonify({"status": "online", "message": "LabManager API v2.0"})

@app.route('/api/data', methods=['GET'])
def get_main_data():
    """Retorna o estado completo de todos os banhos e circuitos."""
    db = load_db()
    atualizar_progresso_realtime(db)
    return jsonify(db)

@app.route('/api/import', methods=['POST', 'OPTIONS'])
def import_digatron_data():
    """Processa texto copiado do software Digatron e atualiza os circuitos em lote."""
    if request.method == 'OPTIONS': return '', 200
    try:
        data = request.json
        text = data.get('text', '')
        if not text: return jsonify({'sucesso': False, 'erro': 'Texto vazio'}), 400
        
        db = load_db()
        protocols = db.get('protocols', [])
        atualizados = []
        
        matches = re.finditer(r"Circuit\s*0*(\d+).*?(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})", text, re.IGNORECASE)
        
        for m in matches:
            cid_num, t_start = m.group(1), m.group(2)
            end_line = text.find('\n', m.end())
            line = text[m.start():end_line if end_line != -1 else len(text)]
            
            bat_match = re.search(r"(\d{5,}-[\w-]+)", line)
            bat_id = bat_match.group(1) if bat_match else "Desconhecido"
            
            proto_name = identificar_nome_padrao(line, protocols)
            t_prev = calcular_previsao_fim(t_start, proto_name, protocols)
            
            for bath in db['baths']:
                for c in bath['circuits']:
                    if apenas_numeros(c['id']) == apenas_numeros(cid_num):
                        c.update({
                            'status': 'running', 'startTime': t_start, 'previsao': t_prev,
                            'batteryId': bat_id, 'protocol': proto_name, 'progress': 0
                        })
                        atualizados.append(c['id'])
        
        save_db(db)
        return jsonify({"sucesso": True, "atualizados": atualizados, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/circuits/status', methods=['POST'])
def update_circuit_status():
    """Atualiza manualmente o estado de um circuito específico."""
    try:
        d = request.json
        db = load_db()
        target_bath = d.get('bathId')
        target_circuit = str(d.get('circuitId'))
        new_status = d.get('status')

        for b in db.get('baths', []):
            if str(b['id']) == str(target_bath):
                for c in b.get('circuits', []):
                    if apenas_numeros(c['id']) == apenas_numeros(target_circuit):
                        if new_status == 'free':
                            c.update({
                                'status': 'free', 'batteryId': None, 'protocol': None, 
                                'previsao': '-', 'startTime': None, 'progress': 0
                            })
                        else:
                            c['status'] = new_status
                        break
        
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# --- Rotas do Módulo OEE ---
@app.route('/api/oee/upload', methods=['POST'])
def oee_upload():
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"}), 503
    f = request.files['file']
    mes, ano = request.form.get('mes'), request.form.get('ano')
    path = os.path.join(OEE_UPLOAD_FOLDER, f"up_{int(datetime.now().timestamp())}.xlsx")
    f.save(path)
    try: res = oee_service.processar_upload_oee(path, mes, ano)
    finally: 
        if os.path.exists(path): os.remove(path)
    return jsonify(res)

@app.route('/api/oee/calculate', methods=['POST'])
def oee_calculate():
    return jsonify(oee_service.calcular_indicadores_oee(request.json))

@app.route('/api/oee/update_circuit', methods=['POST'])
def oee_update_ckt():
    d = request.json
    return jsonify(oee_service.atualizar_circuito(d.get('id'), d.get('action')))

@app.route('/api/oee/save_history', methods=['POST'])
def oee_save():
    d = request.json
    return jsonify(oee_service.save_history(d.get('kpi'), d.get('mes'), d.get('ano')))

@app.route('/api/oee/history', methods=['GET'])
def oee_history_list():
    return jsonify(oee_service.listar_historico())

@app.route('/api/oee/history/delete', methods=['POST'])
def oee_history_delete():
    d = request.json
    return jsonify(oee_service.delete_history_record(d.get('mes'), d.get('ano')))

# --- Rotas de Gestão de Estrutura ---
@app.route('/api/baths/add', methods=['POST'])
def bath_add():
    d = request.json
    db = load_db()
    db['baths'].append({"id": d['bathId'], "temp": d.get('temp', 25), "circuits": []})
    db['baths'].sort(key=lambda x: x['id'])
    save_db(db)
    return jsonify(db)

@app.route('/api/baths/delete', methods=['POST'])
def bath_delete():
    d = request.json
    db = load_db()
    db['baths'] = [b for b in db['baths'] if str(b['id']) != str(d['bathId'])]
    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/add', methods=['POST'])
def circuit_add():
    d = request.json
    db = load_db()
    cid = f"C-{d['circuitId']}" if not str(d['circuitId']).startswith("C-") else d['circuitId']
    for b in db['baths']:
        if str(b['id']) == str(d['bathId']):
            b['circuits'].append({"id": cid, "status": "free", "batteryId": None, "previsao": "-"})
            break
    save_db(db)
    return jsonify(db)

@app.route('/api/protocols/add', methods=['POST'])
def protocol_add():
    d = request.json
    db = load_db()
    name = str(d.get('name')).upper()
    db['protocols'].append({"id": name, "name": name, "duration": int(d['duration'])})
    save_db(db)
    return jsonify(db)

# ==============================================================================
# 6. SERVIÇO DE FICHEIROS ESTÁTICOS (DEPLOY MONOLÍTICO)
# ==============================================================================

@app.route('/')
def serve_index():
    return send_from_directory(DIST_DIR, 'index.html') if os.path.exists(os.path.join(DIST_DIR, 'index.html')) else "API Ativa"

@app.route('/<path:path>')
def serve_assets(path):
    if os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

# ==============================================================================
# 7. INICIALIZAÇÃO DO SERVIDOR
# ==============================================================================

if __name__ == '__main__':
    # Configuração necessária para o Render (atribuição dinâmica de porta)
    port = int(os.environ.get("PORT", 5000))
    # use_reloader=False é vital para manter os dados no cache RAM GLOBAL_DB
    app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)