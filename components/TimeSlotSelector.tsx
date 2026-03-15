"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Sun, Moon, Loader2 } from "lucide-react"
import { cn, parseDuration } from "@/lib/utils"

interface TimeSlotSelectorProps {
    slots: string[]
    selectedSlot?: string | null
    selectedSlots?: string[]
    onSelect: (slot: string) => void
    barbershopId?: string
    barberId?: string | null
    date?: string
    themeColor?: string
    totalDuration?: number
}

export function TimeSlotSelector({
    slots,
    selectedSlot,
    selectedSlots,
    onSelect,
    barbershopId,
    barberId,
    date,
    themeColor = "#DBC278",
    totalDuration = 30
}: TimeSlotSelectorProps) {
    const [bookedSlots, setBookedSlots] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!barbershopId || !date) return
        const fetchBooked = async () => {
            setLoading(true)
            const blocked = new Set<string>()

            // 1. Fetch Closed Periods
            const { data: closedData } = await supabase
                .from('closed_periods')
                .select('*')
                .eq('barbershop_id', barbershopId)
                .lte('start_date', date)
                .gte('end_date', date)

            if (closedData) {
                closedData.forEach((cp: any) => {
                    if (!cp.start_time || !cp.end_time) {
                        // Block all day
                        slots.forEach(s => blocked.add(s))
                    } else {
                        // Block specific times
                        slots.forEach(s => {
                            if (s >= cp.start_time.slice(0, 5) && s < cp.end_time.slice(0, 5)) {
                                blocked.add(s)
                            }
                        })
                    }
                })
            }

            // 2. Fetch schedule_blocks
            const { data: blocksData } = await supabase
                .from('schedule_blocks')
                .select('*')
                .eq('barbershop_id', barbershopId)

            if (blocksData && date) {
                const targetDate = new Date(date + 'T00:00:00')
                const targetDayOfWeek = targetDate.getDay()
                const targetDayOfMonth = targetDate.getDate()

                blocksData.forEach((block: any) => {
                    let appliesToDay = false

                    if (!block.is_recurring && block.date === date) {
                        appliesToDay = true
                    } else if (block.is_recurring) {
                        if (block.recurrence_type === 'daily') appliesToDay = true
                        if (block.recurrence_type === 'weekly' && block.recurrence_days?.includes(targetDayOfWeek)) appliesToDay = true
                        if (block.recurrence_type === 'monthly' && block.date) {
                            const blockDate = new Date(block.date + 'T00:00:00')
                            if (blockDate.getDate() === targetDayOfMonth) appliesToDay = true
                        }
                    }

                    // Also check professional_id filter if barberId is provided
                    if (appliesToDay && block.professional_id && barberId && block.professional_id !== barberId) {
                        appliesToDay = false
                    }

                    if (appliesToDay) {
                        const startStr = block.start_time.slice(0, 5)
                        const endStr = block.end_time.slice(0, 5)
                        // Add all 15-min intervals between start and end
                        let [h, m] = startStr.split(':').map(Number)
                        const [endH, endM] = endStr.split(':').map(Number)
                        while (h < endH || (h === endH && m < endM)) {
                            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                            blocked.add(timeStr)
                            m += 15
                            if (m >= 60) { h += 1; m -= 60 }
                        }
                    }
                })
            }

            // 3. Fetch standard bookings
            let query = supabase
                .from('bookings')
                .select('time, services(duration)')
                .eq('barbershop_id', barbershopId)
                .eq('date', date)
                .in('status', ['pending', 'confirmed', 'locked'])
            if (barberId) query = query.eq('barber_id', barberId)
            const { data } = await query

            if (data) {
                data.forEach((b: any) => {
                    if (!b.time) return
                    const startTime = b.time.slice(0, 5)
                    const durationStr = b.services?.duration || "30 min"
                    const durationMin = parseDuration(b.services?.duration)

                    let [h, m] = startTime.split(':').map(Number)
                    const slotsCount = Math.ceil(durationMin / 15)
                    for (let i = 0; i < slotsCount; i++) {
                        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                        blocked.add(timeStr)
                        m += 15
                        if (m >= 60) {
                            h += 1
                            m -= 60
                        }
                    }
                })
            }
            setBookedSlots(Array.from(blocked))
            setLoading(false)
        }
        fetchBooked()
    }, [barbershopId, barberId, date])

    const isValidSlot = (slot: string) => {
        if (bookedSlots.includes(slot)) return false

        const slotsNeeded = Math.ceil(totalDuration / 15)
        const startIndex = slots.indexOf(slot)
        if (startIndex === -1) return false

        // Ensure we don't go out of bounds of the actual slots array for the day
        if (startIndex + slotsNeeded > slots.length) return false

        for (let i = 0; i < slotsNeeded; i++) {
            const nextSlot = slots[startIndex + i]

            // Check if booked
            if (bookedSlots.includes(nextSlot)) return false

            // Check if it's contiguous mathematically (e.g. invalid if lunch break is in between)
            let [h, m] = slot.split(':').map(Number)
            m += i * 15
            h += Math.floor(m / 60)
            m = m % 60
            const expectedTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
            if (nextSlot !== expectedTimeStr) return false
        }

        return true
    }

    const validSlots = slots.filter(isValidSlot)
    const morningSlots = validSlots.filter(s => parseInt(s.split(':')[0]) < 12)
    const afternoonSlots = validSlots.filter(s => parseInt(s.split(':')[0]) >= 12)
    const availableCount = morningSlots.length + afternoonSlots.length

    const renderSlot = (slot: string) => {
        const isBooked = bookedSlots.includes(slot)
        const isSelected = selectedSlots ? selectedSlots.includes(slot) : selectedSlot === slot

        return (
            <button
                key={slot}
                disabled={isBooked}
                onClick={() => !isBooked && onSelect(slot)}
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-2xl h-[68px] transition-all duration-200 select-none overflow-hidden",
                    isBooked
                        ? "cursor-not-allowed opacity-30"
                        : isSelected
                            ? "scale-105"
                            : "bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-800/80 active:scale-95 cursor-pointer"
                )}
                style={isSelected ? {
                    background: `linear-gradient(135deg, ${themeColor}25, ${themeColor}10)`,
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    borderColor: themeColor,
                    boxShadow: `0 0 20px ${themeColor}25, inset 0 1px 0 ${themeColor}30`
                } : isBooked ? {
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)'
                } : undefined}
            >
                {/* Selected glow dot */}
                {isSelected && (
                    <div
                        className="absolute top-2 right-2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: themeColor, boxShadow: `0 0 6px ${themeColor}` }}
                    />
                )}

                <span
                    className={cn(
                        "text-[17px] font-bold tracking-tight font-mono",
                        isBooked ? "text-zinc-700" : isSelected ? "" : "text-white"
                    )}
                    style={isSelected ? { color: themeColor } : undefined}
                >
                    {slot}
                </span>

                {isBooked && (
                    <span className="text-[9px] text-zinc-700 uppercase tracking-widest font-semibold mt-0.5">
                        Ocupado
                    </span>
                )}
            </button>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
                <span className="text-zinc-600 text-sm font-medium">Verificando disponibilidade...</span>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Availability bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {availableCount} disponíveis
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: themeColor }} />
                        Livre
                    </span>
                </div>
            </div>

            {/* Morning */}
            {morningSlots.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Manhã</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {morningSlots.map(renderSlot)}
                    </div>
                </div>
            )}

            {/* Afternoon */}
            {afternoonSlots.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
                            <Moon className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Tarde</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {afternoonSlots.map(renderSlot)}
                    </div>
                </div>
            )}
        </div>
    )
}
