DROP POLICY IF EXISTS "users_own_org" ON users;
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "users_own_org" ON users
  FOR ALL USING (org_id = get_user_org_id());
