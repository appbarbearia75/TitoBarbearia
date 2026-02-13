"use client"

import { useRouter } from "next/navigation"
import { MoveLeft, Cake, Send, Calendar, Gift, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

// Mock Data for Birthdays
const UPCOMING_BIRTHDAYS = [
    { id: 1, name: "Matheus Silva", date: "08/02", phone: "5511999999999", isToday: true, daysLeft: 0, age: 28 },
    { id: 2, name: "Lucas Santos", date: "09/02", phone: "5511999999999", isToday: false, daysLeft: 1, age: 32 },
    { id: 3, name: "Pedro Oliveira", date: "10/02", phone: "5511999999999", isToday: false, daysLeft: 2, age: 24 },
]

const MONTHLY_STATS = [
    { month: "Jan", count: 12 },
    { month: "Fev", count: 18, current: true },
    { month: "Mar", count: 15 },
    { month: "Abr", count: 22 },
    { month: "Mai", count: 19 },
    { month: "Jun", count: 25 },
]

export default function BirthdaysPage() {
    const router = useRouter()

    const handleSendMessage = (client: typeof UPCOMING_BIRTHDAYS[0]) => {
        const message = `Fala ${client.name}! 🎂\n\nVi aqui que seu aniversário está chegando (${client.date}).\nPassando pra desejar parabéns adiantado! 🎁\n\nQue tal dar um tapa no visual pra comemorar?\nTemos um horário especial pra você.`
        window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank')
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans pb-32 overflow-x-hidden">

            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-pink-900/10 to-transparent pointer-events-none"></div>
            <div className="fixed -top-20 right-[-100px] w-[300px] h-[300px] bg-pink-600/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <header className="relative z-10 p-6 pt-12 pb-6">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.push('/admin/analytics')}
                        className="w-12 h-12 rounded-full bg-[#1c1c1c]/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-zinc-800 transition-colors border border-zinc-700 shadow-lg"
                    >
                        <MoveLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            Aniversariantes <Cake className="w-8 h-8 text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium">Fidelização e Recompra</p>
                    </div>
                </div>
            </header>

            <main className="px-6 space-y-8 relative z-10">

                {/* Upcoming List */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#DBC278]" />
                            Próximos dias
                        </h2>
                        <span className="text-xs text-pink-400 font-bold bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                            3 Clientes
                        </span>
                    </div>

                    <div className="grid gap-4">
                        {UPCOMING_BIRTHDAYS.map((client) => (
                            <div key={client.id} className="relative group perspective-1000">
                                <div className="bg-gradient-to-r from-[#1c1c1c] via-[#1c1c1c] to-[#151515] p-1 rounded-[24px] border border-zinc-800 hover:border-pink-500/30 transition-all duration-500 shadow-lg hover:shadow-[0_10px_30px_-10px_rgba(236,72,153,0.15)] group-hover:scale-[1.01]">
                                    <div className="bg-[#18181b] rounded-[20px] p-5 flex items-center justify-between relative overflow-hidden">

                                        {/* Glow Effect */}
                                        <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-pink-500/5 to-transparent"></div>

                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-400 border border-zinc-700 shadow-inner">
                                                    {client.name.charAt(0)}
                                                </div>
                                                {client.isToday && (
                                                    <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                                                        HOJE!
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-white text-lg">{client.name}</h3>
                                                <div className="flex items-center gap-3 text-xs font-medium mt-1">
                                                    <div className="flex items-center gap-1 text-zinc-400">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{client.date}</span>
                                                    </div>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                                    <span className={client.isToday ? "text-pink-400 font-bold" : "text-zinc-500"}>
                                                        {client.isToday ? "É hoje!" : `Faltam ${client.daysLeft} dias`}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                                    <span className="text-zinc-500">{client.age} anos</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            size="icon"
                                            className="bg-green-600 hover:bg-green-500 text-white rounded-xl h-12 w-12 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all transform active:scale-95 group-hover:rotate-6"
                                            onClick={() => handleSendMessage(client)}
                                        >
                                            <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Monthly Goals / Stats */}
                <section className="bg-[#1c1c1c] p-8 rounded-[32px] border border-zinc-800 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                            <Gift className="w-6 h-6 text-pink-500" />
                            Previsão Mensal
                        </h2>

                        <div className="space-y-6">
                            {MONTHLY_STATS.map((stat, idx) => (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <div className={`w-12 text-sm font-bold ${stat.current ? 'text-pink-500' : 'text-zinc-600 group-hover:text-zinc-400'} transition-colors`}>
                                        {stat.month}
                                    </div>
                                    <div className="flex-1 h-3 bg-zinc-900 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out relative ${stat.current ? 'bg-gradient-to-r from-pink-600 to-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-zinc-700'}`}
                                            style={{ width: `${(stat.count / 30) * 100}%` }}
                                        >
                                            {stat.current && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse"></div>}
                                        </div>
                                    </div>
                                    <div className={`w-8 text-sm font-bold text-right ${stat.current ? 'text-white' : 'text-zinc-500'}`}>
                                        {stat.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-pink-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                </section>

                {/* Pro Tip Card */}
                <div className="bg-gradient-to-r from-[#1c1c1c] to-[#151515] p-1 rounded-2xl">
                    <div className="bg-[#09090b]/80 backdrop-blur-md rounded-xl p-5 border border-zinc-800 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-blue-400 font-bold text-sm mb-1 uppercase tracking-wider">Insight</h4>
                            <p className="text-zinc-400 text-xs leading-relaxed">
                                Clientes que recebem mensagem de aniversário têm <strong>40% mais chance</strong> de agendar um serviço na mesma semana.
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}
