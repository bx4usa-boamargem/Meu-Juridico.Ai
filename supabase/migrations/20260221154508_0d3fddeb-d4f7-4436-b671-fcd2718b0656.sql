
-- Habilitar pgcrypto para gen_random_bytes (token de compartilhamento)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. document_versions table
CREATE TABLE public.document_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id uuid NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  conteudo_html text NOT NULL,
  versao integer NOT NULL DEFAULT 1,
  gerado_por uuid,
  pdf_url text,
  pdf_gerado_em timestamptz,
  gerado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_versions" ON public.document_versions
  FOR ALL USING (
    processo_id IN (SELECT id FROM processos WHERE created_by = auth.uid())
  )
  WITH CHECK (
    processo_id IN (SELECT id FROM processos WHERE created_by = auth.uid())
  );

-- 2. document_share_links table
CREATE TABLE public.document_share_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id uuid NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES public.document_versions(id) ON DELETE CASCADE,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex') UNIQUE,
  created_by uuid,
  ativo boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_share_links" ON public.document_share_links
  FOR ALL USING (
    documento_id IN (
      SELECT d.id FROM documentos d
      JOIN processos p ON d.processo_id = p.id
      WHERE p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    documento_id IN (
      SELECT d.id FROM documentos d
      JOIN processos p ON d.processo_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

-- Public read policy for shared links (anyone with token)
CREATE POLICY "public_read_share_links" ON public.document_share_links
  FOR SELECT USING (ativo = true AND (expires_at IS NULL OR expires_at > now()));

-- Public read for document_versions via share link
CREATE POLICY "public_read_via_share" ON public.document_versions
  FOR SELECT USING (
    id IN (
      SELECT version_id FROM document_share_links
      WHERE ativo = true AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- 3. Add workflow_status to documentos
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'rascunho';

-- 4. Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-pdfs', 'document-pdfs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users_upload_pdfs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'document-pdfs' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "public_read_pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'document-pdfs');
