-- Drop the broken delete policy
drop policy if exists "Dono deleta bookings" on bookings;

-- Create the fixed delete policy
create policy "Dono deleta bookings" on bookings
for delete
using (
  auth.uid() = barbershop_id
);
