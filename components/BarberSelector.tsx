import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Client } from '@/app/data';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarberSelectorProps {
    client: Client;
    selectedBarber: string | null;
    onSelect: (id: string | null) => void;
}

export function BarberSelector({ client, selectedBarber, onSelect }: BarberSelectorProps) {
    const [barbers, setBarbers] = useState<any[]>([]);

    useEffect(() => {
        fetchBarbers();
    }, []);

    const fetchBarbers = async () => {
        // Check if client has custom barbers list (e.g. from Demo Settings)
        if (client.barbers && client.barbers.length > 0) {
            setBarbers(client.barbers)
            if (selectedBarber === null) {
                onSelect(client.barbers[0].id)
            }
            return
        }

        // Mock for Demo (Fallback if no custom barbers)
        if (client.slug === 'demo' || client.slug === 'barbearia-modelo') {
            const mockBarbers = [
                { id: 'b1', name: 'Pedro', photo_url: '/barber1.png', active: true },
                { id: 'b2', name: 'João', photo_url: '/barber2.png', active: true },
                { id: 'b3', name: 'Lucas', photo_url: '/barber3.png', active: true },
            ]
            setBarbers(mockBarbers)
            if (selectedBarber === null) {
                onSelect(mockBarbers[0].id)
            }
            return
        }

        const { data } = await supabase.from('barbershops').select('id').eq('slug', client.slug).single();
        if (data) {
            const { data: barbersData } = await supabase.from('barbers').select('*').eq('barbershop_id', data.id).eq('active', true);
            if (barbersData && barbersData.length > 0) {
                setBarbers(barbersData);
                // Auto-select first barber if none selected
                if (selectedBarber === null) {
                    onSelect(barbersData[0].id);
                }
            } else {
                setBarbers([]);
            }
        }
    };

    if (barbers.length === 0) return null;

    return (
        <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-hide'>
            {barbers.map(barber => (
                <div
                    key={barber.id}
                    onClick={() => onSelect(barber.id)}
                    className={cn(
                        'min-w-[100px] h-[120px] rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all',
                        selectedBarber === barber.id ? 'border-[#DBC278] bg-[#DBC278]/10' : 'border-white/5 bg-[#1c1c1c] hover:border-zinc-700 shadow-lg shadow-black/50'
                    )}
                    style={selectedBarber === barber.id ? { borderColor: client.themeColor, backgroundColor: `${client.themeColor}1A` } : undefined}
                >
                    <div className='w-12 h-12 rounded-full overflow-hidden bg-[#09090b]'>
                        {barber.photo_url ? (
                            <img src={barber.photo_url} alt={barber.name} className='w-full h-full object-cover' />
                        ) : (
                            <div className='w-full h-full flex items-center justify-center text-zinc-500 text-xs'>Foto</div>
                        )}
                    </div>
                    <span className='text-sm font-bold text-white'>{barber.name}</span>
                </div>
            ))}
        </div>
    );
}
