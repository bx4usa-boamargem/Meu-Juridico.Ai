-- Correção da policy recursiva na tabela users
-- Remove qualquer policy que faça SELECT em users dentro de users
DROP POLICY IF EXISTS "users_own_org" ON public.users;
DROP POLICY IF EXISTS "users_select_self" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;

-- Nova policy restrita ao próprio usuário, evitando loop `users` -> `users`
CREATE POLICY "users_own_record" ON public.users
  FOR ALL TO authenticated
  USING (id = auth.uid());
