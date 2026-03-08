const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres"
});

async function run() {
  try {
    await client.connect();
    console.log('Conectado para registro (PG Admin)!');

    const projects = [
      { name: 'MeuJuridico', path: '/Users/severinobione/Antigravity -meu-juridico-ai/antigravity-kit/Meu-Juridico.Ai' },
      { name: 'Omniseen', path: '/Users/severinobione/Antigravity -meu-juridico-ai' }
    ];

    for (const p of projects) {
      await client.query(
        "INSERT INTO jarvis_projects (name, path) VALUES (\$1, \$2) ON CONFLICT (name) DO UPDATE SET path = EXCLUDED.path",
        [p.name, p.path]
      );
      console.log(`Projeto ${p.name} registrado com sucesso!`);
    }
  } catch (err) {
    console.error('Erro ao registrar projetos:', err.message);
  } finally {
    await client.end();
  }
}

run();
