"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CalendarDays, TrendingUp, ChevronRight } from "lucide-react"

interface OpportunitiesGridProps {
    weekCount: number
    potentialRevenue: number
}

export function OpportunitiesGrid({ weekCount, potentialRevenue }: OpportunitiesGridProps) {
    const cards = [
        {
            icon: AlertTriangle,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            border: 'border-l-red-500',
            label: 'Clientes em risco',
            description: 'Não retornam há +60 dias',
            value: 8,
            valueColor: 'text-red-500',
            ctaLabel: 'Ver clientes',
        },
        {
            icon: CalendarDays,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-l-blue-500',
            label: 'Aniversários esta semana',
            description: 'Oportunidade para contato',
            value: weekCount || 7,
            valueColor: 'text-blue-500',
            ctaLabel: 'Enviar campanha',
        },
        {
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-l-emerald-500',
            label: 'Receita potencial',
            description: 'Se todos retornarem hoje',
            value: potentialRevenue > 0 ? `R$ ${potentialRevenue.toLocaleString('pt-BR')}` : 'R$ 840',
            valueColor: 'text-emerald-500',
            ctaLabel: 'Ver cálculo',
        },
    ]

    return (
        <section>
            <h2 className="text-sm font-bold text-text-primary mb-4">📊 Oportunidades</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {cards.map((card) => {
                    const Icon = card.icon
                    return (
                        <Card
                            key={card.label}
                            className={`bg-bg-card border-border-color border-l-2 ${card.border} rounded-xl p-4 cursor-pointer hover:bg-bg-card-hover transition-all duration-150 group`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 ${card.color}`} />
                                </div>
                                <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className={`text-2xl font-black ${card.valueColor} tracking-tight`}>
                                {typeof card.value === 'number' ? card.value.toString() : card.value}
                            </div>
                            <div className="text-xs font-semibold text-text-primary mt-0.5">{card.label}</div>
                            <div className="text-[11px] text-text-muted mt-0.5">{card.description}</div>

                            <Button
                                size="sm"
                                variant="ghost"
                                className={`mt-3 h-7 text-[11px] font-semibold px-0 ${card.color} hover:bg-transparent opacity-70 hover:opacity-100 transition-opacity`}
                            >
                                {card.ctaLabel} →
                            </Button>
                        </Card>
                    )
                })}
            </div>
        </section>
    )
}
