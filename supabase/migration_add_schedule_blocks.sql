CREATE TABLE public.schedule_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
    date DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    professional_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE, -- NULL significa global
    is_global BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT, -- 'daily', 'weekly', 'monthly'
    recurrence_days SMALLINT[], -- array de inteiros (0=Dom, 1=Seg...)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Policy de leitura
CREATE POLICY "Leitura de schedule_blocks pública ou autenticada" 
ON public.schedule_blocks FOR SELECT 
USING (true);

-- Policy de escrita/admin
CREATE POLICY "Admins podem inserir schedule_blocks" 
ON public.schedule_blocks FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins podem atualizar schedule_blocks" 
ON public.schedule_blocks FOR UPDATE 
USING (true);

CREATE POLICY "Admins podem deletar schedule_blocks" 
ON public.schedule_blocks FOR DELETE 
USING (true);
