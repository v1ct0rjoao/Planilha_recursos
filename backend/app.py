from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
from datetime import datetime, timedelta

app = Flask(__name__)
# Permite conexões do React (CORS)
CORS(app)

# Configurações de Pastas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'uploads')
DB_FILE = os.path.join(BACKEND_DIR, 'database.json')

# Garante que as pastas existam
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(BACKEND_DIR, exist_ok=True)

# --- FUNÇÕES ---

def load_db():
    if not os.path.exists(DB_FILE):
        default = {
            "baths": [
                {"id": "BANHO - 01", "temp": 25, "circuits": []},
                {"id": "BANHO - 06", "temp": 75, "circuits": []}
            ],
            "protocols": [
                {"id": "SAEJ2801", "name": "SAEJ2801", "duration": 192},
                {"id": "RC20", "name": "RC20", "duration": 20}
            ],
            "logs": []
        }
        save_db(default)
        return default
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Garante estrutura mínima caso o arquivo esteja incompleto
            if "protocols" not in data: data["protocols"] = []
            if "logs" not in data: data["logs"] = []
            if "baths" not in data: data["baths"] = []
            return data
    except Exception as e:
        print(f"Erro ao carregar DB: {e}")
        return {"baths": [], "protocols": [], "logs": []}

def save_db(data):
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Erro ao salvar DB: {e}")

def add_log(db, action, bath_id, details):
    new_log = {
        "id": int(datetime.now().timestamp() * 1000),
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "action": action,
        "bath": bath_id,
        "details": details
    }
    # Adiciona no início da lista
    db['logs'].insert(0, new_log)
    # Mantém apenas os últimos 200 logs para não pesar
    db['logs'] = db['logs'][:200]

def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

# --- INTELIGÊNCIA: FINALIZAR TESTES VENCIDOS ---
def verificar_conclusao_testes(db):
    """Verifica se a data de fim já passou e atualiza o status"""
    agora = datetime.now()
    alterado = False
    
    for bath in db['baths']:
        for circuit in bath['circuits']:
            status_atual = str(circuit.get('status', '')).lower().strip()
            
            # Só verifica se estiver rodando (case insensitive agora)
            if status_atual == 'running':
                try:
                    # Previsão vem como "dd/mm/aaaa HH:MM"
                    previsao_str = circuit.get('previsao', '-')
                    if previsao_str and previsao_str not in ['-', 'A calcular', '']:
                        fim_previsto = datetime.strptime(previsao_str, "%d/%m/%Y %H:%M")
                        
                        if agora >= fim_previsto:
                            circuit['status'] = 'finished' # Muda para AZUL (Concluído)
                            circuit['progress'] = 100
                            add_log(db, "Conclusão", bath['id'], f"Teste C-{circuit['id']} finalizado automaticamente")
                            alterado = True
                except Exception as e:
                    # Ignora erros de parse de data para não parar o servidor
                    pass 
    
    if alterado:
        save_db(db)

# --- ROTAS ---

@app.route('/')
def home(): 
    return "Servidor LabManager Ativo! 🚀 Use /api/data para acessar os dados."

@app.route('/api/data', methods=['GET'])
def get_data():
    db = load_db()
    # Verifica datas antes de enviar para o site (Real-time update)
    verificar_conclusao_testes(db)
    return jsonify(db)

@app.route('/api/baths/add', methods=['POST'])
def add_bath():
    data = request.json
    bath_id = data.get('bathId')
    temp = data.get('temp', 25)
    db = load_db()
    
    # Verifica duplicidade
    if any(b['id'] == bath_id for b in db['baths']): 
        return jsonify({'error': 'Banho já existe!'}), 400
        
    db['baths'].append({"id": bath_id, "temp": temp, "circuits": []})
    db['baths'].sort(key=lambda x: x['id'])
    
    add_log(db, "Configuração", bath_id, f"Unidade criada (Set: {temp}ºC)")
    save_db(db)
    return jsonify(db)

@app.route('/api/baths/delete', methods=['POST'])
def delete_bath():
    data = request.json
    bath_id = data.get('bathId')
    db = load_db()
    db['baths'] = [b for b in db['baths'] if b['id'] != bath_id]
    save_db(db)
    return jsonify(db)

@app.route('/api/baths/temp', methods=['POST'])
def update_temp():
    data = request.json
    bath_id = data.get('bathId')
    new_temp = data.get('temp')
    db = load_db()
    for bath in db['baths']:
        if bath['id'] == bath_id:
            old = bath.get('temp', 0)
            bath['temp'] = new_temp
            add_log(db, "Temperatura", bath_id, f"{old}ºC -> {new_temp}ºC")
            break
    save_db(db)
    return jsonify(db)

@app.route('/api/protocols/add', methods=['POST'])
def add_protocol():
    data = request.json
    name = str(data.get('name')).upper()
    duration = int(data.get('duration'))
    db = load_db()
    # Remove se já existir (atualização/substituição)
    db['protocols'] = [p for p in db['protocols'] if p['id'] != name]
    db['protocols'].append({"id": name, "name": name, "duration": duration})
    save_db(db)
    return jsonify(db)

@app.route('/api/protocols/delete', methods=['POST'])
def delete_protocol():
    data = request.json
    pid = data.get('id')
    db = load_db()
    db['protocols'] = [p for p in db['protocols'] if p['id'] != pid]
    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/add', methods=['POST'])
def add_circuit():
    data = request.json
    bath_id = data.get('bathId')
    user_id = data.get('circuitId')
    
    # Padroniza ID do circuito
    final_id = f"C-{user_id}" if not str(user_id).startswith("C-") else user_id
    
    db = load_db()
    for bath in db['baths']:
        if bath['id'] == bath_id:
            if any(c['id'] == final_id for c in bath['circuits']): 
                return jsonify({'error': 'Circuito já existe!'}), 400
                
            bath['circuits'].append({
                "id": final_id, 
                "status": "free", 
                "batteryId": None, 
                "protocol": None, 
                "startTime": None, 
                "progress": 0, 
                "previsao": "-"
            })
            
            # Tenta ordenar numericamente se possível
            try: 
                bath['circuits'].sort(key=lambda x: int(apenas_numeros(x['id'])) if apenas_numeros(x['id']) else 999)
            except: 
                pass
                
            add_log(db, "Cadastro", bath_id, f"Canal {final_id} adicionado")
            break
            
    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/delete', methods=['POST'])
def delete_circuit():
    data = request.json
    db = load_db()
    for bath in db['baths']:
        if bath['id'] == data.get('bathId'):
            bath['circuits'] = [c for c in bath['circuits'] if c['id'] != data.get('circuitId')]
            add_log(db, "Remoção", data.get('bathId'), f"Canal {data.get('circuitId')} removido")
            break
    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/status', methods=['POST'])
def update_circuit_status():
    data = request.json
    bath_id = data.get('bathId')
    circuit_id = data.get('circuitId')
    new_status = data.get('status') # 'free', 'maintenance', 'running', etc.
    
    db = load_db()
    for bath in db['baths']:
        if bath['id'] == bath_id:
            for circuit in bath['circuits']:
                if circuit['id'] == circuit_id:
                    # Se for liberar (free), limpa os dados
                    if new_status == 'free':
                        circuit['status'] = 'free'
                        circuit['batteryId'] = None
                        circuit['protocol'] = None
                        circuit['startTime'] = None
                        circuit['previsao'] = "-"
                        circuit['progress'] = 0
                        circuit['error'] = None
                        add_log(db, "Sistema", bath_id, f"Canal {circuit_id} liberado")
                    else:
                        circuit['status'] = new_status
                        msg = "Em Manutenção" if new_status == 'maintenance' else "Status alterado"
                        if new_status == 'maintenance': 
                            circuit['error'] = 'Manutenção Manual'
                        add_log(db, "Status", bath_id, f"{circuit_id}: {msg}")
                    break
    save_db(db)
    return jsonify(db)

@app.route('/api/import', methods=['POST'])
def import_text():
    raw_text = request.json.get('text', '')
    db = load_db()
    atualizados = []
    
    if not raw_text: 
        return jsonify({'error': 'Texto vazio'}), 400
    
    # Regex para capturar linhas do Digatron:
    # Captura: (ID do Circuito) ... (Data Inicio) ... (Data Fim)
    pattern = r"Circuit(\d+)\s*(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})\s*(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})"
    matches = re.finditer(pattern, raw_text)

    for match in matches:
        cid_num = match.group(1) # Ex: 01, 10
        start_dt = match.group(2)
        stop_dt = match.group(3)
        
        # Pega a linha completa para buscar ID da Bateria e Protocolo
        start_pos = match.start()
        end_pos = raw_text.find('\n', match.end())
        if end_pos == -1: end_pos = len(raw_text)
        linha = raw_text[start_pos:end_pos]
        
        # Busca ID da Bateria na linha (ex: 12345-ABC)
        id_bateria = "Desconhecido"
        bat_match = re.search(r"(\d{5,}-[\w-]+)", linha)
        if bat_match: id_bateria = bat_match.group(1)
        
        # Busca protocolo conhecido
        protocolo_detectado = "Importado"
        for p in db.get('protocols', []):
            if p['name'] in linha: 
                protocolo_detectado = p['name']

        # Atualiza o circuito correspondente no banco
        for bath in db['baths']:
            for circuit in bath['circuits']:
                # Compara apenas o número (Ex: C-01 vira 01)
                if apenas_numeros(circuit['id']) == apenas_numeros(cid_num):
                    circuit['status'] = 'running'
                    circuit['startTime'] = start_dt
                    circuit['previsao'] = stop_dt # Digatron já dá a data fim calculada
                    circuit['batteryId'] = id_bateria
                    circuit['protocol'] = protocolo_detectado
                    circuit['progress'] = 10 # Começa com um pouco de progresso visual
                    
                    add_log(db, "Teste", bath['id'], f"Início {circuit['id']} | {id_bateria}")
                    atualizados.append(circuit['id'])
                    break
                    
    save_db(db)
    return jsonify({"sucesso": True, "atualizados": atualizados, "db_atualizado": db})

if __name__ == '__main__':
    print("Iniciando servidor LabManager em http://127.0.0.1:5000")
    app.run(debug=True, port=5000)