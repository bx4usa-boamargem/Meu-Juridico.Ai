
CREATE OR REPLACE FUNCTION public.resolver_heranca(
  p_processo_id uuid,
  p_tipo_documento text,
  p_parent_doc_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processo record;
  v_cadeia_rec record;
  v_heranca jsonb := '{}'::jsonb;
  v_cadeia_completa jsonb := '[]'::jsonb;
  v_campo_mapping jsonb := '{}'::jsonb;
  v_doc record;
  v_current_doc_id uuid;
  v_ancestors uuid[] := '{}';
  v_ancestor_docs jsonb := '[]'::jsonb;
  v_mapping_key text;
  v_doc_tipo text;
BEGIN
  -- 1. Buscar processo
  SELECT id, objeto, modalidade, orgao, numero_processo, context_data, status
  INTO v_processo
  FROM processos
  WHERE id = p_processo_id;

  IF v_processo.id IS NULL THEN
    RAISE EXCEPTION 'Processo não encontrado: %', p_processo_id;
  END IF;

  -- 2. Identificar cadeia documental ativa
  SELECT id, nome, modalidade, cadeia, mapeamento_campos
  INTO v_cadeia_rec
  FROM cadeias_documentais
  WHERE modalidade = v_processo.modalidade
    AND ativo = true
  LIMIT 1;

  IF v_cadeia_rec.id IS NULL THEN
    RAISE EXCEPTION 'Cadeia documental não encontrada para modalidade: %', v_processo.modalidade;
  END IF;

  v_cadeia_completa := v_cadeia_rec.cadeia;
  v_campo_mapping := COALESCE(v_cadeia_rec.mapeamento_campos, '{}'::jsonb);

  -- 3. Percorrer ancestrais recursivamente via parent_doc_id
  v_current_doc_id := p_parent_doc_id;

  WHILE v_current_doc_id IS NOT NULL LOOP
    SELECT id, tipo, posicao_cadeia, dados_estruturados, dados_herdados, parent_doc_id, status
    INTO v_doc
    FROM documentos
    WHERE id = v_current_doc_id AND processo_id = p_processo_id;

    EXIT WHEN v_doc.id IS NULL;

    -- Prepend to ancestors array (oldest first)
    v_ancestors := v_doc.id || v_ancestors;

    -- Build ancestor doc entry
    v_ancestor_docs := jsonb_build_object(
      'id', v_doc.id,
      'tipo', v_doc.tipo,
      'posicao_cadeia', v_doc.posicao_cadeia,
      'status', v_doc.status,
      'dados_estruturados', COALESCE(v_doc.dados_estruturados, '{}'::jsonb)
    ) || v_ancestor_docs;

    -- Merge herança: dados_herdados primeiro, depois dados_estruturados por cima
    v_heranca := v_heranca || COALESCE(v_doc.dados_herdados, '{}'::jsonb);
    v_heranca := v_heranca || COALESCE(v_doc.dados_estruturados, '{}'::jsonb);

    v_current_doc_id := v_doc.parent_doc_id;
  END LOOP;

  -- 4. Aplicar mapeamento de campos do documento pai direto -> documento alvo
  IF p_parent_doc_id IS NOT NULL THEN
    SELECT tipo INTO v_doc_tipo FROM documentos WHERE id = p_parent_doc_id;
    IF v_doc_tipo IS NOT NULL THEN
      v_mapping_key := v_doc_tipo || '->' || p_tipo_documento;
      IF v_campo_mapping ? v_mapping_key THEN
        -- Remap fields according to mapping
        DECLARE
          v_mapped_heranca jsonb := '{}'::jsonb;
          v_campo_origem text;
          v_campo_destino text;
          v_parent_dados jsonb;
        BEGIN
          SELECT COALESCE(dados_estruturados, '{}'::jsonb) INTO v_parent_dados
          FROM documentos WHERE id = p_parent_doc_id;

          FOR v_campo_origem, v_campo_destino IN
            SELECT key, value#>>'{}'
            FROM jsonb_each(v_campo_mapping->v_mapping_key)
          LOOP
            IF v_parent_dados ? v_campo_origem THEN
              v_mapped_heranca := v_mapped_heranca || jsonb_build_object(v_campo_destino, v_parent_dados->v_campo_origem);
            ELSIF v_heranca ? v_campo_origem THEN
              v_mapped_heranca := v_mapped_heranca || jsonb_build_object(v_campo_destino, v_heranca->v_campo_origem);
            END IF;
          END LOOP;

          -- Merge mapped fields into herança
          v_heranca := v_heranca || v_mapped_heranca;
        END;
      END IF;
    END IF;
  END IF;

  -- 5. Retornar estrutura completa
  RETURN jsonb_build_object(
    'processo', jsonb_build_object(
      'id', v_processo.id,
      'objeto', v_processo.objeto,
      'modalidade', v_processo.modalidade,
      'orgao', v_processo.orgao,
      'numero_processo', v_processo.numero_processo,
      'context_data', COALESCE(v_processo.context_data, '{}'::jsonb),
      'status', v_processo.status
    ),
    'heranca', v_heranca,
    'ancestrais', v_ancestor_docs,
    'cadeia_completa', v_cadeia_completa,
    'tipo_documento_alvo', p_tipo_documento,
    'campo_mapping', v_campo_mapping
  );
END;
$$;
