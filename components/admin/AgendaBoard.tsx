"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Check, X, Clock, User, Phone, Scissors, Lock, Unlock, MessageSquare, Plus, Loader2, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FullCalendarModal } from "@/components/DateSelector"
import { CreateManualBookingModal } from "@/components/admin/CreateManualBookingModal"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"

export function AgendaBoard({ onUpdate }: { onUpdate?: () => void }) {
    const params = useParams()
    const slug = params.slug as string
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date())
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [isLockModalOpen, setIsLockModalOpen] = useState(false)
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false)
    const [editingLockedPeriod, setEditingLockedPeriod] = useState<any>(null)
    const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false)
    const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false)

    useEffect(() => {
        fetchBookings()
        const interval = setInterval(() => {
            fetchBookings(false)
        }, 60000)
        return () => clearInterval(interval)
    }, [slug, date])

    const fetchBookings = async (showLoading = true) => {
        if (showLoading) setLoading(true)
        const { data: barbershop } = await supabase.from('barbershops').select('id, auto_complete_bookings').eq('slug', slug).single()

        if (barbershop) {
            const formattedDate = format(date, 'yyyy-MM-dd')
            const dayOfWeek = date.getDay()

            // 1. Fetch real bookings for this day
            const { data: realBookings } = await supabase
                .from('bookings')
                .select(`*, services (title, duration, price), barbers (commission_type, commission_value)`)
                .eq('barbershop_id', barbershop.id)
                .eq('date', formattedDate)
                .order('time', { ascending: true })

            // 2. Fetch recurring bookings for this day of week
            const { data: recurringBookings } = await supabase
                .from('recurring_bookings')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .eq('day_of_week', dayOfWeek)

            if (realBookings || recurringBookings) {
                // Map of time -> booking to handle potential overrides/merges
                const agendaMap = new Map<string, any>()

                const now = new Date()

                // Process recurring first (default background)
                recurringBookings?.forEach(rb => {
                    const timeKey = rb.start_time.slice(0, 5)
                    let isExpired = false

                    if (format(now, 'yyyy-MM-dd') === formattedDate) {
                        const bDate = new Date(`${formattedDate}T${timeKey}:00`)
                        bDate.setMinutes(bDate.getMinutes() + 30) // 30 min por padrão para recorrente
                        if (now >= bDate) isExpired = true
                    } else if (format(now, 'yyyy-MM-dd') > formattedDate) {
                        isExpired = true
                    }

                    if (!isExpired) {
                        agendaMap.set(timeKey, {
                            id: `recurring-${rb.id}`,
                            recurringId: rb.id,
                            time: timeKey,
                            customer_name: rb.client_name,
                            customer_phone: rb.client_phone,
                            status: 'recurring', // Special status for UI
                            services: { title: "Horário Fixo" }
                        })
                    }
                })

                // Process real bookings (overwrites or adds)
                realBookings?.forEach(b => {
                    const timeKey = b.time?.slice(0, 5)
                    if (timeKey) {
                        if (b.status === 'cancelled') {
                            agendaMap.delete(timeKey)
                        } else {
                            if (b.status === 'confirmed' && b.date <= format(now, 'yyyy-MM-dd')) {
                                const bDate = new Date(`${b.date}T${b.time}:00`)
                                const durationStr = b.services?.duration || '30'
                                const durationMins = parseInt(durationStr.replace(/\D/g, '')) || 30
                                bDate.setMinutes(bDate.getMinutes() + durationMins)

                                if (now >= bDate && barbershop.auto_complete_bookings !== false) {
                                    b.status = 'completed'

                                    // Calculate commission
                                    let commission_earned = 0
                                    if (b.barbers) {
                                        const cType = b.barbers.commission_type || 'percentage'
                                        const cValue = parseFloat(b.barbers.commission_value) || 0
                                        const bPrice = parseFloat(b.services?.price || '0')
                                        if (cType === 'percentage') {
                                            commission_earned = bPrice * (cValue / 100)
                                        } else if (cType === 'fixed') {
                                            commission_earned = cValue
                                        }
                                    }

                                    supabase.from('bookings').update({ status: 'completed', commission_earned: commission_earned }).eq('id', b.id).then()
                                }
                            }

                            agendaMap.set(timeKey, b)
                        }
                    }
                })

                const merged = Array.from(agendaMap.values()).sort((a, b) => a.time.localeCompare(b.time))
                setBookings(merged)
            }
        }
        setLoading(false)
    }

    const updateStatus = async (id: string, newStatus: string) => {
        const isRecurring = id.startsWith('recurring-')
        const formattedDate = format(date, 'yyyy-MM-dd')

        if (isRecurring) {
            // To "cancel" a recurring for today, we insert a cancelled record
            const bookingToCancel = bookings.find(b => b.id === id)
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()

            if (bookingToCancel && barbershop) {
                const { error } = await supabase.from('bookings').insert([{
                    barbershop_id: barbershop.id,
                    date: formattedDate,
                    time: bookingToCancel.time,
                    customer_name: bookingToCancel.customer_name,
                    customer_phone: bookingToCancel.customer_phone,
                    status: 'cancelled'
                }])

                if (error) console.error("Error creating override:", error)
            }
            // Remove from local view immediately
            setBookings(prev => prev.filter(b => b.id !== id))
        } else {
            if (newStatus === 'cancelled') {
                setBookings(prev => prev.filter(b => b.id !== id))
            } else {
                setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
            }

            let commission_earned = 0
            if (newStatus === 'completed') {
                const b = bookings.find(b => b.id === id)
                if (b && b.barbers) {
                    const cType = b.barbers.commission_type || 'percentage'
                    const cValue = parseFloat(b.barbers.commission_value) || 0
                    const bPrice = parseFloat(b.services?.price || '0')
                    if (cType === 'percentage') {
                        commission_earned = bPrice * (cValue / 100)
                    } else if (cType === 'fixed') {
                        commission_earned = cValue
                    }
                }
            }

            const updateData: any = { status: newStatus }
            if (newStatus === 'completed') {
                updateData.commission_earned = commission_earned
            }

            const { error } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', id)

            if (error) {
                console.error("Error updating booking:", error)
                fetchBookings()
            }
        }

        if (onUpdate) onUpdate()
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
                <div className="flex items-center gap-2 bg-[#1c1c1c] p-2 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <Button
                        size="sm"
                        className="h-8 bg-green-500 hover:bg-green-600 text-white font-bold text-xs"
                        onClick={() => setIsManualBookingModalOpen(true)}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Agendamento
                    </Button>
                    <div className="w-px h-5 bg-zinc-800 mx-1" />
                    <Button
                        size="sm"
                        className="h-8 bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold text-xs"
                        onClick={() => setIsLockModalOpen(true)}
                    >
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        Travar Agenda
                    </Button>
                    <div className="w-px h-5 bg-zinc-800 mx-1" />
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-[#DBC278]/20 bg-[#DBC278]/10 text-[#DBC278] hover:bg-[#DBC278]/20 hover:text-[#DBC278] font-bold text-xs"
                        onClick={() => setIsUnlockModalOpen(true)}
                    >
                        <Unlock className="w-3.5 h-3.5 mr-1.5" />
                        Liberar Agenda
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-white/10 bg-transparent text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-bold"
                        onClick={() => setIsCompletedModalOpen(true)}
                    >
                        <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                        Concluídos
                    </Button>
                    <div className="w-px h-5 bg-zinc-800 mx-1" />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white" onClick={() => navigateDate(-1)}>‹</Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsCalendarOpen(true)}
                        className="h-8 w-8 p-0 hover:bg-zinc-800 transition-colors"
                        title="Escolher Data"
                    >
                        <CalendarIcon className="w-4 h-4 text-[#DBC278]" />
                    </Button>
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
                            className="bg-[#1c1c1c] rounded-2xl border border-white/5 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:border-zinc-700 transition-all"
                        >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                {/* Time */}
                                <div className="flex-shrink-0 w-14 sm:w-16 text-center">
                                    <span className="font-mono text-xl sm:text-2xl font-bold text-[#DBC278] leading-none">{booking.time?.slice(0, 5)}</span>
                                </div>

                                {/* Divider */}
                                <div className="hidden sm:block w-px h-12 bg-zinc-800 flex-shrink-0" />

                                {/* Client Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1 sm:mb-1.5">
                                        <User className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                                        <span className="font-semibold text-white text-sm sm:text-base truncate">{booking.customer_name}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                                            <span className="text-xs text-zinc-500">{booking.customer_phone}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Scissors className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                                            <span className="text-xs text-zinc-400 truncate">{booking.services?.title || "Serviço Removido"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status + Actions */}
                            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2 flex-shrink-0 border-t border-white/5 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
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
                                    {/* Adicionando botão 'Concluir' manualmente */}
                                    {booking.status === 'confirmed' && (
                                        <Button
                                            size="sm"
                                            className="h-8 w-8 p-0 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg"
                                            onClick={() => updateStatus(booking.id, 'completed')}
                                            title="Concluir"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    {booking.status !== 'completed' && (
                                        <Button
                                            size="sm"
                                            className="h-8 w-8 p-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg"
                                            onClick={() => updateStatus(booking.id, 'cancelled')}
                                            title="Cancelar/Liberar"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Waitlist Section */}
            {!loading && (
                <WaitlistSection date={format(date, 'yyyy-MM-dd')} slug={slug} />
            )}

            <CompletedBookingsModal
                isOpen={isCompletedModalOpen}
                onOpenChange={setIsCompletedModalOpen}
                slug={slug}
                onSuccess={fetchBookings}
            />

            <LockSlotModal
                isOpen={isLockModalOpen}
                onOpenChange={(open) => {
                    setIsLockModalOpen(open)
                    if (!open) setEditingLockedPeriod(null)
                }}
                date={format(date, 'yyyy-MM-dd')}
                slug={slug}
                onSuccess={() => {
                    fetchBookings()
                    if (editingLockedPeriod) setIsUnlockModalOpen(true)
                }}
                editData={editingLockedPeriod}
            />

            <UnlockAgendaModal
                isOpen={isUnlockModalOpen}
                onOpenChange={setIsUnlockModalOpen}
                slug={slug}
                onSuccess={fetchBookings}
                onEdit={(period) => {
                    setEditingLockedPeriod(period)
                    setIsUnlockModalOpen(false)
                    setIsLockModalOpen(true)
                }}
            />

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

            <CreateManualBookingModal
                isOpen={isManualBookingModalOpen}
                onOpenChange={setIsManualBookingModalOpen}
                slug={slug}
                onSuccess={fetchBookings}
                initialDate={date}
            />
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
        case 'locked':
            return <Badge className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 whitespace-nowrap text-xs px-2 py-0.5">Bloqueado</Badge>
        case 'recurring':
            return <Badge className="bg-[#DBC278]/10 text-[#DBC278] border border-[#DBC278]/20 whitespace-nowrap text-xs px-2 py-0.5 font-bold">Horário Fixo</Badge>
        default:
            return <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 whitespace-nowrap text-xs px-2 py-0.5">Pendente</Badge>
    }
}

function WaitlistSection({ date, slug }: { date: string, slug: string }) {
    const [waitlist, setWaitlist] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [removeModalOpen, setRemoveModalOpen] = useState(false)
    const [clientToRemove, setClientToRemove] = useState<{ id: string, name: string } | null>(null)

    useEffect(() => {
        fetchWaitlist()
    }, [date])

    const fetchWaitlist = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            const { data } = await supabase
                .from('waitlist')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .eq('date', date)
                .order('created_at', { ascending: true })
            if (data) setWaitlist(data)
        }
        setLoading(false)
    }

    const handleRemoveClick = (item: any) => {
        setClientToRemove({ id: item.id, name: item.customer_name })
        setRemoveModalOpen(true)
    }

    const confirmRemove = async () => {
        if (!clientToRemove) return
        const { error } = await supabase.from('waitlist').delete().eq('id', clientToRemove.id)
        if (!error) {
            setWaitlist(prev => prev.filter(item => item.id !== clientToRemove.id))
        } else {
            alert("Erro ao remover o cliente da lista.")
        }
        setRemoveModalOpen(false)
        setClientToRemove(null)
    }

    if (loading) return null
    if (waitlist.length === 0) return null

    return (
        <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#DBC278]" />
                <h3 className="text-lg font-bold">Lista de Espera ({waitlist.length})</h3>
            </div>
            <div className="grid gap-3">
                {waitlist.map((item) => (
                    <div key={item.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-sm">{item.customer_name}</p>
                            <p className="text-xs text-zinc-500">{item.customer_phone}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-[#DBC278] hover:bg-[#DBC278]/10"
                                onClick={() => window.open(`https://wa.me/55${item.customer_phone.replace(/\D/g, '')}?text=Olá ${item.customer_name}, vagou um horário na barbearia!`, '_blank')}
                            >
                                <Phone className="w-4 h-4 mr-2" />
                                Avisar
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:bg-red-500/10 hover:text-red-400 p-2 h-auto"
                                onClick={() => handleRemoveClick(item)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
                <DialogContent className="bg-[#1c1c1c] border-zinc-800 text-white sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remover da Lista de Espera</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-zinc-400">
                            Deseja realmente remover o cliente <strong className="text-white">{clientToRemove?.name}</strong> da lista de espera?
                        </p>
                    </div>
                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setRemoveModalOpen(false)}
                            className="text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmRemove}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
                        >
                            Sim, Remover
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function LockSlotModal({ isOpen, onOpenChange, date, slug, onSuccess, editData }: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    date: string,
    slug: string,
    onSuccess: () => void,
    editData?: any
}) {
    const [startDate, setStartDate] = useState(date)
    const [endDate, setEndDate] = useState(date)
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (editData) {
            setStartDate(editData.start_date)
            setEndDate(editData.end_date)
            setStartTime(editData.start_time || "")
            setEndTime(editData.end_time || "")
            setReason(editData.reason || "")
        } else {
            setStartDate(date)
            setEndDate(date)
            setStartTime("")
            setEndTime("")
            setReason("")
        }
    }, [date, editData, isOpen])

    const formatTimeMask = (value: string) => {
        let numbers = value.replace(/\D/g, "")
        if (numbers.length > 4) numbers = numbers.slice(0, 4)
        if (numbers.length >= 3) {
            return `${numbers.slice(0, 2)}:${numbers.slice(2)}`
        }
        return numbers
    }

    const handleLock = async () => {
        if (!startDate || !endDate || !reason) {
            alert("Preencha as datas e o motivo obrigatoriamente.")
            return
        }
        setLoading(true)

        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            let error = null
            if (editData) {
                // Remove o registro antigo para evitar falhas silenciosas de RLS (Update Policy)
                const { error: deleteError } = await supabase.from('closed_periods').delete().eq('id', editData.id)
                error = deleteError
            }

            if (!error) {
                const { error: insertError } = await supabase.from('closed_periods').insert([{
                    barbershop_id: barbershop.id,
                    start_date: startDate,
                    end_date: endDate,
                    start_time: startTime || null,
                    end_time: endTime || null,
                    reason: reason
                }])
                error = insertError
            }

            if (error) {
                console.error("Error saving period:", error)
                alert("Erro ao travar agenda.")
            } else {
                onSuccess()
                onOpenChange(false)
                setStartTime("")
                setEndTime("")
                setReason("")
            }
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1c1c1c] border-white/5 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle>{editData ? "Editar Travamento da Agenda" : "Travar Agenda (Início e Fim)"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Data Início</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Horário INÍCIO (opc)</label>
                            <Input
                                placeholder="Ex: 08:00"
                                value={startTime}
                                onChange={(e) => setStartTime(formatTimeMask(e.target.value))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Data Fim</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Horário FIM (opc)</label>
                            <Input
                                placeholder="Ex: 18:00"
                                value={endTime}
                                onChange={(e) => setEndTime(formatTimeMask(e.target.value))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Motivo (Obrigatório)</label>
                        <Input
                            placeholder="Ex: Férias, Almoço..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-zinc-800 border-zinc-700"
                        />
                    </div>
                    <p className="text-xs text-zinc-500">
                        O motivo será exibido aos clientes quando tentarem acessar a agenda nessas datas.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
                        Cancelar
                    </Button>
                    <Button onClick={handleLock} disabled={loading || !startDate || !endDate || !reason} className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (editData ? <Pencil className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />)}
                        {editData ? "Salvar Edição" : "Travar Agenda"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function CompletedBookingsModal({ isOpen, onOpenChange, slug, onSuccess }: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    slug: string,
    onSuccess: () => void
}) {
    const [completedBookings, setCompletedBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    const [filterType, setFilterType] = useState<'dia' | 'semana' | 'mes' | 'todos'>('dia')

    useEffect(() => {
        if (isOpen) {
            fetchCompleted()
        } else {
            setDeleteConfirmId(null)
        }
    }, [isOpen, slug, filterType])

    const fetchCompleted = async () => {
        setLoading(true)
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            let query = supabase
                .from('bookings')
                .select(`*, services (title)`)
                .eq('barbershop_id', barbershop.id)
                .eq('status', 'completed')
                .order('date', { ascending: false })
                .order('time', { ascending: false })

            const now = new Date()
            if (filterType === 'dia') {
                const today = format(now, 'yyyy-MM-dd')
                query = query.eq('date', today)
            } else if (filterType === 'semana') {
                const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                query = query.gte('date', start).lte('date', end)
            } else if (filterType === 'mes') {
                const start = format(startOfMonth(now), 'yyyy-MM-dd')
                const end = format(endOfMonth(now), 'yyyy-MM-dd')
                query = query.gte('date', start).lte('date', end)
            } else {
                query = query.limit(50) // limite de segurança para "todos"
            }

            const { data } = await query
            if (data) setCompletedBookings(data)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('bookings').delete().eq('id', id)
        if (!error) {
            setCompletedBookings(prev => prev.filter(b => b.id !== id))
            onSuccess()
        } else {
            console.error("Erro ao deletar", error)
            alert("Erro ao remover atendimento.")
        }
        setDeleteConfirmId(null)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1c1c1c] border-white/5 text-white max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Check className="w-5 h-5 text-green-500" />
                        Histórico de Atendimentos Concluídos
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                    <Button
                        size="sm"
                        variant="ghost"
                        className={`text-xs h-7 rounded-full ${filterType === 'dia' ? 'bg-[#DBC278] text-black font-bold hover:bg-[#c9b06b]' : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'}`}
                        onClick={() => setFilterType('dia')}
                    >
                        Hoje
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className={`text-xs h-7 rounded-full ${filterType === 'semana' ? 'bg-[#DBC278] text-black font-bold hover:bg-[#c9b06b]' : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'}`}
                        onClick={() => setFilterType('semana')}
                    >
                        Esta Semana
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className={`text-xs h-7 rounded-full ${filterType === 'mes' ? 'bg-[#DBC278] text-black font-bold hover:bg-[#c9b06b]' : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'}`}
                        onClick={() => setFilterType('mes')}
                    >
                        Este Mês
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className={`text-xs h-7 rounded-full ${filterType === 'todos' ? 'bg-[#DBC278] text-black font-bold hover:bg-[#c9b06b]' : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'}`}
                        onClick={() => setFilterType('todos')}
                    >
                        Últimos 50
                    </Button>
                </div>

                <div className="overflow-y-auto flex-1 pr-2 space-y-3 mt-4">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                        </div>
                    ) : completedBookings.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                            Nenhum atendimento concluído encontrado.
                        </div>
                    ) : (
                        completedBookings.map(b => (
                            <div key={b.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[#DBC278] font-bold text-sm">
                                            {format(new Date(b.date), "dd/MM/yyyy")} às {b.time?.slice(0, 5)}
                                        </span>
                                        <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] px-1.5">Concluído</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-zinc-500" />
                                        <p className="font-bold text-white text-sm">{b.customer_name}</p>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-0.5">{b.services?.title}</p>
                                </div>

                                <div className="flex justify-end relative">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                        onClick={() => setDeleteConfirmId(b.id)}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Remover
                                    </Button>

                                    {/* Inline Delete Confirmation */}
                                    {deleteConfirmId === b.id && (
                                        <div className="absolute right-0 top-0 bg-[#2c2c2c] border border-red-500/30 rounded-lg p-2 shadow-xl flex items-center gap-2 z-10 animate-fade-in">
                                            <span className="text-xs text-white font-medium whitespace-nowrap px-2">Você tem certeza?</span>
                                            <Button size="sm" className="h-7 bg-red-500 hover:bg-red-600 text-white text-xs px-3" onClick={() => handleDelete(b.id)}>
                                                Sim
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-7 text-zinc-400 hover:text-white text-xs px-3" onClick={() => setDeleteConfirmId(null)}>
                                                Não
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="flex-shrink-0 pt-4 mt-2 border-t border-white/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function UnlockAgendaModal({ isOpen, onOpenChange, slug, onSuccess, onEdit }: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    slug: string,
    onSuccess: () => void,
    onEdit: (period: any) => void
}) {
    const [lockedPeriods, setLockedPeriods] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            fetchPeriods()
        }
    }, [isOpen, slug])

    const fetchPeriods = async () => {
        setLoading(true)
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            const today = format(new Date(), 'yyyy-MM-dd')
            const { data } = await supabase
                .from('closed_periods')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .gte('end_date', today)
                .order('start_date', { ascending: true })

            if (data) setLockedPeriods(data)
        }
        setLoading(false)
    }

    const handleUnlock = async (id: string) => {
        const { error } = await supabase.from('closed_periods').delete().eq('id', id)
        if (!error) {
            setLockedPeriods(prev => prev.filter(p => p.id !== id))
            onSuccess() // Refresh bookings via callback
        } else {
            console.error("Error unlocking:", error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1c1c1c] border-white/5 text-white max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Unlock className="w-5 h-5 text-[#DBC278]" />
                        Liberar Agenda
                    </DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto pr-2 flex-1 mt-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                        </div>
                    ) : lockedPeriods.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 bg-[#2c2c2c]/30 rounded-xl border border-white/5">
                            Nenhuma restrição na agenda futura.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lockedPeriods.map((period) => (
                                <div key={period.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-bold text-sm text-[#DBC278]">
                                                {format(new Date(`${period.start_date}T12:00:00`), "dd/MM/yyyy")}
                                                {period.start_date !== period.end_date && ` ate ${format(new Date(`${period.end_date}T12:00:00`), "dd/MM/yyyy")}`}
                                            </p>
                                            {(period.start_time || period.end_time) && (
                                                <p className="text-xs font-mono text-zinc-400 mt-1 mb-1">
                                                    {period.start_time?.slice(0, 5) || "00:00"} - {period.end_time?.slice(0, 5) || "23:59"}
                                                </p>
                                            )}
                                            {period.reason && (
                                                <p className="text-xs text-zinc-300 mt-1 italic">"{period.reason}"</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 bg-black/20 text-zinc-300 border-white/10 hover:text-white hover:bg-white/5"
                                                onClick={() => onEdit(period)}
                                            >
                                                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                                Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                                onClick={() => handleUnlock(period.id)}
                                            >
                                                <Unlock className="w-3.5 h-3.5 mr-1.5" />
                                                Liberar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-4 pt-4 border-t border-white/5 flex-shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white w-full">
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
