import pandas as pd
import numpy as np
from calendar import monthrange
from datetime import datetime
import re
import traceback
import math
import firebase_admin
from firebase_admin import firestore

GLOBAL_DB = {
    "processed_data": {}, 
    "overrides": {},        
    "meta": {},
    "latest_medias": {}
}

def get_firebase():
    try:
        return firestore.client()
    except:
        return None

def processar_upload_oee(file_path, target_mes, target_ano):
    try:
        GLOBAL_DB["processed_data"] = {}
        GLOBAL_DB["overrides"] = {}
        
        target_mes = int(target_mes)
        target_ano = int(target_ano)
        
        dict_dfs = pd.read_excel(file_path, sheet_name=None)
        dfs_validos = []

        alias_map = {
            'circuito': ['circuito', 'circuit', 'ckt', 'id'],
            'start': ['start time', 'starttime', 'inicio', 'início', 'data inicial'],
            'stop': ['stop time', 'stoptime', 'fim', 'data final']
        }

        for nome_aba, df in dict_dfs.items():
            if not str(nome_aba).lower().startswith('dig'): continue
            if df.empty: continue

            cols_originais = {col: str(col).lower().strip().replace('_', '') for col in df.columns}
            rename_dict = {}

            for original, limpo in cols_originais.items():
                for padrao, aliases in alias_map.items():
                    if limpo in aliases:
                        rename_dict[original] = padrao
                        break
            df.rename(columns=rename_dict, inplace=True)

            if 'circuito' in df.columns and 'start' in df.columns:
                if 'stop' not in df.columns: df['stop'] = pd.NaT
                dfs_validos.append(df[['circuito', 'start', 'stop']])

        if not dfs_validos:
            return {"sucesso": False, "erro": "Nenhuma aba válida."}

        df_final = pd.concat(dfs_validos, ignore_index=True)
        df_final['start'] = pd.to_datetime(df_final['start'], dayfirst=True, errors='coerce')
        df_final['stop'] = pd.to_datetime(df_final['stop'], dayfirst=True, errors='coerce')
        df_final.dropna(subset=['start'], inplace=True)

        _, dias_no_mes = monthrange(target_ano, target_mes)
        
        def limpar_id(val):
            nums = re.findall(r'\d+', str(val))
            return str(int(nums[0])) if nums else str(val).strip()

        df_final['clean_id'] = df_final['circuito'].apply(limpar_id)
        
        circuitos_eventos = {}
        circuitos_encontrados = set()

        for _, row in df_final.iterrows():
            cid = row['clean_id']
            circuitos_encontrados.add(cid)
            if cid not in circuitos_eventos: circuitos_eventos[cid] = []
            
            start = row['start']
            stop = row['stop'] if not pd.isna(row['stop']) else datetime(target_ano + 1, 1, 1)
            circuitos_eventos[cid].append((start, stop))

        mapa_final = {}
        lista_ids = ['iDevice'] + [str(i) for i in range(1, 451)]

        for cid in lista_ids:
            status_array = []
            eventos = circuitos_eventos.get(cid, [])
            
            for dia in range(1, dias_no_mes + 1):
                dia_inicio = datetime(target_ano, target_mes, dia, 0, 0, 0)
                dia_fim = datetime(target_ano, target_mes, dia, 23, 59, 59)
                is_weekend = dia_inicio.weekday() >= 5
                
                status_dia = 'PP' if is_weekend else 'SD'
                
                for start, stop in eventos:
                    if start <= dia_fim and stop >= dia_inicio:
                        status_dia = 'UP'
                        break
                
                status_array.append(status_dia)
            
            mapa_final[cid] = status_array

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

        kpi_inputs = {
            'exec': float(params.get('ensaios_executados', 0)),
            'solic': float(params.get('ensaios_solicitados', 0)),
            'emit': float(params.get('relatorios_emitidos', 0)),
            'prazo': float(params.get('relatorios_no_prazo', 0))
        }

        capacidade_total = int(params.get('capacidade_total', 450)) 
        limite_fixo = 300 
        
        todos_candidatos = []
        ids_raw = [k for k in db_data.keys() if k != 'iDevice']
        
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

        candidatos_ordenados = sorted(todos_candidatos, key=lambda x: (-x['score_up'], x['score_sd']))

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

                if override_action == 'SET_UP': status = 'UP' 
                elif override_action == 'force_std': status = 'PP' if is_weekend else 'UP' 
                elif override_action == 'SET_BONUS': 
                    if status in ['SD', 'PP']: status = '' 

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

        tempo_disponivel_global = dias_no_mes - media_pp - media_sd
        tempo_operacao_real = media_up - media_pq - media_sd

        if tempo_disponivel_global <= 0.001:
            disp_global = 0
        else:
            disp_global = tempo_operacao_real / tempo_disponivel_global

        perf_global = (kpi_inputs['exec'] / kpi_inputs['solic']) if kpi_inputs['solic'] > 0 else 0
        qual_global = (kpi_inputs['prazo'] / kpi_inputs['emit']) if kpi_inputs['emit'] > 0 else 0

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

        doc_id = f"{mes}_{ano}"
        history_ref = db.collection('lab_data').document('history').collection('oee_monthly')
        
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

def listar_historico():
    db = get_firebase()
    if not db: return {"sucesso": False, "erro": "Firebase Off"}
    try:
        docs = db.collection('lab_data').document('history').collection('oee_monthly').stream()
        lista = []
        for doc in docs:
            dado = doc.to_dict()
            dado['id_doc'] = doc.id
            lista.append(dado)
        return {"sucesso": True, "historico": lista}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

def delete_history_record(mes, ano):
    db = get_firebase()
    if not db: return {"sucesso": False, "erro": "Firebase Off"}
    try:
        doc_id = f"{mes}_{ano}"
        db.collection('lab_data').document('history').collection('oee_monthly').document(doc_id).delete()
        return {"sucesso": True}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

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

            count_up = dias.count('UP')
            count_pq = dias.count('PQ')
            count_sd = dias.count('SD')
            count_pp = dias.count('PP')
            
            if acao_atual == 'SET_UP': count_up = 30 

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

        if excedente <= 0:
            return {
                "sucesso": True, 
                "mensagem": f"Apenas {total_usados} circuitos em uso. Não ultrapassou o limite de {limite_fixo}.",
                "relatorio": None
            }

        candidatos.sort(key=lambda x: x['score'], reverse=True)
        novos_extras = candidatos[:excedente]
        
        count_aplicados = 0
        total_sd_removido = 0
        total_pp_removido = 0
        lista_ids = []

        for item in novos_extras:
            cid = item['id']
            total_sd_removido += item['sd']
            total_pp_removido += item['pp']
            lista_ids.append(cid)
            GLOBAL_DB["overrides"][cid] = 'SET_BONUS'
            count_aplicados += 1
        
        lista_ids.sort(key=lambda x: int(x) if x.isdigit() else 9999)

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