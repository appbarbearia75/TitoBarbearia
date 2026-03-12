import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { phone, message } = body

        if (!phone || !message) {
            return NextResponse.json({ error: 'Faltando telefone ou mensagem' }, { status: 400 })
        }

        // Recomendado: Adicione estas chaves no seu arquivo .env.local
        const instance = process.env.ZAPI_INSTANCE || ''
        const token = process.env.ZAPI_TOKEN || ''
        const clientToken = process.env.ZAPI_CLIENT_TOKEN || ''

        if (!instance || !token || instance === 'SUA_INSTANCIA_AQUI') {
            console.warn("[Z-API] Credenciais ausentes. Por favor configure as variáveis de ambiente ZAPI_INSTANCE e ZAPI_TOKEN.")
            // Retornamos success localmente para não travar a aplicação caso as chaves não estejam configuradas ainda
            return NextResponse.json({ success: true, warning: 'Credenciais ausentes' })
        }

        // Formata o telefone (retira não-números e garante o +55)
        const cleanPhone = phone.replace(/\D/g, '')
        const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

        const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        }

        if (clientToken) headers['Client-Token'] = clientToken

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                phone: finalPhone,
                message: message
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("Z-API Error:", errorData)
            return NextResponse.json({ error: 'Erro ao enviar mensagem via Z-API' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('WhatsApp API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
