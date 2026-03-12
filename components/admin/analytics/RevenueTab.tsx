"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { format, differenceInDays, endOfMonth, endOfToday, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, ReferenceLine, ReferenceDot
} from "recharts"
import { Loader2, DollarSign, TrendingUp, TrendingDown, CalendarCheck2, Sparkles, Lightbulb } from "lucide-react"
import { motion, animate, useMotionValue, useTransform } from "framer-motion"

// Componente para contagem animada
function AnimatedNumber({ value, prefix = "", suffix = "", isCurrency = false }: { value: number, prefix?: string, suffix?: string, isCurrency?: boolean }) {
    const count = useMotionValue(0)
    const rounded = useTransform(count, (latest) => {
        if (isCurrency) {
            return prefix + latest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix
        }
        return prefix + Math.floor(latest).toLocaleString('pt-BR') + suffix
    })

    useEffect(() => {
        const controls = animate(count, value, { duration: 1.5, ease: "easeOut" })
        return controls.stop
    }, [value])

    return <motion.span>{rounded}</motion.span>
}

// Sparkline Mini Chart
function Sparkline({ data, trendUp }: { data: any[], trendUp: boolean }) {
    if (!data || data.length === 0) return <div className="h-8 w-full mt-4" />
    const color = trendUp ? '#10b981' : '#ef4444' // Emerald or Red

    return (
        <div className="h-10 w-full mt-4 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--chart-line)"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

// KPI Card Refatorado
function KpiCard({ title, value, previousValue, isCurrency, icon, trendData }: any) {
    const trendDiff = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0
    const isUp = trendDiff >= 0
    let contextText = ""
    
    if (isCurrency) {
        const diffAbs = Math.abs(value - previousValue)
        contextText = `${isUp ? '↑' : '↓'} R$ ${diffAbs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${isUp ? 'acima' : 'abaixo'} comparado ao anterior`
    } else {
        contextText = `${isUp ? '↑' : '↓'} ${Math.abs(trendDiff).toFixed(1)}% vs período anterior`
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="bg-bg-card border-border-color text-text-primary shadow-xl hover:border-border-color/80 transition-colors relative overflow-hidden flex flex-col justify-between h-full">
                <CardContent className="p-5 pb-0">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{title}</p>
                        <div className="p-1.5 bg-hover-bg rounded-md border border-border-color text-accent-color">
                            {icon}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">
                            <AnimatedNumber value={value} isCurrency={isCurrency} prefix={isCurrency ? "R$ " : ""} />
                        </h3>
                        <div className="flex items-center mt-1">
                            <span className={`text-[11px] font-medium leading-tight ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                {contextText}
                            </span>
                        </div>
                    </div>
                </CardContent>
                {/* O Sparkline entra empurrando o fundo e cortando as margens */}
                <div className="w-full mt-auto">
                    <Sparkline data={trendData} trendUp={isUp} />
                </div>
            </Card>
        </motion.div>
    )
}

function BarRanking({ data, maxAmount, title, isCurrency=true }: { data: any[], maxAmount: number, title: string, isCurrency?: boolean }) {
    
    return (
        <Card className="bg-bg-card border-border-color flex flex-col h-full">
            <CardHeader className="pb-4 border-b border-border-color">
                <CardTitle className="text-xs text-text-secondary uppercase tracking-widest">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 flex-1 p-6">
                {data.map((item, i) => {
                    const pct = maxAmount > 0 ? (item.total / maxAmount) * 100 : 0
                    const formatted = isCurrency ? `R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : item.total
                    let badge = ""
                    if (i === 0) badge = "🥇"
                    else if (i === 1) badge = "🥈"
                    else if (i === 2) badge = "🥉"

                    return (
                        <div key={i} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-sm items-end">
                                <span className="text-text-primary font-medium flex items-center gap-2">
                                    {badge && <span className="text-lg">{badge}</span>}
                                    {item.name}
                                </span>
                                <span className="text-text-secondary font-semibold">{formatted}</span>
                            </div>
                            <div className="w-full bg-border-color rounded-full h-2 overflow-hidden">
                                <motion.div 
                                    className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-accent-color to-yellow-500' : 'bg-neutral-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                />
                            </div>
                        </div>
                    )
                })}
                {data.length === 0 && <div className="text-xs text-text-secondary text-center py-4">Nenhum dado no período</div>}
            </CardContent>
        </Card>
    )
}

export function RevenueTab({ slug }: { slug: string }) {
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
    const [metrics, setMetrics] = useState({ 
        revenue: 0, prevRevenue: 0, 
        ticket: 0, prevTicket: 0, 
        appointments: 0, prevAppointments: 0,
        projection: 0
    })
    const [chartData, setChartData] = useState<any[]>([])
    const [servicesData, setServicesData] = useState<any[]>([])
    const [barbersData, setBarbersData] = useState<any[]>([])
    const [businessInsights, setBusinessInsights] = useState<any[]>([])

    // Sparklines data states
    const [sparklineRev, setSparklineRev] = useState<any[]>([])
    const [sparklineTic, setSparklineTic] = useState<any[]>([])
    const [sparklineApp, setSparklineApp] = useState<any[]>([])

    useEffect(() => {
        fetchRevenueData()
    }, [slug, filter])

    const fetchRevenueData = async () => {
        setLoading(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            let daysFilter = 30
            if (filter === '7d') daysFilter = 7
            if (filter === '90d') daysFilter = 90
            if (filter === '1y') daysFilter = 365

            // Data limites (Atual vs Anterior para Comparação)
            const now = new Date()
            const startDateArr = new Date()
            startDateArr.setDate(now.getDate() - daysFilter)
            const prevStartDateArr = new Date(startDateArr)
            prevStartDateArr.setDate(startDateArr.getDate() - daysFilter)

            const dateLimitStr = format(prevStartDateArr, 'yyyy-MM-dd') // Fetch double the period

            const { data: bookings } = await supabase
                .from('bookings')
                .select(`
                    id, date, time, status,
                    price:services(price),
                    service:services(title),
                    barber:barbers(name)
                `)
                .eq('barbershop_id', barbershop.id)
                .gte('date', dateLimitStr)
                .order('date', { ascending: true })

            // Separar Currente vs Previous
            const currentBookings: any[] = []
            const previousBookings: any[] = []

            bookings?.forEach(b => {
                const bDate = new Date(b.date + 'T00:00:00')
                if (bDate >= startDateArr) {
                    currentBookings.push(b)
                } else {
                    previousBookings.push(b)
                }
            })

            // Metrics Calculation helper
            const calcPeriod = (bks: any[]) => {
                let rev = 0, appts = 0
                const timeline = new Map<string, {rev: number, appts: number}>()
                const servs: any = {}
                const barbs: any = {}
                
                bks.forEach(b => {
                    if (b.status !== 'completed' && b.status !== 'confirmed') return
                    const isCompleted = b.status === 'completed'
                    const price = isCompleted ? Number((b.price as any)?.price || 0) : 0
                    
                    rev += price
                    appts++
                    
                    let tKey = format(new Date(b.date + 'T00:00:00'), 'yyyy-MM-dd')
                    const currT = timeline.get(tKey) || {rev: 0, appts: 0}
                    timeline.set(tKey, { rev: currT.rev + price, appts: currT.appts + 1 })
                    
                    const sName = (b.service as any)?.title || 'Outros'
                    servs[sName] = (servs[sName] || 0) + price

                    const bName = (b.barber as any)?.name || 'Sem Profissional'
                    barbs[bName] = (barbs[bName] || 0) + price
                })

                return { rev, appts, ticket: appts > 0 ? rev/appts : 0, timeline, servs, barbs }
            }

            const currentObj = calcPeriod(currentBookings)
            const prevObj = calcPeriod(previousBookings)

            // Sparklines builder
            const buildSparkline = (map: Map<string, any>, key: 'rev' | 'appts' | 'ticket') => {
                return Array.from(map.entries())
                    .sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                    .map(([date, data]) => {
                        let val = data[key]
                        if (key === 'ticket') val = data.appts > 0 ? data.rev / data.appts : 0
                        return { date, value: val }
                    })
            }

            setSparklineRev(buildSparkline(currentObj.timeline, 'rev'))
            setSparklineApp(buildSparkline(currentObj.timeline, 'appts'))
            setSparklineTic(buildSparkline(currentObj.timeline, 'ticket'))

            // Formatting Main Chart
            const chartAreaObj: any[] = []
            // Create a dense timeline for the main chart
            currentObj.timeline.forEach((data, date) => {
                let displayDate = format(new Date(date + 'T00:00:00'), filter === '1y' ? 'MMM/yy' : 'dd/MM', { locale: ptBR })
                // se 1y, precisamos agrupar
                chartAreaObj.push({
                    originalDate: date,
                    name: displayDate,
                    total: data.rev
                })
            })

            // Group if necessary
            const finalChartData = Object.values(chartAreaObj.reduce((acc: any, curr) => {
                if (!acc[curr.name]) acc[curr.name] = { name: curr.name, total: 0, count: 0 }
                acc[curr.name].total += curr.total
                acc[curr.name].count += 1
                return acc
            }, {}))

            // Prediction Logic (Projeção do Mês Atual)
            const currentMonthDaysPassed = now.getDate()
            const totalDaysInMonth = Math.ceil((endOfMonth(now).getTime() - startOfMonth(now).getTime()) / (1000*60*60*24))
            const revThisMonth = currentBookings.filter(b => {
                const d = new Date(b.date + 'T00:00:00')
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && b.status === 'completed'
            }).reduce((sum, b) => sum + Number((b.price as any)?.price || 0), 0)
            
            const projection = currentMonthDaysPassed > 0 ? (revThisMonth / currentMonthDaysPassed) * totalDaysInMonth : 0

            // Insights Generator
            const insights = []
            if (currentObj.rev > prevObj.rev) {
                insights.push({ icon: <TrendingUp className="text-emerald-500 w-4 h-4"/>, text: `Faturamento cresceu ${((currentObj.rev - prevObj.rev)/prevObj.rev * 100).toFixed(0)}% comparado ao período anterior.`, type: 'positive' })
            } else if (prevObj.rev > 0 && currentObj.rev < prevObj.rev) {
                insights.push({ icon: <TrendingDown className="text-red-500 w-4 h-4"/>, text: `Atenção: A receita caiu em relação ao período anterior.`, type: 'alert' })
            }
            
            // Top Service Alert
            const topServName = Object.keys(currentObj.servs).sort((a,b) => currentObj.servs[b] - currentObj.servs[a])[0]
            if (topServName) {
                insights.push({ icon: <Sparkles className="text-amber-500 w-4 h-4"/>, text: `"${topServName}" é o carro-chefe, gerou R$ ${currentObj.servs[topServName].toLocaleString('pt-BR')} do total.`, type: 'info' })
            }

            setBusinessInsights(insights)

            const sData = Object.entries(currentObj.servs).map(([name, total]) => ({ name, total: total as number })).sort((a, b) => b.total - a.total).slice(0, 5)
            const bData = Object.entries(currentObj.barbs).map(([name, total]) => ({ name, total: total as number })).sort((a, b) => b.total - a.total)

            setMetrics({
                revenue: currentObj.rev, prevRevenue: prevObj.rev,
                ticket: currentObj.ticket, prevTicket: prevObj.ticket,
                appointments: currentObj.appts, prevAppointments: prevObj.appts,
                projection
            })
            // @ts-ignore
            setChartData(finalChartData)
            setServicesData(sData)
            setBarbersData(bData)

        } catch (error) {
            console.error("Error", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#DBC278]" /></div>

    // Chart Calc for Average Line & Highlight
    const avgRevenue = chartData.length > 0 ? chartData.reduce((acc, curr) => acc + curr.total, 0) / chartData.length : 0
    const maxRevenuePoint = chartData.length > 0 ? chartData.reduce((prev, current) => (prev.total > current.total) ? prev : current) : null
    
    const maxBarberRevenue = barbersData.length > 0 ? Math.max(...barbersData.map(b => b.total)) : 0
    const maxServiceRevenue = servicesData.length > 0 ? Math.max(...servicesData.map(s => s.total)) : 0

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Cabecalho de Filtros */}
            <div className="flex justify-between items-center bg-bg-card p-2 rounded-xl border border-border-color shadow-md w-full sm:w-fit">
                {[
                    { id: '7d', label: '7d' },
                    { id: '30d', label: '30d' },
                    { id: '90d', label: '90d' },
                    { id: '1y', label: '1y' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${filter === f.id ? 'bg-accent-color text-white shadow-lg shadow-accent-color/20' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <section className="space-y-4">
                <h2 className="text-xs font-bold text-text-secondary tracking-widest uppercase pb-2 border-b border-border-color">Desempenho Financeiro</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    <KpiCard title="Faturamento Bruto" value={metrics.revenue} previousValue={metrics.prevRevenue} isCurrency={true} icon={<DollarSign className="w-4 h-4"/>} trendData={sparklineRev} />
                    <KpiCard title="Ticket Médio" value={metrics.ticket} previousValue={metrics.prevTicket} isCurrency={true} icon={<TrendingUp className="w-4 h-4"/>} trendData={sparklineTic} />
                    <KpiCard title="Atendimentos" value={metrics.appointments} previousValue={metrics.prevAppointments} isCurrency={false} icon={<CalendarCheck2 className="w-4 h-4"/>} trendData={sparklineApp} />
                    
                    {/* Previsão de Faturamento Card */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                        <Card className="bg-gradient-to-br from-bg-card to-bg-sidebar border-border-color text-text-primary shadow-2xl relative overflow-hidden h-full">
                            <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-accent-color/10 blur-[60px] rounded-full pointer-events-none" />
                            <CardContent className="p-5 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-accent-color">Previsão do Mês</p>
                                        <div className="p-1.5 bg-accent-color/10 rounded-md border border-accent-color/20 text-accent-color">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight text-text-primary mt-1">
                                        <AnimatedNumber value={metrics.projection} isCurrency={true} prefix="R$ " />
                                    </h3>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-xs text-text-secondary">
                                            <span>Estimativa baseada no ritmo atual</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* Grafico de Area Premium */}
            <section className="space-y-4">
                <Card className="col-span-1 lg:col-span-2 bg-bg-card border-border-color overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-6">
                        <CardTitle className="text-text-primary text-base">Evolução do Faturamento</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] p-0 pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-highlight)" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="var(--chart-line)" stopOpacity={0.01}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" opacity={0.6} />
                                <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis 
                                    stroke="var(--chart-axis)" 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(v) => `R$${(v/1000).toFixed(1)}k`}
                                    tickMargin={10}
                                />
                                <RechartsTooltip
                                    cursor={{ stroke: 'var(--chart-grid)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ 
                                        backgroundColor: 'var(--chart-tooltip-bg)', 
                                        borderColor: 'var(--chart-grid)', 
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                        padding: '12px 16px',
                                        color: 'var(--chart-tooltip-text)'
                                    }}
                                    labelStyle={{ color: 'var(--chart-axis)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}
                                    itemStyle={{ color: 'var(--chart-highlight)', fontWeight: 'bold', fontSize: '16px' }}
                                    formatter={(v: any) => [`R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, 'Faturado']}
                                />
                                {avgRevenue > 0 && (
                                    <ReferenceLine y={avgRevenue} stroke="var(--chart-line)" strokeDasharray="3 3" opacity={0.5} />
                                )}
                                {maxRevenuePoint && (
                                    <ReferenceDot x={maxRevenuePoint.name} y={maxRevenuePoint.total} r={5} fill="var(--chart-highlight)" stroke="var(--bg-card)" strokeWidth={2} />
                                )}
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="var(--chart-line)" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorRev)"
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                    activeDot={{ r: 6, fill: 'var(--chart-highlight)', stroke: 'var(--bg-card)', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </section>

            {/* Centro de Insights */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold text-text-secondary tracking-widest uppercase pb-2 border-b border-border-color flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Centro de Insights do Negócio
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {businessInsights.map((insight, idx) => (
                        <Card key={idx} className="bg-bg-sidebar border-border-color text-text-primary shadow-lg">
                            <CardContent className="p-4 flex gap-3 items-start">
                                <div className={`p-2 rounded-full ${insight.type === 'positive' ? 'bg-emerald-500/10' : insight.type === 'alert' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                                    {insight.icon}
                                </div>
                                <div className="text-sm text-text-secondary leading-snug pt-1">
                                    {insight.text}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {businessInsights.length === 0 && (
                        <div className="col-span-3 text-sm text-text-secondary py-8 text-center bg-bg-sidebar rounded-xl border border-border-color">
                            Coletando dados suficientes para gerar insights...
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xs font-bold text-text-secondary tracking-widest uppercase pb-2 border-b border-border-color">Análise de Serviços e Equipe</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BarRanking title="Performance por Profissional" data={barbersData} maxAmount={maxBarberRevenue} />
                    <BarRanking title="Serviços Mais Lucrativos" data={servicesData} maxAmount={maxServiceRevenue} />
                </div>
            </section>

        </div>
    )
}
