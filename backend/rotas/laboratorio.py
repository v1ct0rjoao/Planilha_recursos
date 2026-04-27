from flask import Blueprint, request, jsonify
from google.cloud.firestore import FieldFilter
from .autenticacao import requer_autenticacao
from banco_dados import carregar_bd, salvar_bd, salvar_log_no_bd, salvar_log_circuito
from utilitarios import obter_agora, atualizar_progresso_realtime
from firebase_admin import auth
from configuracao import bd_firestore
import re
from datetime import datetime, timedelta
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
        
        if '@' in username:
            email = username
        else:
            email = f"{username}@moura.com"
            
        user_record = auth.create_user(email=email, password=dados.get('password'), display_name=dados.get('nome'))
        bd_firestore.collection('users').document(user_record.uid).set({
            'name': dados.get('nome'), 'email': email, 'role': dados.get('role', 'cliente'),
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
        
        try:
            doc = bd_firestore.collection('lab_data').document('main').get()
            if doc.exists:
                dados_nuvem = doc.to_dict()
                db['protocols'] = dados_nuvem.get('protocols', [])
                if 'experienceOwners' in dados_nuvem:
                    db['experienceOwners'] = {str(k).replace('_', '/'): v for k, v in dados_nuvem['experienceOwners'].items()}
        except Exception:
            pass

        protocols = db.get('protocols', [])
        experience_owners = db.get('experienceOwners', {})
        atualizados = []
        detalhes_importacao = [] 
        agora = obter_agora()
        
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
            expCode_display = "Desconhecida"
            parts = bat_id.split('-')
            if len(parts) >= 2 and parts[1].upper().startswith('E'):
                expCode = parts[1].upper()
                baseCode = expCode
                if len(parts) >= 3:
                    anoLimpo = parts[2].split('_')[0]
                    expCode_display = f"{expCode}/{anoLimpo}"
                else:
                    expCode_display = expCode
                dono = experience_owners.get(expCode_display, experience_owners.get(baseCode, "Sem Dono"))
                
            for bath in db.get('baths', []):
                for c in bath.get('circuits', []):
                    if apenas_numeros(c['id']) == apenas_numeros(cid_num):
                        c.update({
                            'status': 'running', 'startTime': t_start, 'previsao': t_prev,
                            'batteryId': bat_id, 'protocol': proto_name, 'progress': 0, 'noSpace': False
                        })
                        atualizados.append(c['id'])
                        detalhes_importacao.append(f"C-{cid_num} ({bat_id} | Solicitante: {dono})")
                        
                        data_inicio = t_start.split(' ')[0]
                        
                        log_individual = {
                            "id": int(agora.timestamp() * 1000) + len(atualizados),
                            "action": "Início de Teste",
                            "bath": str(bath['id']),
                            "circuitId": c['id'],
                            "batteryId": bat_id,
                            "date": agora.strftime("%d/%m/%Y %H:%M"),
                            "details": f"Data: {data_inicio} | Exp/Ano: {expCode_display} | Lote/ID: {bat_id} | Prot: {proto_name}"
                        }
                        salvar_log_circuito(log_individual)
                        
        if atualizados:
            detalhes_str = ", ".join(detalhes_importacao)
            if len(detalhes_str) > 250:
                 detalhes_str = detalhes_str[:247] + "..."
            new_log = {
                "id": int(agora.timestamp() * 1000),
                "action": "Importação em Massa",
                "bath": "Vários",
                "circuitId": "Vários",
                "date": agora.strftime("%d/%m/%Y %H:%M"),
                "details": f"Testes Iniciados: {detalhes_str}"
            }
            salvar_log_no_bd(new_log)
            if 'logs' not in db: db['logs'] = []
            db['logs'].insert(0, new_log)
            db['logs'] = db['logs'][:100]
            
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

@bp_lab.route('/baths/rename', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def bath_rename():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
        old_id = str(d['oldId'])
        new_id = str(d['newId'])
        found = False
        for b in db.get('baths', []):
            if str(b['id']) == old_id:
                b['id'] = new_id
                found = True
                break
        if found:
            salvar_bd(db)
            return jsonify({"sucesso": True, "db_atualizado": db})
        return jsonify({"sucesso": False, "erro": "Banho não encontrado"}), 404
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/baths/temp', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def bath_update_temp():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
        bath_id = str(d['bathId'])
        new_temp = d['temp']
        for b in db.get('baths', []):
            if str(b['id']) == bath_id:
                b['temp'] = new_temp
                break
        salvar_bd(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/baths/toggle_full', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def bath_toggle_full():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        d = request.json
        db = carregar_bd()
        bath_id = str(d['bathId'])
        is_full = bool(d.get('isFull', True))
        for b in db.get('baths', []):
            if str(b['id']) == bath_id:
                b['isFull'] = is_full
                if is_full:
                    for c in b.get('circuits', []):
                        status = c.get('status', 'free')
                        if status == 'free' or status == 'finished' or c.get('progress', 0) >= 100:
                            c['noSpace'] = True
                else:
                    for c in b.get('circuits', []):
                        c['noSpace'] = False
                break
        salvar_bd(db)
        agora = obter_agora()
        status_log = "Lotado (Sem Espaço)" if is_full else "Com Espaço Restaurado"
        new_log = {
            "id": int(agora.timestamp() * 1000),
            "action": "Espaço Físico",
            "bath": bath_id,
            "circuitId": "Todos",
            "date": agora.strftime("%d/%m/%Y %H:%M"),
            "details": f"Status físico do local alterado para: {status_log}"
        }
        salvar_log_no_bd(new_log)
        if 'logs' not in db: db['logs'] = []
        db['logs'].insert(0, new_log)
        db['logs'] = db['logs'][:100]
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

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
        new_log = {"id": int(agora.timestamp() * 1000), "action": "Adição", "bath": str(d['bathId']), "circuitId": cid, "date": agora.strftime("%d/%m/%Y %H:%M"), "details": f"Circuito {cid} adicionado"}
        salvar_log_no_bd(new_log)
        salvar_log_circuito(new_log)
        if 'logs' not in db: db['logs'] = []
        db['logs'].insert(0, new_log)
        db['logs'] = db['logs'][:100]
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
                        old_status = c.get('status', 'free')
                        battery_id = c.get('batteryId', 'N/A')
                        
                        action_text = "Status Alterado"
                        details_text = f"Status mudou de {old_status} para {new_status}."

                        if new_status == 'maintenance':
                            action_text = "Entrada em Manutenção"
                            details_text = "Circuito bloqueado para verificação preventiva ou corretiva."
                            battery_id = 'N/A' 
                        elif new_status == 'free' and old_status == 'maintenance':
                            action_text = "Saída de Manutenção"
                            details_text = "Circuito liberado pela equipe técnica e pronto para uso."
                        elif new_status == 'free' and old_status in ['running', 'finished']:
                            action_text = "Teste Concluído"
                            details_text = f"Bateria {battery_id} finalizada. Circuito vazio e liberado."
                        elif new_status == 'finished':
                            action_text = "Conclusão Manual"
                            details_text = f"Teste da bateria {battery_id} foi marcado como finalizado manualmente."
                        
                        if new_status == 'free':
                            c.update({'status': 'free', 'batteryId': None, 'protocol': None, 'previsao': '-', 'startTime': None, 'progress': 0, 'isParallel': False})
                        else:
                            c['status'] = new_status
                            c['noSpace'] = False
                            
                        agora = obter_agora()
                        new_log = {
                            "id": int(agora.timestamp() * 1000), "action": action_text, 
                            "bath": target_bath, "circuitId": c['id'], "batteryId": battery_id if battery_id != 'N/A' else None,
                            "date": agora.strftime("%d/%m/%Y %H:%M"), "details": details_text
                        }
                        salvar_log_no_bd(new_log)
                        salvar_log_circuito(new_log)
                        if 'logs' not in db: db['logs'] = []
                        db['logs'].insert(0, new_log)
                        db['logs'] = db['logs'][:100]
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
            new_log = {
                "id": int(agora.timestamp() * 1000), "action": "Mudança de Local", 
                "bath": tgt_bath_id, "circuitId": circuit_obj['id'], "batteryId": circuit_obj.get('batteryId'),
                "date": agora.strftime("%d/%m/%Y %H:%M"), "details": f"Migrado fisicamente de {src_bath_id} para {tgt_bath_id}."
            }
            salvar_log_no_bd(new_log)
            salvar_log_circuito(new_log)
            if 'logs' not in db: db['logs'] = []
            db['logs'].insert(0, new_log)
            db['logs'] = db['logs'][:100]
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
                    if int(apenas_numeros(c['id'])) == int(apenas_numeros(source_id)):source_circuit = c
                    if int(apenas_numeros(c['id'])) == int(apenas_numeros(target_id)):target_circuit = c
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
            
            agora = obter_agora()
            new_log = {
                "id": int(agora.timestamp() * 1000), "action": "Vínculo em Paralelo", 
                "bath": bath_id, "circuitId": target_circuit['id'], "batteryId": target_circuit.get('batteryId'),
                "date": agora.strftime("%d/%m/%Y %H:%M"), "details": f"Clonou as configurações do circuito mestre {source_circuit['id']}."
            }
            salvar_log_no_bd(new_log)
            salvar_log_circuito(new_log)
            if 'logs' not in db: db['logs'] = []
            db['logs'].insert(0, new_log)
            db['logs'] = db['logs'][:100]
            
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
        if 'protocols' not in db: db['protocols'] = []
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
        if 'protocols' not in db: db['protocols'] = []
        p_id = d.get('id')
        db['protocols'] = [p for p in db['protocols'] if p.get('id') != p_id]
        salvar_bd(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuits/history', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def get_circuit_history():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        data = request.json
        circuit_id = str(data.get('circuitId'))
        
        logs_ref = bd_firestore.collection('circuit_logs').where(filter=FieldFilter('circuitId', '==', circuit_id)).get()
        
        history = [doc.to_dict() for doc in logs_ref]
        history.sort(key=lambda x: x.get('id', 0), reverse=True)
        
        return jsonify({"sucesso": True, "logs": history})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuits/history/add', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def add_circuit_history():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        data = request.json
        circuit_id = str(data.get('circuitId'))
        action = str(data.get('action', 'Falha no Equipamento'))
        details = str(data.get('details', ''))
        battery_id = data.get('batteryId')

        if "Falha" in action or "Reparo" in action or "Manutenção" in action:
            battery_id = None

        agora = obter_agora()
        new_log = {
            "id": int(agora.timestamp() * 1000),
            "action": action,
            "bath": "Registro Manual",
            "circuitId": circuit_id,
            "batteryId": battery_id if battery_id else None,
            "date": agora.strftime("%d/%m/%Y %H:%M"),
            "details": details if details else "Sem justificativa detalhada fornecida pelo operador."
        }
        
        salvar_log_circuito(new_log)
        
        db = carregar_bd()
        
        if action == 'Falha no Equipamento' or action == 'Reparo Realizado':
            ckt_num = int(apenas_numeros(circuit_id)) if apenas_numeros(circuit_id) else -1
            for b in db.get('baths', []):
                for c in b.get('circuits', []):
                    c_num = int(apenas_numeros(c['id'])) if apenas_numeros(c['id']) else -2
                    if c['id'] == circuit_id or c_num == ckt_num:
                        if action == 'Falha no Equipamento':
                            c['status'] = 'maintenance'
                            c['noSpace'] = False
                        elif action == 'Reparo Realizado':
                            c.update({'status': 'free', 'batteryId': None, 'protocol': None, 'previsao': '-', 'startTime': None, 'progress': 0, 'isParallel': False})
                        break
                        
        if 'logs' not in db: db['logs'] = []
        db['logs'].insert(0, new_log)
        db['logs'] = db['logs'][:100]
        salvar_bd(db)

        return jsonify({"sucesso": True, "log": new_log})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuits/history/delete', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def delete_circuit_history():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        data = request.json
        log_id = str(data.get('logId'))
        
        bd_firestore.collection('circuit_logs').document(log_id).delete()
        
        db = carregar_bd()
        if 'logs' in db:
            db['logs'] = [log for log in db['logs'] if str(log.get('id')) != log_id]
            salvar_bd(db)
            
        return jsonify({"sucesso": True})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500