-- ============================================================
-- SPRINT 4 — Arquitetura Multi-Modelo com Fallback e Logging
-- MeuJurídico.ai · Março 2026
-- ============================================================

-- ────────────────────────────────────────────
-- TABELA 1: ai_model_config
-- Mapeamento de modelo por tipo de documento
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_model_config (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_documento    text NOT NULL,
  tipo_operacao     text NOT NULL DEFAULT 'geracao',
  modelo_principal  text NOT NULL,
  modelo_fallback   text NOT NULL,
  ativo             boolean DEFAULT true,
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(tipo_documento, tipo_operacao)
);

INSERT INTO ai_model_config (tipo_documento, tipo_operacao, modelo_principal, modelo_fallback) VALUES
  ('etp',             'geracao',           'claude-sonnet-4-5-20251001', 'gpt-4.1'),
  ('tr',              'geracao',           'gpt-4.1',                    'claude-sonnet-4-5-20251001'),
  ('dfd',             'geracao',           'claude-haiku-4-5-20251001',  'gpt-4.1'),
  ('mapa_risco',      'geracao',           'claude-sonnet-4-5-20251001', 'gpt-4.1'),
  ('parecer_juridico','geracao',           'claude-sonnet-4-5-20251001', 'gpt-4.1'),
  ('edital',          'geracao',           'gpt-4.1',                    'claude-sonnet-4-5-20251001'),
  ('contrato',        'geracao',           'gpt-4.1',                    'claude-sonnet-4-5-20251001'),
  ('any',             'melhoria',          'gemini-2.5-flash',           'claude-haiku-4-5-20251001'),
  ('any',             'autopreenchimento', 'claude-haiku-4-5-20251001',  'gemini-2.5-flash')
ON CONFLICT (tipo_documento, tipo_operacao) DO NOTHING;

-- ────────────────────────────────────────────
-- TABELA 2: ai_usage_log
-- Rastreamento de cada chamada de IA
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now(),

  -- Identificação do uso
  tipo_documento      text NOT NULL,
  tipo_operacao       text NOT NULL,
  documento_id        uuid,
  processo_id         uuid,

  -- IA usada
  modelo_solicitado   text NOT NULL,
  modelo_utilizado    text NOT NULL,
  foi_fallback        boolean DEFAULT false,
  motivo_fallback     text,

  -- Tokens e custo
  tokens_input        integer,
  tokens_output       integer,
  custo_usd           numeric(10,6),

  -- Contexto
  org_id              text,
  user_id             uuid,
  user_email          text,
  duracao_ms          integer,
  sucesso             boolean DEFAULT true,
  erro                text
);

-- Índices para o painel de relatórios
CREATE INDEX IF NOT EXISTS idx_ai_log_created   ON ai_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_log_modelo    ON ai_usage_log(modelo_utilizado);
CREATE INDEX IF NOT EXISTS idx_ai_log_fallback  ON ai_usage_log(foi_fallback) WHERE foi_fallback = true;
CREATE INDEX IF NOT EXISTS idx_ai_log_processo  ON ai_usage_log(processo_id);
CREATE INDEX IF NOT EXISTS idx_ai_log_org       ON ai_usage_log(org_id);

-- RLS
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full" ON ai_usage_log;
CREATE POLICY "admin_full" ON ai_usage_log
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR user_id = auth.uid()
  );

-- INSERT aberto para as Edge Functions (service role)
DROP POLICY IF EXISTS "service_insert" ON ai_usage_log;
CREATE POLICY "service_insert" ON ai_usage_log
  FOR INSERT TO service_role
  WITH CHECK (true);

ALTER TABLE ai_model_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_manage" ON ai_model_config;
CREATE POLICY "admins_manage" ON ai_model_config
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "authenticated_read" ON ai_model_config;
CREATE POLICY "authenticated_read" ON ai_model_config
  FOR SELECT TO authenticated
  USING (true);

-- ────────────────────────────────────────────
-- TABLE 3: notifications (se não existir)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  title       text NOT NULL,
  body        text,
  type        text DEFAULT 'info',   -- 'info', 'warning', 'error', 'success'
  action_url  text,
  read_at     timestamptz
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_notifications" ON notifications;
CREATE POLICY "user_own_notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- VIEW: vw_ai_usage_report (painel de relatórios)
-- ────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_ai_usage_report AS
SELECT
  DATE_TRUNC('day', created_at)          AS data,
  modelo_utilizado,
  tipo_documento,
  tipo_operacao,
  COUNT(*)                               AS total_geracoes,
  SUM(CASE WHEN foi_fallback THEN 1 ELSE 0 END) AS total_fallbacks,
  SUM(tokens_input + tokens_output)      AS total_tokens,
  ROUND(SUM(custo_usd)::numeric, 4)      AS custo_usd_total,
  ROUND((SUM(custo_usd) * 5.8)::numeric, 2) AS custo_brl_total,
  AVG(duracao_ms)::integer               AS tempo_medio_ms,
  COUNT(DISTINCT user_email)             AS usuarios_unicos
FROM ai_usage_log
WHERE sucesso = true
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC, 5 DESC;
