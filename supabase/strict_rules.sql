-- Reforçar segurança das tabelas (Data Isolation)

-- 1. Barbearias (Barbershops)
-- Apenas o dono pode atualizar deletar sua própria barbearia
drop policy if exists "Dono pode atualizar sua barbearia" on barbershops;
create policy "Dono pode atualizar sua barbearia" on barbershops
for update using (auth.uid() = id);

-- Apenas o dono pode deletar (opcional)
create policy "Dono pode deletar sua barbearia" on barbershops
for delete using (auth.uid() = id);

-- 2. Serviços (Services)
-- Apenas o dono da barbearia vinculada pode criar/editar/deletar serviços
drop policy if exists "Dono pode gerenciar serviços" on services;

create policy "Dono pode ver seus serviços" on services
for select using (true); -- Publico precisa ver para agendar, mas no admin filtramos pelo ID

create policy "Dono pode inserir serviços" on services
for insert with check (auth.uid() = barbershop_id);

create policy "Dono pode atualizar serviços" on services
for update using (auth.uid() = barbershop_id);

create policy "Dono pode deletar serviços" on services
for delete using (auth.uid() = barbershop_id);

-- 3. Agendamentos (Bookings)
-- Leitura publica (para verificar disponibilidade) - mantemos true para simplificar o calendario publico
-- Mas UPDATE e DELETE apenas para o dono
drop policy if exists "Leitura de agendamentos publica" on bookings;
create policy "Leitura publica de bookings" on bookings for select using (true);

drop policy if exists "Criar agendamento publico" on bookings;
create policy "Qualquer um pode criar booking" on bookings 
for insert with check (true);

-- Apenas o dono (barbershop_id) pode alterar status ou deletar
create policy "Dono gerencia bookings" on bookings
for update using (
    exists (
        select 1 from barbershops 
        where id = bookings.barbershop_id 
        and id = auth.uid()
    )
);

create policy "Dono deleta bookings" on bookings
for delete using (
    exists (
        select 1 from barbershops 
        where id = bookings.barbershop_id 
        and id = auth.uid()
    )
);
