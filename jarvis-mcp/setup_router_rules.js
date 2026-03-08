const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/severinobione/Antigravity -meu-juridico-ai/jarvis-mcp/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function setup() {
  const rules = [
    { agent_id: 'tax-compliance-master', intent_pattern: 'tributário|imposto|fiscal|brase|iss|icms', is_active: true },
    { agent_id: 'finance-expert', intent_pattern: 'financeiro|caixa|margem|investimento|custo', is_active: true },
    { agent_id: 'growth-strategist', intent_pattern: 'vendas|crescimento|marketing|aquisição|leads', is_active: true },
    { agent_id: 'market-intelligence', intent_pattern: 'competidor|concorrência|mercado|benchmarking', is_active: true },
    { agent_id: 'biblical-studies-agent', intent_pattern: 'bíblia|teologia|cristão|evangelho', is_active: true },
    { agent_id: 'medical-researcher', intent_pattern: 'médico|saúde|doença|pesquisa médica', is_active: true },
    { agent_id: 'learning-expert', intent_pattern: 'educação|estudo|aprendizado|didática', is_active: true }
  ];

  console.log('Configurando regras de roteamento...');
  await supabase.from('jarvis_router_rules').upsert(rules);
  console.log('Regras configuradas.');
}
setup();
