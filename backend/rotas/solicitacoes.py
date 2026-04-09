

from flask import Blueprint, request, jsonify
from firebase_admin import firestore # Precisamos disso para operações especiais no banco, como o ArrayUnion
from .autenticacao import requer_autenticacao
from configuracao import bd_firestore
from utilitarios import obter_agora
import traceback

bp_solicitacoes = Blueprint('solicitacoes', __name__)

@bp_solicitacoes.route('/listar', methods=['GET'])
@requer_autenticacao
def listar_solicitacoes():
    #buscar historico e listar solicitacoes
    if not bd_firestore:
        return jsonify([])
        
    try:
        # .get() puxa todos os documentos da coleçcao de uma vez
        documentos = bd_firestore.collection('solicitacoes').get()
        
        
        return jsonify([doc.to_dict() for doc in documentos])
    except Exception as e:
        return jsonify([])

@bp_solicitacoes.route('/adicionar', methods=['POST'])
@requer_autenticacao
def adicionar_solicitacao():
   
    if not bd_firestore:
        return jsonify({"sucesso": False, "erro": "Firestore não conectado"}), 500
        
    try:
        dados = request.json
        agora = obter_agora()
        dados['dataCriacao'] = agora.strftime("%d/%m/%Y %H:%M")
        id_doc = dados.get('idSolicitacao') 
        bd_firestore.collection('solicitacoes').document(id_doc).set(dados)
        
        return jsonify({"sucesso": True, "message": "Solicitação criada com sucesso!"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_solicitacoes.route('/update', methods=['POST'])
@requer_autenticacao
def atualizar_solicitacao():

    if not bd_firestore:
        return jsonify({"sucesso": False, "erro": "Firestore não conectado"}), 500
        
    try:
        data = request.json
        doc_id = data.get('id')
        update_data = data.get('dados', {})
        bd_firestore.collection('solicitacoes').document(doc_id).update(update_data)
        
        return jsonify({"sucesso": True})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_solicitacoes.route('/share', methods=['POST'])
@requer_autenticacao
def compartilhar_solicitacao():
   
    data = request.json
    id_solicitacao = data.get('id')
    email_convidado = data.get('email')
    
    if not id_solicitacao or not email_convidado:
        return jsonify({"erro": "Dados incompletos"}), 400

    try:
        if bd_firestore:
            doc_ref = bd_firestore.collection('solicitacoes').document(id_solicitacao)
            doc_ref.update({"sharedWith": firestore.ArrayUnion([email_convidado])})
            
        return jsonify({"sucesso": True, "mensagem": f"Compartilhado com {email_convidado}"}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@bp_solicitacoes.route('/experiencias/gerar', methods=['POST'])
@requer_autenticacao
def gerar_experiencia():
    
    if not bd_firestore:
        return jsonify({"sucesso": False, "erro": "Firestore não conectado"}), 500
    
    try:
        dados = request.json
        id_solic = dados.get('idSolicitacao')
        codigo_exp = dados.get('experiencia')
        
        solic_data = dados.get('dadosSolicitacao', {})
        
        try:
            qtd_amostras = int(solic_data.get('qtdAmostras', 0))
        except ValueError:
            qtd_amostras = 0

        if qtd_amostras <= 0:
            return jsonify({"sucesso": False, "erro": "A quantidade de amostras na solicitação é inválida ou zerada."}), 400

        amostras = []
        for i in range(1, qtd_amostras + 1):
            amostras.append({
                "idAmostra": f"{codigo_exp}-{i:02d}", 
                "status": "pendente", 
                "circuito": "",
                "testesManuais": [] 
            })

        agora = obter_agora()
        nova_exp = {
            "idExperiencia": codigo_exp,
            "idSolicitacao": id_solic,
            "dataGeracao": agora.strftime("%d/%m/%Y %H:%M"),
            "status": "configurando", 
            "amostras": amostras, 
            "dadosTecnicos": {
                "solicitante": solic_data.get("nomeSolicitante", ""),
                "modelo": solic_data.get("modeloAmostras", solic_data.get("nomeProduto", "")),
                "tipoBateria": solic_data.get("tipoBateria", ""),
                "cca": solic_data.get("cca", ""),
                "rc": solic_data.get("rc", ""),
                "capacidade": solic_data.get("capacidadeNominal", ""),
                "densidade": solic_data.get("densidade", ""),
                "separador": solic_data.get("separador", ""),
                "placaPos": solic_data.get("placaPos", ""),
                "placaNeg": solic_data.get("placaNeg", "")
            }
        }

        bd_firestore.collection('experiencias').document(codigo_exp).set(nova_exp)
        update_data = {
            "status": "analise",
            "experiencia": codigo_exp,
            "previsaoFinal": dados.get('previsaoFinal', ''),
            "observacoes": dados.get('observacoes', ''),
            "dataAprovacao": agora.strftime("%d/%m/%Y %H:%M")
        }
        bd_firestore.collection('solicitacoes').document(id_solic).update(update_data)

        return jsonify({"sucesso": True, "message": f"Lote {codigo_exp} gerado com {qtd_amostras} amostras!"})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500