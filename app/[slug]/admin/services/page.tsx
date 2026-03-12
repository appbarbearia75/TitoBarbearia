"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, X, GripVertical, Pencil, Loader2, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
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
    service,
    onDelete,
    onEdit
}: {
    id: string,
    service: any,
    onDelete: (id: string) => void,
    onEdit: (service: any) => void
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

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className="border-zinc-800 hover:bg-zinc-800/50 group"
        >
            <TableCell className="w-[40px] px-2 sm:px-4">
                <div {...attributes} {...listeners} className="cursor-grab hover:text-white text-zinc-600 flex items-center justify-center">
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            </TableCell>
            <TableCell className="px-2 sm:px-4 max-w-[140px] sm:max-w-none">
                <div className="font-bold text-sm sm:text-base leading-tight truncate">{service.title}</div>
                {service.description && (
                    <div className="text-[10px] sm:text-xs text-zinc-500 truncate mt-0.5">{service.description}</div>
                )}
            </TableCell>
            <TableCell className="px-2 sm:px-4 w-[80px] sm:w-auto">
                <div className="text-xs sm:text-sm font-bold whitespace-nowrap">R$ {Number(service.price).toFixed(2)}</div>
                <div className="text-[10px] text-zinc-500 sm:hidden whitespace-nowrap mt-0.5">{service.duration}</div>
            </TableCell>
            <TableCell className="hidden sm:table-cell px-2 sm:px-4 whitespace-nowrap text-sm">
                {service.duration}
            </TableCell>
            <TableCell className="text-right px-1 sm:px-4 w-[70px] sm:w-auto">
                <div className="flex justify-end pr-1 gap-0 sm:gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-zinc-400 hover:text-white opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => onEdit(service)}
                    >
                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDelete(service.id)}
                    >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

function EditServiceModal({
    isOpen,
    onOpenChange,
    service,
    onSave
}: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    service: any,
    onSave: (updatedService: any) => Promise<void>
}) {
    const [title, setTitle] = useState("")
    const [price, setPrice] = useState("")
    const [duration, setDuration] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (service) {
            setTitle(service.title || "")
            const priceVal = (Number(service.price) * 100).toString()
            setPrice(formatCurrencyInternal(priceVal))
            setDuration(parseDurationToMask(service.duration))
            setDescription(service.description || "")
        }
    }, [service])

    const formatCurrencyInternal = (value: string) => {
        const numericValue = value.replace(/\D/g, "")
        const amount = Number(numericValue) / 100
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(amount)
    }

    const parseDurationToMask = (durationStr: string) => {
        if (!durationStr) return "00:30"
        const hoursMatch = durationStr.match(/(\d+)h/)
        const minsMatch = durationStr.match(/(\d+)min/)
        const h = hoursMatch ? hoursMatch[1].padStart(2, '0') : "00"
        const m = minsMatch ? minsMatch[1].padStart(2, '0') : "30"
        return `${h}:${m}`
    }

    const formatDurationMaskInternal = (value: string) => {
        let numbers = value.replace(/\D/g, "")
        if (numbers.length > 4) numbers = numbers.slice(0, 4)
        if (numbers.length >= 3) {
            return `${numbers.slice(0, 2)}:${numbers.slice(2)}`
        }
        return numbers
    }

    const handleSave = async () => {
        setLoading(true)
        const priceNumeric = Number(price.replace(/\D/g, "")) / 100
        const parts = duration.split(':')
        let formattedDuration = "30 min"
        if (parts.length >= 2) {
            const hours = parseInt(parts[0]) || 0
            const minutes = parseInt(parts[1]) || 0
            let result = ""
            if (hours > 0) result += `${hours}h`
            if (minutes > 0) result += ` ${minutes}min`
            formattedDuration = result.trim() || "30 min"
        }

        await onSave({
            ...service,
            title,
            price: priceNumeric,
            duration: formattedDuration,
            description
        })
        setLoading(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#09090b] border-[#DBC278]/20 text-white shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[600px] overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-[#DBC278]/10 blur-[50px] pointer-events-none" />

                <DialogHeader className="relative z-10">
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        Editar Serviço
                    </DialogTitle>
                </DialogHeader>

                <div className="relative z-10 grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Nome do Serviço</Label>
                        <Input
                            placeholder="ex: Corte Degradê"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Preço</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
                                <Input
                                    placeholder="0,00"
                                    value={price.replace("R$ ", "")}
                                    onChange={(e) => setPrice(formatCurrencyInternal(e.target.value))}
                                    className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50 pl-9 font-bold text-[#DBC278]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Duração (HH:mm)</Label>
                            <Input
                                placeholder="00:30"
                                value={duration}
                                onChange={(e) => setDuration(formatDurationMaskInternal(e.target.value))}
                                className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Descrição (opcional)</Label>
                        <Input
                            placeholder="ex: Acabamento detalhado..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                        />
                    </div>
                </div>

                <DialogFooter className="relative z-10 border-t border-white/5 pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white hover:bg-white/5">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold shadow-[0_0_15px_rgba(219,194,120,0.3)] transition-all">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ServicesPage() {
    const params = useParams()
    const slug = params.slug as string
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [editingService, setEditingService] = useState<any>(null)
    const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false)
    const [newService, setNewService] = useState({
        title: "",
        price: "",
        duration: "00:30",
        description: "",
    })

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
        fetchServices()
    }, [slug])

    const fetchServices = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()

        if (barbershop) {
            const { data } = await supabase
                .from('services')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .order('position', { ascending: true })
                .order('created_at', { ascending: true })

            if (data) setServices(data)
        }
        setLoading(false)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            setServices((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over?.id)
                return arrayMove(items, oldIndex, newIndex)
            })
            setHasUnsavedOrder(true)
        }
    }

    const saveOrder = async () => {
        setLoading(true)
        const updates = services.map((service, index) => ({
            id: service.id,
            position: index
        }))

        await Promise.all(updates.map(u =>
            supabase.from('services').update({ position: u.position }).eq('id', u.id)
        ))

        setHasUnsavedOrder(false)
        setLoading(false)
    }

    const handleEditSave = async (updatedService: any) => {
        const { error } = await supabase
            .from('services')
            .update({
                title: updatedService.title,
                price: updatedService.price,
                duration: updatedService.duration,
                description: updatedService.description
            })
            .eq('id', updatedService.id)

        if (error) {
            console.error("Error updating service:", error)
            alert("Erro ao atualizar serviço.")
        } else {
            fetchServices()
        }
    }

    const formatCurrency = (value: string) => {
        const numericValue = value.replace(/\D/g, "")
        const amount = Number(numericValue) / 100
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(amount)
    }

    const formatDurationMask = (value: string) => {
        // Remove non-numeric
        let numbers = value.replace(/\D/g, "")

        // Limit to 4 chars
        if (numbers.length > 4) numbers = numbers.slice(0, 4)

        // Format HH:mm
        if (numbers.length >= 3) {
            return `${numbers.slice(0, 2)}:${numbers.slice(2)}`
        }
        return numbers
    }

    const formatDurationForSave = (timeStr: string) => {
        // timeStr is likely HH:mm or H:mm or just numbers
        // We expect HH:mm from the mask
        const parts = timeStr.split(':')
        if (parts.length < 2) return "30 min" // Fallback

        const hours = parseInt(parts[0]) || 0
        const minutes = parseInt(parts[1]) || 0

        if (hours === 0 && minutes === 0) return "30 min" // Default min

        let result = ""
        if (hours > 0) result += `${hours}h`
        if (minutes > 0) result += ` ${minutes}min`

        return result.trim()
    }

    const handleCreate = async () => {
        if (!newService.title || !newService.price) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Parse currency string to number
            const priceNumeric = Number(newService.price.replace(/\D/g, "")) / 100

            // Format duration
            const formattedDuration = formatDurationForSave(newService.duration)

            // Get max position to append to end
            const maxPosition = services.length > 0 ? Math.max(...services.map(s => s.position || 0)) : 0

            const { error } = await supabase.from('services').insert([
                {
                    barbershop_id: user.id, // Assuming owner ID is barbershop ID (true for 1:1)
                    title: newService.title,
                    price: priceNumeric,
                    duration: formattedDuration,
                    description: newService.description,
                    icon: "scissors", // Default
                    position: maxPosition + 1
                }
            ])

            if (error) throw error

            setNewService({ title: "", price: "", duration: "00:30", description: "" })
            setIsCreating(false)
            fetchServices()

        } catch (error) {
            console.error("Error creating service:", error)
            alert("Erro ao criar serviço.")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este serviço?")) return

        const { error } = await supabase.from('services').delete().eq('id', id)
        if (!error) fetchServices()
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Serviços</h1>
                    <p className="text-zinc-400">Arraste para reordenar os serviços.</p>
                </div>
                <div className="flex gap-2">
                    {hasUnsavedOrder && (
                        <Button onClick={saveOrder} className="bg-green-600 hover:bg-green-500 text-white font-bold animate-in fade-in zoom-in">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Ordem
                        </Button>
                    )}
                    <Button onClick={() => setIsCreating(true)} className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Serviço
                    </Button>
                </div>
            </div>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="bg-[#09090b] border-[#DBC278]/20 text-white shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[600px] overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-[#DBC278]/10 blur-[50px] pointer-events-none" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            Novo Serviço
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative z-10 grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Nome do Serviço</Label>
                            <Input
                                placeholder="ex: Corte Degradê"
                                value={newService.title}
                                onChange={(e) => setNewService(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Preço</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
                                    <Input
                                        placeholder="0,00"
                                        value={newService.price.replace("R$ ", "")}
                                        onChange={(e) => {
                                            const formatted = formatCurrency(e.target.value)
                                            setNewService(prev => ({ ...prev, price: formatted }))
                                        }}
                                        className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50 pl-9 font-bold text-[#DBC278]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Duração (HH:mm)</Label>
                                <Input
                                    placeholder="00:30"
                                    value={newService.duration}
                                    maxLength={5}
                                    onChange={(e) => {
                                        const formatted = formatDurationMask(e.target.value)
                                        setNewService(prev => ({ ...prev, duration: formatted }))
                                    }}
                                    className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Descrição (opcional)</Label>
                            <Input
                                placeholder="ex: Acabamento detalhado..."
                                value={newService.description}
                                onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
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
                            onClick={handleCreate}
                            className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold shadow-[0_0_15px_rgba(219,194,120,0.3)] transition-all"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Criar Serviço
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
                                    <TableHead className="text-zinc-400 px-2 sm:px-4 text-xs sm:text-sm">Serviço</TableHead>
                                    <TableHead className="text-zinc-400 px-2 sm:px-4 text-xs sm:text-sm">Preço</TableHead>
                                    <TableHead className="text-zinc-400 px-2 sm:px-4 hidden sm:table-cell text-sm">Duração</TableHead>
                                    <TableHead className="text-right text-zinc-400 px-2 sm:px-4 text-xs sm:text-sm pr-4">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <SortableContext
                                    items={services.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                                        </TableRow>
                                    ) : services.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-zinc-500">Nenhum serviço cadastrado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        services.map((service) => (
                                            <SortableRow
                                                key={service.id}
                                                id={service.id}
                                                service={service}
                                                onDelete={handleDelete}
                                                onEdit={setEditingService}
                                            />
                                        ))
                                    )}
                                </SortableContext>
                            </TableBody>
                        </Table>
                    </DndContext>
                </CardContent>
            </Card>

            <EditServiceModal
                isOpen={!!editingService}
                onOpenChange={(open) => !open && setEditingService(null)}
                service={editingService}
                onSave={handleEditSave}
            />
        </div>
    )
}
