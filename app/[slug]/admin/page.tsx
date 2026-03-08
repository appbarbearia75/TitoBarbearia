"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Users, DollarSign, TrendingUp, Scissors, Copy, Check, AlertCircle, Gift, Crown, Clock, ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format, subDays, startOfWeek, endOfWeek, parseISO, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"

import { OnboardingModal } from "@/components/onboarding/onboarding-modal"
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, ReferenceLine } from "recharts"

export default function TenantDashboard() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string

    // States for data
    const [stats, setStats] = useState({
        todayBookings: 0,
        todayRevenue: 0,
        yesterdayRevenue: 0,
        revenueGrowth: 0,
        newClientsThisMonth: 0,
        recurringClientsPercent: 0,
        totalMonthlyClients: 0,
        activeVips: 0,
        monthlyRevenue: 0,
        lastMonthRevenue: 0,
        monthlyGrowth: 0,
        averageTicket: 0,
        totalProductsSold: 0,
        weekBookings: 0
    })

    const [alerts, setAlerts] = useState<{
        freeSlots: number,
        birthdays: number,
        newVips: number
    }>({
        freeSlots: 0,
        birthdays: 0,
        newVips: 0
    })

    const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>([])
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [onboardingOpen, setOnboardingOpen] = useState(false)
    const [barbershopId, setBarbershopId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [barbershopName, setBarbershopName] = useState("")

    useEffect(() => {
        fetchDashboardData()
    }, [slug])

    const fetchDashboardData = async () => {
        setLoading(true)
        setErrorMsg(null)
        try {
            const { data: barbershop, error: barbershopErr } = await supabase.from('barbershops').select('id, name, phone, address, opening_hours').eq('slug', slug).single()

            if (barbershopErr) throw new Error("Barbershop fetch error: " + barbershopErr.message)

            if (barbershop) {
                setBarbershopId(barbershop.id)
                setBarbershopName(barbershop.name || "Barbearia")

                // Check for new account
                const { count: serviceCount } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('barbershop_id', barbershop.id)
                if ((!barbershop.phone || !barbershop.address) && (serviceCount === 0 || serviceCount === null)) {
                    setOnboardingOpen(true)
                }

                const todayObj = new Date()
                const todayStr = format(todayObj, 'yyyy-MM-dd')
                const yesterdayStr = format(subDays(todayObj, 1), 'yyyy-MM-dd')
                const firstDayOfMonth = format(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1), 'yyyy-MM-dd')

                // --- PARALLEL DATA FETCHING ---
                const lastMonthStartOnlyDate = format(new Date(todayObj.getFullYear(), todayObj.getMonth() - 1, 1), 'yyyy-MM-dd')
                const weekStartStr = format(startOfWeek(todayObj, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                const nowStr = format(todayObj, 'HH:mm')

                const [
                    { data: allRecentCommands },
                    { data: allRecentBookings },
                    { data: upcomingBookingsData },
                    { data: clientsData },
                    { data: pastBookingsForRecurringCheck }
                ] = await Promise.all([
                    // 1. All commands from last month start to now
                    supabase.from('commands').select('total_amount, closed_at').eq('barbershop_id', barbershop.id).eq('status', 'closed').gte('closed_at', lastMonthStartOnlyDate + "T00:00:00.000Z"),
                    // 2. All bookings from first day of month to now
                    supabase.from('bookings').select('id, date, time, status, customer_phone, services(duration)').eq('barbershop_id', barbershop.id).gte('date', firstDayOfMonth).neq('status', 'cancelled'),
                    // 3. Upcoming today
                    supabase.from('bookings').select('id, time, customer_name, services(name)').eq('barbershop_id', barbershop.id).eq('date', todayStr).in('status', ['confirmed', 'completed', 'pending']).gte('time', nowStr).order('time', { ascending: true }).limit(5),
                    // 4. Clients for birthdays and VIPs
                    supabase.from('clients').select('id, phone, birthday, is_vip, vip_since').eq('barbershop_id', barbershop.id),
                    // 5. Past bookings specifically for checking recurring status
                    supabase.from('bookings').select('customer_phone').eq('barbershop_id', barbershop.id).lt('date', firstDayOfMonth).in('status', ['confirmed', 'completed'])
                ])

                // --- IN-MEMORY PROCESSING (Extremely Fast) ---

                // 1. Revenue Calculations
                let todayRev = 0, yesterdayRev = 0, currentMonthRev = 0, lastMonthRev = 0;
                let currentMonthCommandsCount = 0;

                const currentMonthPrefix = todayStr.substring(0, 7);
                const lastMonthPrefix = lastMonthStartOnlyDate.substring(0, 7);

                const chartRevenueByDate: Record<string, number> = {};
                for (let i = 6; i >= 0; i--) {
                    chartRevenueByDate[format(subDays(todayObj, i), 'yyyy-MM-dd')] = 0;
                }

                allRecentCommands?.forEach((cmd: any) => {
                    const amount = Number(cmd.total_amount) || 0;
                    const closedDate = cmd.closed_at.substring(0, 10);

                    if (closedDate === todayStr) todayRev += amount;
                    if (closedDate === yesterdayStr) yesterdayRev += amount;

                    if (closedDate.startsWith(currentMonthPrefix)) {
                        currentMonthRev += amount;
                        currentMonthCommandsCount++;
                    }
                    if (closedDate.startsWith(lastMonthPrefix)) lastMonthRev += amount;

                    if (chartRevenueByDate[closedDate] !== undefined) {
                        chartRevenueByDate[closedDate] += amount;
                    }
                });

                let growth = 0;
                if (yesterdayRev === 0 && todayRev > 0) growth = 100;
                else if (yesterdayRev > 0) growth = ((todayRev - yesterdayRev) / yesterdayRev) * 100;

                let monthlyGrowth = 0;
                if (lastMonthRev === 0 && currentMonthRev > 0) monthlyGrowth = 100;
                else if (lastMonthRev > 0) monthlyGrowth = ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100;

                const averageTicketValue = currentMonthCommandsCount > 0 ? currentMonthRev / currentMonthCommandsCount : 0;

                // 2. Bookings Calculations
                let todayBookingsCount = 0;
                let currentWeekBookingsCount = 0;
                const chartBookingsByDate: Record<string, number> = {};
                for (let i = 6; i >= 0; i--) {
                    chartBookingsByDate[format(subDays(todayObj, i), 'yyyy-MM-dd')] = 0;
                }

                const uniquePhonesThisMonth = new Set<string>();

                allRecentBookings?.forEach((b: any) => {
                    if (b.date === todayStr) todayBookingsCount++;
                    if (b.date >= weekStartStr && b.date <= todayStr && ['confirmed', 'completed'].includes(b.status)) {
                        currentWeekBookingsCount++;
                    }
                    if (chartBookingsByDate[b.date] !== undefined && ['confirmed', 'completed'].includes(b.status)) {
                        chartBookingsByDate[b.date]++;
                    }
                    if (b.customer_phone && ['confirmed', 'completed'].includes(b.status)) {
                        uniquePhonesThisMonth.add(b.customer_phone);
                    }
                });

                let freeSlotsCount = 0;
                const dayOfWeekMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
                const todayDayOfWeek = dayOfWeekMap[todayObj.getDay()];
                const todayConfig = barbershop.opening_hours?.[todayDayOfWeek];
                if (todayConfig?.open) {
                    const [startH] = (todayConfig.start || "09:00").split(':').map(Number);
                    const [endH] = (todayConfig.end || "18:00").split(':').map(Number);
                    const totalPossibleSlots = (endH - startH) * 2;
                    freeSlotsCount = Math.max(0, totalPossibleSlots - todayBookingsCount);
                }

                // 3. Client Metrics
                let newClientsCount = 0;
                let recurringCount = 0;

                if (uniquePhonesThisMonth.size > 0 && pastBookingsForRecurringCheck) {
                    const phonesWithPastHistory = new Set(pastBookingsForRecurringCheck.map(b => b.customer_phone));
                    uniquePhonesThisMonth.forEach(phone => {
                        if (phonesWithPastHistory.has(phone)) {
                            recurringCount++;
                        } else {
                            newClientsCount++;
                        }
                    });
                } else if (uniquePhonesThisMonth.size > 0) {
                    newClientsCount = uniquePhonesThisMonth.size;
                }

                const totalMonthlyUnique = newClientsCount + recurringCount;
                const recurringPercent = totalMonthlyUnique > 0 ? Math.round((recurringCount / totalMonthlyUnique) * 100) : 0;

                // 3.5. Next Appointments
                setUpcomingAppointments(upcomingBookingsData || []);

                // 4. Alerts
                let bdays = 0;
                let newVipsToday = 0;
                let totalVips = 0;
                const todayMonthDay = format(todayObj, 'MM-dd');

                clientsData?.forEach(c => {
                    if (c.is_vip) totalVips++;
                    if (c.is_vip && c.vip_since && c.vip_since.startsWith(todayStr)) newVipsToday++;
                    if (c.birthday && c.birthday.length >= 10) {
                        const bMonthDay = c.birthday.substring(5, 10);
                        if (bMonthDay === todayMonthDay) bdays++;
                    }
                });

                // 5. Chart
                const weekChartData = [];
                for (let i = 6; i >= 0; i--) {
                    const d = subDays(todayObj, i);
                    const dStr = format(d, 'yyyy-MM-dd');
                    weekChartData.push({
                        name: format(d, 'EEE', { locale: ptBR }),
                        fullDate: format(d, 'EEEE, d/MM', { locale: ptBR }),
                        total: chartRevenueByDate[dStr] || 0,
                        bookings: chartBookingsByDate[dStr] || 0
                    });
                }

                setStats({
                    todayBookings: todayBookingsCount,
                    todayRevenue: todayRev,
                    yesterdayRevenue: yesterdayRev,
                    revenueGrowth: growth,
                    newClientsThisMonth: newClientsCount,
                    recurringClientsPercent: recurringPercent,
                    totalMonthlyClients: totalMonthlyUnique,
                    activeVips: totalVips,
                    monthlyRevenue: currentMonthRev,
                    lastMonthRevenue: lastMonthRev,
                    monthlyGrowth: monthlyGrowth,
                    averageTicket: averageTicketValue,
                    totalProductsSold: 0, // Placeholder if products table doesn't exist
                    weekBookings: currentWeekBookingsCount || 0
                })

                setAlerts({
                    freeSlots: freeSlotsCount,
                    birthdays: bdays,
                    newVips: newVipsToday
                })

                setWeeklyRevenue(weekChartData)
            } else {
                setErrorMsg("Barbearia não encontrada no banco de dados.")
            }
        } catch (err: any) {
            console.error("Dashboard Error:", err)
            setErrorMsg(err.message || "Erro desconhecido ao carregar o dashboard.")
        } finally {
            setLoading(false)
        }
    }

    const handleCopyLink = () => {
        const url = `${window.location.origin}/${slug}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (errorMsg) {
        return <div className="p-8 text-red-500 bg-red-500/10 border border-red-500 rounded-lg">Erro Crítico no Dashboard: {errorMsg}</div>
    }

    if (loading) {
        return <div className="animate-pulse space-y-6">
            <div className="h-10 bg-white/5 w-64 rounded"></div>
            <div className="flex gap-4"><div className="h-12 bg-white/5 flex-1 rounded"></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div className="h-32 bg-white/5 rounded"></div><div className="h-32 bg-white/5 rounded"></div></div>
        </div>
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Central do Dia</h1>
                    <p className="text-zinc-400 mt-1">Bem-vindo(a) ao painel da {barbershopName}</p>
                </div>
                <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="w-full sm:w-auto gap-2 bg-[#1c1c1c]/50 border-white/5 hover:bg-[#DBC278]/20 text-[#DBC278] hover:text-[#DBC278] backdrop-blur-sm transition-all"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Link Copiado!" : "Link de Agendamento"}
                </Button>
            </div>

            {/* Smart Alerts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                {/* Alerta de Horários */}
                <div onClick={() => router.push(`/${slug}/admin/agenda`)} className="cursor-pointer active:scale-95 flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1c]/80 border border-white/5 shadow-lg relative overflow-hidden group hover:border-orange-500/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                        ⚠️
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-tight group-hover:text-orange-400 transition-colors">
                            {alerts.freeSlots} {alerts.freeSlots === 1 ? 'horário livre' : 'horários livres'}
                        </span>
                        <span className="text-xs text-orange-400/70 group-hover:text-orange-400 font-medium transition-colors mt-0.5">→ abrir agenda</span>
                    </div>
                </div>

                {/* Alerta de Aniversários */}
                <div onClick={() => router.push(`/${slug}/admin/clients`)} className="cursor-pointer active:scale-95 flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1c]/80 border border-white/5 shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                        🎂
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                            {alerts.birthdays} aniversariante{alerts.birthdays !== 1 && 's'}
                        </span>
                        <span className="text-xs text-blue-400/70 group-hover:text-blue-400 font-medium transition-colors mt-0.5">→ ver clientes</span>
                    </div>
                </div>

                {/* Alerta Próximo Atendimento */}
                <div onClick={() => router.push(`/${slug}/admin/agenda`)} className="cursor-pointer active:scale-95 flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1c]/80 border border-white/5 shadow-lg relative overflow-hidden group hover:border-green-500/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                        📅
                    </div>
                    <div className="flex flex-col">
                        {upcomingAppointments.length > 0 ? (
                            <>
                                <span className="text-sm font-bold text-white leading-tight group-hover:text-green-400 transition-colors">Atendimento às {upcomingAppointments[0].time.substring(0, 5)}</span>
                                <span className="text-xs text-green-400/70 group-hover:text-green-400 font-medium transition-colors mt-0.5">→ abrir agenda</span>
                            </>
                        ) : (
                            <>
                                <span className="text-sm font-bold text-white leading-tight mt-1 group-hover:text-green-400 transition-colors">Agenda Livre</span>
                                <span className="text-xs text-green-400/70 group-hover:text-green-400 font-medium transition-colors mt-0.5">→ criar reserva</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Alerta VIPs */}
                <div onClick={() => router.push(`/${slug}/admin/clients`)} className="cursor-pointer active:scale-95 flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1c]/80 border border-white/5 shadow-lg relative overflow-hidden group hover:border-[#DBC278]/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#DBC278]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                        ⭐
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-tight group-hover:text-[#DBC278] transition-colors">
                            {alerts.newVips} novo{alerts.newVips !== 1 ? 's' : ''} VIP{alerts.newVips !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-[#DBC278]/70 group-hover:text-[#DBC278] font-medium transition-colors mt-0.5">→ ver clientes</span>
                    </div>
                </div>
            </div>

            {/* Main Metrics (Clickable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Revenue Card */}
                <Card
                    className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-[#1c1c1c] border-white/5 text-white shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-green-500/10 hover:border-green-500/30 active:scale-95 transition-all duration-300 group"
                    onClick={() => router.push(`/${slug}/admin/pdv`)}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Receita Hoje</CardTitle>
                        <div className="p-2 bg-black/20 rounded-lg backdrop-blur-sm border border-white/5 transition-transform group-hover:scale-110">
                            <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white group-hover:text-green-400 transition-colors">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.todayRevenue)}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="flex flex-col w-full pr-4">
                                {(() => {
                                    const meta = Math.round(stats.averageTicket * 6 || 150)
                                    const percent = stats.averageTicket > 0 ? Math.round((stats.todayRevenue / meta) * 100) : 0
                                    const isCompleted = percent >= 100

                                    return (
                                        <div className="mt-3 flex flex-col gap-1.5 w-full">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                                    Meta do Dia (R$ {meta})
                                                </span>
                                                {isCompleted ? (
                                                    <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        🎉 Batida!
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-zinc-400">
                                                        {percent}% atingido
                                                    </span>
                                                )}
                                            </div>
                                            <div className="h-1.5 w-full bg-[#1c1c1c] rounded-full overflow-hidden border border-white/5 relative">
                                                <div
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-zinc-600 group-hover:bg-zinc-500'}`}
                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                            <div className="flex flex-col items-end shrink-0 pl-2">
                                <span className="opacity-0 group-hover:opacity-100 flex items-center text-[10px] text-zinc-400 uppercase font-bold transition-opacity mb-1 whitespace-nowrap">
                                    Abrir Vendas <ArrowRight className="w-3 h-3 ml-1" />
                                </span>
                                <div className="flex gap-0.5 items-end h-3">
                                    <div className="w-1 h-1.5 bg-zinc-700"></div><div className="w-1 h-2 bg-zinc-600"></div><div className="w-1 h-3 bg-green-500/50"></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Agenda Card */}
                <Card
                    className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-[#1c1c1c] border-white/5 text-white shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-blue-500/10 hover:border-blue-500/30 active:scale-95 transition-all duration-300 group"
                    onClick={() => router.push(`/${slug}/admin/agenda`)}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Agendamentos (Hoje)</CardTitle>
                        <div className="p-2 bg-black/20 rounded-lg backdrop-blur-sm border border-white/5 transition-transform group-hover:scale-110">
                            <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
                                {stats.todayBookings}
                            </span>
                            <span className="text-sm font-bold text-zinc-400">agendamentos</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-orange-500/20">
                                <span className="text-[10px]">⚠️</span> {alerts.freeSlots} {alerts.freeSlots === 1 ? 'horário livre' : 'horários livres'}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center text-[10px] text-zinc-400 uppercase font-bold transition-opacity">
                                Ver Agenda <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Clients Card */}
                <Card
                    className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-[#1c1c1c] border-white/5 text-white shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-purple-500/10 hover:border-purple-500/30 active:scale-95 transition-all duration-300 group"
                    onClick={() => router.push(`/${slug}/admin/clients`)}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Clientes Novos (Mês)</CardTitle>
                        <div className="p-2 bg-black/20 rounded-lg backdrop-blur-sm border border-white/5 transition-transform group-hover:scale-110">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white group-hover:text-purple-400 transition-colors">
                            {stats.newClientsThisMonth}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-zinc-500">
                                Primeira visita
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center text-[10px] text-zinc-400 uppercase font-bold transition-opacity">
                                Ver Base <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Missing Data Card / Expanded Metrics */}
                {/* Recurring Card */}
                <Card className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-[#1c1c1c] border-white/5 text-white shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-[#DBC278]/10 hover:border-[#DBC278]/30 active:scale-95 transition-all duration-300 group" onClick={() => router.push(`/${slug}/admin/analytics`)}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#DBC278]/10 to-transparent blur-3xl opacity-50" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Clientes Recorrentes</CardTitle>
                        <div className="p-2 bg-black/20 rounded-lg backdrop-blur-sm border border-white/5">
                            <TrendingUp className="w-5 h-5 text-[#DBC278]" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-[#DBC278]">
                            {stats.recurringClientsPercent}%
                        </div>
                        <div className="mt-2 flex justify-between items-center text-xs text-zinc-500">
                            Voltaram este mês
                            <span className="opacity-0 group-hover:opacity-100 flex items-center text-[10px] text-zinc-400 uppercase font-bold transition-opacity">
                                Ver Docs <ArrowRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Average Ticket Card */}
                <Card className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-[#1c1c1c] border-white/5 text-white shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-indigo-500/10 hover:border-indigo-500/30 active:scale-95 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl opacity-50" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ticket Médio</CardTitle>
                        <div className="p-2 bg-black/20 rounded-lg backdrop-blur-sm border border-white/5">
                            <Scissors className="w-5 h-5 text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.averageTicket)}
                        </div>
                        <div className="mt-2 flex justify-between items-center text-xs text-zinc-500">
                            Gasto médio por cliente
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Growth Card */}
                <Card className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-[#1c1c1c] border-white/5 text-white shadow-xl sm:col-span-2 lg:col-span-1 cursor-pointer hover:-translate-y-1 hover:shadow-emerald-500/10 hover:border-emerald-500/30 active:scale-95 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent blur-3xl opacity-50" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Receita do Mês</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div>
                            <div className="text-3xl font-black text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyRevenue)}
                            </div>
                            <div className={`text-xs font-bold flex items-center mt-1 ${stats.monthlyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {stats.monthlyGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                {Math.abs(stats.monthlyGrowth).toFixed(1)}% vs mês passado
                            </div>
                        </div>
                        <div className="flex gap-1 items-end h-6 opacity-30">
                            <div className="w-1.5 h-3 bg-white"></div><div className="w-1.5 h-4 bg-white"></div><div className="w-1.5 h-6 bg-emerald-500"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Section Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 bg-[#1c1c1c] border-white/5 shadow-xl">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-white">Receita da Semana</CardTitle>
                                <CardDescription className="text-zinc-500">Faturamento dos últimos 7 dias operacionais.</CardDescription>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Média Diária</p>
                                    <p className="text-lg font-black text-[#DBC278]">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weeklyRevenue.reduce((acc, curr) => acc + curr.total, 0) / 7)}
                                    </p>
                                </div>
                                <div className="w-px bg-white/10" />
                                <div className="text-right">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Total da Semana</p>
                                    <p className="text-lg font-black text-green-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weeklyRevenue.reduce((acc, curr) => acc + curr.total, 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyRevenue} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        padding={{ left: 10, right: 10 }}
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[0, 'dataMax + 20']}
                                        tickFormatter={(value) => `R$${value}`}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-[#09090b] border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-1">
                                                        <span className="text-zinc-400 text-xs font-bold uppercase capitalize">{data.fullDate}</span>
                                                        <span className="text-white text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}</span>
                                                        <span className="text-zinc-500 text-xs font-medium">{data.bookings} atendimento{data.bookings !== 1 && 's'}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    />
                                    {weeklyRevenue.length > 0 && (
                                        <ReferenceLine
                                            y={weeklyRevenue.reduce((acc, curr) => acc + curr.total, 0) / 7}
                                            stroke="#DBC278"
                                            strokeOpacity={0.3}
                                            strokeDasharray="4 4"
                                            label={{
                                                position: 'insideTopLeft',
                                                value: `Média: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weeklyRevenue.reduce((acc, curr) => acc + curr.total, 0) / 7)}`,
                                                fill: '#DBC278',
                                                fontSize: 11,
                                                opacity: 0.8
                                            }}
                                        />
                                    )}
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                        {weeklyRevenue.map((entry, index) => {
                                            const maxTotal = Math.max(...weeklyRevenue.map(d => d.total));
                                            const isMax = entry.total === maxTotal && entry.total > 0;
                                            return <Cell key={`cell-${index}`} fill={isMax ? "#DBC278" : "#DBC27840"} />;
                                        })}
                                        <LabelList
                                            dataKey="total"
                                            position="top"
                                            fill="#8A8A8A"
                                            fontWeight={600}
                                            fontSize={12}
                                            offset={10}
                                            formatter={(value: any) => value > 0 ? `R$${value}` : ''}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Business Stats summary */}
                <Card className="bg-gradient-to-br from-[#1c1c1c] to-[#09090b] border-white/5 shadow-xl flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold text-[#DBC278]">Resumo do Negócio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm text-zinc-400">Clientes VIP</span>
                            <span className="text-sm font-black text-white">{stats.activeVips}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm text-zinc-400">Clientes Ativos</span>
                            <span className="text-sm font-black text-white">{stats.totalMonthlyClients}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm text-zinc-400">Agendamentos semana</span>
                            <span className="text-sm font-black text-white">{stats.weekBookings}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm text-zinc-400">Produtos vendidos</span>
                            <span className="text-sm font-black text-white">-</span>
                        </div>

                        <div className="pt-4 mt-auto">
                            <h4 className="text-xs font-bold text-white uppercase mb-4 flex items-center gap-2">Próximos Atendimentos <div className="h-1 w-1 bg-green-500 rounded-full animate-pulse"></div></h4>
                            {upcomingAppointments.length === 0 ? (
                                <div
                                    onClick={() => router.push(`/${slug}/admin/agenda`)}
                                    className="p-3 border border-white/5 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group flex flex-col gap-1 items-start"
                                >
                                    <p className="text-sm font-bold text-white">Agenda livre hoje</p>
                                    <button className="text-xs font-bold bg-[#DBC278]/10 text-[#DBC278] px-2 py-1 rounded transition-colors group-hover:bg-[#DBC278]/20 mt-1">
                                        👉 Criar agendamento
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingAppointments.map((app, i) => (
                                        <div key={i} className="flex gap-3 items-center group cursor-pointer" onClick={() => router.push(`/${slug}/admin/agenda`)}>
                                            <div className="text-sm font-bold text-zinc-500 group-hover:text-white transition-colors">{app.time.substring(0, 5)}</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">{app.customer_name}</span>
                                                <span className="text-xs text-zinc-500 truncate max-w-[150px]">{app.services?.name || "Serviço"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Onboarding Modal */}
            {onboardingOpen && barbershopId && (
                <OnboardingModal
                    isOpen={onboardingOpen}
                    onOpenChange={setOnboardingOpen}
                    barbershopId={barbershopId}
                    onComplete={() => {
                        setOnboardingOpen(false)
                        fetchDashboardData()
                    }}
                />
            )}
        </div>
    )
}
