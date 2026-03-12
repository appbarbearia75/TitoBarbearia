"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, DollarSign, Settings, Plus, Trash2, Calendar, ChartBar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalBarbershops: 0,
        activeBarbershops: 0,
        grossRevenue: 0,
        totalExpenses: 0,
        netRevenue: 0,
    })

    const [expenses, setExpenses] = useState<any[]>([])
    const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false)
    const [newExpense, setNewExpense] = useState({ name: "", amount: "" })

    const [chartData, setChartData] = useState({ revenue: [], bookings: [], shops: [] })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        setLoading(true)
        const { count: totalBarbershops } = await supabase.from("barbershops").select("*", { count: 'exact', head: true })

        // Fetch active barbershops with created_at and subscription_price
        const { data: shopsData } = await supabase
            .from("barbershops")
            .select("id, name, created_at, subscription_price, is_active")
            .eq("is_active", true)

        // Fetch expenses
        const { data: expensesData } = await supabase
            .from("platform_expenses")
            .select("*")
            .order("created_at", { ascending: true })

        const platformExpenses = expensesData || []
        const totalExpenses = platformExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0)

        const activeShops = shopsData || []
        const grossRevenue = activeShops.reduce((acc, shop) => acc + Number(shop.subscription_price || 0), 0)

        // Bookings for current month
        const startOfCurrentMonth = startOfMonth(new Date()).toISOString()
        const { data: bookingsData } = await supabase
            .from("bookings")
            .select("barbershop_id")
            .gte("date", startOfCurrentMonth)

        const bookingsCountByShop = (bookingsData || []).reduce((acc: any, b) => {
            acc[b.barbershop_id] = (acc[b.barbershop_id] || 0) + 1
            return acc
        }, {})

        const topBookings = activeShops
            .map(shop => ({ name: shop.name.length > 15 ? shop.name.substring(0, 15) + "..." : shop.name, agendamentos: bookingsCountByShop[shop.id] || 0 }))
            .sort((a, b) => b.agendamentos - a.agendamentos)
            .slice(0, 5)

        // Last 6 months history (Revenue & Shops)
        const months = []
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i)
            const monthStr = format(date, "MMM", { locale: ptBR })
            const endMonthDate = endOfMonth(date).getTime()

            let monthRevenue = 0
            let monthShopsCount = 0

            activeShops.forEach(shop => {
                if (new Date(shop.created_at).getTime() <= endMonthDate) {
                    monthShopsCount++
                    monthRevenue += Number(shop.subscription_price || 0)
                }
            })

            months.push({
                name: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
                faturamento: monthRevenue > 0 ? monthRevenue - totalExpenses : 0,
                barbearias: monthShopsCount
            })
        }

        setChartData({
            revenue: months as any,
            shops: months as any,
            bookings: topBookings as any
        })

        setExpenses(platformExpenses)
        setStats({
            totalBarbershops: totalBarbershops || 0,
            activeBarbershops: activeShops.length,
            grossRevenue,
            totalExpenses,
            netRevenue: grossRevenue - totalExpenses
        })
        setLoading(false)
    }

    const handleAddExpense = async () => {
        if (!newExpense.name || !newExpense.amount) return

        const amountNum = Number(newExpense.amount.replace(/\D/g, "")) / 100
        if (amountNum <= 0) return

        const { error } = await supabase.from("platform_expenses").insert({
            name: newExpense.name,
            amount: amountNum
        })

        if (!error) {
            setNewExpense({ name: "", amount: "" })
            fetchStats()
        } else {
            alert("Erro ao salvar despesa")
        }
    }

    const handleDeleteExpense = async (id: string) => {
        const { error } = await supabase.from("platform_expenses").delete().eq("id", id)
        if (!error) {
            fetchStats()
        }
    }

    const formatCurrency = (val: number) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-text-secondary mt-1">Visão geral e faturamento da plataforma</p>
                </div>

                <Dialog open={isExpensesModalOpen} onOpenChange={setIsExpensesModalOpen}>
                    <DialogContent className="bg-bg-card border-border-color text-text-primary max-w-md">
                        <DialogHeader>
                            <DialogTitle>Despesas da Plataforma</DialogTitle>
                            <DialogDescription className="text-neutral-400">
                                Cadastre o custo mensal de servidores, APIs e ferramentas para manter o app online.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-4">
                            <div className="flex gap-2 items-end">
                                <div className="space-y-2 flex-1">
                                    <Label>Nome da Despesa</Label>
                                    <Input
                                        placeholder="Ex: Vercel, Supabase..."
                                        value={newExpense.name}
                                        onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                                        className="bg-bg-input border-border-color"
                                    />
                                </div>
                                <div className="space-y-2 w-32">
                                    <Label>Valor Mensal</Label>
                                    <Input
                                        placeholder="R$ 0,00"
                                        value={newExpense.amount}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "")
                                            const formatted = (Number(value) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                            setNewExpense({ ...newExpense, amount: formatted })
                                        }}
                                        className="bg-bg-input border-border-color"
                                    />
                                </div>
                                <Button onClick={handleAddExpense} className="bg-[#DBC278] hover:bg-[#DBC278]/90 text-black mb-0.5">
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="border border-border-color rounded-md overflow-hidden bg-bg-hover">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border-color hover:bg-transparent">
                                            <TableHead>Despesa</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-6 text-text-muted">Nenhuma despesa cadastrada</TableCell>
                                            </TableRow>
                                        ) : expenses.map(exp => (
                                            <TableRow key={exp.id} className="border-border-color hover:bg-bg-hover">
                                                <TableCell className="font-medium">{exp.name}</TableCell>
                                                <TableCell className="text-right text-red-400">{formatCurrency(Number(exp.amount))}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-red-400" onClick={() => handleDeleteExpense(exp.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="pt-2 flex justify-between items-center bg-bg-hover px-4 py-3 rounded-md border border-border-color">
                                <span className="text-sm font-medium text-text-secondary">Total de Custos</span>
                                <span className="font-bold text-red-400">{formatCurrency(stats.totalExpenses)}</span>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Barbearias"
                    value={stats.totalBarbershops}
                    icon={<Users className="w-4 h-4 text-neutral-400" />}
                />
                <StatCard
                    title="Barbearias Ativas"
                    value={stats.activeBarbershops}
                    icon={<TrendingUp className="w-4 h-4 text-[#DBC278]" />}
                />
                <StatCard
                    title="Lucro Mensal (Líquido)"
                    value={formatCurrency(stats.netRevenue)}
                    icon={<DollarSign className="w-4 h-4 text-[#DBC278]" />}
                    desc={`Bruto: ${formatCurrency(stats.grossRevenue)}`}
                />
                <StatCard
                    title="Despesas Mensais"
                    value={formatCurrency(stats.totalExpenses)}
                    icon={<Settings className="w-4 h-4 text-red-400" />}
                    desc="Clique aqui para configurar despesas"
                    onClick={() => setIsExpensesModalOpen(true)}
                />
            </div>

            {/* Charts Section */}
            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                    {/* Faturamento Chart */}
                    <Card className="bg-bg-card border-border-color text-text-primary">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-[#DBC278]" />
                                Histórico de Lucro Líquido
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData.revenue}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            stroke="var(--chart-axis)"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `R$ ${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-grid)', borderRadius: '8px' }}
                                            formatter={(value: any) => [formatCurrency(value), "Lucro"]}
                                        />
                                        <Line type="monotone" dataKey="faturamento" stroke="var(--chart-line)" strokeWidth={3} dot={{ fill: "var(--chart-line)", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bookings current month */}
                    <Card className="bg-bg-card border-border-color text-text-primary">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#DBC278]" />
                                Top Barbearias (Neste mês)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.bookings} layout="vertical" margin={{ left: 0, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={true} vertical={false} />
                                        <XAxis type="number" stroke="var(--chart-axis)" fontSize={12} hide />
                                        <YAxis dataKey="name" type="category" stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-grid)', borderRadius: '8px' }}
                                            formatter={(value: any) => [value, "Agendamentos"]}
                                            cursor={{ fill: 'var(--chart-cursor-bg)' }}
                                        />
                                        <Bar dataKey="agendamentos" fill="var(--chart-bar)" radius={[0, 4, 4, 0]} barSize={24}>
                                            <LabelList dataKey="agendamentos" position="right" fill="var(--chart-bar)" fontSize={12} className="font-bold" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Barbershops Growth */}
                    <Card className="bg-bg-card border-border-color text-text-primary lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <ChartBar className="w-5 h-5 text-[#DBC278]" />
                                Crescimento de Barbearias Ativas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.shops}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-grid)', borderRadius: '8px' }}
                                            formatter={(value: any) => [value, "Barbearias"]}
                                            cursor={{ fill: 'var(--chart-cursor-bg)' }}
                                        />
                                        <Bar dataKey="barbearias" fill="var(--chart-bar)" radius={[4, 4, 0, 0]} barSize={40}>
                                            <LabelList dataKey="barbearias" position="top" fill="var(--chart-bar)" fontSize={12} className="font-bold" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

function StatCard({ title, value, icon, desc, onClick }: { title: string, value: string | number, icon: React.ReactNode, desc?: string, onClick?: () => void }) {
    return (
        <Card
            className={`bg-bg-card border-border-color text-text-primary relative overflow-hidden ${onClick ? 'cursor-pointer hover:border-border-color/80 hover:bg-bg-hover transition-all' : ''}`}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium z-10">
                    {title}
                </CardTitle>
                <div className="z-10 bg-bg-hover p-2 rounded-md">{icon}</div>
            </CardHeader>
            <CardContent className="z-10 relative">
                <div className="text-2xl font-bold">{value}</div>
                {desc && <p className="text-xs text-text-muted mt-1">{desc}</p>}
            </CardContent>
            {/* Soft glow background */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-bg-hover rounded-full blur-2xl z-0 pointer-events-none" />
        </Card>
    )
}
