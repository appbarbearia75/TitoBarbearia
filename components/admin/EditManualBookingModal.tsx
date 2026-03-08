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
            <DialogContent className="bg-[#09090b] border-[#DBC278]/20 text-white shadow-xl sm:max-w-[425px]">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-xl flex items-center gap-2 font-bold uppercase tracking-wider">
                        <Pencil className="w-5 h-5 text-[#DBC278]" />
                        Editar Agendamento
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Nome do Cliente</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 bg-black border-white/10 focus-visible:ring-[#DBC278] h-12"
                                placeholder="Nome completo"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Telefone</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="pl-10 bg-black border-white/10 focus-visible:ring-[#DBC278] h-12"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Data</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="pl-10 bg-black border-white/10 focus-visible:ring-[#DBC278] h-12 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Horário</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="pl-10 bg-black border-white/10 focus-visible:ring-[#DBC278] h-12 [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-4 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-zinc-400 hover:text-white hover:bg-white/10 flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[#DBC278] text-black hover:bg-[#c9b06b] flex-1 font-bold h-10"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
