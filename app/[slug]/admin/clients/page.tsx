"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Crown, User, Calendar, Phone } from "lucide-react"
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

    useEffect(() => {
        fetchClients()
    }, [slug])

    const fetchClients = async () => {
        try {
            // 1. Get Barbershop ID
            const { data: barbershop } = await supabase
                .from('barbershops')
                .select('id')
                .eq('slug', slug)
                .single()

            if (!barbershop) return

            // 2. Fetch all bookings
            const { data: bookings } = await supabase
                .from('bookings')
                .select('customer_name, customer_phone, date')
                .eq('barbershop_id', barbershop.id)
                .in('status', ['confirmed', 'completed']) // Assuming we count confirmed/completed
                .order('date', { ascending: false })

            if (!bookings) {
                setClients([])
                return
            }

            // 3. Group by Phone (Unique Identifier assumption)
            const clientMap = new Map<string, ClientData>()

            bookings.forEach(booking => {
                const phone = booking.customer_phone
                if (!phone) return

                if (!clientMap.has(phone)) {
                    clientMap.set(phone, {
                        name: booking.customer_name,
                        phone: phone,
                        totalVisits: 0,
                        lastVisit: booking.date, // First one encountered is most recent due to sort
                        isVip: false
                    })
                }

                const client = clientMap.get(phone)!
                client.totalVisits += 1
            })

            // 4. Calculate VIP logic and Convert to Array
            const clientsArray = Array.from(clientMap.values()).map(client => ({
                ...client,
                isVip: client.totalVisits >= 3 // Simple rule: 3 or more visits = VIP
            }))

            setClients(clientsArray)

        } catch (error) {
            console.error("Error fetching clients:", error)
        } finally {
            setLoading(false)
        }
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
                        className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-yellow-500/50 transition-all rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Total de Clientes</CardDescription>
                        <CardTitle className="text-4xl">{clients.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-zinc-500">Base total de contatos únicos</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Crown className="w-24 h-24 text-yellow-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription>Clientes VIP</CardDescription>
                        <CardTitle className="text-4xl text-yellow-500">
                            {clients.filter(c => c.isVip).length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-zinc-500">Clientes recorrentes (+3 visitas)</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Total Visitas</th>
                                <th className="px-6 py-4">Última Visita</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Carregando clientes...</td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Nenhum cliente encontrado.</td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.phone} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{client.name}</div>
                                                    <div className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                                                        <Phone className="w-3 h-3" />
                                                        {client.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{client.totalVisits}</div>
                                            <div className="text-zinc-600 text-xs">agendamentos</div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-zinc-600" />
                                                {format(new Date(client.lastVisit), "d 'de' MMM, yyyy", { locale: ptBR })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {client.isVip ? (
                                                <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/50 gap-1">
                                                    <Crown className="w-3 h-3" /> VIP
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-zinc-500 border-zinc-700">
                                                    Novo
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                                                Detalhes
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
