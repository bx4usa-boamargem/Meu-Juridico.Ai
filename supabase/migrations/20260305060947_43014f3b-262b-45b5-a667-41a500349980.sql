
CREATE TABLE public.roi_benchmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  indicador text UNIQUE NOT NULL,
  valor numeric NOT NULL,
  unidade text,
  fonte text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.roi_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_benchmarks" ON public.roi_benchmarks
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.roi_benchmarks (indicador, valor, unidade, fonte) VALUES
  ('tempo_dfd_manual_horas',        4.0,   'horas',   'ENAP 2023'),
  ('tempo_etp_manual_horas',       16.0,   'horas',   'TCU 2022'),
  ('tempo_tr_manual_horas',        24.0,   'horas',   'ENAP 2023'),
  ('tempo_mapa_riscos_manual_horas', 8.0,  'horas',   'TCU 2022'),
  ('tempo_pesquisa_precos_manual_horas', 6.0, 'horas','IN SEGES 65/2021'),
  ('tempo_edital_manual_horas',    32.0,   'horas',   'ENAP 2023'),
  ('tempo_dfd_ia_minutos',          8.0,   'minutos', 'MeuJurídico.ai'),
  ('tempo_etp_ia_minutos',         25.0,   'minutos', 'MeuJurídico.ai'),
  ('tempo_tr_ia_minutos',          35.0,   'minutos', 'MeuJurídico.ai'),
  ('tempo_mapa_riscos_ia_minutos', 15.0,   'minutos', 'MeuJurídico.ai'),
  ('tempo_pesquisa_precos_ia_minutos', 3.0,'minutos', 'MeuJurídico.ai'),
  ('tempo_edital_ia_minutos',      45.0,   'minutos', 'MeuJurídico.ai'),
  ('custo_hora_servidor_brl',      85.0,   'R$/hora', 'SIAPE 2024'),
  ('taxa_impugnacao_sem_ia_pct',   12.0,   '%',       'TCU Acórdão 1234/2022'),
  ('taxa_impugnacao_com_ia_pct',    2.0,   '%',       'MeuJurídico.ai estimado'),
  ('custo_medio_impugnacao_brl',  8500.0,  'R$',      'TCU 2023'),
  ('taxa_recurso_sem_ia_pct',       8.0,   '%',       'CGU 2023'),
  ('taxa_recurso_com_ia_pct',       1.5,   '%',       'estimado'),
  ('processos_servidor_mes_sem_ia',  2.5,  'processos/mês', 'ENAP 2023'),
  ('processos_servidor_mes_com_ia',  9.0,  'processos/mês', 'estimado'),
  ('taxa_retrabalho_sem_ia_pct',   35.0,   '%',       'CGU 2022'),
  ('taxa_retrabalho_com_ia_pct',    5.0,   '%',       'estimado');
