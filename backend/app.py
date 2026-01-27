from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import re
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

base_dir = os.path.dirname(os.path.abspath(__file__))
db_firestore = None

firebase_env = os.getenv("FIREBASE_CREDENTIALS")

try:
    if firebase_env:
        cred_dict = json.loads(firebase_env)
        cred = credentials.Certificate(cred_dict)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db_firestore = firestore.client()
        print("Firebase conectado via Variável de Ambiente.")
    else:
        cred_path = os.path.join(base_dir, 'firebase_credentials.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            db_firestore = firestore.client()
            print("Firebase conectado via Arquivo Local.")
        else:
            print("AVISO: Nenhuma credencial encontrada.")

except Exception as e:
    print(f"Erro ao conectar Firebase: {e}")

try:
    from backend import oee_service
except ImportError:
    try:
        import oee_service
    except ImportError:
        oee_service = None

DIST_DIR = os.path.join(base_dir, 'dist')
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(os.path.dirname(base_dir), 'dist')

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
CORS(app)

OEE_UPLOAD_FOLDER = os.path.join(base_dir, 'oee_uploads')
if not os.path.exists(OEE_UPLOAD_FOLDER):
    os.makedirs(OEE_UPLOAD_FOLDER, exist_ok=True)

def save_db(data):
    if not db_firestore:
        return
    try:
        db_firestore.collection('lab_data').document('main').set(data)
    except Exception as e:
        print(f"Erro ao salvar no Firebase: {e}")

def add_log(db, action, bath_id, details):
    new_log = {
        "id": int(datetime.now().timestamp() * 1000),
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "action": action,
        "bath": bath_id,
        "details": details
    }
    if 'logs' not in db: db['logs'] = []
    db['logs'].insert(0, new_log)
    db['logs'] = db['logs'][:200]

def load_db():
    empty_structure = {"baths": [], "protocols": [], "logs": []}
    if not db_firestore:
        return empty_structure
    try:
        doc = db_firestore.collection('lab_data').document('main').get()
        if doc.exists:
            data = doc.to_dict()
            if "protocols" not in data: data["protocols"] = []
            if "logs" not in data: data["logs"] = []
            if "baths" not in data: data["baths"] = []
            return data
        else:
            save_db(empty_structure)
            return empty_structure
    except Exception as e:
        return empty_structure

def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

def identificar_nome_padrao(linha_ou_nome, db_protocols=[]):
    texto_limpo = str(linha_ou_nome).upper().replace('_', '').replace('-', '').replace(' ', '')
    
    for p in db_protocols:
        nome_db = str(p['name']).upper().replace('_', '').replace('-', '').replace(' ', '')
        if nome_db and nome_db in texto_limpo:
            return p['name']

    if "SAE" in texto_limpo or "2801" in texto_limpo: return "SAE J2801"
    if "RRCR" in texto_limpo: return "RRCR"
    if "RC20" in texto_limpo: return "RC20"
    if "C20" in texto_limpo: return "C20"
    if "RC" in texto_limpo: return "RC"
    if "CCA" in texto_limpo: return "CCA"
    return "Desconhecido"

def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    duracao = 0
    for p in db_protocols:
        if p['name'].upper() == nome_protocolo.upper():
            duracao = p['duration']
            break
    if duracao == 0:
        if "SAE" in nome_protocolo or "2801" in nome_protocolo: duracao = 192
        elif "RC20" in nome_protocolo: duracao = 68
        elif "RRCR" in nome_protocolo: duracao = 48
        elif "C20" in nome_protocolo: duracao = 20
        elif "RC" in nome_protocolo: duracao = 5
        else: return "A calcular"

    try:
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except: return "-"

def atualizar_progresso_em_tempo_real(db):
    agora = datetime.now()
    alterado = False
    for bath in db['baths']:
        for circuit in bath['circuits']:
            status_atual = str(circuit.get('status', '')).lower().strip()
            if status_atual == 'running':
                try:
                    start_str = circuit.get('startTime')
                    end_str = circuit.get('previsao')
                    if start_str and end_str and end_str != '-' and end_str != 'A calcular':
                        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
                        dt_end = datetime.strptime(end_str, "%d/%m/%Y %H:%M")
                        total_seconds = (dt_end - dt_start).total_seconds()
                        elapsed_seconds = (agora - dt_start).total_seconds()
                        if total_seconds > 0: percent = (elapsed_seconds / total_seconds) * 100
                        else: percent = 100
                        if agora >= dt_end:
                            if status_atual != 'finished':
                                circuit['status'] = 'finished'
                                circuit['progress'] = 100
                                add_log(db, "Conclusão Auto", bath['id'], f"{circuit['id']} finalizado")
                                alterado = True
                        else:
                            new_prog = round(max(0, min(99, percent)), 1)
                            if circuit.get('progress') != new_prog:
                                circuit['progress'] = new_prog
                                alterado = True
                except: pass
            elif status_atual == 'finished':
                if circuit.get('progress') != 100:
                    circuit['progress'] = 100
                    alterado = True
    if alterado: save_db(db)

@app.route('/')
def serve_react():
    if os.path.exists(os.path.join(DIST_DIR, 'index.html')): return send_from_directory(DIST_DIR, 'index.html')
    return "Backend Ativo"

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(DIST_DIR, path)): return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    db = load_db()
    atualizar_progresso_em_tempo_real(db)
    return jsonify(db)

@app.route('/api/import', methods=['POST'])
def import_text():
    raw_text = request.json.get('text', '')
    db = load_db()
    protocols_list = db.get('protocols', [])
    atualizados = []
    if not raw_text: return jsonify({'error': 'Texto vazio'}), 400
    pattern = r"Circuit\s*0*(\d+).*?(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})"
    matches = re.finditer(pattern, raw_text, re.IGNORECASE)
    for match in matches:
        cid_num_str = match.group(1)
        start_dt = match.group(2)
        start_pos = match.start()
        end_pos = raw_text.find('\n', match.end())
        linha = raw_text[start_pos:end_pos] if end_pos != -1 else raw_text[start_pos:]
        id_bateria = "Desconhecido"
        bat_match = re.search(r"(\d{5,}-[\w-]+)", linha)
        if bat_match: id_bateria = bat_match.group(1)
        else:
            bat_match_short = re.search(r"\s([A-Z0-9]{3,6})\s", linha)
            if bat_match_short and "SAE" not in bat_match_short.group(1): id_bateria = bat_match_short.group(1)
        
        protocolo_limpo = identificar_nome_padrao(linha, protocols_list)
        previsao_calculada = calcular_previsao_fim(start_dt, protocolo_limpo, protocols_list)
        
        found = False
        for bath in db['baths']:
            for circuit in bath['circuits']:
                try:
                    db_id_num = apenas_numeros(circuit['id'])
                    if db_id_num and int(db_id_num) == int(cid_num_str):
                        circuit.update({
                            'status': 'running',
                            'startTime': start_dt,
                            'previsao': previsao_calculada,
                            'batteryId': id_bateria,
                            'protocol': protocolo_limpo,
                            'progress': 0
                        })
                        add_log(db, "Importação", bath['id'], f"Atualizado {circuit['id']}")
                        atualizados.append(circuit['id'])
                        found = True
                        break
                except: continue
            if found: break
    save_db(db)
    atualizar_progresso_em_tempo_real(db)
    return jsonify({"sucesso": True, "atualizados": atualizados, "db_atualizado": db})

@app.route('/api/oee/upload', methods=['POST'])
def upload_oee_excel():
    if 'file' not in request.files: return jsonify({"sucesso": False, "erro": "Sem arquivo"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"sucesso": False, "erro": "Nome vazio"}), 400
    if file:
        filename = f"oee_temp_{int(datetime.now().timestamp())}.xlsx"
        filepath = os.path.join(OEE_UPLOAD_FOLDER, filename)
        file.save(filepath)
        if oee_service:
            res = oee_service.processar_upload_oee(filepath)
            if res['sucesso']:
                res['filename'] = filename
                return jsonify(res)
            return jsonify(res), 400
        return jsonify({"sucesso": False, "erro": "OEE indisponível"}), 500

@app.route('/api/oee/calculate', methods=['POST'])
def calculate_oee_route():
    data = request.json
    filename = data.get('filename')
    filepath = os.path.join(OEE_UPLOAD_FOLDER, filename) if filename else ""
    if not filename or not os.path.exists(filepath): return jsonify({"sucesso": False, "erro": "Arquivo expirou"}), 404
    try:
        if oee_service: return jsonify(oee_service.calcular_indicadores_oee(filepath, data))
        return jsonify({"sucesso": False, "erro": "OEE indisponível"}), 500
    except Exception as e: return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/oee/history', methods=['GET'])
def get_oee_history():
    try: return jsonify(oee_service.ler_historico() if oee_service else [])
    except: return jsonify([])

@app.route('/api/oee/save_history', methods=['POST'])
def save_oee_history():
    data = request.json
    if oee_service: return jsonify({"sucesso": oee_service.salvar_historico(data.get('kpi'), data.get('mes'), data.get('ano'))})
    return jsonify({"sucesso": False, "erro": "Serviço indisponível"})

@app.route('/api/baths/add', methods=['POST'])
def add_bath():
    data = request.json; db = load_db()
    if any(b['id'] == data['bathId'] for b in db['baths']):
        return jsonify({'error': 'Banho já existe!'}), 400
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
    raw_id = str(data['circuitId'])
    cid = f"C-{raw_id}" if not raw_id.startswith("C-") else raw_id
    for b in db['baths']:
        if b['id'] == data['bathId']:
            if any(c['id'] == cid for c in b['circuits']): return jsonify({'error': 'Circuito já existe!'}), 400
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
                        c.update({
                            'status': 'free', 'batteryId': None, 'protocol': None,
                            'previsao': '-', 'startTime': None, 'progress': 0
                        })
                        add_log(db, "Liberação", b['id'], f"{c['id']} liberado")
                    else:
                        c['status'] = data['status']
                        if data['status'] == 'maintenance':
                            add_log(db, "Manutenção", b['id'], f"{c['id']} em manutenção")
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