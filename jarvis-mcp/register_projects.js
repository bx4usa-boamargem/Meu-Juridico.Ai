const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function register() {
  console.log('Registrando projetos...');
  
  const projects = [
    { name: 'MeuJuridico', path: '/Users/severinobione/Antigravity -meu-juridico-ai/antigravity-kit/Meu-Juridico.Ai' },
    { name: 'Omniseen', path: '/Users/severinobione/Antigravity -meu-juridico-ai' }
  ];

  for (const p of projects) {
    const { data, error } = await supabase.from('jarvis_projects').upsert(p, { onConflict: 'name' }).select();
    if (error) {
      console.error(`Erro ao registrar ${p.name}:`, error.message);
    } else {
      console.log(`Projeto ${p.name} registrado com sucesso!`);
    }
  }
}

register();
