const { Client } = require('pg');
const fs = require('fs');

const connectionString = "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres";
const sql = fs.readFileSync('/Users/severinobione/Antigravity -meu-juridico-ai/supabase/migrations/20260307000000_jarvis_registry.sql', 'utf8');

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Conectado ao Supabase (qasmnhljokhjsiyjwuiq)...");
    
    // Executar a migration inteira PRIMEIRO (CREATE TABLE IF NOT EXISTS garante que não quebre quem já está lá)
    console.log("Aplicando DDLs da Migration principal...");
    await client.query(sql);
    
    // Para colunas adicionadas, precisamos de ALTER TABLE
    // Mas o BD reclamava que "lifecycle" não existe em jarvis_agents, o que implica que a tabela pode ter
    // sido criada parcialmente antes desta migration. Adicionando segurança:
    const alterSQL = `
      ALTER TABLE public.jarvis_agents ADD COLUMN IF NOT EXISTS lifecycle public.jarvis_lifecycle DEFAULT 'draft';
      ALTER TABLE public.jarvis_skills ADD COLUMN IF NOT EXISTS lifecycle public.jarvis_lifecycle DEFAULT 'draft';
      ALTER TABLE public.jarvis_projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
      ALTER TABLE public.jarvis_agents ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE public.jarvis_skills ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE public.jarvis_agents ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true;
      ALTER TABLE public.jarvis_agents ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low';
      ALTER TABLE public.jarvis_skills ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
      ALTER TABLE public.jarvis_skills ADD COLUMN IF NOT EXISTS provider TEXT;
      ALTER TABLE public.jarvis_router_rules ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
    `;
    
    console.log("Aplicando DDLs de correção de schema explícitos pós-migration...");
    await client.query(alterSQL);
    
    console.log("Schema Corrigido com sucesso.");
  } catch (err) {
    console.error("Erro na Migration:", err);
  } finally {
    await client.end();
  }
}

run();
