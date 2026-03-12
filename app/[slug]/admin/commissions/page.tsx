"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarIcon, TrendingUp, DollarSign, Percent, Copy, Check, Eye, Users, Scissors, Package, Wallet, Settings, Download, Trophy, Clock, Search, Save, Loader2, User, AlertTriangle, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, setDate } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, LabelList } from "recharts"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"

import { supabase } from "@/lib/supabase"

export default function CommissionsPage() {
    const params = useParams()
    const slug = params.slug as string

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [barberFilter, setBarberFilter] = useState<string>("all")
    const [recentlyPaid, setRecentlyPaid] = useState<string[]>([])
    const [dateRange, setDateRange] = useState("thisMonth")
    const [customStart, setCustomStart] = useState("")
    const [customEnd, setCustomEnd] = useState("")
    const [barbersList, setBarbersList] = useState<any[]>([])

    const [selectedBarberDetails, setSelectedBarberDetails] = useState<any>(null)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)

    // Configuration Modal States
    const [configModalOpen, setConfigModalOpen] = useState(false)
    const [configBarbers, setConfigBarbers] = useState<any[]>([])
    const [savingConfig, setSavingConfig] = useState(false)
    const [isPaying, setIsPaying] = useState(false)
    const [payingBarberId, setPayingBarberId] = useState<string | null>(null)
    const [prevData, setPrevData] = useState<Record<string, number>>({})

    // Payment Registration Modal
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedPaymentBarber, setSelectedPaymentBarber] = useState<{ id: string, name: string, amount: number } | null>(null)
    const [paymentMethod, setPaymentMethod] = useState("dinheiro")

    // Vale Modal states
    const [valeModalOpen, setValeModalOpen] = useState(false)
    const [valeAmount, setValeAmount] = useState("")

    // Toast notification
    const [toast, setToast] = useState<{ name: string, amount: number } | null>(null)
    const showToast = (name: string, amount: number) => {
        setToast({ name, amount });
        setTimeout(() => setToast(null), 4000);
    }

    useEffect(() => {
        fetchBarbersList()
    }, [slug])

    useEffect(() => {
        if (dateRange === "custom" && (!customStart || !customEnd)) return;
        fetchCommissions()
    }, [slug, dateRange, barberFilter, customStart, customEnd])

    const fetchBarbersList = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            const { data: barbers } = await supabase.from('barbers').select('id, name').eq('barbershop_id', barbershop.id).order('name')
            if (barbers) setBarbersList(barbers)
        }
    }

    const fetchCommissions = async () => {
        setLoading(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            let start = ""
            let end = ""
            const now = new Date()

            if (dateRange === "today") {
                start = format(now, 'yyyy-MM-dd')
                end = format(now, 'yyyy-MM-dd')
            } else if (dateRange === "thisWeek") {
                start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            } else if (dateRange === "lastWeek") {
                const prevW = subDays(startOfWeek(now, { weekStartsOn: 1 }), 1)
                start = format(startOfWeek(prevW, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                end = format(endOfWeek(prevW, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            } else if (dateRange === "firstHalf") {
                start = format(startOfMonth(now), 'yyyy-MM-dd')
                end = format(setDate(now, 15), 'yyyy-MM-dd')
            } else if (dateRange === "secondHalf") {
                start = format(setDate(now, 16), 'yyyy-MM-dd')
                end = format(endOfMonth(now), 'yyyy-MM-dd')
            } else if (dateRange === "thisMonth") {
                start = format(startOfMonth(now), 'yyyy-MM-dd')
                end = format(endOfMonth(now), 'yyyy-MM-dd')
            } else if (dateRange === "lastMonth") {
                const prev = subMonths(now, 1)
                start = format(startOfMonth(prev), 'yyyy-MM-dd')
                end = format(endOfMonth(prev), 'yyyy-MM-dd')
            } else if (dateRange === "custom") {
                start = customStart
                end = customEnd
            }

            const queryParams = new URLSearchParams({
                barbershop_id: barbershop.id,
                startDate: start,
                endDate: end,
                barberId: barberFilter
            })

            // Compute previous period for % comparison
            let prevStart = ""
            let prevEnd = ""
            if (dateRange === "today") {
                prevStart = format(subDays(now, 1), 'yyyy-MM-dd')
                prevEnd = format(subDays(now, 1), 'yyyy-MM-dd')
            } else if (dateRange === "thisWeek") {
                const prevW = subDays(startOfWeek(now, { weekStartsOn: 1 }), 1)
                prevStart = format(startOfWeek(prevW, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                prevEnd = format(endOfWeek(prevW, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            } else if (dateRange === "lastWeek") {
                const prev2W = subDays(startOfWeek(subDays(startOfWeek(now, { weekStartsOn: 1 }), 1), { weekStartsOn: 1 }), 1)
                prevStart = format(startOfWeek(prev2W, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                prevEnd = format(endOfWeek(prev2W, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            } else if (dateRange === "firstHalf") {
                const prevM = subMonths(now, 1)
                prevStart = format(startOfMonth(prevM), 'yyyy-MM-dd')
                prevEnd = format(setDate(prevM, 15), 'yyyy-MM-dd')
            } else if (dateRange === "secondHalf") {
                const prevM = subMonths(now, 1)
                prevStart = format(setDate(prevM, 16), 'yyyy-MM-dd')
                prevEnd = format(endOfMonth(prevM), 'yyyy-MM-dd')
            } else if (dateRange === "thisMonth") {
                const prev = subMonths(now, 1)
                prevStart = format(startOfMonth(prev), 'yyyy-MM-dd')
                prevEnd = format(endOfMonth(prev), 'yyyy-MM-dd')
            } else if (dateRange === "lastMonth") {
                const prev2 = subMonths(now, 2)
                prevStart = format(startOfMonth(prev2), 'yyyy-MM-dd')
                prevEnd = format(endOfMonth(prev2), 'yyyy-MM-dd')
            } else if (dateRange === "custom" && start && end) {
                const startDt = new Date(start)
                const endDt = new Date(end)
                const diffMs = endDt.getTime() - startDt.getTime()
                const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
                const prevEndDt = new Date(startDt)
                prevEndDt.setDate(prevEndDt.getDate() - 1)
                const prevStartDt = new Date(prevEndDt)
                prevStartDt.setDate(prevStartDt.getDate() - diffDays + 1)
                prevStart = format(prevStartDt, 'yyyy-MM-dd')
                prevEnd = format(prevEndDt, 'yyyy-MM-dd')
            }

            const prevQueryParams = prevStart ? new URLSearchParams({
                barbershop_id: barbershop.id,
                startDate: prevStart,
                endDate: prevEnd,
                barberId: barberFilter
            }) : null

            const [response, prevResponse] = await Promise.all([
                fetch(`/api/commissions?${queryParams}`),
                prevQueryParams ? fetch(`/api/commissions?${prevQueryParams}`) : Promise.resolve(null)
            ])

            const result = await response.json()
            const prevResult = prevResponse ? await prevResponse.json() : null

            if (result.error) {
                console.error(result.error)
            } else {
                setData(result)
                // Build a map: barberId -> prevRevenue
                if (prevResult && prevResult.barbers) {
                    const map: Record<string, number> = {}
                    prevResult.barbers.forEach((b: any) => { map[b.id] = b.totalRevenue })
                    setPrevData(map)
                } else {
                    setPrevData({})
                }
            }
        } catch (error) {
            console.error("Error fetching commissions:", error)
        } finally {
            setLoading(false)
        }
    }

    const openConfigModal = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            const { data } = await supabase.from('barbers').select('id, name, commission_type, commission_value').eq('barbershop_id', barbershop.id).order('name')
            if (data) {
                const formatted = data.map((b: any) => {
                    const cType = b.commission_type || 'percentage'
                    const cVal = parseFloat(b.commission_value) || 0

                    let displayValue = ''
                    if (cType === 'percentage') {
                        displayValue = cVal.toString()
                    } else {
                        displayValue = cVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                    return { ...b, commission_type: cType, commission_value: displayValue }
                })
                setConfigBarbers(formatted)
            }
        }
        setConfigModalOpen(true)
    }

    const handleConfigTypeChange = (id: string, newType: string) => {
        setConfigBarbers(prev => prev.map(b => {
            if (b.id !== id) return b;
            return {
                ...b,
                commission_type: newType,
                commission_value: newType === 'percentage' ? '0' : '0,00'
            }
        }))
    }

    const handleConfigValueChange = (id: string, type: string, value: string) => {
        setConfigBarbers(prev => prev.map(b => {
            if (b.id !== id) return b;

            let newValue = value;
            if (type === 'percentage') {
                newValue = newValue.replace(/\D/g, '')
                if (newValue === '') newValue = '0'
                const intVal = parseInt(newValue, 10)
                if (intVal > 100) newValue = '100'
                else newValue = intVal.toString()
            } else if (type === 'fixed') {
                const numericOnly = value.replace(/\D/g, '')
                if (numericOnly === '') {
                    newValue = '0,00'
                } else {
                    const numberVal = parseInt(numericOnly, 10) / 100
                    newValue = numberVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
            }
            return { ...b, commission_value: newValue }
        }))
    }

    const saveConfig = async () => {
        setSavingConfig(true)
        try {
            for (const b of configBarbers) {
                let numericValue = 0;
                if (b.commission_type === 'percentage') {
                    numericValue = parseFloat(b.commission_value) || 0;
                } else {
                    const cleaned = b.commission_value.toString().replace(/\./g, '').replace(',', '.')
                    numericValue = parseFloat(cleaned) || 0;
                }

                await supabase.from('barbers').update({
                    commission_type: b.commission_type,
                    commission_value: numericValue
                }).eq('id', b.id)
            }
            setConfigModalOpen(false)
            fetchCommissions() // refresh data immediately
        } catch (error) {
            console.error("Error saving config:", error)
            alert("Erro ao salvar configurações.")
        }
        setSavingConfig(false)
    }

    const openPaymentModal = (barberId: string, name: string, amount: number) => {
        setSelectedPaymentBarber({ id: barberId, name, amount });
        setPaymentMethod("dinheiro"); // reset default
        setPaymentModalOpen(true);
    };

    const confirmPayment = async () => {
        if (!selectedPaymentBarber) return;
        setIsPaying(true);
        setPayingBarberId(selectedPaymentBarber.id);

        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) throw new Error("Barbearia não encontrada");

            const response = await fetch('/api/commissions/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbershop_id: barbershop.id,
                    barber_id: selectedPaymentBarber.id,
                    amount: selectedPaymentBarber.amount,
                    method: paymentMethod // Future: record payment method in DB
                })
            })

            const payResponse = await fetch('/api/commissions/pay', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbershop_id: barbershop.id,
                    barber_id: selectedPaymentBarber.id,
                })
            })

            if (response.ok && payResponse.ok) {
                const paidName = selectedPaymentBarber.name;
                const paidAmount = selectedPaymentBarber.amount;
                setRecentlyPaid(prev => [...prev, selectedPaymentBarber.id]);
                setTimeout(() => {
                    setRecentlyPaid(prev => prev.filter(id => id !== selectedPaymentBarber?.id))
                }, 5000);
                await fetchCommissions()
                setPaymentModalOpen(false)
                showToast(paidName, paidAmount);
            } else {
                alert("Erro ao registrar pagamento.")
            }
        } catch (error) {
            console.error("Error confirming payment:", error)
            alert("Erro ao registrar pagamento.")
        }
        setIsPaying(false);
        setPayingBarberId(null);
        setSelectedPaymentBarber(null);
    }

    const handlePayAll = () => {
        if (!selectedBarberDetails) return;
        openPaymentModal(selectedBarberDetails.id, selectedBarberDetails.name, selectedBarberDetails.totalCommission)
    }

    const submitValeDiscount = async () => {
        if (!selectedBarberDetails || !valeAmount) return;
        const v = parseFloat(valeAmount.replace(',', '.'));
        if (isNaN(v) || v <= 0) return;
        openPaymentModal(selectedBarberDetails.id, selectedBarberDetails.name, selectedBarberDetails.totalCommission - v);
    }

    const handleAbaterVale = () => {
        const numericOnly = valeAmount.replace(/\D/g, '')
        const numVal = parseInt(numericOnly, 10) / 100
        if (!numVal || numVal <= 0) return alert("Digite um valor válido.");
        openPaymentModal(selectedBarberDetails.id, selectedBarberDetails.name, numVal);
    }

    const handleValeChange = (val: string) => {
        const numericOnly = val.replace(/\D/g, '')
        if (!numericOnly) {
            setValeAmount("")
            return
        }
        let numberVal = parseInt(numericOnly, 10) / 100

        if (selectedBarberDetails && numberVal > selectedBarberDetails.totalCommission) {
            numberVal = selectedBarberDetails.totalCommission
        }

        setValeAmount(numberVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    }

    const exportGeneralCSV = () => {
        if (!data || !data.barbers) return;

        const headers = ["Profissional", "Cargo", "Atendimentos", "Faturamento (R$)", "Comissao Pendente (R$)", "Comissao Paga (R$)"];
        const rows = data.barbers.map((b: any) => [
            b.name,
            b.role || "Funcionario",
            b.totalAppointments,
            b.totalRevenue.toFixed(2).replace('.', ','),
            b.totalCommission.toFixed(2).replace('.', ','),
            b.totalCommissionPaid.toFixed(2).replace('.', ',')
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map((r: any[]) => r.join(";"))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `comissoes_geral_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const exportDetailedCSV = () => {
        if (!selectedBarberDetails) return;

        const headers = ["Data", "Horario", "Cliente", "Serviço", "Valor (R$)", "Comissao (R$)", "Status"];
        const rows = selectedBarberDetails.appointmentsList.map((app: any) => [
            new Date(app.date).toLocaleDateString('pt-BR'),
            app.time,
            app.clientName,
            app.service,
            app.value.toFixed(2).replace('.', ','),
            app.commission.toFixed(2).replace('.', ','),
            app.isPaid ? 'Pago' : (app.paidAmount > 0 ? 'Pago Parcial' : 'Pendente')
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map((r: any[]) => r.join(";"))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `comissoes_${selectedBarberDetails.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const getPeriodText = () => {
        if (dateRange === "today") return "Hoje";
        if (dateRange === "thisWeek") return "Esta Semana";
        if (dateRange === "lastWeek") return "Semana Passada";
        if (dateRange === "firstHalf") return "1ª Quinzena (" + format(new Date(), "MMMM yyyy", { locale: ptBR }) + ")";
        if (dateRange === "secondHalf") return "2ª Quinzena (" + format(new Date(), "MMMM yyyy", { locale: ptBR }) + ")";
        if (dateRange === "thisMonth") return format(new Date(), "MMMM yyyy", { locale: ptBR });
        if (dateRange === "lastMonth") return format(subMonths(new Date(), 1), "MMMM yyyy", { locale: ptBR });
        if (dateRange === "custom") return `De ${new Date(customStart + "T12:00:00").toLocaleDateString('pt-BR')} até ${new Date(customEnd + "T12:00:00").toLocaleDateString('pt-BR')}`;
        return "";
    }

    // Loading skeleton
    const Skeleton = ({ className }: { className?: string }) => (
        <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
    )

    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 bg-green-900/90 backdrop-blur-sm border border-green-500/30 rounded-xl px-4 py-3 shadow-2xl shadow-green-900/50">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-green-300">Pagamento registrado</p>
                            <p className="text-xs text-green-400/70">{toast.name} recebeu {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toast.amount)}</p>
                        </div>
                    </div>
                </div>
            )}
            {/* === MINIMAL HEADER === */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Comissões</h1>
                    <p className="text-zinc-500 text-sm mt-0.5 flex items-center gap-1.5 capitalize">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {getPeriodText()}
                    </p>
                </div>
                {/* Controls: wrap naturally */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {dateRange === "custom" && (
                            <div className="flex items-center gap-1.5">
                                <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-zinc-900 border-white/10 w-[115px] sm:w-[130px] text-xs h-8" />
                                <span className="text-zinc-500 text-xs text-center shrink-0">a</span>
                                <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-zinc-900 border-white/10 w-[115px] sm:w-[130px] text-xs h-8" />
                            </div>
                        )}
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-white/10 flex-1 sm:flex-none sm:w-[135px] gap-1">
                                <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent className="bg-bg-card border-border-color text-text-primary text-sm">
                                <SelectItem value="today">Hoje</SelectItem>
                                <SelectItem value="thisWeek">Esta Semana</SelectItem>
                                <SelectItem value="lastWeek">Semana Passada</SelectItem>
                                <SelectItem value="firstHalf">1ª Quinzena</SelectItem>
                                <SelectItem value="secondHalf">2ª Quinzena</SelectItem>
                                <SelectItem value="thisMonth">Este Mês</SelectItem>
                                <SelectItem value="lastMonth">Mês Passado</SelectItem>
                                <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={barberFilter} onValueChange={setBarberFilter}>
                            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-white/10 flex-1 sm:flex-none sm:w-[180px] gap-1">
                                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <SelectValue placeholder="Todos profissionais" />
                            </SelectTrigger>
                            <SelectContent className="bg-bg-card border-border-color text-text-primary text-sm max-h-[300px]">
                                <SelectItem value="all">Todos profissionais</SelectItem>
                                {barbersList.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-400 hover:text-white border border-white/10 px-2.5" onClick={openConfigModal}>
                                <Settings className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-green-400 hover:text-green-300 border border-green-500/20 bg-green-500/5 px-2.5" onClick={exportGeneralCSV} disabled={loading || !data}>
                                <Download className="w-3.5 h-3.5 mr-1" />
                                CSV
                            </Button>
                        </div>
                    </div>
                </div>
            </div>


            {loading ? (
                <div className="space-y-4">
                    {/* Skeleton Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                                <Skeleton className="h-3 w-24 mb-3" />
                                <Skeleton className="h-7 w-20" />
                            </div>
                        ))}
                    </div>
                    {/* Skeleton Action Block */}
                    <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                        <Skeleton className="h-4 w-48 mb-4" />
                        <div className="space-y-3">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-7 w-28 rounded-lg" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Skeleton Table */}
                    <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                        <div className="border-b border-white/5 p-4">
                            <Skeleton className="h-4 w-40" />
                        </div>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="flex items-center gap-6">
                                    <Skeleton className="h-3 w-12 hidden md:block" />
                                    <Skeleton className="h-3 w-16 hidden md:block" />
                                    <Skeleton className="h-3 w-14" />
                                    <Skeleton className="h-7 w-20 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : !data ? (
                <div className="text-center py-20 text-text-muted bg-bg-card-hover rounded-2xl border border-border-color">
                    Não foi possível carregar os dados.
                </div>
            ) : (
                <>
                    {/* === COMPACT SUMMARY CARDS (Linear-style) === */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* 1st card - PRIMARY - destaque com glow */}
                        <div className="relative bg-bg-card border border-yellow-500/40 rounded-xl p-3 overflow-hidden hover:border-yellow-500/70 hover:scale-[1.01] transition-all duration-200 shadow-sm col-span-1 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/8 to-transparent pointer-events-none" />
                            <div>
                                <div className="flex items-center gap-1.5 h-4 mb-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                    <h2 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider leading-none truncate w-full">Comissões Pendentes</h2>
                                </div>
                                <p className="text-xl sm:text-2xl font-black text-text-primary tabular-nums tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.summary.totalCommissionsPending)}</p>
                            </div>
                            <div className="mt-1">
                                {data.summary.totalCommissionsPending > 0
                                    ? <p className="text-[10px] text-yellow-500/70 leading-none truncate">Aguardando pagamento</p>
                                    : <p className="text-[10px] text-green-500/70 leading-none truncate">Tudo acertado ✓</p>
                                }
                            </div>
                        </div>

                        {/* 2nd card */}
                        <div className="bg-bg-card border border-border-color rounded-xl p-3 hover:border-green-500/20 hover:bg-bg-card-hover hover:scale-[1.01] transition-all duration-200 col-span-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 h-4 mb-1">
                                    <h2 className="text-[10px] font-bold text-green-500 uppercase tracking-wider leading-none truncate w-full">Total Gerado</h2>
                                </div>
                                <p className="text-xl sm:text-2xl font-black text-text-primary tabular-nums tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.summary.totalCommissionsGenerated)}</p>
                            </div>
                            <div className="mt-1">
                                <p className="text-[10px] text-transparent select-none leading-none pointer-events-none truncate">.</p>
                            </div>
                        </div>

                        {/* 3rd card */}
                        <div className="bg-bg-card border border-border-color rounded-xl p-3 hover:border-blue-500/20 hover:bg-bg-card-hover hover:scale-[1.01] transition-all duration-200 col-span-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 h-4 mb-1">
                                    <h2 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider leading-none truncate w-full">Faturamento</h2>
                                </div>
                                <p className="text-xl sm:text-2xl font-black text-text-primary tabular-nums tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.summary.totalRevenue)}</p>
                            </div>
                            <div className="mt-1">
                                <p className="text-[10px] text-transparent select-none leading-none pointer-events-none truncate">.</p>
                            </div>
                        </div>

                        {/* 4th card - Margem */}
                        <div className="bg-bg-card border border-border-color rounded-xl p-3 hover:border-border-color hover:bg-bg-card-hover hover:scale-[1.01] transition-all duration-200 col-span-1 flex flex-col justify-between" title="Faturamento bruto menos comissões pagas">
                            <div>
                                <div className="flex items-center gap-1.5 h-4 mb-1">
                                    <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider leading-none cursor-help w-max border-b border-dashed border-border-color pb-[1px] truncate">Margem</h2>
                                </div>
                                <p className="text-xl sm:text-2xl font-black text-text-primary tabular-nums tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.summary.estimatedMargin)}</p>
                            </div>
                            <div className="mt-1">
                                <p className="text-[10px] text-transparent select-none leading-none pointer-events-none truncate">.</p>
                            </div>
                        </div>
                    </div>

                    {/* === ACTION CENTER === */}
                    {data.barbers.filter((b: any) => b.totalCommission > 0).length > 0 && (() => {
                        const pendingBarbers = data.barbers.filter((b: any) => b.totalCommission > 0);
                        const totalPending = pendingBarbers.reduce((acc: number, b: any) => acc + b.totalCommission, 0);
                        return (
                            <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-border-color gap-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Pagamentos aguardando acerto</h3>
                                        <span className="text-[10px] text-text-muted shrink-0">{pendingBarbers.length} {pendingBarbers.length > 1 ? 'profissionais' : 'profissional'}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-8 bg-[#DBC278] hover:bg-[#c9b06b] text-black font-black text-xs px-5 transition-all w-full sm:w-auto hover:scale-105 active:scale-95 shadow-lg shadow-yellow-900/30"
                                        onClick={() => pendingBarbers.forEach((b: any) => openPaymentModal(b.id, b.name, b.totalCommission))}
                                    >
                                        <Wallet className="w-3.5 h-3.5 mr-1.5" />
                                        Pagar todos
                                    </Button>
                                </div>
                                {/* Barbers List */}
                                <div className="divide-y divide-border-color">
                                    {pendingBarbers.map((b: any) => {
                                        const oldestUnpaid = b.appointmentsList.find((a: any) => !a.isPaid);
                                        const daysPending = oldestUnpaid
                                            ? Math.floor((new Date().getTime() - new Date(oldestUnpaid.date).getTime()) / (1000 * 3600 * 24))
                                            : 0;
                                        const isHighAlert = daysPending >= 5 || b.totalCommission >= 500;
                                        return (
                                            <div key={b.id} className="flex items-center justify-between px-4 py-3 hover:bg-hover-bg transition-colors gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-full bg-bg-input border border-border-color flex items-center justify-center shrink-0">
                                                        {b.photoUrl ? <img src={b.photoUrl} alt={b.name} className="w-full h-full rounded-full object-cover" /> : <User className="w-3.5 h-3.5 text-text-muted" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-text-primary truncate">{b.name.split(' ')[0]}</p>
                                                        {isHighAlert && daysPending >= 5 && <p className="text-[10px] text-red-400 font-semibold flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Há {daysPending} dias</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className={`text-base font-black whitespace-nowrap tabular-nums ${isHighAlert ? 'text-red-400' : 'text-yellow-300'}`}>
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.totalCommission)}
                                                    </span>
                                                    {recentlyPaid.includes(b.id) ? (
                                                        <div className="h-7 flex items-center px-2.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                                            <Check className="w-3 h-3 sm:mr-1.5" />
                                                            <span className="hidden sm:inline">Pago</span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            className={`h-7 font-bold transition-all rounded-lg shrink-0 hover:scale-105 active:scale-95 ${isHighAlert ? 'bg-red-500 hover:bg-red-400 text-white px-2.5' : 'bg-bg-input hover:bg-hover-bg text-text-primary border border-border-color px-2.5'}`}
                                                            disabled={isPaying && payingBarberId === b.id}
                                                            onClick={() => openPaymentModal(b.id, b.name, b.totalCommission)}
                                                        >
                                                            {isPaying && payingBarberId === b.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Check className="w-3 h-3 sm:mr-1" />
                                                                    <span className="hidden sm:inline text-[11px]">Pagar</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {/* Footer total */}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-hover-bg border-t border-border-color">
                                    <span className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Total pendente</span>
                                    <span className="text-sm font-black text-accent-primary tabular-nums">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPending)}</span>
                                </div>
                            </div>
                        )
                    })()}

                    <Tabs defaultValue="overview" className="mt-8">
                        <TabsList className="bg-bg-card border border-border-color p-1 h-auto flex flex-row w-full sm:w-auto mb-6 rounded-lg overflow-hidden gap-1">
                            <TabsTrigger value="overview" className="flex-1 sm:flex-none py-1.5 px-4 rounded-md font-bold transition-all text-text-secondary bg-bg-input border border-border-color hover:bg-bg-card-hover data-[state=active]:bg-primary-action data-[state=active]:text-white data-[state=active]:border-primary-action dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white whitespace-nowrap">
                                Visão Geral
                            </TabsTrigger>
                            <TabsTrigger value="history" className="flex-1 sm:flex-none py-1.5 px-4 rounded-md font-bold transition-all text-text-secondary bg-bg-input border border-border-color hover:bg-bg-card-hover data-[state=active]:bg-primary-action data-[state=active]:text-white data-[state=active]:border-primary-action dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white whitespace-nowrap">
                                Histórico
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="m-0 focus-visible:outline-none">
                            {/* ── Progresso de pagamento ── */}
                            {data.barbers.length > 0 && (
                                <div className="bg-bg-card border border-border-color rounded-xl p-4 mb-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-px flex-1 bg-border-color" />
                                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest shrink-0">Progresso de pagamento</p>
                                        <div className="h-px flex-1 bg-border-color" />
                                    </div>
                                    <div className="space-y-3.5">
                                        {data.barbers.map((b: any) => {
                                            const total = (b.totalCommissionPaid || 0) + (b.totalCommission || 0);
                                            if (total === 0) return null;
                                            const pctPago = Math.min((b.totalCommissionPaid / total) * 100, 100);
                                            const pctPendente = 100 - pctPago;
                                            return (
                                                <div key={b.id}>
                                                    <div className="flex justify-between items-baseline mb-1.5">
                                                        <span className="text-sm font-semibold text-text-primary">{b.name.split(' ')[0]}</span>
                                                        <div className="flex items-center gap-3 text-[11px]">
                                                            <span className="text-green-400">Pago <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.totalCommissionPaid)}</span></span>
                                                            {b.totalCommission > 0 && <span className="text-yellow-400">Pendente <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.totalCommission)}</span></span>}
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-border-color rounded-full overflow-hidden flex">
                                                        {pctPago > 0 && <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-1000 ease-out" style={{ width: `${pctPago}%` }} />}
                                                        {pctPendente > 0 && <div className="h-full bg-yellow-500/30 transition-all duration-1000 ease-out" style={{ width: `${pctPendente}%` }} />}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            {/* ── Faturamento por Profissional ── */}
                            {data.barbers.length > 0 && (() => {
                                const maxRevenue = Math.max(...data.barbers.map((b: any) => b.totalRevenue), 1)
                                return (
                                    <div className="bg-bg-card border border-border-color rounded-xl p-4 mb-3">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-px flex-1 bg-border-color" />
                                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest shrink-0">Faturamento por profissional</p>
                                            <div className="h-px flex-1 bg-border-color" />
                                        </div>
                                        <div className="space-y-3">
                                            {data.barbers.map((b: any, i: number) => {
                                                const pct = (b.totalRevenue / maxRevenue) * 100
                                                const medals = ['🥇', '🥈', '🥉']
                                                const colors = [
                                                    'linear-gradient(90deg, #DBC278, #f5e09b)',
                                                    'linear-gradient(90deg, #60a5fa, #93c5fd)',
                                                    'linear-gradient(90deg, #818CF8, #a5b4fc)'
                                                ]
                                                return (
                                                    <div key={b.id} className="flex items-center gap-2.5">
                                                        <span className="w-5 text-center text-sm shrink-0">
                                                            {i < 3 ? medals[i] : <span className="text-zinc-600 text-xs font-bold">{i + 1}</span>}
                                                        </span>
                                                        <span className="w-16 text-xs font-semibold text-text-primary truncate shrink-0">
                                                            {b.name.split(' ')[0]}
                                                        </span>
                                                        <div className="flex-1 h-5 bg-bg-input rounded-md overflow-hidden relative">
                                                            <div
                                                                className="h-full rounded-md transition-all duration-700 ease-out"
                                                                style={{ width: `${pct}%`, background: colors[i] || colors[2] }}
                                                            />
                                                        </div>
                                                        <span className={`w-14 text-right text-xs font-bold shrink-0 tabular-nums ${i === 0 ? 'text-[#DBC278]' : i === 1 ? 'text-blue-400' : 'text-indigo-400'}`}>
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(b.totalRevenue)}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })()}
                            {/* === MOBILE CARD VIEW (hidden on md+) === */}
                            <div className="md:hidden space-y-2">
                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1 mb-3">Resumo por Profissional</p>
                                {data.barbers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-text-secondary bg-bg-card rounded-xl border border-border-color">
                                        <Scissors className="w-8 h-8 opacity-30 mb-3" />
                                        <p className="text-sm font-semibold text-text-primary mb-1">Nenhuma comissão gerada</p>
                                        <p className="text-xs text-center px-6 mb-4 text-text-secondary">Registre atendimentos na agenda para gerar comissões.</p>
                                        <Button variant="outline" size="sm" className="bg-transparent border-border-color text-xs" onClick={() => window.location.href = `/${slug}/admin/agenda`}>Ir para Agenda</Button>
                                    </div>
                                ) : data.barbers.map((barber: any) => {
                                    let statusColor = "text-zinc-400 bg-zinc-500/15 border-zinc-500/30";
                                    let statusText = "S/ Comissão";
                                    if (barber.totalCommission === 0 && barber.totalCommissionPaid > 0) { statusColor = "text-green-400 bg-green-500/15 border-green-500/30"; statusText = "Pago"; }
                                    else if (barber.totalCommission > 0 && barber.totalCommissionPaid > 0) { statusColor = "text-blue-400 bg-blue-500/15 border-blue-500/30"; statusText = "Parcial"; }
                                    else if (barber.totalCommission > 0 && barber.totalCommissionPaid === 0) { statusColor = "text-yellow-400 bg-yellow-500/15 border-yellow-500/30"; statusText = "Pendente"; }
                                    return (
                                        <div key={barber.id} className="bg-bg-card border border-border-color rounded-xl p-3.5">
                                            {/* Top: avatar + name + status */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-full bg-bg-input border border-border-color flex items-center justify-center shrink-0 overflow-hidden">
                                                        {barber.photoUrl ? <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-zinc-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary">{barber.name}</p>
                                                        <p className="text-[10px] text-zinc-500">{barber.totalAppointments} atendimento{barber.totalAppointments !== 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>{statusText}</span>
                                            </div>
                                            {/* Stats grid */}
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-zinc-800/60 rounded-lg p-2">
                                                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wide mb-0.5">Faturado</p>
                                                    <p className="text-xs font-black text-blue-300 tabular-nums">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(barber.totalRevenue)}</p>
                                                </div>
                                                <div className="bg-zinc-800/60 rounded-lg p-2">
                                                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wide mb-0.5">Comissão</p>
                                                    <p className="text-xs font-black text-green-300 tabular-nums">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(barber.totalCommission + barber.totalCommissionPaid)}</p>
                                                </div>
                                                <div className="bg-zinc-800/60 rounded-lg p-2">
                                                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wide mb-0.5">Pendente</p>
                                                    <p className={`text-xs font-black tabular-nums ${barber.totalCommission > 0 ? 'text-yellow-300' : 'text-zinc-500'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(barber.totalCommission)}</p>
                                                </div>
                                            </div>
                                            {/* Action */}
                                            {barber.totalCommission > 0 && (
                                                <Button
                                                    size="sm"
                                                    className="w-full mt-2.5 h-8 bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold text-xs"
                                                    onClick={() => openPaymentModal(barber.id, barber.name, barber.totalCommission)}
                                                    disabled={isPaying && payingBarberId === barber.id}
                                                >
                                                    {isPaying && payingBarberId === barber.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1.5" />Registrar pagamento</>}
                                                </Button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* === DESKTOP TABLE (hidden on mobile) === */}
                            <Card className="hidden md:block bg-bg-card border-border-color shadow-sm overflow-hidden">
                                <CardHeader className="border-b border-border-color bg-table-header-bg pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Resumo por Profissional
                                    </CardTitle>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="text-zinc-400 whitespace-nowrap">Profissional</TableHead>
                                                <TableHead className="text-right text-zinc-400 whitespace-nowrap hidden md:table-cell">Atds.</TableHead>
                                                <TableHead className="text-right text-blue-400 whitespace-nowrap hidden md:table-cell">Faturamento</TableHead>
                                                <TableHead className="text-right text-zinc-400 whitespace-nowrap hidden lg:table-cell">Ticket Médio</TableHead>
                                                <TableHead className="text-right text-zinc-400 whitespace-nowrap hidden lg:table-cell">Comissão Base</TableHead>
                                                <TableHead className="text-right text-zinc-400 whitespace-nowrap hidden xl:table-cell">Último Acerto</TableHead>
                                                <TableHead className="text-center text-zinc-400 whitespace-nowrap">Status</TableHead>
                                                <TableHead className="text-right text-green-400 font-bold whitespace-nowrap">Comissão Gerada</TableHead>
                                                <TableHead className="text-right text-yellow-500 font-bold whitespace-nowrap">Pendente</TableHead>
                                                <TableHead className="text-right text-zinc-400 whitespace-nowrap">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.barbers.length === 0 ? (
                                                <TableRow className="border-white/5">
                                                    <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                                                        Nenhum atendimento concluído encontrado neste período.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                data.barbers.map((barber: any) => {
                                                    let statusColor = "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
                                                    let statusDot = "⚪";
                                                    let statusText = "Sem comissão";

                                                    if (barber.totalCommission === 0 && barber.totalCommissionPaid > 0) {
                                                        statusColor = "bg-green-500/20 text-green-400 border-green-500/30";
                                                        statusDot = "🟢";
                                                        statusText = "Pago";
                                                    } else if (barber.totalCommission > 0 && barber.totalCommissionPaid > 0) {
                                                        statusColor = "bg-blue-500/20 text-blue-400 border-blue-500/30";
                                                        statusDot = "🔵";
                                                        statusText = "Pago pacialmente";
                                                    } else if (barber.totalCommission > 0 && barber.totalCommissionPaid === 0) {
                                                        statusColor = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
                                                        statusDot = "🟡";
                                                        statusText = "Pendente";
                                                    } else if (barber.totalCommission === 0 && barber.totalCommissionPaid === 0 && barber.totalRevenue > 0) {
                                                        statusColor = "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
                                                        statusDot = "⚪";
                                                        statusText = "S/ Comissão";
                                                    }

                                                    return (
                                                        <TableRow key={barber.id} className="group border-white/5 hover:bg-white/[0.04] transition-colors cursor-default">
                                                            <TableCell className="font-medium whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                                                                        {barber.photoUrl ? (
                                                                            <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <User className="w-5 h-5 text-zinc-500" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-white truncate max-w-[150px]">{barber.name}</span>
                                                                        {(() => {
                                                                            const prev = prevData[barber.id]
                                                                            if (prev === undefined || prev === 0) return null
                                                                            const delta = ((barber.totalRevenue - prev) / prev) * 100
                                                                            const isUp = delta >= 0
                                                                            return (
                                                                                <span className={`mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit ${isUp ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                                                                    {isUp ? '↑' : '↓'} {isUp ? '+' : ''}{delta.toFixed(0)}% vs ant.
                                                                                </span>
                                                                            )
                                                                        })()}
                                                                        <div className="mt-0.5">
                                                                            {barber.role === 'Dono' && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 uppercase tracking-widest border border-yellow-500/30">Dono</span>)}
                                                                            {(barber.role === 'Funcionario' || !barber.role) && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 uppercase tracking-widest border border-zinc-500/30">Funcionário</span>)}
                                                                            {barber.role === 'Recepcionista' && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-widest border border-blue-500/30">Recepcionista</span>)}
                                                                            {barber.role === 'Freelancer' && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-widest border border-purple-500/30">Freelancer</span>)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono hidden md:table-cell">{barber.totalAppointments}</TableCell>
                                                            <TableCell className="text-right font-bold text-blue-400 hidden md:table-cell">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(barber.totalRevenue)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-purple-400/80 hidden lg:table-cell">
                                                                <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(barber.averageTicket)}</span>
                                                            </TableCell>
                                                            <TableCell className="text-right text-zinc-400 hidden lg:table-cell">
                                                                {barber.commissionType === 'percentage' ? `${barber.commissionValue}%` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(barber.commissionValue)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-zinc-400 hidden xl:table-cell">
                                                                {barber.lastPaymentDate ? new Date(barber.lastPaymentDate).toLocaleDateString('pt-BR') : <span className="opacity-50">-</span>}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor} whitespace-nowrap`}>
                                                                    {statusDot} {statusText}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-green-400 bg-green-500/5">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(barber.totalCommission + barber.totalCommissionPaid)}
                                                            </TableCell>
                                                            <TableCell className="text-right bg-yellow-500/5 border-l border-yellow-500/10">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="font-bold text-yellow-400">
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(barber.totalCommission)}
                                                                    </span>
                                                                    {barber.estimatedCommission > 0 && barber.estimatedCommission > (barber.totalCommission + barber.totalCommissionPaid) && (
                                                                        <span className="text-[10px] text-yellow-500/60 mt-0.5" title="Previsão baseada no ritmo atual até o fim do período">
                                                                            Prev: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(barber.estimatedCommission)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end items-center gap-2 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                                                    {recentlyPaid.includes(barber.id) ? (
                                                                        <div className="h-7 flex items-center px-2.5 rounded-md bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                                                            <Check className="w-3.5 h-3.5 mr-1" /> Pago em {new Date().toLocaleDateString('pt-BR').substring(0, 5)}
                                                                        </div>
                                                                    ) : barber.totalCommission > 0 ? (
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-7 bg-white/10 hover:bg-green-600 text-white font-bold transition-all px-3 text-xs"
                                                                            onClick={(e) => { e.stopPropagation(); openPaymentModal(barber.id, barber.name, barber.totalCommission); }}
                                                                        >
                                                                            <Check className="w-3 h-3 mr-1" />
                                                                            Pagar
                                                                        </Button>
                                                                    ) : null}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 border border-white/10 hover:bg-white/10 transition-colors px-2.5 text-xs text-zinc-400"
                                                                        onClick={() => { setSelectedBarberDetails(barber); setDetailsModalOpen(true); }}
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5 sm:mr-1.5" />
                                                                        <span className="hidden sm:inline">Detalhes</span>
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })
                                            )}

                                            {(!data.barbers || data.barbers.length === 0 || data.barbers.every((b: any) => b.totalRevenue === 0)) && (
                                                <TableRow key="empty-state">
                                                    <TableCell colSpan={9} className="h-64 text-center">
                                                        <div className="flex flex-col items-center justify-center text-zinc-500">
                                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                                <Scissors className="w-8 h-8 opacity-50" />
                                                            </div>
                                                            <h3 className="text-lg font-bold text-white mb-2">Nenhuma comissão gerada neste período</h3>
                                                            <p className="max-w-sm mb-6">Comece registrando atendimentos na agenda ou PDV para que os repasses sejam calculados automaticamente.</p>
                                                            <Button variant="outline" className="bg-bg-card border-border-color hover:bg-hover-bg" onClick={() => window.location.href = `/${slug}/admin/agenda`}>
                                                                Ir para Agenda
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>

                            {/* Barber Details Modal */}
                            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                                <DialogContent className="bg-bg-card border-border-color text-text-primary max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                                    {selectedBarberDetails && (
                                        <>
                                            <div className="p-6 border-b border-border-color flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-table-header-bg">
                                                <div>
                                                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                                        {selectedBarberDetails.name}
                                                    </DialogTitle>
                                                    <DialogDescription className="text-zinc-400 mt-1">
                                                        Relatório de atendimentos no período selecionado.
                                                    </DialogDescription>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right mr-2">
                                                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Pago:</p>
                                                        <p className="text-xs text-zinc-500 uppercase font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBarberDetails.totalCommissionPaid)}</p>
                                                    </div>
                                                    <div className="h-10 w-px bg-white/10 mx-2"></div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-red-500/80 uppercase font-bold tracking-wider">Pendente</p>
                                                        <p className="text-2xl font-black text-green-400">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBarberDetails.totalCommission)}
                                                        </p>
                                                    </div>
                                                    <div className="h-10 w-px bg-white/10 mx-2"></div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-bg-card-hover border-border-color text-text-secondary hover:bg-hover-bg h-12"
                                                        onClick={exportDetailedCSV}
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        CSV
                                                    </Button>
                                                    {selectedBarberDetails.totalCommission > 0 && (
                                                        <div className="flex flex-col sm:flex-row gap-2 ml-4">
                                                            <Button
                                                                onClick={() => setValeModalOpen(true)}
                                                                variant="outline"
                                                                disabled={isPaying}
                                                                className="bg-hover-bg border-border-color hover:bg-bg-card-hover text-text-secondary font-bold h-12 px-6 transition-all"
                                                            >
                                                                Abater Vale
                                                            </Button>
                                                            <Button
                                                                onClick={handlePayAll}
                                                                disabled={isPaying}
                                                                className="bg-green-600 hover:bg-green-500 text-white font-bold h-12 px-6 shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all"
                                                            >
                                                                {isPaying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                                                                Pagar Tudo
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-auto p-0">
                                                <Table>
                                                    <TableHeader className="bg-zinc-950/50 sticky top-0 z-10">
                                                        <TableRow className="border-white/5 hover:bg-transparent">
                                                            <TableHead className="text-zinc-400">Data e Hora</TableHead>
                                                            <TableHead className="text-zinc-400">Cliente</TableHead>
                                                            <TableHead className="text-zinc-400">Serviço</TableHead>
                                                            <TableHead className="text-right text-zinc-400">Valor Cobrado</TableHead>
                                                            <TableHead className="text-right text-zinc-400">Comissão Gerada</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {selectedBarberDetails.appointmentsList.length === 0 ? (
                                                            <TableRow className="border-white/5">
                                                                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                                                                    Nenhum atendimento na lista.
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            selectedBarberDetails.appointmentsList.map((app: any) => (
                                                                <TableRow key={app.id} className="border-white/5 hover:bg-white/5">
                                                                    <TableCell className="whitespace-nowrap">
                                                                        <div className="font-medium">{format(new Date(app.date), "dd/MM/yyyy")}</div>
                                                                        <div className="text-xs text-zinc-500">{app.time?.slice(0, 5)}</div>
                                                                    </TableCell>
                                                                    <TableCell>{app.clientName}</TableCell>
                                                                    <TableCell className="text-zinc-400">{app.service}</TableCell>
                                                                    <TableCell className="text-right font-medium">
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.value)}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-bold text-green-400/80">
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.commission)}</span>
                                                                            {app.isPaid ? (
                                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 uppercase tracking-widest border border-green-500/30">Pago</span>
                                                                            ) : app.paidAmount > 0 ? (
                                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 uppercase tracking-widest border border-orange-500/30">P. Parcial</span>
                                                                            ) : (
                                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 uppercase tracking-widest border border-zinc-500/30">Pendente</span>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    )}
                                </DialogContent>
                            </Dialog>

                            {/* Barber Configuration Modal */}
                            <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
                                <DialogContent className="bg-bg-card border-border-color text-text-primary max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                            <Settings className="w-5 h-5 text-[#DBC278]" />
                                            Configurar Comissões
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-400 mt-1">
                                            Defina o tipo e valor da comissão para cada profissional da barbearia.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                        {configBarbers.map((barber) => (
                                            <div key={barber.id} className="bg-bg-card-hover border border-border-color rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                <div className="flex items-center gap-3 w-full sm:w-1/3">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 flex-shrink-0">
                                                        <User className="w-5 h-5 text-zinc-400" />
                                                    </div>
                                                    <span className="font-bold">{barber.name}</span>
                                                </div>

                                                <div className="w-full sm:w-2/3 flex gap-3">
                                                    <div className="flex-1">
                                                        <label className="text-xs text-zinc-500 mb-1 block">Tipo</label>
                                                        <Select
                                                            value={barber.commission_type || "percentage"}
                                                            onValueChange={(val) => handleConfigTypeChange(barber.id, val)}
                                                        >
                                                            <SelectTrigger className="bg-bg-input border-border-color h-9">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-bg-card border-border-color text-text-primary">
                                                                <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                                                <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-xs text-zinc-500 mb-1 block">Valor</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 text-sm">
                                                                {barber.commission_type === 'fixed' ? 'R$' : '%'}
                                                            </div>
                                                            <Input
                                                                type="text"
                                                                value={barber.commission_value || 0}
                                                                onChange={(e) => handleConfigValueChange(barber.id, barber.commission_type || 'percentage', e.target.value)}
                                                                className="bg-bg-input border-border-color h-9 pl-9"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {configBarbers.length === 0 && (
                                            <div className="text-center py-10 text-zinc-500">
                                                Nenhum profissional encontrado.
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-end gap-3">
                                        <Button
                                            variant="ghost"
                                            className="text-zinc-400 hover:text-white"
                                            onClick={() => setConfigModalOpen(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={saveConfig}
                                            disabled={savingConfig}
                                            className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold"
                                        >
                                            {savingConfig ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Payment Registration Modal (Novo Fluxo de UX) */}
                            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                                <DialogContent className="bg-bg-card border-border-color text-text-primary max-w-sm flex flex-col p-6 overflow-hidden">
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                            <Wallet className="w-5 h-5 text-green-400" />
                                            Registrar Pagamento
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-400 mt-1 pb-4 border-b border-white/5">
                                            Confirme os dados do repasse para registrar a baixa.
                                        </DialogDescription>
                                    </DialogHeader>

                                    {selectedPaymentBarber && (
                                        <div className="space-y-5">
                                            <div className="flex justify-between items-center bg-bg-card-hover p-3 rounded-xl border border-border-color">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Profissional</span>
                                                    <span className="text-sm font-semibold text-zinc-200 mt-0.5">{selectedPaymentBarber.name}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Valor do Repasse</span>
                                                    <span className="text-lg font-black text-green-400 mt-0.5">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPaymentBarber.amount)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs text-zinc-500 mb-2 block font-medium">Método de pagamento</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button
                                                        onClick={() => setPaymentMethod('pix')}
                                                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${paymentMethod === 'pix' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'}`}
                                                    >
                                                        PIX
                                                    </button>
                                                    <button
                                                        onClick={() => setPaymentMethod('dinheiro')}
                                                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${paymentMethod === 'dinheiro' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'}`}
                                                    >
                                                        Dinheiro
                                                    </button>
                                                    <button
                                                        onClick={() => setPaymentMethod('transferencia')}
                                                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${paymentMethod === 'transferencia' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'}`}
                                                    >
                                                        Banco
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 pt-4 flex justify-end gap-3">
                                        <Button
                                            variant="ghost"
                                            className="text-zinc-400 hover:text-white"
                                            onClick={() => setPaymentModalOpen(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={confirmPayment}
                                            disabled={isPaying}
                                            className="bg-green-600 hover:bg-green-500 text-white font-bold w-full sm:w-auto"
                                        >
                                            {isPaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                            Confirmar
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Abater Vale Modal */}
                            <Dialog open={valeModalOpen} onOpenChange={setValeModalOpen}>
                                <DialogContent className="bg-bg-card border-border-color text-text-primary max-w-sm flex flex-col p-6 overflow-hidden">
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="text-xl font-bold">
                                            Abater Vale
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-400 mt-1">
                                            Digite o valor exato a ser deduzido das comissões pendentes de {selectedBarberDetails?.name}.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="flex-1">
                                        <label className="text-xs text-zinc-500 mb-1 block">Valor do Vale</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 text-sm">
                                                R$
                                            </div>
                                            <Input
                                                type="text"
                                                autoFocus
                                                value={valeAmount}
                                                onChange={(e) => handleValeChange(e.target.value)}
                                                className="bg-bg-input border-border-color h-14 pl-9 text-xl font-medium"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-end gap-3">
                                        <Button
                                            variant="ghost"
                                            className="text-zinc-400 hover:text-white"
                                            onClick={() => {
                                                setValeModalOpen(false)
                                                setValeAmount("")
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleAbaterVale}
                                            disabled={isPaying || !valeAmount}
                                            className="bg-green-600 hover:bg-green-500 text-white font-bold"
                                        >
                                            {isPaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                            Confirmar Vale
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </TabsContent>

                        <TabsContent value="history" className="m-0 focus-visible:outline-none">
                            <Card className="bg-bg-card border-border-color shadow-sm overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8 text-center relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80 z-10 hidden" />
                                <div className="relative z-20">
                                    <Clock className="w-16 h-16 text-zinc-500 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-bold text-white mb-2">Histórico de Pagamentos</h3>
                                    <p className="text-zinc-400 max-w-md mx-auto">
                                        Assim que os pagamentos forem sendo registrados, eles aparecerão aqui com a data, valor e o profissional.
                                    </p>
                                    <div className="mt-6 inline-flex items-center text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                                        Aguardando registro de pagamentos...
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    )
}

function SummaryCard({ title, value, icon, color, tooltip }: { title: string, value: string | React.ReactNode, icon: React.ReactNode, color?: string, tooltip?: string }) {
    return (
        <Card className="relative overflow-hidden bg-bg-card border-border-color text-text-primary shadow-sm" title={tooltip}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color || 'from-white/5 to-transparent'} blur-3xl opacity-50`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className={`text-xs font-bold text-zinc-400 uppercase tracking-wider ${tooltip ? 'border-b border-dashed border-zinc-600 cursor-help' : ''}`}>
                    {title}
                </CardTitle>
                <div className="p-2 bg-hover-bg rounded-lg border border-border-color">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-3xl font-black tracking-tight mt-1">{value}</div>
            </CardContent>
        </Card>
    )
}
