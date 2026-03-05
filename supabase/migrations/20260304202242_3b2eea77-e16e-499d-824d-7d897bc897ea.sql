
CREATE TABLE public.price_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES public.processos(id) ON DELETE CASCADE,
  objeto text NOT NULL,
  estado text,
  municipio text,
  periodo text DEFAULT '6m',
  unidade_medida text,
  resultados jsonb DEFAULT '[]'::jsonb,
  estatisticas jsonb DEFAULT '{}'::jsonb,
  analise_ia text,
  outliers_removidos integer DEFAULT 0,
  preco_referencia numeric,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_price_refs" ON public.price_references
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
