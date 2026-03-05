-- ============================================================
-- MEUJURÍDICO.AI — DATA MODEL COMPLETO v1.0
-- Stack: Supabase (PostgreSQL) + RLS
-- Tenant model: ÓRGÃO (org) como raiz de isolamento
-- Baseado em: LLM Spec v2.0 + telas Figma + Lei 14.133/2021
-- ============================================================

-- ============================================================
-- DECISÃO DE TENANT MODEL
-- Recomendação: Por ÓRGÃO com departamentos internos (híbrido)
-- Motivo: Lei 14.133 exige segregação por unidade administrativa.
-- Um servidor de Saúde não pode ver o processo de Educação.
-- Modelo: org → departamento → usuario → processo → documento
-- ============================================================

-- ============================================================
-- LAYER 0: ENUMS
-- ============================================================

CREATE TYPE document_type AS ENUM (
  'dfd', 'etp', 'tr', 'edital', 'contrato',
  'parecer_juridico', 'portaria_designacao'
);

CREATE TYPE document_status AS ENUM (
  'rascunho',
  'em_elaboracao',
  'em_revisao',
  'em_ajuste',
  'aprovado',
  'finalizado',
  'arquivado'
);

CREATE TYPE user_role AS ENUM (
  'admin_org',           -- Admin do Órgão (gerencia usuários e config)
  'demandante',          -- Cria DFD, inicia processo
  'planejamento',        -- Elabora ETP e TR
  'juridico',            -- Valida legalidade
  'controle_interno',    -- Auditoria interna
  'gestor_contrato',     -- Gerencia execução
  'autoridade_competente', -- Aprova documentos (assina)
  'visualizador'         -- Somente leitura
);

CREATE TYPE ai_action_type AS ENUM (
  'improve',    -- ai_improve_section
  'validate',   -- ai_validate_section
  'suggest'     -- ai_suggest_section
);

CREATE TYPE ai_job_status AS ENUM (
  'pending', 'running', 'completed', 'failed', 'cancelled'
);

CREATE TYPE transition_action AS ENUM (
  'submit_for_review',
  'request_adjustment',
  'approve',
  'finalize',
  'archive',
  'reopen'
);

-- ============================================================
-- LAYER 1: MULTI-TENANT (ÓRGÃO)
-- ============================================================

-- Órgão público (prefeitura, secretaria estadual, autarquia)
-- É a raiz de isolamento. Tudo pertence a um org.
CREATE TABLE orgs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                    -- "Prefeitura de Guarapuava"
  slug            TEXT UNIQUE NOT NULL,             -- "pref-guarapuava"
  cnpj            TEXT UNIQUE,                      -- CNPJ do órgão
  esfera          TEXT,                             -- 'municipal' | 'estadual' | 'federal'
  uf              CHAR(2),                          -- 'PR', 'SP', etc.
  municipio       TEXT,
  logo_url        TEXT,
  active          BOOLEAN DEFAULT true,
  plan            TEXT DEFAULT 'essencial',         -- 'essencial' | 'institucional' | 'enterprise'
  plan_expires_at TIMESTAMPTZ,
  settings        JSONB DEFAULT '{}',               -- configurações do órgão
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Departamentos internos do órgão (Secretaria de Saúde, Educação, etc.)
-- Permite RLS por área sem criar novo tenant
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,           -- "Secretaria de Saúde"
  code        TEXT,                    -- Código interno
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LAYER 2: IAM / RBAC
-- ============================================================

-- Usuários estendidos (complementa auth.users do Supabase)
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES orgs(id),
  department_id   UUID REFERENCES departments(id),
  full_name       TEXT NOT NULL,
  avatar_url      TEXT,
  cpf             TEXT,                -- Armazenado mascarado: ***.***.**-XX
  cargo           TEXT,                -- "Pregoeiro", "Secretário de TI"
  matricula       TEXT,                -- Matrícula funcional
  role            user_role NOT NULL DEFAULT 'visualizador',
  active          BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Permissões adicionais por processo específico (override de role)
-- Permite que um "visualizador" seja responsável por 1 processo específico
CREATE TABLE process_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id    UUID NOT NULL,         -- FK adicionada após criar processos
  user_id       UUID NOT NULL REFERENCES users(id),
  role          user_role NOT NULL,
  granted_by    UUID REFERENCES users(id),
  granted_at    TIMESTAMPTZ DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  UNIQUE(process_id, user_id)
);

-- ============================================================
-- LAYER 3: PROCESSOS (unidade de trabalho)
-- ============================================================

-- Processo = conjunto de documentos para uma contratação
-- Corresponde a 1 processo administrativo real
CREATE TABLE processes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES orgs(id),
  department_id       UUID REFERENCES departments(id),

  -- Identificação
  numero_processo     TEXT,            -- Número administrativo do órgão
  objeto              TEXT NOT NULL,   -- Objeto da contratação (vem do DFD)
  objeto_detalhado    TEXT,
  tipo_objeto         TEXT,            -- 'servico' | 'material_didatico' | 'software' | 'obra'

  -- Dados base (process_context da spec)
  dados_base          JSONB DEFAULT '{}',  -- Dados estruturados reutilizados por todos os docs
  valor_estimado      NUMERIC(15,2),
  dotacao_orcamentaria TEXT,
  modalidade_prevista TEXT,            -- 'pregao' | 'concorrencia' | 'dispensa' etc.

  -- Controle
  status              document_status DEFAULT 'rascunho',
  prioridade          TEXT DEFAULT 'normal', -- 'baixa' | 'normal' | 'alta' | 'urgente'
  prazo_conclusao     DATE,

  -- Responsáveis
  created_by          UUID NOT NULL REFERENCES users(id),
  responsavel_id      UUID REFERENCES users(id),  -- Responsável principal

  -- Auditoria
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  finalized_at        TIMESTAMPTZ
);

-- Adicionar FK em process_permissions
ALTER TABLE process_permissions
  ADD CONSTRAINT fk_process FOREIGN KEY (process_id)
  REFERENCES processes(id) ON DELETE CASCADE;

-- ============================================================
-- LAYER 4: DOCUMENTOS (DFD, ETP, TR, Edital, Contrato...)
-- ============================================================

-- Um processo tem N documentos na chain DFD→ETP→TR→Edital→Contrato
CREATE TABLE documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id        UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES orgs(id),

  -- Tipo e chain
  doc_type          document_type NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  parent_doc_id     UUID REFERENCES documents(id), -- Herança de dados

  -- Status e workflow
  status            document_status DEFAULT 'rascunho',
  current_step      INTEGER DEFAULT 1,  -- Step do wizard (1..N)
  total_steps       INTEGER,

  -- Metadados
  title             TEXT,              -- Título gerado: "ETP - Aquisição de Software TIC"
  object_summary    TEXT,              -- Resumo do objeto para listagem

  -- Dados herdados (inherited_data da spec)
  inherited_data    JSONB DEFAULT '{}', -- Dados copiados do doc predecessor

  -- Controle de edição
  locked            BOOLEAN DEFAULT false,  -- Bloqueado durante geração de IA
  locked_by         UUID REFERENCES users(id),
  locked_at         TIMESTAMPTZ,

  -- Responsáveis
  created_by        UUID NOT NULL REFERENCES users(id),
  last_edited_by    UUID REFERENCES users(id),

  -- Export
  pdf_url           TEXT,
  docx_url          TEXT,
  document_hash     TEXT,              -- SHA-256 do conteúdo final (spec Layer 8 C8)
  exported_at       TIMESTAMPTZ,

  -- Auditoria
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  finalized_at      TIMESTAMPTZ,

  -- Constraint: apenas 1 documento ativo por tipo por processo
  CONSTRAINT unique_active_doc UNIQUE NULLS NOT DISTINCT (process_id, doc_type, version)
);

-- ============================================================
-- LAYER 5: SEÇÕES DO DOCUMENTO (Document Engine)
-- Documento = conjunto de seções (spec Layer 4)
-- Cada seção = dados estruturados + texto renderizado + checklist
-- ============================================================

CREATE TABLE document_sections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  org_id              UUID NOT NULL REFERENCES orgs(id),

  -- Identificação (ex: "etp_03", "dfd_01")
  section_id          TEXT NOT NULL,   -- ID interno da spec
  section_number      TEXT NOT NULL,   -- "1", "1.1", "2.3"
  title               TEXT NOT NULL,

  -- Agent responsável (spec Layer 3)
  agent               TEXT NOT NULL,   -- 'AGENT_LICIT' | 'AGENT_ADMIN' | 'AGENT_CONST' | 'AGENT_SERVPUB'

  -- Conteúdo
  structured_data     JSONB DEFAULT '{}',  -- Dados estruturados do formulário (lado esquerdo do wizard)
  rendered_content    TEXT,                -- Texto renderizado em Markdown (preview direito)
  rendered_html       TEXT,                -- HTML para preview em tempo real

  -- Estado da seção
  status              TEXT DEFAULT 'empty', -- 'empty' | 'draft' | 'ai_generated' | 'user_edited' | 'validated' | 'approved'
  is_required         BOOLEAN DEFAULT true,
  is_complete         BOOLEAN DEFAULT false,
  has_warnings        BOOLEAN DEFAULT false,  -- ⚠ visível nas tabs do Figma

  -- Checklist interno da seção
  checklist           JSONB DEFAULT '[]',     -- [{item, checked, required}]
  checklist_score     NUMERIC(3,2),           -- 0.0 a 1.0

  -- Validação IA (resultado do VALIDATE_SECTION)
  validation_status   TEXT,           -- 'approved' | 'approved_with_warnings' | 'rejected'
  validation_report   JSONB,          -- Relatório completo da spec
  last_validated_at   TIMESTAMPTZ,

  -- Metadados da spec
  normative_refs      JSONB DEFAULT '[]',    -- [{law, article, text}]
  key_facts           JSONB DEFAULT '[]',    -- Para section_memory
  values_declared     JSONB DEFAULT '{}',    -- Valores numéricos declarados
  commitments         JSONB DEFAULT '[]',    -- Obrigações declaradas
  defined_terms       JSONB DEFAULT '{}',    -- Glossário da seção

  -- Controle
  order_index         INTEGER NOT NULL,
  depends_on          TEXT[],                -- IDs de seções que devem existir antes
  created_by          UUID REFERENCES users(id),
  last_edited_by      UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_section_per_doc UNIQUE (document_id, section_id)
);

-- Tab de requisito (as tabs horizontais das telas: Necessidades do negócio, Tecnológicos, etc.)
-- Cada tab agrupa campos dentro de uma seção
CREATE TABLE section_requirement_tabs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID NOT NULL REFERENCES document_sections(id) ON DELETE CASCADE,
  tab_key       TEXT NOT NULL,         -- 'necessidades_negocio' | 'tecnologicos' | 'legais_gerais' | 'seguranca' etc.
  tab_label     TEXT NOT NULL,
  order_index   INTEGER NOT NULL,
  is_complete   BOOLEAN DEFAULT false,
  has_warnings  BOOLEAN DEFAULT false,
  field_data    JSONB DEFAULT '{}',    -- Dados dos campos desta tab
  UNIQUE(section_id, tab_key)
);

-- ============================================================
-- LAYER 6: WORKFLOW DE APROVAÇÃO
-- Machine de estados: rascunho→em_elaboracao→em_revisao→em_ajuste→aprovado→finalizado
-- ============================================================

CREATE TABLE workflow_transitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES orgs(id),

  -- Transição
  from_status     document_status NOT NULL,
  to_status       document_status NOT NULL,
  action          transition_action NOT NULL,

  -- Comentário obrigatório em certas transições
  comment         TEXT,
  is_rejection    BOOLEAN DEFAULT false,

  -- Quem fez
  performed_by    UUID NOT NULL REFERENCES users(id),
  performed_at    TIMESTAMPTZ DEFAULT now(),

  -- Notificação
  notified_users  UUID[] DEFAULT '{}'
);

-- Etapas de aprovação configuráveis por org/tipo de documento
CREATE TABLE approval_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES orgs(id),
  doc_type        document_type NOT NULL,
  step_order      INTEGER NOT NULL,
  step_name       TEXT NOT NULL,          -- "Revisão Jurídica"
  required_role   user_role NOT NULL,     -- Papel que pode aprovar este step
  is_required     BOOLEAN DEFAULT true,
  deadline_days   INTEGER,                -- Prazo em dias úteis
  UNIQUE(org_id, doc_type, step_order)
);

-- Instâncias de aprovação por documento
CREATE TABLE approval_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  step_id         UUID NOT NULL REFERENCES approval_steps(id),
  assigned_to     UUID REFERENCES users(id),
  status          TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'skipped'
  comment         TEXT,
  decided_at      TIMESTAMPTZ,
  deadline        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LAYER 7: JOBS ASSÍNCRONOS DE IA
-- Edge Functions: ai_improve, ai_validate, ai_suggest, research, render, export
-- ============================================================

CREATE TABLE ai_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES orgs(id),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  section_id        UUID REFERENCES document_sections(id) ON DELETE CASCADE,

  -- Tipo de job
  job_type          TEXT NOT NULL,    -- 'improve' | 'validate' | 'suggest' | 'research' | 'render_preview' | 'export_pdf' | 'export_docx' | 'plan' | 'generate_section' | 'consolidate' | 'finalize'
  execution_stage   TEXT,             -- Stage da spec: 'PLAN' | 'GENERATE_SECTION' | 'VALIDATE_SECTION' | 'CONSOLIDATE' | 'FINALIZE'
  agent             TEXT,             -- Agente responsável

  -- Status
  status            ai_job_status DEFAULT 'pending',
  priority          INTEGER DEFAULT 5, -- 1=urgente, 10=baixa

  -- Input/Output
  input_payload     JSONB DEFAULT '{}',
  output_payload    JSONB DEFAULT '{}',
  error_message     TEXT,

  -- Rastreabilidade (spec Layer 8 C8)
  llm_model         TEXT,             -- 'claude-sonnet-4-20250514'
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  cost_usd          NUMERIC(10,6),
  latency_ms        INTEGER,

  -- Controle
  requested_by      UUID REFERENCES users(id),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  retry_count       INTEGER DEFAULT 0,
  max_retries       INTEGER DEFAULT 2  -- spec: max_retries_per_section = 2
);

-- ============================================================
-- LAYER 8: PESQUISA DE PREÇOS (research_collect_sources)
-- Sem evidência registrada não entra como "pesquisa de preço"
-- ============================================================

CREATE TABLE price_researches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES orgs(id),
  section_id      UUID REFERENCES document_sections(id),

  -- Fonte
  source_type     TEXT NOT NULL,    -- 'pncp' | 'comprasgov' | 'manual' | 'cotacao' | 'ata_rp'
  source_url      TEXT,
  source_date     DATE,
  source_ref      TEXT,             -- Número do processo PNCP ou referência

  -- Dados coletados
  item_description TEXT NOT NULL,
  unit            TEXT,
  quantity        NUMERIC(12,3),
  unit_price      NUMERIC(15,2) NOT NULL,
  total_price     NUMERIC(15,2),
  supplier_name   TEXT,
  supplier_cnpj   TEXT,

  -- Validação
  is_valid        BOOLEAN DEFAULT true,
  excluded_reason TEXT,             -- Motivo de exclusão se inválido

  -- Auditoria
  collected_by    UUID REFERENCES users(id),
  job_id          UUID REFERENCES ai_jobs(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LAYER 9: AUDIT LOG
-- Tudo deve gerar audit_log (quem/quando/o quê/por quê)
-- ============================================================

CREATE TABLE audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  org_id          UUID NOT NULL REFERENCES orgs(id),
  process_id      UUID REFERENCES processes(id),
  document_id     UUID REFERENCES documents(id),
  section_id      UUID REFERENCES document_sections(id),
  job_id          UUID REFERENCES ai_jobs(id),

  -- Quem
  user_id         UUID REFERENCES users(id),
  user_role       user_role,

  -- O quê
  action          TEXT NOT NULL,     -- 'section.edited' | 'doc.approved' | 'ai.improve' | 'doc.exported' | 'user.login' | etc.
  entity_type     TEXT,              -- 'document' | 'section' | 'process' | 'user'
  entity_id       UUID,

  -- Detalhes
  old_value       JSONB,             -- Estado anterior (para rollback/auditoria)
  new_value       JSONB,             -- Estado novo
  diff            JSONB,             -- Diff calculado

  -- Por quê (obrigatório em aprovações/rejeições)
  reason          TEXT,

  -- Contexto
  ip_address      INET,
  user_agent      TEXT,
  session_id      TEXT,

  -- Timestamp imutável
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance em auditoria
CREATE INDEX idx_audit_org ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_document ON audit_logs(document_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- ============================================================
-- LAYER 10: TEMPLATES DE DOCUMENTOS
-- Templates por tipo de documento, personalizáveis por órgão
-- ============================================================

CREATE TABLE document_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES orgs(id),  -- NULL = template global
  doc_type        document_type NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  is_default      BOOLEAN DEFAULT false,
  version         TEXT DEFAULT '1.0',

  -- Estrutura do template (plano de seções)
  sections_plan   JSONB NOT NULL,            -- Array de seções com agent, fields, etc.
  normative_base  JSONB DEFAULT '[]',        -- Normas base do template

  active          BOOLEAN DEFAULT true,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LAYER 11: NOTIFICAÇÕES
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES orgs(id),
  user_id         UUID NOT NULL REFERENCES users(id),

  type            TEXT NOT NULL,     -- 'approval_needed' | 'doc_approved' | 'doc_rejected' | 'deadline_warning' | 'ai_complete'
  title           TEXT NOT NULL,
  body            TEXT,
  action_url      TEXT,

  -- Referências
  document_id     UUID REFERENCES documents(id),
  process_id      UUID REFERENCES processes(id),

  read            BOOLEAN DEFAULT false,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LAYER 12: CONSUMO E BILLING
-- Tela "Consumo" visível no nav das screenshots
-- ============================================================

CREATE TABLE usage_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES orgs(id),
  user_id         UUID REFERENCES users(id),
  period_month    DATE NOT NULL,             -- Primeiro dia do mês: 2025-01-01

  -- Contadores
  documents_created   INTEGER DEFAULT 0,
  ai_jobs_run         INTEGER DEFAULT 0,
  ai_tokens_used      BIGINT DEFAULT 0,
  ai_cost_usd         NUMERIC(10,4) DEFAULT 0,
  exports_pdf         INTEGER DEFAULT 0,
  exports_docx        INTEGER DEFAULT 0,

  -- Limites do plano
  plan_limit_docs     INTEGER,              -- NULL = ilimitado
  plan_limit_users    INTEGER,

  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, period_month)
);

-- ============================================================
-- LAYER 13: RAG / BASE NORMATIVA
-- Documentos normativos recuperados para contexto de IA
-- ============================================================

CREATE TABLE rag_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES orgs(id),  -- NULL = global

  source_type     TEXT NOT NULL,   -- 'lei' | 'decreto' | 'instrucao_normativa' | 'acordao_tcu' | 'norma_interna'
  source_ref      TEXT NOT NULL,   -- "Lei nº 14.133/2021"
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,   -- Texto completo para embedding
  url             TEXT,
  published_date  DATE,
  is_revoked      BOOLEAN DEFAULT false,
  revoked_by      TEXT,

  -- Para busca vetorial (Supabase pgvector)
  embedding       vector(1536),

  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Isolamento por org_id em todas as tabelas
-- ============================================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_requirement_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_researches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Política base: usuário só vê dados do próprio org
CREATE POLICY "users_own_org" ON users
  FOR ALL USING (org_id = (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "processes_own_org" ON processes
  FOR ALL USING (org_id = (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "documents_own_org" ON documents
  FOR ALL USING (org_id = (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "audit_logs_own_org" ON audit_logs
  FOR ALL USING (org_id = (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

-- Visualizador: somente SELECT
CREATE POLICY "visualizador_readonly" ON documents
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) = 'visualizador'
  );

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================

CREATE INDEX idx_processes_org ON processes(org_id, status);
CREATE INDEX idx_documents_process ON documents(process_id, doc_type);
CREATE INDEX idx_documents_org_type ON documents(org_id, doc_type, status);
CREATE INDEX idx_sections_document ON document_sections(document_id, order_index);
CREATE INDEX idx_sections_status ON document_sections(document_id, status);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status, created_at);
CREATE INDEX idx_ai_jobs_document ON ai_jobs(document_id, job_type);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_usage_org_month ON usage_records(org_id, period_month);

-- ============================================================
-- FUNÇÃO: Registrar audit_log automaticamente
-- ============================================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO: Transição de estado com validação de role
-- ============================================================

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
    RAISE EXCEPTION 'Transição inválida: % -> % para role %',
      v_current_status, p_action, v_user_role;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEEDS: Templates base DFD e ETP
-- ============================================================

INSERT INTO document_templates (doc_type, name, is_default, sections_plan, normative_base)
VALUES (
  'dfd',
  'DFD Padrão — Lei 14.133/2021',
  true,
  '[
    {"section_id":"dfd_01","section_number":"1","title":"Identificação da Unidade Demandante","agent":"AGENT_ADMIN","required":true,"fields":["unidade_nome","responsavel_nome","responsavel_cargo"]},
    {"section_id":"dfd_02","section_number":"2","title":"Descrição da Necessidade","agent":"AGENT_ADMIN","required":true,"fields":["justificativa","problema_descricao","alinhamento_estrategico"]},
    {"section_id":"dfd_03","section_number":"3","title":"Alinhamento com o PCA","agent":"AGENT_ADMIN","required":true,"fields":["esta_no_pca","codigo_pca","observacao_pca"]},
    {"section_id":"dfd_04","section_number":"4","title":"Consequências da Não Contratação","agent":"AGENT_ADMIN","required":true,"fields":["riscos_operacionais","impacto_social","impacto_financeiro"]},
    {"section_id":"dfd_05","section_number":"5","title":"Estimativa de Recursos Orçamentários","agent":"AGENT_ADMIN","required":true,"fields":["unidade_gestora","dotacao","valor_estimado"]},
    {"section_id":"dfd_06","section_number":"6","title":"Encaminhamento para ETP","agent":"AGENT_ADMIN","required":true,"fields":["autorizacao_etp","observacoes"]}
  ]',
  '["Lei nº 14.133/2021 art. 18, I","Decreto nº 10.947/2022"]'
),
(
  'etp',
  'ETP Padrão — Serviços e Software (Lei 14.133/2021)',
  true,
  '[
    {"section_id":"etp_01","section_number":"1","title":"Descrição da Necessidade","agent":"AGENT_ADMIN","required":true},
    {"section_id":"etp_02","section_number":"2","title":"Área Requisitante","agent":"AGENT_ADMIN","required":true},
    {"section_id":"etp_03","section_number":"3","title":"Descrição dos Requisitos da Contratação","agent":"AGENT_LICIT","required":true,"tabs":["necessidades_negocio","tecnologicos","legais_gerais","seguranca","sociais_ambientais","projeto_implementacao","garantia_tecnica","experiencia"]},
    {"section_id":"etp_04","section_number":"4","title":"Levantamento de Mercado","agent":"AGENT_ADMIN","required":true},
    {"section_id":"etp_05","section_number":"5","title":"Estimativa de Quantidade e Valor","agent":"AGENT_ADMIN","required":true},
    {"section_id":"etp_06","section_number":"6","title":"Justificativa para Parcelamento ou Não","agent":"AGENT_LICIT","required":true},
    {"section_id":"etp_07","section_number":"7","title":"Análise de Riscos","agent":"AGENT_LICIT","required":true},
    {"section_id":"etp_08","section_number":"8","title":"Posicionamento sobre Viabilidade","agent":"AGENT_ADMIN","required":true}
  ]',
  '["Lei nº 14.133/2021 art. 18, §1º"]'
);
