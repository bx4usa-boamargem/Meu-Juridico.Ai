
CREATE OR REPLACE FUNCTION public.create_processo_com_documento_raiz(
  p_numero_processo text,
  p_orgao text,
  p_objeto text,
  p_modalidade text,
  p_cadeia_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processo_id uuid;
  v_cadeia jsonb;
  v_primeiro_doc text;
BEGIN
  -- 1. Insert processo
  INSERT INTO processos (numero_processo, orgao, objeto, modalidade, created_by)
  VALUES (p_numero_processo, p_orgao, p_objeto, p_modalidade, auth.uid())
  RETURNING id INTO v_processo_id;

  -- 2. Read cadeia from selected cadeia_documental
  SELECT cadeia INTO v_cadeia
  FROM cadeias_documentais
  WHERE id = p_cadeia_id AND ativo = true;

  IF v_cadeia IS NULL OR jsonb_array_length(v_cadeia) = 0 THEN
    RAISE EXCEPTION 'Cadeia documental não encontrada ou vazia';
  END IF;

  -- 3. Identify first document type
  v_primeiro_doc := v_cadeia->>0;

  -- 4. Create root document
  INSERT INTO documentos (processo_id, cadeia_id, tipo, posicao_cadeia, status)
  VALUES (v_processo_id, p_cadeia_id, v_primeiro_doc, 0, 'rascunho');

  -- 5. Return processo id
  RETURN v_processo_id;
END;
$$;
