
-- Fix: Change public read policies from RESTRICTIVE to PERMISSIVE
-- so unauthenticated users can access shared documents

-- 1. Fix document_share_links public read policy
DROP POLICY IF EXISTS "public_read_share_links" ON public.document_share_links;
CREATE POLICY "public_read_share_links"
  ON public.document_share_links
  FOR SELECT
  TO anon, authenticated
  USING (
    ativo = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- 2. Fix document_versions public read via share policy
DROP POLICY IF EXISTS "public_read_via_share" ON public.document_versions;
CREATE POLICY "public_read_via_share"
  ON public.document_versions
  FOR SELECT
  TO anon, authenticated
  USING (
    id IN (
      SELECT version_id FROM public.document_share_links
      WHERE ativo = true AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- 3. Fix documentos - allow reading doc metadata via share links
CREATE POLICY "public_read_doc_via_share"
  ON public.documentos
  FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT documento_id FROM public.document_share_links
      WHERE ativo = true AND (expires_at IS NULL OR expires_at > now())
    )
  );
