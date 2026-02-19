"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { format, addMinutes, setHours, setMinutes, isBefore, getDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { supabase } from "@/lib/supabase"
import { TimeSlotSelector } from "@/components/TimeSlotSelector"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Scissors, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

function HorarioContent() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()

    const slug = params.slug as string
    const dateStr = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')
    const servicesParam = searchParams.get('services') || ''
    const barberParam = searchParams.get('barber') || null

    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [barbershopId, setBarbershopId] = useState<string | undefined>(undefined)
    const [client, setClient] = useState<any>(null)
    const [barberName, setBarberName] = useState<string | null>(null)
    const [barberAvatar, setBarberAvatar] = useState<string | null>(null)
    const [serviceNames, setServiceNames] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    const selectedDate = useMemo(() => {
        const [year, month, day] = dateStr.split('-').map(Number)
        return new Date(year, month - 1, day)
    }, [dateStr])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)

            const { data: barbershop } = await supabase
                .from('barbershops')
                .select('*')
                .eq('slug', slug)
                .single()

            if (barbershop) {
                setClient(barbershop)
                setBarbershopId(barbershop.id)

                // Fetch service names
                if (servicesParam) {
                    const ids = servicesParam.split(',').filter(Boolean)
                    const { data: svcs } = await supabase
                        .from('services')
                        .select('name')
                        .in('id', ids)
                    if (svcs) setServiceNames(svcs.map((s: any) => s.name))
                }
            }

            if (barberParam) {
                const { data: barber } = await supabase
                    .from('barbers')
                    .select('name, avatar_url')
                    .eq('id', barberParam)
                    .single()
                if (barber) {
                    setBarberName(barber.name)
                    setBarberAvatar(barber.avatar_url)
                }
            }

            setLoading(false)
        }
        fetchData()
    }, [slug, barberParam, servicesParam])

    const timeSlots = useMemo(() => {
        if (!client?.opening_hours) return []
        const dayKey = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][getDay(selectedDate)]
        const config = client.opening_hours[dayKey]
        if (!config || !config.open) return []

        const slots: string[] = []
        const [startHour, startMinute] = (config.start || "09:00").split(':').map(Number)
        const [endHour, endMinute] = (config.end || "18:00").split(':').map(Number)
        let currentTime = setMinutes(setHours(selectedDate, startHour), startMinute)
        const endTime = setMinutes(setHours(selectedDate, endHour), endMinute)
        const now = new Date()

        while (isBefore(currentTime, endTime)) {
            if (isSameDay(selectedDate, now) && isBefore(currentTime, now)) {
                currentTime = addMinutes(currentTime, 30)
                continue
            }
            slots.push(format(currentTime, 'HH:mm'))
            currentTime = addMinutes(currentTime, 30)
        }
        return slots
    }, [selectedDate, client])

    const handleConfirm = () => {
        if (!selectedTime) return
        let url = `/${slug}/confirmacao?services=${servicesParam}&date=${dateStr}&time=${selectedTime}`
        if (barberParam) url += `&barber=${barberParam}`
        router.push(url)
    }

    const themeColor = client?.theme_color || "#DBC278"

    // Format date parts
    const dayName = format(selectedDate, "EEEE", { locale: ptBR })
    const dayNum = format(selectedDate, "d")
    const monthName = format(selectedDate, "MMMM", { locale: ptBR })

    return (
        <div className="min-h-screen bg-[#09090b] font-sans">
            <div className="max-w-md mx-auto min-h-screen relative flex flex-col">

                {/* ── HERO HEADER ── */}
                <div className="relative overflow-hidden">
                    {/* Gradient background */}
                    <div
                        className="absolute inset-0 opacity-15"
                        style={{ background: `radial-gradient(ellipse at top, ${themeColor}, transparent 70%)` }}
                    />
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 opacity-5"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                    />

                    <div className="relative px-5 pt-12 pb-8">
                        {/* Back button */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Voltar</span>
                        </button>

                        {/* Title */}
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4"
                                style={{ borderColor: `${themeColor}40`, backgroundColor: `${themeColor}10` }}>
                                <Sparkles className="w-3 h-3" style={{ color: themeColor }} />
                                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: themeColor }}>
                                    Escolha seu horário
                                </span>
                            </div>

                            {/* Big date display */}
                            <div className="flex items-end justify-center gap-3">
                                <div className="text-center">
                                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-1 capitalize">{dayName}</p>
                                    <p className="text-7xl font-black text-white leading-none tracking-tighter">{dayNum}</p>
                                    <p className="text-zinc-400 text-sm font-semibold capitalize mt-1">{monthName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── BOOKING CONTEXT PILLS ── */}
                <div className="px-5 pb-6">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {/* Services pill */}
                        {serviceNames.length > 0 ? (
                            serviceNames.map((name, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
                                    <Scissors className="w-3 h-3 text-zinc-500" />
                                    <span className="text-xs font-semibold text-zinc-300">{name}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
                                <Scissors className="w-3 h-3 text-zinc-500" />
                                <span className="text-xs font-semibold text-zinc-300">
                                    {servicesParam.split(',').filter(Boolean).length} serviço(s)
                                </span>
                            </div>
                        )}

                        {/* Barber pill */}
                        {barberName && (
                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
                                {barberAvatar ? (
                                    <img src={barberAvatar} alt={barberName} className="w-4 h-4 rounded-full object-cover" />
                                ) : (
                                    <User className="w-3 h-3 text-zinc-500" />
                                )}
                                <span className="text-xs font-semibold text-zinc-300">{barberName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── DIVIDER ── */}
                <div className="px-5 mb-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                </div>

                {/* ── TIME SLOTS ── */}
                <div className="flex-1 px-5 pb-36">
                    {loading ? (
                        <div className="space-y-8">
                            {[1, 2].map(i => (
                                <div key={i}>
                                    <div className="h-7 w-24 bg-zinc-800/60 rounded-full mb-4 animate-pulse mx-auto" />
                                    <div className="grid grid-cols-3 gap-3">
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <div key={j} className="h-16 bg-zinc-800/40 rounded-2xl animate-pulse" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : timeSlots.length > 0 ? (
                        <TimeSlotSelector
                            slots={timeSlots}
                            selectedSlot={selectedTime}
                            onSelect={setSelectedTime}
                            barbershopId={barbershopId}
                            barberId={barberParam}
                            date={dateStr}
                            themeColor={themeColor}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
                                <span className="text-3xl">😔</span>
                            </div>
                            <p className="text-white font-bold text-lg">Sem horários disponíveis</p>
                            <p className="text-zinc-500 text-sm mt-1 max-w-[220px]">
                                Não há vagas abertas para esta data. Tente outro dia!
                            </p>
                            <button
                                onClick={() => router.back()}
                                className="mt-6 text-sm font-semibold underline underline-offset-4"
                                style={{ color: themeColor }}
                            >
                                ← Escolher outra data
                            </button>
                        </div>
                    )}
                </div>

                {/* ── BOTTOM CTA ── */}
                <div className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto">
                    <div className="px-5 pb-8 pt-6 bg-gradient-to-t from-[#09090b] via-[#09090b]/98 to-transparent">
                        {selectedTime ? (
                            <button
                                onClick={handleConfirm}
                                className="w-full h-14 rounded-2xl font-bold text-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl"
                                style={{
                                    backgroundColor: themeColor,
                                    boxShadow: `0 8px 32px ${themeColor}50`
                                }}
                            >
                                <span>Confirmar às {selectedTime}</span>
                                <span className="text-xl">→</span>
                            </button>
                        ) : (
                            <div className="w-full h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                <span className="text-zinc-500 font-semibold text-sm">Toque em um horário para selecionar</span>
                            </div>
                        )}

                        {/* Progress indicator */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <div className="w-6 h-1 rounded-full bg-zinc-700" />
                            <div className="w-6 h-1 rounded-full" style={{ backgroundColor: themeColor }} />
                            <div className="w-6 h-1 rounded-full bg-zinc-700" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function HorarioPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#DBC278', borderTopColor: 'transparent' }} />
            </div>
        }>
            <HorarioContent />
        </Suspense>
    )
}
