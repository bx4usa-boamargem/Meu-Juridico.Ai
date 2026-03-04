-- ============================================================
-- SPRINT 1 — MIGRATION: TABELAS DO AGENTE DE MONITORAMENTO
-- MeuJurídico.ai — Março 2026
-- ============================================================

-- ============================================================
-- Tabela 1: Configuração do monitoramento (1 registro por org)
-- ============================================================
CREATE TABLE IF NOT EXISTS monitoring_config (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id        UUID REFERENCES orgs(id),
  frequency     TEXT NOT NULL DEFAULT 'weekly'
    CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  scope         JSONB NOT NULL DEFAULT '{"federal": true, "states": ["SP", "RJ", "MG"]}'::jsonb,
  cost_limit_usd NUMERIC(6,2) NOT NULL DEFAULT 5.00,
  last_run_at   TIMESTAMPTZ,
  next_run_at   TIMESTAMPTZ,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Tabela 2: Alertas gerados pelo monitoramento
-- ============================================================
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id            UUID REFERENCES orgs(id),
  source            TEXT NOT NULL,
    -- 'TCU' | 'CGU' | 'PNCP' | 'TJSP' | 'TJRJ' | 'TJMG' | 'DOESP' | 'DOERJ' | 'DOEMG'
  source_url        TEXT,
  title             TEXT NOT NULL,
  summary           TEXT NOT NULL,
  impact_analysis   TEXT,
  affected_doc_types TEXT[],
  severity          TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_relevant       BOOLEAN,
  published_at      TIMESTAMPTZ,
  detected_at       TIMESTAMPTZ DEFAULT now(),
  notified_at       TIMESTAMPTZ,
  raw_content       TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Tabela 3: Log de execuções (controle de custo)
-- ============================================================
CREATE TABLE IF NOT EXISTS monitoring_runs (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id                UUID REFERENCES orgs(id),
  started_at            TIMESTAMPTZ DEFAULT now(),
  finished_at           TIMESTAMPTZ,
  sources_checked       TEXT[],
  items_fetched         INT DEFAULT 0,
  items_filtered_out    INT DEFAULT 0,
  items_analyzed_light  INT DEFAULT 0,
  items_analyzed_deep   INT DEFAULT 0,
  alerts_generated      INT DEFAULT 0,
  estimated_cost_usd    NUMERIC(8,4) DEFAULT 0,
  status                TEXT DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'cost_limit_exceeded'))
);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_config_org" ON monitoring_config
  FOR ALL TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "monitoring_alerts_org" ON monitoring_alerts
  FOR ALL TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "monitoring_runs_org" ON monitoring_runs
  FOR ALL TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- Índices para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_source ON monitoring_alerts(source, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity, is_relevant);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_status ON monitoring_runs(status, started_at DESC);

-- ============================================================
-- Seed: inserir config padrão (org_id NULL = global)
-- ============================================================
INSERT INTO monitoring_config (frequency, is_active, scope, cost_limit_usd)
SELECT 'weekly', true, '{"federal": true, "states": ["SP", "RJ", "MG"]}'::jsonb, 5.00
WHERE NOT EXISTS (SELECT 1 FROM monitoring_config);
