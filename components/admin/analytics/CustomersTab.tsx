"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, LabelList } from "recharts"
import { Loader2, Users, AlertTriangle, Crown, Target, Lightbulb, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"

export function CustomersTab({ slug }: { slug: string }) {
    const [loading, setLoading] = useState(true)
    const [retention, setRetention] = useState({ r30: 0, r60: 0, r90: 0 })
    const [riskClients, setRiskClients] = useState<any[]>([])
    const [topClients, setTopClients] = useState<any[]>([])
    const [distribution, setDistribution] = useState<any[]>([])
    const [frequencyData, setFrequencyData] = useState<any[]>([])
    const [customerInsights, setCustomerInsights] = useState<any[]>([])
    const [totalClientsCount, setTotalClientsCount] = useState(0)

    useEffect(() => {
        fetchCustomerData()
    }, [slug])

    const fetchCustomerData = async () => {
        setLoading(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id, name').eq('slug', slug).single()
            if (!barbershop) return

            // Puxar todos os agendamentos dos últimos 12 meses
            const dateLimit = new Date()
            dateLimit.setMonth(dateLimit.getMonth() - 12)
            const dateLimitStr = dateLimit.toISOString()

            const { data: bookings } = await supabase
                .from('bookings')
                .select(`id, date, customer_name, customer_phone, status, price:services(price)`)
                .eq('barbershop_id', barbershop.id)
                .gte('date', dateLimitStr)
                .order('date', { ascending: false })

            if (!bookings) return

            const now = new Date()
            const clientsMap = new Map<string, any>()

            let totalCurrentMonthRevenue = 0
            let recurrentRevenue = 0

            bookings.forEach(b => {
                if (!b.customer_phone || b.status !== 'completed') return
                const bDate = new Date(b.date + 'T00:00:00')
                const price = Number((b.price as any)?.price || 0)

                // Pra tracking de faturamento de retenção
                if (bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear()) {
                    totalCurrentMonthRevenue += price
                }

                if (!clientsMap.has(b.customer_phone)) {
                    clientsMap.set(b.customer_phone, {
                        name: b.customer_name,
                        phone: b.customer_phone,
                        lastVisit: bDate,
                        totalSpent: price,
                        visits: 1,
                        visitsLast30: 0,
                        isVip: false
                    })
                } else {
                    const c = clientsMap.get(b.customer_phone)
                    if (bDate > c.lastVisit) c.lastVisit = bDate
                    c.totalSpent += price
                    c.visits += 1
                }
                
                // Track if visit was in last 30 days
                const diffTime = Math.abs(now.getTime() - bDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                if (diffDays <= 30) {
                    clientsMap.get(b.customer_phone).visitsLast30 += 1
                }
            })

            const allClients = Array.from(clientsMap.values())
            const totalClients = allClients.length || 1
            setTotalClientsCount(allClients.length)

            // 1. Distribuição
            let countVip = 0, countRecorrentes = 0, countNovos = 0, countInativos = 0
            
            // 2. Risco
            const atRisk: any[] = []
            
            // 3. Retenção
            let r30 = 0, r60 = 0, r90 = 0
            
            // 4. Frequencia
            let freq1x = 0, freq2x = 0, freqOcasionais = 0

            allClients.forEach(c => {
                const diffTime = Math.abs(now.getTime() - c.lastVisit.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                // Distribuição
                if (c.totalSpent >= 500) { countVip++; c.isVip = true }
                else if (c.visits >= 3 && diffDays <= 60) countRecorrentes++
                else if (c.visits === 1 && diffDays <= 30) countNovos++
                else if (diffDays > 90) countInativos++

                // Track recurrent revenue
                if (c.visits >= 2 && c.visitsLast30 > 0) {
                    recurrentRevenue += c.totalSpent // Approximation for Insight purpose
                }

                // Risco (Clients with multiple visits but absent)
                if (c.visits >= 2 && diffDays >= 30 && diffDays <= 90) {
                    atRisk.push({...c, daysAway: diffDays})
                }

                if (diffDays <= 30) r30++
                if (diffDays <= 60 && diffDays > 30) r60++
                if (diffDays <= 90 && diffDays > 60) r90++

                if (c.visitsLast30 === 1) freq1x++
                else if (c.visitsLast30 >= 2) freq2x++
                else freqOcasionais++
            })

            setDistribution([
                { name: 'VIP', value: countVip, color: '#DBC278' },
                { name: 'Recorrentes', value: countRecorrentes, color: '#3b82f6' },
                { name: 'Novos', value: countNovos, color: '#10b981' },
                { name: 'Inativos', value: countInativos, color: '#ef4444' }
            ])

            const r30Pct = Math.round((r30 / totalClients) * 100)
            setRetention({
                r30: r30Pct,
                r60: Math.round((r60 / totalClients) * 100),
                r90: Math.round((r90 / totalClients) * 100),
            })

            setFrequencyData([
                { name: '1x ao Mês', value: freq1x },
                { name: '2x+ ao Mês', value: freq2x },
                { name: 'Ocasionais', value: freqOcasionais }
            ])
            
            const sortedRisk = atRisk.sort((a,b) => b.totalSpent - a.totalSpent).slice(0, 10) // Display top 10 churn risk
            setRiskClients(sortedRisk)
            
            // Top clients last 30 days
            setTopClients(allClients
                .filter(c => (Math.ceil(Math.abs(now.getTime() - c.lastVisit.getTime()) / (1000 * 60 * 60 * 24))) <= 30)
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 10))

            // Gerar Insights Automáticos de Cliente
            const insights = []
            if (r30Pct > 50) {
                insights.push({ icon: <Users className="text-emerald-500 w-4 h-4"/>, text: `${r30Pct}% da base de clientes visitou a barbearia nos últimos 30 dias. Excelente métrica de saúde.`, type: 'positive' })
            }
            
            const vipsAtRisk = sortedRisk.filter(c => c.isVip).length
            if (vipsAtRisk > 0) {
                insights.push({ icon: <AlertTriangle className="text-red-500 w-4 h-4"/>, text: `${vipsAtRisk} cliente(s) VIP de alto LTV não retornam há mais de 45 dias.`, type: 'alert' })
            }

            if (recurrentRevenue > 0 && totalCurrentMonthRevenue > 0) {
                const recPct = Math.round((recurrentRevenue / (totalCurrentMonthRevenue > 0 ? totalCurrentMonthRevenue : 1)) * 100)
                if (recPct > 60) {
                    insights.push({ icon: <Crown className="text-amber-500 w-4 h-4"/>, text: `Clientes recorrentes estimam mais de 60% do seu fluxo. Base estabilizada.`, type: 'info' })
                }
            }

            setCustomerInsights(insights)

        } catch (error) {
            console.error("Error fetching customers", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#DBC278]" /></div>

    const getInitials = (name: string) => name ? name.substring(0,2).toUpperCase() : 'CC'

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Secao de Insights de Cliente */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold text-neutral-500 tracking-widest uppercase pb-2 border-b border-white/5 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Inteligência de Base
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {customerInsights.map((insight, idx) => (
                        <Card key={idx} className="bg-bg-card border-border-color text-text-primary shadow-lg">
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
                    {customerInsights.length === 0 && (
                        <div className="col-span-3 text-sm text-text-secondary py-8 text-center bg-bg-card rounded-xl border border-border-color">
                            Sua base de clientes ainda está em desenvolvimento.
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xs font-bold text-text-secondary tracking-widest uppercase pb-2 border-b border-border-color">Métricas de Saúde</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-bg-card border-border-color shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                <Target className="w-4 h-4 text-emerald-500" />
                                Retenção Curta (30 Dias)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-text-primary">{retention.r30}%</div>
                            <p className="text-xs text-text-secondary mt-1">Porcentagem recém ativa</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-bg-card border-border-color shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                <Target className="w-4 h-4 text-amber-500" />
                                Retenção Média (60 Dias)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-text-primary">{retention.r60}%</div>
                            <p className="text-xs text-text-secondary mt-1">Perdendo contato</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-bg-card border-border-color shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                <Target className="w-4 h-4 text-red-500" />
                                Retenção Fria (90 Dias)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-text-primary">{retention.r90}%</div>
                            <p className="text-xs text-text-secondary mt-1">Considerados perdidos/inativos</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xs font-bold text-text-secondary tracking-widest uppercase pb-2 border-b border-border-color flex-1">Gráficos Demográficos</h2>
                    <div className="text-right">
                        <p className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-0.5">Clientes Ativos</p>
                        <p className="text-xl font-bold text-text-primary leading-none">{totalClientsCount}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-bg-card border-border-color">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-text-primary text-sm font-semibold">Distribuição de Clientes</CardTitle>
                            <p className="text-xs text-text-secondary mt-0.5">Base atual de clientes</p>
                        </CardHeader>
                        <CardContent className="h-[280px] flex items-center p-6 pt-0">
                            <div className="w-[60%] h-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                                            {distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'var(--chart-tooltip-bg)', 
                                                borderColor: 'var(--chart-grid)', 
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                                padding: '12px 16px',
                                                color: 'var(--chart-tooltip-text)'
                                            }} 
                                            itemStyle={{ color: 'var(--chart-tooltip-text)', fontWeight: 'bold' }} 
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-text-primary">{totalClientsCount}</span>
                                    <span className="text-[9px] text-text-secondary uppercase tracking-wider font-semibold mt-1">Clientes</span>
                                </div>
                            </div>
                            <div className="w-[40%] flex flex-col justify-center gap-4 pl-4">
                                {distribution.map((entry, index) => (
                                    <div key={index} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                            <span className="text-text-secondary font-medium">{entry.name}</span>
                                        </div>
                                        <span className="text-text-primary font-semibold">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-bg-card border-border-color">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-text-primary text-sm font-semibold">Frequência de Visitas</CardTitle>
                            <p className="text-xs text-text-secondary mt-0.5">Estimativa baseada no histórico de agendamentos</p>
                        </CardHeader>
                        <CardContent className="h-[280px] flex flex-col justify-center p-6 gap-6">
                            {frequencyData.map((item, i) => {
                                const maxVal = Math.max(...frequencyData.map(d => d.value), 1)
                                const pct = (item.value / maxVal) * 100
                                return (
                                    <div key={i} className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-xs items-end">
                                            <span className="text-text-secondary font-medium">{item.name}</span>
                                            <span className="text-text-primary font-bold">{item.value}</span>
                                        </div>
                                        <div className="w-full bg-border-color rounded-full h-2.5 overflow-hidden">
                                            <motion.div 
                                                className="h-full rounded-full bg-[#3b82f6]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xs font-bold text-text-secondary tracking-widest uppercase pb-2 border-b border-border-color">Performance e Churn</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ranking de Clientes */}
                    <Card className="bg-bg-sidebar border-border-color relative overflow-hidden h-fit">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-color/5 blur-[50px] rounded-full pointer-events-none" />
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-text-primary">
                                <Crown className="w-5 h-5 text-accent-color" />
                                Top Clientes VIP (LTV)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {topClients.length === 0 ? (
                                    <p className="text-sm text-text-secondary py-4">Sem dados no mês atual.</p>
                                ) : topClients.map((c, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        transition={{ duration: 0.3, delay: i * 0.05 }}
                                        key={i} 
                                        className={`flex justify-between items-center p-3 rounded-lg border ${i < 3 ? 'bg-accent-color/5 border-accent-color/20' : 'bg-transparent border-transparent hover:bg-hover-bg'}`}
                                    >
                                        <div className="flex items-center gap-3 w-3/4">
                                            <div className="w-6 text-center text-xs font-bold text-text-secondary">#{i + 1}</div>
                                            <div className="w-9 h-9 shrink-0 rounded-full bg-bg-card flex items-center justify-center border border-border-color text-xs font-bold text-accent-color shadow-inner">
                                                {getInitials(c.name)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="text-sm font-medium text-text-primary truncate">{c.name}</div>
                                                <div className="text-[11px] text-text-secondary mt-0.5">{c.visits} visitas (Top {i+1})</div>
                                            </div>
                                        </div>
                                        <div className="text-emerald-500 font-bold text-sm shrink-0">
                                            R$ {c.totalSpent.toLocaleString('pt-BR', {minimumFractionDigits: 0})}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Prevenção a Churn */}
                    <Card className="bg-bg-sidebar border-border-color relative overflow-hidden h-fit bg-gradient-to-br from-bg-sidebar to-orange-950/10 dark:to-[#120000]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none" />
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-text-primary">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Clientes em Risco (Churn)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {riskClients.length === 0 ? (
                                    <p className="text-sm text-text-secondary py-4">Sua base está engajada hoje. Nenhum risco detectado.</p>
                                ) : riskClients.map((c, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        transition={{ duration: 0.3, delay: i * 0.05 }}
                                        key={i} 
                                        className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3 rounded-lg hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 text-xs font-bold text-red-500">
                                                {getInitials(c.name)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-text-primary">{c.name}</div>
                                                <div className="text-[11px] text-text-secondary mt-0.5"><span className="text-red-500 font-medium">Sumido: {c.daysAway} dias</span> • Gasto: R$ {c.totalSpent}</div>
                                            </div>
                                        </div>
                                        <a 
                                            href={`https://wa.me/55${c.phone.replace(/\D/g, '')}?text=Olá ${c.name.split(' ')[0]}! Tudo bem? Faz ${c.daysAway} dias que não te vemos na barbearia. Preparamos um horário especial pra você!`} 
                                            target="_blank" 
                                            className="ml-12 sm:ml-0 bg-transparent hover:bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-medium text-[11px] px-3 py-1.5 rounded-md flex items-center gap-1.5 justify-center sm:w-auto w-fit transition-all opacity-80 group-hover:opacity-100"
                                            rel="noreferrer"
                                        >
                                            <MessageCircle className="w-3 h-3" />
                                            Recuperar LTV
                                        </a>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    )
}
