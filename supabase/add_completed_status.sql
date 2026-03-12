-- Adicionar 'completed' aos status permitidos
-- PRIMEIRO: Remover a constraint antiga
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- SEGUNDO: Adicionar a nova constraint com 'completed'
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
