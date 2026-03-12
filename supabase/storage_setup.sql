-- Enable Storage Extension (usually enabled by default but good to verify if possible, though specific to storage schema)

-- 1. Create Storage Bucket 'images'
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. Policies for Storage
-- Allow public access to view images
create policy "Public Access to Images"
on storage.objects for select
using ( bucket_id = 'images' );

-- Allow authenticated users (barbershops) to upload their own images
-- For simplicity, allowing any auth user to upload to 'images' bucket
-- Ideally we restrict by folder name corresponding to user ID
create policy "Authenticated Users can Upload"
on storage.objects for insert
with check (
  bucket_id = 'images'
  and auth.role() = 'authenticated'
);

-- Allow users to update/delete their own images
create policy "Users can Update Own Images"
on storage.objects for update
using (
  bucket_id = 'images' 
  and auth.uid() = owner
);

create policy "Users can Delete Own Images"
on storage.objects for delete
using (
  bucket_id = 'images'
  and auth.uid() = owner
);
