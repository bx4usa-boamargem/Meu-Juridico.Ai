const { Client } = require('pg');

const connectionString = "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Aplicando ALTER TABLE jarvis_projects...");
    await client.query("ALTER TABLE public.jarvis_projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';");
    console.log("Tabela atualizada!");
  } catch(e) { console.error("ERRO:", e); }
  await client.end();
}
run();
