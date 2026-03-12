-- Migration to add position column to services table
-- Run this in the Supabase SQL Editor

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;

-- Optional: Update existing services to have a position based on creation date
-- This initializes the order so they aren't all 0
WITH numbered_services AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_pos
  FROM services
)
UPDATE services
SET "position" = numbered_services.new_pos
FROM numbered_services
WHERE services.id = numbered_services.id;
