const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres"
});

async function run() {
  try {
    await client.connect();
    const { rows } = await client.query("SELECT * FROM jarvis_projects");
    console.log('Tabela jarvis_projects (PG Direct):', JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

run();
