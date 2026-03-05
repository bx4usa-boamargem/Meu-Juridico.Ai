
-- 1. Create ai_usage_log table for tracking AI usage
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  org_id uuid REFERENCES public.org_settings(org_id) ON DELETE CASCADE,
  documento_id uuid REFERENCES public.documentos(id) ON DELETE SET NULL,
  tipo_documento text,
  modelo_utilizado text NOT NULL,
  action text NOT NULL DEFAULT 'generate',
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  custo_usd numeric DEFAULT 0,
  duracao_ms integer DEFAULT 0,
  foi_fallback boolean DEFAULT false,
  fallback_de text,
  estado text,
  orgao text,
  erro text
);

-- RLS
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Admin can read all, service can insert
CREATE POLICY "service_insert_usage" ON public.ai_usage_log FOR INSERT WITH CHECK (true);
CREATE POLICY "authenticated_read_usage" ON public.ai_usage_log FOR SELECT TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_usage_log;

-- 2. Create api_health_log table
CREATE TABLE IF NOT EXISTS public.api_health_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'ok',
  latency_ms integer DEFAULT 0,
  error text
);

ALTER TABLE public.api_health_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_health" ON public.api_health_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_insert_health" ON public.api_health_log FOR INSERT WITH CHECK (true);

-- 3. Create user_roles table for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
