import os
import sys
import json
import time
import requests
import re
from datetime import datetime, timedelta
from supabase import create_client, Client

# Tentar importar PyMuPDF para extração de PDFs nativos
try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERRO: É necessário instalar o PyMuPDF: pip install PyMuPDF")
    sys.exit(1)

# Configurações do Supabase via Variaveis de Ambiente do Projeto
SUPABASE_URL = os.getenv("SUPABASE_URL", "COLOQUE_AQUI_SEU_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "COLOQUE_AQUI_SUA_CHAVE_SERVICE_ROLE")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Erro ao conectar no Supabase (verifique as variáveis de ambiente): {e}")

# Escopo Geográfico (Estados alvo)
UFS_ALVO = ["SP", "RJ", "MG", "ES", "PR", "SC", "RS"]
# Modalidades prioritárias: 6 (Pregão Eletrônico), 2 (Concorrência) etc. Mas o PNCP usa ids específicos.

def search_pncp(data_inicial, data_final, uf, pagina=1):
    """Busca contratos/licitações no PNCP"""
    url = f"https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial={data_inicial}&dataFinal={data_final}&uf={uf}&pagina={pagina}&tamanhoPagina=50"
    headers = {'Accept': 'application/json'}
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            return r.json().get('data', [])
        return []
    except Exception as e:
        print(f"Erro na API PNCP UF {uf}: {e}")
        return []

def get_contratacao_arquivos(cnpj, ano, sequencial):
    """Obtém anexos da contratação"""
    url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            return r.json()
        return []
    except Exception:
        return []

def classify_document(title, first_page_text):
    """Classifica qual o tipo do documento baseado no título do anexo e no texto."""
    title = title.lower()
    text = first_page_text.lower()[:3000]

    if "estudo" in title and "tecnico" in title or "etp" in title: return "ETP"
    if "termo" in title and "referencia" in title or " tr " in title or " tr." in title: return "TR"
    if "formalizacao" in title and "demanda" in title or "dfd" in title: return "DFD"
    if "mapa" in title and "risco" in title: return "Mapa de Riscos"
    if "pesquisa" in title and "preco" in title or "mercado" in title: return "Pesquisa Preços"
    if "plano" in title and "contratacao" in title and "anual" in title or "pca" in title: return "PCA"
    
    # Fallback pro texto
    if "termo de referência" in text: return "TR"
    if "estudo técnico preliminar" in text: return "ETP"
    if "formalização da demanda" in text: return "DFD"
    if "mapa de riscos" in text: return "Mapa de Riscos"
    if "pesquisa de preços" in text: return "Pesquisa Preços"
    if "plano de contratações anual" in text: return "PCA"

    return None

def extract_text_from_pdf(pdf_bytes):
    """Extrai texto e avalia qualidade semantica(não OCR, mas text nativo)."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        
        word_count = len(text.split())
        
        # Qualidade:
        # 1 - muito curto
        # 2 - curto, talvez incompleto
        # 3 - doc padrao (>500 words)
        # 4 - doc bom (> 1500)
        # 5 - excelente (> 3000 words + contem indices claros)
        score = 0
        if word_count > 3000: score = 5
        elif word_count > 1500: score = 4
        elif word_count > 500: score = 3
        elif word_count > 200: score = 2
        else: score = 1
        return text, score, word_count
    except Exception:
        return "", 0, 0

def collect_docs():
    print("Iniciando Pipeline de Coleta (RAG - Documentos Reais)")
    # Periodo ultimos 3 meses (90 dias)
    hoje = datetime.now()
    inicio = hoje - timedelta(days=90)
    data_final = hoje.strftime("%Y%m%d")
    data_inicial = inicio.strftime("%Y%m%d")

    totais_salvos = 0

    for uf in UFS_ALVO:
        print(f"\n--- Coletando no estado: {uf} ---")
        for pagina in range(1, 10): # pegar até as 500 ultimas de cada UF (10*50)
            print(f"Buscando pagina {pagina} do {uf}...")
            compras = search_pncp(data_inicial, data_final, uf, pagina)
            if not compras: break

            for compra in compras:
                valor_global = float(compra.get("valorTotalEstimado", 0))
                if valor_global < 100000:
                    continue # Focar em licitações maiores para achar ETP completo
                
                cnpj = compra.get("orgaoEntidade", {}).get("cnpj")
                ano = compra.get("anoCompra")
                seq = compra.get("numeroCompra")
                uf_orgao = compra.get("orgaoEntidade", {}).get("ufId") or uf
                esfera = compra.get("orgaoEntidade", {}).get("esferaId")
                esfera_str = "federal" if esfera in ["F", "U"] else "estadual" if esfera == "E" else "municipal"

                arquivos = get_contratacao_arquivos(cnpj, ano, seq)
                for arq in arquivos:
                    titulo_arq = arq.get("titulo", "")
                    url_arq = arq.get("linkArquivo")
                    if not url_arq or not url_arq.endswith(".pdf"):
                        continue
                    
                    try:
                        print(f"Baixando PDF: {titulo_arq}...")
                        r_pdf = requests.get(url_arq, timeout=20)
                        if r_pdf.status_code == 200:
                            texto_extraido, score, words = extract_text_from_pdf(r_pdf.content)
                            
                            if score < 3: # Regra de Negocio do Briefing: Descartar Docs < 500 palavras
                                print(f"Descartado (Score {score}, Words {words}): curto/imagem escaneada sem OCR.")
                                continue
                            
                            tipo_doc = classify_document(titulo_arq, texto_extraido[:2000])
                            if not tipo_doc:
                                continue # nao reconhecido
                            
                            # Inserir no Supabase
                            dados = {
                                "tipo": tipo_doc,
                                "orgao": compra.get("orgaoEntidade", {}).get("razaoSocial", "N/I"),
                                "uf": uf_orgao,
                                "esfera": esfera_str,
                                "objeto": compra.get("objetoCompra", ""),
                                "valor_estimado": valor_global,
                                "conteudo_texto": texto_extraido,
                                "url_fonte": url_arq,
                                "data_publicacao": compra.get("dataPublicacaoPncp", "")[:10],
                                "qualidade_score": score
                            }
                            
                            supabase.table("document_templates").insert(dados).execute()
                            totais_salvos += 1
                            print(f"[SALVO OK] -> {tipo_doc} - Score {score} - Orgao: {dados['orgao']}")
                            
                    except Exception as e:
                        print(f"Falha ao baixar/processar PDF: {url_arq} -> {e}")
                        
            # Pausa para evitar rate limit agressivo
            time.sleep(1)

    print(f"\n✅ PIPELINE CONCLUIDO! {totais_salvos} Documentos classificados e salvos no RAG.")

if __name__ == "__main__":
    collect_docs()
