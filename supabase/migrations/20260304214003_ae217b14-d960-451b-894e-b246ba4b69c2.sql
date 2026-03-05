
CREATE TABLE IF NOT EXISTS public.risk_maps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id uuid REFERENCES public.processos(id) ON DELETE CASCADE NOT NULL,
  documento_id uuid REFERENCES public.documentos(id) ON DELETE SET NULL,
  riscos jsonb NOT NULL DEFAULT '[]'::jsonb,
  resumo_executivo text,
  aprovado_em timestamptz,
  aprovado_por text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.risk_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_risk_maps" ON public.risk_maps
  FOR ALL TO authenticated
  USING (processo_id IN (
    SELECT id FROM public.processos WHERE created_by = auth.uid()
  ))
  WITH CHECK (processo_id IN (
    SELECT id FROM public.processos WHERE created_by = auth.uid()
  ));
