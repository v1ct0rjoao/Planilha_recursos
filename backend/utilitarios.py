#recebimento de textos, numeros e datas e tratamento deles

import re
from datetime import datetime, timedelta, timezone

def apenas_numeros(texto):
    #pega os nomes dos circuitos e tira as letras e deixa so os numeros
    return re.sub(r'\D', '', str(texto))

def obter_agora():
    return datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3)

def calcular_previsao_fim(start_str, nome_protocolo, db_protocols):
    #calcula quando teste termina somnado a duracao com o inicio
    protocolos_ordenados = sorted(db_protocols, key=lambda p: len(p['name']), reverse=True)
   
    duracao = 0
    #procura o teste na lista pra ver quanto tempo dura
    for p in protocolos_ordenados:
        if p['name'].upper() in nome_protocolo.upper():
            duracao = p['duration']
            break
        
    if duracao == 0: 
        return "A calcular"
    
    try:
        dt_start = datetime.strptime(start_str, "%d/%m/%Y %H:%M")
        dt_end = dt_start + timedelta(hours=duracao)
        return dt_end.strftime("%d/%m/%Y %H:%M")
    except: return "-"
    
def identificar_nome_padrao(linha, db_protocols=[]):
    #pega o log e trata pra gente saber qual é o teste
    #tudo fira maisculo tirando os caracter que pode confundir
    texto_limpo = str(linha).upper().replace('_', '').replace('-', '').replace(' ', '')
    
    protocolos_ordenados = sorted(db_protocols, key=lambda p: len(p['name']), reverse=True)
    
    for p in protocolos_ordenados:
        nome_db = str(p['name']).upper().replace('_', '').replace('-', '').replace(' ', '')
        if nome_db and nome_db in texto_limpo:
            return p['name']
    return "Desconhecido"

def atualizar_progresso_realtime(bd):
   
    #atualiza o progresso nos circuitos 
    agora = obter_agora() 
    mudou = False
    
    for banho in bd.get('baths', []):
        for c in banho.get('circuits', []):
            if c.get('status') == 'running':
                try:
                    ini = datetime.strptime(c.get('startTime'), "%d/%m/%Y %H:%M")
                    fim = datetime.strptime(c.get('previsao'), "%d/%m/%Y %H:%M")
                    total = (fim - ini).total_seconds()
                    passado = (agora - ini).total_seconds()
                    
                    
                    if agora >= fim:
                        c.update({'status': 'finished', 'progress': 100})
                        mudou = True
                    else:
                        percent = round(max(0, min(99.9, (passado / total) * 100)), 1)
                        
                        if c.get('progress') != percent:
                            c['progress'] = percent
                            mudou = True
                except: 
                    pass
                    
            elif c.get('status') == 'finished' and c.get('progress') != 100:
                c['progress'] = 100
                mudou = True
                
   
    return mudou