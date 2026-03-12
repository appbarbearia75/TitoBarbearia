ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS whatsapp_notification_numbers text[] DEFAULT '{}';