"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, LogOut, Scissors } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function PlanosPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    
    const [loading, setLoading] = useState(true)
    const [barbershopName, setBarbershopName] = useState("")

    useEffect(() => {
        const fetchBarbershop = async () => {
            const { data } = await supabase
                .from("barbershops")
                .select("name")
                .eq("slug", slug)
                .single()
            if (data) {
                setBarbershopName(data.name)
            }
            setLoading(false)
        }
        fetchBarbershop()
    }, [slug])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
                <p>Carregando planos...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-[#DBC278] selection:text-black font-sans flex flex-col">
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/simbol-and-logo-horizontal.svg" alt="BarberPlatform" className="h-12 w-auto" />
                    </div>
                    <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={handleLogout}>
                        <LogOut className="w-5 h-5 mr-2" />
                        Sair
                    </Button>
                </div>
            </header>

            <main className="flex-grow pt-32 pb-24 flex flex-col items-center justify-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none opacity-50"></div>
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                            <Scissors className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">O seu período de teste chegou ao fim</h1>
                        <p className="text-lg text-zinc-400">
                            Esperamos que você tenha gostado da experiência. Para continuar usando a plataforma e faturando mais, escolha o plano ideal para a sua barbearia.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Mensal */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 flex flex-col hover:border-[#DBC278]/30 transition-all">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Mensal</h4>
                                <p className="text-zinc-400 text-sm">Flexibilidade total.</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-sm font-bold text-zinc-500 align-top">R$</span>
                                <span className="text-4xl font-bold text-white">49,90</span>
                                <span className="text-zinc-500">/mês</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Agendamento e Gestão</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Financeiro Completo</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Aumente o faturamento</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Suporte 24hrs</li>
                            </ul>
                            <Link href="https://pay.kiwify.com.br/38GAuNz" target="_blank" className="w-full">
                                <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 text-white">
                                    Assinar Mensal
                                </Button>
                            </Link>
                        </div>

                        {/* Anual */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-[#DBC278] relative transform md:-translate-y-4 shadow-2xl shadow-[#DBC278]/10 flex flex-col">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#DBC278] text-black px-4 py-2 rounded-xl uppercase tracking-wider shadow-lg shadow-[#DBC278]/20 flex flex-col items-center">
                                <span className="text-xs font-bold leading-none mb-0.5">Melhor Valor</span>
                                <span className="text-[10px] font-extrabold opacity-80 leading-none">(2 Meses Off)</span>
                            </div>
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Anual</h4>
                                <p className="text-zinc-400 text-sm">Para quem quer economizar.</p>
                            </div>
                            <div className="mb-6">
                                <div className="text-zinc-500 line-through text-sm mb-1">R$ 598,80</div>
                                <span className="text-sm font-bold text-zinc-500 align-top">R$</span>
                                <span className="text-5xl font-bold text-white">499,90</span>
                                <span className="text-zinc-500">/ano</span>
                                <div className="text-[#DBC278] font-bold text-sm mt-1">Eq. a R$ 41,65/mês</div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-white"><div className="bg-[#DBC278] rounded-full p-1"><Check className="w-3 h-3 text-black" /></div> <strong>2 Meses Grátis</strong></li>
                                <li className="flex items-center gap-3 text-white"><div className="bg-[#DBC278] rounded-full p-1"><Check className="w-3 h-3 text-black" /></div> Todas as Funções Pro</li>
                                <li className="flex items-center gap-3 text-white"><div className="bg-[#DBC278] rounded-full p-1"><Check className="w-3 h-3 text-black" /></div> Orientação no faturamento</li>
                            </ul>
                            <Link href="https://pay.kiwify.com.br/4jYy7gg" target="_blank" className="w-full">
                                <Button className="w-full bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold h-12 shadow-[0_0_20px_rgba(219,194,120,0.2)] hover:shadow-[0_0_30px_rgba(219,194,120,0.4)] transition-all transform hover:-translate-y-1">
                                    Assinar Anual
                                </Button>
                            </Link>
                        </div>

                        {/* Semestral */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 flex flex-col hover:border-[#DBC278]/30 transition-all">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Semestral</h4>
                                <p className="text-zinc-400 text-sm">Equilíbrio ideal.</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-sm font-bold text-zinc-500 align-top">R$</span>
                                <span className="text-4xl font-bold text-white">269,90</span>
                                <span className="text-zinc-500">/semestre</span>
                                <div className="text-zinc-500 text-sm mt-1">Eq. a R$ 44,98/mês</div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Agendamento e Gestão</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Financeiro Completo</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Aumente o faturamento</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Desconto de ~10%</li>
                            </ul>
                            <Link href="https://pay.kiwify.com.br/rpxr1ey" target="_blank" className="w-full">
                                <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 text-white">
                                    Assinar Semestral
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
