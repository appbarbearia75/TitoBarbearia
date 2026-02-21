"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, X, Crown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { VipPlan } from "@/app/data"

export default function VipConfigPage() {
    const params = useParams()
    const slug = params.slug as string
    const [plans, setPlans] = useState<VipPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newPlan, setNewPlan] = useState({
        title: "",
        price: "",
        price_from: "",
        description: "",
    })

    useEffect(() => {
        fetchPlans()
    }, [slug])

    const fetchPlans = async () => {
        setLoading(true)
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()

        if (barbershop) {
            const { data } = await supabase
                .from('vip_plans')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .order('created_at', { ascending: true })

            if (data) setPlans(data)
        }
        setLoading(false)
    }

    const formatCurrency = (value: string) => {
        const numericValue = value.replace(/\D/g, "")
        const amount = Number(numericValue) / 100
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(amount)
    }

    const handleCreate = async () => {
        if (!newPlan.title || !newPlan.price) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const priceNumeric = Number(newPlan.price.replace(/\D/g, "")) / 100
            const priceFromNumeric = newPlan.price_from ? Number(newPlan.price_from.replace(/\D/g, "")) / 100 : null

            const { error } = await supabase.from('vip_plans').insert([
                {
                    barbershop_id: user.id,
                    title: newPlan.title,
                    price: priceNumeric,
                    price_from: priceFromNumeric,
                    description: newPlan.description,
                }
            ])

            if (error) throw error

            setNewPlan({ title: "", price: "", price_from: "", description: "" })
            setIsCreating(false)
            fetchPlans()

        } catch (error) {
            console.error("Error creating VIP plan:", error)
            alert("Erro ao criar plano VIP.")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este plano VIP?")) return

        const { error } = await supabase.from('vip_plans').delete().eq('id', id)
        if (!error) fetchPlans()
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Crown className="w-8 h-8 text-[#DBC278]" />
                        Planos VIP
                    </h1>
                    <p className="text-zinc-400">Gerencie os planos de assinatura para seus clientes.</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)} className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold">
                    {isCreating ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isCreating ? "Cancelar" : "Novo Plano"}
                </Button>
            </div>

            {isCreating && (
                <Card className="bg-[#1c1c1c] border-white/5 text-white animate-in slide-in-from-top-4 fade-in">
                    <CardHeader>
                        <CardTitle>Adicionar Plano VIP</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                placeholder="Nome do Plano (ex: VIP Black)"
                                value={newPlan.title}
                                onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                            <Input
                                placeholder="Preço Mensal (R$ 0,00)"
                                value={newPlan.price}
                                onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value)
                                    setNewPlan(prev => ({ ...prev, price: formatted }))
                                }}
                                className="bg-zinc-800 border-zinc-700"
                            />
                            <Input
                                placeholder="Preço Original (opcional, ex: R$ 150,00)"
                                value={newPlan.price_from}
                                onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value)
                                    setNewPlan(prev => ({ ...prev, price_from: formatted }))
                                }}
                                className="bg-zinc-800 border-zinc-700"
                            />
                            <Input
                                placeholder="Descrição / Benefícios (ex: Cortes ilimitados)"
                                value={newPlan.description}
                                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-500 text-white">
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Plano
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400">Plano</TableHead>
                                <TableHead className="text-zinc-400">Preço</TableHead>
                                <TableHead className="text-zinc-400">De (Original)</TableHead>
                                <TableHead className="text-right text-zinc-400">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell>
                                </TableRow>
                            ) : plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500">Nenhum plano VIP cadastrado.</TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan) => (
                                    <TableRow key={plan.id} className="border-zinc-800 hover:bg-zinc-800/50 group">
                                        <TableCell>
                                            <div className="font-medium">{plan.title}</div>
                                            <div className="text-xs text-zinc-500">{plan.description}</div>
                                        </TableCell>
                                        <TableCell>R$ {Number(plan.price).toFixed(2)}</TableCell>
                                        <TableCell>
                                            {plan.price_from ? `R$ ${Number(plan.price_from).toFixed(2)}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-300 opacity-50 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(plan.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
