import pandas as pd
import numpy as np
from calendar import monthrange
from datetime import datetime, timedelta
import re
import os
import traceback
import random

# Caminho do histórico
HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'historico_oee.csv')

# Regras de Duração
DURACAO_PADRAO = {
    'SAE': 8, '2801': 8, 'J2801': 8, 'RC': 3, 'RC20': 3, 'C20': 1, 'CCA': 1, 'DEFAULT': 1
}

# ==============================================================================
# FUNÇÕES AUXILIARES
# ==============================================================================

def normalizar_texto(texto):
    if not isinstance(texto, str): return str(texto)
    return texto.lower().strip().replace(' ', '')

def identificar_duracao(texto_linha):
    texto = normalizar_texto(texto_linha).upper()
    for chave, dias in DURACAO_PADRAO.items():
        if chave in texto: return dias
    return 1 

def extrair_circuito_e_data(linha):
    match = re.search(r'(?:Circuit|Circuito)\s*0*(\d+).*?(\d{2,4}[-/]\d{1,2}[-/]\d{2,4})', linha, re.IGNORECASE)
    if match: return match.group(1), match.group(2)
    return None, None

def converter_data_flexivel(dt_str):
    formatos = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"]
    dt_str = dt_str.split(' ')[0]
    for fmt in formatos:
        try: return datetime.strptime(dt_str, fmt)
        except ValueError: continue
    return None

def carregar_todas_abas(file_path):
    try:
        dict_abas = pd.read_excel(file_path, sheet_name=None, header=None)
        return pd.concat(dict_abas.values(), ignore_index=True)
    except:
        return pd.read_excel(file_path, header=None)

# ==============================================================================
# LÓGICA PRINCIPAL (CALCULO E FILTRO)
# ==============================================================================

def processar_upload_oee(file_path):
    try:
        df_raw = carregar_todas_abas(file_path)
        linhas = df_raw.astype(str).apply(lambda x: ' '.join(x), axis=1)
        circuitos = set()
        for linha in linhas:
            cid, _ = extrair_circuito_e_data(linha)
            if cid: circuitos.add(str(int(cid)))
        return { "sucesso": True, "circuitos": sorted(list(circuitos), key=lambda x: int(x)) }
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

def calcular_indicadores_oee(file_path, params):
    try:
        # 1. PARÂMETROS
        ano = int(params.get('ano', datetime.now().year))
        mes = int(params.get('mes', datetime.now().month))
        capacidade_total = int(params.get('capacidade_total', 450)) 
        _, dias_no_mes = monthrange(ano, mes)
        
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

        # 2. LEITURA
        df_raw = carregar_todas_abas(file_path)
        linhas = df_raw.astype(str).apply(lambda x: ' '.join(x), axis=1)
        
        eventos_brutos = []
        for linha in linhas:
            cid, dt_str = extrair_circuito_e_data(linha)
            if cid and dt_str:
                inicio = converter_data_flexivel(dt_str)
                if inicio:
                    duracao = identificar_duracao(linha)
                    fim = inicio + timedelta(days=duracao)
                    eventos_brutos.append({'id': str(int(cid)), 'inicio': inicio, 'fim': fim})
        
        # 3. PROCESSAMENTO DIA A DIA
        tabela_visualizacao = []
        kpi_up, kpi_sd, kpi_pq, kpi_pp = [], [], [], []
        circuitos_ativos_count = 0
        
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

            eventos_circ = [e for e in eventos_brutos if e['id'] == cid] if not (is_preset_pp or is_preset_std) else []

            for dia in range(1, dias_no_mes + 1):
                status = 'SD'
                if is_preset_pp: status = 'PP'
                elif is_preset_std:
                    dt = datetime(ano, mes, dia)
                    status = 'PP' if dt.weekday() >= 5 else 'UP'
                elif is_preset_up: status = 'UP'
                elif is_preset_pq: status = 'PQ'
                else:
                    data = datetime(ano, mes, dia)
                    has_event = False
                    for evento in eventos_circ:
                        if evento['inicio'].date() <= data.date() <= evento['fim'].date():
                            status = 'UP'
                            has_event = True
                            break
                    if not has_event:
                        status = 'PP' if data.weekday() >= 5 else 'SD'
                
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
            
            tabela_visualizacao.append({
                'id': cid_formatado,
                'raw_id': cid,
                'UP': contagem['UP'], 'SD': contagem['SD'], 'PQ': contagem['PQ'], 'PP': contagem['PP'],
                'day_data': daily_statuses, 
                'is_ignored': is_ignored_manually,
                'is_zero_up': (contagem['UP'] == 0 and contagem['PQ'] == 0)
            })

        # 4. KPI
        if circuitos_ativos_count == 0: media_up, media_sd, media_pp, media_pq = 0, 0, 0, 0
        else:
            media_up = sum(kpi_up) / circuitos_ativos_count
            media_sd = sum(kpi_sd) / circuitos_ativos_count
            media_pp = sum(kpi_pp) / circuitos_ativos_count
            media_pq = sum(kpi_pq) / circuitos_ativos_count
        
        tempo_disponivel = dias_no_mes - media_pp - media_sd
        
        # --- ALTERAÇÃO SOLICITADA ---
        # Fórmula forçada: UP - PQ - SD
        tempo_real = max(0, media_up - media_pq - media_sd)
        
        disp = (tempo_real / tempo_disponivel * 100) if tempo_disponivel > 0.01 else 0.0
        disp = min(100, max(0, disp))
        
        perf = min(100, max(0, (perf_exec / perf_solic * 100) if perf_solic > 0 else 100.0))
        qual = min(100, max(0, (qual_prazo / qual_emit * 100) if qual_emit > 0 else 100.0))
        oee = (disp/100) * (perf/100) * (qual/100) * 100
        
        # --- TENDÊNCIA HISTÓRICA ---
        historico = ler_historico()
        trend_chart = []
        
        for h in historico:
            trend_chart.append({"name": h['name'], "oee": h['OEE'], "target": 85})
        
        label_atual = f"{int(mes)}/{int(ano)}"
        if not any(d['name'] == label_atual for d in trend_chart):
             trend_chart.append({"name": label_atual, "oee": round(oee, 1), "target": 85})

        return {
            "sucesso": True,
            "kpi": { "oee": round(oee, 1), "availability": round(disp, 1), "performance": round(perf, 1), "quality": round(qual, 1) },
            "trendData": trend_chart,
            "details": tabela_visualizacao, 
            "meta": { "ano": ano, "mes": mes, "circuitos_ativos": circuitos_ativos_count, "total_instalado": capacidade_total, "dias_no_mes": dias_no_mes }
        }

    except Exception as e:
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}

# --- HISTÓRICO ---
def salvar_historico(dados_kpi, mes, ano):
    try:
        nova = pd.DataFrame([{ 'periodo': f"{ano}-{mes:02d}-01", 'mes': mes, 'ano': ano, 'oee': dados_kpi['oee'], 'disponibilidade': dados_kpi['availability'], 'performance': dados_kpi['performance'], 'qualidade': dados_kpi['quality'] }])
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
        return [{"name": f"{int(r.mes)}/{int(r.ano)}", "OEE": r.oee, "Disponibilidade": r.disponibilidade, "Performance": r.performance, "Qualidade": r.qualidade} for _, r in df.iterrows()]
    except: return []