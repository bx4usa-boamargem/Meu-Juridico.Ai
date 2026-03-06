---
name: peticao-inteligente
description: "Gera petições jurídicas e manifestações em massa baseadas no contexto do processo e metadados do órgão público."
---

# Petição Inteligente (Mass Petition Generator)

Esta skill é projetada para ajudar Procuradores do Município e Advogados Públicos a escalar a produção de teses de defesa, manifestações, contestações e recursos.

## Escopo de Atuação
A skill varre um diretório de processos (ou metadados json fornecidos num batch) e usa o LLM para cruzar:
1. Os fatos principais de cada caso (ex: falhas em licitações, dívida ativa).
2. Tese jurídica padronizada do órgão.
3. Jurisprudência local (TCE/TJ).

## Instruções de Uso
Quando acionada para "gerar petição":
1. Solicite ao LLM que adote o **tom formal, impessoal e contundente** de um Procurador da Fazenda/Município.
2. Identifique o endereçamento correto (Vara da Fazenda Pública, TCE, etc.).
3. Estruture em: PRELIMINARES, MÉRITO, PEDIDOS e REQUERIMENTOS.
4. NUNCA gere ficção jurídica (alucinação) — cite apenas leis reais (Constituição, Código Civil, CPC, Lei 14.133/21).

## Componentes Inclusos
- `templates/`: Modelos de esqueleto de petição em Markdown/DOCX.
- `scripts/`: Processador em lote (Python) para ler `N` processos e fazer N chamadas à API, gerando petições em massa.
