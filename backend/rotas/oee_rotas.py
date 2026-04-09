
import os
from datetime import datetime
from flask import Blueprint, request, jsonify


from .autenticacao import requer_autenticacao, requer_permissao


diretorio_base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA_UPLOAD_OEE = os.path.join(diretorio_base, 'oee_uploads')
os.makedirs(PASTA_UPLOAD_OEE, exist_ok=True)


servico_oee = None
try:
    import oee_service as servico_oee
except ImportError:
    print("Aviso crítico: Módulo oee_service.py não encontrado.")

bp_oee = Blueprint('oee', __name__)

@bp_oee.route('/upload', methods=['POST'])
@requer_autenticacao
@requer_permissao('oee')
def processar_upload():
   
    if not servico_oee: 
        return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"}), 503
        
    arquivo = request.files.get('file')
    mes = request.form.get('mes')
    ano = request.form.get('ano')
    
    if not arquivo:
        return jsonify({"sucesso": False, "erro": "Nenhum arquivo enviado."}), 400
        
    caminho_arquivo = os.path.join(PASTA_UPLOAD_OEE, f"up_{int(datetime.now().timestamp())}.xlsx")
    arquivo.save(caminho_arquivo)
    
    try: 
        resultado = servico_oee.processar_upload_oee(caminho_arquivo, mes, ano)
    finally: 
       
        if os.path.exists(caminho_arquivo): 
            os.remove(caminho_arquivo)
            
    return jsonify(resultado)

@bp_oee.route('/calcular', methods=['POST'])
@requer_autenticacao
def calcular_indicadores():
   
    if not servico_oee: 
        return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"})
    
  
    parametros = request.json
    return jsonify(servico_oee.calcular_indicadores_oee(parametros))

@bp_oee.route('/salvar_historico', methods=['POST'])
@requer_autenticacao
@requer_permissao('oee') 
def salvar_historico():
    
    if not servico_oee: 
        return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"})
        
    dados = request.json
    kpi = dados.get('kpi')
    mes = dados.get('mes')
    ano = dados.get('ano')
    justificativa = dados.get('justificativa', '')
    
    resultado = servico_oee.save_history(kpi, mes, ano, justificativa)
    return jsonify(resultado)

@bp_oee.route('/history', methods=['GET'])
@requer_autenticacao

def listar_historico():
   
    if not servico_oee: 
        return jsonify({"sucesso": False, "historico": []})
        
    return jsonify(servico_oee.listar_historico())

@bp_oee.route('/deletar_historico', methods=['POST'])
@requer_autenticacao
@requer_permissao('oee') 
def deletar_historico():
   
    if not servico_oee: 
        return jsonify({"sucesso": False, "erro": "Serviço Offline"})
        
    dados = request.json
    mes = dados.get('mes')
    ano = dados.get('ano')
    
    resultado = servico_oee.delete_history_record(mes, ano)
    return jsonify(resultado)