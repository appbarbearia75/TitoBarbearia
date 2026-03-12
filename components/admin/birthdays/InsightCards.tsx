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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <Card className="bg-bg-card border-border-color shadow-lg relative overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between z-10 relative">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-accent-color">Aniversariantes Ocultos</CardDescription>
                    <CalendarDays className="w-4 h-4 text-accent-color/50" />
                </CardHeader>
                <CardContent className="z-10 relative">
                    <div className="text-3xl font-bold text-text-primary">{metrics.today} / {metrics.week}</div>
                    <div className="text-xs text-text-secondary mt-1">Hoje / Na semana</div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-bg-card via-bg-card to-orange-900/10 border-orange-500/20 shadow-lg relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-2 h-full bg-orange-500/50 group-hover:bg-orange-500 transition-colors" />
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-orange-500">Em Risco de Churn</CardDescription>
                    <TrendingUp className="w-4 h-4 text-orange-500/50" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-text-primary mb-1">8</div>
                    <div className="text-[10px] text-orange-600 dark:text-orange-200/50 uppercase tracking-wide">Ausentes {">"} 60 dias</div>
                </CardContent>
            </Card>

            <Card className="bg-bg-card border-border-color shadow-lg">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Resgatados (Últ. 30d)</CardDescription>
                    <Gift className="w-4 h-4 text-emerald-500/50" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-text-primary">5</div>
                    <div className="text-[10px] text-text-secondary uppercase tracking-wide mt-1">Taxa conversão: 18%</div>
                </CardContent>
            </Card>

            <Card className="bg-bg-card border-border-color shadow-lg">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Potencial LTV Em Jogo</CardDescription>
                    <Users className="w-4 h-4 text-text-secondary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-emerald-500">R$ {metrics.potentialRevenue.toLocaleString('pt-BR')}</div>
                    <div className="text-[10px] text-text-secondary uppercase tracking-wide mt-1">Se 100% retornarem</div>
                </CardContent>
            </Card>
        </div>
    )
}
