"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Check, X, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AgendaPage() {
    const params = useParams()
    const slug = params.slug as string
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date())

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
                .select(`
                    *,
                    services (title)
                `)
                .eq('barbershop_id', barbershop.id)
                .eq('date', formattedDate)
                .neq('status', 'cancelled') // Filter out cancelled bookings
                .order('time', { ascending: true })

            if (data) setBookings(data)
        }
        setLoading(false)
    }

    const updateStatus = async (id: string, newStatus: string) => {
        // Optimistic update
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
            fetchBookings() // Revert
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Agenda</h1>
                    <p className="text-zinc-400">Gerencie os agendamentos do dia.</p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                    <CalendarIcon className="w-5 h-5 text-zinc-400" />
                    <span className="text-white font-medium capitalize">
                        {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </span>
                    {/* Date picker would go here, simplistic for now */}
                    <div className="flex gap-1 ml-4">
                        <Button size="sm" variant="ghost" onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))}>&lt;</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDate(new Date())}>Hoje</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}>&gt;</Button>
                    </div>
                </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader>
                    <CardTitle>Horários Agendados</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400 text-center w-[100px]">Horário</TableHead>
                                <TableHead className="text-zinc-400">Cliente</TableHead>
                                <TableHead className="text-zinc-400 text-center">Serviço</TableHead>
                                <TableHead className="text-zinc-400 text-center">Status</TableHead>
                                <TableHead className="text-right text-zinc-400">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                                </TableRow>
                            ) : bookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Clock className="w-8 h-8 opacity-20" />
                                            <p>Nenhum agendamento para este dia.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bookings.map((booking) => (
                                    <TableRow key={booking.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                        <TableCell className="font-mono text-lg font-bold text-[#DBC278] text-center">
                                            {booking.time}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-white">{booking.customer_name}</div>
                                            <div className="text-xs text-zinc-500">{booking.customer_phone}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                                                {booking.services?.title || "Serviço Removido"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={booking.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {booking.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#DBC278]/20 text-[#DBC278] hover:bg-[#DBC278]/30"
                                                        onClick={() => updateStatus(booking.id, 'confirmed')}
                                                        title="Confirmar"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#DBC278]/20 text-[#DBC278] hover:bg-[#DBC278]/30"
                                                        onClick={() => updateStatus(booking.id, 'completed')}
                                                        title="Concluir Atendimento"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    className="bg-red-600/20 text-red-500 hover:bg-red-600/30"
                                                    onClick={() => updateStatus(booking.id, 'cancelled')}
                                                    title="Cancelar Agendamento"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'confirmed':
            return <Badge className="bg-[#DBC278]/20 text-[#DBC278] border-[#DBC278]/30">Confirmado</Badge>
        case 'cancelled':
            return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">Cancelado</Badge>
        case 'completed':
            return <Badge variant="outline" className="text-zinc-400 border-zinc-800">Concluído</Badge>
        default:
            return <Badge className="bg-[#DBC278]/10 text-[#DBC278] hover:bg-[#DBC278]/20 border-[#DBC278]/20">Pendente</Badge>
    }
}
