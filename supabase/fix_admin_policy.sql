-- Fix RLS policy to avoid recursion and ensure admins can access their own record
drop policy if exists "Admins can view admin list" on app_admins;

-- Allow users to see THEIR OWN admin record (sufficient for login check)
create policy "Users can view own admin status" on app_admins
for select using (auth.uid() = id);

-- If you forgot to insert yourself, here is a reminder of the command (replace the ID!)
-- insert into app_admins (id, email) values ('SEU_UUID_AQUI', 'kevbarroz@gmail.com');
