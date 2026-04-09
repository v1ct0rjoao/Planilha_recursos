
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

@bp_lab.route('/banhos/adicionar', methods=['POST'])
@requer_autenticacao
def adicionar_banho():
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

@bp_lab.route('/circuitos/adicionar', methods=['POST'])
@requer_autenticacao
def adicionar_circuito():
    
    try:
        dados = request.json
        bd = carregar_bd()
        
        id_circuito_cru = str(dados['idCircuito'])
        id_circ = f"C-{id_circuito_cru}" if not id_circuito_cru.startswith("C-") else id_circuito_cru
        
       
        for banho in bd['baths']:
            if str(banho['id']) == str(dados['idBanho']):
                sem_espaco = banho.get('lotado', False)
                banho['circuitos'].append({
                    "id": id_circ, 
                    "status": "livre", 
                    "idBateria": None, 
                    "previsao": "-", 
                    "semEspaco": sem_espaco
                })
                break
                
     
        agora = obter_agora()
        novo_log = {
            "id": int(agora.timestamp() * 1000),
            "acao": "Adição",
            "banho": str(dados['idBanho']),
            "data": agora.strftime("%d/%m/%Y %H:%M"),
            "detalhes": f"Circuito {id_circ} adicionado"
        }
        
        salvar_log_no_bd(novo_log)
        bd['logs'].insert(0, novo_log)
        
        salvar_bd(bd)
        return jsonify({"sucesso": True, "bd_atualizado": bd})
        
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500
    
@bp_lab.route('/criar_conta_local', methods=['POST', 'OPTIONS'])
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