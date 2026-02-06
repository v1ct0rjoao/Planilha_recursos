from datetime import datetime, timedelta
import re

# --- TABELA DE DURAÇÃO DOS TESTES ---
# Aqui você define quanto tempo dura cada teste (em dias ou horas)
# O sistema vai usar isso para calcular a data de fim.
DURACAO_TESTES = {
    "SAEJ2801": {"dias": 8, "horas": 0},
    "RC20":     {"dias": 3, "horas": 0},
    "C20":      {"dias": 1, "horas": 0},
    "J240":     {"dias": 5, "horas": 12},
    # Adicione outros testes aqui conforme precisar
}

def calcular_previsao_fim(data_inicio_str, nome_teste):

    try:
      
        duracao = None
        for chave, tempo in DURACAO_TESTES.items():
            if chave in nome_teste.upper():
                duracao = tempo
                break
        
        if not duracao:
            return "Desconhecido (Configurar tempo)"


        formato = "%d/%m/%Y %H:%M" 
        inicio = datetime.strptime(data_inicio_str, formato)
        
        # Soma o tempo
        fim = inicio + timedelta(days=duracao['dias'], hours=duracao['horas'])
        
        return fim.strftime("%d/%m/%Y %H:%M")

    except Exception as e:
        return f"Erro data: {str(e)}"

def validar_id_bateria(id_bateria, nome_teste):
    
    if not id_bateria or not nome_teste:
        return "Indefinido"

    id_upper = id_bateria.upper()
    teste_upper = nome_teste.upper()


    if "_1C20" in id_upper:
        if "C20" in teste_upper or "2801" in teste_upper:
            return "OK"
        else:
            return "ALERTA: ID indica C20, mas teste é diferente"
            

    if "HV" in id_upper and "LV" in teste_upper:
        return "PERIGO: Bateria HV em teste LV"

    return "OK"