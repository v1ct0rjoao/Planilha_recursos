import traceback
from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from .autenticacao import requer_autenticacao
from configuracao import bd_firestore
from utilitarios import obter_agora

bp_solicitacoes = Blueprint('solicitacoes', __name__)

@bp_solicitacoes.route('/listar', methods=['GET', 'OPTIONS'])
@requer_autenticacao
def listar_solicitacoes():
    if request.method == 'OPTIONS': return jsonify({}), 200
    if not bd_firestore: return jsonify({"sucesso": False, "erro": "Firestore não conectado"}), 500

    try:
        solicitacoes_ref = bd_firestore.collection('solicitacoes').order_by('dataCriacao', direction='DESCENDING')
        docs = solicitacoes_ref.get()
        
        resultados = []
        for doc in docs:
            dados = doc.to_dict()
            if 'idSolicitacao' not in dados: dados['idSolicitacao'] = doc.id
            resultados.append(dados)
            
        return jsonify({"sucesso": True, "data": resultados})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_solicitacoes.route('/adicionar', methods=['POST', 'OPTIONS'])
@requer_autenticacao
def adicionar_solicitacao():
    if request.method == 'OPTIONS': return jsonify({}), 200
    if not bd_firestore: return jsonify({"sucesso": False, "erro": "Firestore não conectado"}), 500
        
    try:
        dados = request.json
        id_doc = dados.get('idSolicitacao')
        
        doc_ref = bd_firestore.collection('solicitacoes').document(id_doc).get()
        if doc_ref.exists:
            return jsonify({"sucesso": False, "erro": "Este ID de solicitação já existe. Tente novamente."}), 400

        agora = obter_agora()
        dados['dataCriacao'] = agora.strftime("%d/%m/%Y %H:%M")
        dados['status'] = 'pendente'
        
        bd_firestore.collection('solicitacoes').document(id_doc).set(dados)
        return jsonify({"sucesso": True, "message": "Solicitação criada com sucesso!"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500
    
@bp_solicitacoes.route('/update', methods=['POST', 'OPTIONS'])
@requer_autenticacao
def atualizar_solicitacao():
    if request.method == 'OPTIONS': return jsonify({}), 200
    if not bd_firestore: return jsonify({"sucesso": False, "erro": "Firestore não conectado"}), 500

    try:
        requisicao = request.json
        id_solicitacao = requisicao.get('id')
        dados_novos = requisicao.get('dados')

        if not id_solicitacao or not dados_novos:
            return jsonify({"sucesso": False, "erro": "Dados incompletos"}), 400

        doc_ref = bd_firestore.collection('solicitacoes').document(id_solicitacao)
        agora = obter_agora()

        doc_snap = doc_ref.get()
        if not doc_snap.exists:
            return jsonify({"sucesso": False, "erro": "Solicitação não encontrada"}), 404
        
        dados_atuais = doc_snap.to_dict()
        dados_update = dados_novos.copy()
        dados_update['dataMovimentacao'] = agora.isoformat()

        # Dicionário de monitoramento: Adicionamos os campos do painel de controle!
        campos_monitorados = {
            'tituloProjeto': 'Projeto/Motivo',
            'nomeSolicitante': 'Nome Solicitante',
            'laboratorio': 'Laboratório',
            'modeloAmostras': 'Modelo',
            'qtdAmostras': 'Qtd. Amostras',
            'codigoSap': 'Código SAP',
            'objetivoEnsaio': 'Objetivo do Ensaio',
            'tituloNorma': 'Norma/Procedimento',
            'descricao': 'Descrição/Escopo',
            'capacidadeNominal': 'Capacidade Nominal',
            'cca': 'CCA',
            'rc': 'RC',
            'densidade': 'Densidade',
            'nivelEletrolito': 'Nível do Eletrólito',
            'separador': 'Separador',
            'placaPos': 'Placa (+)',
            'placaNeg': 'Placa (-)',
            'tipoBateria': 'Tipo de Bateria',
            'tipoProcedimento': 'Tipo de Procedimento',
            'tipoEnsaioMecanico': 'Tipo Ensaio Mecânico',
            'composicaoLiga': 'Composição Liga',
            'analiseSolicitada': 'Análise Solicitada',
            'dadosAmostra': 'Dados Amostra',
            'caracteristicaAmostra': 'Característica Amostra',
            'lote': 'Lote',
            'fornecedor': 'Fornecedor',
            'notaFiscal': 'Nota Fiscal',
            'especificacaoTeste': 'Especificação Teste',
            
            # --- NOVOS CAMPOS PARA RASTREAR MUDANÇAS DE STATUS E DATAS ---
            'status': 'Status Operacional',
            'responsavel': 'Responsável pela Agenda',
            'experiencia': 'ID da Experiência LIMS',
            'dataInicio': 'Início do Ensaio',
            'dataFim': 'Finalização Estimada',
            'dataEntrega': 'Previsão de Relatório'
        }
        
        alteracoes_feitas = []
        
        for campo, label in campos_monitorados.items():
            if campo in dados_novos and str(dados_novos[campo]).strip() != str(dados_atuais.get(campo, '')).strip():
                valor_antigo = dados_atuais.get(campo, 'Vazio')
                if not valor_antigo: valor_antigo = 'Vazio'
                valor_novo = dados_novos[campo]
                if not valor_novo: valor_novo = 'Vazio'
                alteracoes_feitas.append(f"{label}: de '{valor_antigo}' para '{valor_novo}'")
                
        if alteracoes_feitas:
            autor_nome = getattr(request, 'usuario', {}).get('name') or getattr(request, 'usuario', {}).get('email', '').split('@')[0] if hasattr(request, 'usuario') else 'Administração'
            nova_edicao = {
                "id": str(int(agora.timestamp() * 1000)),
                "autor": autor_nome,
                "data": agora.strftime("%d/%m/%Y %H:%M"),
                "alteracoes": alteracoes_feitas
            }
            if 'historicoEdicoes' in dados_atuais:
                dados_update['historicoEdicoes'] = dados_atuais['historicoEdicoes'] + [nova_edicao]
            else:
                dados_update['historicoEdicoes'] = [nova_edicao]

        doc_ref.update(dados_update)
        return jsonify({"sucesso": True, "data": {"id": id_solicitacao, "agora": agora.isoformat()}})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

@bp_solicitacoes.route('/share', methods=['POST', 'OPTIONS'])
@requer_autenticacao
def compartilhar_solicitacao():
    if request.method == 'OPTIONS': return jsonify({}), 200
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

@bp_solicitacoes.route('/experiencias/gerar', methods=['POST', 'OPTIONS'])
@requer_autenticacao
def gerar_experiencia():
    if request.method == 'OPTIONS': return jsonify({}), 200
    if not bd_firestore: return jsonify({"sucesso": False, "erro": "Firestore não conectado"}), 500
    
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
            "status": "Programado",
            "experiencia": codigo_exp,
            "previsaoFinal": dados.get('previsaoFinal', ''),
            "observacoes": dados.get('observacoes', ''),
            "dataAprovacao": agora.strftime("%d/%m/%Y %H:%M"),
            "dataMovimentacao": agora.isoformat()
        }
        bd_firestore.collection('solicitacoes').document(id_solic).update(update_data)

        return jsonify({"sucesso": True, "message": f"Lote {codigo_exp} gerado com {qtd_amostras} amostras!"})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500