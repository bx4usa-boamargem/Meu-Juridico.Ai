const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Tentando aplicar via RPC ou SDK se possível, ou apenas testando permissão
async function run() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Tentando criar tabelas via SDK (Schema Admin)...');
  const sql = fs.readFileSync('supabase/migrations/20260307_jarvis_core.sql', 'utf-8');
  
  // Supabase JS SDK não suporta DDL diretamente sem RPC configurado.
  // Vou tentar um truque de verificação de permissão.
  const { error } = await supabase.from('jarvis_projects').select('count').limit(1);
  
  if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
     console.log('Confirmado: Tabelas não existem. Tentando aplicar via Postgres Direto...');
  }
}
run();
