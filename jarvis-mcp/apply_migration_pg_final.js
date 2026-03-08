const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres"
});

async function run() {
  try {
    await client.connect();
    console.log('Conectado ao banco (Novo Jarvis Project)!');
    const sql = fs.readFileSync('supabase/migrations/20260307_jarvis_core.sql', 'utf-8');
    await client.query(sql);
    console.log('Migration aplicada com sucesso!');
  } catch (err) {
    console.error('Erro ao aplicar migration:', err.message);
  } finally {
    await client.end();
  }
}

run();
