
-- Fix: Convert view to SECURITY INVOKER (default, safe - uses querying user's RLS)
DROP VIEW IF EXISTS public.vw_processo_com_dfd;

CREATE VIEW public.vw_processo_com_dfd
WITH (security_invoker = true)
AS
SELECT
  p.id AS processo_id,
  p.numero_processo, p.orgao, p.objeto, p.modalidade,
  p.status, p.created_at, p.created_by, p.context_data,
  dfd.id AS dfd_id,
  dfd.status AS dfd_status,
  dfd.dados_estruturados AS dfd_dados,
  dfd.cadeia_id,
  dfd.versao AS dfd_versao
FROM processos p
LEFT JOIN LATERAL (
  SELECT d.id, d.status, d.dados_estruturados, d.cadeia_id, d.versao
  FROM documentos d
  WHERE d.processo_id = p.id
    AND d.tipo IN ('DFD', 'dfd')
  ORDER BY d.versao DESC NULLS LAST
  LIMIT 1
) dfd ON true;
