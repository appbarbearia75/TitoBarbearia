-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tabela de Convites (Invites)
create table invites (
  code text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  used_at timestamp with time zone, -- Se nulo, ainda não foi usado
  used_by uuid references auth.users(id) -- Quem usou (opcional no momento do check, mas útil pós uso)
);

-- 2. Tabela de Barbearias (Profiles/Tenants)
create table barbershops (
  id uuid references auth.users(id) on delete cascade primary key, -- 1:1 com usuário do Supabase Auth
  slug text unique not null,
  name text not null,
  address text,
  phone text,
  avatar_url text,
  cover_url text,
  theme_color text default '#DBC278',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Serviços
create table services (
  id uuid default uuid_generate_v4() primary key,
  barbershop_id uuid references barbershops(id) on delete cascade not null,
  title text not null,
  price numeric(10,2) not null,
  duration text, -- Ex: '30 min'
  description text,
  icon text, -- Nome do ícone do Lucide
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Agendamentos (Bookings)
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  barbershop_id uuid references barbershops(id) on delete cascade not null,
  service_id uuid references services(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  date date not null,
  time text not null, -- Ex: '14:30'
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Configuração de Segurança (RLS - Row Level Security)
-- Habilita RLS para todas as tabelas
alter table invites enable row level security;
alter table barbershops enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;

-- POLÍTICAS (Policies)

-- Invites: Qualquer um pode ler (para validar), apenas sistema/admin cria (via service role key normalmente, mas aqui vamos deixar publico para o teste do endpoint)
create policy "Invites públicos para leitura" on invites for select using (true);
create policy "Invites criáveis via API" on invites for insert with check (true);
create policy "Invites atualizáveis via API" on invites for update using (true);

-- Barbearias: Leitura pública (para montar a página), Escrita apenas pelo dono
create policy "Barbearias públicas para leitura" on barbershops for select using (true);
create policy "Dono pode atualizar sua barbearia" on barbershops for update using (auth.uid() = id);
create policy "Dono pode inserir sua barbearia" on barbershops for insert with check (auth.uid() = id);

-- Serviços: Leitura pública, Escrita apenas pelo dono da barbearia
create policy "Serviços públicos para leitura" on services for select using (true);
create policy "Dono pode gerenciar serviços" on services for all using (
  auth.uid() = barbershop_id
);

-- Agendamentos:
-- Leitura: Dono da barbearia vê todos, Público vê apenas horários ocupados (simplificação: permitindo leitura pública por enquanto para validar conflitos, idealmente filtrar campos)
create policy "Leitura de agendamentos publica" on bookings for select using (true);
create policy "Criar agendamento publico" on bookings for insert with check (true);
