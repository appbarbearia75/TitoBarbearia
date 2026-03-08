"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Check, Clock, Calendar as CalendarIcon, MapPin, Phone } from "lucide-react"

interface OnboardingModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    barbershopId: string
    onComplete: () => void
}

const STEPS = [
    { id: 'welcome', title: 'Bem-vindo' },
    { id: 'info', title: 'Informações' },
    { id: 'service', title: 'Primeiro Serviço' },
    { id: 'hours', title: 'Horários' },
]

export function OnboardingModal({ isOpen, onOpenChange, barbershopId, onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        phone: "",
        address: "",
        serviceName: "Corte de Cabelo",
        servicePrice: "35.00",
        serviceDuration: "30 min",
    })
    const [days, setDays] = useState({
        seg: { open: false, start: "09:00", end: "19:00" },
        ter: { open: true, start: "09:00", end: "19:00" },
        qua: { open: true, start: "09:00", end: "19:00" },
        qui: { open: true, start: "09:00", end: "19:00" },
        sex: { open: true, start: "09:00", end: "19:00" },
        sab: { open: true, start: "09:00", end: "18:00" },
        dom: { open: false, start: "09:00", end: "13:00" },
    })

    const isStepValid = () => {
        if (step === 0) return true
        if (step === 1) return data.phone.trim().length > 0 && data.address.trim().length > 0
        if (step === 2) return data.serviceName.trim().length > 0 && data.servicePrice.trim().length > 0
        if (step === 3) return true // Hours are optional or have defaults
        return false
    }

    const handleNext = async () => {
        if (!isStepValid()) return

        if (step < STEPS.length - 1) {
            setStep(step + 1)
        } else {
            // Finish
            await saveAll()
        }
    }

    const saveAll = async () => {
        setLoading(true)
        try {
            // 1. Update Barbershop Info & Hours
            const { error: shopError } = await supabase
                .from('barbershops')
                .update({
                    phone: data.phone,
                    address: data.address,
                    opening_hours: days
                })
                .eq('id', barbershopId)

            if (shopError) throw shopError

            // 2. Create First Service
            const { error: serviceError } = await supabase
                .from('services')
                .insert([
                    {
                        barbershop_id: barbershopId,
                        title: data.serviceName,
                        price: parseFloat(data.servicePrice),
                        duration: data.serviceDuration,
                    }
                ])

            if (serviceError) throw serviceError

            onComplete()
            onOpenChange(false)

        } catch (error) {
            console.error("Error saving onboarding:", error)
            alert("Erro ao salvar configurações. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-900 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-center">{STEPS[step].title}</DialogTitle>
                    <div className="flex justify-center gap-2 mt-2">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-yellow-500' : 'bg-zinc-800'}`} />
                        ))}
                    </div>
                </DialogHeader>

                <div className="py-4">
                    {step === 0 && (
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold">Olá! 👋</h2>
                            <p className="text-zinc-400">
                                Seja bem-vindo ao seu novo painel de gestão.
                                Vamos configurar o básico para que você possa começar a receber agendamentos.
                            </p>
                            <p className="text-zinc-500 text-sm">Leva menos de 2 minutos.</p>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>WhatsApp da Barbearia</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        className="pl-9 bg-zinc-900 border-zinc-800"
                                        placeholder="(00) 00000-0000"
                                        value={data.phone}
                                        onChange={e => setData({ ...data, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Endereço Completo</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        className="pl-9 bg-zinc-900 border-zinc-800"
                                        placeholder="Rua Exemplo, 123 - Bairro"
                                        value={data.address}
                                        onChange={e => setData({ ...data, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-zinc-400 mb-4">Cadastre seu carro-chefe (Ex: Corte Masculino).</p>
                            <div className="space-y-2">
                                <Label>Nome do Serviço</Label>
                                <Input
                                    className="bg-zinc-900 border-zinc-800"
                                    value={data.serviceName}
                                    onChange={e => setData({ ...data, serviceName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Preço (R$)</Label>
                                    <Input
                                        className="bg-zinc-900 border-zinc-800"
                                        type="number"
                                        value={data.servicePrice}
                                        onChange={e => setData({ ...data, servicePrice: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duração</Label>
                                    <Input
                                        className="bg-zinc-900 border-zinc-800"
                                        value={data.serviceDuration}
                                        onChange={e => setData({ ...data, serviceDuration: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            <p className="text-sm text-zinc-400 mb-2">Selecione os dias que você atende.</p>
                            {Object.entries(days).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50">
                                    <input
                                        type="checkbox"
                                        checked={val.open}
                                        onChange={e => setDays({ ...days, [key]: { ...val, open: e.target.checked } })}
                                        className="w-4 h-4 accent-yellow-500"
                                    />
                                    <span className="w-10 uppercase font-bold text-xs text-zinc-500">{key}</span>
                                    {val.open ? (
                                        <div className="flex items-center gap-1 flex-1">
                                            <Input
                                                className="h-8 text-xs bg-zinc-950 border-zinc-800 text-center px-1"
                                                value={val.start}
                                                onChange={e => setDays({ ...days, [key]: { ...val, start: e.target.value } })}
                                            />
                                            <span className="text-zinc-600">-</span>
                                            <Input
                                                className="h-8 text-xs bg-zinc-950 border-zinc-800 text-center px-1"
                                                value={val.end}
                                                onChange={e => setDays({ ...days, [key]: { ...val, end: e.target.value } })}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-xs text-zinc-600 italic ml-2">Fechado</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setStep(step - 1)}
                        disabled={step === 0 || loading}
                        className="text-zinc-400 hover:text-white"
                    >
                        Voltar
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={loading || !isStepValid()}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                    >
                        {loading ? "Salvando..." : step === STEPS.length - 1 ? "Concluir Configuração" : "Continuar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
