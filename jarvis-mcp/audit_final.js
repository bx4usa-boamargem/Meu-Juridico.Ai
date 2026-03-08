const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/severinobione/Antigravity -meu-juridico-ai/jarvis-mcp/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function audit() {
  const { data: agents } = await supabase.from('jarvis_agents').select('id, lifecycle');
  const { data: skills } = await supabase.from('jarvis_skills').select('id, lifecycle');
  console.log('--- INVENTÁRIO REAL ---');
  console.log('Agentes Registrados:', agents.length);
  console.log('Agentes Ativos:', agents.filter(a => a.lifecycle === 'active').length);
  console.log('Skills Registradas:', skills.length);
  console.log('Skills Ativas:', skills.filter(s => s.lifecycle === 'active').length);
}
audit();
