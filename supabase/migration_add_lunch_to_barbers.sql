ALTER TABLE public.barbers
ADD COLUMN IF NOT EXISTS lunch_start time without time zone,
ADD COLUMN IF NOT EXISTS lunch_end time without time zone;
