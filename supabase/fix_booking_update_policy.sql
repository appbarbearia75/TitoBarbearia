-- Allow barbershop owners to update bookings for their shop
create policy "Dono pode atualizar agendamentos" on bookings
for update
using (
  auth.uid() = barbershop_id
)
with check (
  auth.uid() = barbershop_id
);
