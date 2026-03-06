# Automação do Fluxo PCA -> Pesquisa de Preços

## Requisito do Usuário
- Quando o usuário criar o **PCA** (Plano de Contratações Anual) indicando que quer comprar 1.000 produtos/serviços ao longo do ano.
- Em vez de o usuário ir manualmente na aba "Pesquisa de Preços" 1000 vezes, o sistema fará isso sozinho.
- A IA vai varrer a lista do PCA e encher o banco de dados com a pesquisa de preços para cada um dos itens.

## Arquitetura Proposta para o "Meu Jurídico AI"

1. **Trigger Inicial no Supabase:**
   - Quando um PCA for salvo e aprovado (ou movido para "Pesquisa Automática"), disparamos um webhook ou Edge Function principal (ex: `orchestrate_pca_search`).

2. **Fila de Processamento (Queue):**
   - Não podemos fazer 1000 chamadas ao PNCP ou PNCP/BLL simultaneamente sem tomar rate limit na Lovable/Supabase.
   - Solução: Criar uma tabela-fila `pca_search_queue` no Supabase.
   - A Edge Function varre os itens e os insere na tabela-fila com status `pending`.

3. **Background Worker (Edge Function via Cron / pg_net):**
   - Uma função agendada (`cron` no Supabase) ou trigger via `pg_net` puxa lotes de 10-20 itens da fila.
   - Para cada item na fila, invoca a nossa já existente `price-research` (ou o mesmo fluxo da UI) silenciosamente.
   - Pega os dados brutos e usa o LLM (Gemini) só se necessário para validar.
   - Salva as cotações na nova tabela `cotacoes_salvas` ou `pncp_price_benchmarks`.

4. **Experiência do Usuário (Frontend):**
   - A tela do PCA do usuário passa a ter um "Dashboard de Evolução de Preços".
   - Mostra: "Temos 1.000 itens. 300 já precificados pela IA. Progresso: 30%".
   - O usuário pode deixar o sistema rodando.

## Vantagem Competitiva (Defensability)
Esse é um fluxo "Hands-off" real. O agente faz o trabalho suado.
