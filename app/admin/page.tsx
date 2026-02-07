"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, ArrowLeft, Search, BarChart3, Users, Settings, Calendar, Bell, ChevronRight, Share2, DollarSign, Scissors, Clock, TrendingUp, Gift, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Mock Data for Admin
const STATS = [
    { title: "Faturamento Hoje", value: "R$ 450,00", icon: DollarSign, trend: "+12%" },
    { title: "Agendamentos", value: "12", icon: Calendar, trend: "+4" },
    { title: "Novos Clientes", value: "3", icon: Users, trend: "+1" },
]

const APPOINTMENTS = [
    { id: 1, time: "09:00", customer: "Lucas Silva", service: "Corte Degradê", price: "R$ 50,00", status: "concluido" },
    { id: 2, time: "10:00", customer: "Matheus Oliveira", service: "Barba + Corte", price: "R$ 80,00", status: "concluido" },
    { id: 3, time: "11:30", customer: "João Pedro", service: "Corte Simples", price: "R$ 45,00", status: "proximo" },
    { id: 4, time: "13:00", customer: "Rafael Costa", service: "Platinado", price: "R$ 150,00", status: "pendente" },
    { id: 5, time: "14:00", customer: "Gabriel Souza", service: "Corte Degradê", price: "R$ 50,00", status: "pendente" },
]

const BIRTHDAYS = [
    { id: 1, name: "Diego Martins", date: "12/05", phone: "5511999999999", status: "pendente" },
    { id: 2, name: "Lucas Pereira", date: "14/05", phone: "5511988888888", status: "enviado" },
    { id: 3, name: "Bruno Santos", date: "15/05", phone: "5511977777777", status: "pendente" },
]

export default function AdminPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")

    const filteredAppointments = APPOINTMENTS.filter(app =>
        app.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.service.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans pb-32">
            {/* Header */}
            <header className="p-6 pt-12 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Painel do Barbeiro</h1>
                        <p className="text-zinc-400 text-sm mt-1">Bem-vindo de volta, Tito.</p>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Sair / Voltar ao App"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Admin Nav */}
                <div className="flex p-1 bg-[#1c1c1c] rounded-xl border border-zinc-800">
                    <button className="flex-1 py-3 text-sm font-bold rounded-lg bg-[#DBC278] text-black shadow-lg">
                        Visão Geral
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/analytics'}
                        className="flex-1 py-3 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
                    >
                        Relatórios
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-8">
                {/* Stats Grid */}
                {/* Daily Goal & Stats */}
                <section className="space-y-4">
                    {/* Goal Meter */}
                    <div className="bg-gradient-to-r from-[#1c1c1c] to-[#252525] p-5 rounded-2xl border border-zinc-800 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Meta Diária</p>
                                    <h3 className="text-2xl font-bold flex items-baseline gap-1">
                                        R$ 450,00 <span className="text-sm text-zinc-500 font-normal">/ R$ 800,00</span>
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#DBC278] font-bold text-xl">56%</span>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#DBC278] to-[#FCD34D] rounded-full shadow-[0_0_15px_rgba(219,194,120,0.5)] transition-all duration-1000 ease-out"
                                    style={{ width: "56%" }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2 font-medium">
                                🚀 Falta apenas <span className="text-white">R$ 350,00</span> para bater a meta hoje!
                            </p>
                        </div>
                        {/* Decorative Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#DBC278]/5 blur-[60px] rounded-full pointing-events-none"></div>
                    </div>

                    {/* Analytics Button */}
                    <button
                        onClick={() => router.push('/admin/analytics')}
                        className="w-full p-5 bg-gradient-to-r from-[#1c1c1c] to-[#252525] rounded-2xl border border-zinc-800 hover:border-[#DBC278]/30 transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#DBC278]/10 flex items-center justify-center border border-[#DBC278]/20 group-hover:bg-[#DBC278] group-hover:text-black transition-colors">
                                <BarChart3 className="w-6 h-6 text-[#DBC278] group-hover:text-black" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white text-base">Analytics</h3>
                                <p className="text-zinc-500 text-xs">Relatórios e Estatísticas</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-[#DBC278] transition-colors" />
                    </button>
                </section>

                {/* Vertical Timeline Schedule */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Linha do Tempo</h2>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                            {filteredAppointments.length} Agendamentos
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1c1c1c] border border-zinc-800 rounded-xl h-12 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#DBC278]/50 transition-all font-medium"
                        />
                    </div>

                    <div className="relative pl-4 border-l-2 border-zinc-800 space-y-8 ml-2">
                        {filteredAppointments.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                Nenhum agendamento encontrado.
                            </div>
                        ) : (
                            filteredAppointments.map((app, index) => {
                                const isNext = app.status === 'proximo'
                                const isDone = app.status === 'concluido'

                                return (
                                    <div key={app.id} className="relative pl-6 group">
                                        {/* Timeline Dot */}
                                        <div className={cn(
                                            "absolute -left-[21px] top-6 w-4 h-4 rounded-full border-4 transition-all z-10",
                                            isNext ? "bg-[#DBC278] border-[#DBC278]/30 shadow-[0_0_0_4px_rgba(219,194,120,0.2)] scale-110" :
                                                isDone ? "bg-zinc-800 border-[#09090b]" :
                                                    "bg-[#09090b] border-zinc-600 group-hover:border-[#DBC278]"
                                        )}></div>

                                        <div className={cn(
                                            "p-4 rounded-xl border transition-all relative",
                                            isNext
                                                ? "bg-zinc-900 border-[#DBC278]/50 shadow-lg"
                                                : "bg-[#1c1c1c] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80"
                                        )}>
                                            {isNext && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#DBC278] animate-pulse"></div>}

                                            <div className="flex gap-4 items-center">
                                                {/* Time Pill */}
                                                <div className="flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-lg bg-black/40 border border-white/5">
                                                    <span className={cn("text-xs font-bold", isNext ? "text-[#DBC278]" : "text-zinc-400")}>
                                                        {app.time.split(':')[0]}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-600 font-medium">
                                                        :{app.time.split(':')[1]}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={cn("font-bold text-base truncate pr-2", isDone ? "line-through text-zinc-500" : "text-white")}>
                                                            {app.customer}
                                                        </h3>
                                                        <span className={cn("text-xs font-bold whitespace-nowrap", isDone ? "text-zinc-600" : "text-[#DBC278]")}>
                                                            {app.price}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 truncate">{app.service}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}
