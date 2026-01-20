import pandas as pd
import numpy as np
from calendar import monthrange
from datetime import datetime, timedelta
import re
import os
import traceback
import math

# Caminho do histórico
HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'historico_oee.csv')

# ==============================================================================
# 1. LEITURA ROBUSTA
# ==============================================================================

def ler_excel_estruturado(arquivo_excel, fim_do_mes_referencia=None):
    try:
        dict_dfs = pd.read_excel(arquivo_excel, sheet_name=None)
        dfs_validos = []

        alias_map = {
            'circuito': ['circuito', 'circuitos', 'circuit', 'ckt'],
            'datastart': ['datastart', 'start time', 'starttime', 'inicio', 'início', 'data inicial', 'start_time'],
            'datastop': ['datastop', 'stop time', 'stoptime', 'fim', 'data final', 'stop_time']
        }
        
        colunas_necessarias = ['circuito', 'datastart']

        for nome_aba, df in dict_dfs.items():
            if df.empty: continue

            cols_originais = {col: str(col).lower().replace(' ', '').replace('_', '') for col in df.columns}
            rename_dict = {}

            for original, limpo in cols_originais.items():
                for padrao, aliases in alias_map.items():
                    if limpo in aliases:
                        rename_dict[original] = padrao
                        break
            
            df.rename(columns=rename_dict, inplace=True)

            if all(col in df.columns for col in colunas_necessarias):
                if 'datastop' not in df.columns:
                    df['datastop'] = pd.NaT
                dfs_validos.append(df[['circuito', 'datastart', 'datastop']])

        if not dfs_validos:
            return pd.DataFrame() 

        df_final = pd.concat(dfs_validos, ignore_index=True)
        
        df_final['datastart'] = pd.to_datetime(df_final['datastart'], errors='coerce')
        df_final['datastop'] = pd.to_datetime(df_final['datastop'], errors='coerce')
        df_final.dropna(subset=['datastart'], inplace=True)
        
        if fim_do_mes_referencia:
            df_final['datastop'] = df_final['datastop'].fillna(fim_do_mes_referencia)
        else:
            df_final['datastop'] = df_final['datastop'].fillna(datetime.now())

        df_final['circuito'] = df_final['circuito'].astype(str).str.extract(r'(\d+)').fillna(0).astype(int).astype(str)
        
        return df_final

    except Exception as e:
        print(f"Erro na leitura estruturada: {e}")
        traceback.print_exc()
        return pd.DataFrame()

# ==============================================================================
# LÓGICA PRINCIPAL (CÁLCULO OEE)
# ==============================================================================

def processar_upload_oee(file_path):
    try:
        df = ler_excel_estruturado(file_path)
        if df.empty:
            return {"sucesso": False, "erro": "Colunas 'Circuit' e 'Start Time' não encontradas."}
        
        circuitos_unicos = sorted(df['circuito'].astype(int).unique())
        return { "sucesso": True, "circuitos": [str(c) for c in circuitos_unicos] }
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

def calcular_indicadores_oee(file_path, params):
    try:
        # 1. PARÂMETROS
        ano = int(params.get('ano', datetime.now().year))
        mes = int(params.get('mes', datetime.now().month))
        capacidade_total = int(params.get('capacidade_total', 450)) 
        _, dias_no_mes = monthrange(ano, mes)
        
        fim_mes_referencia = datetime(ano, mes, dias_no_mes, 23, 59, 59)
        
        # Inputs Manuais
        perf_exec = float(params.get('ensaios_executados', 0))
        perf_solic = float(params.get('ensaios_solicitados', 0))
        qual_emit = float(params.get('relatorios_emitidos', 0))
        qual_prazo = float(params.get('relatorios_no_prazo', 0))
        
        # Listas de Controle
        force_up = [str(int(x)) for x in params.get('force_up', [])]
        force_pq = [str(int(x)) for x in params.get('force_pq', [])]
        force_pp = [str(int(x)) for x in params.get('force_pp', [])]      
        force_std = [str(int(x)) for x in params.get('force_std', [])]    
        ignored_list = [str(int(x)) for x in params.get('ignored_list', [])] 
        overrides = params.get('overrides', {}) 

        # 2. LEITURA DOS DADOS
        df_dados = ler_excel_estruturado(file_path, fim_do_mes_referencia=fim_mes_referencia)
        
        eventos_estruturados = []
        if not df_dados.empty:
            for _, row in df_dados.iterrows():
                cid = row['circuito']
                inicio = row['datastart']
                fim = row['datastop']
                if pd.isna(fim) or fim < inicio: fim = fim_mes_referencia
                eventos_estruturados.append({'id': cid, 'inicio': inicio, 'fim': fim})
        
        # 3. PROCESSAMENTO DIA A DIA
        tabela_visualizacao = []
        kpi_up, kpi_sd, kpi_pq, kpi_pp = [], [], [], []
        circuitos_ativos_count = 0

        # ---------------------------------------------------------
        # --- LÓGICA ESPECIAL: iDEVICE (Inserido ANTES do loop) ---
        # ---------------------------------------------------------
        
        # O iDevice não é numérico, então tratamos ele manualmente aqui
        idevice_daily = []
        idevice_counts = {'UP': 0, 'SD': 0, 'PQ': 0, 'PP': 0}
        
        # Verifica se o usuário não excluiu manualmente o iDevice
        # Usamos um ID fixo '9999' ou string 'iDevice' para controle de lista, 
        # mas como o ID visual é string, vamos checar se 'iDevice' está na lista de ignorados? 
        # Como o ignored_list do frontend geralmente manda numeros, assumimos que iDevice é fixo.
        
        for dia in range(1, dias_no_mes + 1):
            dt = datetime(ano, mes, dia)
            # Regra Fixa: Sábado(5) e Domingo(6) = PP, Resto = UP
            status = 'PP' if dt.weekday() >= 5 else 'UP'
            idevice_daily.append(status)
            idevice_counts[status] += 1
        
        # Adiciona aos KPIs globais (ele conta na média)
        kpi_up.append(idevice_counts['UP'])
        kpi_pq.append(0)
        kpi_pp.append(idevice_counts['PP'])
        kpi_sd.append(0)
        circuitos_ativos_count += 1

        # Cálculos de Stats Individuais do iDevice
        t_disp_idev = max(0, dias_no_mes - idevice_counts['PP']) # SD é 0
        t_real_idev = idevice_counts['UP']
        disp_idev = (t_real_idev / t_disp_idev * 100) if t_disp_idev > 0 else 0.0

        tabela_visualizacao.append({
            'id': 'iDevice', # Nome visual
            'raw_id': 'iDevice', # ID para ações (pode não funcionar filtros numéricos, mas ok)
            'UP': idevice_counts['UP'], 'SD': 0, 'PQ': 0, 'PP': idevice_counts['PP'],
            'day_data': idevice_daily,
            'is_ignored': False,
            'is_zero_up': False, # Nunca é zero UP pois tem seg-sex
            'stats': {
                'pct_up': round((idevice_counts['UP'] / dias_no_mes) * 100, 1),
                'pct_pq': 0.0,
                'pct_pp': round((idevice_counts['PP'] / dias_no_mes) * 100, 1),
                'pct_sd': 0.0,
                'tempo_disponivel': round(t_disp_idev, 1),
                'tempo_real': round(t_real_idev, 1),
                'disponibilidade': round(disp_idev, 1)
            }
        })
        # ---------------------------------------------------------

        
        # Loop normal dos Circuitos Numéricos (1 a 450)
        for i in range(1, capacidade_total + 1):
            cid = str(i)
            cid_formatado = f"C-{cid.zfill(3)}"
            is_ignored_manually = cid in ignored_list
            
            daily_statuses = [] 
            contagem = {'UP': 0, 'SD': 0, 'PQ': 0, 'PP': 0}
            
            is_preset_pp = cid in force_pp
            is_preset_std = cid in force_std
            is_preset_up = cid in force_up
            is_preset_pq = cid in force_pq

            eventos_circ = [e for e in eventos_estruturados if e['id'] == cid] if not (is_preset_pp or is_preset_std) else []

            for dia in range(1, dias_no_mes + 1):
                status = 'SD'
                if is_preset_pp: status = 'PP'
                elif is_preset_std:
                    dt = datetime(ano, mes, dia)
                    status = 'PP' if dt.weekday() >= 5 else 'UP'
                elif is_preset_up: status = 'UP'
                elif is_preset_pq: status = 'PQ'
                else:
                    data_dia = datetime(ano, mes, dia, 12, 0, 0)
                    dt_check = data_dia.date()
                    has_event = False
                    for evento in eventos_circ:
                        if evento['inicio'].date() <= dt_check <= evento['fim'].date():
                            status = 'UP'
                            has_event = True
                            break
                    if not has_event:
                        status = 'PP' if data_dia.weekday() >= 5 else 'SD'
                
                daily_statuses.append(status) 
                contagem[status] += 1

            if cid_formatado in overrides:
                vals = overrides[cid_formatado]
                contagem = { 'UP': int(vals.get('UP', 0)), 'SD': int(vals.get('SD', 0)), 'PQ': int(vals.get('PQ', 0)), 'PP': int(vals.get('PP', 0)) }

            should_count = True
            if is_ignored_manually: should_count = False
            elif contagem['UP'] == 0 and contagem['PQ'] == 0: should_count = False

            if should_count:
                kpi_up.append(contagem['UP'])
                kpi_sd.append(contagem['SD'])
                kpi_pq.append(contagem['PQ'])
                kpi_pp.append(contagem['PP'])
                circuitos_ativos_count += 1
            
            tempo_disponivel_row = max(0, dias_no_mes - contagem['PP'] - contagem['SD'])
            tempo_real_row = contagem['UP']
            disp_row = (tempo_real_row / tempo_disponivel_row * 100) if tempo_disponivel_row > 0 else 0.0

            tabela_visualizacao.append({
                'id': cid_formatado,
                'raw_id': cid,
                'UP': contagem['UP'], 'SD': contagem['SD'], 'PQ': contagem['PQ'], 'PP': contagem['PP'],
                'day_data': daily_statuses, 
                'is_ignored': is_ignored_manually,
                'is_zero_up': (contagem['UP'] == 0 and contagem['PQ'] == 0),
                'stats': {
                    'pct_up': round((contagem['UP'] / dias_no_mes) * 100, 1),
                    'pct_pq': round((contagem['PQ'] / dias_no_mes) * 100, 1),
                    'pct_pp': round((contagem['PP'] / dias_no_mes) * 100, 1),
                    'pct_sd': round((contagem['SD'] / dias_no_mes) * 100, 1),
                    'tempo_disponivel': round(tempo_disponivel_row, 1),
                    'tempo_real': round(tempo_real_row, 1),
                    'disponibilidade': round(disp_row, 1)
                }
            })

        # 4. CÁLCULO GERAL (KPI)
        if circuitos_ativos_count == 0: 
            media_up, media_sd, media_pp, media_pq = 0, 0, 0, 0
        else:
            media_up = sum(kpi_up) / circuitos_ativos_count
            media_sd = sum(kpi_sd) / circuitos_ativos_count
            media_pp = sum(kpi_pp) / circuitos_ativos_count
            media_pq = sum(kpi_pq) / circuitos_ativos_count
        
        tempo_disponivel_global = dias_no_mes - media_pp - media_sd
        tempo_real_global = max(0, media_up - media_pq - media_sd)
        
        disp_global = (tempo_real_global / tempo_disponivel_global * 100) if tempo_disponivel_global > 0.01 else 0.0
        disp_global = min(100, max(0, disp_global))
        
        perf_global = min(100, max(0, (perf_exec / perf_solic * 100) if perf_solic > 0 else 100.0))
        qual_global = min(100, max(0, (qual_prazo / qual_emit * 100) if qual_emit > 0 else 100.0))
        
        oee_final = (disp_global/100) * (perf_global/100) * (qual_global/100) * 100
        
        # 5. HISTÓRICO
        historico = ler_historico()
        trend_chart = [{"name": h['name'], "oee": h['OEE'], "target": 85} for h in historico]
        
        label_atual = f"{int(mes)}/{int(ano)}"
        if not any(d['name'] == label_atual for d in trend_chart):
             trend_chart.append({"name": label_atual, "oee": round(oee_final, 1), "target": 85})

        return {
            "sucesso": True,
            "kpi": { 
                "oee": round(oee_final, 1), 
                "availability": round(disp_global, 1), 
                "performance": round(perf_global, 1), 
                "quality": round(qual_global, 1) 
            },
            "medias": {
                "up_dias": math.ceil(media_up),   # UP -> Teto
                "pq_dias": math.ceil(media_pq),   # PQ -> Teto
                "pp_dias": math.floor(media_pp),  # PP -> Piso
                "sd_dias": math.floor(media_sd),  # SD -> Piso
                "total_dias": dias_no_mes,
                "circuitos_considerados": circuitos_ativos_count
            },
            "trendData": trend_chart,
            "details": tabela_visualizacao, 
            "meta": { 
                "ano": ano, 
                "mes": mes, 
                "circuitos_ativos": circuitos_ativos_count, 
                "total_instalado": capacidade_total, 
                "dias_no_mes": dias_no_mes 
            }
        }

    except Exception as e:
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}

# ==============================================================================
# GESTÃO DE CSV (HISTÓRICO)
# ==============================================================================

def salvar_historico(dados_kpi, mes, ano):
    try:
        nova = pd.DataFrame([{ 
            'periodo': f"{ano}-{mes:02d}-01", 
            'mes': mes, 
            'ano': ano, 
            'oee': dados_kpi['oee'], 
            'disponibilidade': dados_kpi['availability'], 
            'performance': dados_kpi['performance'], 
            'qualidade': dados_kpi['quality'] 
        }])
        
        if os.path.exists(HISTORY_FILE):
            antigo = pd.read_csv(HISTORY_FILE)
            antigo = antigo[~((antigo['mes'] == mes) & (antigo['ano'] == ano))]
            nova = pd.concat([antigo, nova])
        
        nova.to_csv(HISTORY_FILE, index=False)
        return True
    except: return False

def ler_historico():
    if not os.path.exists(HISTORY_FILE): return []
    try:
        df = pd.read_csv(HISTORY_FILE).sort_values('periodo')
        return [{
            "name": f"{int(r.mes)}/{int(r.ano)}", 
            "OEE": r.oee, 
            "Disponibilidade": r.disponibilidade, 
            "Performance": r.performance, 
            "Qualidade": r.qualidade
        } for _, r in df.iterrows()]
    except: return []