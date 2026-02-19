"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoveLeft, Users, Crown, Calendar, TrendingUp, Search, MessageCircle, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Mock Data - VIP Clients
const VIP_CLIENTS = [
    { id: 1, name: "Roberto Almeida", since: "Jan 2024", totalCuts: 12, status: "active", phone: "5511999999999" },
    { id: 2, name: "Carlos Eduardo", since: "Mar 2024", totalCuts: 8, status: "active", phone: "5511999999999" },
    { id: 3, name: "Fernanda Costa", since: "Nov 2023", totalCuts: 25, status: "active", phone: "5511999999999" },
]

// Mock Data - Potential VIPs (Regular clients sorted by frequency)
const POTENTIAL_VIPS = [
    { id: 1, name: "João Silva", frequency: 3.5, lastVisit: "2 dias atrás", totalSpent: "R$ 200,00", phone: "5511999999999" },
    { id: 2, name: "Pedro Henrique", frequency: 2.8, lastVisit: "1 semana atrás", totalSpent: "R$ 150,00", phone: "5511999999999" },
    { id: 3, name: "Lucas Mendes", frequency: 2.0, lastVisit: "3 semanas atrás", totalSpent: "R$ 90,00", phone: "5511999999999" },
    { id: 4, name: "Gustavo Lima", frequency: 1.2, lastVisit: "1 mês atrás", totalSpent: "R$ 45,00", phone: "5511999999999" },
    { id: 5, name: "Felipe Andreoli", frequency: 0.8, lastVisit: "2 meses atrás", totalSpent: "R$ 45,00", phone: "5511999999999" },
]

export default function RevenueSourcePage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"vip" | "potential">("potential")

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans pb-32">
            {/* Header */}
            <header className="p-6 pt-12 pb-6">
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-[#1c1c1c] flex items-center justify-center text-white hover:bg-zinc-800 transition-colors border border-zinc-700"
                    >
                        <MoveLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold">Análise de Clientes</h1>
                </div>
                <p className="text-zinc-400 text-sm ml-14">
                    Detalhes de quem gera sua receita e oportunidades de conversão.
                </p>
            </header>

            {/* Tabs */}
            <div className="px-6 mb-6">
                <div className="flex p-1 bg-[#1c1c1c] rounded-xl border border-zinc-800">
                    <button
                        onClick={() => setActiveTab("potential")}
                        className={cn(
                            "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                            activeTab === "potential" ? "bg-[#DBC278] text-black shadow-lg" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        Avulsos (Potenciais)
                    </button>
                    <button
                        onClick={() => setActiveTab("vip")}
                        className={cn(
                            "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                            activeTab === "vip" ? "bg-[#DBC278] text-black shadow-lg" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        Assinantes VIP
                    </button>
                </div>
            </div>

            <main className="px-6 space-y-4">

                {activeTab === "potential" ? (
                    <>
                        <div className="bg-[#1c1c1c] p-4 rounded-xl border border-dashed border-zinc-700 mb-6">
                            <h2 className="text-[#DBC278] font-bold flex items-center gap-2 mb-1">
                                <Flame className="w-5 h-5" />
                                Termômetro de Conversão
                            </h2>
                            <p className="text-xs text-zinc-400">
                                Clientes com <strong className="text-white">frequência 2x+</strong> por mês são os mais fáceis de converter para o plano VIP.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {POTENTIAL_VIPS.map((client) => {
                                const isHot = client.frequency >= 2.0
                                return (
                                    <div key={client.id} className={cn(
                                        "bg-[#1c1c1c] p-4 rounded-xl border flex flex-col gap-3 transition-all",
                                        isHot ? "border-[#DBC278]/30 shadow-[0_0_15px_rgba(219,194,120,0.1)]" : "border-zinc-800 opacity-80"
                                    )}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-white text-lg">{client.name}</h3>
                                                    {isHot && (
                                                        <span className="bg-[#DBC278] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Flame className="w-3 h-3" /> HOT
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 font-medium">
                                                    <span>Última vez: {client.lastVisit}</span>
                                                    <span>•</span>
                                                    <span className={isHot ? "text-white" : ""}>Frequência: ~{client.frequency} cortes/mês</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xs text-zinc-500 uppercase font-bold tracking-wider">Gasto Mensal</span>
                                                <span className="text-[#DBC278] font-bold">{client.totalSpent}</span>
                                            </div>
                                        </div>

                                        {isHot && (
                                            <Button
                                                className="w-full bg-transparent border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366]/10 font-bold h-10 mt-1 transition-all"
                                                onClick={() => {
                                                    const msg = `Olá ${client.name.split(' ')[0]}! Notei que você corta o cabelo com frequência. Já pensou em virar VIP e economizar? De: ${client.totalSpent} por R$ 99,90 ilimitado! Vamos fechar?`
                                                    window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(msg)}`, '_blank')
                                                }}
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Ofertar VIP no WhatsApp
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <div className="space-y-3">
                        {VIP_CLIENTS.map((client) => (
                            <div key={client.id} className="bg-[#1c1c1c] p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#DBC278]/10 flex items-center justify-center border border-[#DBC278]/20">
                                        <Crown className="w-5 h-5 text-[#DBC278]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{client.name}</h3>
                                        <p className="text-xs text-zinc-500">Membro desde {client.since}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-bold text-white">{client.totalCuts}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Cortes Totais</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
