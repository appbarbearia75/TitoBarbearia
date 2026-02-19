-- 1. Create table for Application Super Admins
create table app_admins (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Update Barbershops table with status fields
alter table barbershops 
add column if not exists is_active boolean default true,
add column if not exists subscription_status text default 'active'; -- active, past_due, canceled, trial

-- 3. Security Policies for App Admins

-- Enable RLS on app_admins
alter table app_admins enable row level security;

-- Only super admins can view the admin list (recursion check might happen if not careful, but usually fine)
create policy "Admins can view admin list" on app_admins 
for select using (auth.uid() in (select id from app_admins));

-- Allow admins to update ANY barbershop (override previous owner-only policy?)
-- We need a new policy for Super Admins on barbershops
create policy "Super Admins can update any barbershop" on barbershops
for update using (auth.uid() in (select id from app_admins));

-- Allow admins to delete barbershops
create policy "Super Admins can delete any barbershop" on barbershops
for delete using (auth.uid() in (select id from app_admins));

-- 4. Insert the first Admin (YOU)
-- Replace 'YOUR_USER_ID' with your actual Supabase User ID found in Authentication > Users
-- insert into app_admins (id, email) values ('YOUR_USER_ID', 'your@email.com');
