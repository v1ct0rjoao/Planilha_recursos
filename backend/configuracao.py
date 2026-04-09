#gerenciar credencias e iniciar conexao com banco de dados 
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# descobre a pasta raiz do projeto automaticamente
diretorio_base = os.path.dirname(os.path.abspath(__file__))

def inicializar_firebase():
   
    variavel_ambiente = os.getenv("FIREBASE_CREDENTIALS")
    credencial = None
    
    try:
        if variavel_ambiente:
           
            dicionario_credencial = json.loads(variavel_ambiente)
            credencial = credentials.Certificate(dicionario_credencial)
        else:
            
            arquivos_possiveis = ['firebase_credentials.json', 'serviceAccountKey.json']
            for nome_arquivo in arquivos_possiveis:
                caminho = os.path.join(diretorio_base, nome_arquivo)
                if os.path.exists(caminho):
                    credencial = credentials.Certificate(caminho)
                    break
                    
        if credencial:
         
            if not firebase_admin._apps:
                firebase_admin.initialize_app(credencial)
            return firestore.client()
            
    except Exception as erro:
        print(f"Aviso: Erro ao conectar com Firebase - {erro}")
        
    return None


bd_firestore = inicializar_firebase()