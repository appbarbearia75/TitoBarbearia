-- Create Barbers Table
CREATE TABLE IF NOT EXISTS barbers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    photo_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add barber_id to Bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

-- Policies for Barbers
-- Public read access
CREATE POLICY "Public can view barbers" ON barbers
    FOR SELECT USING (true);

-- Tenants/Admins can manage their own barbers
-- Note: Check existing policies for patterns. Usually checking barbershop_id match if available in auth metadata or via specific logic.
-- For simplicity in this project context (RLS often disabled or open for simplicity in previous steps), we'll add basic policies.

CREATE POLICY "Admins can manage barbers" ON barbers
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM barbershops WHERE id = barbers.barbershop_id
        )
    );
