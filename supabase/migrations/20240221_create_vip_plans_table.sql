-- Create VIP Plans table
CREATE TABLE IF NOT EXISTS vip_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    price_from NUMERIC(10,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE vip_plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for VIP plans" ON vip_plans
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage their own VIP plans" ON vip_plans
    FOR ALL USING (auth.uid() = barbershop_id);
