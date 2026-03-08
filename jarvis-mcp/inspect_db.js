const { Client } = require('pg');

const connectionString = "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();

    // Check tables ID type
    const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name LIKE 'jarvis_%' AND column_name IN ('id', 'agent_id', 'skill_id', 'parent_version_id')
    `);

    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) { console.error(e); }
  await client.end();
}
run();
