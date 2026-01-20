from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import re
from datetime import datetime, timedelta

# --- IMPORTAÇÃO ROBUSTA DO SERVIÇO OEE ---
# Tenta importar de diferentes locais para evitar erros "Module Not Found"
try:
    from backend import oee_service
except ImportError:
    try:
        import oee_service
    except ImportError:
        print("AVISO CRÍTICO: 'oee_service.py' não encontrado. As funções de OEE falharão.")
        oee_service = None

# --- CONFIGURAÇÃO DE DIRETÓRIOS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')

# Fallback: Se rodar de dentro de /backend, procura a dist um nível acima
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(os.path.dirname(BASE_DIR), 'dist')

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
CORS(app) # Permite que o React (porta 5173 ou outra) fale com o Flask (porta 5000)

# Pastas de armazenamento
BACKEND_DIR = os.path.join(BASE_DIR, 'backend') if os.path.exists(os.path.join(BASE_DIR, 'backend')) else BASE_DIR
UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'uploads')
OEE_UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'oee_uploads')
DB_FILE = os.path.join(BACKEND_DIR, 'database.json')

# Cria as pastas se não existirem
for d in [UPLOAD_FOLDER, OEE_UPLOAD_FOLDER]:
    os.makedirs(d, exist_ok=True)

# ==============================================================================
# 1. FUNÇÕES AUXILIARES DE BANCO DE DADOS (LabManager Original)
# ==============================================================================

def load_db():
    """Carrega o banco de dados JSON ou cria um padrão se não existir."""
    if not os.path.exists(DB_FILE):
        default = {
            "baths": [
                {"id": "BANHO - 01", "temp": 25, "circuits": []},
                {"id": "BANHO - 06", "temp": 75, "circuits": []}
            ],
            "protocols": [
                {"id": "RC20", "name": "RC20", "duration": 68},
                {"id": "SAEJ2801", "name": "SAEJ2801", "duration": 192}
            ],
            "logs": []
        }
        save_db(default)
        return default
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Garante integridade das chaves
            if "protocols" not in data: data["protocols"] = []
            if "logs" not in data: data["logs"] = []
            if "baths" not in data: data["baths"] = []
            return data
    except Exception as e:
        print(f"Erro ao ler DB: {e}")
        return {"baths": [], "protocols": [], "logs": []}

def save_db(data):
    """Salva o estado atual no arquivo JSON."""
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Erro ao salvar DB: {e}")

def add_log(db, action, bath_id, details):
    """Adiciona um registro ao histórico de logs."""
    new_log = {
        "id": int(datetime.now().timestamp() * 1000),
        "date": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "action": action,
        "bath": bath_id,
        "details": details
    }
    if 'logs' not in db: db['logs'] = []
    db['logs'].insert(0, new_log)
    db['logs'] = db['logs'][:200] # Limite de logs

def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

# ==============================================================================
# 2. LÓGICA DE PREVISÃO (LabManager Original)
# ==============================================================================

def identificar_nome_padrao(linha_ou_nome):
    texto_limpo = str(linha_ou_nome).upper().replace('_', '').replace('-', '').replace(' ', '')
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

# ==============================================================================
# 3. ROTAS GERAIS E FRONTEND
# ==============================================================================

@app.route('/')
def serve_react():
    if os.path.exists(os.path.join(DIST_DIR, 'index.html')):
        return send_from_directory(DIST_DIR, 'index.html')
    return "<h1>LabManager Backend Ativo. Frontend não encontrado na pasta 'dist'.</h1>"

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    db = load_db()
    verificar_conclusao_testes(db)
    return jsonify(db)

# ==============================================================================
# 4. API: IMPORTAÇÃO DO DIGATRON (LabManager Original)
# ==============================================================================

@app.route('/api/import', methods=['POST'])
def import_text():
    raw_text = request.json.get('text', '')
    db = load_db()
    atualizados = []
    
    if not raw_text: return jsonify({'error': 'Texto vazio'}), 400
    
    pattern = r"Circuit\s*0?(\d+).*?(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})"
    matches = re.finditer(pattern, raw_text, re.IGNORECASE)

    for match in matches:
        cid_num = match.group(1)
        start_dt = match.group(2)
        start_pos = match.start()
        end_pos = raw_text.find('\n', match.end())
        linha = raw_text[start_pos:end_pos] if end_pos != -1 else raw_text[start_pos:]
        
        id_bateria = "Desconhecido"
        bat_match = re.search(r"(\d{5,}-[\w-]+)", linha)
        if bat_match: id_bateria = bat_match.group(1)
        else:
            bat_match_short = re.search(r"\s([A-Z0-9]{3,6})\s", linha)
            if bat_match_short and "SAE" not in bat_match_short.group(1):
                 id_bateria = bat_match_short.group(1)
        
        protocolo_limpo = identificar_nome_padrao(linha)
        previsao_calculada = calcular_previsao_fim(start_dt, protocolo_limpo, db.get('protocols', []))

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

# ==============================================================================
# 5. API: ROTAS DO OEE (Integração com oee_service.py)
# ==============================================================================

@app.route('/api/oee/upload', methods=['POST'])
def upload_oee_excel():
    """Recebe o Excel bruto, salva e extrai a lista de circuitos."""
    if 'file' not in request.files:
        return jsonify({"sucesso": False, "erro": "Nenhum arquivo enviado"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"sucesso": False, "erro": "Nome de arquivo vazio"}), 400

    if file:
        filename = f"oee_temp_{int(datetime.now().timestamp())}.xlsx"
        filepath = os.path.join(OEE_UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        if oee_service:
            res = oee_service.processar_upload_oee(filepath)
            if res['sucesso']:
                res['filename'] = filename
                return jsonify(res)
            else:
                return jsonify(res), 400
        else:
            return jsonify({"sucesso": False, "erro": "Serviço OEE indisponível"}), 500

@app.route('/api/oee/calculate', methods=['POST'])
def calculate_oee_route():
    """Recebe as configs e chama o cálculo pesado (ETL + KPIs)."""
    data = request.json
    filename = data.get('filename')
    
    if not filename:
        return jsonify({"sucesso": False, "erro": "Arquivo não identificado"}), 400
        
    filepath = os.path.join(OEE_UPLOAD_FOLDER, filename)
    
    if not os.path.exists(filepath):
        return jsonify({"sucesso": False, "erro": "Sessão expirada. Faça upload novamente."}), 404
        
    try:
        if oee_service:
            # AQUI ESTÁ A MÁGICA: Passamos o dicionário 'data' completo.
            # O oee_service já foi atualizado para ler 'force_up', 'force_std', etc.
            # que vêm dentro dessa variável 'data'.
            resultado = oee_service.calcular_indicadores_oee(filepath, data)
            return jsonify(resultado)
        else:
            return jsonify({"sucesso": False, "erro": "Serviço OEE indisponível"}), 500
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api/oee/history', methods=['GET'])
def get_oee_history():
    """Retorna o histórico de fechamentos salvos."""
    try:
        if oee_service:
            return jsonify(oee_service.ler_historico())
        return jsonify([])
    except Exception as e:
        return jsonify([])

@app.route('/api/oee/save_history', methods=['POST'])
def save_oee_history():
    """Grava o fechamento atual no CSV."""
    data = request.json
    if not data: return jsonify({"sucesso": False, "erro": "Sem dados"}), 400
    
    if oee_service:
        sucesso = oee_service.salvar_historico(data.get('kpi'), data.get('mes'), data.get('ano'))
        return jsonify({"sucesso": sucesso})
    return jsonify({"sucesso": False, "erro": "Serviço OEE indisponível"})

# ==============================================================================
# 6. API: CRUD BÁSICO (Banhos/Circuitos)
# ==============================================================================

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
    print("\n--- SERVIDOR LABMANAGER INICIADO ---")
    print("Modo: Desenvolvimento (Debug Ativo)")
    print("Porta: 5000")
    print("------------------------------------\n")
    app.run(debug=True, port=5000)