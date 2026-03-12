"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Trophy, Target, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GamificationPanel() {
    return (
        <Card className="bg-gradient-to-br from-bg-card via-bg-card to-emerald-900/10 border-border-color shadow-lg h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Trophy className="w-32 h-32 text-emerald-500" />
            </div>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-emerald-500 relative z-10">
                    <Target className="w-5 h-5" />
                    Meta de Conversão (Novembro)
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="flex justify-between items-end mb-2">
                    <div className="text-3xl font-bold text-text-primary">5 <span className="text-sm font-normal text-text-secondary">/ 10 resgates</span></div>
                    <div className="text-sm font-bold text-emerald-500">50%</div>
                </div>
                
                {/* ProgressBar Dummy */}
                <div className="h-2 bg-hover-bg border border-border-color/50 rounded-full w-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '50%' }}></div>
                </div>
                
                <p className="text-xs text-text-secondary mt-4 leading-relaxed">
                    Transforme aniversários em faturamento. Faltam apenas 5 clientes para bater a meta de recuperação do mês.
                </p>

                <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Disparos de Hoje
                </Button>
            </CardContent>
        </Card>
    )
}
