"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Check, X, Clock, User, Phone, Scissors } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FullCalendarModal } from "@/components/DateSelector"

export function AgendaBoard({ onUpdate }: { onUpdate?: () => void }) {
    const params = useParams()
    const slug = params.slug as string
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date())
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    useEffect(() => {
        fetchBookings()
    }, [slug, date])

    const fetchBookings = async () => {
        setLoading(true)
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()

        if (barbershop) {
            const formattedDate = format(date, 'yyyy-MM-dd')

            const { data } = await supabase
                .from('bookings')
                .select(`*, services (title)`)
                .eq('barbershop_id', barbershop.id)
                .eq('date', formattedDate)
                .neq('status', 'cancelled')
                .order('time', { ascending: true })

            if (data) setBookings(data)
        }
        setLoading(false)
    }

    const updateStatus = async (id: string, newStatus: string) => {
        if (newStatus === 'cancelled') {
            setBookings(prev => prev.filter(b => b.id !== id))
        } else {
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
        }

        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            console.error("Error updating booking:", error)
            fetchBookings()
        } else {
            if (onUpdate) onUpdate()
        }
    }

    const navigateDate = (direction: number) => {
        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() + direction)
        setDate(newDate)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">Agenda do Dia</h2>
                    <p className="text-zinc-400 text-sm capitalize">
                        {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-[#1c1c1c] p-2 rounded-xl border border-white/5">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white" onClick={() => navigateDate(-1)}>‹</Button>
                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="flex items-center gap-2 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <CalendarIcon className="w-4 h-4 text-[#DBC278]" />
                        <span className="text-white font-medium capitalize text-sm">
                            {format(date, "EEE, d 'de' MMM", { locale: ptBR })}
                        </span>
                    </button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white" onClick={() => navigateDate(1)}>›</Button>
                    <div className="w-px h-5 bg-zinc-800 mx-1" />
                    {format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? (
                        <span className="h-8 px-3 text-xs text-[#DBC278] font-bold flex items-center">Hoje</span>
                    ) : (
                        <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-zinc-400 hover:text-white" onClick={() => setDate(new Date())}>Hoje</Button>
                    )}
                </div>
            </div>

            {/* Booking Cards */}
            <div className="space-y-3">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-[#1c1c1c] rounded-2xl border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-600 bg-[#1c1c1c] rounded-2xl border border-white/5">
                        <Clock className="w-10 h-10 mb-3 opacity-20" />
                        <p className="font-medium">Nenhum agendamento para este dia</p>
                        <p className="text-sm text-zinc-700 mt-1">Aproveite para descansar! 😄</p>
                    </div>
                ) : (
                    bookings.map((booking) => (
                        <div
                            key={booking.id}
                            className="bg-[#1c1c1c] rounded-2xl border border-white/5 p-4 flex items-center gap-4 hover:border-zinc-700 transition-all"
                        >
                            {/* Time */}
                            <div className="flex-shrink-0 w-16 text-center">
                                <span className="font-mono text-xl font-bold text-[#DBC278] leading-none">{booking.time?.slice(0, 5)}</span>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-12 bg-zinc-800 flex-shrink-0" />

                            {/* Client Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <User className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                                    <span className="font-semibold text-white text-sm truncate">{booking.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Phone className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                                    <span className="text-xs text-zinc-500">{booking.customer_phone}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Scissors className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                                    <span className="text-xs text-zinc-400 truncate">{booking.services?.title || "Serviço Removido"}</span>
                                </div>
                            </div>

                            {/* Status + Actions */}
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <StatusBadge status={booking.status} />
                                <div className="flex gap-1.5">
                                    {booking.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            className="h-8 w-8 p-0 bg-[#DBC278]/15 text-[#DBC278] hover:bg-[#DBC278]/30 border border-[#DBC278]/20 rounded-lg"
                                            onClick={() => updateStatus(booking.id, 'confirmed')}
                                            title="Confirmar"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    {booking.status === 'confirmed' && (
                                        <Button
                                            size="sm"
                                            className="h-8 w-8 p-0 bg-green-500/15 text-green-400 hover:bg-green-500/30 border border-green-500/20 rounded-lg"
                                            onClick={() => updateStatus(booking.id, 'completed')}
                                            title="Concluir Atendimento"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg"
                                        onClick={() => updateStatus(booking.id, 'cancelled')}
                                        title="Cancelar Agendamento"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isCalendarOpen && (
                <FullCalendarModal
                    selectedDate={date}
                    onSelect={(d) => {
                        setDate(d)
                        setIsCalendarOpen(false)
                    }}
                    onClose={() => setIsCalendarOpen(false)}
                />
            )}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'confirmed':
            return <Badge className="bg-[#DBC278]/20 text-[#DBC278] border border-[#DBC278]/30 whitespace-nowrap text-xs px-2 py-0.5">Confirmado</Badge>
        case 'cancelled':
            return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap text-xs px-2 py-0.5">Cancelado</Badge>
        case 'completed':
            return <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap text-xs px-2 py-0.5">Concluído</Badge>
        default:
            return <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 whitespace-nowrap text-xs px-2 py-0.5">Pendente</Badge>
    }
}
