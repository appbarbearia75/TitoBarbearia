-- Add vip_price to barbershops table
ALTER TABLE barbershops ADD COLUMN vip_price numeric(10,2) DEFAULT 99.90;
