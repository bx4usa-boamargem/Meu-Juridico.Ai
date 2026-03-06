---
name: local-laws-rag-ingestion
description: "Processador de ingestão RAG (Retrieval-Augmented Generation) para Leis, Decretos e Portarias Municipais locais. Alimenta o cérebro dos Agentes com a realidade de cada cidade."
---

# RAG de Normas Internas (Ingestão)

Esta skill resolve o problema da "miopia do LLM" em relação às leis municipais e regimentos locais que nunca foram treinados nos modelos da OpenAI ou Anthropic.

## Contexto do Problema (O Áudio)
Quando os Agentes (como o *Procurador Supremo* ou o *Agente de Inteligência Cruzada*) analisam um edital do município de "Vinhedo", eles sabem tudo do TCU e STF. **Porém, eles não sabem que o decreto nº 500/2022 de Vinhedo exige uma cláusula específica.** 
Se tentarmos colocar a lei no prompt, o token limit estoura.

## Como funciona esta Skill:
1. **Conector de Input:** O gestor sobe PDF/DOCX ou conecta a API do site da Câmara dos Vereadores no front-end.
2. **Vetorização (A Skill atua aqui):** Esta skill pega essas leis, "fatia" (chunking) usando `langchain`, cria embeddings (usando o `text-embedding-3-small` da OpenAI ou o do Gemini) e salva isso no banco de dados vetorial (`Supabase pgvector`).
3. **Injeção Silenciosa:** Cada vez que o agente vai ler um processo, a engine RAG levanta as leis locais daquela prefeitura específica isolando os dados de um cliente (`tenant_id`) dos dados do outro.

## Uso (Admin / Data Ops)
O administrador roda o script de ingestão enviando a URL do repositório da prefeitura ou o caminho da pasta:
\`python scripts/ingestion.py --tenant-id 123 --source ./leis_vinhedo_pdf\`
