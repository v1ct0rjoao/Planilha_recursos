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

base_dir = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(base_dir, 'dist') 
OEE_UPLOAD_FOLDER = os.path.join(base_dir, 'oee_uploads') 

if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(os.path.dirname(base_dir), 'dist')

if not os.path.exists(OEE_UPLOAD_FOLDER):
    os.makedirs(OEE_UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')

CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

db_firestore = None
DATA_CACHE = None 

firebase_env = os.getenv("FIREBASE_CREDENTIALS")

try:
    cred = None
    if firebase_env:
        cred_dict = json.loads(firebase_env)
        cred = credentials.Certificate(cred_dict)
    else:
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
        print("[WARN] Credenciais não encontradas. O sistema rodará em RAM.")

except Exception as e:
    print(f"[ERROR] Falha na ligação ao Firebase: {e}")

oee_service = None
try:
    try:
        from backend import oee_service
    except ImportError:
        import oee_service
except ImportError:
    pass

@app.errorhandler(Exception)
def handle_exception(e):
    traceback.print_exc()
    return jsonify({"sucesso": False, "erro": str(e)}), 500

def save_db(data):
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
    global DATA_CACHE
    if DATA_CACHE is not None: return DATA_CACHE
    
    empty_schema = {"baths": [], "protocols": [], "logs": []}
    if not db_firestore: return empty_schema
    
    try:
        doc = db_firestore.collection('lab_data').document('main').get()
        if doc.exists:
            data = doc.to_dict()
            for key in empty_schema:
                if key not in data or data[key] is None: 
                    data[key] = []
            DATA_CACHE = data
            return data
        return empty_schema
    except:
        return empty_schema

def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

def identificar_nome_padrao(linha, db_protocols=[]):
    texto_limpo = str(linha).upper().replace('_', '').replace('-', '').replace(' ', '')
    protocolos_ordenados = sorted(db_protocols, key=lambda p: len(p['name']), reverse=True)
    
    for p in protocolos_ordenados:
        nome_db = str(p['name']).upper().replace('_', '').replace('-', '').replace(' ', '')
        if nome_db and nome_db in texto_limpo:
            return p['name']
    return "Desconhecido"

def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    protocolos_ordenados = sorted(db_protocols, key=lambda p: len(p['name']), reverse=True)
    duracao = 0
    for p in protocolos_ordenados:
        if p['name'].upper() in nome_protocolo.upper():
            duracao = p['duration']
            break
            
    if duracao == 0: return "A calcular"
    try:
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except: return "-"

def atualizar_progresso_realtime(db):
    global DATA_CACHE
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

@app.route('/api', methods=['GET'])
def api_ping():
    return jsonify({"status": "online", "message": "LabManager API v2.2"})

@app.route('/api/data', methods=['GET'])
def get_main_data():
    db = load_db()
    atualizar_progresso_realtime(db)
    return jsonify(db)

@app.route('/api/import', methods=['POST', 'OPTIONS'])
def import_digatron_data():
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

@app.route('/api/baths/add', methods=['POST'])
def bath_add():
    d = request.json
    db = load_db()
    db['baths'].append({"id": d['bathId'], "temp": d.get('temp', 25), "circuits": []})
    db['baths'].sort(key=lambda x: x['id'])
    save_db(db)
    return jsonify({"sucesso": True, "db_atualizado": db})

@app.route('/api/baths/delete', methods=['POST'])
def bath_delete():
    d = request.json
    db = load_db()
    db['baths'] = [b for b in db['baths'] if str(b['id']) != str(d['bathId'])]
    save_db(db)
    return jsonify({"sucesso": True, "db_atualizado": db})

@app.route('/api/baths/rename', methods=['POST'])
def bath_rename():
    try:
        d = request.json
        db = load_db()
        old_id = str(d['oldId'])
        new_id = str(d['newId'])
        found = False
        for b in db['baths']:
            if str(b['id']) == old_id:
                b['id'] = new_id
                found = True
                break
        if found:
            save_db(db)
            return jsonify({"sucesso": True, "db_atualizado": db})
        return jsonify({"sucesso": False, "erro": "Banho não encontrado"}), 404
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/baths/temp', methods=['POST'])
def bath_update_temp():
    try:
        d = request.json
        db = load_db()
        bath_id = str(d['bathId'])
        new_temp = d['temp']
        for b in db['baths']:
            if str(b['id']) == bath_id:
                b['temp'] = new_temp
                break
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

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
    return jsonify({"sucesso": True, "db_atualizado": db})

@app.route('/api/circuits/delete', methods=['POST'])
def circuit_delete():
    try:
        d = request.json
        db = load_db()
        bath_id = str(d['bathId'])
        circuit_id = str(d['circuitId'])
        ckt_clean = apenas_numeros(circuit_id)
        
        for b in db['baths']:
            if str(b['id']) == bath_id:
                b['circuits'] = [c for c in b['circuits'] if apenas_numeros(c['id']) != ckt_clean]
                break
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/circuits/status', methods=['POST'])
def update_circuit_status():
    try:
        d = request.json
        db = load_db()
        target_bath = str(d.get('bathId'))
        target_circuit = str(d.get('circuitId'))
        new_status = str(d.get('status')).lower() 
        
        if new_status == 'true': new_status = 'maintenance'
        if new_status == 'false': new_status = 'free'

        for b in db.get('baths', []):
            if str(b['id']) == target_bath:
                for c in b.get('circuits', []):
                    if int(apenas_numeros(c['id'])) == int(apenas_numeros(target_circuit)):
                        if new_status == 'free':
                            c.update({
                                'status': 'free', 'batteryId': None, 'protocol': None, 
                                'previsao': '-', 'startTime': None, 'progress': 0, 'isParallel': False
                            })
                        else:
                            c['status'] = new_status
                        break
        
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/circuits/move', methods=['POST'])
def circuit_move():
    try:
        d = request.json
        db = load_db()
        src_bath_id = str(d['sourceBathId'])
        tgt_bath_id = str(d['targetBathId'])
        circuit_id = str(d['circuitId'])
        
        circuit_obj = None
        
        try:
            ckt_num = int(apenas_numeros(circuit_id))
        except:
            ckt_num = -1

        found_idx = -1
        src_bath_ref = None
        
        for b in db['baths']:
            if str(b['id']) == src_bath_id:
                src_bath_ref = b
                for idx, c in enumerate(b['circuits']):
                    c_num = int(apenas_numeros(c['id'])) if apenas_numeros(c['id']) else -2
                    if c['id'] == circuit_id or c_num == ckt_num:
                        circuit_obj = c
                        found_idx = idx
                        break
                if found_idx != -1:
                    b['circuits'].pop(found_idx)
                    break
        
        if not circuit_obj:
             return jsonify({"sucesso": False, "erro": "Circuito não encontrado na origem"}), 404

        target_found = False
        for b in db['baths']:
            if str(b['id']) == tgt_bath_id:
                ids_existentes = [x['id'] for x in b['circuits']]
                if circuit_obj['id'] in ids_existentes:
                     circuit_obj['id'] = f"{circuit_obj['id']}_mov"
                
                b['circuits'].append(circuit_obj)
                b['circuits'].sort(key=lambda x: int(apenas_numeros(x['id'])) if apenas_numeros(x['id']) else 999)
                target_found = True
                break
            
        if not target_found and src_bath_ref:
            src_bath_ref['circuits'].append(circuit_obj)
            return jsonify({"sucesso": False, "erro": "Banho de destino não encontrado"}), 404

        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500
    
@app.route('/api/circuits/link', methods=['POST'])
def circuit_link():
    try:
        d = request.json
        db = load_db()
        bath_id = str(d['bathId'])
        source_id = str(d['sourceId'])
        target_id = str(d['targetId'])
        
        source_circuit = None
        target_circuit = None

        for b in db['baths']:
            if str(b['id']) == bath_id:
                for c in b['circuits']:
                    if c['id'] == source_id: source_circuit = c
                    if c['id'] == target_id: target_circuit = c
                break
        
        if source_circuit and target_circuit:
            target_circuit['status'] = source_circuit['status']
            target_circuit['batteryId'] = source_circuit.get('batteryId')
            target_circuit['protocol'] = source_circuit.get('protocol')
            target_circuit['startTime'] = source_circuit.get('startTime')
            target_circuit['previsao'] = source_circuit.get('previsao')
            target_circuit['progress'] = source_circuit.get('progress', 0)
            
            target_circuit['isParallel'] = True 
            source_circuit['isParallel'] = True 

            save_db(db)
            return jsonify({"sucesso": True, "db_atualizado": db})
        
        return jsonify({"sucesso": False, "erro": "Circuitos não encontrados"}), 404
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/protocols/add', methods=['POST'])
def protocol_add():
    d = request.json
    db = load_db()
    name = str(d.get('name')).upper()
    db['protocols'].append({"id": name, "name": name, "duration": int(d['duration'])})
    save_db(db)
    return jsonify({"sucesso": True, "db_atualizado": db})

@app.route('/api/protocols/delete', methods=['POST'])
def protocol_delete():
    try:
        d = request.json
        db = load_db()
        p_id = d.get('id')
        db['protocols'] = [p for p in db['protocols'] if p['id'] != p_id]
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

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
    if not oee_service: return jsonify({})
    return jsonify(oee_service.calcular_indicadores_oee(request.json))

@app.route('/api/oee/update_circuit', methods=['POST'])
def oee_update_ckt():
    if not oee_service: return jsonify({})
    d = request.json
    return jsonify(oee_service.atualizar_circuito(d.get('id'), d.get('action')))

@app.route('/api/oee/save_history', methods=['POST'])
def oee_save():
    if not oee_service: return jsonify({})
    d = request.json
    return jsonify(oee_service.save_history(d.get('kpi'), d.get('mes'), d.get('ano')))

@app.route('/api/oee/history', methods=['GET'])
def oee_history_list():
    if not oee_service: return []
    return jsonify(oee_service.listar_historico())

@app.route('/api/oee/history/delete', methods=['POST'])
def oee_history_delete():
    if not oee_service: return jsonify({})
    d = request.json
    return jsonify(oee_service.delete_history_record(d.get('mes'), d.get('ano')))

@app.route('/api/oee/auto_extras', methods=['POST'])
def oee_auto_extras():
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"})
    d = request.json
    limite = d.get('limite', 300) 
    return jsonify(oee_service.aplicar_regra_extras_automatica(limite))

@app.route('/api/oee/clear_extras', methods=['POST'])
def oee_clear_extras():
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"})
    return jsonify(oee_service.limpar_extras())

@app.route('/')
def serve_index():
    if os.path.exists(os.path.join(DIST_DIR, 'index.html')):
        return send_from_directory(DIST_DIR, 'index.html')
    return "API Online. Frontend não localizado."

@app.route('/<path:path>')
def serve_assets(path):
    if os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)