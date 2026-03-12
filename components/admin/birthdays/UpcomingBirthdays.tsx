"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ChevronRight } from "lucide-react"
import { Client } from "@/components/admin/birthdays/ClientCard"

interface UpcomingBirthdaysProps {
    clients: Client[]
    weekCount: number
}

function getAvatarColor(name: string): string {
    const colors = ['#16A34A', '#2563EB', '#7C3AED', '#D97706', '#DC2626', '#0891B2']
    return colors[name.charCodeAt(0) % colors.length]
}

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

// Generates mock upcoming dates for display purposes (no data = demo)
function getMockUpcoming() {
    const now = new Date()
    return [
        { day: now.getDate() + 1, month: now.toLocaleString('pt-BR', { month: 'short' }), name: 'Mariana Silva', lastVisit: '14 dias', tag: 'VIP' },
        { day: now.getDate() + 2, month: now.toLocaleString('pt-BR', { month: 'short' }), name: 'Carlos Souza', lastVisit: '7 dias', tag: 'Frequente' },
        { day: now.getDate() + 4, month: now.toLocaleString('pt-BR', { month: 'short' }), name: 'Felipe Nunes', lastVisit: '22 dias', tag: null },
        { day: now.getDate() + 6, month: now.toLocaleString('pt-BR', { month: 'short' }), name: 'Rodrigo Lima', lastVisit: '3 dias', tag: 'VIP' },
    ]
}

export function UpcomingBirthdays({ clients, weekCount }: UpcomingBirthdaysProps) {
    const upcomingItems = clients.length > 0
        ? clients.map((c, i) => ({
            day: new Date().getDate() + i + 1,
            month: new Date().toLocaleString('pt-BR', { month: 'short' }),
            name: c.name,
            lastVisit: c.lastVisit,
            tag: c.tags.includes('vip') ? 'VIP' : null,
        }))
        : getMockUpcoming()

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    📅 Próximos 7 dias
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                        {weekCount || upcomingItems.length}
                    </span>
                </h2>
                <Button variant="ghost" size="sm" className="text-xs text-text-muted h-7 px-2 hover:text-text-primary gap-1">
                    Ver todos <ChevronRight className="w-3 h-3" />
                </Button>
            </div>

            <Card className="bg-bg-card border-border-color rounded-xl overflow-hidden divide-y divide-border-color">
                {upcomingItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-bg-app transition-colors group">
                        {/* Date Pill */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 w-11 h-11 rounded-lg bg-bg-app border border-border-color flex flex-col items-center justify-center">
                                <span className="text-sm font-black text-text-primary leading-none">{item.day}</span>
                                <span className="text-[9px] text-text-muted font-semibold uppercase">{item.month}</span>
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0"
                                        style={{ background: getAvatarColor(item.name) }}
                                    >
                                        {getInitials(item.name)}
                                    </div>
                                    <span className="text-sm font-semibold text-text-primary truncate">{item.name}</span>
                                    {item.tag === 'VIP' && (
                                        <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md shrink-0">VIP</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Clock className="w-2.5 h-2.5 text-text-muted" />
                                    <span className="text-[11px] text-text-muted">Última visita: {item.lastVisit}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 h-8 text-[11px] font-semibold border-border-color text-text-secondary hover:text-text-primary hover:bg-bg-app rounded-lg px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            Agendar mensagem
                        </Button>
                    </div>
                ))}
            </Card>
        </section>
    )
}
