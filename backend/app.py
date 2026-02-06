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

# Fallback para estrutura de pastas onde dist está na raiz do projeto
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(os.path.dirname(base_dir), 'dist')

# Garante existência da pasta temporária para uploads
if not os.path.exists(OEE_UPLOAD_FOLDER):
    os.makedirs(OEE_UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
CORS(app)

# ==============================================================================
# 2. INICIALIZAÇÃO DE SERVIÇOS EXTERNOS (FIREBASE)
# ==============================================================================

db_firestore = None
DATA_CACHE = None # Cache em memória para o Lab Manager (Banhos)

# Tenta carregar credenciais via Variável de Ambiente (Prod) ou Arquivo Local (Dev)
firebase_env = os.getenv("FIREBASE_CREDENTIALS")

try:
    cred = None
    if firebase_env:
        cred_dict = json.loads(firebase_env)
        cred = credentials.Certificate(cred_dict)
    else:
        # Busca por arquivos de chave padrão
        possible_keys = ['serviceAccountKey.json', 'firebase_credentials.json']
        for key_file in possible_keys:
            key_path = os.path.join(base_dir, key_file)
            if os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
                break

    if cred:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db_firestore = firestore.client()
        print("[INFO] Firebase conectado com sucesso.")
    else:
        print("[WARN] Credenciais não encontradas. O sistema rodará sem persistência de histórico.")

except Exception as e:
    print(f"[CRITICAL] Falha na conexão com Firebase: {e}")

# ==============================================================================
# 3. INTEGRAÇÃO COM MÓDULO OEE
# ==============================================================================

oee_service = None
try:
    from backend import oee_service
except ImportError:
    try:
        import oee_service
    except ImportError:
        print("[WARN] Módulo 'oee_service' não encontrado. Funcionalidades de OEE indisponíveis.")

@app.errorhandler(Exception)
def handle_exception(e):
    """Handler global para exceções não tratadas."""
    traceback.print_exc()
    return jsonify({"sucesso": False, "erro": f"Erro interno: {str(e)}"}), 500

# ==============================================================================
# 4. HELPERS E LÓGICA DE NEGÓCIO (LABORATÓRIO)
# ==============================================================================

def save_db(data):
    """Persiste o estado atual dos banhos no Firestore (Coleção Main)."""
    global DATA_CACHE
    DATA_CACHE = data
    if not db_firestore: return
    try:
        db_firestore.collection('lab_data').document('main').set(data)
    except Exception as e:
        print(f"[ERROR] Falha ao salvar DB: {e}")

def load_db():
    """Carrega o estado atual. Prioriza Cache, depois Firebase, depois Estrutura Vazia."""
    global DATA_CACHE
    if DATA_CACHE is not None: return DATA_CACHE
    
    empty_structure = {"baths": [], "protocols": [], "logs": []}
    
    if not db_firestore: return empty_structure
    
    try:
        doc = db_firestore.collection('lab_data').document('main').get()
        if doc.exists:
            data = doc.to_dict()
            # Garante integridade da estrutura
            for key in empty_structure:
                if key not in data: data[key] = []
            DATA_CACHE = data
            return data
        else:
            save_db(empty_structure)
            return empty_structure
    except Exception:
        return empty_structure

def add_log(db, action, bath_id, details):
    """Registra eventos operacionais para auditoria."""
    new_log = {
        "id": int(datetime.now().timestamp() * 1000) + random.randint(1, 9999),
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "action": action,
        "bath": bath_id,
        "details": details
    }
    if 'logs' not in db: db['logs'] = []
    db['logs'].insert(0, new_log)
    db['logs'] = db['logs'][:200] # Limita histórico de logs operacionais

def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

def identificar_nome_padrao(linha, db_protocols=[]):
    """Tenta identificar o protocolo de teste baseado no texto do Digatron."""
    texto_limpo = str(linha).upper().replace('_', '').replace('-', '').replace(' ', '')
    for p in db_protocols:
        nome_db = str(p['name']).upper().replace('_', '').replace('-', '').replace(' ', '')
        if nome_db and nome_db in texto_limpo:
            return p['name']
    try:
        parts = str(linha).split('_')
        if len(parts) > 1 and len(parts[-1].strip()) > 2:
            return parts[-1].strip()
    except: pass
    return "Desconhecido"

def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    """Calcula data prevista de fim com base na duração do protocolo cadastrado."""
    duracao = next((p['duration'] for p in db_protocols if p['name'].upper() in nome_protocolo.upper()), 0)
    if duracao == 0: return "A calcular"
    try:
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except: return "-"

def atualizar_progresso_em_tempo_real(db):
    """Atualiza % de progresso e finaliza testes automaticamente se o tempo expirou."""
    global DATA_CACHE
    # Utiliza UTC c/ offset manual para evitar DeprecationWarning do Python 3.12
    agora_pe = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)
    save_needed = False
    
    for bath in db.get('baths', []):
        for circuit in bath.get('circuits', []):
            if circuit.get('status') == 'running':
                try:
                    dt_start = datetime.strptime(circuit.get('startTime'), "%d/%m/%Y %H:%M")
                    dt_end = datetime.strptime(circuit.get('previsao'), "%d/%m/%Y %H:%M")
                    
                    total = (dt_end - dt_start).total_seconds()
                    elapsed = (agora_pe - dt_start).total_seconds()
                    
                    if agora_pe >= dt_end:
                        # Teste finalizado pelo tempo
                        circuit.update({'status': 'finished', 'progress': 100})
                        add_log(db, "Conclusão Auto", bath['id'], f"{circuit['id']} finalizado")
                        save_needed = True
                    else:
                        percent = (elapsed / total) * 100 if total > 0 else 0
                        new_prog = round(max(0, min(99, percent)), 1)
                        if circuit.get('progress') != new_prog:
                            circuit['progress'] = new_prog
                            DATA_CACHE = db # Atualiza apenas RAM para não saturar escritas
                except: pass
            
            # Correção de consistência
            elif circuit.get('status') == 'finished' and circuit.get('progress') != 100:
                circuit['progress'] = 100
                save_needed = True

    if save_needed: save_db(db)

# ==============================================================================
# 5. ROTAS (ENDPOINTS) - ESTÁTICOS
# ==============================================================================

@app.route('/')
def serve_react():
    if os.path.exists(os.path.join(DIST_DIR, 'index.html')):
        return send_from_directory(DIST_DIR, 'index.html')
    return "Backend LabManager Ativo."

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

# ==============================================================================
# 6. ROTAS DA API - MÓDULO OEE
# ==============================================================================

@app.route('/api/oee/upload', methods=['POST'])
def upload_oee():
    """Recebe planilha e carrega processamento na memória RAM."""
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE offline"}), 503
    if 'file' not in request.files: return jsonify({"sucesso": False, "erro": "Arquivo ausente"}), 400
    
    file = request.files['file']
    mes = request.form.get('mes')
    ano = request.form.get('ano')
    
    if not mes or not ano: return jsonify({"sucesso": False, "erro": "Data inválida"}), 400

    temp_path = os.path.join(OEE_UPLOAD_FOLDER, f"temp_{int(datetime.now().timestamp())}.xlsx")
    file.save(temp_path)
    
    try:
        # Processamento Volátil (RAM)
        resultado = oee_service.processar_upload_oee(temp_path, mes, ano)
    finally:
        if os.path.exists(temp_path): os.remove(temp_path)
        
    return jsonify(resultado)

@app.route('/api/oee/calculate', methods=['POST'])
def calculate_oee():
    """Recalcula indicadores com base nos dados em memória."""
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE offline"}), 503
    return jsonify(oee_service.calcular_indicadores_oee(request.json))

@app.route('/api/oee/update_circuit', methods=['POST'])
def update_oee_circuit():
    """Aplica regra manual (EXT, STD, UP) a um circuito na memória."""
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE offline"}), 503
    data = request.json
    return jsonify(oee_service.atualizar_circuito(data.get('id'), data.get('action')))

@app.route('/api/oee/save_history', methods=['POST'])
def save_oee_history():
    """Persiste o estado atual da memória para o Firebase (Histórico)."""
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE offline"}), 503
    data = request.json
    return jsonify(oee_service.save_history(data.get('kpi'), data.get('mes'), data.get('ano')))

@app.route('/api/oee/history', methods=['GET'])
def get_oee_history():
    """Lista fechamentos mensais salvos."""
    if oee_service: return jsonify(oee_service.listar_historico())
    
    # Fallback caso service falhe (tenta ler direto se possível)
    if not db_firestore: return jsonify({"sucesso": False, "erro": "Banco desconectado"}), 500
    try:
        docs = db_firestore.collection('lab_data').document('history').collection('oee_monthly').stream()
        historico = [doc.to_dict() for doc in docs]
        return jsonify({"sucesso": True, "historico": historico})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/oee/history/delete', methods=['POST'])
def delete_oee_history():
    """Remove um fechamento mensal do histórico."""
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço offline"}), 503
    data = request.json
    return jsonify(oee_service.delete_history_record(data.get('mes'), data.get('ano')))

# ==============================================================================
# 7. ROTAS DA API - MÓDULO MONITORAMENTO (BANHOS)
# ==============================================================================

@app.route('/api/data', methods=['GET'])
def get_data():
    """Retorna estado completo dos banhos e circuitos."""
    db = load_db()
    atualizar_progresso_em_tempo_real(db)
    return jsonify(db)

@app.route('/api/import', methods=['POST'])
def import_text():
    """Parser de texto do Digatron."""
    text = request.json.get('text', '')
    if not text: return jsonify({'sucesso': False}), 400
    
    db = load_db()
    protocols = db.get('protocols', [])
    updated = []
    
    matches = re.finditer(r"Circuit\s*0*(\d+).*?(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})", text, re.IGNORECASE)
    
    for m in matches:
        cid_num, start_str = m.group(1), m.group(2)
        line = text[m.start():text.find('\n', m.end())]
        
        bat_id = "Desconhecido"
        bat_match = re.search(r"(\d{5,}-[\w-]+)", line)
        if bat_match: bat_id = bat_match.group(1)
        
        proto_name = identificar_nome_padrao(line, protocols)
        prev_str = calcular_previsao_fim(start_str, proto_name, protocols)
        
        for bath in db['baths']:
            for c in bath['circuits']:
                if apenas_numeros(c['id']) == apenas_numeros(cid_num):
                    c.update({
                        'status': 'running',
                        'startTime': start_str,
                        'previsao': prev_str,
                        'batteryId': bat_id,
                        'protocol': proto_name,
                        'progress': 0
                    })
                    updated.append(c['id'])
    
    save_db(db)
    return jsonify({"sucesso": True, "atualizados": updated})

@app.route('/api/baths/add', methods=['POST'])
def add_bath():
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
def add_circuit():
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
def update_status():
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
def add_protocol():
    d = request.json
    db = load_db()
    name = str(d.get('name')).upper()
    db['protocols'].append({"id": name, "name": name, "duration": int(d['duration'])})
    save_db(db)
    return jsonify(db)


if __name__ == '__main__':
 
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)