-- Add commission_paid column to bookings table to track paid commissions
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false;
