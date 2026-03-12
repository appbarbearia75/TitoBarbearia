import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, User, Phone, Scissors, Plus } from 'lucide-react'
import { ServiceCard } from '@/components/ServiceCard'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { format, addMinutes, setHours, setMinutes, isBefore, getDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateSelector, InlineCalendar } from '@/components/DateSelector'
import { TimeSlotSelector } from '@/components/TimeSlotSelector'
import { parseDuration } from '@/lib/utils'

export function CreateManualBookingModal({ isOpen, onOpenChange, slug, onSuccess, initialDate, defaultBarberId, defaultTime }: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    slug: string,
    onSuccess: () => void,
    initialDate?: Date,
    defaultBarberId?: string,
    defaultTime?: string
}) {
    const [step, setStep] = useState(1)
    const [services, setServices] = useState<any[]>([])
    const [barbers, setBarbers] = useState<any[]>([])

    // form state
    const [client, setClient] = useState<any>(null)
    const [recurrings, setRecurrings] = useState<any[]>([])
    const [cancelledTimes, setCancelledTimes] = useState<Set<string>>(new Set())
    const [selectedServices, setSelectedServices] = useState<any[]>([])
    const [selectedBarber, setSelectedBarber] = useState<any>(null)
    const [selectedDateObj, setSelectedDateObj] = useState<Date>(new Date())
    const date = format(selectedDateObj, 'yyyy-MM-dd')
    const [time, setTime] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [birthdate, setBirthdate] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchData()
            setStep(1)
            setSelectedServices([])
            setSelectedBarber(null)
            setSelectedDateObj(initialDate || new Date())
            setTime(defaultTime || '')
            setName('')
            setPhone('')
            setBirthdate('')
        }
    }, [isOpen, slug, initialDate, defaultTime])

    useEffect(() => {
        if (isOpen && defaultBarberId && barbers.length > 0) {
            const barber = barbers.find(b => b.id === defaultBarberId);
            if (barber) {
                setSelectedBarber(barber);
            }
        }
    }, [isOpen, defaultBarberId, barbers])

    const fetchData = async () => {
        const { data: b } = await supabase.from('barbershops').select('*').eq('slug', slug).single()
        if (b) {
            setClient(b)
            const { data: s, error: sErr } = await supabase.from('services').select('*').eq('barbershop_id', b.id).order('position', { ascending: true })
            if (sErr) console.error("Error fetching services:", sErr)
            if (s) setServices(s)
            const { data: bar, error: barErr } = await supabase.from('barbers').select('*').eq('barbershop_id', b.id).eq('active', true)
            if (barErr) console.error("Error fetching barbers:", barErr)
            if (bar) setBarbers(bar)
            const { data: recurringData } = await supabase.from('recurring_bookings').select('day_of_week, start_time').eq('barbershop_id', b.id)
            if (recurringData) setRecurrings(recurringData)
        }
    }

    useEffect(() => {
        if (!client) return
        const fetchCancelled = async () => {
            const { data } = await supabase.from('bookings').select('time').eq('barbershop_id', client.id).eq('date', date).eq('status', 'cancelled')
            if (data) setCancelledTimes(new Set(data.map(c => c.time?.slice(0, 5))))
            else setCancelledTimes(new Set())
        }
        fetchCancelled()
    }, [date, client])

    const timeSlots = useMemo(() => {
        if (!client?.opening_hours) return []
        const dayKey = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][getDay(selectedDateObj)]
        const config = client.opening_hours[dayKey]
        if (!config || !config.open) return []

        const blockedTimes = new Set(
            recurrings
                .filter(r => r.day_of_week === getDay(selectedDateObj))
                .map(r => r.start_time)
        )

        const slots: string[] = []
        const [startHour, startMinute] = (config.start || "09:00").split(':').map(Number)
        const [endHour, endMinute] = (config.end || "18:00").split(':').map(Number)
        let currentTime = setMinutes(setHours(selectedDateObj, startHour), startMinute)
        const endTime = setMinutes(setHours(selectedDateObj, endHour), endMinute)
        const now = new Date()

        let lunchStartTime: Date | null = null
        let lunchEndTime: Date | null = null

        if (config.lunchStart && config.lunchEnd) {
            const [lsHour, lsMinute] = config.lunchStart.split(':').map(Number)
            const [leHour, leMinute] = config.lunchEnd.split(':').map(Number)
            lunchStartTime = setMinutes(setHours(selectedDateObj, lsHour), lsMinute)
            lunchEndTime = setMinutes(setHours(selectedDateObj, leHour), leMinute)
        }

        while (isBefore(currentTime, endTime)) {
            if (isSameDay(selectedDateObj, now) && isBefore(currentTime, now)) {
                currentTime = addMinutes(currentTime, 15)
                continue
            }

            if (lunchStartTime && lunchEndTime) {
                if ((isBefore(currentTime, lunchEndTime) && (currentTime >= lunchStartTime))) {
                    currentTime = addMinutes(currentTime, 15)
                    continue
                }
            }

            const timeStr = format(currentTime, 'HH:mm')
            if (blockedTimes.has(timeStr) && !cancelledTimes.has(timeStr)) {
                currentTime = addMinutes(currentTime, 15)
                continue
            }

            slots.push(timeStr)
            currentTime = addMinutes(currentTime, 15)
        }
        return slots
    }, [selectedDateObj, client, recurrings, cancelledTimes])

    const handleSave = async () => {
        if (!name || !time || !date || selectedServices.length === 0 || !selectedBarber) {
            alert('Preencha os campos obrigatórios (Serviço, Barbeiro, Data, Horário e Nome).')
            return
        }
        setLoading(true)
        try {
            const { data: b } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (b) {
                // First attempt to save the client so that it appears in client lists
                if (phone) {
                    const { data: existingClient } = await supabase.from('clients').select('id').eq('barbershop_id', b.id).eq('phone', phone).single()
                    if (!existingClient) {
                        await supabase.from('clients').insert([{
                            barbershop_id: b.id,
                            name: name,
                            phone: phone,
                            birthdate: birthdate || null,
                            last_visit: date,
                            total_visits: 1
                        }])
                    }
                }

                // CREATE MULTIPLE BOOKING SLOTS BASED ON DURATION
                const [h, m] = time.split(':').map(Number);
                let currentSlotTime = new Date();
                currentSlotTime.setHours(h, m, 0, 0);

                const bookingsToInsert = selectedServices.map((service) => {
                    const bookingTimeStr = format(currentSlotTime, 'HH:mm');
                    const durationMinutes = parseDuration(service.duration);
                    currentSlotTime = addMinutes(currentSlotTime, durationMinutes);

                    return {
                        barbershop_id: b.id,
                        service_id: service.id,
                        barber_id: selectedBarber.id,
                        date,
                        time: bookingTimeStr,
                        customer_name: name,
                        customer_phone: phone || '(00) 00000-0000',
                        status: 'confirmed'
                    };
                });

                // CHECK FOR CONFLICT FIRST
                const timesToCheck = bookingsToInsert.map(b => b.time);
                const { data: existingBookings, error: checkError } = await supabase
                    .from('bookings')
                    .select('id')
                    .eq('barbershop_id', b.id)
                    .eq('date', date)
                    .neq('status', 'cancelled')
                    .in('time', timesToCheck)
                    .eq('barber_id', selectedBarber.id)

                if (checkError) throw checkError

                if (existingBookings && existingBookings.length > 0) {
                    alert("Um ou mais horários selecionados já estão reservados por outro cliente.")
                    setLoading(false)
                    return
                }

                // Insert booking
                const { error } = await supabase.from('bookings').insert(bookingsToInsert)

                if (error) {
                    console.error("Booking err", error)
                    alert('Erro ao agendar horário, verifique se a data já não passou.')
                } else {
                    const displayDate = date.split('-').reverse().join('/')
                    const serviceTitles = selectedServices.map(s => s.title).join(' + ')
                    const msgCliente = `*Agendamento Confirmado!* 🎉\n\nOlá ${name},\nSeu horário foi marcado pelo profissional para *${displayDate} às ${time}*.\nServiço: ${serviceTitles}\nBarbeiro: ${selectedBarber.name}\n\nObrigado por nos escolher!`

                    // if (phone && phone !== '(00) 00000-0000') {
                    //     fetch('/api/whatsapp', {
                    //         method: 'POST',
                    //         headers: { 'Content-Type': 'application/json' },
                    //         body: JSON.stringify({ phone: phone, message: msgCliente })
                    //     }).catch(console.error)
                    // }

                    onSuccess()
                    onOpenChange(false)
                }
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao agendar.')
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-2xl sm:max-w-[425px]">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-center">
                        <Plus className="w-5 h-5 text-[var(--accent-primary)]" />
                        Novo Agendamento
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 space-y-4">
                    {/* Progress Bar Simplificada */}
                    <div className="flex gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-muted)]/20'}`} />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-3 animate-fade-in">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] flex items-center gap-2">
                                <Scissors className="w-4 h-4 text-[var(--accent-primary)]" />
                                1. Selecione o Serviço
                            </h3>
                            <div className="grid gap-2 max-h-[40vh] overflow-y-auto pr-2">
                                {services.map(s => (
                                    <ServiceCard
                                        key={s.id}
                                        id={s.id}
                                        title={s.title}
                                        price={Number(s.price)}
                                        icon={s.icon}
                                        selected={selectedServices.some(sel => sel.id === s.id)}
                                        onSelect={(id) => {
                                            const service = services.find(x => x.id === id);
                                            if (service) {
                                                setSelectedServices(prev => {
                                                    const isSelected = prev.some(sel => sel.id === service.id);
                                                    if (isSelected) return prev.filter(sel => sel.id !== service.id);
                                                    return [...prev, service];
                                                });
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                            <Button
                                className="w-full bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/80 font-bold h-12 mt-4"
                                onClick={() => {
                                    if (defaultBarberId && defaultTime) {
                                        setStep(5)
                                    } else {
                                        setStep(2)
                                    }
                                }}
                                disabled={selectedServices.length === 0}
                            >
                                Avançar
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3 animate-fade-in">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] flex items-center gap-2">
                                <User className="w-4 h-4 text-[var(--accent-primary)]" />
                                2. Selecione o Barbeiro
                            </h3>
                            <div className="grid gap-2">
                                {barbers.map(b => (
                                    <div
                                        key={b.id}
                                        className={`p-3 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${selectedBarber?.id === b.id ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-sm' : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[var(--border-color)]/80'}`}
                                        onClick={() => { setSelectedBarber(b); setStep(3); }}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center font-bold text-xl text-[var(--accent-primary)] overflow-hidden">
                                            {b.photo_url ? (
                                                <img src={b.photo_url} alt={b.name} className="w-full h-full object-cover" />
                                            ) : (
                                                b.name.charAt(0)
                                            )}
                                        </div>
                                        <div className="font-bold text-lg text-[var(--text-primary)]">{b.name}</div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] mt-4" onClick={() => setStep(1)}>Voltar para Serviços</Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-fade-in flex flex-col max-h-[60vh]">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] flex items-center gap-2 flex-shrink-0">
                                <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
                                3. Selecione a Data
                            </h3>
                            <div className="overflow-y-auto pr-2 space-y-6 flex-1 py-1 overflow-x-hidden">
                                <InlineCalendar
                                    selectedDate={selectedDateObj}
                                    onSelect={setSelectedDateObj}
                                    openingHours={client?.opening_hours}
                                />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-[var(--border-color)] flex-shrink-0">
                                <Button variant="outline" className="flex-1 bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] h-12" onClick={() => setStep(2)}>Voltar</Button>
                                <Button className="flex-1 bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/80 font-bold h-12" onClick={() => setStep(4)} disabled={!date}>
                                    Avançar
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4 animate-fade-in flex flex-col max-h-[60vh]">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] flex items-center gap-2 flex-shrink-0">
                                <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
                                4. Selecione o Horário
                            </h3>
                            <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                                {timeSlots.length > 0 ? (
                                    <TimeSlotSelector
                                        slots={timeSlots}
                                        selectedSlot={time}
                                        onSelect={setTime}
                                        barbershopId={client?.id}
                                        barberId={selectedBarber?.id}
                                        date={date}
                                        totalDuration={selectedServices.reduce((acc, s) => acc + parseDuration(s.duration), 0)}
                                    />
                                ) : (
                                    <div className="text-center py-6 text-[var(--text-secondary)] text-sm border rounded-xl border-[var(--border-color)] bg-[var(--bg-input)]">
                                        Nenhum horário disponível para esta data.
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-[var(--border-color)] flex-shrink-0">
                                <Button variant="outline" className="flex-1 bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] h-12" onClick={() => { setStep(3); setTime(''); }}>Voltar</Button>
                                <Button className="flex-1 bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/80 font-bold h-12" onClick={() => setStep(5)} disabled={!time}>
                                    Avançar
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] flex items-center gap-2">
                                <User className="w-4 h-4 text-[var(--accent-primary)]" />
                                5. Dados do Cliente
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-[var(--text-secondary)] font-bold ml-1">Nome do Cliente *</label>
                                    <Input
                                        placeholder="Ex: João Silva"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="h-12 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-[var(--text-secondary)] font-bold ml-1">WhatsApp (Opcional)</label>
                                    <Input
                                        placeholder="(11) 90000-0000"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="h-12 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-[var(--text-secondary)] font-bold ml-1">Data de Nascimento (Opcional)</label>
                                    <Input
                                        type="date"
                                        value={birthdate}
                                        onChange={e => setBirthdate(e.target.value)}
                                        className="h-12 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                                    />
                                </div>
                            </div>

                            <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 p-3 rounded-xl mt-4">
                                <p className="text-xs text-[var(--accent-primary)] text-center font-medium">Você está agendando {selectedServices.map(s => s.title).join(' + ')} com {selectedBarber?.name} para {format(new Date(date + "T00:00:00"), "dd/MM/yyyy")} às {time}.</p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
                                <Button variant="outline" className="flex-1 bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] h-12" onClick={() => setStep(4)}>Voltar</Button>
                                <Button
                                    className="flex-1 bg-[var(--success-color)] hover:bg-[var(--success-color)]/80 text-white font-bold h-12 shadow-sm"
                                    onClick={handleSave}
                                    disabled={!name || loading}
                                >
                                    {loading ? 'Agendando...' : 'Confirmar'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
} 