
-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info',
  severity text DEFAULT 'low',
  source text,
  source_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_insert_notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read, created_at DESC);

-- 2. Create function get_alertas_documento
CREATE OR REPLACE FUNCTION public.get_alertas_documento(p_doc_type text)
RETURNS SETOF monitoring_alerts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT *
  FROM public.monitoring_alerts
  WHERE is_relevant = true
    AND (p_doc_type = ANY(affected_doc_types) OR affected_doc_types IS NULL OR array_length(affected_doc_types, 1) IS NULL)
  ORDER BY detected_at DESC
  LIMIT 20;
$$;

-- 3. Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
