"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SERVICES } from "@/app/data"
import { SubscriptionCard } from "@/components/SubscriptionCard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoveLeft, Calendar, User, Phone, Cake, Check, Clock, MessageCircle, Crown } from "lucide-react"
import { BottomStickyCTA } from "@/components/BottomStickyCTA"
import { cn } from "@/lib/utils"

function ConfirmationContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const serviceId = searchParams.get("service")
    const time = searchParams.get("time")
    const dateStr = searchParams.get("date")

    const service = SERVICES.find((s) => s.id === serviceId)

    // Form State
    // Form State
    const [name, setName] = useState("Lucas") // Pre-filled for demo
    const [phone, setPhone] = useState("")
    const [birthDate, setBirthDate] = useState("")

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // Validation
    const isValid = name.length > 2 && phone.length > 8 && birthDate.length === 10

    const handleFinalize = (isSubscription: boolean = false) => {
        setIsSubmitting(true)
        setTimeout(() => {
            setIsSubmitting(false)
            setIsSuccess(true)
        }, 1500)
    }

    const addToCalendar = () => {
        if (!service) return
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service.title)}`
        window.open(googleCalendarUrl, '_blank')
    }

    if (!service || !time) return null

    // Date Formatting
    const dateObj = dateStr ? new Date(dateStr) : new Date()
    const dateDisplay = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(dateObj)


    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20">
                    <Check className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Agendado!</h1>
                <p className="text-gray-400 mb-8 max-w-xs mx-auto text-lg">
                    Seu corte está confirmado para <strong className="text-white">{dateDisplay} às {time}</strong>.
                </p>

                <div className="w-full max-w-sm mx-auto space-y-4">
                    <Button
                        className="w-full h-14 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#25D366]/20 transition-all transform hover:scale-[1.02]"
                        onClick={() => {
                            const message = `Olá, agendei *${service.title}* para *${dateDisplay}* às *${time}*.\n\nNome: *${name}*\nNascimento: *${birthDate}*\nTelefone: *${phone}*`
                            window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank')
                        }}
                    >
                        <MessageCircle className="w-6 h-6 mr-2" />
                        Enviar Comprovante
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full h-12 text-zinc-500 hover:text-zinc-300 font-medium"
                        onClick={addToCalendar}
                    >
                        Adicionar ao Calendário
                    </Button>
                </div>

                <div className="w-full max-w-sm mx-auto mt-12 pt-8 border-t border-zinc-900">
                    <div className="bg-gradient-to-b from-[#1c1c1c] to-[#09090b] p-6 rounded-2xl border border-[#DBC278]/30 relative overflow-hidden group hover:border-[#DBC278]/50 transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                            <Crown className="w-40 h-40 text-[#DBC278] -rotate-12 transform translate-x-8 -translate-y-8" />
                        </div>

                        <div className="relative z-10 text-center">
                            <h3 className="text-[#DBC278] font-bold tracking-widest text-xs uppercase mb-2">Convite Exclusivo</h3>
                            <h2 className="text-2xl font-bold text-white mb-1">Seja Tito VIP</h2>
                            <p className="text-zinc-400 text-sm mb-6">Economize cortes ilimitados por apenas R$ 99,90/mês.</p>

                            <Button
                                className="w-full bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold h-12 rounded-xl"
                                onClick={() => router.push('/?tab=assinatura')}
                            >
                                Quero ser VIP
                            </Button>
                        </div>
                    </div>
                </div>

                <button onClick={() => router.push('/')} className="mt-8 text-gray-500 hover:text-white underline underline-offset-4">
                    Voltar ao Início
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans pb-40">
            <header className="p-6 flex items-center gap-4 pt-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                    <MoveLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-xl font-bold">Confirmação</h1>
            </header>

            <main className="px-6 space-y-8 animate-slide-up">

                {/* Summary Ticket */}
                <div className="relative">
                    {/* Ticket Top */}
                    <div className="bg-[#1c1c1c] rounded-t-3xl p-6 border-x border-t border-zinc-800 relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-2xl mb-1 text-white">{service.title}</h3>
                                <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                                    <Clock className="w-4 h-4 text-[#DBC278]" />
                                    <span>{service.duration}</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#DBC278]/10 flex items-center justify-center border border-[#DBC278]/20">
                                <Crown className="w-6 h-6 text-[#DBC278]" />
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Total a Pagar</p>
                                <p className="text-3xl font-bold text-[#DBC278]">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Divider (Perforation) */}
                    <div className="h-8 bg-[#1c1c1c] border-x border-zinc-800 relative z-10 flex items-center justify-between px-[-1px]">
                        <div className="w-4 h-8 bg-[#09090b] rounded-r-full border-y border-r border-zinc-800 -ml-[1px]"></div>
                        <div className="flex-1 h-px border-t-2 border-dashed border-zinc-800 mx-2 opacity-50"></div>
                        <div className="w-4 h-8 bg-[#09090b] rounded-l-full border-y border-l border-zinc-800 -mr-[1px]"></div>
                    </div>

                    {/* Ticket Bottom (Date & Time) */}
                    <div className="bg-[#1c1c1c] rounded-b-3xl p-6 border-x border-b border-zinc-800 relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#09090b] p-3 rounded-xl border border-zinc-800 text-center">
                                <span className="block text-xs uppercase font-bold text-zinc-500 mb-1">Data</span>
                                <span className="block text-lg font-bold text-white capitalize">
                                    {new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(dateObj)}
                                </span>
                            </div>
                            <div className="bg-[#09090b] p-3 rounded-xl border border-zinc-800 text-center">
                                <span className="block text-xs uppercase font-bold text-zinc-500 mb-1">Horário</span>
                                <span className="block text-lg font-bold text-white">
                                    {time}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Shadow Glow behind ticket */}
                    <div className="absolute top-4 left-4 right-4 bottom-4 bg-[#DBC278]/5 blur-2xl rounded-full z-0"></div>
                </div>

                {/* Inputs */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider ml-1">Seus Dados</h3>

                    <div className="space-y-3">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-focus-within:text-[#DBC278] group-focus-within:bg-[#DBC278]/10 transition-all">
                                <User className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Seu Nome Completo"
                                className="w-full bg-[#1c1c1c] border border-zinc-800 rounded-2xl h-16 pl-16 pr-4 focus:outline-none focus:border-[#DBC278]/50 focus:ring-1 focus:ring-[#DBC278]/50 placeholder:text-zinc-600 text-white font-medium transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-focus-within:text-[#DBC278] group-focus-within:bg-[#DBC278]/10 transition-all">
                                <Phone className="w-5 h-5" />
                            </div>
                            <input
                                type="tel"
                                placeholder="(11) 99999-9999"
                                className="w-full bg-[#1c1c1c] border border-zinc-800 rounded-2xl h-16 pl-16 pr-4 focus:outline-none focus:border-[#DBC278]/50 focus:ring-1 focus:ring-[#DBC278]/50 placeholder:text-zinc-600 text-white font-medium transition-all"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-focus-within:text-[#DBC278] group-focus-within:bg-[#DBC278]/10 transition-all">
                                <Cake className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="DD/MM/AAAA (Nascimento)"
                                className="w-full bg-[#1c1c1c] border border-zinc-800 rounded-2xl h-16 pl-16 pr-4 focus:outline-none focus:border-[#DBC278]/50 focus:ring-1 focus:ring-[#DBC278]/50 placeholder:text-zinc-600 text-white font-medium transition-all"
                                value={birthDate}
                                onChange={(e) => {
                                    let v = e.target.value.replace(/\D/g, '')
                                    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '$1/$2')
                                    if (v.length > 5) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
                                    if (v.length > 10) v = v.substr(0, 10)
                                    setBirthDate(v)
                                }}
                            />
                        </div>
                    </div>
                    <p className="text-center text-xs text-zinc-600">
                        Ao confirmar, você receberá o comprovante no WhatsApp.
                    </p>
                </div>
            </main>

            <BottomStickyCTA className="translate-y-0 backdrop-blur-xl bg-[#09090b]/80 border-zinc-800">
                <Button
                    className={cn(
                        "w-full font-bold text-lg h-14 rounded-xl transition-all",
                        isValid && !isSubmitting
                            ? "bg-[#DBC278] text-black hover:bg-[#c4ad6b] shadow-[0_0_20px_rgba(219,194,120,0.3)] hover:shadow-[0_0_30px_rgba(219,194,120,0.5)] transform hover:-translate-y-0.5"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    )}
                    onClick={() => handleFinalize(false)}
                    disabled={!isValid || isSubmitting}
                    loading={isSubmitting}
                >
                    {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
                </Button>
            </BottomStickyCTA>
        </div>
    )
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-[#FFD84D]">Carregando...</div>}>
            <ConfirmationContent />
        </Suspense>
    )
}
