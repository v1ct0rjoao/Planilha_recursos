from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import re
from datetime import datetime, timedelta

# --- CONFIGURAÇÃO DE DIRETÓRIOS ---
# Define onde o Flask vai procurar o "site" (pasta dist)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
# Tenta achar a pasta dist um nível acima se não estiver na raiz
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(os.path.dirname(BASE_DIR), 'dist')

# Configura o Flask para servir a pasta estática
app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
CORS(app)

BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'uploads')
DB_FILE = os.path.join(BACKEND_DIR, 'database.json')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(BACKEND_DIR, exist_ok=True)

# --- FUNÇÕES AUXILIARES ---

def load_db():
    if not os.path.exists(DB_FILE):
        default = {
            "baths": [
                {"id": "BANHO - 01", "temp": 25, "circuits": []},
                {"id": "BANHO - 06", "temp": 75, "circuits": []}
            ],
            "protocols": [
                {"id": "RC20", "name": "RC20", "duration": 68},
                {"id": "RRCR", "name": "RRCR", "duration": 48},
                {"id": "SAEJ2801", "name": "SAEJ2801", "duration": 192}
            ],
            "logs": []
        }
        save_db(default)
        return default
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if "protocols" not in data: data["protocols"] = []
            if "logs" not in data: data["logs"] = []
            if "baths" not in data: data["baths"] = []
            return data
    except Exception as e:
        return {"baths": [], "protocols": [], "logs": []}

def save_db(data):
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    except: pass

def add_log(db, action, bath_id, details):
    new_log = {
        "id": int(datetime.now().timestamp() * 1000),
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "action": action,
        "bath": bath_id,
        "details": details
    }
    db['logs'].insert(0, new_log)
    db['logs'] = db['logs'][:200]

def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

# --- INTELIGÊNCIA 1: RECONHECIMENTO DE NOME (CASCATA) ---
def identificar_nome_padrao(nome_digatron):
    """
    Identifica o teste priorizando nomes mais longos/específicos.
    Evita confundir RRCR com RC.
    """
    nome = str(nome_digatron).upper().replace('_', '').replace('-', '').replace(' ', '')
    
    # Nível 1: Testes Específicos (Prioridade Alta)
    if "SAE" in nome or "2801" in nome: return "SAE J2801"
    if "RRCR" in nome: return "RRCR"  # Verifica RRCR antes de RC
    if "RC20" in nome: return "RC20"
    
    # Nível 2: Testes Genéricos
    if "C20" in nome: return "C20"
    if "RC" in nome: return "RC"
    if "CCA" in nome: return "CCA"
    
    return nome_digatron[:12] # Retorna o original se não conhecer

# --- INTELIGÊNCIA 2: CÁLCULO DE PREVISÃO ---
def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    """
    Pega a data de início e soma a duração do protocolo cadastrado.
    """
    # 1. Acha a duração
    duracao = 0
    for p in db_protocols:
        if p['name'] == nome_protocolo:
            duracao = p['duration']
            break
            
    # 2. Valores de segurança se não achar no banco
    if duracao == 0:
        if "RC20" in nome_protocolo: duracao = 68
        elif "2801" in nome_protocolo: duracao = 192
        elif "RRCR" in nome_protocolo: duracao = 48
        else: return "A calcular"

    # 3. Cálculo Matemático
    try:
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except:
        return "-"

def verificar_conclusao_testes(db):
    agora = datetime.now()
    alterado = False
    for bath in db['baths']:
        for circuit in bath['circuits']:
            if str(circuit.get('status', '')).lower().strip() == 'running':
                try:
                    previsao_str = circuit.get('previsao', '-')
                    if previsao_str and previsao_str not in ['-', 'A calcular', '']:
                        fim_previsto = datetime.strptime(previsao_str, "%d/%m/%Y %H:%M")
                        if agora >= fim_previsto:
                            circuit['status'] = 'finished'
                            circuit['progress'] = 100
                            add_log(db, "Conclusão", bath['id'], f"Teste C-{circuit['id']} finalizado")
                            alterado = True
                except: pass
    if alterado: save_db(db)

# --- ROTAS SERVIDOR WEB ---

@app.route('/')
def serve_react():
    if os.path.exists(os.path.join(DIST_DIR, 'index.html')):
        return send_from_directory(DIST_DIR, 'index.html')
    return "<h1>LabManager Backend Online</h1><p>Frontend não encontrado na pasta dist.</p>"

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

# --- ROTAS API ---

@app.route('/api/data', methods=['GET'])
def get_data():
    db = load_db()
    verificar_conclusao_testes(db)
    return jsonify(db)

@app.route('/api/import', methods=['POST'])
def import_text():
    raw_text = request.json.get('text', '')
    db = load_db()
    atualizados = []
    
    if not raw_text: return jsonify({'error': 'Texto vazio'}), 400
    
    # Regex Relaxado: Pega Circuito + Data Início (Ignora resto da linha se falhar)
    pattern = r"Circuit(\d+)\s*(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})"
    matches = re.finditer(pattern, raw_text)

    for match in matches:
        cid_num = match.group(1)
        start_dt = match.group(2)
        
        # Pega a linha completa para achar o nome do teste
        start_pos = match.start()
        end_pos = raw_text.find('\n', match.end())
        linha = raw_text[start_pos:end_pos] if end_pos != -1 else raw_text[start_pos:]
        
        # 1. Identifica Bateria
        id_bateria = "Desconhecido"
        bat_match = re.search(r"(\d{5,}-[\w-]+)", linha)
        if bat_match: id_bateria = bat_match.group(1)
        
        # 2. Identifica Nome do Teste (Com a nova função inteligente)
        match_nome = re.search(r"Program:\s*([A-Za-z0-9_-]+)", linha)
        nome_bruto = match_nome.group(1) if match_nome else "Desconhecido"
        
        protocolo_limpo = identificar_nome_padrao(nome_bruto)

        # 3. Calcula Previsão (Data Início + Duração do Protocolo)
        previsao_calculada = calcular_previsao_fim(start_dt, protocolo_limpo, db.get('protocols', []))

        # 4. Atualiza no Banco
        for bath in db['baths']:
            for circuit in bath['circuits']:
                if apenas_numeros(circuit['id']) == apenas_numeros(cid_num):
                    circuit.update({
                        'status': 'running',
                        'startTime': start_dt,
                        'previsao': previsao_calculada,
                        'batteryId': id_bateria,
                        'protocol': protocolo_limpo,
                        'progress': 10
                    })
                    add_log(db, "Teste", bath['id'], f"Início {circuit['id']} ({protocolo_limpo})")
                    atualizados.append(circuit['id'])
                    break
                    
    save_db(db)
    return jsonify({"sucesso": True, "atualizados": atualizados, "db_atualizado": db})

# --- CRUD BÁSICO (Banhos, Circuitos, Protocolos) ---

@app.route('/api/baths/add', methods=['POST'])
def add_bath():
    data = request.json; db = load_db()
    if any(b['id'] == data['bathId'] for b in db['baths']): return jsonify({'error': 'Existe!'}), 400
    db['baths'].append({"id": data['bathId'], "temp": data.get('temp', 25), "circuits": []})
    db['baths'].sort(key=lambda x: x['id'])
    save_db(db); return jsonify(db)

@app.route('/api/baths/delete', methods=['POST'])
def delete_bath():
    data = request.json; db = load_db()
    db['baths'] = [b for b in db['baths'] if b['id'] != data['bathId']]
    save_db(db); return jsonify(db)

@app.route('/api/baths/temp', methods=['POST'])
def update_temp():
    data = request.json; db = load_db()
    for b in db['baths']: 
        if b['id'] == data['bathId']: b['temp'] = data['temp']; break
    save_db(db); return jsonify(db)

@app.route('/api/circuits/add', methods=['POST'])
def add_circuit():
    data = request.json; db = load_db()
    cid = f"C-{data['circuitId']}" if not str(data['circuitId']).startswith("C-") else data['circuitId']
    for b in db['baths']:
        if b['id'] == data['bathId']:
            if any(c['id'] == cid for c in b['circuits']): return jsonify({'error': 'Existe!'}), 400
            b['circuits'].append({"id": cid, "status": "free", "batteryId": None, "previsao": "-"})
            try: b['circuits'].sort(key=lambda x: int(apenas_numeros(x['id'])) if apenas_numeros(x['id']) else 999)
            except: pass
            break
    save_db(db); return jsonify(db)

@app.route('/api/circuits/delete', methods=['POST'])
def delete_circuit():
    data = request.json; db = load_db()
    for b in db['baths']:
        if b['id'] == data['bathId']:
            b['circuits'] = [c for c in b['circuits'] if c['id'] != data['circuitId']]
            break
    save_db(db); return jsonify(db)

@app.route('/api/circuits/status', methods=['POST'])
def update_circuit_status():
    data = request.json; db = load_db()
    for b in db['baths']:
        if b['id'] == data['bathId']:
            for c in b['circuits']:
                if c['id'] == data['circuitId']:
                    if data['status'] == 'free': 
                        c.update({'status': 'free', 'batteryId': None, 'protocol': None, 'previsao': '-'})
                    else: 
                        c['status'] = data['status']
                    break
    save_db(db); return jsonify(db)

@app.route('/api/protocols/add', methods=['POST'])
def add_protocol():
    data = request.json; db = load_db()
    name = str(data.get('name')).upper()
    db['protocols'] = [p for p in db['protocols'] if p['id'] != name]
    db['protocols'].append({"id": name, "name": name, "duration": int(data['duration'])})
    save_db(db); return jsonify(db)

@app.route('/api/protocols/delete', methods=['POST'])
def delete_protocol():
    data = request.json; db = load_db()
    db['protocols'] = [p for p in db['protocols'] if p['id'] != data['id']]
    save_db(db); return jsonify(db)

if __name__ == '__main__':
    app.run(debug=True, port=5000)