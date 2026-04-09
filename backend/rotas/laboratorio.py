from flask import Blueprint, request, jsonify
from .autenticacao import requer_autenticacao
from banco_dados import carregar_bd, salvar_bd, salvar_log_no_bd
from utilitarios import obter_agora, atualizar_progresso_realtime
from firebase_admin import auth
from configuracao import bd_firestore
import re
from datetime import datetime, timedelta, timezone
import traceback

bp_lab = Blueprint('laboratorio', __name__)


def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

def identificar_nome_padrao(linha, db_protocols=[]):
    texto_limpo = str(linha).upper().replace('_', '').replace('-', '').replace(' ', '')
    protocolos_ordenados = sorted(db_protocols, key=lambda p: len(p.get('name', '')), reverse=True)
    for p in protocolos_ordenados:
        nome_db = str(p.get('name', '')).upper().replace('_', '').replace('-', '').replace(' ', '')
        if nome_db and nome_db in texto_limpo:
            return p['name']
    return "Desconhecido"

def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    protocolos_ordenados = sorted(db_protocols, key=lambda p: len(p.get('name', '')), reverse=True)
    duracao = 0
    for p in protocolos_ordenados:
        if p.get('name', '').upper() in nome_protocolo.upper():
            duracao = p.get('duration', 0)
            break
    if duracao == 0: return "A calcular"
    try:
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except: return "-"


@bp_lab.route('/data', methods=['GET'])
@requer_autenticacao
def obter_dados_gerais():
    bd = carregar_bd()
    teve_mudanca = atualizar_progresso_realtime(bd)
    if teve_mudanca:
        salvar_bd(bd)
    return jsonify(bd)

@bp_lab.route('/criar_conta_local', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def criar_conta_local():
    if request.method == 'OPTIONS': return jsonify({}), 200
    dados = request.json
    try:
        username = dados.get('username', '').lower().strip()
        email_bancada = f"{username}@bancada.moura.com"
        user_record = auth.create_user(email=email_bancada, password=dados.get('password'), display_name=dados.get('nome'))
        bd_firestore.collection('users').document(user_record.uid).set({
            'name': dados.get('nome'), 'email': email_bancada, 'role': dados.get('role', 'tecnico'),
            'permissions': dados.get('permissions', []), 'createdAt': obter_agora().isoformat()
        })
        return jsonify({"sucesso": True, "uid": user_record.uid})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 400



@bp_lab.route('/import', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def importar_digatron():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        data = request.json
        text = data.get('text', '')
        if not text: return jsonify({'sucesso': False, 'erro': 'Texto vazio'}), 400
        
        db = carregar_bd()
        protocols = db.get('protocols', [])
        experience_owners = db.get('experienceOwners', {})
        atualizados = []
        detalhes_importacao = [] 
        
        matches = re.finditer(r"Circuit\s*0*(\d+).*?(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})", text, re.IGNORECASE)
        for m in matches:
            cid_num, t_start = m.group(1), m.group(2)
            end_line = text.find('\n', m.end())
            line = text[m.start():end_line if end_line != -1 else len(text)]
            bat_match = re.search(r"(\d{5,}-[\w-]+)", line)
            bat_id = bat_match.group(1) if bat_match else "Desconhecido"
            proto_name = identificar_nome_padrao(line, protocols)
            t_prev = calcular_previsao_fim(t_start, proto_name, protocols)
            
            dono = "Sem Dono"
            parts = bat_id.split('-')
            if len(parts) >= 2 and parts[1].upper().startswith('E'):
                expCode = parts[1].upper()
                baseCode = expCode
                if len(parts) >= 3:
                    anoLimpo = parts[2].split('_')[0]
                    expCode = f"{expCode}/{anoLimpo}"
                dono = experience_owners.get(expCode, experience_owners.get(baseCode, "Sem Dono"))
                
            for bath in db.get('baths', []):
                for c in bath.get('circuits', []):
                    if apenas_numeros(c['id']) == apenas_numeros(cid_num):
                        c.update({
                            'status': 'running', 'startTime': t_start, 'previsao': t_prev,
                            'batteryId': bat_id, 'protocol': proto_name, 'progress': 0, 'noSpace': False
                        })
                        atualizados.append(c['id'])
                        detalhes_importacao.append(f"C-{cid_num} ({bat_id} | Solicitante: {dono})")
                        
        if atualizados:
            agora = obter_agora()
            detalhes_str = ", ".join(detalhes_importacao)
            if len(detalhes_str) > 250:
                 detalhes_str = detalhes_str[:247] + "..."
            new_log = {
                "id": int(agora.timestamp() * 1000),
                "action": "Importação em Massa",
                "bath": "Vários",
                "date": agora.strftime("%d/%m/%Y %H:%M"),
                "details": f"Testes Iniciados: {detalhes_str}"
            }
            salvar_log_no_bd(new_log)
            if 'logs' not in db: db['logs'] = []
            db['logs'].insert(0, new_log)
            
        salvar_bd(db)
        return jsonify({"sucesso": True, "atualizados": atualizados, "db_atualizado": db})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/experience/owners', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def salvar_owners():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        novos_donos = request.json
        db = carregar_bd()
        if 'experienceOwners' not in db:
            db['experienceOwners'] = {}
        db['experienceOwners'].update(novos_donos)
        salvar_bd(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500



@bp_lab.route('/baths/add', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def bath_add():
    if request.method == 'OPTIONS': return jsonify({}), 200
    d = request.json
    db = carregar_bd()
    db['baths'].append({"id": d['bathId'], "temp": d.get('temp', 25), "circuits": [], "isFull": False})
    db['baths'].sort(key=lambda x: x['id'])
    salvar_bd(db)
    return jsonify({"sucesso": True, "db_atualizado": db})

@bp_lab.route('/baths/delete', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def bath_delete():
    if request.method == 'OPTIONS': return jsonify({}), 200
    d = request.json
    db = carregar_bd()
    db['baths'] = [b for b in db['baths'] if str(b['id']) != str(d['bathId'])]
    salvar_bd(db)
    return jsonify({"sucesso": True, "db_atualizado": db})

@bp_lab.route('/circuits/add', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def circuit_add():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
        cid = f"C-{d['circuitId']}" if not str(d['circuitId']).startswith("C-") else d['circuitId']
        for b in db['baths']:
            if str(b['id']) == str(d['bathId']):
                b['circuits'].append({"id": cid, "status": "free", "batteryId": None, "previsao": "-", "noSpace": b.get('isFull', False)})
                break
        agora = obter_agora()
        new_log = {"id": int(agora.timestamp() * 1000), "action": "Adição", "bath": str(d['bathId']), "date": agora.strftime("%d/%m/%Y %H:%M"), "details": f"Circuito {cid} adicionado"}
        salvar_log_no_bd(new_log)
        if 'logs' not in db: db['logs'] = []
        db['logs'].insert(0, new_log)
        salvar_bd(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuits/delete', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def circuit_delete():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
        bath_id = str(d['bathId'])
        ckt_clean = apenas_numeros(str(d['circuitId']))
        for b in db['baths']:
            if str(b['id']) == bath_id:
                b['circuits'] = [c for c in b['circuits'] if apenas_numeros(c['id']) != ckt_clean]
                break
        salvar_bd(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuits/status', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def update_circuit_status():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
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
                            c.update({'status': 'free', 'batteryId': None, 'protocol': None, 'previsao': '-', 'startTime': None, 'progress': 0, 'isParallel': False})
                        else:
                            c['status'] = new_status
                            c['noSpace'] = False
                        agora = obter_agora()
                        new_log = {"id": int(agora.timestamp() * 1000), "action": "Status Alterado", "bath": target_bath, "date": agora.strftime("%d/%m/%Y %H:%M"), "details": f"Circuito {c['id']} alterado para {new_status}"}
                        salvar_log_no_bd(new_log)
                        if 'logs' not in db: db['logs'] = []
                        db['logs'].insert(0, new_log)
                        break
        salvar_bd(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuits/nospace', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def circuit_toggle_no_space():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
        circuit_id = str(d.get('circuitId'))
        no_space = bool(d.get('noSpace', True))
        ckt_num = apenas_numeros(circuit_id)
        target_bath_id = "Desconhecido"

        for b in db.get('baths', []):
            for c in b.get('circuits', []):
                if int(apenas_numeros(c['id'])) == int(ckt_num):
                    c['noSpace'] = no_space
                    target_bath_id = str(b['id'])
                    break
        salvar_bd(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuits/move', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def circuit_move():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
        src_bath_id = str(d['sourceBathId'])
        tgt_bath_id = str(d['targetBathId'])
        circuit_id = str(d['circuitId'])
        circuit_obj = None
        ckt_num = int(apenas_numeros(circuit_id)) if apenas_numeros(circuit_id) else -1
        
        for b in db['baths']:
            if str(b['id']) == src_bath_id:
                for idx, c in enumerate(b['circuits']):
                    c_num = int(apenas_numeros(c['id'])) if apenas_numeros(c['id']) else -2
                    if c['id'] == circuit_id or c_num == ckt_num:
                        circuit_obj = c
                        b['circuits'].pop(idx)
                        break
                break

        if circuit_obj:
            for b in db['baths']:
                if str(b['id']) == tgt_bath_id:
                    ids_existentes = [x['id'] for x in b['circuits']]
                    if circuit_obj['id'] in ids_existentes:
                         circuit_obj['id'] = f"{circuit_obj['id']}_mov"
                    b['circuits'].append(circuit_obj)
                    b['circuits'].sort(key=lambda x: int(apenas_numeros(x['id'])) if apenas_numeros(x['id']) else 999)
                    break
            agora = obter_agora()
            new_log = {"id": int(agora.timestamp() * 1000), "action": "Movimentação", "bath": tgt_bath_id, "date": agora.strftime("%d/%m/%Y %H:%M"), "details": f"Circuito {circuit_obj['id']} movido de {src_bath_id}"}
            salvar_log_no_bd(new_log)
            if 'logs' not in db: db['logs'] = []
            db['logs'].insert(0, new_log)
            salvar_bd(db)
            
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuits/link', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def circuit_link():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
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
            salvar_bd(db)
            return jsonify({"sucesso": True, "db_atualizado": db})
        return jsonify({"sucesso": False, "erro": "Circuitos não encontrados"}), 404
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500
    
@bp_lab.route('/protocols/add', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def protocol_add():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
        
        # Garante que a lista de protocolos existe antes de tentar adicionar
        if 'protocols' not in db:
            db['protocols'] = []
            
        name = str(d.get('name', '')).upper()
        duracao = int(d.get('duration', 0))
        
        db['protocols'].append({"id": name, "name": name, "duration": duracao})
        salvar_bd(db)
        
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/protocols/delete', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def protocol_delete():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
        
        if 'protocols' not in db:
            db['protocols'] = []
            
        p_id = d.get('id')
        db['protocols'] = [p for p in db['protocols'] if p.get('id') != p_id]
        salvar_bd(db)
        
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500