"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MessageSquare, Phone, Plus, User, X, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
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

export function WaitlistFloatingButton({ slug, onUpdate }: { slug: string, onUpdate?: () => void }) {
    const [entries, setEntries] = useState<WaitlistEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        fetchWaitlist()
        // Inscreve para atualizações em tempo real
        const channel = supabase
            .channel('waitlist_changes_floating')
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

    const hasEntries = entries.length > 0

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <div className={`fixed bottom-8 right-8 z-[100] group flex flex-col items-center gap-2 transition-all duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    {/* Pulsing glow background */}
                    {hasEntries && (
                        <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-20 pointer-events-none" />
                    )}

                    <Button
                        size="icon"
                        className={`
                            w-12 h-12 rounded-full shadow-2xl transition-all duration-500 relative
                            ${hasEntries
                                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/40 ring-4 ring-orange-500/20'
                                : 'bg-[var(--bg-card)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)] border border-[var(--border-color)]'}
                        `}
                    >
                        <Clock className={`w-5 h-5 ${hasEntries ? 'animate-spin-slow' : ''}`} />
                        {hasEntries && (
                            <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-white text-orange-600 flex items-center justify-center text-[10px] font-black px-1.5 shadow-md">
                                {entries.length}
                            </div>
                        )}
                    </Button>
                </div>
            </SheetTrigger>
            <SheetContent className="bg-[var(--bg-page)] border-[var(--border-color)] w-full sm:max-w-md p-0 overflow-hidden flex flex-col [&>button]:opacity-100">
                <SheetHeader className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                    <SheetTitle className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${hasEntries ? 'bg-orange-500 animate-pulse' : 'bg-[var(--text-muted)]'}`} />
                        Fila de Espera
                    </SheetTitle>
                    <SheetDescription className="text-[var(--text-secondary)] font-medium">
                        {hasEntries ? `Existem ${entries.length} clientes aguardando por uma desistência.` : 'Não há clientes aguardando no momento.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 bg-[var(--bg-input)] rounded-3xl border border-dashed border-[var(--border-color)]">
                            <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] flex items-center justify-center border border-[var(--border-color)]">
                                <User className="w-8 h-8 text-[var(--text-muted)]" />
                            </div>
                            <div className="max-w-[200px]">
                                <p className="text-[var(--text-primary)] font-bold">Ninguém aguardando</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">Assim que algum cliente entrar na fila, ele aparecerá aqui para você.</p>
                            </div>
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <div key={entry.id} className="group p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-orange-500/30 hover:bg-orange-500/[0.02] transition-all duration-500 shadow-sm hover:shadow-orange-500/5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-base font-black text-[var(--text-primary)] truncate capitalize tracking-tight">{entry.customer_name}</p>
                                        <div className="flex items-center gap-2 mt-1 text-[var(--text-secondary)]">
                                            <div className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
                                                <Phone className="w-3 h-3" />
                                            </div>
                                            <span className="text-xs font-bold font-mono tracking-wider">{entry.customer_phone}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRemove(entry.id)}
                                            className="p-2 hover:bg-[var(--danger-color)]/10 text-[var(--text-muted)] hover:text-[var(--danger-color)] rounded-xl transition-all duration-300"
                                            title="Remover"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-[var(--border-color)]">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest leading-none mb-1">Interesse</span>
                                        <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-bold text-xs uppercase">
                                            <Clock className="w-3 h-3 text-orange-500" />
                                            {format(new Date(entry.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-9 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-5 gap-2 rounded-xl shadow-lg shadow-orange-500/10 transition-all active:scale-95"
                                        onClick={() => handleWhatsApp(entry.customer_phone, entry.customer_name)}
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        CHAMAR NO WHATSAPP
                                    </Button>

                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
                    <p className="text-center text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Agendaê 2026</p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
