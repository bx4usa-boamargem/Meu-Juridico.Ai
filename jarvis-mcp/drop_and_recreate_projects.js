const { Client } = require('pg');

const connectionString = "postgresql://postgres:Bionesupa2026%40@db.qasmnhljokhjsiyjwuiq.supabase.co:6543/postgres";

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();

        console.log("Forçando drop das tabelas projetadas...");
        await client.query(`
      DROP TABLE IF EXISTS public.jarvis_tasks CASCADE;
      DROP TABLE IF EXISTS public.jarvis_logs CASCADE;
      DROP TABLE IF EXISTS public.jarvis_projects CASCADE;
    `);

        console.log("Recriando tabelas de gerenciamento com IDs corretos (TEXT para projetos)...");

        await client.query(`
      CREATE TABLE public.jarvis_projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          status TEXT DEFAULT 'ativo',
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

        await client.query(`
      CREATE TABLE public.jarvis_tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id TEXT REFERENCES public.jarvis_projects(id) ON DELETE CASCADE,
          action TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          params JSONB DEFAULT '{}'::jsonb,
          result JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

        await client.query(`
      CREATE TABLE public.jarvis_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id TEXT,
          agent_id TEXT,
          event_type TEXT NOT NULL,
          message TEXT NOT NULL,
          payload JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

        // Configura os policies RLS
        await client.query(`
      ALTER TABLE public.jarvis_projects ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.jarvis_tasks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.jarvis_logs ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow read for projects" ON public.jarvis_projects FOR SELECT USING (true);
      CREATE POLICY "Allow service role all on tasks" ON public.jarvis_tasks FOR ALL USING (true);
    `);

        console.log("Tabelas recriadas e prontas pro Seed.");
    } catch (e) { console.error("!!! ERRO:", e); }
    await client.end();
}
run();
