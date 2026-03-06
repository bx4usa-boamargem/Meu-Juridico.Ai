-- ============================================================
-- SPRINT 4d — EXPANDED LEGAL SHIELD & FULL CYCLE MONITORING
-- TCU, AGU, DOU e Diários Estaduais (SP, MG, RJ, PR)
-- ============================================================

-- 1. Jurisprudência Espelho (Decisões de Controle)
CREATE TABLE IF NOT EXISTS public.jurisprudencia_espelho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orgao_emissor VARCHAR(50) NOT NULL, -- 'TCU', 'AGU', 'TCE-SP', 'TCE-MG', etc
    tipo_decisao VARCHAR(50), -- 'Acórdão', 'Súmula', 'Parecer', 'Instrução Normativa'
    numero_processo TEXT,
    assunto TEXT NOT NULL,
    data_decisao DATE NOT NULL,
    texto_resumo TEXT,
    texto_completo TEXT,
    link_original TEXT,
    impacto_risco VARCHAR(20) DEFAULT 'Médio', -- 'Baixo', 'Médio', 'Alto', 'Crítico'
    tags TEXT[], -- ['exigência técnica', 'software', 'preço']
    embedding vector(1536), -- Para busca semântica via IA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Full Cycle Package Tracking (PCA -> Contrato)
CREATE TABLE IF NOT EXISTS public.pncp_full_cycle_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj_orgao VARCHAR(20) NOT NULL,
    orgao_nome TEXT NOT NULL,
    pca_id TEXT, -- ID no Plano de Contratações Anual
    edital_id TEXT, -- ID do Edital no PNCP
    objeto TEXT NOT NULL,
    status_atual VARCHAR(50), -- 'Planejamento', 'Publicado', 'Homologado', 'Contratado'
    valor_estimado NUMERIC(15,2),
    valor_final NUMERIC(15,2),
    uf VARCHAR(2) NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim_vigencia TIMESTAMP WITH TIME ZONE,
    documentos_ids JSONB, -- IDs dos documentos extraídos (ETP, TR, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexação para busca ultra-rápida
CREATE INDEX IF NOT EXISTS idx_jurisprudencia_busca ON public.jurisprudencia_espelho USING gin(to_tsvector('portuguese', assunto || ' ' || texto_resumo));
CREATE INDEX IF NOT EXISTS idx_full_cycle_orgao ON public.pncp_full_cycle_monitoring(cnpj_orgao);

-- 3. Agendamento de Sincronização (Diferenciado)

-- A. Sincronização de API (Toda Segunda às 04:00 AM) - PNCP e DOU
SELECT cron.schedule(
    'weekly_api_sync',
    '0 4 * * 1',
    $$
    select net.http_post(
        url:='https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/daily-api-sync',
        headers:='{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    )
    $$
);

-- B. Extração IA Pesada (Toda Segunda às 05:00 AM) - Editais e Acórdãos Estaduais
SELECT cron.schedule(
    'weekly_ai_extraction',
    '0 5 * * 1',
    $$
    select net.http_post(
        url:='https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/weekly-ai-extraction',
        headers:='{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    )
    $$
);

-- Permissões RLS
ALTER TABLE public.jurisprudencia_espelho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pncp_full_cycle_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jurisprudencia acessível a usuários autenticados" 
ON public.jurisprudencia_espelho FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Monitoramento acessível a usuários autenticados" 
ON public.pncp_full_cycle_monitoring FOR SELECT 
TO authenticated 
USING (true);
