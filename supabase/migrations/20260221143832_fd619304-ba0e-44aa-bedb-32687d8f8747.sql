
-- 1a. View vw_processo_com_dfd com LATERAL JOIN (apenas DFD ativo)
CREATE OR REPLACE VIEW public.vw_processo_com_dfd AS
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

-- 1b. RPC obter_pipeline_processo
CREATE OR REPLACE FUNCTION public.obter_pipeline_processo(p_processo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cadeia_id uuid;
  v_cadeia jsonb;
  v_resultado jsonb := '[]'::jsonb;
  v_tipo text;
  v_posicao int := 0;
  v_doc record;
  v_prev_status text := 'aprovado'; -- posicao 0 sempre desbloqueada
BEGIN
  -- Buscar cadeia_id do primeiro documento do processo
  SELECT cadeia_id INTO v_cadeia_id
  FROM documentos
  WHERE processo_id = p_processo_id
  ORDER BY posicao_cadeia ASC
  LIMIT 1;

  IF v_cadeia_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Buscar array da cadeia
  SELECT cadeia INTO v_cadeia
  FROM cadeias_documentais
  WHERE id = v_cadeia_id AND ativo = true;

  IF v_cadeia IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Para cada tipo na cadeia
  FOR v_tipo IN SELECT jsonb_array_elements_text(v_cadeia)
  LOOP
    -- Buscar documento mais recente deste tipo
    SELECT d.id, d.status
    INTO v_doc
    FROM documentos d
    WHERE d.processo_id = p_processo_id
      AND d.tipo = v_tipo
    ORDER BY d.versao DESC NULLS LAST
    LIMIT 1;

    v_resultado := v_resultado || jsonb_build_object(
      'tipo', v_tipo,
      'posicao', v_posicao,
      'doc_id', v_doc.id,
      'status', v_doc.status,
      'desbloqueado', CASE
        WHEN v_posicao = 0 THEN true
        WHEN v_prev_status = 'aprovado' THEN true
        ELSE false
      END
    );

    v_prev_status := COALESCE(v_doc.status, 'pendente');
    v_posicao := v_posicao + 1;
  END LOOP;

  RETURN v_resultado;
END;
$function$;
