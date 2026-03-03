-- ==========================================
-- 1. Habilitar RLS em TODAS as tabelas sem RLS
-- ==========================================
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Criar políticas RLS corretas para tabelas
-- ==========================================

-- A. USERS: SELECT apenas do próprio registro
DROP POLICY IF EXISTS "users_own_org" ON users;
DROP POLICY IF EXISTS "users_select_self" ON users;

CREATE POLICY "users_select_self" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.uid());

-- B. AUDIT_LOGS: INSERT para authenticated, SELECT por org_id
DROP POLICY IF EXISTS "audit_logs_own_org" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_org" ON audit_logs;

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "audit_logs_select_org" ON audit_logs
  FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- C. PROCESSES: SELECT/INSERT/UPDATE por org_id
DROP POLICY IF EXISTS "processes_own_org" ON processes;
DROP POLICY IF EXISTS "processes_select_org" ON processes;
DROP POLICY IF EXISTS "processes_insert_org" ON processes;
DROP POLICY IF EXISTS "processes_update_org" ON processes;

CREATE POLICY "processes_select_org" ON processes 
  FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "processes_insert_org" ON processes 
  FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "processes_update_org" ON processes 
  FOR UPDATE USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- D. DOCUMENTS: SELECT/INSERT/UPDATE por org_id (e limpeza das duplicadas)
DROP POLICY IF EXISTS "documents_own_org" ON documents;
DROP POLICY IF EXISTS "visualizador_readonly" ON documents;
DROP POLICY IF EXISTS "documents_select_org" ON documents;
DROP POLICY IF EXISTS "documents_insert_org" ON documents;
DROP POLICY IF EXISTS "documents_update_org" ON documents;

CREATE POLICY "documents_select_org" ON documents 
  FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "documents_insert_org" ON documents 
  FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "documents_update_org" ON documents 
  FOR UPDATE USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));


-- ==========================================
-- 3. Corrigir funções com search_path mutável
-- ==========================================
CREATE OR REPLACE FUNCTION log_audit_event(
  p_org_id      UUID,
  p_user_id     UUID,
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_old_value   JSONB DEFAULT NULL,
  p_new_value   JSONB DEFAULT NULL,
  p_reason      TEXT DEFAULT NULL,
  p_document_id UUID DEFAULT NULL,
  p_section_id  UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = p_user_id;

  INSERT INTO audit_logs (
    org_id, user_id, user_role, action,
    entity_type, entity_id,
    old_value, new_value,
    reason, document_id, section_id
  ) VALUES (
    p_org_id, p_user_id, v_role, p_action,
    p_entity_type, p_entity_id,
    p_old_value, p_new_value,
    p_reason, p_document_id, p_section_id
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION transition_document_status(
  p_document_id UUID,
  p_action      transition_action,
  p_user_id     UUID,
  p_comment     TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_status  document_status;
  v_new_status      document_status;
  v_user_role       user_role;
  v_org_id          UUID;
BEGIN
  SELECT d.status, d.org_id, u.role
  INTO v_current_status, v_org_id, v_user_role
  FROM documents d
  JOIN users u ON u.id = p_user_id
  WHERE d.id = p_document_id;

  -- State machine
  v_new_status := CASE
    WHEN p_action = 'submit_for_review'  AND v_current_status IN ('rascunho','em_elaboracao','em_ajuste') THEN 'em_revisao'
    WHEN p_action = 'request_adjustment' AND v_current_status = 'em_revisao'    THEN 'em_ajuste'
    WHEN p_action = 'approve'            AND v_current_status = 'em_revisao'
         AND v_user_role IN ('autoridade_competente','admin_org')                THEN 'aprovado'
    WHEN p_action = 'finalize'           AND v_current_status = 'aprovado'
         AND v_user_role IN ('autoridade_competente','admin_org')                THEN 'finalizado'
    WHEN p_action = 'archive'                                                    THEN 'arquivado'
    WHEN p_action = 'reopen'             AND v_current_status = 'arquivado'      THEN 'rascunho'
    ELSE NULL
  END;

  IF v_new_status IS NULL THEN
    RAISE EXCEPTION 'Transição inválida: % -> % para role %', v_current_status, p_action, v_user_role;
  END IF;

  UPDATE documents SET status = v_new_status, updated_at = now()
  WHERE id = p_document_id;

  INSERT INTO workflow_transitions (
    document_id, org_id, from_status, to_status,
    action, comment, performed_by, is_rejection
  ) VALUES (
    p_document_id, v_org_id, v_current_status, v_new_status,
    p_action, p_comment, p_user_id,
    p_action = 'request_adjustment'
  );

  PERFORM log_audit_event(
    v_org_id, p_user_id,
    'document.status_changed', 'document', p_document_id,
    jsonb_build_object('status', v_current_status),
    jsonb_build_object('status', v_new_status),
    p_comment, p_document_id
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

