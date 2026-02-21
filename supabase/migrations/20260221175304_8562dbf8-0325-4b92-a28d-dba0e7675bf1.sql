
-- Tabela de Knowledge Base institucional com RLS por orgao
CREATE TABLE public.org_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orgao text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('modelo_aprovado', 'norma_interna', 'decreto', 'parecer', 'dfd_anterior', 'legislacao', 'manual')),
  titulo text NOT NULL,
  conteudo text NOT NULL,
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- FTS index com tsvector para busca textual eficiente
ALTER TABLE public.org_knowledge_base ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(titulo, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(conteudo, '')), 'B')
  ) STORED;

CREATE INDEX idx_org_kb_search ON public.org_knowledge_base USING GIN (search_vector);
CREATE INDEX idx_org_kb_orgao ON public.org_knowledge_base (orgao);
CREATE INDEX idx_org_kb_tipo ON public.org_knowledge_base (tipo);

-- RLS: usuário só pode ler/escrever KB do seu próprio órgão
ALTER TABLE public.org_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter o órgão do usuário
CREATE OR REPLACE FUNCTION public.get_user_orgao(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT orgao FROM processos WHERE created_by = p_user_id LIMIT 1;
$$;

-- Leitura: somente KB do mesmo órgão
CREATE POLICY "users_read_own_org_kb" ON public.org_knowledge_base
  FOR SELECT USING (
    orgao = public.get_user_orgao(auth.uid())
  );

-- Inserção: somente no próprio órgão
CREATE POLICY "users_insert_own_org_kb" ON public.org_knowledge_base
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND orgao = public.get_user_orgao(auth.uid())
  );

-- Update/Delete: somente próprios registros
CREATE POLICY "users_manage_own_kb" ON public.org_knowledge_base
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "users_delete_own_kb" ON public.org_knowledge_base
  FOR DELETE USING (created_by = auth.uid());

-- Tabela de auditoria de IA
CREATE TABLE public.ai_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  documento_id uuid REFERENCES public.documentos(id),
  action text NOT NULL,
  model text NOT NULL,
  prompt_version text NOT NULL DEFAULT 'v1',
  input_text text,
  output_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_audit" ON public.ai_audit_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "service_insert_audit" ON public.ai_audit_log
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_ai_audit_user ON public.ai_audit_log (user_id);
CREATE INDEX idx_ai_audit_doc ON public.ai_audit_log (documento_id);
