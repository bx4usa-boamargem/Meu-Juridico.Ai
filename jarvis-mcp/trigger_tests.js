const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function trigger() {
  console.log('Disparando tarefas de teste...');
  
  // Pegar ids dos projetos
  const { data: projects } = await supabase.from('jarvis_projects').select('id, name');
  const meujurId = projects.find(p => p.name === 'MeuJuridico').id;
  const omniId = projects.find(p => p.name === 'Omniseen').id;

  const tasks = [
    { project_id: meujurId, action: 'get_status', params: { detail: 'high' } },
    { project_id: omniId, action: 'list_logs', params: { limit: 5 } },
    { project_id: meujurId, action: 'security_scan', params: { depth: 'quick' } }
  ];

  for (const t of tasks) {
    const { data, error } = await supabase.from('jarvis_tasks').insert(t).select();
    if (error) console.error(`Erro ao criar ${t.action}:`, error.message);
    else console.log(`Tarefa ${t.action} criada (ID: ${data[0].id})`);
  }
}

trigger();
