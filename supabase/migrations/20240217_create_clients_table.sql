-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    name TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(barbershop_id, phone)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_barbershop_phone ON public.clients(barbershop_id, phone);
CREATE INDEX IF NOT EXISTS idx_clients_is_vip ON public.clients(barbershop_id, is_vip);

-- Add VIP configuration columns to barbershops table
ALTER TABLE public.barbershops 
ADD COLUMN IF NOT EXISTS vip_plan_title TEXT DEFAULT 'VIP',
ADD COLUMN IF NOT EXISTS vip_plan_price TEXT DEFAULT '0,00';

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies (modify as needed based on your auth model)
-- Allowing public read/write for now to match current simple auth, or restrict to owner
CREATE POLICY "Enable read access for all users" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.clients FOR UPDATE USING (true);
