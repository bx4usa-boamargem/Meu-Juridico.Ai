-- ============================================================
-- SPRINT 4 - PNCP INFRASTRUCTURE
-- ============================================================

-- 1. Table for Market Price Intelligence
CREATE TABLE IF NOT EXISTS public.pncp_price_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto TEXT NOT NULL,
    descricao_detalhada TEXT,
    valor_unitario NUMERIC(12,2) NOT NULL,
    unidade_medida VARCHAR(100) NOT NULL,
    orgao_nome TEXT NOT NULL,
    estado VARCHAR(2) NOT NULL,
    municipio TEXT,
    data_homologacao DATE NOT NULL,
    cnpj_vencedor VARCHAR(20),
    fonte TEXT DEFAULT 'PNCP',
    link_edital TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast regional price querying
CREATE INDEX idx_pncp_price_busca ON public.pncp_price_benchmarks USING gin(to_tsvector('portuguese', objeto));
CREATE INDEX idx_pncp_price_estado ON public.pncp_price_benchmarks(estado);

-- 2. Table for the "Golden Templates" (AI-Extracted Markdown of TRs/ETPs)
CREATE TABLE IF NOT EXISTS public.pncp_golden_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    doc_type VARCHAR(50) NOT NULL, -- 'TR', 'ETP', 'EDITAL'
    class_tag TEXT, -- e.g., 'TI', 'Servicos_Limpeza'
    markdown_content TEXT NOT NULL,
    orgao_origem TEXT,
    estado VARCHAR(2),
    embedding vector(1536), -- Assuming future pgvector use
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pncp_price_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pncp_golden_templates ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users on market data
CREATE POLICY "Market data is readable by everyone." 
ON public.pncp_price_benchmarks FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Golden templates readable by everyone." 
ON public.pncp_golden_templates FOR SELECT 
TO authenticated 
USING (true);

-- Enable Supabase Cron (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the pg_cron schedule to invoke edge function every day at 04:00 AM
-- NOTE: Direct net.http_post might require pg_net extension, but standard Supabase practice 
-- is to setup a generic PG_CRON that hits the local edge function
SELECT cron.schedule(
    'invoke_pncp_fetcher',
    '0 4 * * *',
    $$
    select net.http_post(
        url:='https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/pncp-fetcher',
        headers:='{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    )
    $$
);
