"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, DollarSign, TrendingUp, Scissors, Copy, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale" // Added for date formatting in modals
import { Button } from "@/components/ui/button"

import { OnboardingModal } from "@/components/onboarding/onboarding-modal"
import { AgendaBoard } from "@/components/admin/AgendaBoard"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function TenantDashboard() {
    const params = useParams()
    const slug = params.slug as string

    // States for data
    const [stats, setStats] = useState({
        todayBookings: 0,
        monthlyClients: 0,
        activeVips: 0,
        todayRevenue: 0,
    })

    // Detailed lists for modals
    const [details, setDetails] = useState<{
        revenueBookings: any[],
        monthlyClientsList: any[],
        vipsList: any[]
    }>({
        revenueBookings: [],
        monthlyClientsList: [],
        vipsList: []
    })

    const [onboardingOpen, setOnboardingOpen] = useState(false)
    const [barbershopId, setBarbershopId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Modal states
    const [activeModal, setActiveModal] = useState<'revenue' | 'monthly' | 'vips' | null>(null)

    useEffect(() => {
        fetchStats()
    }, [slug])

    const fetchStats = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id, phone, address').eq('slug', slug).single()

        if (barbershop) {
            setBarbershopId(barbershop.id)

            // Check for existing services to determine if it's a new account
            const { count: serviceCount } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('barbershop_id', barbershop.id)

            // Show onboarding only if missing info AND no services (new account)
            if ((!barbershop.phone || !barbershop.address) && (serviceCount === 0 || serviceCount === null)) {
                setOnboardingOpen(true)
            }

            const today = format(new Date(), 'yyyy-MM-dd')
            const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
            const lastDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')

            // 1. Today's Bookings (Count only)
            const { count: todayBookings } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('barbershop_id', barbershop.id)
                .eq('date', today)
                .neq('status', 'cancelled')

            // 2. Monthly Clients (Detailed List)
            const { data: monthlyBookings } = await supabase
                .from('bookings')
                .select('customer_name, customer_phone, date')
                .eq('barbershop_id', barbershop.id)
                .gte('date', firstDayOfMonth)
                .lte('date', lastDayOfMonth)
                .in('status', ['confirmed', 'completed'])
                .order('date', { ascending: false })

            // Map to unique clients
            const uniqueMonthlyMap = new Map()
            monthlyBookings?.forEach(b => {
                if (!uniqueMonthlyMap.has(b.customer_phone)) {
                    uniqueMonthlyMap.set(b.customer_phone, b)
                }
            })
            const monthlyClientsList = Array.from(uniqueMonthlyMap.values())

            // 3. Active VIPs (Detailed List)
            const { data: allBookings } = await supabase
                .from('bookings')
                .select('customer_name, customer_phone, date')
                .eq('barbershop_id', barbershop.id)
                .in('status', ['confirmed', 'completed'])

            const clientStats: Record<string, { name: string, phone: string, count: number, lastVisit: string }> = {}
            allBookings?.forEach(b => {
                const phone = b.customer_phone
                if (!clientStats[phone]) {
                    clientStats[phone] = { name: b.customer_name, phone, count: 0, lastVisit: b.date }
                }
                clientStats[phone].count++
                if (new Date(b.date) > new Date(clientStats[phone].lastVisit)) {
                    clientStats[phone].lastVisit = b.date
                }
            })
            const vipsList = Object.values(clientStats).filter(c => c.count >= 3).sort((a, b) => b.count - a.count)

            // 4. Today's Revenue (Detailed List)
            const { data: revenueBookings } = await supabase
                .from('bookings')
                .select(`
                    id,
                    customer_name,
                    time,
                    services (title, price)
                `)
                .eq('barbershop_id', barbershop.id)
                .eq('date', today)
                .eq('status', 'completed')

            const todayRevenue = revenueBookings?.reduce((acc, booking) => {
                const price = (booking.services as any)?.price || 0
                return acc + Number(price)
            }, 0) || 0

            setStats({
                todayBookings: todayBookings || 0,
                monthlyClients: monthlyClientsList.length,
                activeVips: vipsList.length,
                todayRevenue: todayRevenue
            })

            setDetails({
                revenueBookings: revenueBookings || [],
                monthlyClientsList,
                vipsList
            })
        }
    }

    const handleCopyLink = () => {
        const url = `${window.location.origin}/${slug}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Visão Geral</h1>
                <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="w-full sm:w-auto gap-2 bg-[#1c1c1c]/50 border-white/5 hover:bg-zinc-800 text-white hover:text-white backdrop-blur-sm transition-all"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Link Copiado!" : "Copiar Link da Agenda"}
                </Button>
            </div>

            {/* 1. Agenda Board (Moved to top) */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AgendaBoard onUpdate={fetchStats} />
            </div>

            {/* 2. Stats Cards (Reordered and Compact) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <StatCard
                    title="Agendamentos Hoje"
                    value={stats.todayBookings}
                    icon={<Calendar className="w-5 h-5 text-[#DBC278]" />}
                    color="from-[#DBC278]/20 to-transparent"
                />
                <StatCard
                    title="Clientes Mensais"
                    value={stats.monthlyClients}
                    icon={<Users className="w-5 h-5 text-blue-400" />}
                    color="from-blue-500/10 to-transparent"
                    onClick={() => setActiveModal('monthly')}
                />
                <StatCard
                    title="VIPs Ativos"
                    value={stats.activeVips}
                    icon={<Check className="w-5 h-5 text-emerald-400" />}
                    color="from-emerald-500/10 to-transparent"
                    onClick={() => setActiveModal('vips')}
                />
                <StatCard
                    title="Receita Hoje"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.todayRevenue)}
                    icon={<DollarSign className="w-5 h-5 text-amber-400" />}
                    color="from-amber-500/10 to-transparent"
                    onClick={() => setActiveModal('revenue')}
                />
            </div>

            {/* Modals for Details */}
            <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="bg-[#1c1c1c] border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {activeModal === 'revenue' && <><DollarSign className="w-5 h-5 text-amber-400" /> Detalhes da Receita (Hoje)</>}
                            {activeModal === 'monthly' && <><Users className="w-5 h-5 text-blue-400" /> Clientes do Mês</>}
                            {activeModal === 'vips' && <><Check className="w-5 h-5 text-emerald-400" /> Clientes VIP</>}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            {activeModal === 'revenue' && "Lista de serviços concluídos hoje e seus valores."}
                            {activeModal === 'monthly' && "Clientes únicos que realizaram agendamentos este mês."}
                            {activeModal === 'vips' && "Seus clientes mais fiéis (3 ou mais atendimentos)."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-auto pr-2 mt-4">
                        {activeModal === 'revenue' && (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-zinc-400 px-0">Cliente</TableHead>
                                        <TableHead className="text-zinc-400">Serviço</TableHead>
                                        <TableHead className="text-right text-zinc-400 px-0">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {details.revenueBookings.length === 0 ? (
                                        <TableRow className="border-transparent"><TableCell colSpan={3} className="text-center py-8 text-zinc-500">Nenhuma receita registrada hoje.</TableCell></TableRow>
                                    ) : (
                                        details.revenueBookings.map((b) => (
                                            <TableRow key={b.id} className="border-white/5 hover:bg-white/5">
                                                <TableCell className="px-0 py-3 font-medium">{b.customer_name}</TableCell>
                                                <TableCell className="py-3 text-zinc-400">{(b.services as any)?.title}</TableCell>
                                                <TableCell className="px-0 py-3 text-right font-bold text-[#DBC278]">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((b.services as any)?.price || 0)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}

                        {activeModal === 'monthly' && (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-zinc-400 px-0">Cliente</TableHead>
                                        <TableHead className="text-right text-zinc-400 px-0">Última Visita</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {details.monthlyClientsList.length === 0 ? (
                                        <TableRow className="border-transparent"><TableCell colSpan={2} className="text-center py-8 text-zinc-500">Nenhum cliente mensurável este mês.</TableCell></TableRow>
                                    ) : (
                                        details.monthlyClientsList.map((c, i) => (
                                            <TableRow key={i} className="border-white/5 hover:bg-white/5">
                                                <TableCell className="px-0 py-3 font-medium">
                                                    <div>{c.customer_name}</div>
                                                    <div className="text-xs text-zinc-500 font-normal">{c.customer_phone}</div>
                                                </TableCell>
                                                <TableCell className="px-0 py-3 text-right text-zinc-400 text-sm">
                                                    {format(new Date(c.date), "d 'de' MMM", { locale: ptBR })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}

                        {activeModal === 'vips' && (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-zinc-400 px-0">Cliente</TableHead>
                                        <TableHead className="text-right text-zinc-400 px-0">Atendimentos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {details.vipsList.length === 0 ? (
                                        <TableRow className="border-transparent"><TableCell colSpan={2} className="text-center py-8 text-zinc-500">Ainda não há clientes VIP.</TableCell></TableRow>
                                    ) : (
                                        details.vipsList.map((c, i) => (
                                            <TableRow key={i} className="border-white/5 hover:bg-white/5">
                                                <TableCell className="px-0 py-3 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {c.name}
                                                        <span className="text-[10px] bg-[#DBC278]/10 text-[#DBC278] border border-[#DBC278]/20 px-1.5 py-0.5 rounded font-bold uppercase">VIP</span>
                                                    </div>
                                                    <div className="text-xs text-zinc-500 font-normal">{c.phone}</div>
                                                </TableCell>
                                                <TableCell className="px-0 py-3 text-right">
                                                    <span className="bg-zinc-800 px-2 py-1 rounded text-sm font-bold text-white border border-white/5">{c.count}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Onboarding Modal */}
            {onboardingOpen && barbershopId && (
                <OnboardingModal
                    isOpen={onboardingOpen}
                    onOpenChange={setOnboardingOpen}
                    barbershopId={barbershopId}
                    onComplete={() => {
                        setOnboardingOpen(false)
                        fetchStats() // Refresh stats
                    }}
                />
            )}
        </div>
    )
}

function StatCard({ title, value, icon, color, onClick }: { title: string, value: string | number, icon: React.ReactNode, color?: string, onClick?: () => void }) {
    return (
        <Card
            className={`
                relative overflow-hidden bg-[#1c1c1c] border-white/5 text-white shadow-xl transition-all duration-300
                ${onClick ? 'cursor-pointer hover:border-white/20 hover:bg-zinc-800/80 active:scale-95 group' : 'opacity-90'}
            `}
            onClick={onClick}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color || 'from-white/5 to-transparent'} blur-3xl opacity-50 transition-opacity group-hover:opacity-80`} />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {title}
                </CardTitle>
                <div className="p-2 bg-black/20 rounded-lg backdrop-blur-sm border border-white/5 transition-transform group-hover:scale-110">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black group-hover:text-[#DBC278] transition-colors">
                    {value}
                </div>
            </CardContent>
        </Card>
    )
}
