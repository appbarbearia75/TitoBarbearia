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
        const { data } = await supabase.from('barbershops').select('id').eq('slug', client.slug).single();
        if (data) {
            const { data: barbersData } = await supabase.from('barbers').select('*').eq('barbershop_id', data.id).eq('active', true);
            setBarbers(barbersData || []);
        }
    };

    if (barbers.length === 0) return null;

    return (
        <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-hide'>
            <div
                onClick={() => onSelect(null)}
                className={cn(
                    'min-w-[100px] h-[120px] rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all',
                    selectedBarber === null ? 'border-[#DBC278] bg-[#DBC278]/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                )}
                style={selectedBarber === null ? { borderColor: client.themeColor, backgroundColor: `${client.themeColor}1A` } : undefined}
            >
                <div className='w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center'>
                    <User className='w-6 h-6 text-zinc-400' />
                </div>
                <span className='text-sm font-bold text-white'>Sem Preferência</span>
            </div>
            {barbers.map(barber => (
                <div
                    key={barber.id}
                    onClick={() => onSelect(barber.id)}
                    className={cn(
                        'min-w-[100px] h-[120px] rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all',
                        selectedBarber === barber.id ? 'border-[#DBC278] bg-[#DBC278]/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                    )}
                    style={selectedBarber === barber.id ? { borderColor: client.themeColor, backgroundColor: `${client.themeColor}1A` } : undefined}
                >
                    <div className='w-12 h-12 rounded-full overflow-hidden bg-zinc-800'>
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
