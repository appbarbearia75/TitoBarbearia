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

    const handleChange = (day: string, field: 'open' | 'start' | 'end', newValue: any) => {
        const currentDay = value[day] || { open: false, start: "09:00", end: "18:00" }
        const updated = {
            ...value,
            [day]: {
                ...currentDay,
                [field]: newValue
            }
        }
        onChange(updated)
    }

    const handleTimeChange = (day: string, field: 'start' | 'end', inputValue: string) => {
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
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#1c1c1c]/50 p-3 rounded-lg border border-white/5">
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

                        {dayConfig.open ? (
                            <div className="flex items-center gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Input
                                        placeholder="09:00"
                                        maxLength={5}
                                        className="bg-black/20 border-white/5 text-center h-9"
                                        value={dayConfig.start}
                                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                    />
                                </div>
                                <span className="text-zinc-600">às</span>
                                <div className="relative flex-1">
                                    <Input
                                        placeholder="18:00"
                                        maxLength={5}
                                        className="bg-black/20 border-white/5 text-center h-9"
                                        value={dayConfig.end}
                                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 text-sm text-zinc-600 italic flex items-center h-9">
                                Fechado
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
