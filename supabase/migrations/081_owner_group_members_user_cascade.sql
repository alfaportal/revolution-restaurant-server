-- Super Admin fshi klient: users → owner_group_members (prod pa CASCADE).
ALTER TABLE owner_group_members DROP CONSTRAINT IF EXISTS owner_group_members_user_id_fkey;
ALTER TABLE owner_group_members
  ADD CONSTRAINT owner_group_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
