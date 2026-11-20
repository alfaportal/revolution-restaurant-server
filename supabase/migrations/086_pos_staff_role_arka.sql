ALTER TABLE public.pos_staff DROP CONSTRAINT IF EXISTS pos_staff_role_check;
ALTER TABLE public.pos_staff
  ADD CONSTRAINT pos_staff_role_check
  CHECK (role IN ('waiter', 'kitchen', 'arka'));
