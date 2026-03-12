"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, X, Crown, Sparkles, GripVertical } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { VipPlan } from "@/app/data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Row Component
function SortableRow({
    id,
    plan,
    onDelete,
    onEdit,
    onSelect
}: {
    id: string,
    plan: VipPlan,
    onDelete: (id: string) => void,
    onEdit: (plan: VipPlan) => void,
    onSelect?: (plan: VipPlan) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: isDragging ? 'relative' as 'relative' : undefined,
        backgroundColor: isDragging ? '#27272a' : undefined // zinc-800
    }

    const formatCurrencyInternal = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className="border-zinc-800 hover:bg-zinc-800/50 group cursor-pointer md:cursor-default"
            onClick={() => {
                if (window.innerWidth < 768 && onSelect) {
                    onSelect(plan)
                }
            }}
        >
            <TableCell className="w-[40px] px-2 sm:px-4">
                <div {...attributes} {...listeners} className="cursor-grab hover:text-white text-zinc-600 flex items-center justify-center">
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            </TableCell>
            <TableCell className="px-2 sm:px-4 max-w-[140px] sm:max-w-none">
                <div className="font-bold text-sm sm:text-base leading-tight truncate flex items-center gap-2">
                    {plan.title}
                    {plan.highlight_text && <span className="hidden sm:inline-block text-[10px] bg-[#DBC278]/20 text-[#DBC278] px-1.5 py-0.5 rounded uppercase">{plan.highlight_text}</span>}
                </div>
                <div className="hidden sm:block text-xs text-zinc-500 truncate mt-0.5">{plan.description}</div>
                <div className="md:hidden mt-2 text-[9px] text-[#DBC278]/80 font-bold uppercase tracking-wider flex items-center">
                    Clique para expandir
                </div>
            </TableCell>
            <TableCell className="px-2 sm:px-4 w-[80px] sm:w-auto">
                <div className="text-xs sm:text-sm font-bold whitespace-nowrap">R$ {Number(plan.price).toFixed(2)}</div>
                {plan.price_from && (
                    <div className="text-[10px] text-zinc-500 line-through sm:hidden whitespace-nowrap mt-0.5">R$ {Number(plan.price_from).toFixed(2)}</div>
                )}
            </TableCell>
            <TableCell className="hidden sm:table-cell px-2 sm:px-4 whitespace-nowrap text-sm text-zinc-500">
                {plan.price_from ? `R$ ${Number(plan.price_from).toFixed(2)}` : "-"}
            </TableCell>
            <TableCell className="text-right px-1 sm:px-4 w-[70px] sm:w-auto">
                <div className="flex justify-end pr-1 gap-0 sm:gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-zinc-400 hover:text-white hover:bg-white/10 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
                    >
                        Editar
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
                    >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function VipConfigPage() {
    const params = useParams()
    const slug = params.slug as string
    const [plans, setPlans] = useState<VipPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null)
    const [newPlan, setNewPlan] = useState({
        title: "",
        highlight_text: "",
        price: "",
        price_from: "",
        description: "",
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

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
                .order('position', { ascending: true })
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            setPlans((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over?.id)
                return arrayMove(items, oldIndex, newIndex)
            })
            setHasUnsavedOrder(true)
        }
    }

    const saveOrder = async () => {
        setLoading(true)
        const updates = plans.map((plan, index) => ({
            id: plan.id,
            position: index
        }))

        await Promise.all(updates.map(u =>
            supabase.from('vip_plans').update({ position: u.position }).eq('id', u.id)
        ))

        setHasUnsavedOrder(false)
        setLoading(false)
    }

    const handleCreateOrUpdate = async () => {
        if (!newPlan.title || !newPlan.price) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const priceNumeric = Number(newPlan.price.replace(/\D/g, "")) / 100
            const priceFromNumeric = newPlan.price_from ? Number(newPlan.price_from.replace(/\D/g, "")) / 100 : null

            if (editingId) {
                // Atualizar plano existente
                const { error } = await supabase.from('vip_plans').update({
                    title: newPlan.title,
                    highlight_text: newPlan.highlight_text || null,
                    price: priceNumeric,
                    price_from: priceFromNumeric,
                    description: newPlan.description,
                }).eq('id', editingId)

                if (error) throw error
            } else {
                // Criar novo plano
                const maxPosition = plans.length > 0 ? Math.max(...plans.map(p => p.position || 0)) : 0

                const { error } = await supabase.from('vip_plans').insert([
                    {
                        barbershop_id: user.id,
                        title: newPlan.title,
                        highlight_text: newPlan.highlight_text || null,
                        price: priceNumeric,
                        price_from: priceFromNumeric,
                        description: newPlan.description,
                        position: maxPosition + 1
                    }
                ])

                if (error) throw error
            }

            setNewPlan({ title: "", highlight_text: "", price: "", price_from: "", description: "" })
            setIsCreating(false)
            setEditingId(null)
            fetchPlans()

        } catch (error) {
            console.error("Error creating/updating VIP plan:", error)
            alert("Erro ao salvar plano VIP.")
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
                <div className="flex gap-2">
                    {hasUnsavedOrder && (
                        <Button onClick={saveOrder} className="bg-green-600 hover:bg-green-500 text-white font-bold animate-in fade-in zoom-in">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Ordem
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            setEditingId(null)
                            setNewPlan({ title: "", highlight_text: "", price: "", price_from: "", description: "" })
                            setIsCreating(true)
                        }}
                        className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Plano
                    </Button>
                </div>
            </div>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="bg-[#09090b] border-[#DBC278]/20 text-white shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[600px] overflow-hidden">
                    {/* Background glow effect for VIP look */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-[#DBC278]/10 blur-[50px] pointer-events-none" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            {editingId ? (
                                <>Editar Plano <span className="text-[#DBC278]">VIP</span></>
                            ) : (
                                <>Novo Plano <span className="text-[#DBC278]">VIP</span></>
                            )}
                            <Sparkles className="w-4 h-4 text-[#DBC278]" />
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Configure os detalhes do plano de assinatura.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative z-10 grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Nome do Plano</Label>
                                <Input
                                    placeholder="ex: VIP Black"
                                    value={newPlan.title}
                                    onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                                    className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Texto Destaque (Cards)</Label>
                                <Input
                                    placeholder="ex: Cortes Ilimitados"
                                    value={newPlan.highlight_text}
                                    onChange={(e) => setNewPlan(prev => ({ ...prev, highlight_text: e.target.value }))}
                                    className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Preço Mensal</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
                                    <Input
                                        placeholder="0,00"
                                        value={newPlan.price.replace(/^R\$\s*/i, "").trim()}
                                        onChange={(e) => {
                                            const formatted = formatCurrency(e.target.value)
                                            setNewPlan(prev => ({ ...prev, price: formatted }))
                                        }}
                                        className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50 pl-9 font-bold text-[#DBC278]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Preço Original (Riscado)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
                                    <Input
                                        placeholder="Opcional"
                                        value={newPlan.price_from.replace(/^R\$\s*/i, "").trim()}
                                        onChange={(e) => {
                                            const formatted = formatCurrency(e.target.value)
                                            setNewPlan(prev => ({ ...prev, price_from: formatted }))
                                        }}
                                        className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50 pl-9 text-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Descrição / Benefícios Curtos</Label>
                            <Input
                                placeholder="ex: Tenha acesso livre à barbearia..."
                                value={newPlan.description}
                                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                            />
                        </div>
                    </div>

                    <DialogFooter className="relative z-10 border-t border-white/5 pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreating(false)}
                            className="text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateOrUpdate}
                            className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold shadow-[0_0_15px_rgba(219,194,120,0.3)] transition-all"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {editingId ? "Salvar Alterações" : "Criar Plano"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                <CardContent className="p-0">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                    <TableHead className="w-[40px] px-2 sm:px-4"></TableHead>
                                    <TableHead className="text-zinc-400 px-2 sm:px-4 text-xs sm:text-sm">Plano</TableHead>
                                    <TableHead className="text-zinc-400 px-2 sm:px-4 text-xs sm:text-sm">Preço</TableHead>
                                    <TableHead className="text-zinc-400 px-2 sm:px-4 hidden sm:table-cell text-sm">De (Original)</TableHead>
                                    <TableHead className="text-right text-zinc-400 px-2 sm:px-4 text-xs sm:text-sm pr-4">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <SortableContext
                                    items={plans.map(p => p.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                                        </TableRow>
                                    ) : plans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-zinc-500">Nenhum plano VIP cadastrado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        plans.map((plan) => (
                                            <SortableRow
                                                key={plan.id}
                                                id={plan.id}
                                                plan={plan}
                                                onDelete={handleDelete}
                                                onSelect={setSelectedPlan}
                                                onEdit={(p) => {
                                                    setEditingId(p.id)
                                                    setNewPlan({
                                                        title: p.title,
                                                        highlight_text: p.highlight_text || "",
                                                        price: formatCurrency(Number(p.price).toFixed(2).replace(/\D/g, "")),
                                                        price_from: p.price_from ? formatCurrency(Number(p.price_from).toFixed(2).replace(/\D/g, "")) : "",
                                                        description: p.description || ""
                                                    })
                                                    setIsCreating(true)
                                                }}
                                            />
                                        ))
                                    )}
                                </SortableContext>
                            </TableBody>
                        </Table>
                    </DndContext>
                </CardContent>
            </Card>

            {/* Mobile Plan Details Modal */}
            <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
                {selectedPlan && (
                    <DialogContent className="bg-[#09090b] border-[#DBC278]/20 text-white shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-[#DBC278]" />
                                    {selectedPlan.title}
                                </div>
                                {selectedPlan.highlight_text && (
                                    <span className="text-[10px] bg-[#DBC278]/20 text-[#DBC278] w-fit px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                        {selectedPlan.highlight_text}
                                    </span>
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-white/5 space-y-2 relative overflow-hidden">
                                <Sparkles className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-[#DBC278]/5 pointer-events-none" />
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="block text-xs uppercase font-bold text-zinc-500 mb-1">Valor do Plano</span>
                                        <span className="text-3xl font-black text-[#DBC278]">R$ {Number(selectedPlan.price).toFixed(2)}</span>
                                    </div>
                                    {selectedPlan.price_from && (
                                        <div className="text-right">
                                            <span className="block text-[10px] uppercase text-zinc-500">Valor Original</span>
                                            <span className="text-sm font-bold text-zinc-500 line-through decoration-red-500/50">R$ {Number(selectedPlan.price_from).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedPlan.description && (
                                <div>
                                    <span className="block text-xs uppercase font-bold text-zinc-500 mb-1">Descrição / Benefícios</span>
                                    <p className="text-sm text-zinc-300 leading-relaxed">{selectedPlan.description}</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditingId(selectedPlan.id)
                                        setNewPlan({
                                            title: selectedPlan.title,
                                            highlight_text: selectedPlan.highlight_text || "",
                                            price: formatCurrency(Number(selectedPlan.price).toFixed(2).replace(/\D/g, "")),
                                            price_from: selectedPlan.price_from ? formatCurrency(Number(selectedPlan.price_from).toFixed(2).replace(/\D/g, "")) : "",
                                            description: selectedPlan.description || ""
                                        })
                                        setSelectedPlan(null)
                                        setIsCreating(true)
                                    }}
                                    className="w-full h-12 border-white/10 text-white hover:bg-white/5"
                                >
                                    Editar Detalhes
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        handleDelete(selectedPlan.id)
                                        setSelectedPlan(null)
                                    }}
                                    className="w-full h-12 border-white/10 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                    Excluir Plano
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    )
}
