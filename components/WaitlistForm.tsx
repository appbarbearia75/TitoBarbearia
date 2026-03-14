"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Loader2, Phone, User } from "lucide-react"

interface WaitlistFormProps {
    barbershopId?: string
    date: string
    themeColor: string
    onSuccess?: () => void
}

export function WaitlistForm({ barbershopId, date, themeColor, onSuccess }: WaitlistFormProps) {
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const savedName = localStorage.getItem("user_name")
        const savedPhone = localStorage.getItem("user_phone")
        if (savedName) setName(savedName)
        if (savedPhone) setPhone(savedPhone)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!barbershopId || !name || !phone) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('waitlist')
                .insert([{
                    barbershop_id: barbershopId,
                    customer_name: name,
                    customer_phone: phone,
                    date: date,
                    status: 'pending'
                }])

            if (error) throw error

            localStorage.setItem("user_name", name)
            localStorage.setItem("user_phone", phone)

            const displayDate = date.split('-').reverse().join('/')
            const msgCliente = `*Lista de Espera* 💈\n\nOlá ${name}!\nVocê entrou na lista de espera para o dia *${displayDate}*.\nTe avisaremos assim que surgir uma vaga!`

            // fetch('/api/whatsapp', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ phone: phone, message: msgCliente })
            // }).catch(console.error)

            // WEB PUSH NOTIFICATION
            fetch('/api/web-push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: barbershopId,
                    title: 'Fila de Espera 🕒',
                    body: `${name} (${phone}) entrou na fila para o dia ${displayDate}.`
                })
            }).catch(console.error);

            setSuccess(true)
            setTimeout(() => {
                if (onSuccess) onSuccess()
            }, 2000)
        } catch (error) {
            console.error("Error joining waitlist:", error)
            alert("Erro ao entrar na lista de espera.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 animate-in zoom-in duration-300">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-black" />
                </div>
                <p className="text-white font-bold">Você está na lista!</p>
                <p className="text-green-500/70 text-sm mt-1">Avisaremos se surgir uma vaga.</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-white font-bold mb-4">Entrar na Lista de Espera</h3>
            <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                <Input
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-800 text-white pl-11 h-12 rounded-xl focus:border-white/20 transition-all"
                />
            </div>
            <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                <Input
                    placeholder="Seu WhatsApp"
                    value={phone}
                    onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "")
                        v = v.replace(/^(\d{2})(\d)/g, "($1) $2")
                        v = v.replace(/(\d)(\d{4})$/, "$1-$2")
                        setPhone(v)
                    }}
                    required
                    className="bg-zinc-900 border-zinc-800 text-white pl-11 h-12 rounded-xl focus:border-white/20 transition-all"
                />
            </div>
            <Button
                type="submit"
                disabled={loading || !name || !phone}
                className="w-full h-12 font-bold rounded-xl transition-all active:scale-[0.98]"
                style={{ backgroundColor: themeColor, color: '#000' }}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Garantir meu lugar na fila"}
            </Button>
        </form>
    )
}
