-- =========================================================================
-- MEUJURÍDICO.AI - BASE DE CONHECIMENTO & RAG (Sprint 3) — CORRIGIDO v3
-- =========================================================================

-- 1. Ativação da extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Tabela de Arquivos da Base de Conhecimento
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('normative', 'template_dfd', 'template_etp', 'template_tr', 'template_edital', 'other')),
    file_path TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    file_size_bytes BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_base' AND policyname = 'kb_select_own_org'
  ) THEN
    CREATE POLICY "kb_select_own_org"
        ON public.knowledge_base FOR SELECT
        USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

-- 3. Tabela de Chunks (Trechos de Texto + Vetores)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    embedding extensions.vector(1536),
    chunk_index INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_chunks' AND policyname = 'chunks_select_own_org'
  ) THEN
    CREATE POLICY "chunks_select_own_org"
        ON public.knowledge_chunks FOR SELECT
        USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));
  END IF;
END$$;

-- 4. Função RPC para busca semântica (RAG)
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
    p_org_id UUID,
    p_embedding extensions.vector(1536),
    p_match_threshold FLOAT,
    p_match_count INTEGER,
    p_doc_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    doc_title TEXT,
    content_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id AS chunk_id,
        kc.document_id,
        kb.title AS doc_title,
        kc.content_text,
        (1 - (kc.embedding <=> p_embedding))::FLOAT AS similarity
    FROM
        public.knowledge_chunks kc
    JOIN
        public.knowledge_base kb ON kb.id = kc.document_id
    WHERE
        kc.org_id = p_org_id
        AND kb.is_active = true
        AND (p_doc_types IS NULL OR kb.doc_type = ANY(p_doc_types))
        AND (1 - (kc.embedding <=> p_embedding)) > p_match_threshold
    ORDER BY
        kc.embedding <=> p_embedding
    LIMIT p_match_count;
END;
$$;

-- 5. Bucket Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge_files', 'knowledge_files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS do Storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'kb_files_read_own_org'
  ) THEN
    CREATE POLICY "kb_files_read_own_org" ON storage.objects FOR SELECT
    USING (bucket_id = 'knowledge_files' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'kb_files_upload_own_org'
  ) THEN
    CREATE POLICY "kb_files_upload_own_org" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'knowledge_files' AND auth.role() = 'authenticated');
  END IF;
END$$;
