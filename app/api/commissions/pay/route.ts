import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { barbershop_id, barber_id, amount } = body

        if (!barbershop_id || !barber_id || amount === undefined) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        // Fetch all pending bookings for this barber, oldest first
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
                id, date, time, commission_earned, commission_paid, commission_paid_amount,
                services(price),
                barbers!inner(commission_type, commission_value)
            `)
            .eq('barbershop_id', barbershop_id)
            .eq('barber_id', barber_id)
            .eq('status', 'completed')
            .eq('commission_paid', false)
            .order('date', { ascending: true })
            .order('time', { ascending: true })

        if (error) {
            console.error('Error fetching bookings:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        let remainingToPay = parseFloat(amount || '0')
        // Even if amount is 0, we still process to run any retro calculations if needed? No, just return early.
        if (remainingToPay <= 0) {
            return NextResponse.json({ success: true, remainingUnusedAmount: 0 })
        }

        const updates = []

        for (const booking of bookings) {
            if (remainingToPay <= 0) break;

            const bPrice = parseFloat((booking.services as any)?.price || '0')
            let bComm = parseFloat(booking.commission_earned || '0')

            // Retroactive config calculation
            if (!booking.commission_earned || bComm === 0) {
                const cType = (booking.barbers as any)?.commission_type || 'percentage'
                const cVal = parseFloat((booking.barbers as any)?.commission_value || '0')
                if (cType === 'percentage') {
                    bComm = bPrice * (cVal / 100)
                } else if (cType === 'fixed') {
                    bComm = cVal
                }
            }

            const alreadyPaid = parseFloat(booking.commission_paid_amount || '0')
            const pendingForBooking = bComm - alreadyPaid

            if (pendingForBooking > 0) {
                const payingNow = Math.min(remainingToPay, pendingForBooking)
                const newPaidAmount = alreadyPaid + payingNow

                // Allow a small epsilon for float comparison errors
                const isFullyPaid = newPaidAmount >= bComm - 0.01

                updates.push({
                    id: booking.id,
                    commission_paid_amount: newPaidAmount,
                    commission_paid: isFullyPaid,
                    commission_earned: bComm
                })

                remainingToPay -= payingNow
            } else if (pendingForBooking <= 0 && !booking.commission_paid) {
                updates.push({
                    id: booking.id,
                    commission_paid_amount: alreadyPaid,
                    commission_paid: true,
                    commission_earned: bComm
                })
            }
        }

        // Apply updates
        for (const u of updates) {
            await supabase.from('bookings').update({
                commission_paid_amount: u.commission_paid_amount,
                commission_paid: u.commission_paid,
                commission_earned: u.commission_earned
            }).eq('id', u.id)
        }

        return NextResponse.json({ success: true, remainingUnusedAmount: remainingToPay })

    } catch (err: any) {
        console.error('API /commissions/pay error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
