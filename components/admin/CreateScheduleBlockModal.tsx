import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Barber {
    id: string
    name: string
}

interface CreateScheduleBlockModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    slug: string
    barbers: Barber[]
    onSuccess: () => void
    defaultDate?: string
    defaultTime?: string
    defaultBarberId?: string
}

const DAYS_OF_WEEK = [
    { label: "Domingo", value: 0 },
    { label: "Segunda", value: 1 },
    { label: "Terça", value: 2 },
    { label: "Quarta", value: 3 },
    { label: "Quinta", value: 4 },
    { label: "Sexta", value: 5 },
    { label: "Sábado", value: 6 },
]

export function CreateScheduleBlockModal({
    isOpen,
    onOpenChange,
    slug,
    barbers,
    onSuccess,
    defaultDate,
    defaultTime,
    defaultBarberId
}: CreateScheduleBlockModalProps) {
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [professionalId, setProfessionalId] = useState<string>("all")
    const [recurrence, setRecurrence] = useState("none")
    const [selectedDays, setSelectedDays] = useState<number[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setDate(defaultDate || "")
            setStartTime(defaultTime || "")
            setEndTime("")
            setProfessionalId(defaultBarberId || "all")
            setRecurrence("none")
            setSelectedDays([])
        }
    }, [isOpen, defaultDate, defaultTime, defaultBarberId])

    const formatTimeMask = (value: string) => {
        let numbers = value.replace(/\D/g, "")
        if (numbers.length > 4) numbers = numbers.slice(0, 4)
        if (numbers.length >= 3) {
            return `${numbers.slice(0, 2)}:${numbers.slice(2)}`
        }
        return numbers
    }

    const toggleDay = (dayValue: number) => {
        if (selectedDays.includes(dayValue)) {
            setSelectedDays(prev => prev.filter(d => d !== dayValue))
        } else {
            setSelectedDays(prev => [...prev, dayValue])
        }
    }

    const handleSave = async () => {
        if (!startTime || !endTime) {
            alert("Preencha horário inicial e final.")
            return
        }

        // Validate time
        if (startTime >= endTime) {
            alert("O horário final deve ser maior que o inicial.")
            return
        }

        if (recurrence === "none" && !date) {
            alert("Selecione uma data para o bloqueio pontual.")
            return
        }

        if (recurrence === "weekly" && selectedDays.length === 0) {
            alert("Selecione pelo menos um dia da semana para o bloqueio semanal.")
            return
        }

        setLoading(true)

        try {
            const { data: barbershop } = await supabase.from('barbershops')
                .select('id')
                .eq('slug', slug)
                .single()

            if (!barbershop) throw new Error("Barbearia não encontrada")

            const isGlobal = professionalId === "all"

            // Check existing bookings in the interval (frontend warning)
            // It could be done with a simple alert if we really wanted to check the DB, 
            // but for simplicity let's just create it directly or we can query active bookings.
            let queryContext = supabase.from('bookings')
                .select('id, time, date, barber_id')
                .eq('barbershop_id', barbershop.id)
                .neq('status', 'cancelled')
                .gte('time', startTime)
                .lt('time', endTime)

            if (!isGlobal) {
                queryContext = queryContext.eq('barber_id', professionalId)
            }
            if (recurrence === "none") {
                queryContext = queryContext.eq('date', date)
            }

            const { data: conflictBookings } = await queryContext

            if (conflictBookings && conflictBookings.length > 0) {
                 const proceed = window.confirm(`Existe(m) ${conflictBookings.length} agendamento(s) neste período. Deseja continuar com o bloqueio mesmo assim?`)
                 if (!proceed) {
                     setLoading(false)
                     return
                 }
            }

            const payload = {
                barbershop_id: barbershop.id,
                date: recurrence === "none" ? date : null,
                start_time: startTime,
                end_time: endTime,
                professional_id: isGlobal ? null : professionalId,
                is_global: isGlobal,
                is_recurring: recurrence !== "none",
                recurrence_type: recurrence === "none" ? null : recurrence,
                recurrence_days: recurrence === "weekly" ? selectedDays : null
            }

            const { error } = await supabase.from('schedule_blocks').insert([payload])

            if (error) {
                console.error("Error creating lock:", error)
                alert("Erro ao criar bloqueio: " + error.message)
            } else {
                onSuccess()
                onOpenChange(false)
            }

        } catch (error: any) {
            console.error("Save lock error:", error)
            alert(error?.message || "Erro desconhecido")
        }

        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[var(--danger-color)]" />
                        Bloquear Horário
                    </DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)] text-xs">
                        Impede a criação de novos agendamentos no período selecionado.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    {/* Professional Select */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Profissional</label>
                        <Select value={professionalId} onValueChange={setProfessionalId}>
                            <SelectTrigger className="bg-black/20 border-white/10 text-white rounded-xl focus:ring-[#DBC278]/20 h-11">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="all" className="font-bold text-red-500 hover:bg-white/5 focus:bg-white/5 focus:text-red-400">TODOS (Bloqueio Global)</SelectItem>
                                {barbers.map(b => (
                                    <SelectItem key={b.id} value={b.id} className="hover:bg-white/5 focus:bg-white/5">
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Recurrence Select */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Recorrência</label>
                        <Select value={recurrence} onValueChange={setRecurrence}>
                            <SelectTrigger className="bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)] rounded-xl focus:ring-[var(--accent-primary)]/20 h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]">
                                <SelectItem value="none">Não repetir (Data Específica)</SelectItem>
                                <SelectItem value="daily">Todo dia</SelectItem>
                                <SelectItem value="weekly">Toda semana</SelectItem>
                                <SelectItem value="monthly">Todo mês (dia especificado)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dynamic Date Fields based on recurrence */}
                    {recurrence === "none" && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Data</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)] rounded-xl h-11 focus-visible:ring-[var(--accent-primary)]/20"
                            />
                        </div>
                    )}

                    {recurrence === "weekly" && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Dias da Semana</label>
                            <div className="grid grid-cols-2 gap-2">
                                {DAYS_OF_WEEK.map(day => (
                                    <label key={day.value} className="flex items-center gap-2 text-sm bg-[var(--bg-input)] p-2 rounded-lg border border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-bg)] transition-colors">
                                        <Checkbox 
                                            checked={selectedDays.includes(day.value)}
                                            onCheckedChange={() => toggleDay(day.value)}
                                            className="border-[var(--border-color)] data-[state=checked]:bg-[var(--accent-primary)] data-[state=checked]:text-black"
                                        />
                                        <span className={selectedDays.includes(day.value) ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-muted)]"}>
                                            {day.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Time Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Horário Inicial</label>
                            <Input
                                placeholder="00:00"
                                value={startTime}
                                onChange={e => setStartTime(formatTimeMask(e.target.value))}
                                className="bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)] text-lg font-mono tracking-widest text-center rounded-xl h-11 focus-visible:ring-[var(--accent-primary)]/20"
                                maxLength={5}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Horário Final</label>
                            <Input
                                placeholder="00:00"
                                value={endTime}
                                onChange={e => setEndTime(formatTimeMask(e.target.value))}
                                className="bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)] text-lg font-mono tracking-widest text-center rounded-xl h-11 focus-visible:ring-[var(--accent-primary)]/20"
                                maxLength={5}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-xl">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={loading || !startTime || !endTime} 
                        className="bg-[var(--danger-color)] hover:bg-[var(--danger-color)]/80 text-white font-bold rounded-xl px-6"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Confirmar Bloqueio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
