"use client"

import { supabase } from "@/lib/supabase"

import { format, getDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState, useEffect } from "react"
import { ServiceCard } from "@/components/ServiceCard"
import { DateSelector } from "@/components/DateSelector"
import { TimeSlotSelector } from "@/components/TimeSlotSelector"
import { BottomStickyCTA } from "@/components/BottomStickyCTA"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { Calendar, Crown, MapPin, ChevronDown, Phone, UserCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Client } from "@/app/data"
import { AdminLoginModal } from "@/components/AdminLoginModal"
import { BarberSelector } from "@/components/BarberSelector"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CircleAlert } from "lucide-react"

interface BookingPageProps {
    client: Client
}

import { motion, AnimatePresence } from "framer-motion"

function VipTab({ client }: { client: Client }) {
    const themeColor = client.themeColor
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)

    // Merge old plan with new plans if they exist
    const allPlans = client.vipPlans && client.vipPlans.length > 0
        ? client.vipPlans
        : (client.vipPlanTitle ? [{
            id: 'legacy',
            title: client.vipPlanTitle,
            highlight_text: "",
            price: Number(String(client.vipPlanPrice || '').replace(/[^0-9,.]/g, '').replace(',', '.')) || 99.90,
            price_from: Number(String(client.vipPlanPriceFrom || '').replace(/[^0-9,.]/g, '').replace(',', '.')) || 150.00,
            description: "Tenha acesso livre à barbearia e tratamento VIP em cada visita."
        }] : [])

    const handleSubscribe = (plan: any) => {
        const clientPhone = String(client.phone || '').replace(/\D/g, '')
        const message = `Olá! Quero fazer parte do plano *${plan.title}* exclusivo da barbearia 💈✨
Como funciona o pagamento e a ativação?`
        window.open(`https://wa.me/55${clientPhone}?text=${encodeURIComponent(message)}`, '_blank')
    }

    const paginate = (newDirection: number) => {
        setDirection(newDirection)
        const nextIndex = (currentIndex + newDirection + allPlans.length) % allPlans.length
        setCurrentIndex(nextIndex)
    }

    if (allPlans.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500">
                Planos VIP em breve.
            </div>
        )
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 500 : -500,
            opacity: 0,
            scale: 0.9
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0,
            scale: 0.9
        })
    }

    return (
        <div className="relative w-full max-w-sm mx-auto overflow-hidden">
            {allPlans.length > 1 && (
                <div className="text-center mb-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-center gap-2">
                        <ArrowRight className="w-3 h-3 opacity-50 rotate-180" />
                        Arraste para o lado para conferir outros planos
                        <ArrowRight className="w-3 h-3 opacity-50" />
                    </span>
                </div>
            )}
            <div className="relative flex items-center justify-center min-h-[480px]">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                            scale: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(_, info) => {
                            const swipe = info.offset.x
                            const threshold = 50
                            if (swipe < -threshold) {
                                paginate(1)
                            } else if (swipe > threshold) {
                                paginate(-1)
                            }
                        }}
                        className="w-full absolute cursor-grab active:cursor-grabbing"
                    >
                        <div className="bg-[url('/noise.png')] bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden transition-all duration-500">
                            {/* Luxury Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-black opacity-90 z-0"></div>
                            <div className="absolute top-0 right-0 p-8 opacity-5 z-10">
                                <Crown className="w-40 h-40 text-[#DBC278] -rotate-12" style={{ color: themeColor }} />
                            </div>

                            <div className="relative z-10 p-8 flex flex-col items-center text-center">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#DBC278]/30 bg-[#DBC278]/5 mb-6 backdrop-blur-md" style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}10` }}>
                                    <Crown className="w-3 h-3 text-[#DBC278] fill-[#DBC278]" style={{ color: themeColor, fill: themeColor }} />
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#DBC278] uppercase" style={{ color: themeColor }}>{allPlans[currentIndex].title}</span>
                                </div>

                                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                                    {allPlans[currentIndex].highlight_text ? (
                                        allPlans[currentIndex].highlight_text
                                    ) : (
                                        <>Cortes <span className="text-[#DBC278]" style={{ color: themeColor }}>Ilimitados</span></>
                                    )}
                                </h2>
                                <p className="text-zinc-400 text-sm font-medium mb-8 max-w-[280px] h-10 leading-relaxed line-clamp-2">
                                    {allPlans[currentIndex].description || "Tenha acesso livre à barbearia e tratamento VIP em cada visita."}
                                </p>

                                {/* Minimalist Price Display */}
                                <div className="mb-8">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-sm text-[#DBC278] font-bold" style={{ color: themeColor }}>R$</span>
                                        <span className="text-5xl font-black text-white tracking-tighter">
                                            {Math.floor(allPlans[currentIndex].price)}
                                        </span>
                                        <span className="text-xl font-bold text-zinc-400">
                                            ,{(allPlans[currentIndex].price % 1).toFixed(2).split('.')[1] || "00"}
                                        </span>
                                        <span className="text-sm text-zinc-500 font-medium">/mês</span>
                                    </div>
                                    {allPlans[currentIndex].price_from && (
                                        <div className="text-zinc-600 text-[10px] font-medium uppercase tracking-wider mt-2 line-through">
                                            De R$ {allPlans[currentIndex].price_from.toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    className="w-full h-14 bg-[#DBC278] hover:bg-[#c4ad6b] text-black font-extrabold text-lg rounded-xl shadow-[0_0_25px_rgba(219,194,120,0.3)] hover:shadow-[0_0_40px_rgba(219,194,120,0.5)] transition-all transform active:scale-[0.98]"
                                    style={{ backgroundColor: themeColor }}
                                    onClick={() => handleSubscribe(allPlans[currentIndex])}
                                >
                                    ATIVAR MEU VIP
                                </Button>
                                <p className="text-[10px] text-zinc-600 mt-3 font-medium uppercase tracking-wider">Saiba mais sobre os benefícios</p>
                            </div>
                            {/* Bottom Reflection */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-[#DBC278] blur-xl opacity-30" style={{ backgroundColor: themeColor }}></div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Carousel Controls */}
            {allPlans.length > 1 && (
                <div className="flex justify-center gap-3 mt-4">
                    {allPlans.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setDirection(idx > currentIndex ? 1 : -1)
                                setCurrentIndex(idx)
                            }}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                currentIndex === idx ? "w-8 bg-[#DBC278]" : "w-2 bg-zinc-800"
                            )}
                            style={currentIndex === idx ? { backgroundColor: themeColor } : undefined}
                        />
                    ))}
                </div>
            )}
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
    const [isServicesExpanded, setIsServicesExpanded] = useState(false)
    const isDeactivated = client.isActive === false
    const [isMounted, setIsMounted] = useState(false)

    const [myBookings, setMyBookings] = useState<any[]>([])
    const [isMyBookingsModalOpen, setIsMyBookingsModalOpen] = useState(false)
    const [isCancellingBooking, setIsCancellingBooking] = useState<string | null>(null)
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        const fetchMyBookings = async () => {
            if (client.slug === 'demo' || !client.id) return

            const savedPhone = localStorage.getItem("user_phone")
            if (savedPhone) {
                const today = format(new Date(), 'yyyy-MM-dd')
                const { data } = await supabase
                    .from('bookings')
                    .select('*, barbers(name)')
                    .eq('customer_phone', savedPhone)
                    .eq('barbershop_id', client.id)
                    .eq('status', 'confirmed')
                    .gte('date', today)
                    .order('date', { ascending: true })
                    .order('time', { ascending: true })

                if (data && data.length > 0) {
                    setMyBookings(data)
                } else {
                    setMyBookings([])
                }
            }
        }
        fetchMyBookings()
    }, [client.id, client.slug, isMyBookingsModalOpen])

    const handleCancelBooking = async (booking: any) => {
        setIsCancellingBooking(booking.id)
        try {
            const { error: updateError } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', booking.id)

            if (updateError) throw updateError

            setMyBookings(prev => prev.filter(b => b.id !== booking.id))
            setConfirmCancelId(null)

            // Notify Barber via Z-API
            if (client.phone) {
                const service = client.services.find(s => s.id === booking.service_id)
                const serviceName = service ? service.title : 'Serviço Profissional'
                const displayDate = booking.date.split('-').reverse().join('/')
                const msgBarber = `❌ *Agendamento Cancelado* ❌\n\nO cliente *${booking.customer_name || 'Alguém'}* acabou de cancelar o agendamento através do aplicativo.\n\n📅 *Data:* ${displayDate}\n⏰ *Hora:* ${booking.time}\n✂️ *Serviço:* ${serviceName}\n👤 *Barbeiro:* ${booking.barbers?.name || 'Não selecionado'}\n\nEste horário agora está vago e faturável novamente na sua agenda! ✅`

                fetch('/api/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: client.phone, message: msgBarber })
                }).catch(console.error)
            }

            if (myBookings.length <= 1) {
                setIsMyBookingsModalOpen(false)
            }
        } catch (error) {
            console.error('Erro ao cancelar:', error)
            alert('Erro ao cancelar agendamento. Tente novamente.')
        } finally {
            setIsCancellingBooking(null)
        }
    }

    const activeClosedPeriod = client.closedPeriods?.find((cp: any) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        return dateStr >= cp.start_date && dateStr <= cp.end_date && !cp.start_time && !cp.end_time
    })

    const [closedModalOpen, setClosedModalOpen] = useState(false)

    const displayedServices = isServicesExpanded ? client.services : client.services.slice(0, 4)

    const handleSelectService = (id: string) => {
        setSelectedServices(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        )
    }

    const performNavigation = () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const servicesParam = selectedServices.join(',')
        let url = `/${client.slug}/horario?services=${servicesParam}&date=${dateStr}`
        if (selectedBarber) url += `&barber=${selectedBarber}`
        router.push(url)
    }

    const handleGoToHorario = () => {
        if (activeClosedPeriod) {
            setClosedModalOpen(true)
            return
        }
        performNavigation()
    }

    if (!isMounted) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-[#DBC278] animate-spin"></div></div>

    return (
        <div className="min-h-screen bg-[#09090b] font-sans pb-20">
            {/* Desktop Container Constraint */}
            <div className="max-w-md mx-auto bg-[#09090b] min-h-screen shadow-2xl shadow-black/50 overflow-hidden relative">

                {/* Header Image */}
                <div className="relative h-80 w-full">
                    <NextImage
                        src={client.cover}
                        alt={`${client.name} Background`}
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent" />

                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 text-white hover:bg-black/40 z-10 gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/5 transition-all"
                        onClick={() => setIsAdminLoginOpen(true)}
                    >
                        <span className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">Área do Barbeiro</span>
                        <UserCircle2 className="w-5 h-5 opacity-70" />
                    </Button>
                </div>

                {/* Profile Info */}
                <div className="px-5 -mt-32 relative z-10 flex flex-col items-center text-center">
                    <div
                        className="w-32 h-32 rounded-3xl p-1.5 bg-[#09090b] mb-4 relative group transition-transform duration-500 hover:scale-105"
                        style={{
                            boxShadow: `0 0 40px -10px ${client.themeColor}50`
                        }}
                    >
                        {/* Glow Effect */}
                        <div
                            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"
                            style={{
                                background: `linear-gradient(45deg, ${client.themeColor}00, ${client.themeColor}40, ${client.themeColor}00)`
                            }}
                        />

                        {/* Border Gradient */}
                        <div
                            className="absolute inset-0 rounded-3xl opacity-60"
                            style={{
                                background: `linear-gradient(to bottom right, ${client.themeColor}, transparent, ${client.themeColor})`,
                                padding: '2px',
                                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                maskComposite: 'exclude'
                            }}
                        />

                        <div className="w-full h-full rounded-2xl overflow-hidden relative">
                            <img src={client.avatar} alt={client.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            {/* Inner Shadow for Depth */}
                            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] rounded-2xl" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">{client.name}</h1>
                    {/* Minimalist Address */}
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors group px-4 py-1"
                    >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-all" />
                        <span className="text-xs text-center font-medium opacity-80 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
                            {client.address}
                        </span>
                    </a>

                    {/* Minimalist WhatsApp Number */}
                    {client.phone && (
                        <a
                            href={`https://wa.me/55${String(client.phone).replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 flex items-center justify-center gap-2 group py-1 px-3 rounded-full transition-all hover:bg-white/5"
                        >
                            <Phone className="w-3.5 h-3.5" style={{ color: client.themeColor }} />
                            <span className="text-sm font-semibold tracking-wider text-zinc-300 group-hover:text-white transition-colors">
                                {String(client.phone).replace(/\D/g, "").replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3").replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3")}
                            </span>
                        </a>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className="mt-8 px-5">
                    <div className="grid grid-cols-2 gap-2 bg-[#1c1c1c] p-1 rounded-xl border border-white/5 shadow-inner">
                        <button
                            onClick={() => setActiveTab('agenda')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'agenda'
                                    ? "bg-[#DBC278] text-black shadow-lg shadow-[#DBC278]/20"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-black/20"
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
                                    ? "bg-[#DBC278] text-black shadow-lg shadow-[#DBC278]/20"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-black/20"
                            )}
                            style={activeTab === 'assinatura' ? { backgroundColor: client.themeColor } : undefined}
                        >
                            <Crown className="w-4 h-4" />
                            Assinatura
                        </button>
                    </div>
                </div>

                {/* Meus Agendamentos Button */}
                {myBookings.length > 0 && (
                    <div className="px-5 mt-4">
                        <Button
                            variant="outline"
                            className="w-full bg-[#1c1c1c] hover:bg-zinc-800 border-white/5 text-zinc-300 font-bold h-14 rounded-xl transition-all shadow-lg"
                            onClick={() => setIsMyBookingsModalOpen(true)}
                        >
                            <Calendar className="w-4 h-4 mr-2" style={{ color: client.themeColor }} />
                            Meus Agendamentos
                            <div className="ml-auto bg-zinc-800 text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: client.themeColor }}>
                                {myBookings.length}
                            </div>
                        </Button>
                    </div>
                )}

                {/* Content */}
                <div className="mt-6 pb-32">
                    {activeTab === 'agenda' ? (
                        <>
                            {!isDeactivated ? (
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
                                            {displayedServices.map((service) => (
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
                                            {client.services.length > 4 && (
                                                <div className="text-center pt-2">
                                                    <button
                                                        className="text-zinc-500 text-sm flex items-center justify-center gap-1 mx-auto hover:text-zinc-300 transition-colors"
                                                        onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                                                    >
                                                        {isServicesExpanded ? (
                                                            <>
                                                                Ver menos serviços <ChevronDown className="w-3 h-3 rotate-180 transition-transform" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                Ver todos os serviços ({client.services.length}) <ChevronDown className="w-3 h-3 transition-transform" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
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
                                /* Blurred Skeleton for Deactivated State */
                                <div className="space-y-8 opacity-50 pointer-events-none select-none filter blur-sm grayscale">
                                    <div className="px-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse" />
                                            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
                                        </div>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="h-24 bg-zinc-800/50 rounded-xl border border-white/5 animate-pulse" />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pl-5">
                                        <div className="h-6 w-32 bg-zinc-800 rounded mb-4 animate-pulse" />
                                        <div className="flex gap-4 overflow-hidden">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="w-24 h-32 bg-zinc-800/50 rounded-xl animate-pulse flex-shrink-0" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="px-5 animate-fade-in">
                            <VipTab client={client} />
                        </div>
                    )}
                </div>

                {/* Bottom CTA (Agenda Only) */}
                {activeTab === 'agenda' && (
                    <BottomStickyCTA className="translate-y-0 backdrop-blur-3xl bg-[#09090b]/90 border-t border-white/10 md:absolute md:w-full md:max-w-md md:left-auto md:right-auto shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.8)]">
                        <Button
                            className={cn(
                                "w-full font-bold text-lg h-14 rounded-xl transition-all",
                                selectedServices.length > 0
                                    ? "text-black shadow-[0_0_20px_rgba(219,194,120,0.3)] hover:shadow-[0_0_30px_rgba(219,194,120,0.5)] transform hover:-translate-y-0.5"
                                    : "bg-[#1c1c1c] text-zinc-500 cursor-not-allowed border border-white/5"
                            )}
                            style={selectedServices.length > 0 ? { backgroundColor: client.themeColor } : undefined}
                            onClick={handleGoToHorario}
                            disabled={selectedServices.length === 0 || !selectedBarber}
                        >
                            {selectedServices.length === 0 || !selectedBarber
                                ? "Selecione serviço e profissional"
                                : <span className="flex items-center gap-2">Escolher Horário <ArrowRight className="w-5 h-5" /></span>
                            }
                        </Button>
                    </BottomStickyCTA>
                )}


                <AdminLoginModal
                    isOpen={isAdminLoginOpen}
                    onOpenChange={setIsAdminLoginOpen}
                />

                {/* Modal de Meus Agendamentos */}
                <Dialog open={isMyBookingsModalOpen} onOpenChange={setIsMyBookingsModalOpen}>
                    <DialogContent className="bg-[#09090b] border-[#DBC278]/20 text-white shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[400px] p-0 overflow-hidden" aria-describedby="meus-agendamentos">
                        <DialogHeader className="p-6 pb-2 text-center">
                            <DialogTitle className="text-xl flex items-center justify-center gap-2">
                                <Calendar className="w-5 h-5 text-[#DBC278]" style={{ color: client.themeColor }} />
                                Meus Agendamentos
                            </DialogTitle>
                            <DialogDescription id="meus-agendamentos" className="text-zinc-400 text-sm">
                                Confirme os dados ou cancele se necessário.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
                            {myBookings.map((booking) => {
                                const service = client.services.find(s => s.id === booking.service_id)
                                return (
                                    <div key={booking.id} className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="text-zinc-300 font-bold text-sm capitalize">
                                                {format(new Date(booking.date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                            </div>
                                            <div className="bg-[#09090b] border border-white/10 px-2 py-1 rounded-md font-bold text-[#DBC278]" style={{ color: client.themeColor }}>
                                                {booking.time}
                                            </div>
                                        </div>

                                        <div className="space-y-1 mb-4">
                                            <div className="text-white text-base font-medium">
                                                {service ? service.title : 'Serviço Profissional'}
                                            </div>
                                            <div className="text-zinc-500 text-sm flex justify-between items-center">
                                                <span>Com {booking.barbers?.name || 'Profissional da Casa'}</span>
                                                {service && <span>R$ {Number(service.price).toFixed(2)}</span>}
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-10 transition-colors",
                                                confirmCancelId === booking.id
                                                    ? "border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                                    : "border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            )}
                                            onClick={() => {
                                                if (confirmCancelId === booking.id) {
                                                    handleCancelBooking(booking)
                                                } else {
                                                    setConfirmCancelId(booking.id)
                                                    setTimeout(() => setConfirmCancelId(null), 3500)
                                                }
                                            }}
                                            disabled={isCancellingBooking === booking.id}
                                        >
                                            {isCancellingBooking === booking.id
                                                ? 'Cancelando...'
                                                : confirmCancelId === booking.id
                                                    ? 'Tem Certeza? Confirmar.'
                                                    : 'Cancelar Agendamento'}
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={client.isActive === false}>
                    <DialogContent className="bg-[#1c1c1c] border-zinc-800 text-white sm:max-w-md [&>button]:hidden">
                        <DialogHeader>
                            <div className="mx-auto bg-red-500/10 p-3 rounded-full mb-4 w-fit">
                                <CircleAlert className="w-8 h-8 text-red-500" />
                            </div>
                            <DialogTitle className="text-center text-xl">Agenda Desativada</DialogTitle>
                            <DialogDescription className="text-center text-zinc-400 pt-2">
                                A agenda desta barbearia encontra-se temporariamente desativada. Entre em contato diretamente com o estabelecimento para mais informações.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center pt-4">
                            {client.phone && (
                                <a
                                    href={`https://wa.me/55${String(client.phone).replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-[#DBC278] hover:text-[#c4ad6b] transition-colors bg-[#DBC278]/10 px-6 py-3 rounded-xl border border-[#DBC278]/20"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span className="font-semibold">Entrar em contato</span>
                                </a>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog open={closedModalOpen} onOpenChange={setClosedModalOpen}>
                    <DialogContent className="bg-[#1c1c1c] border-zinc-800 text-white sm:max-w-md [&>button]:hidden">
                        <DialogHeader>
                            <div className="mx-auto bg-red-500/10 p-3 rounded-full mb-4 w-fit">
                                <CircleAlert className="w-8 h-8 text-red-500" />
                            </div>
                            <DialogTitle className="text-center text-xl">Agenda Travada pelo Barbeiro</DialogTitle>
                            <DialogDescription className="text-center text-zinc-400 pt-2">
                                {activeClosedPeriod?.reason || "A agenda desta barbearia encontra-se bloqueada nesta data."}
                            </DialogDescription>
                            {activeClosedPeriod?.start_time && activeClosedPeriod?.end_time && (
                                <p className="text-center text-[#DBC278] text-sm mt-2 font-bold select-all">
                                    Das {activeClosedPeriod.start_time} às {activeClosedPeriod.end_time}
                                </p>
                            )}
                        </DialogHeader>
                        <div className="flex flex-col gap-3 pt-4">
                            {activeClosedPeriod?.start_time && activeClosedPeriod?.end_time && (
                                <Button
                                    onClick={() => {
                                        setClosedModalOpen(false)
                                        performNavigation()
                                    }}
                                    className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-bold text-base transition-all rounded-xl"
                                >
                                    Ver horários restantes
                                </Button>
                            )}
                            <Button
                                onClick={() => setClosedModalOpen(false)}
                                className="w-full h-12 bg-[#DBC278] hover:bg-[#c4ad6b] text-black font-bold text-base transition-all rounded-xl shadow-[0_0_20px_rgba(219,194,120,0.2)]"
                                style={{ backgroundColor: client.themeColor }}
                            >
                                Agendar em outra data
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
