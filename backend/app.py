from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import re
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

# --- CONFIGURAÇÃO INICIAL ---
base_dir = os.path.dirname(os.path.abspath(__file__))
db_firestore = None

# --- OTIMIZAÇÃO: VARIÁVEIS GLOBAIS DE CACHE ---
# DATA_CACHE guarda o banco de dados na memória RAM (super rápido).
# O servidor lê daqui ao invés de ir na internet toda vez.
DATA_CACHE = None 

# Configuração do Firebase
firebase_env = os.getenv("FIREBASE_CREDENTIALS")

try:
    if firebase_env:
        cred_dict = json.loads(firebase_env)
        cred = credentials.Certificate(cred_dict)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db_firestore = firestore.client()
        print("Firebase conectado via Variavel de Ambiente.")
    else:
        cred_path = os.path.join(base_dir, 'firebase_credentials.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            db_firestore = firestore.client()
            print("Firebase conectado via Arquivo Local.")
        else:
            print("AVISO: Nenhuma credencial encontrada. O App vai funcionar apenas em memória.")

except Exception as e:
    print(f"Erro ao conectar Firebase: {e}")

# Tenta importar o serviço de OEE (se existir)
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

# --- FUNÇÕES DE BANCO DE DADOS INTELIGENTE ---

def save_db(data):
    """
    Salva os dados.
    1. Atualiza a memória RAM instantaneamente (Cache).
    2. Envia para o Firebase (Persistência) em segundo plano (se conectado).
    """
    global DATA_CACHE
    
    # Atualiza o Cache IMEDIATAMENTE
    DATA_CACHE = data
    
    # Se tiver conexão, salva no banco real
    if not db_firestore:
        return
    try:
        db_firestore.collection('lab_data').document('main').set(data)
    except Exception as e:
        print(f"Erro ao salvar no Firebase: {e}")

def load_db():
    """
    Carrega os dados.
    1. Se tiver no Cache (RAM), retorna de lá (0 delay).
    2. Se não, busca no Firebase.
    """
    global DATA_CACHE
    
    # OTIMIZAÇÃO: Retorno imediato se já carregou antes
    if DATA_CACHE is not None:
        return DATA_CACHE

    empty_structure = {"baths": [], "protocols": [], "logs": []}
    
    if not db_firestore:
        return empty_structure
        
    try:
        doc = db_firestore.collection('lab_data').document('main').get()
        if doc.exists:
            data = doc.to_dict()
            # Garante a estrutura mínima
            if "protocols" not in data: data["protocols"] = []
            if "logs" not in data: data["logs"] = []
            if "baths" not in data: data["baths"] = []
            
            # Salva no Cache para a próxima requisição ser rápida
            DATA_CACHE = data
            return data
        else:
            save_db(empty_structure)
            return empty_structure
    except Exception as e:
        print(f"Erro no load_db: {e}")
        return empty_structure

def add_log(db, action, bath_id, details):
    """Adiciona um log ao histórico"""
    new_log = {
        "id": int(datetime.now().timestamp() * 1000),
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "action": action,
        "bath": bath_id,
        "details": details
    }
    if 'logs' not in db: db['logs'] = []
    db['logs'].insert(0, new_log)
    db['logs'] = db['logs'][:200] # Mantém apenas os últimos 200

# --- FUNÇÕES UTILITÁRIAS ---

def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

def identificar_nome_padrao(linha_ou_nome, db_protocols=[]):
    texto_limpo = str(linha_ou_nome).upper().replace('_', '').replace('-', '').replace(' ', '')
    for p in db_protocols:
        nome_db = str(p['name']).upper().replace('_', '').replace('-', '').replace(' ', '')
        if nome_db and nome_db in texto_limpo:
            return p['name']
    try:
        if '_' in str(linha_ou_nome):
            partes = str(linha_ou_nome).split('_')
            candidato = partes[-1].strip()
            candidato = re.sub(r'[\r\n\t]', '', candidato)
            if len(candidato) > 2:
                return candidato
    except:
        pass
    return "Desconhecido"

def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    duracao = 0
    for p in db_protocols:
        if p['name'].upper() in nome_protocolo.upper():
            duracao = p['duration']
            break
    if duracao == 0:
        return "A calcular"
    try:
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except: return "-"

def atualizar_progresso_em_tempo_real(db):
    """
    Calcula % de progresso sincronizado com o horário de Recife/PE.
    """
    global DATA_CACHE
    
    agora_utc = datetime.utcnow()
    agora_pe = agora_utc - timedelta(hours=3) 
    
    precisa_salvar_firebase = False
    houve_mudanca_visual = False 

    for bath in db['baths']:
        for circuit in bath['circuits']:
            status_atual = str(circuit.get('status', '')).lower().strip()
            
            if status_atual == 'running':
                try:
                    start_str = circuit.get('startTime')
                    end_str = circuit.get('previsao')
                    
                    if start_str and end_str and end_str not in ['-', 'A calcular']:
                        # Converte as strings (Ex: "04/02/2026 09:00") para data matemática
                        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
                        dt_end = datetime.strptime(end_str, "%d/%m/%Y %H:%M")
                        
                        # Calcula a duração total do teste em segundos
                        total_seconds = (dt_end - dt_start).total_seconds()
                        
                        # Calcula quanto tempo passou AGORA (usando o relógio de PE)
                        elapsed_seconds = (agora_pe - dt_start).total_seconds()
                        
                        # Proteção para não dividir por zero
                        if total_seconds > 0: 
                            percent = (elapsed_seconds / total_seconds) * 100
                        else: 
                            percent = 100
                        
                        # Verifica se o teste acabou
                        if agora_pe >= dt_end:
                            if status_atual != 'finished':
                                circuit['status'] = 'finished'
                                circuit['progress'] = 100
                                add_log(db, "Conclusão Auto", bath['id'], f"{circuit['id']} finalizado")
                                precisa_salvar_firebase = True
                                houve_mudanca_visual = True
                        else:
                            # Teste em andamento
                            # max(0, ...) garante que a barra não fique negativa se o relógio atrasar um pouco
                            # min(99, ...) garante que não mostre 100% antes da hora
                            new_prog = round(max(0, min(99, percent)), 1)
                            
                            if circuit.get('progress') != new_prog:
                                circuit['progress'] = new_prog
                                houve_mudanca_visual = True 
                                
                except Exception as e:
                    # Se tiver erro na data, ignora para não parar o servidor
                    pass
                    
            elif status_atual == 'finished':
                # Garante que testes finalizados mostrem 100% cheios
                if circuit.get('progress') != 100:
                    circuit['progress'] = 100
                    precisa_salvar_firebase = True
                    houve_mudanca_visual = True

    # Salva no disco apenas se algo crítico mudou (status finalizado)
    if precisa_salvar_firebase:
        save_db(db)
    # Atualiza a memória se apenas a porcentagem mudou (para o front ver rápido)
    elif houve_mudanca_visual:
        DATA_CACHE = db
        
# --- ROTAS DA API ---

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
    
    found_any = False
    for match in matches:
        cid_num_str = match.group(1)
        start_dt = match.group(2)
        start_pos = match.start()
        end_pos = raw_text.find('\n', match.end())
        linha = raw_text[start_pos:end_pos] if end_pos != -1 else raw_text[start_pos:]
        
        id_bateria = "Desconhecido"
        bat_match_long = re.search(r"(\d{5,}-[\w-]+)", linha)
        if bat_match_long: 
            id_bateria = bat_match_long.group(1)
        else:
            bat_match_short = re.search(r"\s([A-Z0-9]{3,6})\s", linha)
            if bat_match_short and "SAE" not in bat_match_short.group(1) and "CIRCUIT" not in bat_match_short.group(1).upper(): 
                id_bateria = bat_match_short.group(1)
        
        protocolo_limpo = identificar_nome_padrao(linha, protocols_list)
        previsao_calculada = calcular_previsao_fim(start_dt, protocolo_limpo, protocols_list)
        
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
                        found_any = True
                        break
                except: continue
            if found_any: break # Sai do loop de banhos para ir para o próximo match
        found_any = False # Reseta para o próximo
            
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
    data = request.json
    db = load_db()
    raw_input = str(data['circuitId'])
    
    def get_clean_int(val):
        nums = re.sub(r'\D', '', str(val))
        return int(nums) if nums else None

    target_num = get_clean_int(raw_input)

    if target_num is not None:
        for bath in db['baths']:
            for circuit in bath['circuits']:
                existing_num = get_clean_int(circuit['id'])
                if existing_num is not None and existing_num == target_num:
                    return jsonify({'error': f'Circuito {target_num} já existe em {bath["id"]}!'}), 400

    final_id = f"C-{raw_input}" if not raw_input.upper().startswith("C-") else raw_input.upper()

    bath_found = False
    for b in db['baths']:
        if b['id'] == data['bathId']:
            b['circuits'].append({
                "id": final_id, 
                "status": "free", 
                "batteryId": None, 
                "previsao": "-"
            })
            try: 
                b['circuits'].sort(key=lambda x: get_clean_int(x['id']) or 999999)
            except: pass
            bath_found = True
            break
    
    if not bath_found:
        return jsonify({'error': 'Banho não encontrado'}), 404

    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/move', methods=['POST'])
def move_circuit():
    data = request.json
    db = load_db()
    source_id = data.get('sourceBathId')
    target_id = data.get('targetBathId')
    raw_circuit_id = data.get('circuitId')

    if raw_circuit_id is None or str(raw_circuit_id).lower() == 'none':
        return jsonify({'error': 'ID do circuito inválido'}), 400
        
    def get_clean_int(val):
        nums = re.sub(r'\D', '', str(val))
        return int(nums) if nums else None

    target_num = get_clean_int(raw_circuit_id)
    if not source_id or not target_id:
        return jsonify({'error': 'Dados incompletos'}), 400

    source_bath = next((b for b in db['baths'] if b['id'] == source_id), None)
    target_bath = next((b for b in db['baths'] if b['id'] == target_id), None)

    if not source_bath or not target_bath:
        return jsonify({'error': 'Banho não encontrado'}), 404

    circuit_obj = None
    for c in source_bath['circuits']:
        if get_clean_int(c['id']) == target_num:
            circuit_obj = c
            break
    
    if not circuit_obj:
        return jsonify({'error': 'Circuito não encontrado na origem'}), 404

    for c in target_bath['circuits']:
        if get_clean_int(c['id']) == target_num:
             return jsonify({'error': 'Circuito já existe no destino'}), 400

    source_bath['circuits'].remove(circuit_obj)
    target_bath['circuits'].append(circuit_obj)

    try: 
        target_bath['circuits'].sort(key=lambda x: get_clean_int(x['id']) or 999999)
    except: pass

    add_log(db, "Movimentação", target_id, f"Circuito {circuit_obj['id']} movido de {source_id}")
    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/link', methods=['POST'])
def link_circuits():
    data = request.json
    db = load_db()
    bath_id = data.get('bathId')
    source_id_raw = str(data.get('sourceId'))
    target_id_raw = str(data.get('targetId'))

    def normalize_id(cid): return re.sub(r'\D', '', str(cid))

    bath = next((b for b in db['baths'] if b['id'] == bath_id), None)
    if not bath: return jsonify({'error': 'Banho não encontrado'}), 404

    source_circuit = next((c for c in bath['circuits'] if normalize_id(c['id']) == normalize_id(source_id_raw)), None)
    target_circuit = next((c for c in bath['circuits'] if normalize_id(c['id']) == normalize_id(target_id_raw)), None)

    if not source_circuit or not target_circuit:
        return jsonify({'error': 'Circuitos não encontrados'}), 404

    target_circuit.update({
        'status': source_circuit.get('status'),
        'batteryId': source_circuit.get('batteryId'),
        'protocol': source_circuit.get('protocol'),
        'startTime': source_circuit.get('startTime'),
        'previsao': source_circuit.get('previsao'),
        'progress': source_circuit.get('progress'),
        'isParallel': True,
        'linkedTo': source_circuit['id']
    })

    add_log(db, "Paralelo", bath_id, f"{target_circuit['id']} vinculado ao {source_circuit['id']}")
    save_db(db)
    return jsonify(db)

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
                            'previsao': '-', 'startTime': None, 'progress': 0,
                            'isParallel': False, 'linkedTo': None
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

@app.route('/api/baths/rename', methods=['POST'])
def rename_bath():
    data = request.json
    db = load_db()
    old_id = data.get('oldId')
    new_id = data.get('newId')
  
    if any(b['id'] == new_id for b in db['baths']):
        return jsonify({'error': f'O local {new_id} já existe!'}), 400

    found = False
    for b in db['baths']:
        if b['id'] == old_id:
            b['id'] = new_id
            found = True
            break
    
    if found:
        add_log(db, "Edição", new_id, f"Renomeado de {old_id} para {new_id}")
        try: db['baths'].sort(key=lambda x: x['id'])
        except: pass
        save_db(db)
        return jsonify(db)
    
    return jsonify({'error': 'Local original não encontrado'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)