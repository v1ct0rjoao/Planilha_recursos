from firebase_admin import firestore
from configuracao import bd_firestore 

CACHE_DADOS = None 

def salvar_log_no_bd(entrada_log):
    if not bd_firestore: 
        return
    try:
        bd_firestore.collection('lab_logs').document(str(entrada_log['id'])).set(entrada_log)
    except Exception as erro:
        print(f"Erro ao salvar log: {erro}")

def salvar_log_circuito(entrada_log):
    if not bd_firestore: 
        return
    try:
        bd_firestore.collection('circuit_logs').document(str(entrada_log['id'])).set(entrada_log)
    except Exception as erro:
        print(f"Erro ao salvar log de circuito: {erro}")

def carregar_bd():
    try:
        doc = bd_firestore.collection('lab_data').document('main').get()
        if doc.exists:
            dados = doc.to_dict()
            if 'experienceOwners' in dados:
                dados['experienceOwners'] = {str(k).replace('_', '/'): v for k, v in dados['experienceOwners'].items()}
            return dados
    except Exception as e:
        print("Erro ao carregar BD:", e)
    
    return {"baths": [], "protocols": [], "logs": [], "experienceOwners": {}}

def salvar_bd(db):
    try:
        dados_salvar = db.copy()
        if 'experienceOwners' in dados_salvar:
            donos_seguros = {}
            for k, v in dados_salvar['experienceOwners'].items():
                chave_segura = str(k).replace('/', '_')
                donos_seguros[chave_segura] = v
            dados_salvar['experienceOwners'] = donos_seguros
            
        bd_firestore.collection('lab_data').document('main').set(dados_salvar)
    except Exception as e:
        raise Exception(f"Erro ao salvar no banco de dados: {str(e)}")