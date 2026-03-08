-- Habilita extensão de UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projetos
CREATE TABLE IF NOT EXISTS jarvis_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_state_sync TIMESTAMPTZ
);

-- Tasks (Ações do MCP para o Antigravity)
CREATE TABLE IF NOT EXISTS jarvis_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES jarvis_projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- security_scan, lint_check, run_tests, ui_audit
    status TEXT NOT NULL CHECK (status IN ('pending', 'approval_required', 'running', 'completed', 'failed')) DEFAULT 'pending',
    params JSONB DEFAULT '{}',
    created_by TEXT DEFAULT 'chatgpt',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Logs (Progressão e Resultados)
CREATE TABLE IF NOT EXISTS jarvis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES jarvis_tasks(id) ON DELETE CASCADE,
    level TEXT DEFAULT 'info', -- info, warn, error, debug
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
