const { Client } = require('pg');

const connectionString = "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres";

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();

        console.log("Iniciando Seed V2 via PG...");

        await client.query(`
      INSERT INTO public.jarvis_projects (id, name, status) VALUES 
      ('meujuridico', 'Meu Jurídico AI', 'ativo'),
      ('omniseen', 'Omniseen Engine', 'ativo')
      ON CONFLICT (id) DO NOTHING;
    `);

        await client.query(`
      INSERT INTO public.jarvis_agents (id, name, category, lifecycle, requires_approval, risk_level) VALUES 
      ('tax-compliance-master', 'Tax Compliance Master', 'finance', 'active', false, 'medium'),
      ('finance-expert', 'Finance Expert', 'finance', 'active', true, 'medium'),
      ('growth-strategist', 'Growth Strategist', 'marketing', 'active', true, 'low'),
      ('market-intelligence', 'Market Intelligence', 'marketing', 'active', true, 'low'),
      ('medical-researcher', 'Medical Researcher', 'health', 'draft', true, 'high')
      ON CONFLICT (id) DO UPDATE SET lifecycle = EXCLUDED.lifecycle;
    `);

        await client.query(`
      INSERT INTO public.jarvis_skills (id, name, category, lifecycle, requires_approval, provider) VALUES 
      ('tax-compliance-br', 'Tax Compliance BR', 'finance', 'active', false, 'jarvis'),
      ('market-sizing-analysis', 'Market Sizing', 'marketing', 'active', true, 'jarvis'),
      ('startup-financial-modeling', 'Financial Modeling', 'finance', 'active', true, 'jarvis')
      ON CONFLICT (id) DO UPDATE SET lifecycle = EXCLUDED.lifecycle;
    `);

        await client.query(`
      INSERT INTO public.jarvis_router_rules (agent_id, intent_pattern, priority, is_active) VALUES 
      ('tax-compliance-master', 'finance', 10, true),
      ('finance-expert', 'finance', 10, true),
      ('growth-strategist', 'marketing', 10, true),
      ('market-intelligence', 'marketing', 10, true)
    `);

        console.log("Seed V2 executado com SUCESSO via Postgres bypass.");
    } catch (e) { console.error("!!! ERRO NO SEED:", e); }
    await client.end();
}
run();
