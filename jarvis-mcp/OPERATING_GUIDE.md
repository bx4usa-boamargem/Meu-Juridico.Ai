# Guia Rápido de Operação - Jarvis OS (v2)

Bem-vindo à fase operacional do Jarvis OS. Este guia resume como você interage com o sistema agora.

## 🛠 Comandos Disponíveis (Whitelist)

Você já pode dar as seguintes ordens ao Jarvis no ChatGPT Desktop:

1.  **Consultar Status**: "Jarvis, qual o status do projeto [id]?"
2.  **Verificar Logs/Tasks**: "Jarvis, quais as últimas tarefas de [id]?"
3.  **Disparar Verificações**: "Jarvis, rode um [security_scan|lint|tests] no projeto [id]."
4.  **Gerenciar Inventário**: "Jarvis, mostre os agentes registrados." ou "Quais skills temos ativas?"
5.  **Expandir Sistema**: "Jarvis, crie um novo agente especialista em [domínio]."
6.  **Adicionar Skills**: "Jarvis, registre uma nova skill para [ferramenta]."

## 🔒 Fluxos e Segurança

-   **Aprovação Mandatória**: Agentes criados em domínios críticos (Legal, Finance, Tax) nascem como `draft`. Eles não aparecem no router até serem aprovados.
-   **Hardening**: O acesso ao Supabase está restrito via `SERVICE_ROLE` no MCP, garantindo que o Jarvis tenha as permissões necessárias sem expor chaves públicas.
-   **Auditoria**: Toda criação de agente ou mudança de status é logada na tabela `jarvis_builder_logs`.

## 📱 Próximos Passos (Mobile)

Para usar no mobile (app ChatGPT), estamos preparando o endpoint HTTPS via Supabase Edge Functions. O desktop já funciona localmente via STDIO.

---
*Jarvis OS: Construindo o futuro da produtividade jurídica e estratégica.*
