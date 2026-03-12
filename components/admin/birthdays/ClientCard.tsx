"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
    MessageCircle, Calendar, Gift, Ticket, 
    Star, Diamond, Sparkles, Flame, Lightbulb, TrendingUp
} from "lucide-react"

export interface Client {
    id: number | string
    name: string
    age: number
    avatar: string
    phone: string
    lastVisit: string
    lastService: string
    ltv: string
    frequency: string
    tags: string[]
    suggestion?: {
        type: "warning" | "opportunity" | "info"
        text: string
    }
}

export function ClientCard({ client }: { client: Client }) {
    const renderTags = () => {
        return client.tags.map(tag => {
            if (tag === "vip") return <Badge key={tag} className="bg-amber-500/10 text-amber-500 border border-amber-500/20"><Star className="w-3 h-3 mr-1" /> VIP</Badge>
            if (tag === "alto_valor") return <Badge key={tag} className="bg-purple-500/10 text-purple-400 border border-purple-500/20"><Diamond className="w-3 h-3 mr-1" /> Alto Valor</Badge>
            if (tag === "novo") return <Badge key={tag} className="bg-blue-500/10 text-blue-400 border border-blue-500/20"><Sparkles className="w-3 h-3 mr-1" /> Novo</Badge>
            return null
        })
    }

    return (
        <Card className="bg-bg-card border-border-color hover:border-border-color/80 transition-colors p-5 flex flex-col gap-5 overflow-hidden group">
            
            {/* Cabeçalho do Cliente */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border border-border-color">
                        <AvatarImage src={client.avatar} alt={client.name} />
                        <AvatarFallback className="bg-hover-bg text-text-secondary">
                            {client.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-text-primary leading-none">{client.name}</h3>
                            <span className="text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                {client.age} anos
                            </span>
                        </div>
                        <p className="text-sm text-text-secondary">{client.phone}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5 w-32">
                    {renderTags()}
                </div>
            </div>

            {/* Informações Secundárias e Valor */}
            <div className="grid grid-cols-2 gap-4 bg-hover-bg p-3 rounded-xl border border-border-color">
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Última Visita</span>
                    <span className="text-sm text-text-primary">{client.lastVisit}</span>
                    <span className="text-xs text-text-secondary">{client.lastService}</span>
                </div>
                
                <div className="flex flex-col gap-1 text-right">
                    <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" /> Valor do Cliente
                    </span>
                    <span className="text-sm font-medium text-emerald-500">LTV: {client.ltv}</span>
                    <span className="text-xs text-text-secondary">{client.frequency}</span>
                </div>
            </div>

            {/* Sugestão Inteligente */}
            {client.suggestion && (
                <div className={`
                    flex items-start gap-3 p-3 rounded-xl border
                    ${client.suggestion.type === 'warning' ? 'bg-orange-500/5 border-orange-500/10 text-orange-200' : ''}
                    ${client.suggestion.type === 'opportunity' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-200' : ''}
                    ${client.suggestion.type === 'info' ? 'bg-blue-500/5 border-blue-500/10 text-blue-200' : ''}
                `}>
                    {client.suggestion.type === 'warning' && <Flame className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />}
                    {client.suggestion.type === 'opportunity' && <Lightbulb className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
                    {client.suggestion.type === 'info' && <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                    
                    <p className="text-sm font-medium leading-relaxed">
                        {client.suggestion.text}
                    </p>
                </div>
            )}

            {/* Ações Rápidas */}
            <div className="grid grid-cols-4 gap-2 mt-auto">
                <Button variant="outline" className="bg-hover-bg border-border-color hover:bg-emerald-500/20 hover:text-emerald-500 hover:border-emerald-500/20 text-text-secondary w-full" title="Enviar Mensagem">
                    <MessageCircle className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="bg-hover-bg border-border-color hover:bg-hover-bg/80 hover:text-text-primary text-text-secondary w-full" title="Enviar Oferta">
                    <Gift className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="bg-hover-bg border-border-color hover:bg-blue-500/20 hover:text-blue-500 hover:border-blue-500/20 text-text-secondary w-full" title="Agendar">
                    <Calendar className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="bg-hover-bg border-border-color hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/20 text-text-secondary w-full" title="Aplicar Cupom">
                    <Ticket className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    )
}
