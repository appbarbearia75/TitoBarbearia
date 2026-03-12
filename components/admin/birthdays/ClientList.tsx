"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, User, Calendar, Phone, Smartphone, AlertCircle } from "lucide-react"
import { Client } from "@/components/admin/birthdays/ClientCard"

interface ClientListProps {
    clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
    return (
        <Card className="bg-transparent border-none shadow-none mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">Próximos Aniversariantes</h2>
            </div>
            <div className="overflow-x-auto bg-bg-card rounded-xl border border-border-color ring-1 ring-border-color">
                <table className="w-full text-sm text-left">
                    <thead className="bg-bg-sidebar text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-color">
                        <tr>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Status & Visita</th>
                            <th className="hidden md:table-cell px-6 py-4 text-center">Métricas</th>
                            <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {clients.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-text-secondary">Nenhum cliente combina com a busca.</td></tr>
                        ) : (
                            clients.map((client) => {
                                const isVip = client.tags.includes('vip')
                                
                                return (
                                <tr key={client.id} className="hover:bg-table-row-hover transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-full bg-hover-bg flex items-center justify-center text-xs font-bold text-text-secondary border border-border-color overflow-hidden">
                                                <img src={client.avatar} alt={client.name} className="w-full h-full object-cover opacity-80" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="font-bold text-text-primary text-base flex items-center gap-2">
                                                    {client.name}
                                                    {isVip && <Badge className="bg-accent-color/10 text-accent-color border-accent-color/20 hover:bg-accent-color/20">VIP</Badge>}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                                                    <Phone className="w-3 h-3"/>{client.phone}
                                                </div>
                                                {client.suggestion && (
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-text-secondary font-medium">
                                                        <AlertCircle className="w-3 h-3 text-orange-400" /> {client.suggestion.text}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start text-text-secondary">
                                            <span className="font-bold text-text-primary text-sm">Idade: {client.age} anos</span>
                                            <span className="text-xs">Últ. vez: {client.lastVisit}</span>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-emerald-500 font-bold">{client.ltv} <span className="text-[10px] text-text-secondary font-normal">LTV</span></span>
                                            <span className="text-xs text-text-secondary mt-1 uppercase tracking-wider">{client.frequency}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium" onClick={() => window.open(`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=Olá ${client.name.split(' ')[0]}, feliz aniversário! 🎉`, '_blank')}>
                                            <Smartphone className="w-4 h-4 mr-2" />
                                            WhatsApp
                                        </Button>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
