const { Client } = require('pg');
const fs = require('fs');

const connectionString = "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres";
const sql = fs.readFileSync('/Users/severinobione/Antigravity -meu-juridico-ai/supabase/migrations/20260307000000_jarvis_registry.sql', 'utf8');

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Limpar o legado antigo (UUID) que está travando o novo schema (TEXT)
    console.log("Droppando tabelas velhas com tipos incompatíveis...");
    await client.query(`
      DROP TABLE IF EXISTS public.jarvis_agent_skill_links CASCADE;
      DROP TABLE IF EXISTS public.jarvis_execution_history CASCADE;
      DROP TABLE IF EXISTS public.jarvis_agent_versions CASCADE;
      DROP TABLE IF EXISTS public.jarvis_skill_versions CASCADE;
      DROP TABLE IF EXISTS public.jarvis_router_rules CASCADE;
      DROP TABLE IF EXISTS public.jarvis_builder_logs CASCADE;
      DROP TABLE IF EXISTS public.jarvis_agent_categories CASCADE;
      DROP TABLE IF EXISTS public.jarvis_skill_categories CASCADE;
      
      -- Projetos, Tasks e Logs eu vou alterar para manter logica, mas agents e skills vou dropar para recriar
      DROP TABLE IF EXISTS public.jarvis_agent_skills CASCADE;
      DROP TABLE IF EXISTS public.jarvis_agents CASCADE;
      DROP TABLE IF EXISTS public.jarvis_skills CASCADE;
      
      -- Em relacao a proj e tasks, mudar pra TEXT para bater com o q precisamos se estiverem UUID
      ALTER TABLE IF EXISTS public.jarvis_projects ALTER COLUMN id TYPE TEXT USING id::text;
    `);
    
    console.log("Aplicando DDL da Migration v2 original...");
    await client.query(sql);
    
    console.log("Schema Corrigido e Reconstruído com sucesso.");
  } catch (err) {
    console.error("Erro na Migration:", err);
  } finally {
    await client.end();
  }
}

run();
