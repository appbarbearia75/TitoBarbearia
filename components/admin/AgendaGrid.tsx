"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Calendar as CalendarIcon, Check, X, Clock, User, Phone, Scissors, Lock, Unlock, MessageSquare, Plus, Loader2, Pencil, ChevronLeft, ChevronRight, ShoppingCart, CheckCircle, ListTodo, CreditCard, Banknote, QrCode, ArrowLeft, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { format, addMinutes, startOfDay, endOfDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FullCalendarModal } from "@/components/DateSelector"
import { CreateManualBookingModal } from "@/components/admin/CreateManualBookingModal"
import { EditBookingModal } from "@/components/admin/EditManualBookingModal"

// Define a interface para os agendamentos no grid
interface GridBooking {
    id: string;
    barber_id: string;
    date: string;
    time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    service_title: string;
    status: string;
    duration: number;
    price: string;
    barber_data: any;
    is_vip?: boolean;
}

export function AgendaGrid() {
    const params = useParams()
    const slug = params.slug as string
    const [barbers, setBarbers] = useState<any[]>([])
    const [bookings, setBookings] = useState<GridBooking[]>([])
    const [view, setView] = useState<'daily' | 'weekly'>('daily')
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date())
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ barber_id: string, time: string } | null>(null)
    const [actionBooking, setActionBooking] = useState<GridBooking | null>(null)
    const [isFaturando, setIsFaturando] = useState(false)
    const router = useRouter()

    // Configurações do Grid
    const startHour = 8;
    const endHour = 21;
    const timeStep = 15; // minutos

    const timeSlots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let min = 0; min < 60; min += timeStep) {
            const h = hour.toString().padStart(2, '0');
            const m = min.toString().padStart(2, '0');
            timeSlots.push(`${h}:${m}`);
        }
    }

    const [barbershopSettings, setBarbershopSettings] = useState<any>(null)

    // Helper para dias da semana na visão semanal
    const getWeekDays = () => {
        const start = new Date(date)
        const day = start.getDay() || 7 // 1 (Mon) to 7 (Sun)
        start.setDate(start.getDate() - day + 1) // Move to Monday

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start)
            d.setDate(d.getDate() + i)
            return d
        })
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(() => fetchData(false), 60000)
        return () => clearInterval(interval)
    }, [slug, date, view, selectedBarberId])

    // Efeito para selecionar o primeiro barbeiro quando mudar para semanal
    useEffect(() => {
        if (view === 'weekly' && !selectedBarberId && barbers.length > 0) {
            setSelectedBarberId(barbers[0].id)
        }
    }, [view, barbers])

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true)

        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id, name, opening_hours').eq('slug', slug).single()
            if (!barbershop) return
            setBarbershopSettings(barbershop)

            // --- PARALLEL DATA FETCHING ---
            let bookingsQuery = supabase
                .from('bookings')
                .select(`
                    id,
                    barber_id,
                    time,
                    date,
                    customer_name,
                    customer_phone,
                    status,
                    services (title, duration, price)
                `)
                .eq('barbershop_id', barbershop.id)
                .neq('status', 'cancelled');

            if (view === 'daily') {
                bookingsQuery.eq('date', format(date, 'yyyy-MM-dd'));
            } else {
                const weekDays = getWeekDays();
                bookingsQuery.gte('date', format(weekDays[0], 'yyyy-MM-dd'));
                bookingsQuery.lte('date', format(weekDays[6], 'yyyy-MM-dd'));
                if (selectedBarberId) {
                    bookingsQuery.eq('barber_id', selectedBarberId);
                }
            }

            const [barbersRes, bookingsRes] = await Promise.all([
                supabase.from('barbers').select('*').eq('barbershop_id', barbershop.id).eq('active', true).order('name', { ascending: true }),
                bookingsQuery
            ]);

            const barbersData = barbersRes.data || [];
            const bookingsData = bookingsRes.data || [];

            setBarbers(barbersData);

            // Fetch VIPs concurrently if there are phones
            const uniquePhones = Array.from(new Set(bookingsData.map(b => b.customer_phone).filter(Boolean)));
            const vipStatusMap = {};

            if (uniquePhones.length > 0) {
                const { data: vipClients } = await supabase
                    .from('clients')
                    .select('phone')
                    .eq('barbershop_id', barbershop.id)
                    .in('phone', uniquePhones)
                    .eq('is_vip', true);

                if (vipClients) {
                    vipClients.forEach(c => {
                        if (c.phone) vipStatusMap[c.phone] = true;
                    });
                }
            }

            const mappedBookings: GridBooking[] = (bookingsData || []).map(b => {
                const duration = parseInt((b.services as any)?.duration?.replace(/\D/g, '') || '15') || 15;
                const startTime = b.time.slice(0, 5);

                // Calcula hand_time
                const [h, m] = startTime.split(':').map(Number);
                const endDate = new Date();
                endDate.setHours(h, m + duration, 0, 0);
                const endTime = format(endDate, 'HH:mm');

                const barberData = barbersData?.find((barber: any) => barber.id === b.barber_id);

                return {
                    id: b.id,
                    barber_id: b.barber_id,
                    date: b.date,
                    time: startTime,
                    end_time: endTime,
                    customer_name: b.customer_name,
                    customer_phone: b.customer_phone,
                    service_title: (b.services as any)?.title || "Serviço",
                    price: (b.services as any)?.price || "0.00",
                    status: b.status,
                    duration,
                    barber_data: barberData,
                    is_vip: !!vipStatusMap[b.customer_phone]
                };
            });

            setBookings(mappedBookings)
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const navigateDate = (days: number) => {
        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() + days)
        setDate(newDate)
    }

    const updateStatus = async (id: string, newStatus: string, paymentMethod?: string) => {
        try {
            let commission_earned = 0
            if (newStatus === 'completed') {
                const b = bookings.find(b => b.id === id)
                if (b && b.barber_data) {
                    const cType = b.barber_data.commission_type || 'percentage'
                    const cValue = parseFloat(b.barber_data.commission_value) || 0
                    const bPrice = parseFloat(b.price || '0')
                    if (cType === 'percentage') {
                        commission_earned = bPrice * (cValue / 100)
                    } else if (cType === 'fixed') {
                        commission_earned = cValue
                    }

                    if (paymentMethod && barbershopSettings) {
                        try {
                            const { data: command, error: cmdErr } = await supabase.from('commands').insert([{
                                barbershop_id: barbershopSettings.id,
                                client_name: b.customer_name,
                                status: 'closed',
                                payment_method: paymentMethod,
                                total_amount: bPrice,
                                subtotal_amount: bPrice,
                                closed_at: new Date().toISOString()
                            }]).select().single()

                            if (cmdErr) throw cmdErr

                            if (command) {
                                await supabase.from('command_items').insert([{
                                    command_id: command.id,
                                    item_type: 'service',
                                    item_name: b.service_title,
                                    unit_price: bPrice,
                                    total_price: bPrice,
                                    quantity: 1,
                                    barber_id: b.barber_id
                                }])

                                await supabase.from('bookings').update({
                                    command_id: command.id,
                                    status: 'completed',
                                    commission_earned
                                }).eq('id', id)

                                fetchData(false)
                                setActionBooking(null)
                                setIsFaturando(false)
                                return
                            }
                        } catch (err) {
                            console.error("PDV auto execution error:", err);
                        }
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
                alert("Erro ao atualizar agendamento.")
            } else {
                fetchData(false)
                setActionBooking(null)
                setIsFaturando(false)
            }
        } catch (error) {
            console.error("Error in updateStatus", error)
        }
    }

    // Helper para agendamentos (considerando data se for semanal)
    const getBookingInSlot = (barber_id: string, time: string, dayDate?: Date) => {
        if (view === 'daily') {
            return bookings.find(b => b.barber_id === barber_id && b.time.startsWith(time));
        } else {
            const dateStr = format(dayDate || date, 'yyyy-MM-dd')
            return bookings.find(b => b.barber_id === barber_id && b.time.startsWith(time) && b.date === dateStr);
        }
    }

    const isBarberOffline = (barber: any, time: string, dayDate: Date = date) => {
        const [h, m] = time.split(':').map(Number)
        const timeVal = h * 60 + m

        const parseTime = (t: string | null) => {
            if (!t) return null
            const [h, m] = t.split(':').map(Number)
            return h * 60 + m
        }

        let shopStartVal = 480; // default 08:00
        let shopEndVal = 1200; // default 20:00

        // 1. Verificação Global da Barbearia (Opening Hours)
        if (barbershopSettings?.opening_hours) {
            const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
            const dayKey = dayMap[dayDate.getDay()];
            const shopDayConfig = barbershopSettings.opening_hours[dayKey]

            if (shopDayConfig) {
                // Se está fechado no dia
                if (shopDayConfig.open === false) return true

                // Se está no intervalo de almoço da BARBEARIA
                const shopLunchStart = parseTime(shopDayConfig.lunchStart)
                const shopLunchEnd = parseTime(shopDayConfig.lunchEnd)
                if (shopLunchStart !== null && shopLunchEnd !== null) {
                    if (timeVal >= shopLunchStart && timeVal < shopLunchEnd) return true
                }

                // Se está fora do horário de funcionamento da BARBEARIA
                const shopStart = parseTime(shopDayConfig.start)
                const shopEnd = parseTime(shopDayConfig.end)
                if (shopStart !== null) shopStartVal = shopStart;
                if (shopEnd !== null) shopEndVal = shopEnd;

                if (shopStart !== null && timeVal < shopStart) return true
                if (shopEnd !== null && timeVal >= shopEnd) return true
            }
        }

        // 2. Verificação Individual do Barbeiro
        const { work_start, work_end, lunch_start, lunch_end } = barber
        const start = parseTime(work_start) ?? shopStartVal;
        const end = parseTime(work_end) ?? shopEndVal;
        const lStart = parseTime(lunch_start)
        const lEnd = parseTime(lunch_end)

        // Fora do horário de trabalho do barbeiro
        if (timeVal < start || timeVal >= end) return true

        // Horário de almoço do barbeiro
        if (lStart !== null && lEnd !== null) {
            if (timeVal >= lStart && timeVal < lEnd) return true
        }

        return false
    }

    // Helper para verificar se o slot está ocupado por um agendamento longo
    const isSlotOccupiedByPrevious = (barber_id: string, time: string, dayDate?: Date) => {
        const [targetH, targetM] = time.split(':').map(Number);
        const targetTotalMinutes = targetH * 60 + targetM;
        const dateStr = format(dayDate || date, 'yyyy-MM-dd')

        return bookings.some(b => {
            if (b.barber_id !== barber_id) return false;
            if (view === 'weekly' && b.date !== dateStr) return false;

            const [startH, startM] = b.time.split(':').map(Number);
            const startTotalMinutes = startH * 60 + startM;
            const endTotalMinutes = startTotalMinutes + b.duration;

            return targetTotalMinutes > startTotalMinutes && targetTotalMinutes < endTotalMinutes;
        });
    }

    const handleSlotClick = (barber_id: string, time: string, dayDate: Date = date) => {
        const barber = barbers.find(b => b.id === barber_id)
        if (isBarberOffline(barber, time, dayDate)) return

        setSelectedSlot({ barber_id, time })
        setIsManualBookingModalOpen(true)
    }

    const handleToggleLock = async (barber_id: string, time: string, dayDate: Date = date, existingBooking?: any) => {
        try {
            const dateStr = format(dayDate, 'yyyy-MM-dd');

            if (existingBooking && existingBooking.status === 'locked') {
                // Optimistic UI clear: remove all locks for this slot to prevent ghosts
                setBookings(prev => prev.filter(b => !(b.barber_id === barber_id && b.time === time && b.date === dateStr && b.status === 'locked')));

                const isTempId = String(existingBooking?.id || '').startsWith('temp-');

                // Try to delete by ID if it's a real database ID
                let query = supabase.from('bookings').delete();

                if (existingBooking?.id && !isTempId) {
                    query = query.eq('id', existingBooking.id);
                } else {
                    // Fallback to properties if rapid clicking occurred and we only have local state
                    // Use like() for time because DB might store '08:00:00' but local is '08:00'
                    query = query
                        .eq('barber_id', barber_id)
                        .like('time', `${time}%`)
                        .eq('date', dateStr)
                        .eq('status', 'locked')
                        .eq('barbershop_id', barbershopSettings.id);
                }

                const { error } = await query;

                if (error) {
                    console.error("Unlock error:", error);
                    alert("Erro ao liberar horário: " + error.message);
                }
                fetchData(false);
            } else if (!existingBooking) {
                // Prevent duplicate local requests
                if (bookings.some(b => b.barber_id === barber_id && b.time === time && b.date === dateStr)) return;

                const tempId = 'temp-' + Date.now();

                // Optimistic UI lock
                setBookings(prev => [...prev, {
                    id: tempId,
                    barber_id: barber_id,
                    date: dateStr,
                    time: time,
                    end_time: time,
                    customer_name: 'Horário Bloqueado',
                    customer_phone: '',
                    service_title: 'Bloqueio',
                    status: 'locked',
                    duration: 15,
                    price: '0.00',
                    barber_data: null
                }]);

                const { error } = await supabase.from('bookings').insert([{
                    barbershop_id: barbershopSettings.id,
                    barber_id: barber_id,
                    date: dateStr,
                    time: time,
                    customer_name: 'Horário Bloqueado',
                    customer_phone: '(00) 00000-0000',
                    status: 'locked'
                }]);

                if (error) {
                    console.error("Lock error:", error);
                    setBookings(prev => prev.filter(b => b.id !== tempId));
                    alert("Erro ao travar horário: " + error.message);
                }
                fetchData(false);
            }
        } catch (error) {
            console.error(error);
        }
    }

    if (loading && barbers.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#DBC278]" />
            </div>
        )
    }

    const currentBarberForWeakly = barbers.find(b => b.id === selectedBarberId) || barbers[0];

    const getActiveWeekDays = () => {
        const days = getWeekDays();
        if (view === 'daily') return days;

        return days.filter(day => {
            const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
            const dayKey = dayMap[day.getDay()];
            const barber = currentBarberForWeakly;

            // 1. Check barber's individual working days if available
            if (barber?.working_hours && barber.working_hours[dayKey]) {
                return barber.working_hours[dayKey].open !== false;
            }

            // 2. Fallback to barbershop's opening hours
            const shopConfig = barbershopSettings?.opening_hours?.[dayKey];
            if (shopConfig) {
                return shopConfig.open !== false;
            }

            return true;
        });
    }

    const activeWeekDays = getActiveWeekDays();

    const colsCount = view === 'daily' ? barbers.length : activeWeekDays.length;
    const gridColsStyle = {
        display: 'grid',
        gridTemplateColumns: `80px repeat(${colsCount}, minmax(180px, 1fr))`
    };

    return (
        <div className="flex flex-col h-full bg-[#1c1c1c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Toolbar Top */}
            <div className="flex flex-col lg:flex-row items-center justify-between p-3 sm:p-4 border-b border-white/5 bg-black/20 gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-[#09090b] p-1 rounded-lg border border-white/5 text-[10px] font-bold uppercase tracking-wider">
                        <button
                            onClick={() => setView('daily')}
                            className={`px-3 py-1.5 rounded-md transition-all ${view === 'daily' ? 'bg-[#DBC278] text-black shadow-lg shadow-[#DBC278]/10' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Diário
                        </button>
                        <button
                            onClick={() => setView('weekly')}
                            className={`px-3 py-1.5 rounded-md transition-all ${view === 'weekly' ? 'bg-[#DBC278] text-black shadow-lg shadow-[#DBC278]/10' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Semanal
                        </button>
                    </div>

                    {view === 'weekly' && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-2">Barbeiro:</span>
                            <Select value={selectedBarberId || ""} onValueChange={setSelectedBarberId}>
                                <SelectTrigger className="w-[180px] h-8 bg-black/20 border-white/5 text-xs font-bold text-white focus:ring-[#DBC278]/20">
                                    <SelectValue placeholder="Selecione um barbeiro" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    {barbers.map(b => (
                                        <SelectItem key={b.id} value={b.id} className="text-xs focus:bg-[#DBC278] focus:text-black">
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between w-full lg:w-auto gap-2 sm:gap-4">
                    <div className="flex items-center gap-1 sm:gap-2 bg-black/40 rounded-xl p-1 border border-white/5">
                        <Button size="icon" variant="ghost" className="w-7 h-7 sm:w-8 h-8 text-zinc-400 hover:text-white" onClick={() => navigateDate(view === 'daily' ? -1 : -7)}>
                            <ChevronLeft className="w-4 h-4 sm:w-5 h-5" />
                        </Button>
                        <button
                            onClick={() => setIsCalendarOpen(true)}
                            className="text-[11px] sm:text-sm font-black text-white hover:text-[#DBC278] transition-colors flex items-center gap-1.5 sm:gap-2 px-1"
                        >
                            <CalendarIcon className="w-3.5 h-3.5 text-[#DBC278]" />
                            <span className="capitalize whitespace-nowrap">{format(date, view === 'daily' ? "EEE, dd MMM" : "'Sem.' dd MMM", { locale: ptBR })}</span>
                        </button>
                        <Button size="icon" variant="ghost" className="w-7 h-7 sm:w-8 h-8 text-zinc-400 hover:text-white" onClick={() => navigateDate(view === 'daily' ? 1 : 7)}>
                            <ChevronRight className="w-4 h-4 sm:w-5 h-5" />
                        </Button>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className={`h-9 px-3 sm:px-4 text-[10px] sm:text-xs font-black border-white/10 rounded-xl ${isSameDay(date, new Date()) ? 'text-black bg-[#DBC278] border-[#DBC278]/20 hover:bg-[#c9b06b]' : 'text-zinc-400 hover:text-white bg-black/20'}`}
                        onClick={() => setDate(new Date())}
                    >
                        HOJE
                    </Button>
                </div>

                <Button
                    size="sm"
                    className="w-full lg:w-auto h-11 lg:h-9 bg-green-500 hover:bg-green-600 text-white font-black text-xs px-6 rounded-xl shadow-xl shadow-green-500/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                    onClick={() => setIsManualBookingModalOpen(true)}
                >
                    <Plus className="w-5 h-5 lg:w-4 h-4" />
                    NOVO AGENDAMENTO
                </Button>
            </div>

            <div className="flex-1 overflow-auto relative custom-scrollbar bg-black/10">
                <div className="min-w-fit sm:min-w-[800px]">
                    {/* Header Columns */}
                    <div className="sticky top-0 z-20 bg-black/60 backdrop-blur-md border-b border-white/5" style={gridColsStyle}>
                        <div className="border-r border-white/5" />

                        {view === 'daily' ? (
                            barbers.map(barber => (
                                <div key={barber.id} className="border-r border-white/5 py-4 flex flex-col items-center justify-center gap-2 group-hover:bg-white/5 transition-all">
                                    <Avatar className="w-10 h-10 border-2 border-[#DBC278]/30 shadow-lg shadow-[#DBC278]/5 transition-transform group-hover:scale-110">
                                        <AvatarImage src={barber.photo_url} />
                                        <AvatarFallback className="bg-[#DBC278]/10 text-[#DBC278] text-xs font-black">{barber.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-white leading-none uppercase tracking-tighter">{barber.name}</p>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1.5 opacity-60">Professional</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            activeWeekDays.map(day => (
                                <div key={day.toISOString()} className={`border-r border-white/5 py-3 px-2 text-center flex flex-col items-center justify-center gap-1.5 ${isSameDay(day, new Date()) ? 'bg-[#DBC278]/10' : ''}`}>
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] leading-none">{format(day, 'EEE', { locale: ptBR })}</span>
                                    <span className={`text-xl font-black leading-none tracking-tighter ${isSameDay(day, new Date()) ? 'text-[#DBC278]' : 'text-white'}`}>{format(day, 'dd')}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Body Slots */}
                    <div className="relative">
                        {timeSlots.filter(time => {
                            if (view === 'daily') {
                                return barbers.some(barber => !isBarberOffline(barber, time, date));
                            } else {
                                const barber = barbers.find(b => b.id === selectedBarberId);
                                if (!barber) return true;
                                return activeWeekDays.some(day => !isBarberOffline(barber, time, day));
                            }
                        }).map((time, index, filteredArr) => {
                            const currentHour = parseInt(time.split(':')[0]);
                            const prevTime = index > 0 ? filteredArr[index - 1] : null;
                            const prevHour = prevTime ? parseInt(prevTime.split(':')[0]) : null;

                            const showSeparator = prevHour !== null && prevHour < 12 && currentHour >= 12;

                            return (
                                <div key={time}>
                                    {showSeparator && (
                                        <div className="col-span-full flex items-center gap-3 py-4 px-4 bg-black/40 border-y border-white/5 shadow-inner">
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/5 backdrop-blur-md">
                                                <span className="text-[10px] sm:text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                                    Manhã
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[10px] sm:text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    Tarde
                                                </span>
                                            </div>
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        </div>
                                    )}
                                    <div className="border-b border-white/5 group/row" style={gridColsStyle}>
                                        {/* Time Column */}
                                        <div className="border-r border-white/5 py-6 flex flex-col items-center justify-center bg-black/20 group-hover/row:bg-black/40 transition-colors">
                                            <span className="text-xs font-bold text-zinc-400 group-hover/row:text-[#DBC278] transition-colors">{time}</span>
                                        </div>

                                        {/* Barber Slots (Daily) or Days Slots (Weekly) */}
                                        {view === 'daily' ? (
                                            barbers.map(barber => {
                                                const booking = getBookingInSlot(barber.id, time);
                                                const isOccupied = isSlotOccupiedByPrevious(barber.id, time);
                                                const isOffline = isBarberOffline(barber, time);

                                                if (isOccupied) return (
                                                    <div key={barber.id} className="border-r border-white/5 relative bg-black/5" />
                                                );

                                                return (
                                                    <SlotCell
                                                        key={barber.id}
                                                        barber={barber}
                                                        time={time}
                                                        booking={booking}
                                                        isOffline={isOffline}
                                                        onClick={() => handleSlotClick(barber.id, time)}
                                                        onToggleLock={() => handleToggleLock(barber.id, time, date, booking)}
                                                        onBookingClick={setActionBooking}
                                                    />
                                                );
                                            })
                                        ) : (
                                            activeWeekDays.map(day => {
                                                const barber = currentBarberForWeakly;
                                                if (!barber) return <div key={day.toISOString()} className="border-r border-white/5" />;

                                                const booking = getBookingInSlot(barber.id, time, day);
                                                const isOccupied = isSlotOccupiedByPrevious(barber.id, time, day);
                                                const isOffline = isBarberOffline(barber, time, day);

                                                if (isOccupied) return (
                                                    <div key={day.toISOString()} className={`border-r border-white/5 relative bg-black/5 ${isSameDay(day, new Date()) ? 'bg-[#DBC278]/5' : ''}`} />
                                                );

                                                return (
                                                    <SlotCell
                                                        key={day.toISOString()}
                                                        barber={barber}
                                                        time={time}
                                                        booking={booking}
                                                        isOffline={isOffline}
                                                        dayDate={day}
                                                        onClick={() => handleSlotClick(barber.id, time, day)}
                                                        onToggleLock={() => handleToggleLock(barber.id, time, day, booking)}
                                                        onBookingClick={setActionBooking}
                                                    />
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer / Info */}
            <div className="p-3 border-t border-white/5 bg-black/40 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#DBC278]" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Confirmado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Concluído</span>
                </div>
            </div>

            {/* Modals */}
            <CreateManualBookingModal
                isOpen={isManualBookingModalOpen}
                onOpenChange={setIsManualBookingModalOpen}
                slug={slug}
                onSuccess={() => fetchData()}
                initialDate={date}
                defaultBarberId={selectedSlot?.barber_id}
                defaultTime={selectedSlot?.time}
            />

            <Dialog open={!!actionBooking} onOpenChange={(open) => {
                if (!open) {
                    setActionBooking(null)
                    setIsFaturando(false)
                }
            }}>
                <DialogContent className="max-w-md bg-[#1c1c1c] border-white/5 p-6 gap-6 rounded-3xl">
                    <DialogHeader className="text-left space-y-4">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-black text-white">Agendamento</DialogTitle>
                        </div>
                        {actionBooking && (
                            <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 relative">
                                <Avatar className="w-12 h-12 border-2 border-[#DBC278]/20 bg-[#DBC278]/10 text-[#DBC278]">
                                    <AvatarFallback className="font-bold">
                                        {actionBooking.customer_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h4 className="font-black text-white leading-none capitalize text-lg">
                                        {actionBooking.customer_name}
                                    </h4>
                                    <p className="text-sm font-bold text-zinc-400 capitalize">
                                        1x {actionBooking.barber_data?.name?.split(' ')[0]} - {actionBooking.service_title.split(' ')[0]}
                                    </p>
                                </div>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white hover:bg-white/10 px-2 flex flex-col items-center gap-1 h-auto py-1.5"
                                    onClick={() => setIsEditModalOpen(true)}
                                >
                                    <Pencil className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Editar</span>
                                </Button>
                            </div>
                        )}
                    </DialogHeader>

                    {actionBooking && (
                        <div className="flex flex-col gap-6">
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                                    {isFaturando ? "Meio de Pagamento" : "Status do Agendamento"}
                                </p>
                                <div className="space-y-2">
                                    {!isFaturando ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-green-500 border-green-500/20 hover:bg-green-500/10 font-black gap-3 bg-green-500/5 shadow-xl shadow-green-500/5 ring-1 ring-green-500/20"
                                                onClick={() => setIsFaturando(true)}
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Finalizar e Faturar
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-[#DBC278] border-[#DBC278]/20 hover:bg-[#DBC278]/10 font-bold gap-3"
                                                onClick={() => router.push(`/${slug}/admin/pdv?booking_id=${actionBooking.id}`)}
                                            >
                                                <ShoppingCart className="w-5 h-5" />
                                                Abrir no PDV
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-red-500 border-red-500/20 hover:bg-red-500/10 font-bold gap-3"
                                                onClick={() => {
                                                    if (confirm("Deseja realmente desmarcar este agendamento?")) {
                                                        updateStatus(actionBooking.id, 'cancelled')
                                                    }
                                                }}
                                            >
                                                <X className="w-5 h-5" />
                                                Desmarcar
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-[#00b4d8] border-[#00b4d8]/20 hover:bg-[#00b4d8]/10 font-black gap-3"
                                                onClick={() => updateStatus(actionBooking.id, 'completed', 'pix')}
                                            >
                                                <QrCode className="w-5 h-5" />
                                                PIX
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-[#e0aaff] border-[#e0aaff]/20 hover:bg-[#e0aaff]/10 font-black gap-3"
                                                onClick={() => updateStatus(actionBooking.id, 'completed', 'credit')}
                                            >
                                                <CreditCard className="w-5 h-5" />
                                                Cartão de Crédito
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-12 text-green-500 border-green-500/20 hover:bg-green-500/10 font-black gap-3"
                                                onClick={() => updateStatus(actionBooking.id, 'completed', 'cash')}
                                            >
                                                <Banknote className="w-5 h-5" />
                                                Dinheiro
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-12 text-zinc-400 hover:text-white hover:bg-white/5 font-bold gap-3 mt-2"
                                                onClick={() => setIsFaturando(false)}
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                                Voltar
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-white/5">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Envio de Mensagem / Registro</p>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white border-transparent font-black gap-3 shadow-lg shadow-[#25D366]/20 transition-all"
                                        onClick={() => {
                                            const cleanPhone = actionBooking.customer_phone.replace(/\D/g, '')
                                            window.open(`https://wa.me/55${cleanPhone}`, '_blank')
                                        }}
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        Chamar no WhatsApp
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {isCalendarOpen && (
                <FullCalendarModal
                    selectedDate={date}
                    onSelect={(d: Date) => {
                        setDate(d)
                        setIsCalendarOpen(false)
                    }}
                    onClose={() => setIsCalendarOpen(false)}
                />
            )}

            {isEditModalOpen && actionBooking && (
                <EditBookingModal
                    isOpen={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    booking={actionBooking}
                    onSuccess={() => {
                        fetchData()
                        setActionBooking(null)
                    }}
                />
            )}
        </div>
    )
}

// Subcomponente para organizar a célula do slot
function SlotCell({ barber, time, booking, isOffline, onClick, dayDate, onToggleLock, onBookingClick }: any) {
    const timeStep = 15; // minutos (deve ser o mesmo do pai)
    const isToday = dayDate ? isSameDay(dayDate, new Date()) : false;

    return (
        <div
            className={`border-r border-white/5 relative p-1 group/slot transition-all duration-300
                ${booking || isOffline ? '' : 'hover:bg-white/5 cursor-pointer'}
                ${isOffline ? 'bg-black/30 stripe-bg pointer-events-none' : ''}
                ${isToday ? 'bg-[#DBC278]/[0.02]' : ''}
            `}
            onClick={() => !booking && !isOffline && onClick()}
        >
            {isOffline && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none">
                    <Lock className="w-3 h-3 text-zinc-600" />
                </div>
            )}
            {booking && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (booking.status === 'locked' && onToggleLock) {
                            onToggleLock();
                        } else if (onBookingClick) {
                            onBookingClick(booking);
                        }
                    }}
                    className={`
                        absolute inset-x-1 inset-y-0.5 rounded-xl px-2.5 shadow-2xl z-10 overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] border border-white/10
                        ${booking.status === 'completed' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                            booking.status === 'locked' ? 'bg-red-950/20 border border-red-900/50 text-red-500 cursor-pointer hover:bg-red-900/30 pointer-events-auto' :
                                booking.status === 'confirmed' ? 'bg-[#DBC278] text-black shadow-[#DBC278]/40' :
                                    'bg-blue-600 text-white shadow-blue-500/40'}
                        py-3 sm:py-4 justify-between
                    `}
                    style={{
                        height: `calc(${(booking.duration / timeStep) * 100}% - 4px)`,
                        minHeight: 'calc(100% - 4px)'
                    }}
                >
                    {booking.status === 'locked' ? (
                        <div className="flex flex-col items-center justify-center h-full gap-1 opacity-80 cursor-pointer pointer-events-auto">
                            <Lock className="w-5 h-5 text-red-500" />
                        </div>
                    ) : (
                        <>
                            <div className="pointer-events-none min-h-0 flex-1 flex flex-col justify-center">
                                <div className="flex items-start justify-between gap-1.5">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <User className={`w-3 h-3 flex-shrink-0 ${booking.status === 'confirmed' ? 'text-black/70' : booking.status === 'completed' ? 'text-zinc-500' : 'text-white/70'}`} />
                                                <span className="font-black text-[11px] sm:text-sm uppercase tracking-tight truncate leading-tight flex items-center gap-1.5">
                                                    {booking.customer_name}
                                                    {booking.is_vip && <Crown className={`w-3.5 h-3.5 flex-shrink-0 ${booking.status === 'confirmed' ? 'text-[#a18835] fill-[#a18835]' : 'text-[#DBC278] fill-[#DBC278]'}`} />}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 opacity-90 overflow-hidden">
                                                <Phone className={`w-3 h-3 flex-shrink-0 ${booking.status === 'confirmed' ? 'text-black/70' : booking.status === 'completed' ? 'text-zinc-500' : 'text-white/70'}`} />
                                                <span className="text-[9px] sm:text-[10px] font-bold truncate leading-tight tracking-tight">{booking.customer_phone}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 opacity-90 overflow-hidden">
                                                <Scissors className={`w-3 h-3 flex-shrink-0 ${booking.status === 'confirmed' ? 'text-black/70' : booking.status === 'completed' ? 'text-zinc-500' : 'text-white/70'}`} />
                                                <span className="text-[9px] sm:text-[10px] font-bold truncate leading-tight uppercase tracking-tight">{booking.service_title}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <Badge className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 h-auto border-none font-black shadow-none bg-black/10 ${booking.status === 'confirmed' ? 'text-black' : booking.status === 'completed' ? 'text-zinc-400' : 'text-white'}`}>
                                            {booking.duration}m
                                        </Badge>
                                        {booking.status === 'confirmed' && <Check className="w-3 h-3 opacity-60" />}
                                        {booking.status === 'completed' && (
                                            <Badge className="text-[6px] sm:text-[7px] px-1 py-0 h-auto font-black shadow-none mt-1 bg-zinc-700 text-zinc-300 pointer-events-none">
                                                CONCLUÍDO
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center justify-between text-[10px] sm:text-xs font-black opacity-90 border-t border-black/5 pt-2 mt-auto pointer-events-none`}>
                                <div className="flex items-center gap-1.5 bg-black/5 px-1.5 py-0.5 rounded-lg">
                                    <Clock className="w-3 h-3" />
                                    <span>{booking.time}</span>
                                </div>
                                {booking.status === 'confirmed' && <Check className="w-3.5 h-3.5" />}
                            </div>
                        </>
                    )}

                    {/* Stripe Effect for background */}
                    {booking.status !== 'locked' && <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,white_10%,transparent_0%)] bg-[length:12px_12px]" />}
                </div>
            )}

            {!booking && (
                <div className="absolute inset-0 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center gap-2 pointer-events-none transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="p-1 sm:p-2 hover:bg-[#DBC278]/20 rounded-md text-[#DBC278] pointer-events-auto transition-colors"
                        title="Novo Agendamento"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleLock && onToggleLock(); }}
                        className="p-1 sm:p-2 hover:bg-red-500/20 rounded-md text-red-500 pointer-events-auto transition-colors"
                        title="Travar Horário"
                    >
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            )}
        </div>
    )
}
