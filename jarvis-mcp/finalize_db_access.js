const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres"
});

async function run() {
  try {
    await client.connect();
    console.log('Habilitando acesso total (Disable RLS)...');
    
    const tables = ['jarvis_projects', 'jarvis_tasks', 'jarvis_logs'];
    for (const table of tables) {
        await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
        console.log(`RLS desabilitado para ${table}`);
    }

    const { rows } = await client.query("SELECT name FROM jarvis_projects");
    console.log('Projetos registrados:', rows.map(r => r.name).join(', '));
    
  } catch (err) {
    console.error('Erro ao finalizar banco:', err.message);
  } finally {
    await client.end();
  }
}

run();
