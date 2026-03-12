import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const { data, error } = await supabase.from('bookings').select('*').eq('status', 'locked');
    return NextResponse.json({ data, error });
}
