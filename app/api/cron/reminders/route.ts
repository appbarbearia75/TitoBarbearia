import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWebPush } from '@/lib/web-push'

export const dynamic = 'force-dynamic' // Garante que a rota não seja cacheada pela Vercel

export async function GET(request: Request) {
    try {
        console.log("[CRON] Iniciando verificação de lembretes (1 hora antes)...")

        // 1. Pega a hora atual do Brasil e adiciona 1 hora exata pra frente
        // (Como as verificações vão rodar ex: 10:00 -> achará os das 11:00)
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
        now.setMinutes(now.getMinutes() + 60) // Olha 1 hora pro futuro

        // 2. Arredonda os minutos para a casa dos 15 mais próxima (ex: 10:13 -> 10:15) 
        // para dar match com horário fixo do banco se o cron atrasar 1 minuto.
        const minutes = now.getMinutes()
        const remainder = minutes % 15
        let roundedMinutes = minutes
        if (remainder < 8) roundedMinutes -= remainder
        else roundedMinutes += (15 - remainder)

        // Se arredondar pro 60, avança a hora e zera os minutos
        if (roundedMinutes === 60) {
            now.setHours(now.getHours() + 1)
            roundedMinutes = 0
        }

        now.setMinutes(roundedMinutes)

        const targetDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` // 'YYYY-MM-DD'
        const targetTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` // 'HH:MM'

        console.log(`[CRON] Procurando agendamentos em ${targetDateStr} às ${targetTimeStr}`)

        // 3. Busca no banco todos com status "confirmed" em targetDate e targetTime.
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
                *,
                barbershops(name, phone, whatsapp_notification_numbers),
                services(title),
                barbers(name)
            `)
            .eq('date', targetDateStr)
            .eq('time', targetTimeStr)
            .eq('status', 'confirmed')

        if (error) {
            console.error("[CRON] Erro ao buscar agendamentos:", error)
            return NextResponse.json({ error: 'Falha no banco de dados' }, { status: 500 })
        }

        if (!bookings || bookings.length === 0) {
            console.log(`[CRON] Nenhum agendamento para daqui 1 hora.`)
            return NextResponse.json({ success: true, message: 'Nenhum agendamento para lembrar agora.' })
        }

        console.log(`[CRON] ${bookings.length} agendamentos encontrados. Enviando mensagens aos barbeiros...`)

        const instance = process.env.ZAPI_INSTANCE || ''
        const token = process.env.ZAPI_TOKEN || ''
        const clientToken = process.env.ZAPI_CLIENT_TOKEN || ''

        let enviados = 0

        for (const booking of bookings) {
            const barbershop = booking.barbershops
            if (!barbershop) continue

            const serviceName = booking.services?.title || 'Serviço Profissional'
            const barberName = booking.barbers?.name || 'Seu profissional'
            const displayDate = booking.date.split('-').reverse().join('/')
            const clientName = booking.customer_name || 'Cliente'
            const clientPhoneStr = booking.customer_phone || 'Não informado'

            const msgProfissional = `⏳ *Lembrete de Agendamento (Falta 1 hora)* ⏳\n\nO cliente *${clientName}* (${clientPhoneStr}) tem um horário agendado com *${barberName}* em exato *1 hora*.\n\n📅 *Data:* ${displayDate}\n⏰ *Hora:* ${booking.time}\n✂️ *Serviço:* ${serviceName}\n\nPrepare-se para o atendimento! 😉`

            // Z-API
            if (instance && token && instance !== 'SUA_INSTANCIA_AQUI') {
                const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`
                const headers: Record<string, string> = { 'Content-Type': 'application/json' }
                if (clientToken) headers['Client-Token'] = clientToken

                // Tenta pegar array de telefones de notificação
                let targets: string[] = []
                if (barbershop.whatsapp_notification_numbers && barbershop.whatsapp_notification_numbers.length > 0) {
                    targets = barbershop.whatsapp_notification_numbers
                } else if (barbershop.phone) {
                    targets = [barbershop.phone]
                }

                for (const phoneTarget of targets) {
                    const cleanPhone = phoneTarget.replace(/\D/g, '')
                    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

                    try {
                        const zapiRes = await fetch(url, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ phone: finalPhone, message: msgProfissional })
                        })
                        if (zapiRes.ok) enviados++
                        else console.error(`[CRON] Falha na Z-API para o barbeiro no agendamento de ${clientName}`)
                    } catch (e) {
                        console.error('[CRON] Erro de rede ao chamar Z-API:', e)
                    }
                }
            } else {
                console.warn("[CRON] Z-API não configurada. Lembrete lido, mas não enviado.")
            }

            // --- WEB PUSH ---
            try {
                // Notificar Cliente (se tiver app instalado/permitido push)
                const { data: existingClient } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('barbershop_id', booking.barbershop_id)
                    .eq('phone', booking.customer_phone)
                    .single()

                if (existingClient) {
                    const { data: subs } = await supabase
                        .from('push_subscriptions')
                        .select('*')
                        .eq('client_id', existingClient.id)

                    if (subs && subs.length > 0) {
                        const titleClient = `Lembrete de Agendamento ⏰`
                        const bodyClient = `Seu horário na ${barbershop.name || 'barbearia'} é às ${booking.time}. Estamos te esperando!`
                        const payloadClient = { title: titleClient, body: bodyClient, icon: '/ICON-PNG.png', url: '/' }
                        
                        for (const sub of subs) {
                            const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }
                            await sendWebPush(pushSub, payloadClient).catch(e => console.log('Erro ao enviar push para cliente', e))
                        }
                    }
                }

                // Notificar Barbeiro / Admin
                const { data: adminSubs } = await supabase
                    .from('push_subscriptions')
                    .select('*')
                    .eq('user_id', booking.barbershop_id)

                if (adminSubs && adminSubs.length > 0) {
                    const titleAdmin = `Lembrete de Agendamento ⏳`
                    const bodyAdmin = `O cliente ${clientName} (${clientPhoneStr}) tem horário marcado para as ${booking.time}.`
                    const payloadAdmin = { title: titleAdmin, body: bodyAdmin, icon: '/ICON-PNG.png', url: '/' }

                    for (const sub of adminSubs) {
                        const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }
                        await sendWebPush(pushSub, payloadAdmin).catch(e => console.log('Erro ao enviar push para admin', e))
                    }
                }
            } catch (wpErr) {
                console.error("[CRON] Erro no Web Push:", wpErr)
            }
            // ----------------
        }

        return NextResponse.json({ success: true, sent: enviados, total: bookings.length })
    } catch (e: any) {
        console.error('[CRON] Catch Geral:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
