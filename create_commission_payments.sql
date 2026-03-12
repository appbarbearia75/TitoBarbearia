CREATE TABLE public.commission_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Habilitar RLS (Row Level Security) para segurança
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Permitir leitura para pagamentos da própria barbearia" 
ON public.commission_payments 
FOR SELECT 
USING (barbershop_id IN (
    SELECT id FROM public.barbershops WHERE id = commission_payments.barbershop_id
));

CREATE POLICY "Permitir inserção de pagamentos da própria barbearia" 
ON public.commission_payments 
FOR INSERT 
WITH CHECK (barbershop_id IN (
    SELECT id FROM public.barbershops WHERE id = commission_payments.barbershop_id
));

-- Adicionar índice para performance de buscas por barbeiro e barbearia
CREATE INDEX idx_commission_payments_barbershop ON public.commission_payments(barbershop_id);
CREATE INDEX idx_commission_payments_barber ON public.commission_payments(barber_id);
