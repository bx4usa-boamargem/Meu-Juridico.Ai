---
name: legal-document-explainer
description: "Analisa, resume e extrai riscos de documentos jurídicos (contratos, editais, termos) em linguagem simples."
---

# Legal Document Explainer

Esta skill consolida as melhores práticas para análise de documentos jurídicos (Contratos, Termos de Serviço, Políticas de Privacidade, Editais, etc.). 

## Objetivo
Transformar um texto jurídico denso em um resumo em "linguagem simples" (Plain Portuguese), destacando armadilhas, atribuindo um Placar de Risco e sugerindo perguntas críticas.

## Instruções de Uso
Quando o usuário enviar um documento jurídico e pedir para analisar:
1. **Resumo:** Explique em 2-3 parágrafos o objetivo real do documento, sem jargões.
2. **Cláusulas Problemáticas:** Identifique multas desproporcionais, renovação automática, cessão de direitos, foro abusivo, ou coleta excessiva de dados.
3. **Placar de Risco (Baixo / Médio / Alto):** Atribua o placar com base no volume de cláusulas leoninas.
4. **Perguntas Práticas:** Liste 3 perguntas que o gestor/usuário DEVE fazer à outra parte ou à sua assessoria jurídica antes de assinar.

## Estrutura
- `scripts/`: Contém scripts em Python ou JS para extração massiva de PDFs/Word (ex: `extract_clauses.py`).
- `references/`: Manuais do TCU/TCE e boas práticas de contratos.
- `assets/`: Templates de relatório final.
