from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
from datetime import datetime

# Tenta importar a lógica de cálculo de datas (certifique-se de que logic.py existe)
try:
    from logic import calcular_previsao_fim
except ImportError:
    def calcular_previsao_fim(start, protocol): return "Pendente"

app = Flask(__name__)
CORS(app) # Permite a comunicação com o React

DB_FILE = 'backend/database.json'

# --- GESTÃO DE BASE DE DADOS ---

def load_db():
    if not os.path.exists(DB_FILE):
        # Estado inicial se o ficheiro não existir
        default = {
            "baths": [
                {"id": "BANHO-01", "temp": 25, "circuits": []},
                {"id": "BANHO-06", "temp": 75, "circuits": []}
            ], 
            "logs": []
        }
        save_db(default)
        return default
    with open(DB_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def add_log(db, action, bath_id, details):
    new_log = {
        "id": int(datetime.now().timestamp() * 1000),
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "action": action,
        "bath": bath_id,
        "details": details
    }
    db['logs'].insert(0, new_log)
    db['logs'] = db['logs'][:50] # Mantém os últimos 50 logs

# --- ROTAS DA API ---

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify(load_db())

# 1. Gestão de Banhos (Unidades)
@app.route('/api/baths/add', methods=['POST'])
def add_bath():
    data = request.json
    bath_id = data.get('bathId')
    temp = data.get('temp', 25)
    
    db = load_db()
    if any(b['id'] == bath_id for b in db['baths']):
        return jsonify({'error': 'Esta unidade já existe!'}), 400
        
    db['baths'].append({"id": bath_id, "temp": temp, "circuits": []})
    add_log(db, "Cadastro", bath_id, f"Unidade {bath_id} criada com setpoint {temp}ºC")
    save_db(db)
    return jsonify(db)

@app.route('/api/baths/delete', methods=['POST'])
def delete_bath():
    data = request.json
    bath_id = data.get('bathId')
    
    db = load_db()
    db['baths'] = [b for b in db['baths'] if b['id'] != bath_id]
    add_log(db, "Remoção", bath_id, f"Unidade {bath_id} excluída do sistema")
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
            old_temp = bath['temp']
            bath['temp'] = new_temp
            add_log(db, "Ajuste Temp", bath_id, f"Setpoint alterado de {old_temp}ºC para {new_temp}ºC")
            break
    save_db(db)
    return jsonify(db)

# 2. Gestão de Circuitos (Canais)
@app.route('/api/circuits/add', methods=['POST'])
def add_circuit():
    data = request.json
    bath_id = data.get('bathId')
    user_id = data.get('circuitId')
    
    final_id = f"C-{user_id}" if not str(user_id).startswith("C-") else user_id
    
    db = load_db()
    for bath in db['baths']:
        if bath['id'] == bath_id:
            if any(c['id'] == final_id for c in bath['circuits']):
                return jsonify({'error': f'O circuito {final_id} já existe nesta unidade!'}), 400
            
            bath['circuits'].append({
                "id": final_id, 
                "status": "free", 
                "batteryId": None, 
                "protocol": None, 
                "startTime": None, 
                "progress": 0, 
                "previsao": "-"
            })
            # Ordenação numérica básica para os IDs
            try:
                bath['circuits'].sort(key=lambda x: int(re.sub(r'\D', '', x['id'])) if re.sub(r'\D', '', x['id']) else 999)
            except: pass
            
            add_log(db, "Cadastro", bath_id, f"Circuito {final_id} alocado")
            break
    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/delete', methods=['POST'])
def delete_circuit():
    data = request.json
    bath_id = data.get('bathId')
    circuit_id = data.get('circuitId')
    
    db = load_db()
    for bath in db['baths']:
        if bath['id'] == bath_id:
            bath['circuits'] = [c for c in bath['circuits'] if c['id'] != circuit_id]
            add_log(db, "Remoção", bath_id, f"Circuito {circuit_id} removido")
            break
    save_db(db)
    return jsonify(db)

@app.route('/api/circuits/status', methods=['POST'])
def update_circuit_status():
    data = request.json
    bath_id = data.get('bathId')
    circuit_id = data.get('circuitId')
    new_status = data.get('status') # 'maintenance' ou 'free'
    
    db = load_db()
    for bath in db['baths']:
        if bath['id'] == bath_id:
            for circuit in bath['circuits']:
                if circuit['id'] == circuit_id:
                    circuit['status'] = new_status
                    msg = "Em Manutenção" if new_status == 'maintenance' else "Disponível"
                    add_log(db, "Status", bath_id, f"Circuito {circuit_id} definido como {msg}")
                    break
    save_db(db)
    return jsonify(db)

# 3. Importação de Dados Digatron
@app.route('/api/import', methods=['POST'])
def import_text():
    raw_text = request.json.get('text', '')
    if not raw_text: return jsonify({'error': 'Buffer vazio'}), 400

    db = load_db()
    atualizados = []

    # Regex para capturar: Circuit(ID) DataInicio Hora DataFim Hora
    pattern = r"Circuit(\d+)\s*(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})\s*(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})"
    matches = re.finditer(pattern, raw_text)

    for match in matches:
        cid_num = match.group(1)
        start_dt = match.group(2)
        stop_dt = match.group(3)
        
        # Pega a linha completa para tentar extrair o Serial da Bateria
        start_pos = match.start()
        end_pos = raw_text.find('\n', match.end())
        if end_pos == -1: end_pos = len(raw_text)
        linha = raw_text[start_pos:end_pos]
        
        # Procura o ID da Bateria (padrão longo com hífens)
        id_bateria = "Não identificado"
        battery_match = re.search(r"(\d{5,}-[\w-]+)", linha)
        if battery_match: id_bateria = battery_match.group(1)

        # Procura no banco para atualizar
        for bath in db['baths']:
            for circuit in bath['circuits']:
                if re.sub(r'\D', '', circuit['id']) == cid_num:
                    circuit['status'] = 'running'
                    circuit['startTime'] = start_dt
                    circuit['previsao'] = stop_dt
                    circuit['batteryId'] = id_bateria
                    circuit['progress'] = 5 # Início visual
                    
                    add_log(db, "Sincronismo", bath['id'], f"Circuito {circuit['id']} atualizado via Digatron")
                    atualizados.append(circuit['id'])
                    break

    save_db(db)
    return jsonify({"sucesso": True, "atualizados": atualizados, "db_atualizado": db})

if __name__ == '__main__':
    print("LabManager Server - Ativo em http://127.0.0.1:5000")
    app.run(debug=True, port=5000)