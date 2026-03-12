-- 1. Table for Products
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table for Commands (Comandas)
CREATE TABLE IF NOT EXISTS commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
    client_id UUID,
    client_name TEXT, 
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'closed', 'cancelled'
    subtotal_amount NUMERIC NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC NOT NULL DEFAULT 0.00,
    discount_type TEXT DEFAULT 'fixed', -- 'fixed' or 'percentage'
    total_amount NUMERIC NOT NULL DEFAULT 0.00,
    payment_method TEXT, -- 'pix', 'credit', 'debit', 'cash', 'split'
    split_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Table for Command Items
CREATE TABLE IF NOT EXISTS command_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    command_id UUID NOT NULL REFERENCES commands(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'service' or 'product'
    item_id UUID, -- No strict FK because we want history persistence if item is deleted
    item_name TEXT NOT NULL,
    unit_price NUMERIC NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC NOT NULL DEFAULT 0.00,
    barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link Comanda <-> Agendamento
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS command_id UUID REFERENCES commands(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update products" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete products" ON products FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to select commands" ON commands FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert commands" ON commands FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update commands" ON commands FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete commands" ON commands FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to select command items" ON command_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert command items" ON command_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update command items" ON command_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete command items" ON command_items FOR DELETE USING (auth.role() = 'authenticated');