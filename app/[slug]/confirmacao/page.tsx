"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, Clock, Crown, User, Phone, Cake, Loader2, ArrowLeft, Sparkles, Star, MapPin, Download, ChevronRight } from "lucide-react"
import { BottomStickyCTA } from "@/components/BottomStickyCTA"
import { Client } from "@/app/data"
import { parseDuration } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { CLIENTS } from "@/app/data"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { ReviewModal } from "@/components/ReviewModal"

interface ServiceType {
    id: string
    title: string
    price: number
    description: string
    duration: string
}

interface ClientType {
    id: string
    slug: string
    name: string
    phone: string
    themeColor: string
    googleReviewLink?: string
    notificationPhones?: string[]
}

function UpgradeModal({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1c1c1c] border-zinc-800 text-white sm:max-w-md">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-[#DBC278]/20 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-[#DBC278]" />
                    </div>
                    <DialogTitle className="text-xl font-bold mb-2">Funcionalidade Exclusiva</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Essa opção só ira funcionar na versão paga do aplicativo.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 mt-4">
                    <Button
                        className="w-full bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold h-12 rounded-xl"
                        onClick={() => window.open('/', '_self')}
                    >
                        Assine Agora
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-zinc-500 hover:text-zinc-300"
                        onClick={() => onOpenChange(false)}
                    >
                        Voltar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ConfirmationContent() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()

    // Updated: get 'services' instead of 'service'
    const serviceIdsParam = searchParams.get("services")
    const legacyServiceId = searchParams.get("service") // Fallback
    const time = searchParams.get("time")
    const dateStr = searchParams.get("date")

    const slug = params?.slug as string
    const barberId = searchParams.get("barber")
    const [barber, setBarber] = useState<any>(null)

    const [client, setClient] = useState<ClientType | null>(null)
    const [selectedServices, setSelectedServices] = useState<ServiceType[]>([])
    const [loading, setLoading] = useState(true)

    // Form State
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [birthDate, setBirthDate] = useState("")

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

    useEffect(() => {
        if (isSuccess && client && client.id !== 'mock-id') {
            const subscribeToPush = async () => {
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                            const subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                            });

                            await fetch('/api/web-push/subscribe', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    subscription,
                                    clientPhone: phone,
                                    barbershopId: client.id,
                                    clientName: name
                                })
                            });
                        }
                    } catch (error) {
                        console.error('Error subscribing to push notifications', error);
                    }
                }
            };
            subscribeToPush();
        }
    }, [isSuccess, client, name, phone])

    useEffect(() => {
        if (slug) {
            fetchData()
        }
    }, [slug, serviceIdsParam, legacyServiceId, barberId])

    useEffect(() => {
        const savedName = localStorage.getItem("user_name")
        const savedPhone = localStorage.getItem("user_phone")
        const savedBirthDate = localStorage.getItem("user_birthdate")

        if (savedName) setName(savedName)
        if (savedPhone) setPhone(savedPhone)
        if (savedBirthDate) setBirthDate(savedBirthDate)
    }, [])

    const saveUserData = () => {
        localStorage.setItem("user_name", name)
        localStorage.setItem("user_phone", phone)
        localStorage.setItem("user_birthdate", birthDate)
    }

    const handleDemoAction = (action: () => void) => {
        if (client?.id === 'mock-id') {
            setIsUpgradeModalOpen(true)
        } else {
            action()
        }
    }

    const fetchData = async () => {
        try {
            // 0. Demo Mode (Dynamic from DB)
            if (slug === 'demo') {
                const { data: demoSettings } = await supabase
                    .from('demo_settings')
                    .select('*')
                    .single()

                if (demoSettings) {
                    setClient({
                        id: 'mock-id', // Keep as mock-id to prevent actual DB booking
                        slug: 'demo',
                        name: demoSettings.name || "Barbearia Modelo",
                        phone: "(11) 99999-9999",
                        themeColor: "#DBC278",
                        googleReviewLink: "https://www.google.com/search?q=barbearia+modelo+avaliação", // Demo Link
                        notificationPhones: []
                    })

                    // Determine services from demo settings
                    let idsToFetch: string[] = []
                    if (serviceIdsParam) {
                        idsToFetch = serviceIdsParam.split(',').filter(Boolean)
                    } else if (legacyServiceId) {
                        idsToFetch = [legacyServiceId]
                    }

                    if (idsToFetch.length > 0 && demoSettings.services) {
                        const formattedServices = demoSettings.services
                            .filter((s: any) => idsToFetch.includes(s.id))
                            .map((s: any) => ({
                                id: s.id,
                                title: s.title,
                                price: Number(s.price),
                                description: s.description,
                                duration: s.duration || "30 min"
                            }))
                        setSelectedServices(formattedServices)
                    }

                    setLoading(false)
                    return
                }
            }

            // 0.1. Demo / Mock Data Handler (Fallback to local data.ts)
            const mockClient = CLIENTS.find(c => c.slug === slug || (slug === 'demo' && c.slug === 'barbearia-modelo'))
            if (mockClient) {
                setClient({
                    id: 'mock-id',
                    slug: mockClient.slug,
                    name: mockClient.name,
                    phone: mockClient.phone,
                    themeColor: mockClient.themeColor,
                    googleReviewLink: (slug === 'demo' || mockClient.slug === 'barbearia-modelo')
                        ? "https://www.google.com/search?q=barbearia+modelo+avaliação"
                        : undefined,
                    notificationPhones: []
                })

                // Determine services from mock data
                let idsToFetch: string[] = []
                if (serviceIdsParam) {
                    idsToFetch = serviceIdsParam.split(',').filter(Boolean)
                } else if (legacyServiceId) {
                    idsToFetch = [legacyServiceId]
                }

                if (idsToFetch.length > 0) {
                    const formattedServices = mockClient.services
                        .filter(s => idsToFetch.includes(s.id))
                        .map(s => ({
                            id: s.id,
                            title: s.title,
                            price: s.price,
                            description: s.description,
                            duration: s.duration
                        }))
                    setSelectedServices(formattedServices)
                }

                // Demo-specific barber handling if needed (mock)
                if (barberId) {
                    setBarber({ name: "Barbeiro Demo", photo_url: null })
                }

                setLoading(false)
                return
            }

            // 1. Fetch Barbershop
            const { data: barbershop } = await supabase
                .from('barbershops')
                .select('*')
                .eq('slug', slug)
                .single()

            if (barbershop) {
                setClient({
                    id: barbershop.id,
                    slug: barbershop.slug,
                    name: barbershop.name,
                    phone: barbershop.phone || "",
                    themeColor: barbershop.theme_color || "#DBC278",
                    googleReviewLink: barbershop.google_reviews_link,
                    notificationPhones: barbershop.whatsapp_notification_numbers || []
                })

                // Determine IDs to fetch
                let idsToFetch: string[] = []
                if (serviceIdsParam) {
                    idsToFetch = serviceIdsParam.split(',').filter(Boolean)
                } else if (legacyServiceId) {
                    idsToFetch = [legacyServiceId]
                }

                if (idsToFetch.length > 0) {
                    const { data: servicesData } = await supabase
                        .from('services')
                        .select('*')
                        .in('id', idsToFetch)

                    if (servicesData) {
                        const formattedServices = servicesData.map(s => ({
                            id: s.id,
                            title: s.title,
                            price: Number(s.price),
                            description: s.description,
                            duration: s.duration || "30 min"
                        }))
                        setSelectedServices(formattedServices)
                    }
                }

                // Fetch Barber if selected or assign default
                let currentBarberId = barberId;
                if (!currentBarberId && barbershop.id) {
                    const { data: firstBarber } = await supabase
                        .from('barbers')
                        .select('id')
                        .eq('barbershop_id', barbershop.id)
                        .eq('active', true)
                        .order('name', { ascending: true })
                        .limit(1)
                        .single();
                    if (firstBarber) {
                        currentBarberId = firstBarber.id;
                    }
                }

                if (currentBarberId) {
                    const { data: barberData } = await supabase
                        .from('barbers')
                        .select('*')
                        .eq('id', currentBarberId)
                        .single()

                    if (barberData) {
                        setBarber(barberData)
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    // Validation
    const isValid = name.length > 2 && phone.length > 8 && birthDate.length === 10

    const handleFinalize = async () => {
        if (!client || selectedServices.length === 0 || !dateStr || !time) return

        setIsSubmitting(true)
        try {
            // Mock/Demo Submission
            if (client.id === 'mock-id') {
                await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate network delay
                saveUserData() // Save for next time
                setIsSuccess(true)
                setIsSubmitting(false)
                return
            }

            // Prepare birthday if valid
            let formattedBirthday = null
            if (birthDate && birthDate.length === 10) {
                const [day, month, year] = birthDate.split('/')
                formattedBirthday = `${year}-${month}-${day}`
            }

            // Insert one booking record for EACH service, sequentially
            let currentStartTime = time
            const bookingsToInsert = []

            for (const service of selectedServices) {
                bookingsToInsert.push({
                    barbershop_id: client.id,
                    service_id: service.id,
                    date: dateStr,
                    time: currentStartTime,
                    customer_name: name,
                    customer_phone: phone,
                    customer_birthday: formattedBirthday,
                    barber_id: barber?.id || barberId || null,
                    status: 'confirmed'
                })

                // Advance currentStartTime by service duration for the next service
                const durationMin = parseDuration(service.duration)
                const [h, m] = currentStartTime.split(':').map(Number)
                let totalMin = h * 60 + m + durationMin
                const newH = Math.floor(totalMin / 60)
                const newM = totalMin % 60
                currentStartTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
            }

            // --- DOUBLE BOOKING CHECK ---
            // Extrai todos os horários que este agendamento vai ocupar
            const timesToCheck = bookingsToInsert.map(b => b.time)

            let query = supabase
                .from('bookings')
                .select('id')
                .eq('barbershop_id', client.id)
                .eq('date', dateStr)
                .neq('status', 'cancelled')
                .in('time', timesToCheck)

            if (barber?.id || barberId) {
                query = query.eq('barber_id', barber?.id || barberId)
            } else {
                query = query.is('barber_id', null)
            }

            const { data: existingBookings, error: checkError } = await query

            if (checkError) throw checkError

            if (existingBookings && existingBookings.length > 0) {
                alert("Desculpe, este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro horário.")
                setIsSubmitting(false)
                return
            }
            // ----------------------------

            const { error } = await supabase
                .from('bookings')
                .insert(bookingsToInsert)

            if (error) throw error

            // ENVIAR NOTIFICAÇÕES VIA WHATSAPP (Z-API)
            try {
                const serviceNames = selectedServices.map(s => s.title).join(" + ")
                const displayDate = dateStr.split('-').reverse().join('/')

                const msgCliente = `*Agendamento Confirmado!* 🎉\n\nOlá ${name},\nSeu horário está marcado para *${displayDate} às ${time}*.\nServiço: ${serviceNames}\n\nObrigado por escolher ${client.name}!`

                // Envia para o Cliente (Desativado conforme solicitação)
                // fetch('/api/whatsapp', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ phone: phone, message: msgCliente })
                // }).catch(console.error)

                // Envia para a barbearia (Verifica se existem números de notificação configurados)
                const msgProfissional = `*Novo Agendamento Recebido!* 📅\n\n*Cliente:* ${name} (${phone})\n*Data:* ${displayDate} às ${time}\n*Serviço:* ${serviceNames}\n*Profissional:* ${barber?.name || 'Qualquer'}`

                if (client.notificationPhones && client.notificationPhones.length > 0) {
                    // Envia para cada número listado nas configurações
                    for (const notifPhone of client.notificationPhones) {
                        fetch('/api/whatsapp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phone: notifPhone, message: msgProfissional })
                        }).catch(console.error)
                    }
                } else if (client.phone) {
                    // Fallback para o número principal se a lista estiver vazia
                    fetch('/api/whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: client.phone, message: msgProfissional })
                    }).catch(console.error)
                }

                // --- WEB PUSH NOTIFICATIONS ---
                // Notificar Provedor (Barbearia)
                fetch('/api/web-push/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: client.id,
                        title: 'Novo Agendamento! 📅',
                        body: `${name} agendou para ${displayDate} às ${time}`,
                        url: `/${client.slug}/admin/agenda`
                    })
                }).catch(console.error);

                // Notificar Cliente
                fetch('/api/web-push/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientPhone: phone,
                        barbershopId: client.id,
                        title: 'Agendamento Confirmado! 🎉',
                        body: `Seu horário está marcado para ${displayDate} às ${time}. Serviço: ${serviceNames}`,
                        url: `/${client.slug}/confirmacao`
                    })
                }).catch(console.error);
                // ------------------------------

            } catch (zapErr) {
                console.error("Erro ao notificar Z-API e Web Push", zapErr)
            }

            saveUserData() // Save for next time
            setIsSuccess(true)
        } catch (error) {
            console.error("Error creating booking:", error)
            alert("Erro ao criar agendamento. Tente novamente.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const addToCalendar = () => {
        if (selectedServices.length === 0) return
        const title = selectedServices.map(s => s.title).join(" + ")
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}`
        window.open(googleCalendarUrl, '_blank')
    }

    if (loading) return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-[#DBC278]" />
        </div>
    )

    if (selectedServices.length === 0 || !time || !client) return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white gap-4">
            <p>Dados inválidos para agendamento.</p>
            <Button variant="outline" onClick={() => router.push(`/${slug}`)}>Voltar</Button>
        </div>
    )

    // Date Formatting
    const dateObj = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
    const dateDisplay = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(dateObj)

    // Totals
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)
    const serviceNames = selectedServices.map(s => s.title).join(" + ")

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20">
                    <Check className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Agendado!</h1>
                <p className="text-gray-400 mb-6 max-w-xs mx-auto text-lg">
                    Seus serviços foram confirmados para <strong className="text-white">{dateDisplay} às {time}</strong>.
                    <br />
                    <span className="text-sm opacity-60">Duração estimada: {selectedServices.reduce((acc, s) => acc + parseDuration(s.duration), 0)} min</span>
                </p>

                <div className="w-full max-w-sm mx-auto space-y-4">
                    {/* Botões removidos pois a Z-API enviará as confirmações 100% no automático */}

                    {client.googleReviewLink && (
                        <div className="pt-4">
                            <Button
                                variant="outline"
                                className="w-full h-12 border-[#DBC278]/30 text-[#DBC278] hover:bg-[#DBC278]/10 font-medium"
                                style={{ borderColor: `${client.themeColor}4D`, color: client.themeColor }}
                                onClick={() => setIsReviewModalOpen(true)}
                            >
                                <Star className="w-4 h-4 mr-2" /> Avaliar Atendimento
                            </Button>
                        </div>
                    )}

                </div>
                {/* ... Upsell Logic ... */}
                <div className="w-full max-w-sm mx-auto mt-6">
                    <div className="bg-gradient-to-b from-[#1c1c1c] to-[#09090b] p-6 rounded-2xl border border-[#DBC278]/30 relative overflow-hidden group hover:border-[#DBC278]/50 transition-all" style={{ borderColor: `${client.themeColor}30` }}>
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                            <Crown className="w-40 h-40 text-[#DBC278] -rotate-12 transform translate-x-8 -translate-y-8" style={{ color: client.themeColor }} />
                        </div>

                        <div className="relative z-10 text-center">
                            <h3 className="text-[#DBC278] font-bold tracking-widest text-xs uppercase mb-2" style={{ color: client.themeColor }}>Convite Exclusivo</h3>
                            <h2 className="text-2xl font-bold text-white mb-1">Seja {client.name} VIP</h2>
                            <p className="text-zinc-400 text-sm mb-6">Economize com cortes ilimitados.</p>

                            <Button
                                className="w-full bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold h-12 rounded-xl"
                                style={{ backgroundColor: client.themeColor }}
                                onClick={() => handleDemoAction(() => {
                                    const clientPhone = String(client.phone || '').replace(/\D/g, '')
                                    const vipMessage = `Olá! Quero fazer parte do plano VIP exclusivo da barbearia 💈✨\nComo funciona o pagamento e a ativação?`
                                    window.open(`https://wa.me/55${clientPhone}?text=${encodeURIComponent(vipMessage)}`, '_blank')
                                })}
                            >
                                Quero ser VIP
                            </Button>
                        </div>
                    </div>
                </div>

                <Link
                    href={`/${client.slug}`}
                    className="mt-8 text-gray-500 hover:text-white underline underline-offset-4"
                >
                    Voltar ao Início
                </Link>

                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onOpenChange={setIsReviewModalOpen}
                    googleReviewLink={client.googleReviewLink || ""}
                    clientThemeColor={client.themeColor}
                    barbershopId={client.id}
                />

                <UpgradeModal
                    isOpen={isUpgradeModalOpen}
                    onOpenChange={setIsUpgradeModalOpen}
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans pb-64">
            <div className="max-w-md mx-auto min-h-screen bg-[#09090b] shadow-2xl shadow-black/50 relative">
                <header className="p-6 flex items-center gap-4 pt-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
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
                                    <h3 className="font-bold text-lg mb-1 text-white">
                                        {selectedServices.length === 1 ? selectedServices[0].title : `${selectedServices.length} Serviços`}
                                    </h3>
                                    {selectedServices.length > 1 && (
                                        <div className="flex flex-col gap-1 mb-2">
                                            {selectedServices.map(s => (
                                                <span key={s.id} className="text-zinc-400 text-xs">+ {s.title}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                                        <Clock className="w-4 h-4 text-[#DBC278]" style={{ color: client.themeColor }} />
                                        <span>{selectedServices.reduce((acc, s) => acc + parseDuration(s.duration), 0)} min</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[#DBC278]/10 flex items-center justify-center border border-[#DBC278]/20" style={{ backgroundColor: `${client.themeColor}10`, borderColor: `${client.themeColor}20` }}>
                                    <Crown className="w-6 h-6 text-[#DBC278]" style={{ color: client.themeColor }} />
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Total a Pagar</p>
                                    <p className="text-3xl font-bold text-[#DBC278]" style={{ color: client.themeColor }}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
                                    </p>
                                </div>
                                {barber && (
                                    <div className="text-right">
                                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Profissional</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="text-white font-bold">{barber.name}</span>
                                            {barber.photo_url && (
                                                <img src={barber.photo_url} className="w-6 h-6 rounded-full object-cover" alt={barber.name} />
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                        {new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(dateObj)}
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
                        <div className="absolute top-4 left-4 right-4 bottom-4 bg-[#DBC278]/5 blur-2xl rounded-full z-0" style={{ backgroundColor: `${client.themeColor}0D` }}></div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider ml-1">Seus Dados</h3>

                        <div className="space-y-3">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-focus-within:text-[#DBC278] group-focus-within:bg-[#DBC278]/10 transition-all" style={{ color: isSubmitting ? client.themeColor : undefined }}>
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Seu Nome Completo"
                                    className="w-full bg-[#1c1c1c] border border-zinc-800 rounded-2xl h-16 pl-16 pr-4 focus:outline-none focus:border-[#DBC278]/50 focus:ring-1 focus:ring-[#DBC278]/50 placeholder:text-zinc-600 text-white font-medium transition-all"
                                    style={{ borderColor: isSubmitting ? client.themeColor : undefined }}
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
                                    maxLength={15}
                                    onChange={(e) => {
                                        let v = e.target.value
                                        v = v.replace(/\D/g, "")
                                        v = v.replace(/^(\d{2})(\d)/g, "($1) $2")
                                        v = v.replace(/(\d)(\d{4})$/, "$1-$2")
                                        setPhone(v)
                                    }}
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

                    {/* Spacer for BottomStickyCTA */}
                    <div className="h-40 pointer-events-none" aria-hidden="true" />
                </main>

                <BottomStickyCTA className="translate-y-0 backdrop-blur-xl bg-[#09090b]/80 border-t border-zinc-800 md:absolute md:w-full md:max-w-md md:left-auto md:right-auto">
                    <Button
                        className={cn(
                            "w-full font-bold text-lg h-14 rounded-xl transition-all",
                            isValid && !isSubmitting
                                ? "bg-[#DBC278] text-black hover:bg-[#c4ad6b] shadow-[0_0_20px_rgba(219,194,120,0.3)] hover:shadow-[0_0_30px_rgba(219,194,120,0.5)] transform hover:-translate-y-0.5"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        )}
                        style={isValid && !isSubmitting ? { backgroundColor: client.themeColor } : undefined}
                        onClick={handleFinalize}
                        disabled={!isValid || isSubmitting}
                    >
                        {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
                    </Button>
                </BottomStickyCTA>
            </div>
        </div>
    )
}

function MessageCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    )
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-[#DBC278]">Carregando...</div>}>
            <ConfirmationContent />
        </Suspense>
    )
}
