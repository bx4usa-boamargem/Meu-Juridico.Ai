
-- =============================================
-- MeuJurídico.ai — Foundation Sprint
-- Process-first architecture
-- =============================================

-- STEP 2: processos
CREATE TABLE public.processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo TEXT,
  orgao TEXT,
  objeto TEXT,
  modalidade TEXT,
  context_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'rascunho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_processos" ON public.processos
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- STEP 3: cadeias_documentais
CREATE TABLE public.cadeias_documentais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  modalidade TEXT,
  cadeia JSONB DEFAULT '[]',
  mapeamento_campos JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cadeias_documentais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_cadeias" ON public.cadeias_documentais
  FOR SELECT TO authenticated
  USING (true);

-- STEP 4: documentos (final structure, inheritance-ready)
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  tipo VARCHAR,
  versao INTEGER DEFAULT 1,
  parent_doc_id UUID REFERENCES public.documentos(id),
  cadeia_id UUID REFERENCES public.cadeias_documentais(id),
  posicao_cadeia INTEGER,
  dados_estruturados JSONB DEFAULT '{}',
  dados_herdados JSONB DEFAULT '{}',
  conteudo_gerado JSONB,
  conteudo_final TEXT,
  status TEXT DEFAULT 'rascunho',
  gerado_por UUID REFERENCES auth.users(id),
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_documentos" ON public.documentos
  FOR ALL TO authenticated
  USING (processo_id IN (SELECT id FROM public.processos WHERE created_by = auth.uid()))
  WITH CHECK (processo_id IN (SELECT id FROM public.processos WHERE created_by = auth.uid()));

-- STEP 5: heranca_campos
CREATE TABLE public.heranca_campos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_destino_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  doc_origem_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  campo_origem TEXT NOT NULL,
  campo_destino TEXT NOT NULL,
  valor_herdado JSONB,
  valor_atual JSONB,
  modificado BOOLEAN DEFAULT FALSE,
  justificativa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.heranca_campos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_heranca" ON public.heranca_campos
  FOR ALL TO authenticated
  USING (
    doc_destino_id IN (
      SELECT d.id FROM public.documentos d
      JOIN public.processos p ON d.processo_id = p.id
      WHERE p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    doc_destino_id IN (
      SELECT d.id FROM public.documentos d
      JOIN public.processos p ON d.processo_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

-- STEP 6: alertas_cascata
CREATE TABLE public.alertas_cascata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  doc_origem_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  doc_afetado_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  campo TEXT NOT NULL,
  valor_antigo JSONB,
  valor_novo JSONB,
  status TEXT DEFAULT 'pendente',
  resolvido_por UUID REFERENCES auth.users(id),
  resolvido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alertas_cascata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_alertas" ON public.alertas_cascata
  FOR ALL TO authenticated
  USING (processo_id IN (SELECT id FROM public.processos WHERE created_by = auth.uid()))
  WITH CHECK (processo_id IN (SELECT id FROM public.processos WHERE created_by = auth.uid()));

-- STEP 7: Indexes
CREATE INDEX idx_documentos_processo_id ON public.documentos(processo_id);
CREATE INDEX idx_documentos_parent_doc_id ON public.documentos(parent_doc_id);
CREATE INDEX idx_documentos_tipo ON public.documentos(tipo);
CREATE INDEX idx_heranca_campos_doc_destino ON public.heranca_campos(doc_destino_id);
CREATE INDEX idx_heranca_campos_doc_origem ON public.heranca_campos(doc_origem_id);
CREATE INDEX idx_alertas_cascata_processo ON public.alertas_cascata(processo_id);
CREATE INDEX idx_alertas_cascata_status ON public.alertas_cascata(status);
CREATE INDEX idx_alertas_cascata_doc_afetado ON public.alertas_cascata(doc_afetado_id);
