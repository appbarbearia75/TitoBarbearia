import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, Clock, User, Phone, Pencil, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function EditBookingModal({ isOpen, onOpenChange, booking, onSuccess }: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    booking: any,
    onSuccess: () => void
}) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && booking) {
            setName(booking.customer_name || '')
            setPhone(booking.customer_phone || '')
            setDate(booking.date || '')
            setTime(booking.time?.slice(0, 5) || '')
        }
    }, [isOpen, booking])

    const handleSave = async () => {
        if (!name || !date || !time) {
            alert('Preencha pelo menos Nome, Data e Horário.')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('bookings')
                .update({
                    customer_name: name,
                    customer_phone: phone,
                    date: date,
                    time: time
                })
                .eq('id', booking.id)

            if (error) throw error

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            alert('Erro ao atualizar agendamento.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-2xl sm:max-w-[425px]">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-xl flex items-center gap-2 font-bold uppercase tracking-wider">
                        <Pencil className="w-5 h-5 text-[var(--accent-primary)]" />
                        Editar Agendamento
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Nome do Cliente</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] h-12"
                                placeholder="Nome completo"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Telefone</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="pl-10 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] h-12"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Data</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="pl-10 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] h-12 text-[var(--text-primary)]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Horário</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="pl-10 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] h-12 text-[var(--text-primary)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-4 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/80 flex-1 font-bold h-10 shadow-sm"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
