"use client"

import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { CalendarDays, Gift, TrendingUp, Users } from "lucide-react"

export interface BirthdayMetrics {
    today: number
    tomorrow: number
    week: number
    potentialRevenue: number
    noContact: number
}

export function InsightCards({ metrics }: { metrics: BirthdayMetrics }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in duration-700">
            <Card className="bg-bg-card border-border-color shadow-sm rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
                <div className="p-3 bg-primary-action/10 rounded-xl w-fit group-hover:bg-primary-action/20 transition-colors">
                    <Gift className="w-6 h-6 text-primary-action" />
                </div>
                <div className="mt-4">
                    <div className="text-4xl font-extrabold text-text-primary tracking-tight">{metrics.today}</div>
                    <div className="text-sm font-semibold text-text-secondary mt-1">Clientes hoje</div>
                </div>
            </Card>

            <Card className="bg-bg-card border-border-color shadow-sm rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
                <div className="p-3 bg-amber-500/10 rounded-xl w-fit group-hover:bg-amber-500/20 transition-colors">
                    <CalendarDays className="w-6 h-6 text-amber-500" />
                </div>
                <div className="mt-4">
                    <div className="text-4xl font-extrabold text-text-primary tracking-tight">{metrics.week}</div>
                    <div className="text-sm font-semibold text-text-secondary mt-1">Próximos 7 dias</div>
                </div>
            </Card>

            <Card className="bg-bg-card border-border-color shadow-sm rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group border-l-4 border-l-orange-500">
                <div className="p-3 bg-red-500/10 rounded-xl w-fit group-hover:bg-red-500/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
                <div className="mt-4">
                    <div className="text-4xl font-extrabold text-text-primary tracking-tight">8</div>
                    <div className="text-sm font-semibold text-text-secondary mt-1">Clientes em risco</div>
                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1">Ausentes {">"} 60 dias</p>
                </div>
            </Card>

            <Card className="bg-bg-card border-border-color shadow-sm rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group bg-gradient-to-br from-bg-card to-emerald-500/5">
                <div className="p-3 bg-emerald-500/10 rounded-xl w-fit group-hover:bg-emerald-500/20 transition-colors">
                    <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="mt-4">
                    <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">R$ {metrics.potentialRevenue.toLocaleString('pt-BR')}</div>
                    <div className="text-sm font-semibold text-text-secondary mt-1">Receita potencial</div>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Se todos retornarem</p>
                </div>
            </Card>
        </div>
    )
}
