-- 1. org_settings table
CREATE TABLE IF NOT EXISTS public.org_settings (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_org" ON public.org_settings FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "users_insert_own_org" ON public.org_settings FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "users_update_own_org" ON public.org_settings FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- 2. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 3. knowledge_base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.org_settings(org_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    file_size_bytes BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_org_kb2" ON public.knowledge_base FOR SELECT TO authenticated USING (org_id IN (SELECT os.org_id FROM public.org_settings os WHERE os.created_by = auth.uid()));
CREATE POLICY "users_insert_own_org_kb2" ON public.knowledge_base FOR INSERT TO authenticated WITH CHECK (org_id IN (SELECT os.org_id FROM public.org_settings os WHERE os.created_by = auth.uid()));
CREATE POLICY "users_delete_own_org_kb2" ON public.knowledge_base FOR DELETE TO authenticated USING (org_id IN (SELECT os.org_id FROM public.org_settings os WHERE os.created_by = auth.uid()));

-- 4. knowledge_chunks table
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.org_settings(org_id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    embedding extensions.vector(1536) NOT NULL,
    chunk_index INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON public.knowledge_chunks USING hnsw (embedding vector_cosine_ops);

CREATE POLICY "users_read_own_org_chunks" ON public.knowledge_chunks FOR SELECT TO authenticated USING (org_id IN (SELECT os.org_id FROM public.org_settings os WHERE os.created_by = auth.uid()));

-- 5. Match function
CREATE OR REPLACE FUNCTION match_knowledge_chunks(p_org_id UUID, p_embedding extensions.vector(1536), p_match_threshold FLOAT, p_match_count INTEGER, p_doc_types TEXT[] DEFAULT NULL) RETURNS TABLE (chunk_id UUID, document_id UUID, doc_title TEXT, content_text TEXT, similarity FLOAT) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$ BEGIN RETURN QUERY SELECT kc.id AS chunk_id, kc.document_id, kb.title AS doc_title, kc.content_text, (1 - (kc.embedding <=> p_embedding))::FLOAT AS similarity FROM public.knowledge_chunks kc JOIN public.knowledge_base kb ON kb.id = kc.document_id WHERE kc.org_id = p_org_id AND kb.is_active = true AND (p_doc_types IS NULL OR kb.doc_type = ANY(p_doc_types)) AND (1 - (kc.embedding <=> p_embedding)) > p_match_threshold ORDER BY kc.embedding <=> p_embedding LIMIT p_match_count; END; $$;

-- 6. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge_files', 'knowledge_files', false) ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies
CREATE POLICY "auth_users_upload_knowledge" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'knowledge_files');
CREATE POLICY "auth_users_read_knowledge" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'knowledge_files');
CREATE POLICY "auth_users_delete_knowledge" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'knowledge_files');