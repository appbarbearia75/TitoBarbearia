"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Gift, Calendar, Clock, ChevronRight, AlertTriangle } from "lucide-react"
import { Client } from "@/components/admin/birthdays/ClientCard"

interface ClientListProps {
    clients: Client[]
}

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function getAvatarColor(name: string): string {
    const colors = [
        'from-emerald-500 to-emerald-600',
        'from-blue-500 to-blue-600',
        'from-violet-500 to-violet-600',
        'from-amber-500 to-amber-600',
        'from-rose-500 to-rose-600',
        'from-cyan-500 to-cyan-600',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
}

export function ClientList({ clients }: ClientListProps) {
    const todayClients = clients.filter(c =>
        c.suggestion?.text?.toLowerCase().includes('aniversariante')
        || c.suggestion?.text?.toLowerCase().includes('hoje')
        || true // show all filtered clients in this section
    )

    return (
        <div className="space-y-8">
            {/* ── Section: Aniversariantes de Hoje ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                            🎂 Aniversariantes de Hoje
                        </h2>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                            {clients.length}
                        </span>
                    </div>
                </div>

                {clients.length === 0 ? (
                    /* ── Empty State ── */
                    <Card className="bg-bg-card border-border-color rounded-xl p-10 text-center">
                        <div className="w-14 h-14 bg-bg-app border border-border-color rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Gift className="w-6 h-6 text-text-muted" />
                        </div>
                        <h3 className="text-base font-bold text-text-primary">Nenhum aniversariante hoje</h3>
                        <p className="text-xs text-text-secondary mt-1.5 max-w-xs mx-auto leading-relaxed">
                            Mas você pode aproveitar outras oportunidades para trazer clientes de volta.
                        </p>

                        <div className="mt-5 p-3 bg-bg-app border border-border-color rounded-lg text-left flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="text-xs text-text-secondary">
                                    <span className="font-semibold text-text-primary">Próximo aniversário:</span> Mariana Silva em 3 dias
                                </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                        </div>

                        <Button
                            variant="outline"
                            className="mt-4 h-9 text-xs font-semibold border-border-color text-text-secondary hover:text-text-primary hover:bg-bg-app rounded-lg"
                        >
                            Ver próximos aniversariantes
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {clients.map((client) => {
                            const isVip = client.tags.includes('vip')
                            const isRisk = client.suggestion?.type === 'warning'
                            const gradient = getAvatarColor(client.name)

                            return (
                                <div
                                    key={client.id}
                                    className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-bg-card border border-border-color rounded-xl hover:border-emerald-600/30 hover:bg-bg-card-hover transition-all duration-150 gap-4"
                                >
                                    {/* Avatar + Info */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-sm shadow-sm`}>
                                                {getInitials(client.name)}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full border-2 border-bg-card flex items-center justify-center">
                                                <Gift className="w-2 h-2 text-white" />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-text-primary">{client.name}</span>
                                                {isVip && (
                                                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-black uppercase px-1.5 py-0">
                                                        VIP
                                                    </Badge>
                                                )}
                                                {!isVip && (
                                                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-semibold px-1.5 py-0">
                                                        Frequente
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="flex items-center gap-1 text-[11px] text-text-muted">
                                                    <Clock className="w-3 h-3" />
                                                    Última visita: {client.lastVisit}
                                                </span>
                                                <span className="text-[11px] text-text-muted">
                                                    Ticket médio: {client.ltv}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 self-end md:self-auto">
                                        {isRisk && (
                                            <div className="hidden md:flex items-center gap-1 text-[11px] font-semibold text-orange-500 bg-orange-500/10 px-2.5 py-1.5 rounded-lg border border-orange-500/20">
                                                <AlertTriangle className="w-3 h-3" />
                                                Em risco
                                            </div>
                                        )}
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-lg text-xs flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                                            onClick={() => window.open(`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=Olá ${client.name.split(' ')[0]}, feliz aniversário! 🎉`, '_blank')}
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            Enviar mensagem
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}
