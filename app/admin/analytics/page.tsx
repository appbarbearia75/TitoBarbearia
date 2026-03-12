"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoveLeft, TrendingUp, Users, Crown, Calendar, Clock, DollarSign, ChevronRight, Cake } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock Data
const REVENUE_DATA = [
    { month: "Jan", value: 3200, height: "h-[40%]" },
    { month: "Fev", value: 4100, height: "h-[55%]" },
    { month: "Mar", value: 3800, height: "h-[45%]" },
    { month: "Abr", value: 5200, height: "h-[70%]" },
    { month: "Mai", value: 6800, height: "h-[85%]" },
    { month: "Jun", value: 7400, height: "h-[100%]" },
]

const TOP_SERVICES = [
    { name: "Corte Degradê", count: 145, percentage: "w-[85%]" },
    { name: "Barba Completa", count: 98, percentage: "w-[60%]" },
    { name: "Platinado", count: 42, percentage: "w-[30%]" },
    { name: "Sobrancelha", count: 25, percentage: "w-[15%]" },
]

const PEAK_HOURS = [
    { time: "09-11h", score: 3 },
    { time: "11-14h", score: 2 },
    { time: "14-17h", score: 4 },
    { time: "17-20h", score: 5 }, // 5 = Hot
]

export default function AnalyticsPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans pb-32">
            {/* Header */}
            <header className="p-6 pt-12 pb-2">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.push('/admin')}
                        className="w-10 h-10 rounded-full bg-[#1c1c1c] flex items-center justify-center text-white hover:bg-zinc-800 transition-colors border border-zinc-700"
                    >
                        <MoveLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold">Painel do Barbeiro</h1>
                </div>

                {/* Admin Nav */}
                <div className="flex p-1 bg-[#1c1c1c] rounded-xl border border-zinc-800">
                    <button
                        onClick={() => router.push('/admin')}
                        className="flex-1 py-3 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
                    >
                        Visão Geral
                    </button>
                    <button className="flex-1 py-3 text-sm font-bold rounded-lg bg-[#DBC278] text-black shadow-lg">
                        Relatórios
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-6">

                {/* 1. Monthly Revenue Chart - Premium Card */}
                <section className="bg-gradient-to-br from-[#1c1c1c] to-[#151515] p-6 rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <DollarSign className="w-40 h-40 text-white" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Faturamento Semestral</h2>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-bold text-white">R$ 30.5k</h3>
                                    <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        +18%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end justify-between h-40 gap-3">
                            {REVENUE_DATA.map((item, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="relative w-full flex items-end justify-center h-full">
                                        <div className="w-full bg-zinc-800/50 rounded-t-lg h-full absolute bottom-0"></div>
                                        <div
                                            className={cn(
                                                "w-full rounded-t-lg transition-all duration-500 relative z-10",
                                                idx === REVENUE_DATA.length - 1
                                                    ? "bg-gradient-to-t from-[#DBC278] to-[#FCD34D] shadow-[0_0_20px_rgba(219,194,120,0.4)]"
                                                    : "bg-zinc-700 hover:bg-zinc-600"
                                            )}
                                            style={{ height: item.height }}
                                        ></div>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase",
                                        idx === REVENUE_DATA.length - 1 ? "text-[#DBC278]" : "text-zinc-500"
                                    )}>{item.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 2. VIP vs Regular Split & Birthdays - Action Cards */}
                <section className="grid grid-cols-1 gap-4">
                    <div
                        onClick={() => router.push('/admin/analytics/revenue-source')}
                        className="bg-[#1c1c1c] p-1 rounded-3xl border border-zinc-800 cursor-pointer group active:scale-[0.98] transition-all"
                    >
                        <div className="bg-gradient-to-r from-[#2a2a2a] to-[#1c1c1c] p-5 rounded-[20px] border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#DBC278]/20 flex items-center justify-center border border-[#DBC278]/30">
                                    <Users className="w-6 h-6 text-[#DBC278]" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-white text-lg group-hover:text-[#DBC278] transition-colors">Origem da Receita</h2>
                                    <p className="text-zinc-500 text-xs">Análise de Assinantes vs Avulsos</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-[#DBC278] group-hover:text-black transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Mini Stats inside card */}
                        <div className="px-6 py-4 flex gap-6">
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-zinc-400 font-bold">VIP</span>
                                    <span className="text-xs text-[#DBC278] font-bold">35%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#DBC278] w-[35%]"></div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-zinc-400 font-bold">Avulso</span>
                                    <span className="text-xs text-zinc-500 font-bold">65%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-zinc-600 w-[65%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Birthday CRM Card */}
                    <div
                        onClick={() => router.push('/admin/analytics/birthdays')}
                        className="bg-[#1c1c1c] p-1 rounded-3xl border border-zinc-800 cursor-pointer group active:scale-[0.98] transition-all"
                    >
                        <div className="bg-gradient-to-r from-[#2a2a2a] to-[#1c1c1c] p-5 rounded-[20px] border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                                    <Cake className="w-6 h-6 text-pink-500" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-white text-lg group-hover:text-pink-500 transition-colors">Aniversariantes</h2>
                                    <p className="text-zinc-500 text-xs">CRM e Fidelização</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs text-zinc-400 font-bold">3 Aniversariantes essa semana</span>
                            </div>
                            <div className="text-xs font-bold text-pink-500 bg-pink-500/10 px-2 py-1 rounded-md">
                                Ver Lista
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Top Services & Heatmap Grid */}
                <section className="grid grid-cols-1 gap-6">
                    {/* Top Services */}
                    <div className="bg-[#1c1c1c] p-6 rounded-3xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold flex items-center gap-2 text-white">
                                <Crown className="w-5 h-5 text-[#DBC278]" />
                                Top Serviços
                            </h2>
                        </div>

                        <div className="space-y-5">
                            {TOP_SERVICES.map((service, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex justify-between z-10 relative mb-1">
                                        <span className="text-sm font-bold text-white">{service.name}</span>
                                        <span className="text-xs font-bold text-zinc-500">{service.count}</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", idx === 0 ? "bg-gradient-to-r from-[#DBC278] to-[#FCD34D]" : "bg-zinc-700")}
                                            style={{ width: service.percentage }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Heatmap */}
                    <div className="bg-[#1c1c1c] p-6 rounded-3xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold flex items-center gap-2 text-white">
                                <Clock className="w-5 h-5 text-[#DBC278]" />
                                Horários de Pico
                            </h2>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {PEAK_HOURS.map((slot, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2">
                                    <div className={cn(
                                        "w-full aspect-[4/5] rounded-2xl flex flex-col items-center justify-center font-bold transition-all border",
                                        slot.score === 5
                                            ? "bg-[#DBC278] border-[#DBC278] text-black shadow-[0_0_15px_rgba(219,194,120,0.4)] scale-105"
                                            : slot.score >= 3
                                                ? "bg-zinc-800 border-zinc-700 text-white"
                                                : "bg-zinc-900/50 border-zinc-800 text-zinc-600"
                                    )}>
                                        <div className="h-2/3 flex items-end pb-2">
                                            <div className={cn(
                                                "w-2 rounded-full",
                                                slot.score === 5 ? "h-8 bg-black" : "h-4 bg-zinc-600"
                                            )}></div>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase",
                                        slot.score === 5 ? "text-[#DBC278]" : "text-zinc-600"
                                    )}>{slot.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
