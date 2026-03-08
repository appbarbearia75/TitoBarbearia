-- Add opening_hours column to barbershops table
alter table barbershops 
add column if not exists opening_hours jsonb;
