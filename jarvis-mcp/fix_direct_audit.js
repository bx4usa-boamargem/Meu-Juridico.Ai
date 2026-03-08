const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data: agents, error: e1 } = await supabase.from('jarvis_agents').select('id, lifecycle, category');
  if(e1) { console.error("Erro Agentes:", e1); process.exit(1); }
  const { data: skills, error: e2 } = await supabase.from('jarvis_skills').select('id, lifecycle');
  const { data: rules } = await supabase.from('jarvis_router_rules').select('agent_id').eq('is_active', true);
  
  const activeAgents = agents.filter(a => a.lifecycle === 'active');
  const activeSkills = skills.filter(s => s.lifecycle === 'active');

  console.log("=== [3] INVENTÁRIO REAL ===");
  console.log(`- total de agentes registrados: ${agents.length}`);
  console.log(`- total de agentes ativos: ${activeAgents.length}`);
  console.log(`- total de agentes roteáveis: ${rules ? rules.length : 0}`);
  console.log(`- total de skills registradas: ${skills.length}`);
  console.log(`- total de skills roteáveis: ${activeSkills.length}`);

  console.log("\n=== [4/5] TESTES REAIS ===");
  const { data: t1 } = await supabase.from('jarvis_projects').select('status').eq('id', 'meujuridico').single();
  console.log("\n-> Teste 1: status do MeuJuridico =>", t1 ? t1.status : 'N/A');

  const { data: t6, error: e6 } = await supabase.from('jarvis_agents').upsert({
    id: 'audit-test-agent', name: 'Audit Test', category: 'system', lifecycle: 'draft', current_version: '1.0.0'
  }).select().single();
  console.log("\n-> Teste 6: criar agente teste =>", t6 ? t6.id : 'N/A');
}
run();
