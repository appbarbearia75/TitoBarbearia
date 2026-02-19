"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react"
import { useState, useMemo } from "react"
import { createPortal } from "react-dom"

interface DateSelectorProps {
    selectedDate: Date
    onSelect: (date: Date) => void
    openingHours?: any
}

// Map JS getDay() (0-6, Sun-Sat) to our DB keys
const DAY_KEY_MAP = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

// Portuguese Day Names (Hardcoded to prevent "Sexo" typo or locale issues)
const DAY_NAMES = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']

export function DateSelector({ selectedDate, onSelect, openingHours }: DateSelectorProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Helper to check if a date is open
    const isDateOpen = (date: Date) => {
        if (!openingHours) return true // default to open if no config
        const dayKey = DAY_KEY_MAP[getDay(date)]
        return openingHours[dayKey]?.open !== false
    }

    // Horizontal list (next 14 available days)
    const horizontalDates = useMemo(() => {
        const dates = []
        let current = new Date()
        while (dates.length < 14) {
            if (isDateOpen(current)) {
                dates.push(current)
            }
            current = addDays(current, 1)
        }
        return dates
    }, [openingHours])

    return (
        <>
            <div className="flex items-center justify-between mb-2 pr-5">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="text-xs font-bold text-[#DBC278] hover:underline flex items-center gap-1"
                >
                    <CalendarIcon className="w-3 h-3" />
                    VER CALENDÁRIO COMPLETO
                </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide pr-5">
                {horizontalDates.map((date) => {
                    const isSelected = date.toDateString() === selectedDate.toDateString()
                    const dayName = DAY_NAMES[getDay(date)]
                    const dayNumber = format(date, "d")

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onSelect(date)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[56px] h-[64px] rounded-xl transition-all border border-transparent",
                                isSelected
                                    ? "bg-[#DBC278] text-black scale-105 shadow-lg shadow-[#DBC278]/20"
                                    : "bg-[#1c1c1c] text-gray-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                            )}
                        >
                            <span className="text-[10px] font-bold mb-0.5 opacity-80">{dayName}</span>
                            <span className="text-lg font-bold leading-none">{dayNumber}</span>
                        </button>
                    )
                })}
            </div>

            {/* Modal / Expanded View */}
            {isExpanded && (
                <FullCalendarModal
                    selectedDate={selectedDate}
                    onSelect={(d) => { onSelect(d); setIsExpanded(false) }}
                    onClose={() => setIsExpanded(false)}
                    openingHours={openingHours}
                />
            )}
        </>
    )
}

export function FullCalendarModal({ selectedDate, onSelect, onClose, openingHours }: { selectedDate: Date, onSelect: (d: Date) => void, onClose: () => void, openingHours?: any }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    })

    // Helper to check if a date is open
    const isDateOpen = (date: Date) => {
        if (!openingHours) return true
        const dayKey = DAY_KEY_MAP[getDay(date)]
        return openingHours[dayKey]?.open !== false
    }

    // Fillers for start of grid
    const startDay = days[0].getDay() // 0 = Sunday
    const emptyStart = Array.from({ length: startDay })

    return createPortal(
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1c1c1c] w-full max-w-sm rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-4 flex items-center justify-between border-b border-zinc-800">
                    <h3 className="font-bold text-lg capitalize text-white">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-5 h-5 text-white" /></button>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-5 h-5 text-white" /></button>
                        <button onClick={onClose} className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded ml-2"><X className="w-5 h-5 text-white" /></button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <span key={i} className="text-xs font-bold text-zinc-500">{d}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {emptyStart.map((_, i) => <div key={`empty-${i}`} />)}
                        {days.map((date) => {
                            const isSelected = isSameDay(date, selectedDate)
                            const isOpen = isDateOpen(date)

                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => isOpen && onSelect(date)}
                                    disabled={!isOpen}
                                    className={cn(
                                        "h-10 rounded-lg text-sm font-bold transition-all",
                                        isSelected
                                            ? "bg-[#DBC278] text-black"
                                            : isOpen
                                                ? "text-white hover:bg-white/10"
                                                : "text-zinc-600 cursor-not-allowed opacity-30"
                                    )}
                                >
                                    {format(date, 'd')}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
