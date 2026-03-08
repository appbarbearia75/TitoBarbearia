"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Crown, User, Calendar, Phone, Flame, ChevronRight, MessageCircle, Clock, Trash2, Check, Plus, AlertCircle, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TimeSlotSelector } from "@/components/TimeSlotSelector"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Actually, looking at package.json, no sonner. I'll stick to simple UI feedback.

interface ClientData {
    name: string
    phone: string
    totalVisits: number
    lastVisit: string
    isVip: boolean
    vipSince?: string
    birthday?: string
}

const formatPhone = (value: string) => {
    if (!value) return ''
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
}

export default function ClientsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<ClientData[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [hotLeads, setHotLeads] = useState<ClientData[]>([])
    const [showHotModal, setShowHotModal] = useState(false)
    // ... New state for Recurring Bookings
    const [openingHours, setOpeningHours] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'clients' | 'recurring'>('clients')
    const [recurringBookings, setRecurringBookings] = useState<any[]>([])
    const [recurringLoading, setRecurringLoading] = useState(false)
    const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)

    // Edit Client State
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<{ originalPhone: string, name: string, phone: string } | null>(null)
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    // Add Client State
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
    const [addingClient, setAddingClient] = useState({ name: '', phone: '', birthday: '' })
    const [isSavingNewClient, setIsSavingNewClient] = useState(false)

    // Form state
    const [newRecurring, setNewRecurring] = useState({
        name: '',
        phone: '',
        day: '',
        time: '',
        times: [] as string[]
    })

    const daysOfWeek = [
        { value: '0', label: 'Domingo' },
        { value: '1', label: 'Segunda-feira' },
        { value: '2', label: 'Terça-feira' },
        { value: '3', label: 'Quarta-feira' },
        { value: '4', label: 'Quinta-feira' },
        { value: '5', label: 'Sexta-feira' },
        { value: '6', label: 'Sábado' },
    ]

    const [vipPlan, setVipPlan] = useState({ title: 'VIP', price: '0,00' })

    useEffect(() => {
        fetchClients()
    }, [slug])

    const fetchClients = async () => {
        try {
            // 1. Get Barbershop ID & Settings
            const { data: barbershop } = await supabase
                .from('barbershops')
                .select('id, vip_plan_title, vip_plan_price, opening_hours')
                .eq('slug', slug)
                .single()

            if (!barbershop) return
            setVipPlan({
                title: barbershop.vip_plan_title || 'VIP',
                price: barbershop.vip_plan_price || '0,00'
            })
            setOpeningHours(barbershop.opening_hours)

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
            const { data: dbClients } = await supabase
                .from('clients')
                .select('id, phone, name, is_vip, vip_since, birthday')
                .eq('barbershop_id', barbershop.id)

            const dbClientMap = new Map<string, { isVip: boolean, vipSince?: string, name?: string, birthday?: string }>()
            dbClients?.forEach(c => {
                if (c.phone) {
                    dbClientMap.set(c.phone, { isVip: c.is_vip, vipSince: c.vip_since, name: c.name, birthday: c.birthday })
                }
            })

            // 4. Process Data
            const clientMap = new Map<string, ClientData>()
            const currentMonth = new Date().getMonth()
            const currentYear = new Date().getFullYear()

            bookings.forEach(booking => {
                const phone = booking.customer_phone
                if (!phone) return

                if (!clientMap.has(phone)) {
                    const clientInfo = dbClientMap.get(phone)
                    clientMap.set(phone, {
                        name: clientInfo?.name || booking.customer_name,
                        phone: phone,
                        totalVisits: 0,
                        lastVisit: booking.date,
                        isVip: clientInfo?.isVip || false,
                        vipSince: clientInfo?.vipSince,
                        birthday: clientInfo?.birthday
                    })
                }

                const client = clientMap.get(phone)!
                client.totalVisits += 1
            })

            // Also add clients from the database that have no bookings yet
            dbClients?.forEach(dbClient => {
                const phone = dbClient.phone || `no-phone-${dbClient.id || Math.random()}`
                if (!clientMap.has(phone)) {
                    clientMap.set(phone, {
                        name: dbClient.name || 'Sem Nome',
                        phone: dbClient.phone || '',
                        totalVisits: 0,
                        lastVisit: '', // No visit yet
                        isVip: dbClient.is_vip || false,
                        vipSince: dbClient.vip_since,
                        birthday: dbClient.birthday
                    })
                }
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
            const todayString = new Date().toISOString().split('T')[0]
            const vipSinceUpdate = newStatus ? todayString : null

            // Upsert client
            const { error } = await supabase
                .from('clients')
                .upsert({
                    barbershop_id: barbershop.id,
                    phone: client.phone,
                    name: client.name,
                    is_vip: newStatus,
                    vip_since: vipSinceUpdate
                }, { onConflict: 'barbershop_id, phone' })

            if (error) throw error

            // Update local state
            setClients(prev => prev.map(c => c.phone === client.phone ? { ...c, isVip: newStatus, vipSince: vipSinceUpdate || undefined } : c))

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

    const handleSaveClientEdit = async () => {
        if (!editingClient || !editingClient.name || !editingClient.phone) return
        setIsSavingEdit(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            // Atualiza na tabela clients
            await supabase.from('clients')
                .update({ name: editingClient.name, phone: editingClient.phone })
                .eq('barbershop_id', barbershop.id)
                .eq('phone', editingClient.originalPhone)

            // Atualiza na tabela agendamentos
            await supabase.from('bookings')
                .update({ customer_name: editingClient.name, customer_phone: editingClient.phone })
                .eq('barbershop_id', barbershop.id)
                .eq('customer_phone', editingClient.originalPhone)

            // Atualiza na tabela horários fixos
            await supabase.from('recurring_bookings')
                .update({ client_name: editingClient.name, client_phone: editingClient.phone })
                .eq('barbershop_id', barbershop.id)
                .eq('client_phone', editingClient.originalPhone)

            if (selectedClient && selectedClient.phone === editingClient.originalPhone) {
                setSelectedClient(prev => prev ? { ...prev, name: editingClient!.name, phone: editingClient!.phone } : null)
            }

            setIsEditClientModalOpen(false)
            setEditingClient(null)

            // Recarrega lista
            fetchClients()

        } catch (error) {
            console.error("Error updating client:", error)
            alert("Erro ao salvar alterações do cliente.")
        } finally {
            setIsSavingEdit(false)
        }
    }

    const handleSaveNewClient = async () => {
        if (!addingClient.name) {
            alert("O nome do cliente é obrigatório.")
            return
        }
        setIsSavingNewClient(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            // If a dummy phone is used or no phone, we handle it as empty. 
            // In the DB phone might be used as unique with barbershop_id in some logic, but let's insert it as empty string if not provided.
            const newPhone = addingClient.phone || ''

            const { error } = await supabase.from('clients').insert({
                barbershop_id: barbershop.id,
                name: addingClient.name,
                phone: newPhone,
                birthday: addingClient.birthday || null,
                is_vip: false
            })

            if (error) {
                if (error.code === '23505') { // unique violation
                    alert("Já existe um cliente com este telefone.")
                } else {
                    throw error
                }
                return
            }

            setIsAddClientModalOpen(false)
            setAddingClient({ name: '', phone: '', birthday: '' })
            fetchClients()
        } catch (error) {
            console.error("Error creating new client:", error)
            alert("Erro ao cadastrar novo cliente.")
        } finally {
            setIsSavingNewClient(false)
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    )

    useEffect(() => {
        if (activeTab === 'recurring') {
            fetchRecurringBookings()
        }
    }, [activeTab, slug])

    const fetchRecurringBookings = async () => {
        setRecurringLoading(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            const { data } = await supabase
                .from('recurring_bookings')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true })

            setRecurringBookings(data || [])
        } catch (error) {
            console.error("Error fetching recurring:", error)
        } finally {
            setRecurringLoading(false)
        }
    }

    const handleAddRecurring = async () => {
        if (!newRecurring.name || !newRecurring.phone || !newRecurring.day || newRecurring.times.length === 0) return

        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            const inserts = newRecurring.times.map(t => ({
                barbershop_id: barbershop.id,
                client_name: newRecurring.name,
                client_phone: newRecurring.phone,
                day_of_week: parseInt(newRecurring.day),
                start_time: t
            }))

            const { error } = await supabase.from('recurring_bookings').insert(inserts)

            if (error) throw error

            setIsAddRecurringOpen(false)
            setNewRecurring({ name: '', phone: '', day: '', time: '', times: [] })
            fetchRecurringBookings()

        } catch (error) {
            console.error("Error creating recurring booking:", error)
            alert("Erro ao criar horário fixo.")
        }
    }

    const handleDeleteRecurring = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este horário fixo?")) return

        try {
            const { error } = await supabase.from('recurring_bookings').delete().eq('id', id)
            if (error) throw error
            fetchRecurringBookings()
        } catch (error) {
            console.error("Error deleting recurring:", error)
        }
    }

    // Helper to auto-fill phone when selecting an existing client name
    const handleNameChange = (val: string) => {
        // Check if val matches an existing client
        setNewRecurring(prev => ({ ...prev, name: val }))
        const existing = clients.find(c => c.name === val)
        if (existing) {
            setNewRecurring(prev => ({ ...prev, phone: existing.phone, name: existing.name }))
        }
    }

    const timeSlots = useMemo(() => {
        if (!openingHours || !newRecurring.day) return []
        const dayKey = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][parseInt(newRecurring.day)]
        const config = openingHours[dayKey]
        if (!config || !config.open) return []

        const slots: string[] = []
        const [startHour, startMinute] = (config.start || "09:00").split(':').map(Number)
        const [endHour, endMinute] = (config.end || "18:00").split(':').map(Number)

        let currentTime = new Date()
        currentTime.setHours(startHour, startMinute, 0, 0)

        const endTime = new Date()
        endTime.setHours(endHour, endMinute, 0, 0)

        let lunchStart: Date | null = null
        let lunchEnd: Date | null = null

        if (config.lunchStart && config.lunchEnd) {
            const [lsHour, lsMinute] = config.lunchStart.split(':').map(Number)
            const [leHour, leMinute] = config.lunchEnd.split(':').map(Number)
            lunchStart = new Date()
            lunchStart.setHours(lsHour, lsMinute, 0, 0)
            lunchEnd = new Date()
            lunchEnd.setHours(leHour, leMinute, 0, 0)
        }

        while (currentTime < endTime) {
            if (lunchStart && lunchEnd) {
                if (currentTime >= lunchStart && currentTime < lunchEnd) {
                    currentTime.setMinutes(currentTime.getMinutes() + 15)
                    continue
                }
            }
            const h = String(currentTime.getHours()).padStart(2, '0')
            const m = String(currentTime.getMinutes()).padStart(2, '0')
            slots.push(`${h}:${m}`)
            currentTime.setMinutes(currentTime.getMinutes() + 15)
        }
        return slots
    }, [openingHours, newRecurring.day])

    return (
        <div className="space-y-8 max-w-6xl pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Gestão de Clientes</h1>
                    <p className="text-zinc-400 mt-1">Gerencie sua base e horários fixos.</p>
                </div>

                {/* Tabs Switcher */}
                <div className="flex bg-[#1c1c1c] p-1 rounded-lg border border-white/5">
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'clients'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                            }`}
                    >
                        Base de Clientes
                    </button>
                    <button
                        onClick={() => setActiveTab('recurring')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'recurring'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                            }`}
                    >
                        Horários Fixos
                    </button>
                </div>
            </div>

            {activeTab === 'clients' ? (
                <>
                    {/* Search Bar & Actions for Clients */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-end ml-auto">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Buscar por nome ou telefone..."
                                className="pl-9 bg-[#1c1c1c]/50 border-white/5 focus:border-[#DBC278]/50 transition-all rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full md:w-auto bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold"
                            onClick={() => setIsAddClientModalOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Cadastrar Cliente
                        </Button>
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
                                        <th className="hidden md:table-cell px-6 py-4">Total Visitas</th>
                                        <th className="hidden md:table-cell px-6 py-4">Última Visita</th>
                                        <th className="hidden md:table-cell px-6 py-4 text-right">Ações</th>
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
                                            <tr
                                                key={client.phone}
                                                className="hover:bg-zinc-800/50 transition-colors cursor-pointer md:cursor-default"
                                                onClick={() => {
                                                    if (window.innerWidth < 768) {
                                                        setSelectedClient(client)
                                                    }
                                                }}
                                            >
                                                <td className="px-6 py-4 md:py-4 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 relative">
                                                            <User className="w-5 h-5" />
                                                            {client.isVip && (
                                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#DBC278] rounded-full flex items-center justify-center border-2 border-[#09090b]">
                                                                    <Crown className="w-2 h-2 text-black fill-black" />
                                                                </div>
                                                            )}
                                                            {/* Pulse dot for renewal notification */}
                                                            {client.isVip && client.vipSince && new Date(client.vipSince).getDate() === new Date().getDate() && (
                                                                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white flex items-center gap-2">
                                                                {client.name}
                                                                {client.isVip && <span className="text-[10px] bg-[#DBC278]/10 text-[#DBC278] border border-[#DBC278]/20 px-1.5 py-0.5 rounded font-bold uppercase">VIP</span>}
                                                            </div>
                                                            <div className="text-zinc-500 text-[10px] flex flex-col gap-0.5 mt-0.5">
                                                                <div className="flex items-center gap-1">
                                                                    <Phone className="w-3 h-3" />
                                                                    {client.phone}
                                                                </div>
                                                                {client.isVip && client.vipSince && (
                                                                    <div className="flex items-center gap-1 text-[#DBC278]/60">
                                                                        <Calendar className="w-3 h-3" />
                                                                        VIP desde {format(new Date(client.vipSince), "dd/MM/yy")}
                                                                    </div>
                                                                )}
                                                                <div className="md:hidden mt-2 text-[9px] text-[#DBC278]/80 font-bold uppercase tracking-wider flex items-center">
                                                                    Clique para expandir
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4">
                                                    <div className="font-bold text-white text-lg">{client.totalVisits}</div>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4 text-zinc-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-zinc-600" />
                                                        {client.lastVisit ? format(new Date(client.lastVisit), "d 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setNewRecurring({
                                                                    name: client.name,
                                                                    phone: client.phone,
                                                                    day: '',
                                                                    time: '',
                                                                    times: []
                                                                })
                                                                setActiveTab('recurring')
                                                                setIsAddRecurringOpen(true)
                                                            }}
                                                            className="border-white/10 text-[#DBC278] hover:text-[#c9b06b] hover:bg-[#DBC278]/10"
                                                        >
                                                            <Clock className="w-4 h-4 mr-2" />
                                                            Travar Horário
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setEditingClient({
                                                                    originalPhone: client.phone,
                                                                    name: client.name,
                                                                    phone: client.phone
                                                                })
                                                                setIsEditClientModalOpen(true)
                                                            }}
                                                            className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                                                        >
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                toggleVip(client)
                                                            }}
                                                            className={`border-white/10 ${client.isVip ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-[#DBC278] hover:text-[#c9b06b] hover:bg-[#DBC278]/10'}`}
                                                        >
                                                            {client.isVip ? 'Remover VIP' : 'Tornar VIP'}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile Client Details Modal */}
                    <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
                        {selectedClient && (
                            <DialogContent className="bg-[#09090b] border-[#DBC278]/20 text-white shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[400px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl flex items-center gap-2">
                                        {selectedClient.name}
                                        {selectedClient.isVip && <span className="text-[10px] bg-[#DBC278]/10 text-[#DBC278] border border-[#DBC278]/20 px-1.5 py-0.5 rounded font-bold uppercase">VIP</span>}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <Phone className="w-5 h-5" />
                                        <span className="text-lg">{selectedClient.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <Calendar className="w-5 h-5 text-[#DBC278]" />
                                        <div>
                                            <span className="block text-xs uppercase font-bold text-zinc-500">Última Visita</span>
                                            <span className="text-white">{selectedClient.lastVisit ? format(new Date(selectedClient.lastVisit), "d 'de' MMM, yyyy", { locale: ptBR }) : '-'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <User className="w-5 h-5 text-[#DBC278]" />
                                        <div>
                                            <span className="block text-xs uppercase font-bold text-zinc-500">Total de Visitas</span>
                                            <span className="font-bold text-2xl text-white">{selectedClient.totalVisits}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setNewRecurring({
                                                    name: selectedClient.name,
                                                    phone: selectedClient.phone,
                                                    day: '',
                                                    time: '',
                                                    times: []
                                                })
                                                setSelectedClient(null)
                                                setActiveTab('recurring')
                                                setIsAddRecurringOpen(true)
                                            }}
                                            className="w-full h-12 border-white/10 text-[#DBC278] hover:text-[#c9b06b] hover:bg-[#DBC278]/10"
                                        >
                                            <Clock className="w-5 h-5 mr-3" />
                                            Travar Horário
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setEditingClient({
                                                    originalPhone: selectedClient.phone,
                                                    name: selectedClient.name,
                                                    phone: selectedClient.phone
                                                })
                                                setIsEditClientModalOpen(true)
                                            }}
                                            className="w-full h-12 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                                        >
                                            <Pencil className="w-5 h-5 mr-3" />
                                            Editar Contato
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                toggleVip(selectedClient)
                                                setSelectedClient(null)
                                            }}
                                            className={`w-full h-12 border-white/10 ${selectedClient.isVip ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-[#DBC278] hover:text-[#c9b06b] hover:bg-[#DBC278]/10'}`}
                                        >
                                            <Crown className="w-5 h-5 mr-3" />
                                            {selectedClient.isVip ? 'Remover VIP' : 'Tornar VIP'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        )}
                    </Dialog>

                    {/* Edit Client Modal */}
                    <Dialog open={isEditClientModalOpen} onOpenChange={setIsEditClientModalOpen}>
                        <DialogContent className="bg-[#1c1c1c] border-white/10 text-white sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Editar Cliente</DialogTitle>
                                <DialogDescription>Modifique o nome ou telefone do cliente.</DialogDescription>
                            </DialogHeader>
                            {editingClient && (
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Nome</Label>
                                        <Input
                                            value={editingClient.name}
                                            onChange={e => setEditingClient(prev => prev ? { ...prev, name: e.target.value } : null)}
                                            className="bg-zinc-800 border-zinc-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefone</Label>
                                        <Input
                                            value={editingClient.phone}
                                            onChange={e => setEditingClient(prev => prev ? { ...prev, phone: formatPhone(e.target.value) } : null)}
                                            className="bg-zinc-800 border-zinc-700"
                                        />
                                        <p className="text-xs text-zinc-500">
                                            Atenção: Ao alterar o telefone, todos os agendamentos anteriores e futuros deste cliente serão atualizados para o novo número.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsEditClientModalOpen(false)}>Cancelar</Button>
                                <Button
                                    className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold disabled:opacity-50"
                                    onClick={handleSaveClientEdit}
                                    disabled={!editingClient?.name || !editingClient?.phone || isSavingEdit}
                                >
                                    {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Client Modal */}
                    <Dialog open={isAddClientModalOpen} onOpenChange={setIsAddClientModalOpen}>
                        <DialogContent className="bg-[#1c1c1c] border-white/10 text-white sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Cadastrar Cliente</DialogTitle>
                                <DialogDescription>Adicione um novo cliente à sua base.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome (Obrigatório)</Label>
                                    <Input
                                        placeholder="Ex: João Silva"
                                        value={addingClient.name}
                                        onChange={e => setAddingClient(prev => ({ ...prev, name: e.target.value }))}
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefone / WhatsApp (Opcional)</Label>
                                    <Input
                                        placeholder="(00) 00000-0000"
                                        value={addingClient.phone}
                                        onChange={e => setAddingClient(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Aniversário (Opcional)</Label>
                                    <Input
                                        type="date"
                                        value={addingClient.birthday}
                                        onChange={e => setAddingClient(prev => ({ ...prev, birthday: e.target.value }))}
                                        className="bg-zinc-800 border-zinc-700 block w-full text-white color-scheme-dark"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsAddClientModalOpen(false)}>Cancelar</Button>
                                <Button
                                    className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold disabled:opacity-50"
                                    onClick={handleSaveNewClient}
                                    disabled={!addingClient.name || isSavingNewClient}
                                >
                                    {isSavingNewClient ? 'Salvando...' : 'Cadastrar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </>
            ) : (
                /* RECURRING BOOKINGS TAB */
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-[#1c1c1c]/50 p-6 rounded-xl border border-white/5">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#DBC278]" />
                                Horários Fixos
                            </h2>
                            <p className="text-zinc-400 text-sm mt-1">Oculte horários automaticamente para clientes recorrentes.</p>
                        </div>
                        <Dialog open={isAddRecurringOpen} onOpenChange={setIsAddRecurringOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold"
                                    onClick={() => setNewRecurring({ name: '', phone: '', day: '', time: '', times: [] })}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Novo Horário Fixo
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1c1c1c] border-white/10 text-white max-w-2xl max-h-[90vh] flex flex-col">
                                <DialogHeader className="flex-shrink-0">
                                    <DialogTitle>Adicionar Horário Fixo</DialogTitle>
                                    <DialogDescription>Este horário ficará indisponível para outros clientes.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
                                    {/* Name Input/Select */}
                                    <div className="space-y-2">
                                        <Label>Nome do Cliente</Label>
                                        <div className="relative">
                                            <Input
                                                placeholder="Digite o nome..."
                                                value={newRecurring.name}
                                                onChange={e => handleNameChange(e.target.value)}
                                                className="bg-zinc-800 border-zinc-700"
                                                list="clients-list"
                                            />
                                            {/* Data list for autocomplete suggestion */}
                                            <datalist id="clients-list">
                                                {clients.map(c => (
                                                    <option key={c.phone} value={c.name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Telefone</Label>
                                        <Input
                                            placeholder="(00) 00000-0000"
                                            value={newRecurring.phone}
                                            onChange={e => setNewRecurring(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                                            className="bg-zinc-800 border-zinc-700"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Dia da Semana</Label>
                                            <Select
                                                value={newRecurring.day}
                                                onValueChange={val => setNewRecurring(prev => ({ ...prev, day: val }))}
                                            >
                                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                                    {daysOfWeek.map(day => (
                                                        <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 col-span-2 mt-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Selecionar Horário(s)</Label>
                                                <span className="text-xs text-[#DBC278] bg-[#DBC278]/10 px-2 py-1 rounded font-medium">Você pode selecionar mais de um!</span>
                                            </div>
                                            {!newRecurring.day ? (
                                                <div className="w-full h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-medium text-sm">
                                                    Selecione o dia da semana...
                                                </div>
                                            ) : timeSlots.length > 0 ? (
                                                <div className="bg-[#09090b] rounded-xl p-4 border border-zinc-800">
                                                    <TimeSlotSelector
                                                        slots={timeSlots}
                                                        selectedSlots={newRecurring.times}
                                                        onSelect={time => {
                                                            setNewRecurring(prev => {
                                                                const isSelected = prev.times.includes(time)
                                                                return {
                                                                    ...prev,
                                                                    times: isSelected ? prev.times.filter(t => t !== time) : [...prev.times, time]
                                                                }
                                                            })
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-medium text-sm">
                                                    Barbearia fechada neste dia.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="flex-shrink-0 mt-4">
                                    <Button variant="ghost" onClick={() => setIsAddRecurringOpen(false)}>Cancelar</Button>
                                    <Button
                                        className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold"
                                        onClick={handleAddRecurring}
                                        disabled={!newRecurring.name || !newRecurring.day || newRecurring.times.length === 0}
                                    >
                                        Adicionar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Recurring List */}
                    {recurringLoading ? (
                        <div className="text-center py-12 text-zinc-500">Carregando...</div>
                    ) : recurringBookings.length === 0 ? (
                        <Card className="bg-[#1c1c1c]/30 border-dashed border-white/10 p-12 flex flex-col items-center text-center">
                            <Clock className="w-12 h-12 text-zinc-700 mb-4" />
                            <h3 className="text-lg font-medium text-zinc-400">Nenhum horário fixo</h3>
                            <p className="text-zinc-500 text-sm max-w-xs mt-2">Adicione clientes que possuem horário marcado toda semana para bloquear a agenda automaticamente.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {daysOfWeek.map(dayObj => {
                                const dayBookings = recurringBookings.filter(b => b.day_of_week === parseInt(dayObj.value))
                                if (dayBookings.length === 0) return null

                                return (
                                    <div key={dayObj.value} className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#DBC278] uppercase tracking-wider pl-2">
                                            <span className="w-2 h-2 rounded-full bg-[#DBC278]" />
                                            {dayObj.label}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {dayBookings.map(booking => (
                                                <div key={booking.id} className="bg-[#1c1c1c] border border-white/5 rounded-lg p-3 flex items-center justify-between group hover:border-white/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono text-white">
                                                            {booking.start_time}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white text-sm">{booking.client_name}</div>
                                                            <div className="text-xs text-zinc-500">{booking.client_phone}</div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDeleteRecurring(booking.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Hot Leads Modal (Existing) */}
            {showHotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    {/* ... (Existing modal content) ... */}
                    <div className="bg-[#1c1c1c] border border-orange-500/30 rounded-xl w-full max-w-lg shadow-2xl shadow-orange-900/20">
                        {/* Keeping existing modal content logic but wrapped properly to avoid syntax errors if I touch it. 
                            Actually, I'll just reuse the existing code block for the modal 
                         */}
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
