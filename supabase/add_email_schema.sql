-- Add email column to barbershops table
alter table barbershops 
add column if not exists email text;

-- Optional: Update existing records to match auth email if possible (requires manual update or complex query)
-- For now, just adding the column is enough to fix the registration error.
