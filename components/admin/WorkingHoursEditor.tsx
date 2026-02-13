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
        const updated = {
            ...value,
            [day]: {
                ...value[day],
                [field]: newValue
            }
        }
        onChange(updated)
    }

    return (
        <div className="space-y-4">
            {SORTED_DAYS.map((day) => {
                const dayConfig = value[day] || { open: false, start: "09:00", end: "18:00" }

                return (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center gap-3 w-40">
                            <Switch
                                checked={dayConfig.open}
                                onCheckedChange={(checked) => handleChange(day, 'open', checked)}
                                className="data-[state=checked]:bg-yellow-500"
                            />
                            <span className="font-medium text-sm text-zinc-300">
                                {DAYS_TRANSLATION[day]}
                            </span>
                        </div>

                        {dayConfig.open ? (
                            <div className="flex items-center gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Input
                                        type="time"
                                        className="bg-zinc-950 border-zinc-800 text-center h-9"
                                        value={dayConfig.start}
                                        onChange={(e) => handleChange(day, 'start', e.target.value)}
                                    />
                                </div>
                                <span className="text-zinc-600">às</span>
                                <div className="relative flex-1">
                                    <Input
                                        type="time"
                                        className="bg-zinc-950 border-zinc-800 text-center h-9"
                                        value={dayConfig.end}
                                        onChange={(e) => handleChange(day, 'end', e.target.value)}
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
