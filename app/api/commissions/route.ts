import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const barbershop_id = searchParams.get('barbershop_id')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const barberId = searchParams.get('barberId') // optional filter

    if (!barbershop_id) {
        return NextResponse.json({ error: 'Barbershop ID required' }, { status: 400 })
    }

    try {
        // Build query for bookings
        let bookingsQuery = supabase
            .from('bookings')
            .select(`
                id, date, time, customer_name, commission_earned, commission_paid, commission_paid_amount, status,
                services (title, price),
                barbers!inner (id, name, commission_type, commission_value, photo_url, role)
            `)
            .eq('barbershop_id', barbershop_id)
            .eq('status', 'completed')

        if (startDate) bookingsQuery = bookingsQuery.gte('date', startDate)
        if (endDate) bookingsQuery = bookingsQuery.lte('date', endDate)
        if (barberId && barberId !== 'all') bookingsQuery = bookingsQuery.eq('barber_id', barberId)

        const { data: bookings, error } = await bookingsQuery

        if (error) {
            console.error('Error fetching bookings/commissions:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Process data
        let totalRevenue = 0
        let totalCommissions = 0
        const barberMap = new Map<string, any>()

        // Fetch last payment dates for all barbers in this shop
        const { data: payments } = await supabase
            .from('commission_payments')
            .select('barber_id, created_at')
            .eq('barbershop_id', barbershop_id)
            .order('created_at', { ascending: false })

        const lastPaymentMap = new Map<string, string>()
        if (payments) {
            payments.forEach(p => {
                if (!lastPaymentMap.has(p.barber_id)) {
                    lastPaymentMap.set(p.barber_id, p.created_at)
                }
            })
        }

        bookings.forEach(booking => {
            const bPrice = parseFloat((booking.services as any)?.price || '0')
            let bComm = parseFloat(booking.commission_earned || '0')

            // Retroactive calculation for old bookings where commission_earned is null or 0
            if (!booking.commission_earned || bComm === 0) {
                const cType = (booking.barbers as any)?.commission_type || 'percentage'
                const cVal = parseFloat((booking.barbers as any)?.commission_value || '0')
                if (cType === 'percentage') {
                    bComm = bPrice * (cVal / 100)
                } else if (cType === 'fixed') {
                    bComm = cVal
                }
            }
            let isPaid = booking.commission_paid || false
            let alreadyPaid = parseFloat(booking.commission_paid_amount || '0')
            if (isPaid && alreadyPaid === 0) {
                // Backward compatibility if marked paid without amount
                alreadyPaid = bComm
            }
            if (alreadyPaid > bComm) alreadyPaid = bComm

            const pendingAmount = bComm - alreadyPaid

            totalRevenue += bPrice
            totalCommissions += pendingAmount // we will rename this later if needed, but let's keep it and add fields

            const bId = (booking.barbers as any).id
            if (!barberMap.has(bId)) {
                barberMap.set(bId, {
                    id: bId,
                    name: (booking.barbers as any).name,
                    photoUrl: (booking.barbers as any).photo_url,
                    role: (booking.barbers as any).role,
                    commissionType: (booking.barbers as any).commission_type,
                    commissionValue: parseFloat((booking.barbers as any).commission_value),
                    totalAppointments: 0,
                    totalRevenue: 0,
                    totalCommission: 0, // Pending
                    totalCommissionPaid: 0, // Paid
                    servicesSold: 0,
                    appointmentsList: []
                })
            }

            const bStats = barberMap.get(bId)
            bStats.totalAppointments += 1
            bStats.totalRevenue += bPrice

            bStats.totalCommissionPaid += alreadyPaid
            bStats.totalCommission += Math.max(0, pendingAmount)
            bStats.servicesSold += 1

            bStats.appointmentsList.push({
                id: booking.id,
                date: booking.date,
                time: booking.time,
                clientName: booking.customer_name,
                service: (booking.services as any)?.title || 'Serviço Excluído',
                value: bPrice,
                commission: bComm,
                paidAmount: alreadyPaid,
                isPaid: isPaid || pendingAmount <= 0.01
            })
        })

        // Calculate estimation ratio based on the period
        let estimationRatio = 1;
        if (startDate && endDate) {
            const startDt = new Date(startDate);
            const endDt = new Date(endDate);
            const nowDt = new Date();

            // Only estimate if the period includes today or is in the future
            if (nowDt >= startDt && nowDt < endDt) {
                const totalPeriodDays = Math.round((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const elapsedDays = Math.max(1, Math.round((nowDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)));
                estimationRatio = totalPeriodDays / elapsedDays;
            } else if (nowDt < startDt) {
                // Future period entirely
                estimationRatio = 0;
            }
        }

        const barbersArray = Array.from(barberMap.values()).map(b => {
            const totalGen = b.totalCommission + b.totalCommissionPaid;
            return {
                ...b,
                averageTicket: b.totalAppointments > 0 ? (b.totalRevenue / b.totalAppointments) : 0,
                lastPaymentDate: lastPaymentMap.get(b.id) || null,
                estimatedCommission: totalGen * estimationRatio,
                appointmentsList: b.appointmentsList.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }
        }).sort((a, b) => b.totalRevenue - a.totalRevenue)

        let topBarber = barbersArray.length > 0 ? barbersArray[0] : null

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalCommissionsGenerated: barbersArray.reduce((acc, b) => acc + (b.totalCommission + b.totalCommissionPaid), 0),
                totalCommissionsPending: barbersArray.reduce((acc, b) => acc + b.totalCommission, 0),
                estimatedMargin: totalRevenue - barbersArray.reduce((acc, b) => acc + (b.totalCommission + b.totalCommissionPaid), 0),
                topBarberId: topBarber?.id || null,
                topBarberName: topBarber?.name || 'N/A'
            },
            barbers: barbersArray
        })

    } catch (err) {
        console.error('API /commissions error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
