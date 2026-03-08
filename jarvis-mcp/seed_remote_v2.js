const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Iniciando Seed V2...");
  const projects = [
    { id: 'meujuridico', name: 'Meu Jurídico AI', status: 'ativo' },
    { id: 'omniseen', name: 'Omniseen Engine', status: 'ativo' }
  ];
  await supabase.from('jarvis_projects').upsert(projects);
  console.log("Projetos inseridos.");

  const agents = [
    { id: 'tax-compliance-master', name: 'Tax Compliance Master', category: 'finance', lifecycle: 'active', requires_approval: false },
    { id: 'finance-expert', name: 'Finance Expert', category: 'finance', lifecycle: 'active', requires_approval: true },
    { id: 'growth-strategist', name: 'Growth Strategist', category: 'marketing', lifecycle: 'active', requires_approval: true },
    { id: 'market-intelligence', name: 'Market Intelligence', category: 'marketing', lifecycle: 'active', requires_approval: true },
    { id: 'medical-researcher', name: 'Medical Researcher', category: 'health', lifecycle: 'draft', requires_approval: true }
  ];
  const { error: e } = await supabase.from('jarvis_agents').upsert(agents);
  if (e) console.error("Erro inserindo agents:", e.message);
  else console.log(agents.length + " Agentes inseridos/atualizados.");

  const skills = [
    { id: 'tax-compliance-br', name: 'Tax Compliance BR', category: 'finance', lifecycle: 'active', requires_approval: false, provider: 'jarvis' },
    { id: 'market-sizing-analysis', name: 'Market Sizing', category: 'marketing', lifecycle: 'active', requires_approval: true, provider: 'jarvis' },
    { id: 'startup-financial-modeling', name: 'Financial Modeling', category: 'finance', lifecycle: 'active', requires_approval: true, provider: 'jarvis' }
  ];
  const { error: e2 } = await supabase.from('jarvis_skills').upsert(skills);
  if (e2) console.error("Erro inserindo skills:", e2.message);
  else console.log(skills.length + " Skills inseridas/atualizadas.");

  const rules = agents.filter(a => a.lifecycle === 'active').map(a => ({
    agent_id: a.id,
    intent_pattern: a.category,
    priority: 10,
    is_active: true
  }));
  await supabase.from('jarvis_router_rules').upsert(rules);
  console.log("Router Rules configuradas.");

  console.log("Seed V2 concluído com SUCESSO!");
}
run();
