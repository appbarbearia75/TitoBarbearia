"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Phone, X, Check, Loader2, MessageSquare, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface WaitlistEntry {
    id: string;
    customer_name: string;
    customer_phone: string;
    date: string;
    status: string;
    created_at: string;
}

export function WaitlistSidebar({ slug, onUpdate }: { slug: string, onUpdate?: () => void }) {
    const [entries, setEntries] = useState<WaitlistEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchWaitlist()
        // Inscreve para atualizações em tempo real
        const channel = supabase
            .channel('waitlist_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist' }, () => {
                fetchWaitlist()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [slug])

    const fetchWaitlist = async () => {
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            const { data } = await supabase
                .from('waitlist')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: true })

            setEntries(data || [])
        } catch (error) {
            console.error("Error fetching waitlist:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleWhatsApp = (phone: string, name: string) => {
        const cleanPhone = phone.replace(/\D/g, '')
        const message = encodeURIComponent(`Olá ${name}, temos um horário disponível na barbearia! Você ainda tem interesse?`)
        window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank')
    }

    const handleRemove = async (id: string) => {
        if (!confirm("Remover cliente da lista de espera?")) return
        const { error } = await supabase.from('waitlist').delete().eq('id', id)
        if (error) alert("Erro ao remover")
        else {
            fetchWaitlist()
            if (onUpdate) onUpdate()
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#1c1c1c] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Fila de Espera</h2>
                </div>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold">
                    {entries.length}
                </Badge>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 bg-black/10 rounded-xl border border-dashed border-white/5">
                        <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center">
                            <User className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-zinc-400">Ninguém aguardando</p>
                            <p className="text-[10px] text-zinc-600 mt-1">Sua lista de espera está vazia no momento.</p>
                        </div>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className="group p-3 rounded-xl bg-[#09090b] border border-white/5 hover:border-[#DBC278]/30 transition-all duration-300">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate truncate pr-2 capitalize">{entry.customer_name}</p>
                                    <div className="flex items-center gap-1.5 mt-1 text-zinc-500">
                                        <Phone className="w-3 h-3" />
                                        <span className="text-[10px] font-medium">{entry.customer_phone}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(entry.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-md transition-all"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Interesse</span>
                                    <span className="text-[10px] text-white font-medium">{format(new Date(entry.date + 'T00:00:00'), "dd/MM", { locale: ptBR })}</span>
                                </div>
                                <Button
                                    size="sm"
                                    className="h-7 bg-[#DBC278] hover:bg-[#c9b06b] text-black font-black text-[9px] px-3 gap-1.5 rounded-lg"
                                    onClick={() => handleWhatsApp(entry.customer_phone, entry.customer_name)}
                                >
                                    <MessageSquare className="w-3 h-3" />
                                    CHAMAR
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 bg-black/20 border-t border-white/5">
                <Button variant="ghost" className="w-full h-9 text-[10px] font-bold text-zinc-500 hover:text-white gap-2 transition-colors uppercase tracking-widest">
                    Ver Histórico Completo
                </Button>
            </div>
        </div>
    )
}
