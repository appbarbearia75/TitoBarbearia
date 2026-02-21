"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { TIME_SLOTS } from "@/app/data"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

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
    avatar: string
    themeColor: string
    services: ServiceType[]
}

function BookingContent() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const serviceId = searchParams.get("service")
    const dateStr = searchParams.get("date")

    const slug = params?.slug as string
    const [client, setClient] = useState<ClientType | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

    useEffect(() => {
        if (slug) {
            fetchBarbershop()
        }
    }, [slug])

    const fetchBarbershop = async () => {
        try {
            const { data: barbershop } = await supabase
                .from('barbershops')
                .select('*')
                .eq('slug', slug)
                .single()

            if (barbershop) {
                const { data: services } = await supabase
                    .from('services')
                    .select('*')
                    .eq('barbershop_id', barbershop.id)
                    .order('position', { ascending: true })
                    .order('price', { ascending: true })

                const formattedServices = (services || []).map(s => ({
                    id: s.id,
                    title: s.title,
                    price: Number(s.price),
                    description: s.description,
                    duration: s.duration || "30 min"
                }))

                setClient({
                    id: barbershop.id,
                    slug: barbershop.slug,
                    name: barbershop.name,
                    avatar: barbershop.avatar_url || "/real_avatar.png",
                    themeColor: barbershop.theme_color || "#DBC278",
                    services: formattedServices
                })
            }
        } catch (error) {
            console.error("Error fetching barbershop:", error)
        } finally {
            setLoading(false)
        }
    }

    const service = client?.services.find((s) => s.id === serviceId)

    const handleConfirm = () => {
        if (selectedSlot && serviceId && client) {
            router.push(`/${client.slug}/confirmacao?service=${serviceId}&time=${selectedSlot}&date=${dateStr}`)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    if (!client || !service) {
        return (
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white gap-4">
                <p>Serviço ou Barbearia não encontrados.</p>
                <Button variant="outline" onClick={() => router.push(`/${slug}`)}>Voltar</Button>
            </div>
        )
    }

    // Format date for display
    const dateObj = dateStr ? new Date(dateStr) : new Date()
    const dateDisplay = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(dateObj)

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans">
            {/* HEADER */}
            <header className="flex items-center gap-4 p-6 pt-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-[#1c1c1c] flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold">Escolha o horário</h1>
                    <p className="text-xs text-gray-400 capitalize">{dateDisplay}</p>
                </div>
            </header>

            <main className="px-6 pb-32">
                {/* Service Summary Small */}
                <div className="flex items-center justify-between p-4 bg-[#1c1c1c] rounded-xl mb-8 border border-zinc-800">
                    <div>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Serviço</span>
                        <p className="font-semibold text-white">{service.title}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Valor</span>
                        <p className="font-semibold text-[#FFD84D]" style={{ color: client.themeColor }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                        </p>
                    </div>
                </div>

                {/* Time Grid */}
                <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Manhã</h2>
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {TIME_SLOTS.slice(0, 6).map(slot => (
                        <TimeButton key={slot} slot={slot} selected={selectedSlot === slot} onSelect={() => setSelectedSlot(slot)} themeColor={client.themeColor} />
                    ))}
                </div>

                <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Tarde</h2>
                <div className="grid grid-cols-4 gap-3">
                    {TIME_SLOTS.slice(6).map(slot => (
                        <TimeButton key={slot} slot={slot} selected={selectedSlot === slot} onSelect={() => setSelectedSlot(slot)} themeColor={client.themeColor} />
                    ))}
                </div>
            </main>

            {/* BOTTOM FIXED */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 p-6 bg-[#09090b]/80 backdrop-blur-xl border-t border-zinc-900 transition-transform duration-300 z-50",
                selectedSlot ? "translate-y-0" : "translate-y-full"
            )}>
                <Button
                    className="w-full bg-[#FFD84D] text-black font-bold text-lg h-14 rounded-xl hover:bg-[#fcec9f] shadow-[0_0_20px_rgba(255,216,77,0.3)]"
                    style={{ backgroundColor: client.themeColor }}
                    onClick={handleConfirm}
                >
                    Continuar
                </Button>
            </div>
        </div>
    )
}

function TimeButton({ slot, selected, onSelect, themeColor }: { slot: string, selected: boolean, onSelect: () => void, themeColor: string }) {
    return (
        <button
            onClick={onSelect}
            className={cn(
                "h-12 rounded-lg font-medium text-sm transition-all border",
                selected
                    ? "bg-[#FFD84D] text-black border-[#FFD84D] font-bold shadow-lg shadow-[#FFD84D]/20 scale-105"
                    : "bg-[#1c1c1c] text-white border-transparent hover:border-zinc-700"
            )}
            style={selected ? { backgroundColor: themeColor, borderColor: themeColor, boxShadow: `0 0 10px ${themeColor}40` } : undefined}
        >
            {slot}
        </button>
    )
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-[#FFD84D]">Carregando...</div>}>
            <BookingContent />
        </Suspense>
    )
}
