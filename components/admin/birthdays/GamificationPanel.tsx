"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Zap } from "lucide-react"

export function GamificationPanel() {
    const progress = 50 // 5 of 10
    const current = 5
    const goal = 10

    return (
        <Card className="bg-bg-card border-border-color rounded-xl overflow-hidden">
            {/* Header Strip */}
            <div className="px-5 py-4 border-b border-border-color">
                <div className="flex items-center gap-1.5 text-emerald-500 mb-0.5">
                    <Zap className="w-3.5 h-3.5 fill-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Inteligência CRM</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    💡 Meta de Conversão
                </h3>
            </div>

            <CardContent className="p-5">
                {/* Progress Numbers */}
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <span className="text-3xl font-black text-text-primary tracking-tight">{current}</span>
                        <span className="text-sm font-bold text-text-muted ml-1">/ {goal}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                        {progress}%
                    </span>
                </div>
                <p className="text-[10px] text-text-muted font-medium mb-3 uppercase tracking-wider">Clientes recuperados este mês</p>

                {/* Progress Bar */}
                <div className="h-2 bg-bg-app border border-border-color rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p className="text-xs text-text-secondary mt-4 leading-relaxed">
                    Faltam apenas <span className="font-bold text-text-primary">{goal - current} clientes</span> para atingir sua meta mensal de recuperação.
                </p>

                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-lg flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" />
                    Iniciar disparos de hoje
                </Button>
            </CardContent>
        </Card>
    )
}
