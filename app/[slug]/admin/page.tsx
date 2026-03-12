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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">Central do Dia</h1>
                    <p className="text-text-secondary mt-1">Bem-vindo(a) ao painel da {barbershopName}</p>
                </div>
                <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="w-full sm:w-auto gap-2 bg-bg-card border-border-color hover:bg-accent-primary/20 text-accent-primary hover:text-accent-primary backdrop-blur-sm transition-all"
                >
                    {copied ? <Check className="w-4 h-4 text-success-color" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Link Copiado!" : "Link de Agendamento"}
                </Button>
            </div>

            {/* Smart Alerts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                {/* Alerta de Horários */}
                <div onClick={() => router.push(`/${slug}/admin/agenda`)} className="cursor-pointer active:scale-95 flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border-color shadow-lg relative overflow-hidden group hover:border-warning-color/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-warning-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-hover-bg border border-border-color flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                        ⚠️
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary leading-tight group-hover:text-warning-color transition-colors">
                            {alerts.freeSlots} {alerts.freeSlots === 1 ? 'horário livre' : 'horários livres'}
                        </span>
                        <span className="text-xs text-warning-color/70 group-hover:text-warning-color font-medium transition-colors mt-0.5">→ abrir agenda</span>
                    </div>
                </div>

                {/* Alerta de Aniversários */}
                <div onClick={() => router.push(`/${slug}/admin/clients`)} className="cursor-pointer active:scale-95 flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border-color shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-hover-bg border border-border-color flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                        🎂
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary leading-tight group-hover:text-blue-400 transition-colors">
                            {alerts.birthdays} aniversariante{alerts.birthdays !== 1 && 's'}
                        </span>
                        <span className="text-xs text-blue-400/70 group-hover:text-blue-400 font-medium transition-colors mt-0.5">→ ver clientes</span>
                    </div>
                </div>

                {/* Alerta Próximo Atendimento */}
                <div onClick={() => router.push(`/${slug}/admin/agenda`)} className="cursor-pointer active:scale-95 flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border-color shadow-lg relative overflow-hidden group hover:border-success-color/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-success-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-hover-bg border border-border-color flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                        📅
                    </div>
                    <div className="flex flex-col">
                        {upcomingAppointments.length > 0 ? (
                            <>
                                <span className="text-sm font-bold text-text-primary leading-tight group-hover:text-success-color transition-colors">Atendimento às {upcomingAppointments[0].time.substring(0, 5)}</span>
                                <span className="text-xs text-success-color/70 group-hover:text-success-color font-medium transition-colors mt-0.5">→ abrir agenda</span>
                            </>
                        ) : (
                            <>
                                <span className="text-sm font-bold text-text-primary leading-tight mt-1 group-hover:text-success-color transition-colors">Agenda Livre</span>
                                <span className="text-xs text-success-color/70 group-hover:text-success-color font-medium transition-colors mt-0.5">→ criar reserva</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Alerta VIPs */}
                <div onClick={() => router.push(`/${slug}/admin/clients`)} className="cursor-pointer active:scale-95 flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border-color shadow-lg relative overflow-hidden group hover:border-accent-primary/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-full bg-hover-bg border border-border-color flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                        ⭐
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary leading-tight group-hover:text-accent-primary transition-colors">
                            {alerts.newVips} novo{alerts.newVips !== 1 ? 's' : ''} VIP{alerts.newVips !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-accent-primary/70 group-hover:text-accent-primary font-medium transition-colors mt-0.5">→ ver clientes</span>
                    </div>
                </div>
            </div>

            {/* Main Metrics (Clickable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Revenue Card */}
                <Card
                    className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-bg-card border-border-color text-text-primary shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-success-color/10 hover:border-success-color/30 active:scale-95 transition-all duration-300 group"
                    onClick={() => router.push(`/${slug}/admin/pdv`)}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success-color/10 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Receita Hoje</CardTitle>
                        <div className="p-2 bg-hover-bg rounded-lg backdrop-blur-sm border border-border-color transition-transform group-hover:scale-110">
                            <DollarSign className="w-5 h-5 text-success-color" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-text-primary group-hover:text-success-color transition-colors">
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
                                                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                                                    Meta do Dia (R$ {meta})
                                                </span>
                                                {isCompleted ? (
                                                    <span className="text-[10px] font-black text-success-color bg-success-color/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        🎉 Batida!
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-text-secondary">
                                                        {percent}% atingido
                                                    </span>
                                                )}
                                            </div>
                                            <div className="h-1.5 w-full bg-hover-bg rounded-full overflow-hidden border border-border-color relative">
                                                <div
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-r from-emerald-600 to-success-color shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-text-secondary group-hover:bg-text-muted'}`}
                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                            <div className="flex flex-col items-end shrink-0 pl-2">
                                <span className="opacity-0 group-hover:opacity-100 flex items-center text-[10px] text-text-secondary uppercase font-bold transition-opacity mb-1 whitespace-nowrap">
                                    Abrir Vendas <ArrowRight className="w-3 h-3 ml-1" />
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Agenda Card */}
                <Card
                    className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-bg-card border-border-color text-text-primary shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-blue-500/10 hover:border-blue-500/30 active:scale-95 transition-all duration-300 group"
                    onClick={() => router.push(`/${slug}/admin/agenda`)}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Agendamentos (Hoje)</CardTitle>
                        <div className="p-2 bg-hover-bg rounded-lg backdrop-blur-sm border border-border-color transition-transform group-hover:scale-110">
                            <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-text-primary group-hover:text-blue-400 transition-colors">
                                {stats.todayBookings}
                            </span>
                            <span className="text-sm font-bold text-text-secondary">agendamentos</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-[11px] font-bold text-warning-color bg-warning-color/10 px-2 py-0.5 rounded flex items-center gap-1 border border-warning-color/20">
                                <span className="text-[10px]">⚠️</span> {alerts.freeSlots} {alerts.freeSlots === 1 ? 'horário livre' : 'horários livres'}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center text-[10px] text-text-secondary uppercase font-bold transition-opacity">
                                Ver Agenda <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Clients Card */}
                <Card
                    className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-bg-card border-border-color text-text-primary shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-purple-500/10 hover:border-purple-500/30 active:scale-95 transition-all duration-300 group"
                    onClick={() => router.push(`/${slug}/admin/clients`)}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Clientes Novos (Mês)</CardTitle>
                        <div className="p-2 bg-hover-bg rounded-lg backdrop-blur-sm border border-border-color transition-transform group-hover:scale-110">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-text-primary group-hover:text-purple-400 transition-colors">
                            {stats.newClientsThisMonth}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-text-secondary">
                                Primeira visita
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center text-[10px] text-text-secondary uppercase font-bold transition-opacity">
                                Ver Base <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Missing Data Card / Expanded Metrics */}
                {/* Recurring Card */}
                <Card className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-bg-card border-border-color text-text-primary shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-accent-primary/10 hover:border-accent-primary/30 active:scale-95 transition-all duration-300 group" onClick={() => router.push(`/${slug}/admin/analytics`)}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-primary/10 to-transparent blur-3xl opacity-50" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Clientes Recorrentes</CardTitle>
                        <div className="p-2 bg-hover-bg rounded-lg backdrop-blur-sm border border-border-color">
                            <TrendingUp className="w-5 h-5 text-accent-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-accent-primary">
                            {stats.recurringClientsPercent}%
                        </div>
                        <div className="mt-2 flex justify-between items-center text-xs text-text-secondary">
                            Voltaram este mês
                            <span className="opacity-0 group-hover:opacity-100 flex items-center text-[10px] text-text-secondary uppercase font-bold transition-opacity">
                                Ver Docs <ArrowRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Average Ticket Card */}
                <Card className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-bg-card border-border-color text-text-primary shadow-xl cursor-pointer hover:-translate-y-1 hover:shadow-indigo-500/10 hover:border-indigo-500/30 active:scale-95 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl opacity-50" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Ticket Médio</CardTitle>
                        <div className="p-2 bg-hover-bg rounded-lg backdrop-blur-sm border border-border-color">
                            <Scissors className="w-5 h-5 text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.averageTicket)}
                        </div>
                        <div className="mt-2 flex justify-between items-center text-xs text-text-secondary">
                            Gasto médio por cliente
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Growth Card */}
                <Card className="relative flex flex-col justify-between h-full min-h-[160px] overflow-hidden bg-bg-card border-border-color text-text-primary shadow-xl sm:col-span-2 lg:col-span-1 cursor-pointer hover:-translate-y-1 hover:shadow-success-color/10 hover:border-success-color/30 active:scale-95 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success-color/10 to-transparent blur-3xl opacity-50" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Receita do Mês</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div>
                            <div className="text-3xl font-black text-text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyRevenue)}
                            </div>
                            <div className={`text-xs font-bold flex items-center mt-1 ${stats.monthlyGrowth >= 0 ? 'text-success-color' : 'text-danger-color'}`}>
                                {stats.monthlyGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                {Math.abs(stats.monthlyGrowth).toFixed(1)}% vs mês passado
                            </div>
                        </div>
                        <div className="flex gap-1 items-end h-6 opacity-30">
                            <div className="w-1.5 h-3 bg-text-secondary"></div><div className="w-1.5 h-4 bg-text-secondary"></div><div className="w-1.5 h-6 bg-success-color"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Section Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 bg-bg-card border-border-color shadow-xl">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-text-primary">Receita da Semana</CardTitle>
                                <CardDescription className="text-text-secondary">Faturamento dos últimos 7 dias operacionais.</CardDescription>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold mb-1">Média Diária</p>
                                    <p className="text-lg font-black text-accent-primary">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weeklyRevenue.reduce((acc, curr) => acc + curr.total, 0) / 7)}
                                    </p>
                                </div>
                                <div className="w-px bg-border-color" />
                                <div className="text-right">
                                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold mb-1">Total da Semana</p>
                                    <p className="text-lg font-black text-success-color">
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
                                        stroke="var(--chart-axis)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        padding={{ left: 10, right: 10 }}
                                    />
                                    <YAxis
                                        stroke="var(--chart-axis)"
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
                                                    <div className="bg-[var(--chart-tooltip-bg)] border border-border-color rounded-xl p-3 shadow-2xl flex flex-col gap-1">
                                                        <span className="text-[var(--chart-tooltip-text)] opacity-70 text-xs font-bold uppercase capitalize">{data.fullDate}</span>
                                                        <span className="text-[var(--chart-tooltip-text)] text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}</span>
                                                        <span className="text-[var(--chart-tooltip-text)] opacity-60 text-xs font-medium">{data.bookings} atendimento{data.bookings !== 1 && 's'}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ fill: 'var(--chart-cursor-bg)' }}
                                    />
                                    {weeklyRevenue.length > 0 && (
                                        <ReferenceLine
                                            y={weeklyRevenue.reduce((acc, curr) => acc + curr.total, 0) / 7}
                                            stroke="var(--chart-highlight)"
                                            strokeOpacity={0.3}
                                            strokeDasharray="4 4"
                                            label={{
                                                position: 'insideTopLeft',
                                                value: `Média: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weeklyRevenue.reduce((acc, curr) => acc + curr.total, 0) / 7)}`,
                                                fill: 'var(--chart-line)',
                                                fontSize: 11,
                                                opacity: 0.8
                                            }}
                                        />
                                    )}
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                        {weeklyRevenue.map((entry, index) => {
                                            const maxTotal = Math.max(...weeklyRevenue.map(d => d.total));
                                            const isMax = entry.total === maxTotal && entry.total > 0;
                                            return <Cell key={`cell-${index}`} fill={isMax ? "var(--chart-bar)" : "var(--chart-bar)"} fillOpacity={isMax ? 1 : 0.4} />;
                                        })}
                                        <LabelList
                                            dataKey="total"
                                            position="top"
                                            fill="var(--chart-axis)"
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
                <Card className="bg-bg-page border-border-color shadow-xl flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold text-accent-primary">Resumo do Negócio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                        <div className="flex items-center justify-between border-b border-border-color pb-2">
                            <span className="text-sm text-text-secondary">Clientes VIP</span>
                            <span className="text-sm font-black text-text-primary">{stats.activeVips}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-border-color pb-2">
                            <span className="text-sm text-text-secondary">Clientes Ativos</span>
                            <span className="text-sm font-black text-text-primary">{stats.totalMonthlyClients}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-border-color pb-2">
                            <span className="text-sm text-text-secondary">Agendamentos semana</span>
                            <span className="text-sm font-black text-text-primary">{stats.weekBookings}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-border-color pb-2">
                            <span className="text-sm text-text-secondary">Produtos vendidos</span>
                            <span className="text-sm font-black text-text-primary">-</span>
                        </div>

                        <div className="pt-4 mt-auto">
                            <h4 className="text-xs font-bold text-text-primary uppercase mb-4 flex items-center gap-2">Próximos Atendimentos <div className="h-1 w-1 bg-success-color rounded-full animate-pulse"></div></h4>
                            {upcomingAppointments.length === 0 ? (
                                <div
                                    onClick={() => router.push(`/${slug}/admin/agenda`)}
                                    className="p-3 border border-border-color rounded-xl bg-bg-card cursor-pointer hover:bg-hover-bg transition-colors group flex flex-col gap-1 items-start"
                                >
                                    <p className="text-sm font-bold text-text-primary">Agenda livre hoje</p>
                                    <button className="text-xs font-bold bg-accent-primary/10 text-accent-primary px-2 py-1 rounded transition-colors group-hover:bg-accent-primary/20 mt-1">
                                        👉 Criar agendamento
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingAppointments.map((app, i) => (
                                        <div key={i} className="flex gap-3 items-center group cursor-pointer" onClick={() => router.push(`/${slug}/admin/agenda`)}>
                                            <div className="text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors">{app.time.substring(0, 5)}</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-text-primary">{app.customer_name}</span>
                                                <span className="text-xs text-text-secondary truncate max-w-[150px]">{app.services?.name || "Serviço"}</span>
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
