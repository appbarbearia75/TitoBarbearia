"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Sun, Moon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimeSlotSelectorProps {
    slots: string[]
    selectedSlot?: string | null
    onSelect: (slot: string) => void
    barbershopId?: string
    barberId?: string | null
    date?: string
    themeColor?: string
}

export function TimeSlotSelector({
    slots,
    selectedSlot,
    onSelect,
    barbershopId,
    barberId,
    date,
    themeColor = "#DBC278"
}: TimeSlotSelectorProps) {
    const [bookedSlots, setBookedSlots] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!barbershopId || !date) return
        const fetchBooked = async () => {
            setLoading(true)
            let query = supabase
                .from('bookings')
                .select('time')
                .eq('barbershop_id', barbershopId)
                .eq('date', date)
                .in('status', ['pending', 'confirmed'])
            if (barberId) query = query.eq('barber_id', barberId)
            const { data } = await query
            if (data) setBookedSlots(data.map((b: any) => b.time?.slice(0, 5)))
            setLoading(false)
        }
        fetchBooked()
    }, [barbershopId, barberId, date])

    const morningSlots = slots.filter(s => parseInt(s.split(':')[0]) < 12)
    const afternoonSlots = slots.filter(s => parseInt(s.split(':')[0]) >= 12)
    const availableCount = slots.filter(s => !bookedSlots.includes(s)).length

    const renderSlot = (slot: string) => {
        const isBooked = bookedSlots.includes(slot)
        const isSelected = selectedSlot === slot

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
                    <span className="flex items-center gap-1.5 text-xs text-zinc-700">
                        <span className="w-2 h-2 rounded-full bg-zinc-800 inline-block border border-zinc-700" />
                        Ocupado
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
