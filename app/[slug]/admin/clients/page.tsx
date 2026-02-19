"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Crown, User, Calendar, Phone, Flame, ChevronRight, MessageCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClientData {
    name: string
    phone: string
    totalVisits: number
    lastVisit: string
    isVip: boolean
}

export default function ClientsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<ClientData[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [hotLeads, setHotLeads] = useState<ClientData[]>([])
    const [showHotModal, setShowHotModal] = useState(false)
    const [vipPlan, setVipPlan] = useState({ title: 'VIP', price: '0,00' })

    useEffect(() => {
        fetchClients()
    }, [slug])

    const fetchClients = async () => {
        try {
            // 1. Get Barbershop ID & Settings
            const { data: barbershop } = await supabase
                .from('barbershops')
                .select('id, vip_plan_title, vip_plan_price')
                .eq('slug', slug)
                .single()

            if (!barbershop) return
            setVipPlan({
                title: barbershop.vip_plan_title || 'VIP',
                price: barbershop.vip_plan_price || '0,00'
            })

            // 2. Fetch all bookings
            const { data: bookings } = await supabase
                .from('bookings')
                .select('customer_name, customer_phone, date')
                .eq('barbershop_id', barbershop.id)
                .in('status', ['confirmed', 'completed'])
                .order('date', { ascending: false })

            if (!bookings) {
                setClients([])
                return
            }

            // 3. Fetch VIP Status from Clients Table
            const { data: vipClients } = await supabase
                .from('clients')
                .select('phone, is_vip')
                .eq('barbershop_id', barbershop.id)

            const vipMap = new Map<string, boolean>()
            vipClients?.forEach(c => vipMap.set(c.phone, c.is_vip))

            // 4. Process Data
            const clientMap = new Map<string, ClientData>()
            const currentMonth = new Date().getMonth()
            const currentYear = new Date().getFullYear()

            bookings.forEach(booking => {
                const phone = booking.customer_phone
                if (!phone) return

                if (!clientMap.has(phone)) {
                    clientMap.set(phone, {
                        name: booking.customer_name,
                        phone: phone,
                        totalVisits: 0,
                        lastVisit: booking.date,
                        isVip: vipMap.get(phone) || false // Use DB value
                    })
                }

                const client = clientMap.get(phone)!
                client.totalVisits += 1
            })

            const clientsArray = Array.from(clientMap.values())
            setClients(clientsArray)

            // 5. Calculate HOT Leads (2+ visits this month AND NOT VIP)
            const hot = clientsArray.filter(client => {
                if (client.isVip) return false // Already VIP

                const monthlyVisits = bookings.filter(b =>
                    b.customer_phone === client.phone &&
                    new Date(b.date).getMonth() === currentMonth &&
                    new Date(b.date).getFullYear() === currentYear
                ).length

                return monthlyVisits >= 2
            })
            setHotLeads(hot)

        } catch (error) {
            console.error("Error fetching clients:", error)
        } finally {
            setLoading(false)
        }
    }

    const toggleVip = async (client: ClientData) => {
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            const newStatus = !client.isVip

            // Upsert client
            const { error } = await supabase
                .from('clients')
                .upsert({
                    barbershop_id: barbershop.id,
                    phone: client.phone,
                    name: client.name,
                    is_vip: newStatus
                }, { onConflict: 'barbershop_id, phone' })

            if (error) throw error

            // Update local state
            setClients(prev => prev.map(c => c.phone === client.phone ? { ...c, isVip: newStatus } : c))

            // Refetch to update HOT leads properly
            if (newStatus) {
                setHotLeads(prev => prev.filter(h => h.phone !== client.phone))
            } else {
                fetchClients() // Easier to refetch to re-evaluate HOT logic
            }

        } catch (error) {
            console.error("Error toggling VIP:", error)
        }
    }

    const handleSendWhatsapp = (client: ClientData) => {
        const message = `Olá ${client.name.split(' ')[0]}! Tudo bem? 💈\n\nVi que você tem frequentado bastante a barbearia esse mês! 🔥\n\nQue tal fechar o nosso plano *${vipPlan.title}*?\n\nPor apenas *${vipPlan.price}* mensais, você garante benefícios exclusivos e economiza nos cortes.\n\nBora fechar? 👊`

        const phone = client.phone.replace(/\D/g, '')
        const formattedPhone = phone.length <= 11 ? `55${phone}` : phone
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank')
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    )

    return (
        <div className="space-y-8 max-w-6xl pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Meus Clientes</h1>
                    <p className="text-zinc-400 mt-1">Gerencie sua base de clientes e identifique os VIPs.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar por nome ou telefone..."
                        className="pl-9 bg-[#1c1c1c]/50 border-white/5 focus:border-[#DBC278]/50 transition-all rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-[#1c1c1c]/50 border-white/5 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Total de Clientes</CardDescription>
                        <CardTitle className="text-4xl text-white"> {clients.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-zinc-500">Base total de contatos únicos</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#1c1c1c]/50 border-white/5 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Crown className="w-24 h-24 text-[#DBC278]" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription>Clientes VIP</CardDescription>
                        <CardTitle className="text-4xl text-[#DBC278]">
                            {clients.filter(c => c.isVip).length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-zinc-500">Assinantes do plano fidelidade</div>
                    </CardContent>
                </Card>

                {/* Hot Leads Card */}
                <Card
                    className="bg-gradient-to-br from-orange-500/10 to-[#1c1c1c] border-orange-500/20 cursor-pointer hover:border-orange-500/40 transition-all group relative overflow-hidden"
                    onClick={() => setShowHotModal(true)}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Flame className="w-24 h-24 text-orange-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-orange-200">Clientes "Quentes" 🔥</CardDescription>
                        <CardTitle className="text-4xl text-orange-500">
                            {hotLeads.length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-orange-300/70">Potenciais VIPs (Alta frequência)</div>
                        <Button variant="ghost" className="mt-2 p-0 h-auto text-orange-400 hover:text-orange-300 text-xs flex items-center gap-1">
                            Ver lista <ChevronRight className="w-3 h-3" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#1c1c1c] border-white/5 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Total Visitas</th>
                                <th className="px-6 py-4">Última Visita</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Carregando clientes...</td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Nenhum cliente encontrado.</td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.phone} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 relative">
                                                    <User className="w-5 h-5" />
                                                    {client.isVip && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#DBC278] rounded-full flex items-center justify-center border-2 border-[#09090b]">
                                                            <Crown className="w-2 h-2 text-black fill-black" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white flex items-center gap-2">
                                                        {client.name}
                                                        {client.isVip && <span className="text-[10px] bg-[#DBC278]/10 text-[#DBC278] border border-[#DBC278]/20 px-1.5 py-0.5 rounded font-bold uppercase">VIP</span>}
                                                    </div>
                                                    <div className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                                                        <Phone className="w-3 h-3" />
                                                        {client.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white text-lg">{client.totalVisits}</div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-zinc-600" />
                                                {format(new Date(client.lastVisit), "d 'de' MMM, yyyy", { locale: ptBR })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleVip(client)}
                                                className={`border-white/10 ${client.isVip ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-[#DBC278] hover:text-[#c9b06b] hover:bg-[#DBC278]/10'}`}
                                            >
                                                {client.isVip ? 'Remover VIP' : 'Tornar VIP'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Hot Leads Modal */}
            {showHotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#1c1c1c] border border-orange-500/30 rounded-xl w-full max-w-lg shadow-2xl shadow-orange-900/20 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-lg">
                                    <Flame className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Clientes Quentes 🔥</h2>
                                    <p className="text-xs text-orange-400">Alta frequência este mês ({hotLeads.length})</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowHotModal(false)} className="text-zinc-500 hover:text-white">
                                <span className="sr-only">Fechar</span>
                                &times;
                            </Button>
                        </div>
                        <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
                            {hotLeads.length === 0 ? (
                                <div className="text-center py-12 text-zinc-500">
                                    <Flame className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Nenhum cliente com alta frequência encontrado este mês.</p>
                                </div>
                            ) : (
                                hotLeads.map(client => (
                                    <div key={client.phone} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{client.name}</div>
                                                <div className="text-xs text-zinc-500">{client.phone}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-500 text-white gap-2 font-medium"
                                                onClick={() => handleSendWhatsapp(client)}
                                            >
                                                <span className="hidden sm:inline">Oferecer VIP</span>
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-white/5 bg-black/20 text-xs text-zinc-500 text-center rounded-b-xl">
                            Esses clientes vieram 2 ou mais vezes este mês e não são VIPs.
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
