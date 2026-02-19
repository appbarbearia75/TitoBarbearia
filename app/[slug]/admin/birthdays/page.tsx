"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gift, MessageCircle, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface BirthdayClient {
    name: string
    phone: string
    birthday: string // ISO date string
    day: number
    month: number
    age: number
}

const MONTHS = [
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" },
]

export default function BirthdaysPage() {
    const params = useParams()
    const slug = params.slug as string
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<BirthdayClient[]>([])
    const [filterType, setFilterType] = useState<'week' | 'month'>('month')

    useEffect(() => {
        fetchBirthdays()
    }, [slug, filterType])

    const fetchBirthdays = async () => {
        setLoading(true)
        try {
            // 1. Get Barbershop ID
            const { data: barbershop } = await supabase
                .from('barbershops')
                .select('id, name')
                .eq('slug', slug)
                .single()

            if (!barbershop) return

            // 2. Fetch bookings with birthdays
            const { data: bookings } = await supabase
                .from('bookings')
                .select('customer_name, customer_phone, customer_birthday')
                .eq('barbershop_id', barbershop.id)
                .not('customer_birthday', 'is', null)

            if (!bookings) {
                setClients([])
                return
            }

            // 3. Process and Filter
            const uniqueClients = new Map<string, BirthdayClient>()
            const now = new Date()
            const currentYear = now.getFullYear()

            // Calculate week range
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
            startOfWeek.setHours(0, 0, 0, 0)

            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
            endOfWeek.setHours(23, 59, 59, 999)

            bookings.forEach(booking => {
                if (!booking.customer_birthday || !booking.customer_phone) return

                const birthDate = new Date(booking.customer_birthday)
                // normalization for comparison
                const birthdayThisYear = new Date(currentYear, birthDate.getUTCMonth(), birthDate.getUTCDate())

                let matchesFilter = false

                if (filterType === 'month') {
                    matchesFilter = birthDate.getUTCMonth() === now.getMonth()
                } else {
                    // Check if birthday falls within this week
                    // We need to handle year wrapping if needed, but for "This Week" usually implies the occurrence this year
                    if (birthdayThisYear >= startOfWeek && birthdayThisYear <= endOfWeek) {
                        matchesFilter = true
                    }
                }

                if (matchesFilter) {
                    if (!uniqueClients.has(booking.customer_phone)) {
                        const birthYear = birthDate.getUTCFullYear()
                        const age = currentYear - birthYear

                        uniqueClients.set(booking.customer_phone, {
                            name: booking.customer_name,
                            phone: booking.customer_phone,
                            birthday: booking.customer_birthday,
                            day: birthDate.getUTCDate(),
                            month: birthDate.getUTCMonth(),
                            age: age
                        })
                    }
                }
            })

            const sortedClients = Array.from(uniqueClients.values()).sort((a, b) => a.day - b.day)
            setClients(sortedClients)

        } catch (error) {
            console.error("Error fetching birthdays:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSendWhatsapp = (client: BirthdayClient) => {
        // Construct the message
        // Use a generic placeholder link if exact deployment URL isn't known, or window.location.origin
        const shopLink = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `https://barberplatform.com.br/${slug}`

        const message = `Olá ${client.name}! 🎂\n\n🎉 Parabéns pelo seu aniversário! 🎉\n\nPara celebrar essa data especial, preparamos uma oferta exclusiva para você aqui na barbearia.\n\nVenha comemorar conosco e dar aquele trato no visual! ✂️\n\nAgende seu horário aqui: ${shopLink}`

        const encodedMessage = encodeURIComponent(message)
        const phone = client.phone.replace(/\D/g, '') // Remove non-digits

        // Check if phone has country code. Assuming Brazil +55 if length is 10 or 11 (DD+Num)
        let formattedPhone = phone
        if (phone.length <= 11) {
            formattedPhone = `55${phone}`
        }

        window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank')
    }

    return (
        <div className="space-y-8 max-w-6xl pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Gift className="w-8 h-8 text-[#DBC278]" />
                        Aniversariantes
                    </h1>
                    <p className="text-zinc-400 mt-1">Identifique e presenteie seus clientes aniversariantes.</p>
                </div>

                <div className="flex bg-[#1c1c1c] p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setFilterType('week')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'week'
                            ? 'bg-[#DBC278] text-black shadow-lg shadow-[#DBC278]/20'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Esta Semana
                    </button>
                    <button
                        onClick={() => setFilterType('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'month'
                            ? 'bg-[#DBC278] text-black shadow-lg shadow-[#DBC278]/20'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Este Mês
                    </button>
                </div>
            </div>

            <div className="w-full">
                {loading ? (
                    <div className="text-center py-12 text-zinc-500">
                        Carregando aniversariantes...
                    </div>
                ) : clients.length === 0 ? (
                    <Card className="bg-[#1c1c1c]/50 border-white/5 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-zinc-500">
                            <Gift className="w-12 h-12 mb-4 opacity-20" />
                            <p>Nenhum aniversariante encontrado para {filterType === 'week' ? 'esta semana' : 'este mês'}.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.map((client) => (
                            <Card key={client.phone} className="bg-[#1c1c1c]/50 border-white/5 hover:border-[#DBC278]/30 transition-all group overflow-hidden shadow-xl shadow-black/30">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#1c1c1c] flex items-center justify-center text-[#DBC278] font-bold text-lg border border-white/5 shadow-lg shadow-black/50">
                                                {client.day}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white group-hover:text-[#DBC278] transition-colors line-clamp-1">{client.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{client.age} anos</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
                                        onClick={() => handleSendWhatsapp(client)}
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Enviar Oferta
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
