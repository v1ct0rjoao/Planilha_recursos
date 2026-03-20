# ==========================================
# ARQUIVO: oee_service.py
# ==========================================

# Importo o pandas, meu aliado principal para conseguir ler e mexer na planilha Excel monstruosa do Digatron.
import pandas as pd
# Importo o numpy pra ajudar com matemática e médias seguras (evitar divisão por zero e afins).
import numpy as np
# Importo o calendar para eu saber rapidinho quantos dias tem no mês X do ano Y (pra calcular disponibilidade de tempo).
from calendar import monthrange
from datetime import datetime
import re
import traceback
import math
import firebase_admin
from firebase_admin import firestore

# Aqui eu crio uma "memória global". A leitura do Excel é pesada, então eu leio uma vez só e gravo aqui pro frontend ir calculando e ajustando com botões sem precisar ler a planilha de novo.
GLOBAL_DB = {
    "processed_data": {},   # Guarda os dias "UP", "SD", "PP"
    "overrides": {},        # Guarda os cliques em botões de forçar quebra/ignorância ("SET_UP", "SET_IGNORE")
    "meta": {},             # Guarda qual mês/ano eu processei
    "latest_medias": {}     # Cache pra depois na hora de salvar não calcular dnv
}

# Uma função rapidinha pra me dar o Firebase configurado lá no app.py.
def get_firebase():
    try:
        return firestore.client()
    except:
        return None

# A função mais pesada do meu código. Ela devora o Excel.
def processar_upload_oee(file_path, target_mes, target_ano):
    try:
        # Dou um reset na memória porque tô subindo um mês novo.
        GLOBAL_DB["processed_data"] = {}
        GLOBAL_DB["overrides"] = {}
        
        target_mes = int(target_mes)
        target_ano = int(target_ano)
        
        # Leio TODAS as abas do Excel de uma vez.
        dict_dfs = pd.read_excel(file_path, sheet_name=None)
        dfs_validos = []

        # Como as pessoas digitam as colunas de jeitos diferentes dependendo da planilha, eu crio um mapa de "apelidos" (aliases).
        alias_map = {
            'circuito': ['circuito', 'circuit', 'ckt', 'id'],
            'start': ['start time', 'starttime', 'inicio', 'início', 'data inicial'],
            'stop': ['stop time', 'stoptime', 'fim', 'data final']
        }

        # Analiso cada aba do Excel gerado pelo Digatron.
        for nome_aba, df in dict_dfs.items():
            # Só olho abas que o nome lembre "Digatron".
            if not str(nome_aba).lower().startswith('dig'): continue
            if df.empty: continue

            # Padronizo os nomes da aba atual para minúsculo e sem _ pra eu conseguir caçar no meu mapa ali de cima.
            cols_originais = {col: str(col).lower().strip().replace('_', '') for col in df.columns}
            rename_dict = {}

            # Crio um dicionário mágico que vai renomear as colunas loucas pra "circuito", "start" e "stop".
            for original, limpo in cols_originais.items():
                for padrao, aliases in alias_map.items():
                    if limpo in aliases:
                        rename_dict[original] = padrao
                        break
            df.rename(columns=rename_dict, inplace=True)

            # Só uso a aba se no mínimo tiver qual o circuito e quando começou.
            if 'circuito' in df.columns and 'start' in df.columns:
                if 'stop' not in df.columns: df['stop'] = pd.NaT # Se não tem parada, jogo nulo.
                dfs_validos.append(df[['circuito', 'start', 'stop']])

        if not dfs_validos:
            return {"sucesso": False, "erro": "Nenhuma aba válida."}

        # Colo todas as abas limpas numa tabela gigantesca do Pandas.
        df_final = pd.concat(dfs_validos, ignore_index=True)
        # Forço tudo para o padrão de data.
        df_final['start'] = pd.to_datetime(df_final['start'], dayfirst=True, errors='coerce')
        df_final['stop'] = pd.to_datetime(df_final['stop'], dayfirst=True, errors='coerce')
        # Se start tiver quebrado, nem olho a linha.
        df_final.dropna(subset=['start'], inplace=True)

        # Descubro quantos dias tem no mês pesquisado.
        _, dias_no_mes = monthrange(target_ano, target_mes)
        
        # Função pra espremer a string "Circuito 24" e sobrar só o "24".
        def limpar_id(val):
            nums = re.findall(r'\d+', str(val))
            return str(int(nums[0])) if nums else str(val).strip()

        # Crio uma nova coluna aplicando a função de limpeza.
        df_final['clean_id'] = df_final['circuito'].apply(limpar_id)
        
        circuitos_eventos = {}
        circuitos_encontrados = set()

        # Agora eu crio um dicionário separando por circuito os "tijolinhos" de tempo que ele ficou ativo.
        for _, row in df_final.iterrows():
            cid = row['clean_id']
            circuitos_encontrados.add(cid)
            if cid not in circuitos_eventos: circuitos_eventos[cid] = []
            
            start = row['start']
            # Se não parou na planilha, eu boto pra parar só no ano novo pra garantir que pega o mês inteiro.
            stop = row['stop'] if not pd.isna(row['stop']) else datetime(target_ano + 1, 1, 1)
            circuitos_eventos[cid].append((start, stop))

        mapa_final = {}
        # Lista padrão dos meus 450 circuitos da planta + O equipamento da Apple.
        lista_ids = ['iDevice'] + [str(i) for i in range(1, 451)]

        # Onde a mágica do status diário acontece.
        for cid in lista_ids:
            status_array = []
            eventos = circuitos_eventos.get(cid, [])
            
            # Pra cada dia do mês...
            for dia in range(1, dias_no_mes + 1):
                dia_inicio = datetime(target_ano, target_mes, dia, 0, 0, 0)
                dia_fim = datetime(target_ano, target_mes, dia, 23, 59, 59)
                # Sábado (5) e Domingo (6).
                is_weekend = dia_inicio.weekday() >= 5
                
                # Assume que foi Planejada Parada final de semana, se não é Sem Demanda.
                status_dia = 'PP' if is_weekend else 'SD'
                
                # Se o "tijolinho" de teste bateu em qualquer horário deste dia, ele vira Uso Programado.
                for start, stop in eventos:
                    if start <= dia_fim and stop >= dia_inicio:
                        status_dia = 'UP'
                        break
                
                status_array.append(status_dia)
            
            mapa_final[cid] = status_array

        # Jogo na memória pra não perder!
        GLOBAL_DB["processed_data"] = mapa_final
        GLOBAL_DB["meta"] = {
            "detected_month": int(target_mes),
            "detected_year": int(target_ano)
        }

        return {
            "sucesso": True, 
            "circuitos": list(circuitos_encontrados),
            "mes_processado": f"{target_mes}/{target_ano}",
            "mensagem": "Processado com sucesso (RAM)."
        }

    except Exception as e:
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}

# Adiciona o clique manual na lista de memória (ex: Transformar UP em Quebra).
def atualizar_circuito(circuit_id, action):
    try:
        if action == 'RESTORE':
            if circuit_id in GLOBAL_DB["overrides"]:
                del GLOBAL_DB["overrides"][circuit_id]
        else:
            GLOBAL_DB["overrides"][circuit_id] = action
        return {"sucesso": True}
    except Exception as e:
        return {"sucesso": False}

# Pega os arrays diários e calcula de fato as frações para dar o OEE.
def calcular_indicadores_oee(params):
    try:
        db_data = GLOBAL_DB.get("processed_data", {})
        overrides = GLOBAL_DB.get("overrides", {})
        meta = GLOBAL_DB.get("meta", {})
        
        if not db_data: 
            return {"sucesso": False, "erro": "Sem dados na memória."}
        
        mes_salvo = meta.get('detected_month', int(params.get('mes')))
        ano_salvo = meta.get('detected_year', int(params.get('ano')))
        
        _, dias_no_mes = monthrange(ano_salvo, mes_salvo)

        # Trago as coisas digitadas pelo usuário (relatórios emitidos e afins) pra multiplicar.
        kpi_inputs = {
            'exec': float(params.get('ensaios_executados', 0)),
            'solic': float(params.get('ensaios_solicitados', 0)),
            'emit': float(params.get('relatorios_emitidos', 0)),
            'prazo': float(params.get('relatorios_no_prazo', 0))
        }

        capacidade_total = int(params.get('capacidade_total', 424)) 
        limite_fixo = 300 # A Moura considera 300 equipamentos como "ativos principais".
        
        todos_candidatos = []
        ids_raw = [k for k in db_data.keys() if k != 'iDevice']
        
        # Crio um placar para descobrir quais foram os 300 circuitos que mais rodaram no mês.
        for cid in ids_raw:
            raw_days = db_data.get(cid, [])
            c_up = raw_days.count('UP')
            c_sd = raw_days.count('SD')
            
            action = overrides.get(cid)
            if action == 'SET_UP': c_up = dias_no_mes; c_sd = 0
            
            todos_candidatos.append({
                'id': cid,
                'raw_days': raw_days,
                'score_up': c_up,
                'score_sd': c_sd
            })

        # Ordeno: Quem rodou mais UP fica no topo. Desempato com quem teve menos SD.
        candidatos_ordenados = sorted(todos_candidatos, key=lambda x: (-x['score_up'], x['score_sd']))

        # Equipamento de Apple entra como prioridade absoluta no meu index 0.
        if 'iDevice' in db_data:
            candidatos_ordenados.insert(0, {
                'id': 'iDevice', 
                'raw_days': db_data['iDevice'], 
                'score_up': 999, 'score_sd': 0
            })
        
        valores_up = []
        valores_sd = []
        valores_pp = []
        valores_pq = []
        
        details = []
        circuitos_considerados = 0

        # Aqui eu filtro os dados levando em conta o limite de 300 e se o usuário mandou ignorar alguma coisa no frontend.
        for idx, item in enumerate(candidatos_ordenados):
            cid = item['id']
            raw_days = item['raw_days']
            
            eh_fixo = idx < limite_fixo
            eh_extra = idx >= limite_fixo
            
            override_action = overrides.get(cid)
            is_ignored_manual = (override_action == 'SET_IGNORE')
            
            day_data = []
            c_counts = {'UP': 0, 'SD': 0, 'PQ': 0, 'PP': 0, '': 0}
            display_name = "iDevice" if cid == 'iDevice' else f"Circuit{cid.zfill(3)}"

            for dia_idx in range(dias_no_mes):
                dt = datetime(ano_salvo, mes_salvo, dia_idx + 1)
                is_weekend = dt.weekday() >= 5
                
                status = 'SD'
                if cid == 'iDevice':
                    status = 'PP' if is_weekend else 'UP'
                else:
                    if raw_days and len(raw_days) == dias_no_mes:
                        status = raw_days[dia_idx]
                    else:
                        status = 'PP' if is_weekend else 'SD'

                # Aplico a "sobreposição" do frontend (se forcei na tela, prevalece aqui)
                if override_action == 'SET_UP': status = 'UP' 
                elif override_action == 'force_std': status = 'PP' if is_weekend else 'UP' 
                elif override_action == 'SET_BONUS': 
                    if status in ['SD', 'PP']: status = '' 

                # Para quem passou de 300 (extra), apago os dias Sem Demanda (não entra na conta de tempo perdido).
                if eh_extra and not is_ignored_manual:
                    if status == 'UP' or status == 'PQ':
                        pass 
                    else:
                        status = ''

                day_data.append(status)
                
                if status in c_counts: c_counts[status] += 1
                else: c_counts[''] += 1

            tem_atividade = (c_counts['UP'] > 0 or c_counts['PQ'] > 0 or c_counts['SD'] > 0 or c_counts['PP'] > 0)
            is_effectively_bonus = False
            
            # Se for ignorado manualmente ou é um canal extra morto que não produziu nada, eu nem coloco na somatória matemática.
            if not is_ignored_manual and tem_atividade:
                circuitos_considerados += 1
                valores_up.append(c_counts['UP'])
                valores_sd.append(c_counts['SD'])
                valores_pp.append(c_counts['PP'])
                valores_pq.append(c_counts['PQ'])
                
                if eh_extra and c_counts['UP'] > 0:
                    is_effectively_bonus = True

            t_disp_ind = max(0, dias_no_mes - c_counts['PP'] - c_counts[''])
            disp_ind = (c_counts['UP'] / t_disp_ind * 100) if t_disp_ind > 0 else 0

            is_effectively_ignored = is_ignored_manual or (eh_extra and c_counts['UP'] == 0)

            # Guardo essas estatísticas num array para mandar desenhar aquele GRID visual bonito no React.
            details.append({
                'id': display_name,
                'raw_id': cid,
                'UP': c_counts['UP'], 'SD': c_counts['SD'], 'PQ': c_counts['PQ'], 'PP': c_counts['PP'],
                'day_data': day_data,
                'is_ignored': is_effectively_ignored,
                'is_bonus': is_effectively_bonus,
                'rank': idx + 1,
                'stats': {
                    'pct_up': round(c_counts['UP']/dias_no_mes*100, 1), 
                    'disponibilidade': round(disp_ind, 1) 
                }
            })

        # Organizo visualmente o grid do 1 ao 450.
        def visual_sort_key(row):
            rid = row['raw_id']
            if rid == 'iDevice': return -1
            return int(rid) if rid.isdigit() else 99999
            
        details.sort(key=visual_sort_key)

        def media_se_diferente_zero(lista_valores):
            filtrados = [v for v in lista_valores if v > 0]
            if not filtrados: return 0
            return np.mean(filtrados)

        def media_simples(lista_valores):
            if not lista_valores: return 0
            return np.mean(lista_valores)

        media_up = media_se_diferente_zero(valores_up)
        media_sd = media_se_diferente_zero(valores_sd) 
        media_pp = media_se_diferente_zero(valores_pp)
        media_pq = media_simples(valores_pq)

        # Calculo os tempos finais com base nas médias gerais da sala do lab físico.
        tempo_disponivel_global = dias_no_mes - media_pp - media_sd
        tempo_operacao_real = media_up - media_pq - media_sd

        # Fecho o KPI de Disponibilidade
        if tempo_disponivel_global <= 0.001:
            disp_global = 0
        else:
            disp_global = tempo_operacao_real / tempo_disponivel_global

        # Fecho KPI de Perf e Qual
        perf_global = (kpi_inputs['exec'] / kpi_inputs['solic']) if kpi_inputs['solic'] > 0 else 0
        qual_global = (kpi_inputs['prazo'] / kpi_inputs['emit']) if kpi_inputs['emit'] > 0 else 0

        # Multiplicação do OEE (padrão mundial OEE).
        oee_final = disp_global * perf_global * qual_global

        res_medias = {
            "up_dias": round(media_up, 2),
            "sd_dias": round(media_sd, 2),
            "pp_dias": round(media_pp, 2),
            "pq_dias": round(media_pq, 2),
            "total_dias": dias_no_mes,
            "tempo_disp_calc": round(tempo_disponivel_global, 2),
            "tempo_real_calc": round(tempo_operacao_real, 2),
            "circuitos_considerados": circuitos_considerados,
            "ensaios_solic": kpi_inputs['solic'],
            "ensaios_exec": kpi_inputs['exec'],
            "relatorios_emit": kpi_inputs['emit'],
            "relatorios_prazo": kpi_inputs['prazo']
        }

        # Guardo em RAM caso o cara queira salvar
        GLOBAL_DB["latest_medias"] = res_medias

        return {
            "sucesso": True,
            "kpi": {
                "oee": round(oee_final * 100, 2),
                "availability": round(disp_global * 100, 2),
                "performance": round(perf_global * 100, 2),
                "quality": round(qual_global * 100, 2)
            },
            "medias": res_medias,
            "details": details,
            "meta": {"dias_no_mes": dias_no_mes}
        }

    except Exception as e:
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}

# Função que fecha o mês pra valer através do arquivo excel gerado.
def save_history(kpi, mes, ano):
    db = get_firebase()
    if not db: return {"sucesso": False, "erro": "Firebase Off"}
    
    try:
        db_data = GLOBAL_DB.get("processed_data", {})
        overrides = GLOBAL_DB.get("overrides", {})
        medias_data = GLOBAL_DB.get("latest_medias", {})
        
        if not db_data: return {"sucesso": False, "erro": "Memória vazia"}

        _, dias_no_mes = monthrange(int(ano), int(mes))
        
        grid_snapshot = []
        ids = list(db_data.keys())
        ids_numericos = sorted([x for x in ids if x != 'iDevice'], key=lambda x: int(x) if x.isdigit() else 9999)
        ids_final = ['iDevice'] + ids_numericos

        # Refaço a varredura pra montar a "foto polaroid" visual de cores no mês (Grid Snapshot).
        for cid in ids_final:
            override_action = overrides.get(cid)
            raw_days = db_data.get(cid, [])
            day_data = []

            if not raw_days: raw_days = ['SD'] * dias_no_mes

            if len(raw_days) == dias_no_mes:
                for dia_idx, status_original in enumerate(raw_days):
                    status = status_original
                    dt = datetime(int(ano), int(mes), dia_idx + 1)
                    is_weekend = dt.weekday() >= 5
                    
                    if cid == 'iDevice':
                        status = 'PP' if is_weekend else 'UP'
                    else:
                        if override_action == 'SET_UP': status = 'UP'
                        elif override_action == 'force_std': status = 'PP' if is_weekend else 'UP'
                        elif override_action == 'SET_BONUS': 
                            if status == 'SD' or status == 'PP': status = ''
                        elif override_action == 'SET_IGNORE': status = 'IGNORE'

                    day_data.append(status)

            grid_snapshot.append({
                "id": cid,
                "days": day_data,
                "status": "ignored" if override_action == 'SET_IGNORE' else "active"
            })

        # Defino o nome do documento (ex: 12_2025).
        doc_id = f"{mes}_{ano}"
        history_ref = db.collection('lab_data').document('history').collection('oee_monthly')
        
        # Mando a foto toda fechada e consolidada pro Firestore.
        history_ref.document(doc_id).set({
            "mes": int(mes),
            "ano": int(ano),
            "kpi": kpi,
            "medias": medias_data,
            "grid": grid_snapshot,
            "saved_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }, merge=True)
        
        return {"sucesso": True}

    except Exception as e:
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}

# ========================================================
# MINHA FUNÇÃO NOVA: Salvar o OEE Manual!
# ========================================================
def save_manual_history(payload):
    # Aqui eu pego o objeto Firebase padrão
    db = get_firebase()
    if not db: return {"sucesso": False, "erro": "Firebase Off"}
    
    try:
        # Extraio os dados que o React montou no pacote JSON.
        mes = int(payload.get('mes'))
        ano = int(payload.get('ano'))
        kpi = payload.get('kpi', {})
        medias = payload.get('medias', {})
        # A parte visual (grid colorido) não tem no manual, então costuma vir nulo do frontend.
        grid = payload.get('grid', None) 
        
        # Crio a chave com o formato padronizado (Mês_Ano) igual no método automático.
        doc_id = f"{mes}_{ano}"
        # Acesso a coleção principal 'lab_data', entro no 'history' e vou nos relatórios mensais de OEE.
        history_ref = db.collection('lab_data').document('history').collection('oee_monthly')
        
        # Salvo diretão! Sem calcular média ou gerar matriz, pois os números já estão prontos.
        history_ref.document(doc_id).set({
            "mes": mes,
            "ano": ano,
            "kpi": kpi,
            "medias": medias,
            "grid": grid,
            "saved_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S") # Carimbo de segurança.
        }, merge=True)
        
        return {"sucesso": True, "mensagem": "Histórico manual salvo com sucesso."}

    except Exception as e:
        # Se eu esqueci algum tipo de variável lá no front (ex: mandar string ao invés de int), o erro cai aqui.
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}


# Lista todos os relatórios que o pessoal do laboratório já fechou.
def listar_historico():
    db = get_firebase()
    if not db: return {"sucesso": False, "erro": "Firebase Off"}
    try:
        # Stream pega todos os docs, bom pra poucos dados como fechamentos anuais.
        docs = db.collection('lab_data').document('history').collection('oee_monthly').stream()
        lista = []
        for doc in docs:
            dado = doc.to_dict()
            dado['id_doc'] = doc.id
            lista.append(dado)
        return {"sucesso": True, "historico": lista}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

# Função para clicar na lixeirinha que criamos e apagar um mês fechado de teste.
def delete_history_record(mes, ano):
    db = get_firebase()
    if not db: return {"sucesso": False, "erro": "Firebase Off"}
    try:
        doc_id = f"{mes}_{ano}"
        db.collection('lab_data').document('history').collection('oee_monthly').document(doc_id).delete()
        return {"sucesso": True}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

# Função utilitária que varre minha lista de "comandos na mão" (overrides) e zera todos que criei por magia.
def limpar_extras():
    try:
        overrides = GLOBAL_DB.get("overrides", {})
        ids_para_limpar = [cid for cid, action in overrides.items() if action == 'SET_BONUS']
        for cid in ids_para_limpar:
            del overrides[cid]
        return {
            "sucesso": True, 
            "mensagem": f"Restaurado! {len(ids_para_limpar)} circuitos voltaram ao normal.",
            "qtd_removida": len(ids_para_limpar)
        }
    except Exception as e:
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}

# Aquela rotina marota que pega o excesso de circuitos além dos 300 ativos da Moura e apaga as falhas da conta deles para otimizar os números.
def aplicar_regra_extras_automatica(limite_fixo):
    try:
        limite_fixo = int(limite_fixo)
        db_data = GLOBAL_DB.get("processed_data", {})
        overrides = GLOBAL_DB.get("overrides", {})
        
        if not db_data: return {"sucesso": False, "erro": "Nenhum dado processado."}

        candidatos = []
        for cid, dias in db_data.items():
            if cid == 'iDevice': continue
            acao_atual = overrides.get(cid)
            if acao_atual == 'SET_IGNORE': continue

            # Conto de novo o que o cara fez.
            count_up = dias.count('UP')
            count_pq = dias.count('PQ')
            count_sd = dias.count('SD')
            count_pp = dias.count('PP')
            
            if acao_atual == 'SET_UP': count_up = 30 

            # Entram no páreo só os equipamentos que tiveram pelo menos 1 pulso de energia vivo.
            if count_up > 0 or count_pq > 0:
                score_ociosidade = count_sd + count_pp
                candidatos.append({
                    'id': cid,
                    'score': score_ociosidade,
                    'sd': count_sd, 
                    'pp': count_pp  
                })

        total_usados = len(candidatos)
        excedente = total_usados - limite_fixo

        # Se no mês atual o laboratório só usou, sei lá, 280 circuitos físicos, eu não faço nada. Não quebrou a cota.
        if excedente <= 0:
            return {
                "sucesso": True, 
                "mensagem": f"Apenas {total_usados} circuitos em uso. Não ultrapassou o limite de {limite_fixo}.",
                "relatorio": None
            }

        # Boto os canais mais ociosos (mais Sem Demanda) na degola primeiro! Eles viram 'extra' e não prejudicam meu cálculo de tempo real/disponível.
        candidatos.sort(key=lambda x: x['score'], reverse=True)
        novos_extras = candidatos[:excedente]
        
        count_aplicados = 0
        total_sd_removido = 0
        total_pp_removido = 0
        lista_ids = []

        # Atribuo a flag 'SET_BONUS' que a função calcular_indicadores_oee usa para limpar.
        for item in novos_extras:
            cid = item['id']
            total_sd_removido += item['sd']
            total_pp_removido += item['pp']
            lista_ids.append(cid)
            GLOBAL_DB["overrides"][cid] = 'SET_BONUS'
            count_aplicados += 1
        
        lista_ids.sort(key=lambda x: int(x) if x.isdigit() else 9999)

        # Retorno as infos para imprimir o modalzinho confirmando quantos canais mudei.
        return {
            "sucesso": True, 
            "mensagem": f"Regra aplicada em {count_aplicados} circuitos!",
            "relatorio": {
                "qtd": count_aplicados,
                "total_sd": total_sd_removido,
                "total_pp": total_pp_removido,
                "ids": lista_ids
            }
        }
    except Exception as e:
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}