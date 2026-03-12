
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { plan, customer } = body

        // Basic validation
        if (!plan || !customer || !customer.email || !customer.name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const apiKey = process.env.ABACATEPAY_API_KEY || 'abc_dev_nZQFAWLTzHA5GQsjzabfYbdb'
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        // Define plan details
        const plans: any = {
            monthly: {
                frequency: "ONE_TIME", // Or RECURRING/MONTHLY if supported
                amount: 4990,
                description: "Plano Mensal - Tito Barbearia"
            },
            quarterly: { // Semestral in UI, let's match UI name
                frequency: "ONE_TIME",
                amount: 26990,
                description: "Plano Semestral - Tito Barbearia"
            },
            yearly: {
                frequency: "ONE_TIME",
                amount: 49990,
                description: "Plano Anual - Tito Barbearia"
            }
        }

        const selectedPlan = plans[plan]
        if (!selectedPlan) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        // Create billing in AbacatePay
        const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                frequency: selectedPlan.frequency,
                methods: ["PIX"], // Removing CARD as per error: CARD is not available for this store
                products: [
                    {
                        externalId: `PLAN-${plan.toUpperCase()}`,
                        name: selectedPlan.description,
                        quantity: 1,
                        price: selectedPlan.amount,
                        description: selectedPlan.description
                    }
                ],
                returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/assinatura/sucesso`,
                completionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/assinatura/sucesso`,
                customer: {
                    name: customer.name,
                    email: customer.email,
                    cellphone: customer.phone, // Optional
                    taxId: customer.cpf // Optional but good for PIX
                }
            })
        })

        const abacateData = await abacateResponse.json()

        console.log('AbacatePay Response:', JSON.stringify(abacateData, null, 2))

        if (!abacateResponse.ok) {
            console.error('AbacatePay Error:', abacateData)
            throw new Error(abacateData.error || 'Failed to create billing')
        }

        if (!abacateData.data) {
            console.error('AbacatePay Invalid Response (missing data):', abacateData)
            // Check if the response IS the data (sometimes APIs are weird)
            if (abacateData.url && abacateData.id) {
                // The response structure is flat
                abacateData.data = abacateData
            } else {
                console.error('AbacatePay Invalid Response (full object):', JSON.stringify(abacateData, null, 2))
                throw new Error('Invalid response from payment provider: ' + JSON.stringify(abacateData))
            }
        }

        const transactionId = abacateData.data.id || abacateData.id
        const paymentUrl = abacateData.data.url || abacateData.url

        if (!transactionId || !paymentUrl) {
            console.error('AbacatePay Missing ID/URL:', abacateData)
            throw new Error('Payment provider returned incomplete data')
        }

        // Insert into our payments table
        const { error } = await supabase
            .from('payments')
            .insert({
                transaction_id: transactionId,
                status: 'pending',
                amount: selectedPlan.amount,
                customer_email: customer.email,
                plan_type: plan,
                metadata: abacateData.data || abacateData
            })

        if (error) {
            console.error('Database insert failed:', error)
            // We still return the URL because the payment was created
        }

        return NextResponse.json({ url: paymentUrl })

    } catch (error: any) {
        console.error('Checkout error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
