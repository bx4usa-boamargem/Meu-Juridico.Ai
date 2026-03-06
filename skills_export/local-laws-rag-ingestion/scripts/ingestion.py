import os
import argparse

def extract_text_from_pdf(pdf_path):
    """
    Simula a extração de texto de uma Lei Municipal em PDF
    """
    return "Art. 1º Fica criada a Lei de Contratos do Município X. \n Art. 2º É obrigatório o selo ecológico."

def chunk_text(text, chunk_size=500):
    """
    Quebra a lei em pedaços (Chunks) menores para caber no limite do Embedding.
    """
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def embed_and_store(chunks, tenant_id, law_title):
    """
    Mock: Recebe os pedaços de texto, gera "Vetores" via IA e insere no Banco (ex: pgvector ou Pinecone)
    """
    print(f"\n[RAG INGESTION] Processando arquivo: {law_title} (Tenant ID: {tenant_id})")
    for idx, chunk in enumerate(chunks):
        # Aqui chamaria openai.embeddings.create(input=chunk, model="text-embedding-3-small")
        # E depois supabase.table('municipal_laws_embeddings').insert({...})
        print(f"  -> Salvando Chunk {idx + 1}/{len(chunks)} no banco de vetores VDB...")
    print(f"[RAG INGESTION] Lei ingerida e pronta para o Agente Supremo e cruzamento de dados!\n")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tenant-id', required=True, help="ID da prefeitura (ex: id da org no tenant)")
    parser.add_argument('--source', required=True, help="O caminho do PDF da lei na máquina")
    
    args = parser.parse_args()
    
    texto_lei = extract_text_from_pdf(args.source)
    pedacos = chunk_text(texto_lei)
    nome_arquivo = os.path.basename(args.source)
    
    embed_and_store(pedacos, args.tenant_id, nome_arquivo)

if __name__ == "__main__":
    main()
