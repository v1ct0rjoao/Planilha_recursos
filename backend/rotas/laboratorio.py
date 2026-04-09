from flask import Blueprint, request, jsonify
from .autenticacao import requer_autenticacao
from banco_dados import carregar_bd, salvar_bd, salvar_log_no_bd
from utilitarios import obter_agora, atualizar_progresso_realtime
from firebase_admin import auth
from configuracao import bd_firestore

bp_lab = Blueprint('laboratorio', __name__)


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
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    dados = request.json
    try:
        username = dados.get('username', '').lower().strip()
        email_bancada = f"{username}@bancada.moura.com"
       
        user_record = auth.create_user(
            email=email_bancada,
            password=dados.get('password'),
            display_name=dados.get('nome')
        )
       
        bd_firestore.collection('users').document(user_record.uid).set({
            'name': dados.get('nome'),
            'email': email_bancada,
            'role': dados.get('role', 'tecnico'),
            'permissions': dados.get('permissions', []),
            'createdAt': obter_agora().isoformat()
        })
        return jsonify({"sucesso": True, "uid": user_record.uid})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 400



@bp_lab.route('/import', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def importar_digatron():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        dados = request.json
        texto = dados.get('text', '')
        bd = carregar_bd()
        
      
        
        salvar_bd(bd)
        return jsonify({"sucesso": True, "bd_atualizado": bd, "atualizados": []})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/experience/owners', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def salvar_owners():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        novos_donos = request.json
        bd = carregar_bd()
        
        # Garante que o dicionário de donos existe no banco
        if 'experienceOwners' not in bd:
            bd['experienceOwners'] = {}
            
        bd['experienceOwners'].update(novos_donos)
        salvar_bd(bd)
        
        return jsonify({"sucesso": True, "bd_atualizado": bd})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500



@bp_lab.route('/banhos/adicionar', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def adicionar_banho():
    if request.method == 'OPTIONS': return jsonify({}), 200
    dados = request.json
    bd = carregar_bd()
    
    novo_banho = {
        "id": dados['idBanho'], 
        "temp": dados.get('temp', 25), 
        "circuitos": [], 
        "lotado": False
    }
    bd['baths'].append(novo_banho)
    bd['baths'].sort(key=lambda x: x['id']) 
    salvar_bd(bd)
    return jsonify({"sucesso": True, "bd_atualizado": bd})

@bp_lab.route('/circuitos/adicionar', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def adicionar_circuito():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        dados = request.json
        bd = carregar_bd()
        id_circuito_cru = str(dados['idCircuito'])
        id_circ = f"C-{id_circuito_cru}" if not id_circuito_cru.startswith("C-") else id_circuito_cru
        
        for banho in bd['baths']:
            if str(banho['id']) == str(dados['idBanho']):
                banho['circuitos'].append({
                    "id": id_circ, "status": "livre", "idBateria": None, 
                    "previsao": "-", "semEspaco": banho.get('lotado', False)
                })
                break
                
        agora = obter_agora()
        novo_log = {"id": int(agora.timestamp() * 1000), "acao": "Adição", "banho": str(dados['idBanho']), "data": agora.strftime("%d/%m/%Y %H:%M"), "detalhes": f"Circuito {id_circ} adicionado"}
        salvar_log_no_bd(novo_log)
        bd['logs'].insert(0, novo_log)
        salvar_bd(bd)
        return jsonify({"sucesso": True, "bd_atualizado": bd})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuitos/mover', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def mover_circuito():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        dados = request.json
        bd = carregar_bd()
        id_circuito = dados['idCircuito']
        id_banho_origem = str(dados['idBanhoOrigem'])
        id_banho_destino = str(dados['idBanhoDestino'])

        circuito_movido = None
        
        # Remove da origem
        for banho in bd['baths']:
            if str(banho['id']) == id_banho_origem:
                for c in banho['circuitos']:
                    if c['id'] == id_circuito:
                        circuito_movido = c
                        banho['circuitos'].remove(c)
                        break

        # Adiciona no destino
        if circuito_movido:
            for banho in bd['baths']:
                if str(banho['id']) == id_banho_destino:
                    circuito_movido['semEspaco'] = banho.get('lotado', False)
                    banho['circuitos'].append(circuito_movido)
                    break
                    
            agora = obter_agora()
            log = {"id": int(agora.timestamp() * 1000), "acao": "Movimentação", "banho": id_banho_destino, "data": agora.strftime("%d/%m/%Y %H:%M"), "detalhes": f"Circuito {id_circuito} movido do banho {id_banho_origem}"}
            salvar_log_no_bd(log)
            bd['logs'].insert(0, log)
            salvar_bd(bd)

        return jsonify({"sucesso": True, "bd_atualizado": bd})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuitos/manutencao', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def manutencao_circuito():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        dados = request.json
        bd = carregar_bd()
        id_circ = dados['idCircuito']

        for banho in bd['baths']:
            for c in banho['circuitos']:
                if c['id'] == id_circ:
                    c['status'] = 'manutencao' if c['status'] != 'manutencao' else 'livre'
                    break

        salvar_bd(bd)
        return jsonify({"sucesso": True, "bd_atualizado": bd})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuitos/paralelo', methods=['POST', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def paralelo_circuito():
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        dados = request.json
        bd = carregar_bd()
        id_circ = dados['idCircuito']

        for banho in bd['baths']:
            for c in banho['circuitos']:
                if c['id'] == id_circ:
                    c['isParalelo'] = not c.get('isParalelo', False)
                    break

        salvar_bd(bd)
        return jsonify({"sucesso": True, "bd_atualizado": bd})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/circuitos/deletar/<path:id_circuito>', methods=['DELETE', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def deletar_circuito(id_circuito):
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        bd = carregar_bd()
        for banho in bd['baths']:
            banho['circuitos'] = [c for c in banho['circuitos'] if str(c['id']) != str(id_circuito)]
        salvar_bd(bd)
        return jsonify({"sucesso": True, "bd_atualizado": bd})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_lab.route('/banhos/deletar/<path:id_banho>', methods=['DELETE', 'OPTIONS'], strict_slashes=False)
@requer_autenticacao
def deletar_banho(id_banho):
    if request.method == 'OPTIONS': return jsonify({}), 200
    try:
        bd = carregar_bd()
        bd['baths'] = [b for b in bd['baths'] if str(b['id']) != str(id_banho)]
        salvar_bd(bd)
        return jsonify({"sucesso": True, "bd_atualizado": bd})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500