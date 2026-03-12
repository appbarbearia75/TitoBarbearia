"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Bot, Clock, MessageSquare, CheckCircle2, TrendingUp } from "lucide-react"

const steps = [
    {
        icon: Clock,
        color: 'text-indigo-500',
        borderColor: 'border-indigo-500',
        label: '7 dias antes',
        description: 'Lembrete para agendar corte',
        badge: 'Pausado',
        badgeBg: 'bg-bg-app text-text-muted border-border-color',
    },
    {
        icon: MessageSquare,
        color: 'text-amber-500',
        borderColor: 'border-amber-500',
        label: 'No dia',
        description: 'Parabéns + oferta especial',
        badge: 'Manual',
        badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    },
    {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        borderColor: 'border-emerald-500',
        label: '7 dias depois',
        description: 'Oferta de retorno garantido',
        badge: 'Pausado',
        badgeBg: 'bg-bg-app text-text-muted border-border-color',
    },
]

export function AutomationTimeline() {
    return (
        <Card className="bg-bg-card border-border-color rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border-color">
                <div className="flex items-center gap-1.5 text-indigo-500 mb-0.5">
                    <Bot className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Automação</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary">⚙ Régua de Relacionamento</h3>
            </div>

            <CardContent className="p-5">
                {/* Timeline */}
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-3.5 top-4 bottom-4 w-px bg-border-color" />

                    <div className="space-y-5">
                        {steps.map((step, i) => {
                            const Icon = step.icon
                            return (
                                <div key={i} className="flex items-start gap-3">
                                    {/* Dot */}
                                    <div className={`w-7 h-7 rounded-full bg-bg-card border-2 ${step.borderColor} flex items-center justify-center shrink-0 z-10`}>
                                        <Icon className={`w-3 h-3 ${step.color}`} />
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2 pt-0.5">
                                        <div>
                                            <p className="text-xs font-bold text-text-primary">{step.label}</p>
                                            <p className="text-[11px] text-text-muted mt-0.5">{step.description}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-md shrink-0 ${step.badgeBg}`}>
                                            {step.badge}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Revenue Insight */}
                <div className="mt-5 p-3 bg-bg-app border border-border-color rounded-lg">
                    <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Faturamento Potencial</span>
                    </div>
                    <p className="text-base font-black text-text-primary">R$ 120,00 hoje</p>
                    <p className="text-[11px] text-text-muted mt-0.5">3 clientes × ticket médio estimado</p>
                </div>
            </CardContent>
        </Card>
    )
}
