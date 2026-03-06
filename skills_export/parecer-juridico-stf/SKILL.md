---
name: parecer-juridico-stf
description: "Realiza análise jurídica de alto nível (padrão STF) sobre processos, contratos e editais, buscando segurança institucional e cruzamento de jurisprudência."
---

# Analisador e Parecerista Nível STF

Esta skill tem a missão de elevar a qualidade de qualquer análise legal do órgão público, fornecendo pareceres densos, tecnicamente impecáveis e baseados nas Cortes Superiores do Brasil (STF, STJ, TCU).

## Quando Acionar
Sempre que um gestor, Prefeito ou Procurador-Geral precisar assinar um documento sensível, firmar um grande contrato ou analisar um edital com risco de impugnação, utilize esta skill para um parecer colegiado.

## Instruções para o LLM
1. **Profundidade Doutrinária**: O parecer deve citar princípios constitucionais aplicáveis (ex: Impessoalidade, Moralidade, Eficiência - Art. 37 CF).
2. **Cruzamento Jurisprudencial**: Ao invés de uma resposta binária "pode/não pode", apresente o entendimento predominante do TCU (Tribunal de Contas da União) e as teses formadas em Repercussão Geral no STF.
3. **Formatos Entregues**:
   - `[ANÁLISE DE RISCO]`: 1 parágrafo "executivo".
   - `[FUNDAMENTAÇÃO]`: O corpo central do parecer (2-3 páginas de densidade técnica).
   - `[CONCLUSÃO E RECOMENDAÇÃO]`: "Aprova", "Rejeita" ou "Aprova com Ressalvas".

## Estrutura da Skill
- `scripts/`: Código de integração (mock ou real) para consultar bancos abertos (como API do STF/TCU).
- `references/`: Arquivos contendo as teses de Repercussão Geral mais comuns na gestão pública.
