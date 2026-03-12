import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            command_id,
            total_amount,
            subtotal_amount,
            discount_amount,
            discount_type,
            payment_method,
            split_details
        } = body

        if (!command_id) {
            return NextResponse.json({ error: 'Command ID is required' }, { status: 400 })
        }

        // 1. Fetch Command and Items
        const { data: command, error: cmdErr } = await supabase
            .from('commands')
            .select('*')
            .eq('id', command_id)
            .single()

        if (cmdErr || !command) throw cmdErr || new Error("Comanda não encontrada")
        if (command.status === 'closed') {
            return NextResponse.json({ error: 'Comanda já está fechada' }, { status: 400 })
        }

        const { data: items, error: itemsErr } = await supabase
            .from('command_items')
            .select('*')
            .eq('command_id', command_id)

        if (itemsErr) throw itemsErr

        // 2. Perform Stock Reductions for Products
        const productsList = items.filter((i: any) => i.item_type === 'product' && i.item_id)
        for (const prod of productsList) {
            // Get current stock
            const { data: currentProd } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', prod.item_id)
                .single()

            if (currentProd) {
                const newStock = Math.max(0, currentProd.stock_quantity - prod.quantity)
                await supabase
                    .from('products')
                    .update({ stock_quantity: newStock })
                    .eq('id', prod.item_id)
            }
        }

        // 3. Handle Commissions (Inject into bookings if Walk-in, or update if exists)
        const servicesList = items.filter((i: any) => i.item_type === 'service' && i.barber_id)

        // Let's check if this command originated from a booking
        const { data: linkedBookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('command_id', command_id)

        // Iterate over service items
        for (const srv of servicesList) {
            // Check if there's already a booking for this specific service and barber in this command
            const existingBooking = linkedBookings?.find(b => b.service_id === srv.item_id && b.barber_id === srv.barber_id)

            // Let's dynamically calculate the commission
            let commissionValue = 0
            const { data: barberData } = await supabase
                .from('barbers')
                .select('commission_type, commission_value')
                .eq('id', srv.barber_id)
                .single()

            if (barberData) {
                // Determine the base price of the service considering potential partial discounts across the entire command
                // Since command discount applies to total, we can approximate the service value identically to its unit price for commission.
                // Or if there's an exact business rule, we adjust. For now: using unit_price.
                const basePrice = Number(srv.unit_price) // using unit_price per item

                if (barberData.commission_type === 'percentage') {
                    commissionValue = basePrice * (Number(barberData.commission_value) / 100)
                } else if (barberData.commission_type === 'fixed') {
                    commissionValue = Number(barberData.commission_value)
                }
            }

            if (existingBooking) {
                // Update booking to completed and inject frozen commission_earned
                await supabase
                    .from('bookings')
                    .update({
                        status: 'completed',
                        commission_earned: commissionValue
                    })
                    .eq('id', existingBooking.id)
            } else {
                // Inject a ghost booking so the standard "Commissions Module" captures it
                // We use today's date and time
                const now = new Date()
                const dateStr = now.toISOString().split('T')[0]
                const timeStr = now.toTimeString().split(' ')[0].substring(0, 5)

                await supabase
                    .from('bookings')
                    .insert([{
                        barbershop_id: command.barbershop_id,
                        barber_id: srv.barber_id,
                        service_id: srv.item_id,
                        customer_name: command.client_name || "Cliente Avulso (PDV)",
                        customer_phone: "",
                        date: dateStr,
                        time: timeStr,
                        status: 'completed',
                        command_id: command_id,
                        commission_earned: commissionValue
                    }])
            }
        }

        // 4. Update the Commands Table
        const { error: updErr } = await supabase
            .from('commands')
            .update({
                status: 'closed',
                subtotal_amount,
                discount_amount,
                discount_type,
                total_amount,
                payment_method,
                split_details: split_details || {},
                closed_at: new Date().toISOString()
            })
            .eq('id', command_id)

        if (updErr) throw updErr

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("PDV Close Command Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
