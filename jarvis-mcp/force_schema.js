const { Client } = require('pg');

const connectionString = "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres";
const sql = require('fs').readFileSync('/Users/severinobione/Antigravity -meu-juridico-ai/supabase/migrations/20260307000000_jarvis_registry.sql', 'utf8');

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();

    console.log("Forçando drop tables...");
    const drops = [
      "DROP TABLE IF EXISTS public.jarvis_agent_skill_links CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_execution_history CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_agent_versions CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_skill_versions CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_router_rules CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_builder_logs CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_agent_categories CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_skill_categories CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_agent_skills CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_agents CASCADE;",
      "DROP TABLE IF EXISTS public.jarvis_skills CASCADE;"
    ];
    for (const d of drops) {
      await client.query(d);
    }

    console.log("Aplicando DDL v2 completo...");
    await client.query(sql);

    console.log("Feito! Executando verificacao:");
    const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name LIKE 'jarvis_%' AND column_name = 'id'
    `);
    console.log(res.rows);

  } catch (e) { console.error("!!! ERRO CRITICO:", e); }
  await client.end();
}
run();
