-- Schema para Ativação Total do Inventário Jarvis OS

-- 1. Categorias
CREATE TABLE IF NOT EXISTS jarvis_agent_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    level INTEGER DEFAULT 2 -- 1: Orchestrator, 2: Specialist, 3: Executor
);

CREATE TABLE IF NOT EXISTS jarvis_skill_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

-- 2. Agentes
CREATE TABLE IF NOT EXISTS jarvis_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id UUID REFERENCES jarvis_agent_categories(id),
    role TEXT,
    description TEXT,
    inputs_schema JSONB DEFAULT '{}',
    outputs_schema JSONB DEFAULT '{}',
    execution_mode TEXT DEFAULT 'local', -- local, remote, function, worker
    risk_level TEXT DEFAULT 'low',
    requires_approval BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Skills
CREATE TABLE IF NOT EXISTS jarvis_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id UUID REFERENCES jarvis_skill_categories(id),
    description TEXT,
    input_schema JSONB DEFAULT '{}',
    output_schema JSONB DEFAULT '{}',
    provider TEXT DEFAULT 'internal',
    execution_target TEXT,
    risk_level TEXT DEFAULT 'low',
    requires_approval BOOLEAN DEFAULT false,
    cost_hint TEXT DEFAULT 'low',
    status TEXT DEFAULT 'active',
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Relacionamento Agent-Skill
CREATE TABLE IF NOT EXISTS jarvis_agent_skill_links (
    agent_id UUID REFERENCES jarvis_agents(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES jarvis_skills(id) ON DELETE CASCADE,
    PRIMARY KEY (agent_id, skill_id)
);

-- 5. Histórico e Auditoria
CREATE TABLE IF NOT EXISTS jarvis_execution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID, -- Referência futura à tabela jarvis_tasks
    agent_id UUID REFERENCES jarvis_agents(id),
    skill_id UUID REFERENCES jarvis_skills(id),
    project_id UUID,
    triggered_by TEXT DEFAULT 'chatgpt',
    input JSONB,
    output JSONB,
    status TEXT,
    error_log TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Seeds Iniciais de Categorias Nível 1
INSERT INTO jarvis_agent_categories (name, level) VALUES 
('Orchestrator', 1),
('SEO', 2),
('SERP', 2),
('Competitive Intelligence', 2),
('Juridico', 2),
('Comercial', 2),
('Engenharia', 2),
('Dados', 2),
('Conteúdo', 2),
('Relatórios', 2),
('Monitoring', 2),
('Agent Builder', 1)
ON CONFLICT (name) DO NOTHING;

INSERT INTO jarvis_skill_categories (name) VALUES 
('Technical Audit'),
('Market Intel'),
('System Sync'),
('Output Ops'),
('File Actions'),
('AI Generation'),
('Construction')
ON CONFLICT (name) DO NOTHING;

-- Desabilitar RLS para permitir ativação rápida
ALTER TABLE jarvis_agent_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_skill_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_agent_skill_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_execution_history DISABLE ROW LEVEL SECURITY;

