# ==========================================
# ARQUIVO: app.py
# ==========================================

# Aqui eu importo o Flask para criar o servidor web e as ferramentas para lidar com requisições JSON e arquivos estáticos.
from flask import Flask, request, jsonify, send_from_directory
# Importo o CORS para permitir que o meu frontend em React (que roda em outra porta) consiga conversar com esse backend em Python.
from flask_cors import CORS
# Importo a biblioteca os para lidar com caminhos de pastas e arquivos no sistema operacional.
import os
# Importo o json para ler variáveis de ambiente e arquivos de configuração.
import json
# Importo o re (Expressões Regulares) para ajudar a limpar textos e extrair números (como os IDs dos circuitos).
import re
# Importo o datetime para trabalhar com datas, horas e fuso horário.
from datetime import datetime, timedelta, timezone
# Importo as bibliotecas do Firebase para conectar o backend ao banco de dados na nuvem (Firestore).
import firebase_admin
from firebase_admin import credentials, firestore
# Importo o traceback para conseguir imprimir os erros completos no console caso algo dê errado no servidor.
import traceback

# Aqui eu defino o diretório base, que é a pasta onde este arquivo app.py está rodando.
base_dir = os.path.dirname(os.path.abspath(__file__))
# Eu defino o caminho da pasta 'dist', que é onde ficam os arquivos de build do meu frontend em React.
DIST_DIR = os.path.join(base_dir, 'dist') 
# Crio uma pasta chamada 'oee_uploads' para salvar temporariamente as planilhas do Digatron que o pessoal faz upload.
OEE_UPLOAD_FOLDER = os.path.join(base_dir, 'oee_uploads') 

# Se a pasta 'dist' não existir no diretório atual, eu procuro ela um nível acima (ajuda dependendo de como rodo o servidor).
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(os.path.dirname(base_dir), 'dist')

# Se a pasta de uploads do OEE não existir, eu peço para o Python criar ela automaticamente.
if not os.path.exists(OEE_UPLOAD_FOLDER):
    os.makedirs(OEE_UPLOAD_FOLDER, exist_ok=True)

# Inicializo a minha aplicação Flask e indico onde estão os arquivos estáticos do React.
app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')

# Configuro o CORS para aceitar requisições da minha rota '/api/*', vindo de qualquer origem ('*'), permitindo credenciais.
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Crio variáveis globais. A 'db_firestore' vai guardar a conexão com o banco.
db_firestore = None
# A 'DATA_CACHE' vai guardar os dados em memória (RAM) para o sistema ficar mais rápido e não bater no Firebase toda hora.
DATA_CACHE = None 

# Aqui eu tento buscar as credenciais do Firebase nas variáveis de ambiente do servidor (útil quando faço deploy).
firebase_env = os.getenv("FIREBASE_CREDENTIALS")

# Bloco try-except para tentar conectar ao Firebase sem quebrar o app se der erro.
try:
    cred = None
    # Se a variável de ambiente existir, eu carrego ela.
    if firebase_env:
        cred_dict = json.loads(firebase_env)
        cred = credentials.Certificate(cred_dict)
    else:
        # Se não tiver variável de ambiente, eu procuro o arquivo JSON com a chave do Firebase na minha pasta local.
        possible_keys = ['firebase_credentials.json', 'serviceAccountKey.json']
        for key_file in possible_keys:
            key_path = os.path.join(base_dir, key_file)
            if os.path.exists(key_path):
                # Se eu achar o arquivo, eu configuro as credenciais com ele.
                cred = credentials.Certificate(key_path)
                break

    # Se eu consegui as credenciais (seja por ambiente ou arquivo)...
    if cred:
        # Eu verifico se o Firebase já não foi inicializado (para não dar erro de duplicidade).
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        # Guardo a conexão do Firestore na minha variável global.
        db_firestore = firestore.client()
        print("[INFO] Ligação ao Firebase estabelecida com SUCESSO.")
    else:
        # Se eu não achar nada, o sistema não cai, mas avisa que vai rodar só na memória RAM.
        print("[WARN] Credenciais não encontradas. O sistema rodará apenas na RAM.")
except Exception as e:
    # Se der um erro crítico na conexão, eu imprimo para debugar depois.
    print(f"[ERROR] Falha crítica na ligação ao Firebase: {e}")

# Aqui eu preparo a importação do meu módulo separado de OEE.
oee_service = None
try:
    try:
        # Tento importar da pasta backend (depende de onde o script é executado).
        from backend import oee_service
    except ImportError:
        # Se falhar, tento importar diretamente da mesma pasta.
        import oee_service
except ImportError:
    # Se o arquivo não existir, eu simplesmente ignoro para o app não quebrar.
    pass

# Esse decorador serve para capturar qualquer erro interno do servidor (erro 500) de forma global.
@app.errorhandler(Exception)
def handle_exception(e):
    # Eu imprimo o erro completo no terminal da máquina.
    traceback.print_exc()
    # E devolvo um JSON amigável para o frontend não ficar sem resposta, mostrando qual foi o erro.
    return jsonify({"sucesso": False, "erro": str(e)}), 500

# Função que eu criei para salvar as ações dos usuários (logs) direto no Firebase.
def save_log_to_db(log_entry):
    if not db_firestore: return
    try:
        # Eu pego a coleção 'lab_logs', crio um documento com o ID da ação e salvo os dados lá.
        db_firestore.collection('lab_logs').document(str(log_entry['id'])).set(log_entry)
        print(f"[LOG SALVO] {log_entry['action']} - {log_entry['details']}")
    except Exception as e:
        print(f"[ERRO LOG] Falha ao salvar log no Firebase: {e}")

# Função para salvar todo o estado atual dos banhos, circuitos e protocolos no banco.
def save_db(data):
    global DATA_CACHE
    # Atualizo o meu cache em memória primeiro.
    DATA_CACHE = data
    if not db_firestore: return True
    try:
        # Monto o objeto que vai para o banco (baths, protocols e donos das experiências).
        data_to_save = {
            "baths": data.get("baths", []),
            "protocols": data.get("protocols", []),
            "experienceOwners": data.get("experienceOwners", {})
        }
        # Salvo tudo na coleção 'lab_data', no documento principal chamado 'main'.
        db_firestore.collection('lab_data').document('main').set(data_to_save)
        print(f"[BANCO SALVO] Modificações gravadas no Firestore com sucesso!")
        return True
    except Exception as e:
        print(f"[ERRO FIREBASE] Falha ao gravar no documento main: {e}")
        return False

# Função que eu criei para carregar os dados quando o servidor inicia ou a página atualiza.
def load_db():
    global DATA_CACHE
    # Se eu já tenho os dados no cache, retorno rápido sem bater no Firebase (economiza leitura).
    if DATA_CACHE is not None: return DATA_CACHE
    
    # Crio o esquema padrão vazio caso o banco não tenha nada.
    empty_schema = {"baths": [], "protocols": [], "logs": [], "experienceOwners": {}}
    if not db_firestore: return empty_schema
    
    try:
        # Faço a requisição lá no Firestore para pegar o documento principal.
        doc = db_firestore.collection('lab_data').document('main').get()
        data = empty_schema.copy()
        
        # Se o documento existir, eu pego as listas e atualizo minha variável local.
        if doc.exists:
            main_data = doc.to_dict()
            for key in ["baths", "protocols", "experienceOwners"]:
                if key in main_data:
                    data[key] = main_data[key]
        
        # Puxo os últimos 500 logs da coleção separada 'lab_logs', ordenando do mais novo pro mais velho.
        logs_query = db_firestore.collection('lab_logs').order_by('id', direction=firestore.Query.DESCENDING).limit(500).get()
        data["logs"] = [doc.to_dict() for doc in logs_query]
        
        # Salvo tudo no cache para os próximos acessos.
        DATA_CACHE = data
        print("[INFO] Banco de dados carregado do Firebase com sucesso.")
        return data
    except Exception as e:
        print(f"[ERRO FIREBASE] Erro ao carregar banco: {e}")
        return empty_schema

# Função utilitária minha para limpar strings e deixar só os números (ótimo para os IDs dos circuitos que vêm sujos).
def apenas_numeros(texto):
    return re.sub(r'\D', '', str(texto))

# Função inteligente que compara o texto bagunçado da planilha do Digatron com os meus protocolos do banco.
def identificar_nome_padrao(linha, db_protocols=[]):
    # Padronizo tudo: deixo maiúsculo e tiro espaços e traços para facilitar a busca.
    texto_limpo = str(linha).upper().replace('_', '').replace('-', '').replace(' ', '')
    # Ordeno meus protocolos do maior para o menor nome para não ter falso positivo.
    protocolos_ordenados = sorted(db_protocols, key=lambda p: len(p['name']), reverse=True)
    
    # Se eu achar o nome de um protocolo meu dentro daquela linha do Digatron, eu retorno o nome limpo.
    for p in protocolos_ordenados:
        nome_db = str(p['name']).upper().replace('_', '').replace('-', '').replace(' ', '')
        if nome_db and nome_db in texto_limpo:
            return p['name']
    return "Desconhecido"

# Aqui eu calculo quando o teste vai acabar baseado na data de início e na duração em horas do protocolo.
def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    protocolos_ordenados = sorted(db_protocols, key=lambda p: len(p['name']), reverse=True)
    duracao = 0
    # Descubro quantas horas o protocolo exige.
    for p in protocolos_ordenados:
        if p['name'].upper() in nome_protocolo.upper():
            duracao = p['duration']
            break
            
    if duracao == 0: return "A calcular"
    try:
        # Converto a string de início para Data, somo as horas e converto para string de novo.
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except: return "-"

# Essa é uma sacada legal: atualizo a barra de progresso (em %) dos circuitos em tempo real.
def atualizar_progresso_realtime(db):
    global DATA_CACHE
    # Pego o horário de agora (fuso de Brasília, -3).
    agora = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)
    mudou = False
    
    # Varro todos os banhos e circuitos...
    for bath in db.get('baths', []):
        for c in bath.get('circuits', []):
            # Se o circuito estiver rodando um teste...
            if c.get('status') == 'running':
                try:
                    # Calculo o total de tempo e quanto tempo já passou.
                    ini = datetime.strptime(c.get('startTime'), "%d/%m/%Y %H:%M")
                    fim = datetime.strptime(c.get('previsao'), "%d/%m/%Y %H:%M")
                    total = (fim - ini).total_seconds()
                    passado = (agora - ini).total_seconds()
                    
                    # Se o tempo atual já passou a previsão, eu finalizo o teste.
                    if agora >= fim:
                        c.update({'status': 'finished', 'progress': 100})
                        mudou = True
                    else:
                        # Se não, eu calculo a porcentagem da barra e atualizo.
                        percent = round(max(0, min(99.9, (passado / total) * 100)), 1)
                        c['progress'] = percent
                        DATA_CACHE = db 
                except: pass
            # Garanto que se estiver como finalizado, a barra fica em 100%.
            elif c.get('status') == 'finished' and c.get('progress') != 100:
                c['progress'] = 100
                mudou = True

    # Se teve alguma alteração de progresso, eu chamo a função para salvar no banco.
    if mudou: save_db(db)

# ----------------- ROTAS DA API REST ----------------- #

# Rota simples de teste para ver se minha API está viva (status check).
@app.route('/api', methods=['GET'])
def api_ping():
    return jsonify({"status": "online", "message": "LabManager API v2.2"})

# Rota principal que o frontend chama quando carrega a tela. Devolve tudo: banhos, circuitos, etc.
@app.route('/api/data', methods=['GET'])
def get_main_data():
    db = load_db()
    # Aproveito e calculo as barras de progresso antes de mandar pro React.
    atualizar_progresso_realtime(db)
    return jsonify(db)

# Uma rota de manutenção que eu criei para separar os logs do documento principal e colocar na coleção própria.
@app.route('/api/migrate_logs', methods=['GET'])
def migrate_logs():
    if not db_firestore:
        return jsonify({"sucesso": False, "erro": "Firestore não conectado"})
        
    try:
        doc_ref = db_firestore.collection('lab_data').document('main')
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({"sucesso": False, "erro": "Documento main não encontrado"})
            
        data = doc.to_dict()
        old_logs = data.get('logs', [])
        
        if not old_logs:
            return jsonify({"sucesso": True, "message": "Nenhum log para migrar no documento main"})
            
        # Uso 'batch' do Firebase para enviar vários dados de uma vez só, não sobrecarregando a rede.
        batch = db_firestore.batch()
        migrated_count = 0
        
        for log in old_logs:
            log_id = str(log.get('id', int(datetime.now().timestamp() * 1000) + migrated_count))
            log['id'] = int(log_id)
            log_ref = db_firestore.collection('lab_logs').document(log_id)
            batch.set(log_ref, log)
            migrated_count += 1
            
            # A cada 400 logs, eu dou um commit pro banco aceitar o pacote.
            if migrated_count % 400 == 0:
                batch.commit()
                batch = db_firestore.batch()
                
        batch.commit()
        
        # Limpo a lista velha do documento main.
        doc_ref.update({"logs": firestore.DELETE_FIELD})
        
        # Limpo o cache para forçar ele a buscar a versão nova na próxima vez.
        global DATA_CACHE
        DATA_CACHE = None
        
        return jsonify({"sucesso": True, "message": f"{migrated_count} logs migrados com sucesso!"})
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota pesada (ATUALIZADA): A de importar dados colados do Digatron.
@app.route('/api/import', methods=['POST'])
def import_digatron_data():
    try:
        data = request.json
        text = data.get('text', '')
        if not text: return jsonify({'sucesso': False, 'erro': 'Texto vazio'}), 400
        
        db = load_db()
        protocols = db.get('protocols', [])
        
        # Puxo o dicionário de donos de experiências do banco para fazer o cruzamento!
        experience_owners = db.get('experienceOwners', {})
        
        atualizados = []
        detalhes_importacao = [] # Criei esse array para agrupar tudo em um log só
        
        # Uso regex para caçar a palavra "Circuit", o número e a data de início lá no meio do texto colado.
        matches = re.finditer(r"Circuit\s*0*(\d+).*?(\d{2}/\d{2}/\d{4}\s\d{2}:\d{2})", text, re.IGNORECASE)
        
        for m in matches:
            cid_num, t_start = m.group(1), m.group(2)
            end_line = text.find('\n', m.end())
            # Pego a linha inteira para procurar bateria e protocolo.
            line = text[m.start():end_line if end_line != -1 else len(text)]
            
            # Outra regex para achar o ID da bateria da Moura (ex: 12345-E123-26).
            bat_match = re.search(r"(\d{5,}-[\w-]+)", line)
            bat_id = bat_match.group(1) if bat_match else "Desconhecido"
            
            # Passo a linha no meu identificador para ele tentar adivinhar o protocolo.
            proto_name = identificar_nome_padrao(line, protocols)
            t_prev = calcular_previsao_fim(t_start, proto_name, protocols)
            
            # ==== CRUZAMENTO INTELIGENTE COM BANCO DE DADOS ====
            dono = "Sem Dono"
            parts = bat_id.split('-')
            
            # Se for uma bateria série E, eu separo o código para achar o solicitante
            if len(parts) >= 2 and parts[1].upper().startswith('E'):
                expCode = parts[1].upper()
                baseCode = expCode
                
                # Trato a lógica de concatenar o ano (Ex: E123/26) para ficar igual ao banco
                if len(parts) >= 3:
                    anoLimpo = parts[2].split('_')[0]
                    expCode = f"{expCode}/{anoLimpo}"
                
                # Procuro o "E123/26". Se não tiver, tento o "E123". Se não achar, fica "Sem Dono".
                dono = experience_owners.get(expCode, experience_owners.get(baseCode, "Sem Dono"))
            # ===================================================

            # Aqui eu caço o circuito dentro dos banhos para atualizar ele.
            for bath in db['baths']:
                for c in bath['circuits']:
                    # Limpo as letras para bater apenas número com número.
                    if apenas_numeros(c['id']) == apenas_numeros(cid_num):
                        c.update({
                            'status': 'running', 'startTime': t_start, 'previsao': t_prev,
                            'batteryId': bat_id, 'protocol': proto_name, 'progress': 0
                        })
                        atualizados.append(c['id'])
                        
                        # Ao invés de salvar no banco agora, eu guardo a string formatada!
                        # Vai ficar assim: "C-12 (E123/26 | Adriana)"
                        detalhes_importacao.append(f"C-{cid_num} ({bat_id} | Solicitante: {dono})")
        
        # ==== SALVANDO O LOG AGRUPADO ====
        # Se eu atualizei pelo menos 1 circuito, eu gero um ÚNICO registro de log
        if atualizados:
            agora = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)
            
            # Junto todas as frases do array separando por vírgula
            detalhes_str = ", ".join(detalhes_importacao)
            
            # Se a pessoa colou 50 circuitos, o texto vai ficar gigante e quebrar o layout do front.
            # Então eu corto no caractere 250 e coloco reticências.
            if len(detalhes_str) > 250:
                 detalhes_str = detalhes_str[:247] + "..."
                 
            new_log = {
                "id": int(agora.timestamp() * 1000),
                "action": "Importação em Massa",
                "bath": "Vários", # Fica como 'Vários' porque a colagem pode atualizar banhos diferentes
                "date": agora.strftime("%d/%m/%Y %H:%M"),
                "details": f"Testes Iniciados: {detalhes_str}"
            }
            
            save_log_to_db(new_log)
            if 'logs' not in db: db['logs'] = []
            db['logs'].insert(0, new_log)
        # =================================

        save_db(db)
        # Devolvo pro frontend quais circuitos eu mexi para ele dar destaque na tela.
        return jsonify({"sucesso": True, "atualizados": atualizados, "db_atualizado": db})
    
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota para adicionar um novo banho.
@app.route('/api/baths/add', methods=['POST'])
def bath_add():
    d = request.json
    db = load_db()
    # Adiciono um banho novo vazio no array de baths.
    db['baths'].append({"id": d['bathId'], "temp": d.get('temp', 25), "circuits": []})
    db['baths'].sort(key=lambda x: x['id'])
    save_db(db)
    return jsonify({"sucesso": True, "db_atualizado": db})

# Rota para deletar um banho inteiro.
@app.route('/api/baths/delete', methods=['POST'])
def bath_delete():
    d = request.json
    db = load_db()
    # Refaço o array de banhos excluindo o que eu mandei deletar (filtro Python).
    db['baths'] = [b for b in db['baths'] if str(b['id']) != str(d['bathId'])]
    save_db(db)
    return jsonify({"sucesso": True, "db_atualizado": db})

# Rota para renomear um banho (caso eu tenha errado o nome ao criar).
@app.route('/api/baths/rename', methods=['POST'])
def bath_rename():
    try:
        d = request.json
        db = load_db()
        old_id = str(d['oldId'])
        new_id = str(d['newId'])
        found = False
        # Caço o banho velho e substituo pelo ID novo.
        for b in db['baths']:
            if str(b['id']) == old_id:
                b['id'] = new_id
                found = True
                break
        if found:
            save_db(db)
            return jsonify({"sucesso": True, "db_atualizado": db})
        return jsonify({"sucesso": False, "erro": "Banho não encontrado"}), 404
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota para alterar a temperatura do banho.
@app.route('/api/baths/temp', methods=['POST'])
def bath_update_temp():
    try:
        d = request.json
        db = load_db()
        bath_id = str(d['bathId'])
        new_temp = d['temp']
        for b in db['baths']:
            if str(b['id']) == bath_id:
                b['temp'] = new_temp
                break
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota para criar um circuito novo dentro de um banho.
@app.route('/api/circuits/add', methods=['POST'])
def circuit_add():
    try:
        d = request.json
        db = load_db()
        # Formato o nome para sempre ter o "C-" na frente do número se não tiver.
        cid = f"C-{d['circuitId']}" if not str(d['circuitId']).startswith("C-") else d['circuitId']
        for b in db['baths']:
            if str(b['id']) == str(d['bathId']):
                # Insiro o circuito zerado e livre.
                b['circuits'].append({"id": cid, "status": "free", "batteryId": None, "previsao": "-"})
                break
                
        # Faço o registro no log para eu saber quando adicionei.
        agora = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)
        new_log = {
            "id": int(agora.timestamp() * 1000),
            "action": "Adição",
            "bath": str(d['bathId']),
            "date": agora.strftime("%d/%m/%Y %H:%M"),
            "details": f"Circuito {cid} adicionado"
        }
        save_log_to_db(new_log)
        if 'logs' not in db: db['logs'] = []
        db['logs'].insert(0, new_log)
        
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota para deletar um circuito caso eu tenha criado errado ou o laboratório desativou ele.
@app.route('/api/circuits/delete', methods=['POST'])
def circuit_delete():
    try:
        d = request.json
        db = load_db()
        bath_id = str(d['bathId'])
        circuit_id = str(d['circuitId'])
        ckt_clean = apenas_numeros(circuit_id)
        
        # Filtro os circuitos dentro do banho específico, mantendo apenas os que não têm o ID que eu quero deletar.
        for b in db['baths']:
            if str(b['id']) == bath_id:
                b['circuits'] = [c for c in b['circuits'] if apenas_numeros(c['id']) != ckt_clean]
                break
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota super importante: Alterar o status na mão (Livrar, Colocar em Manutenção, etc).
@app.route('/api/circuits/status', methods=['POST'])
def update_circuit_status():
    try:
        d = request.json
        db = load_db()
        target_bath = str(d.get('bathId'))
        target_circuit = str(d.get('circuitId'))
        new_status = str(d.get('status')).lower() 
        
        # Ajusto casos específicos de status que criei pro meu front.
        if new_status == 'true': new_status = 'maintenance'
        if new_status == 'false': new_status = 'free'

        for b in db.get('baths', []):
            if str(b['id']) == target_bath:
                for c in b.get('circuits', []):
                    # Bato número com número para não ter erro na busca.
                    if int(apenas_numeros(c['id'])) == int(apenas_numeros(target_circuit)):
                        # Se eu pedir para livrar, eu apago todos os dados da bateria daquele circuito.
                        if new_status == 'free':
                            c.update({
                                'status': 'free', 'batteryId': None, 'protocol': None, 
                                'previsao': '-', 'startTime': None, 'progress': 0, 'isParallel': False
                            })
                        else:
                            # Se for outro status (ex: manutenção), eu só mudo a corzinha/status mesmo.
                            c['status'] = new_status
                            
                        # Gravo um log de alteração manual.
                        agora = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)
                        new_log = {
                            "id": int(agora.timestamp() * 1000),
                            "action": "Status Alterado",
                            "bath": target_bath,
                            "date": agora.strftime("%d/%m/%Y %H:%M"),
                            "details": f"Circuito {c['id']} alterado para {new_status}"
                        }
                        save_log_to_db(new_log)
                        if 'logs' not in db: db['logs'] = []
                        db['logs'].insert(0, new_log)
                        
                        break
        
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota para mover (arrastar e soltar) o circuito fisicamente para outro banho (Drag n Drop do React).
@app.route('/api/circuits/move', methods=['POST'])
def circuit_move():
    try:
        d = request.json
        db = load_db()
        src_bath_id = str(d['sourceBathId'])
        tgt_bath_id = str(d['targetBathId'])
        circuit_id = str(d['circuitId'])
        
        circuit_obj = None
        
        try:
            ckt_num = int(apenas_numeros(circuit_id))
        except:
            ckt_num = -1

        found_idx = -1
        src_bath_ref = None
        
        # Primeiro eu acho o circuito no banho de origem e removo ele (pop).
        for b in db['baths']:
            if str(b['id']) == src_bath_id:
                src_bath_ref = b
                for idx, c in enumerate(b['circuits']):
                    c_num = int(apenas_numeros(c['id'])) if apenas_numeros(c['id']) else -2
                    if c['id'] == circuit_id or c_num == ckt_num:
                        circuit_obj = c
                        found_idx = idx
                        break
                if found_idx != -1:
                    b['circuits'].pop(found_idx)
                    break
        
        if not circuit_obj:
             return jsonify({"sucesso": False, "erro": "Circuito não encontrado na origem"}), 404

        # Depois eu acho o banho de destino e coloco o circuito lá dentro (append).
        target_found = False
        for b in db['baths']:
            if str(b['id']) == tgt_bath_id:
                # Proteção para caso o circuito já exista lá com o mesmo nome.
                ids_existentes = [x['id'] for x in b['circuits']]
                if circuit_obj['id'] in ids_existentes:
                     circuit_obj['id'] = f"{circuit_obj['id']}_mov"
                
                b['circuits'].append(circuit_obj)
                # Reordeno a lista de circuitos no banho destino para ficar bonitinho.
                b['circuits'].sort(key=lambda x: int(apenas_numeros(x['id'])) if apenas_numeros(x['id']) else 999)
                target_found = True
                break
            
        # Se eu não achar o destino por algum bug, devolvo pro banho original para não sumir dados.
        if not target_found and src_bath_ref:
            src_bath_ref['circuits'].append(circuit_obj)
            return jsonify({"sucesso": False, "erro": "Banho de destino não encontrado"}), 404

        # Crio log da movimentação.
        agora = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)
        new_log = {
            "id": int(agora.timestamp() * 1000),
            "action": "Movimentação",
            "bath": tgt_bath_id,
            "date": agora.strftime("%d/%m/%Y %H:%M"),
            "details": f"Circuito {circuit_obj['id']} movido de {src_bath_id}"
        }
        save_log_to_db(new_log)
        if 'logs' not in db: db['logs'] = []
        db['logs'].insert(0, new_log)

        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota para linkar circuitos que testam bateria em paralelo (exemplo: dois circuitos pra aguentar a amperagem).
@app.route('/api/circuits/link', methods=['POST'])
def circuit_link():
    try:
        d = request.json
        db = load_db()
        bath_id = str(d['bathId'])
        source_id = str(d['sourceId'])
        target_id = str(d['targetId'])
        
        source_circuit = None
        target_circuit = None

        # Acho o principal e o secundário.
        for b in db['baths']:
            if str(b['id']) == bath_id:
                for c in b['circuits']:
                    if c['id'] == source_id: source_circuit = c
                    if c['id'] == target_id: target_circuit = c
                break
        
        if source_circuit and target_circuit:
            # Clono o teste inteiro do circuito 1 para o circuito 2.
            target_circuit['status'] = source_circuit['status']
            target_circuit['batteryId'] = source_circuit.get('batteryId')
            target_circuit['protocol'] = source_circuit.get('protocol')
            target_circuit['startTime'] = source_circuit.get('startTime')
            target_circuit['previsao'] = source_circuit.get('previsao')
            target_circuit['progress'] = source_circuit.get('progress', 0)
            
            # Marco as flag que criei pro meu front saber que eles são gêmeos.
            target_circuit['isParallel'] = True 
            source_circuit['isParallel'] = True 

            save_db(db)
            return jsonify({"sucesso": True, "db_atualizado": db})
        
        return jsonify({"sucesso": False, "erro": "Circuitos não encontrados"}), 404
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota para adicionar o cadastro de um protocolo novo e o tempo de ensaio dele.
@app.route('/api/protocols/add', methods=['POST'])
def protocol_add():
    d = request.json
    db = load_db()
    name = str(d.get('name')).upper()
    db['protocols'].append({"id": name, "name": name, "duration": int(d['duration'])})
    save_db(db)
    return jsonify({"sucesso": True, "db_atualizado": db})

# Rota para apagar protocolo da lista.
@app.route('/api/protocols/delete', methods=['POST'])
def protocol_delete():
    try:
        d = request.json
        db = load_db()
        p_id = d.get('id')
        db['protocols'] = [p for p in db['protocols'] if p['id'] != p_id]
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# Rota que fiz para atrelar a experiência (série E da bateria) a um usuário/solicitante da engenharia (seu gráfico de pizza usa isso).
@app.route('/api/experience/owners', methods=['POST'])
def update_experience_owner():
    try:
        data = request.json 
        db = load_db()
        
        if 'experienceOwners' not in db:
            db['experienceOwners'] = {}
            
        for exp_code, owner_name in data.items():
            db['experienceOwners'][exp_code] = owner_name
            
        save_db(db)
        return jsonify({"sucesso": True, "db_atualizado": db})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 500

# ================================
# ROTAS DO OEE (CHAMANDO MEU OEE_SERVICE)
# ================================

# Aqui eu recebo a planilha excel do React, salvo no servidor e mando pro meu oee_service processar e achar a disponibilidade.
@app.route('/api/oee/upload', methods=['POST'])
def oee_upload():
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"}), 503
    f = request.files['file']
    mes, ano = request.form.get('mes'), request.form.get('ano')
    path = os.path.join(OEE_UPLOAD_FOLDER, f"up_{int(datetime.now().timestamp())}.xlsx")
    f.save(path)
    try: 
        res = oee_service.processar_upload_oee(path, mes, ano)
    finally: 
        # Depois de ler o excel, eu apago para não lotar o disco do servidor da Moura.
        if os.path.exists(path): os.remove(path)
    return jsonify(res)

# Devolve a matemática bruta (Disp x Perf x Qual) pro React mostrar.
@app.route('/api/oee/calculate', methods=['POST'])
def oee_calculate():
    if not oee_service: return jsonify({})
    return jsonify(oee_service.calcular_indicadores_oee(request.json))

# Rota para forçar aquele ajuste visual de circuito no OEE (colocar em Quebra, ignorar, etc).
@app.route('/api/oee/update_circuit', methods=['POST'])
def oee_update_ckt():
    if not oee_service: return jsonify({})
    d = request.json
    return jsonify(oee_service.atualizar_circuito(d.get('id'), d.get('action')))

# Quando o coordenador decide fechar o mês no automático, ele grava o histórico definitivo aqui.
@app.route('/api/oee/save_history', methods=['POST'])
def oee_save():
    if not oee_service: return jsonify({})
    d = request.json
    return jsonify(oee_service.save_history(d.get('kpi'), d.get('mes'), d.get('ano')))

# ==== A ROTA NOVA DO OEE MANUAL ====
# Criei essa rota agora! Ela recebe as digitações manuais de OEE do passado e salva bonitinho.
@app.route('/api/oee/history/manual', methods=['POST'])
def oee_save_manual():
    # Proteção caso eu esqueça o arquivo do service.
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"}), 503
    # Pego o objeto json gigantesco do Modal que fizemos no React.
    data = request.json
    # Passo o pacote inteiro pro oee_service salvar no Firestore.
    return jsonify(oee_service.save_manual_history(data))
# ===================================

# Devolve o array com todos os meses já salvos para gerar meu gráfico principal.
@app.route('/api/oee/history', methods=['GET'])
def oee_history_list():
    if not oee_service: return []
    return jsonify(oee_service.listar_historico())

# Apagar um histórico.
@app.route('/api/oee/history/delete', methods=['POST'])
def oee_history_delete():
    if not oee_service: return jsonify({})
    d = request.json
    return jsonify(oee_service.delete_history_record(d.get('mes'), d.get('ano')))

# Aplica uma mágica que tira circuitos inativos para melhorar o OEE global.
@app.route('/api/oee/auto_extras', methods=['POST'])
def oee_auto_extras():
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"})
    d = request.json
    limite = d.get('limite', 300) 
    return jsonify(oee_service.aplicar_regra_extras_automatica(limite))

# Limpa toda a regra mágica de cima e reseta tudo pra eu calcular de novo do zero.
@app.route('/api/oee/clear_extras', methods=['POST'])
def oee_clear_extras():
    if not oee_service: return jsonify({"sucesso": False, "erro": "Serviço OEE Offline"})
    return jsonify(oee_service.limpar_extras())


# Serve os arquivos da Build do React para quando eu entrar no IP sem /api, ele abrir o sistema bonitão.
@app.route('/')
def serve_index():
    if os.path.exists(os.path.join(DIST_DIR, 'index.html')):
        return send_from_directory(DIST_DIR, 'index.html')
    return "API Online. Frontend não localizado."

# Configuração pra lidar com as rotas que o React Router DOM cria (pra ele não dar erro 404 ao dar F5).
@app.route('/<path:path>')
def serve_assets(path):
    if os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

# Dou a partida no servidor Flask e defino a porta.
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    # Desativei o reloader pra ele não tentar dar reload dobrado e travar o Firebase.
    app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)