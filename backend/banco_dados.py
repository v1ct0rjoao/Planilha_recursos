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

def salvar_bd(dados):
    global CACHE_DADOS
    CACHE_DADOS = dados
    
    if not bd_firestore: 
        return True
        
    try:
        solicitantes = {}
        for chave, valor in dados.get("experienceOwners", {}).items():
            chave_segura = str(chave).replace('/', '_')
            solicitantes[chave_segura] = valor
            
        # PADRONIZAÇÃO: Salva sempre como 'baths' para o React ler corretamente
        dados_para_salvar = {
            "baths": dados.get("baths", []),
            "protocols": dados.get("protocols", []),
            "experienceOwners": solicitantes
        }
        
        bd_firestore.collection('lab_data').document('main').set(dados_para_salvar)
        return True
    except Exception as erro:
        print(f"Erro ao salvar banco: {erro}")
        return False

def carregar_bd():
    global CACHE_DADOS
    if CACHE_DADOS is not None: 
        return CACHE_DADOS
    
    esquema_vazio = {"baths": [], "protocols": [], "logs": [], "experienceOwners": {}}
    if not bd_firestore: 
        return esquema_vazio
    
    try:
        documento = bd_firestore.collection('lab_data').document('main').get()
        dados = esquema_vazio.copy()
        
        if documento.exists:
            dados_principais = documento.to_dict()
            
            # MIGRAÇÃO INTELIGENTE: Tenta ler 'baths', se não achar, busca em 'banhos'
            # Assim você não perde os dados que já estão cadastrados
            dados["baths"] = dados_principais.get("baths", dados_principais.get("banhos", []))
            
            # Faz o mesmo para protocolos, caso esteja em português no banco
            dados["protocols"] = dados_principais.get("protocols", dados_principais.get("protocolos", []))
            
            if "experienceOwners" in dados_principais:
                solicitantes_restaurados = {}
                for chave, valor in dados_principais["experienceOwners"].items():
                    chave_restaurada = str(chave).replace('_', '/')
                    solicitantes_restaurados[chave_restaurada] = valor
                dados["experienceOwners"] = solicitantes_restaurados
        
        query_logs = bd_firestore.collection('lab_logs').order_by('id', direction=firestore.Query.DESCENDING).limit(500).get()
        dados["logs"] = [doc.to_dict() for doc in query_logs]
        
        CACHE_DADOS = dados
        return dados
    except Exception as e:
        print(f"Erro ao carregar banco: {e}")
        return esquema_vazio