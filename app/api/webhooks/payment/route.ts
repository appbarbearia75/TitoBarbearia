
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Log payload for debugging
        console.log('AbacatePay Webhook Payload:', JSON.stringify(body, null, 2))

        const { event, data } = body

        // Check for billing paid event
        // AbacatePay sends 'billing.paid' when a payment is confirmed
        if (event === 'billing.paid') {
            // Extract billing ID - supporting both potential structures for robustness
            const billingId = data.billing?.id || data.id

            if (!billingId) {
                console.error('Webhook Error: Missing billing ID in payload')
                return NextResponse.json({ error: 'Invalid payload: Missing billing ID' }, { status: 400 })
            }

            console.log(`Processing payment confirmation for Billing ID: ${billingId}`)

            // Update payment status in our database
            const { error } = await supabase
                .from('payments')
                .update({
                    status: 'confirmed',
                    metadata: data // Store full webhook data for record keeping
                })
                .eq('transaction_id', billingId)

            if (error) {
                console.error('Database update failed:', error)
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
            }

            console.log(`Payment confirmed successfully for Billing ID: ${billingId}`)
        } else {
            console.log(`Ignoring event type: ${event}`)
        }

        // Always return success to acknowledge receipt to AbacatePay
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Webhook processing failed:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}
