from flask import request, jsonify
from firebase_admin import auth as firebase_auth
from functools import wraps
from configuracao import bd_firestore
from utilitarios import obter_agora

PRESETS_PERFIS = {
    'admin': ['dashboard', 'nova_solicitacao', 'meus_acompanhamentos', 'baterias', 'acompanhamento', 'lims', 'bancada', 'oee', 'history', 'protocolos', 'calendar', 'users', 'configuracoes', 'import_digatron'],
    'gestor': ['dashboard', 'nova_solicitacao', 'meus_acompanhamentos', 'baterias', 'acompanhamento', 'lims', 'bancada', 'oee', 'history', 'protocolos', 'calendar', 'users', 'configuracoes'],
    'lider': ['dashboard', 'nova_solicitacao', 'meus_acompanhamentos', 'baterias', 'acompanhamento', 'lims', 'bancada', 'oee', 'history', 'protocolos', 'calendar', 'users', 'configuracoes'],
    'programacao_adm': ['dashboard', 'nova_solicitacao', 'acompanhamento', 'lims', 'oee', 'history', 'protocolos', 'calendar'],
    'programacao_relatorio': ['history', 'acompanhamento', 'lims'],
    'tecnico': ['dashboard', 'nova_solicitacao', 'lims', 'bancada', 'calendar', 'import_digatron'],
    'cliente': ['nova_solicitacao', 'meus_acompanhamentos', 'baterias']
}

def requer_autenticacao(funcao_rota):
    @wraps(funcao_rota)
    def funcao_decorada(*args, **kwargs):
        if request.method == 'OPTIONS':
            return jsonify({}), 200
            
        cabecalho_auth = request.headers.get('Authorization')
        
        if not cabecalho_auth or not cabecalho_auth.startswith('Bearer '):
            return jsonify({"sucesso": False, "erro": "Acesso negado. Token não fornecido."}), 401
            
        token = cabecalho_auth.split(' ')[1]
        
        try:
            token_decodificado = firebase_auth.verify_id_token(token)
            request.usuario = token_decodificado 
        except Exception as e:
            return jsonify({"sucesso": False, "erro": "Sessão inválida ou expirada."}), 403
            
        return funcao_rota(*args, **kwargs)
        
    return funcao_decorada

def requer_permissao(permissao_necessaria):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
           
         
            usuario_token = getattr(request, 'usuario', {}) 
            uid = usuario_token.get('uid')
            
            if not uid:
                return jsonify({"sucesso": False, "erro": "Usuário não autenticado"}), 401
                
            doc_ref = bd_firestore.collection('users').document(uid).get()
            if not doc_ref.exists:
                return jsonify({"sucesso": False, "erro": "Usuário não encontrado no sistema"}), 403
                
            dados_usuario = doc_ref.to_dict()
            permissoes = dados_usuario.get('permissions', [])
            role = dados_usuario.get('role', 'cliente')
            
            if role == 'admin' or permissao_necessaria in permissoes:
                return f(*args, **kwargs)
            else:
                return jsonify({"sucesso": False, "erro": f"Acesso negado. Requer módulo: {permissao_necessaria}"}), 403
                
        return decorated_function
    return decorator