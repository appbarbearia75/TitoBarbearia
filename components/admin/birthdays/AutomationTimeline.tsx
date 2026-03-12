"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Bot, Clock, MessageSquare, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function AutomationTimeline() {
    return (
        <Card className="bg-bg-card border-border-color shadow-lg h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-text-primary">
                    <Bot className="w-5 h-5 text-indigo-500" />
                    Régua de Relacionamento (Em breve)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                <Clock className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="w-px h-full bg-border-color my-2" />
                        </div>
                        <div className="pb-6">
                            <p className="text-sm font-bold text-text-primary">7 dias antes</p>
                            <p className="text-xs text-text-secondary mt-1">Lembrete para agendar corte preparatório.</p>
                            <Badge className="bg-hover-bg border-border-color text-text-secondary mt-2 hover:bg-hover-bg/80">Desativado</Badge>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                <MessageSquare className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="w-px h-full bg-border-color my-2" />
                        </div>
                        <div className="pb-6">
                            <p className="text-sm font-bold text-text-primary">No Dia</p>
                            <p className="text-xs text-text-secondary mt-1">Mensagem de feliz aniversário com presente virtual.</p>
                            <Badge className="bg-hover-bg border-border-color text-text-secondary mt-2 hover:bg-hover-bg/80">Desativado</Badge>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-text-primary">Resgate</p>
                            <p className="text-xs text-text-secondary mt-1">Gere link de benefício com validade para retorno.</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
