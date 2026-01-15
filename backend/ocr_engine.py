import pytesseract
import cv2
import os
import re

# --- CONFIGURAÇÃO DO TESSERACT (Windows) ---
caminho_tesseract = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(caminho_tesseract):
    pytesseract.pytesseract.tesseract_cmd = caminho_tesseract

def limpar_texto(texto):
    # Remove sujeira comum de OCR (| [ ] { })
    return texto.replace('|', '').replace('[', '').replace(']', '').replace('{', '').replace('}', '').strip()

def processar_imagem_e_dados(caminho_imagem):
    try:
        # 1. Carregar imagem
        imagem = cv2.imread(caminho_imagem)
        if imagem is None: return {"erro": "Imagem inválida"}

        # 2. Tratamento para melhorar leitura de tela de PC
        cinza = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
        # Threshold adaptativo ajuda muito em fotos de monitor com brilho irregular
        processada = cv2.adaptiveThreshold(cinza, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

        # 3. Ler texto bruto
        texto_bruto = pytesseract.image_to_string(processada, config='--psm 6')

        # 4. MINERAÇÃO DE DADOS (Achar o Circuito 169)
        dados_extraidos = []
        linhas = texto_bruto.split('\n')
        
        for linha in linhas:
            linha_limpa = limpar_texto(linha)
            if len(linha_limpa) < 5: continue # Pula linhas vazias

            # --- A MÁGICA DO REGEX ---
            # Procura: "Circuit" ou "Ckt" + espaço opcional + números
            # Ex: "Circuit 169", "Circuit: 169", "Ckt 169"
            match_circuito = re.search(r'(?:Circuit|Cir|Ckt|C)\s*[:.-]?\s*(\d+)', linha_limpa, re.IGNORECASE)
            
            # Procura hora (Ex: 10:00)
            match_hora = re.search(r'(\d{2}:\d{2})', linha_limpa)
            
            if match_circuito:
                # Tenta achar o ID da bateria (geralmente é a palavra mais longa na linha que tem letras e números)
                palavras = linha_limpa.split()
                possivel_id = "Desconhecido"
                for p in palavras:
                    if len(p) > 6 and any(c.isdigit() for c in p) and any(c.isalpha() for c in p):
                        possivel_id = p
                        break

                dados_extraidos.append({
                    "circuito_id": match_circuito.group(1), # Pega só o número (ex: 169)
                    "texto_linha": linha_limpa,
                    "hora_encontrada": match_hora.group(1) if match_hora else "00:00",
                    "possivel_id": possivel_id
                })

        return {
            "texto_bruto": texto_bruto,
            "dados_estruturados": dados_extraidos
        }

    except Exception as e:
        return {"erro": str(e)}