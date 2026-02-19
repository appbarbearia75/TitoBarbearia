"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LabelList
} from "recharts"
import { Loader2, TrendingUp, Users, Calendar, DollarSign, Star } from "lucide-react"



export default function AnalyticsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalBookings: 0,
        activeSubscribers: 0,
        reviewClicks: 0
    })
    const [servicesData, setServicesData] = useState<any[]>([])
    const [peakHoursData, setPeakHoursData] = useState<any[]>([])
    const [birthdaysData, setBirthdaysData] = useState<any[]>([])
    const [revenueData, setRevenueData] = useState<any[]>([])
    const [clientMixData, setClientMixData] = useState<any[]>([])

    useEffect(() => {
        fetchData()
    }, [slug])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Get Barbershop ID
            const { data: barbershop } = await supabase
                .from('barbershops')
                .select('id')
                .eq('slug', slug)
                .single()

            if (!barbershop) return

            // 2. Fetch Bookings (Last 6 months for revenue history)
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
            sixMonthsAgo.setDate(1)
            const sixMonthsAgoStr = format(sixMonthsAgo, 'yyyy-MM-dd')

            const { data: bookings } = await supabase
                .from('bookings')
                .select(`
                    id,
                    date,
                    time,
                    customer_name,
                    customer_phone,
                    customer_birthday,
                    status,
                    price:services(price),
                    service:services(title)
                `)
                .eq('barbershop_id', barbershop.id)
                .gte('date', sixMonthsAgoStr)
                .order('date', { ascending: false })

            // 3. Fetch VIP Clients Count
            const { count: vipCount } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('barbershop_id', barbershop.id)
                .eq('is_vip', true)

            // 4. Fetch Review Clicks
            const { count: reviewCount } = await supabase
                .from('analytics_events')
                .select('*', { count: 'exact', head: true })
                .eq('barbershop_id', barbershop.id)
                .eq('event_type', 'review_click')

            // Process Bookings Data
            let totalRevenue = 0 // For semestral total
            const serviceCounts: Record<string, number> = {}
            const hourCounts: Record<string, number> = {}
            const now = new Date()
            const uniqueClients = new Set<string>()

            // Monthly Revenue Map
            const monthlyRevenue = new Map<string, number>()
            // Initialize last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                const key = format(d, 'MMM', { locale: ptBR })
                // Capitalize first letter
                const keyCap = key.charAt(0).toUpperCase() + key.slice(1)
                monthlyRevenue.set(keyCap, 0)
            }

            // Prepare Birthdays
            const upcomingBirthdays: any[] = []

            bookings?.forEach(booking => {
                const isCompleted = booking.status === 'completed'
                const price = (booking.price as any)?.price || 0

                // Track unique clients (completed/confirmed)
                if (['completed', 'confirmed'].includes(booking.status) && booking.customer_phone) {
                    uniqueClients.add(booking.customer_phone)
                }

                if (isCompleted) {
                    const bookingDate = new Date(booking.date + 'T00:00:00') // Force local date interpretation
                    const monthKey = format(bookingDate, 'MMM', { locale: ptBR })
                    const monthKeyCap = monthKey.charAt(0).toUpperCase() + monthKey.slice(1)

                    if (monthlyRevenue.has(monthKeyCap)) {
                        monthlyRevenue.set(monthKeyCap, (monthlyRevenue.get(monthKeyCap) || 0) + Number(price))
                        totalRevenue += Number(price)
                    }

                    // Revenue for strict "Semestral" display - currently sums all fetched (6 months)
                }

                // Services & Hours (All bookings or just completed? User usually wants to see demand)
                // Let's count all non-cancelled for demand
                if (booking.status !== 'cancelled') {
                    const serviceName = (booking.service as any)?.title || 'Desconhecido'
                    serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1

                    // Hours
                    const hour = booking.time.split(':')[0] + 'h'
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1
                }

                // Birthdays Check
                if (booking.customer_birthday) {
                    const birthday = new Date(booking.customer_birthday)
                    // Set year to current year for comparison
                    const nextBirthday = new Date(now.getFullYear(), birthday.getUTCMonth(), birthday.getUTCDate())

                    if (nextBirthday < now) {
                        nextBirthday.setFullYear(now.getFullYear() + 1)
                    }

                    const diffTime = Math.abs(nextBirthday.getTime() - now.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                    if (diffDays <= 30) {
                        // Avoid duplicates if same customer booked multiple times
                        const existing = upcomingBirthdays.find(b => b.name === booking.customer_name)
                        if (!existing) {
                            upcomingBirthdays.push({
                                name: booking.customer_name,
                                date: `${birthday.getUTCDate()}/${birthday.getUTCMonth() + 1}`,
                                age: new Date().getFullYear() - birthday.getFullYear(),
                                rawDate: nextBirthday
                            })
                        }
                    }
                }
            })

            // Sort Birthdays
            upcomingBirthdays.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())

            // Format for Charts
            const revenueChartData = Array.from(monthlyRevenue.entries()).map(([name, total]) => ({
                name,
                total
            }))

            const topServices = Object.entries(serviceCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)

            const peakHours = Object.entries(hourCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => {
                    return parseInt(a.name) - parseInt(b.name)
                })

            // Calculate VIP vs Avulsos for Pie Chart
            const totalUniqueClients = uniqueClients.size
            const realVipCount = vipCount || 0
            const avulsosCount = Math.max(0, totalUniqueClients - realVipCount)

            const clientMixData = [
                { name: 'Assinantes VIP', value: realVipCount, color: '#DBC278' },
                { name: 'Avulsos', value: avulsosCount, color: '#525252' },
            ]

            setStats({
                totalRevenue: totalRevenue,
                totalBookings: bookings?.length || 0,
                activeSubscribers: realVipCount,
                reviewClicks: reviewCount || 0
            })
            // @ts-ignore
            setServicesData(topServices)
            // @ts-ignore
            setPeakHoursData(peakHours)
            // @ts-ignore
            setRevenueData(revenueChartData) // We need this state
            // @ts-ignore
            setClientMixData(clientMixData) // We need this state too
            // @ts-ignore
            setBirthdaysData(upcomingBirthdays)

            // We need a state for birthdays, lets add it by updating state via setStats or new state?
            // Since the original code mapped a static array, we need to store this data.
            // I will update the component state to include birthdays.
            // WAIT, there is no state for birthdays in the original code, it was hardcoded in the JSX.
            // I need to add a state for it.
            // I'll assume I can add `birthdaysData` state in a separate edit or hack it into `stats`?
            // No, better to add the state. But I'm in a single replace block.
            // I will modify the component to include `birthdaysData` state.

        } catch (error) {
            console.error("Error fetching analytics:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#DBC278]" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold">Painel do Barbeiro</h1>
                <p className="text-zinc-400">Acompanhe o desempenho do seu negócio.</p>
            </div>

            {/* Review Clicks Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Interesse em Avaliar
                        </CardTitle>
                        <Star className="h-4 w-4 text-[#DBC278]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.reviewClicks}</div>
                        <p className="text-xs text-zinc-500">
                            Cliques em "Avaliar"
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Faturamento Semestral */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-[#DBC278]" />
                            Faturamento Semestral
                        </CardTitle>
                        {/* Removed Large Value from Header as requested */}
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData.length > 0 ? revenueData : []} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#DBC278" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#DBC278" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.2} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#666"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#71717a' }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#DBC278', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                    labelStyle={{ color: '#a1a1aa', marginBottom: '0.25rem', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#DBC278"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#DBC278' }}
                                >
                                    <LabelList
                                        dataKey="total"
                                        position="top"
                                        offset={12}
                                        className="fill-[#DBC278] text-[11px] font-bold"
                                        formatter={(value: any) => value > 0 ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ''}
                                    />
                                </Area>
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Cliente Mix Card (Pie Chart) - Replaces the original placeholder */}
                <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#DBC278]" />
                            Perfil de Clientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={clientMixData.length > 0 ? clientMixData : [{ name: 'Sem dados', value: 1, color: '#333' }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {clientMixData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#333'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-2">
                            {clientMixData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                    <span className="text-zinc-400">{entry.name} ({entry.value})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Serviços */}
                <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                    {/* ... Header ... */}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#DBC278]" />
                            Top Serviços
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={servicesData.length > 0 ? servicesData : []} layout="vertical" margin={{ left: -20, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="#DBC278" radius={[0, 4, 4, 0]} barSize={20}>
                                    <LabelList dataKey="value" position="right" fill="#fff" fontSize={12} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Horários de Pico */}
                <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                    {/* ... Header ... */}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#DBC278]" />
                            Horários de Pico
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={peakHoursData.length > 0 ? peakHoursData : []} margin={{ top: 20 }}>
                                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="#525252" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="value" position="top" fill="#fff" fontSize={12} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
