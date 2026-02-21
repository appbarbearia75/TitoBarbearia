"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface WorkingHours {
    [key: string]: {
        open: boolean
        start: string
        end: string
        lunchStart?: string | null
        lunchEnd?: string | null
    }
}

interface WorkingHoursEditorProps {
    value: WorkingHours
    onChange: (value: WorkingHours) => void
}

const DAYS_TRANSLATION: { [key: string]: string } = {
    seg: "Segunda-feira",
    ter: "Terça-feira",
    qua: "Quarta-feira",
    qui: "Quinta-feira",
    sex: "Sexta-feira",
    sab: "Sábado",
    dom: "Domingo"
}

// Default order for display
const SORTED_DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']

export function WorkingHoursEditor({ value, onChange }: WorkingHoursEditorProps) {

    const handleChange = (day: string, field: 'open' | 'start' | 'end' | 'lunchStart' | 'lunchEnd', newValue: any) => {
        const currentDay = value[day] || { open: false, start: "09:00", end: "18:00", lunchStart: null, lunchEnd: null }
        const updated = {
            ...value,
            [day]: {
                ...currentDay,
                [field]: newValue
            }
        }
        onChange(updated)
    }

    const handleTimeChange = (day: string, field: 'start' | 'end' | 'lunchStart' | 'lunchEnd', inputValue: string) => {
        // Remove non-numeric characters
        let numbers = inputValue.replace(/\D/g, "")

        // Limit to 4 characters (HHmm)
        if (numbers.length > 4) numbers = numbers.slice(0, 4)

        // Format as HH:mm
        let formatted = numbers
        if (numbers.length >= 2) {
            formatted = `${numbers.slice(0, 2)}:${numbers.slice(2)}`
        }

        // Validate hours and minutes roughly (optional, but good for UX)
        // We allow typing, validation happens on blur or we can just strictly mask.
        // Let's stick to simple masking for now as per "only numbers" request.

        handleChange(day, field, formatted)
    }

    return (
        <div className="space-y-4">
            {SORTED_DAYS.map((day) => {
                const dayConfig = value[day] || { open: false, start: "09:00", end: "18:00" }

                return (
                    <div key={day} className="flex flex-col sm:flex-col gap-4 bg-[#1c1c1c]/50 p-3 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 w-40">
                                <Switch
                                    checked={dayConfig.open}
                                    onCheckedChange={(checked) => handleChange(day, 'open', checked)}
                                    className="data-[state=checked]:bg-[#DBC278] data-[state=unchecked]:bg-zinc-700 border border-zinc-600"
                                />
                                <span className={`font-medium text-sm ${dayConfig.open ? 'text-zinc-200' : 'text-zinc-500'}`}>
                                    {DAYS_TRANSLATION[day]}
                                </span>
                            </div>

                            {!dayConfig.open && (
                                <div className="text-sm text-zinc-600 italic flex items-center h-9">
                                    Fechado
                                </div>
                            )}
                        </div>

                        {dayConfig.open && (
                            <div className="space-y-3 pl-12 border-l border-white/5">
                                {/* Horário de Funcionamento */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-500 w-16">Expediente:</span>
                                    <div className="relative w-20">
                                        <Input
                                            placeholder="09:00"
                                            maxLength={5}
                                            className="bg-black/20 border-white/5 text-center h-9 text-sm"
                                            value={dayConfig.start}
                                            onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                        />
                                    </div>
                                    <span className="text-zinc-600 text-xs">até</span>
                                    <div className="relative w-20">
                                        <Input
                                            placeholder="18:00"
                                            maxLength={5}
                                            className="bg-black/20 border-white/5 text-center h-9 text-sm"
                                            value={dayConfig.end}
                                            onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Horário de Almoço */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 w-16">
                                        <input
                                            type="checkbox"
                                            checked={!!dayConfig.lunchStart}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const updated = {
                                                        ...value,
                                                        [day]: {
                                                            ...dayConfig,
                                                            lunchStart: "12:00",
                                                            lunchEnd: "13:00"
                                                        }
                                                    }
                                                    onChange(updated)
                                                } else {
                                                    const updated = {
                                                        ...value,
                                                        [day]: {
                                                            ...dayConfig,
                                                            lunchStart: null,
                                                            lunchEnd: null
                                                        }
                                                    }
                                                    onChange(updated)
                                                }
                                            }}
                                            className="rounded border-zinc-600 bg-zinc-800 text-[#DBC278] focus:ring-[#DBC278]"
                                        />
                                        <span className="text-xs text-zinc-500">Almoço:</span>
                                    </div>

                                    {dayConfig.lunchStart ? (
                                        <>
                                            <div className="relative w-20">
                                                <Input
                                                    placeholder="12:00"
                                                    maxLength={5}
                                                    className="bg-black/20 border-white/5 text-center h-9 text-sm"
                                                    value={dayConfig.lunchStart || ''}
                                                    onChange={(e) => handleTimeChange(day, 'lunchStart', e.target.value)}
                                                />
                                            </div>
                                            <span className="text-zinc-600 text-xs">até</span>
                                            <div className="relative w-20">
                                                <Input
                                                    placeholder="13:00"
                                                    maxLength={5}
                                                    className="bg-black/20 border-white/5 text-center h-9 text-sm"
                                                    value={dayConfig.lunchEnd || ''}
                                                    onChange={(e) => handleTimeChange(day, 'lunchEnd', e.target.value)}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-xs text-zinc-600 italic">Sem pausa</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
