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

-- Admins can manage barbers
-- Since barbershop.id is the user.id (owner), we check if the current user is the barbershop_id
CREATE POLICY "Admins can manage barbers" ON barbers
    FOR ALL USING (
        auth.uid() = barbershop_id
    );
