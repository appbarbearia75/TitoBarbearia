
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Lock } from "lucide-react"

interface CheckoutModalProps {
    isOpen: boolean
    onClose: () => void
    plan: 'monthly' | 'quarterly' | 'yearly' | null
}

export function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        cpf: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan,
                    customer: formData
                })
            })

            const data = await res.json()

            if (data.url) {
                window.location.href = data.url
            } else {
                alert("Erro ao iniciar pagamento: " + (data.error || "Erro desconhecido"))
            }

        } catch (error) {
            console.error("Checkout error:", error)
            alert("Erro ao conectar com o servidor.")
        } finally {
            setLoading(false)
        }
    }

    const planNames = {
        monthly: "Plano Mensal",
        quarterly: "Plano Semestral",
        yearly: "Plano Anual"
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1c1c1c] border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">
                        Finalizar Assinatura
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Você escolheu o <span className="text-[#DBC278] font-bold">{plan ? planNames[plan] : ""}</span>.
                        Preencha seus dados para prosseguir para o pagamento seguro.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input
                            required
                            placeholder="Seu nome"
                            className="bg-zinc-800 border-zinc-700"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input
                            required
                            type="email"
                            placeholder="seu@email.com"
                            className="bg-zinc-800 border-zinc-700"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Celular (WhatsApp)</Label>
                            <Input
                                placeholder="(00) 00000-0000"
                                className="bg-zinc-800 border-zinc-700"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>CPF (Opcional)</Label>
                            <Input
                                placeholder="000.000.000-00"
                                className="bg-zinc-800 border-zinc-700"
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold text-base"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Ir para Pagamento Seguro
                                </>
                            )}
                        </Button>
                        <p className="text-center text-xs text-zinc-500 mt-3 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Ambiente 100% Seguro via AbacatePay
                        </p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
