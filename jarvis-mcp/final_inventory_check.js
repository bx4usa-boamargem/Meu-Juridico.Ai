const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/severinobione/Antigravity -meu-juridico-ai/jarvis-mcp/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data: agents } = await supabase.from('jarvis_agents').select('count', { count: 'exact' });
  const { data: skills } = await supabase.from('jarvis_skills').select('count', { count: 'exact' });
  const { data: activeAgents } = await supabase.from('jarvis_agents').select('id').eq('lifecycle', 'active');
  const { data: activeSkills } = await supabase.from('jarvis_skills').select('id').eq('lifecycle', 'active');
  const { data: rules } = await supabase.from('jarvis_router_rules').select('id').eq('is_active', true);
  
  console.log('AGENTES_TOTAL:', agents[0].count);
  console.log('SKILLS_TOTAL:', skills[0].count);
  console.log('AGENTES_ATIVOS:', activeAgents.length);
  console.log('SKILLS_ATIVAS:', activeSkills.length);
  console.log('ROUTER_RULES_ATIVAS:', rules.length);
}
check();
