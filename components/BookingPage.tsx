"use client"

import { format } from "date-fns"
import { useState } from "react"
import { ServiceCard } from "@/components/ServiceCard"
import { DateSelector } from "@/components/DateSelector"
import { BottomStickyCTA } from "@/components/BottomStickyCTA"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { Calendar, Crown, MapPin, ChevronDown, Phone, UserCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Client } from "@/app/data"
import { AdminLoginModal } from "@/components/AdminLoginModal"
import { BarberSelector } from "@/components/BarberSelector"

interface BookingPageProps {
    client: Client
}

function VipTab({ themeColor }: { themeColor: string }) {
    const router = useRouter()
    // Mocked params for navigation if needed, or just link to vip page
    // In the original file, it had a generic implementation similar to this:
    return (
        <div className="relative group perspective-1000">
            <div className="w-full bg-[url('/noise.png')] bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_20px_40px_-10px_rgba(219,194,120,0.2)]">

                {/* Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-black opacity-90 z-0"></div>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity z-10">
                    <Crown className="w-40 h-40 text-[#DBC278] -rotate-12" style={{ color: themeColor }} />
                </div>

                <div className="relative z-10 p-8 flex flex-col items-center text-center">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#DBC278]/30 bg-[#DBC278]/5 mb-6 backdrop-blur-md" style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}10` }}>
                        <Crown className="w-3 h-3 text-[#DBC278] fill-[#DBC278]" style={{ color: themeColor, fill: themeColor }} />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-[#DBC278] uppercase" style={{ color: themeColor }}>{/*client.name*/} Club Member</span>
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                        Cortes <span className="text-[#DBC278]" style={{ color: themeColor }}>Ilimitados</span>
                    </h2>
                    <p className="text-zinc-400 text-sm font-medium mb-8 max-w-[280px] leading-relaxed">
                        Tenha acesso livre à barbearia e tratamento VIP em cada visita.
                    </p>

                    {/* Minimalist Price Display */}
                    <div className="mb-8">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-sm text-[#DBC278] font-bold" style={{ color: themeColor }}>R$</span>
                            <span className="text-5xl font-black text-white tracking-tighter">99</span>
                            <span className="text-xl font-bold text-zinc-400">,90</span>
                            <span className="text-sm text-zinc-500 font-medium">/mês</span>
                        </div>
                        <div className="text-zinc-600 text-[10px] font-medium uppercase tracking-wider mt-2 line-through">De R$ 150,00</div>
                    </div>

                    <Button
                        className="w-full h-14 bg-[#DBC278] hover:bg-[#c4ad6b] text-black font-extrabold text-lg rounded-xl shadow-[0_0_25px_rgba(219,194,120,0.3)] hover:shadow-[0_0_40px_rgba(219,194,120,0.5)] transition-all transform active:scale-[0.98] animate-pulse-slow"
                        style={{ backgroundColor: themeColor }}
                    // onClick={() => router.push(`/${client.slug}/vip`)} // Assuming params or context available, or just generic link
                    >
                        ATIVAR MEU VIP
                    </Button>
                    <p className="text-[10px] text-zinc-600 mt-3 font-medium uppercase tracking-wider">Saiba mais sobre os benefícios</p>
                </div>

                {/* Bottom Reflection */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-[#DBC278] blur-xl opacity-30" style={{ backgroundColor: themeColor }}></div>
            </div>
        </div>
    )
}

export function BookingPage({ client }: BookingPageProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"agenda" | "assinatura">("agenda")
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedBarber, setSelectedBarber] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)

    const handleSelectService = (id: string) => {
        setSelectedServices(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        )
    }

    const handleConfirm = () => {
        if (selectedServices.length > 0) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            const servicesParam = selectedServices.join(',')
            let url = `/${client.slug}/confirmacao?services=${servicesParam}&date=${dateStr}&time=14:00`
            if (selectedBarber) url += `&barber=${selectedBarber}`
            router.push(url)
        }
    }

    return (
        <div className="min-h-screen bg-[#09090b] font-sans pb-20">
            {/* Desktop Container Constraint */}
            <div className="max-w-md mx-auto bg-[#09090b] min-h-screen shadow-2xl shadow-black/50 overflow-hidden relative">

                {/* Header Image */}
                <div className="relative h-48 w-full">
                    <NextImage
                        src={client.cover}
                        alt={`${client.name} Background`}
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-black/20 z-10"
                        onClick={() => setIsAdminLoginOpen(true)}
                    >
                        <UserCircle2 className="w-6 h-6 opacity-50 hover:opacity-100 transition-opacity" />
                    </Button>
                </div>

                {/* Profile Info */}
                <div className="px-5 -mt-12 relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-2xl border-4 border-[#09090b] shadow-lg overflow-hidden mb-3 bg-[#1c1c1c]">
                        <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">{client.name}</h1>
                    <div className="flex items-center gap-1 text-zinc-400 text-sm bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800/50 backdrop-blur-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{client.address}</span>
                    </div>

                    {client.phone && (
                        <a
                            href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 flex items-center gap-2 text-[#DBC278] hover:text-[#c4ad6b] transition-colors bg-[#DBC278]/10 px-4 py-2 rounded-xl border border-[#DBC278]/20"
                            style={{ color: client.themeColor, backgroundColor: `${client.themeColor}1A`, borderColor: `${client.themeColor}33` }}
                        >
                            <Phone className="w-4 h-4" />
                            <span className="font-semibold">{client.phone}</span>
                        </a>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className="mt-8 px-5">
                    <div className="grid grid-cols-2 gap-2 bg-[#1c1c1c] p-1 rounded-xl border border-zinc-800">
                        <button
                            onClick={() => setActiveTab('agenda')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'agenda'
                                    ? "bg-[#DBC278] text-black shadow-lg"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                            )}
                            style={activeTab === 'agenda' ? { backgroundColor: client.themeColor } : undefined}
                        >
                            <Calendar className="w-4 h-4" />
                            Agenda
                        </button>
                        <button
                            onClick={() => setActiveTab('assinatura')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'assinatura'
                                    ? "bg-[#DBC278] text-black shadow-lg"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                            )}
                            style={activeTab === 'assinatura' ? { backgroundColor: client.themeColor } : undefined}
                        >
                            <Crown className="w-4 h-4" />
                            Assinatura
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="mt-6 pb-32">
                    {activeTab === 'agenda' ? (
                        <div className="animate-fade-in space-y-8 animate-slide-up">
                            {/* Services */}
                            <div className="px-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        Serviços
                                    </h2>
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                        {selectedServices.length > 0 ? `${selectedServices.length} Selecionado(s)` : "0 Selecionados"}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {client.services.map((service) => (
                                        <ServiceCard
                                            key={service.id}
                                            id={service.id}
                                            title={service.title}
                                            price={service.price}
                                            icon={service.icon}
                                            selected={selectedServices.includes(service.id)}
                                            onSelect={handleSelectService}
                                        />
                                    ))}
                                    <div className="text-center pt-2">
                                        <button className="text-zinc-500 text-sm flex items-center justify-center gap-1 mx-auto hover:text-zinc-300 transition-colors">
                                            Ver todos os serviços ({client.services.length}) <ChevronDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Barber Selector */}
                            <div className="pl-5">
                                <h2 className="text-lg font-bold text-white mb-4">Profissional</h2>
                                <BarberSelector
                                    client={client}
                                    selectedBarber={selectedBarber}
                                    onSelect={setSelectedBarber}
                                />
                            </div>

                            {/* Date Selector */}
                            <div className="pl-5">
                                <DateSelector
                                    selectedDate={selectedDate}
                                    onSelect={setSelectedDate}
                                    openingHours={client.openingHours}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="px-5 animate-fade-in">
                            <VipTab themeColor={client.themeColor} />
                        </div>
                    )}
                </div>

                {/* Bottom CTA (Agenda Only) */}
                {activeTab === 'agenda' && (
                    <BottomStickyCTA className="translate-y-0 backdrop-blur-xl bg-[#09090b]/80 border-t border-zinc-800 md:absolute md:w-full md:max-w-md md:left-auto md:right-auto">
                        <Button
                            className={cn(
                                "w-full font-bold text-lg h-14 rounded-xl transition-all",
                                selectedServices.length > 0
                                    ? "bg-[#DBC278] text-black hover:bg-[#c4ad6b] shadow-[0_0_20px_rgba(219,194,120,0.3)] hover:shadow-[0_0_30px_rgba(219,194,120,0.5)] transform hover:-translate-y-0.5"
                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            )}
                            style={selectedServices.length > 0 ? { backgroundColor: client.themeColor } : undefined}
                            onClick={handleConfirm}
                            disabled={selectedServices.length === 0}
                        >
                            {selectedServices.length > 0 ? `Confirmar Agendamento (${selectedServices.length})` : "Selecione um serviço"}
                        </Button>
                    </BottomStickyCTA>
                )}


                <AdminLoginModal
                    isOpen={isAdminLoginOpen}
                    onOpenChange={setIsAdminLoginOpen}
                />
            </div>
        </div>
    )
}
