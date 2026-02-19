"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, X, GripVertical } from "lucide-react"
import { supabase } from "@/lib/supabase"
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
function SortableRow({ id, service, onDelete }: { id: string, service: any, onDelete: (id: string) => void }) {
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
            <TableCell width={50}>
                <div {...attributes} {...listeners} className="cursor-grab hover:text-white text-zinc-600">
                    <GripVertical className="w-5 h-5" />
                </div>
            </TableCell>
            <TableCell>
                <div className="font-medium">{service.title}</div>
                <div className="text-xs text-zinc-500">{service.description}</div>
            </TableCell>
            <TableCell>R$ {service.price.toFixed(2)}</TableCell>
            <TableCell>{service.duration}</TableCell>
            <TableCell className="text-right">
                <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 opacity-50 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDelete(service.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}

export default function ServicesPage() {
    const params = useParams()
    const slug = params.slug as string
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
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

        // Upsert all updates
        // Supabase upsert needs all required fields, so it's better to update one by one or create an RPC.
        // For localized small list, individual updates are fine.
        await Promise.all(updates.map(u =>
            supabase.from('services').update({ position: u.position }).eq('id', u.id)
        ))

        setHasUnsavedOrder(false)
        setLoading(false)
        // alert("Ordem atualizada com sucesso!")
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
                    <Button onClick={() => setIsCreating(!isCreating)} className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold">
                        {isCreating ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {isCreating ? "Cancelar" : "Novo Serviço"}
                    </Button>
                </div>
            </div>

            {isCreating && (
                <Card className="bg-[#1c1c1c] border-white/5 text-white animate-in slide-in-from-top-4 fade-in">
                    <CardHeader>
                        <CardTitle>Adicionar Serviço</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                placeholder="Nome do Serviço (ex: Corte Degradê)"
                                value={newService.title}
                                onChange={(e) => setNewService(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                            <Input
                                placeholder="Preço (R$ 0,00)"
                                value={newService.price}
                                onChange={(e) => {
                                    const formatted = formatCurrency(e.target.value)
                                    setNewService(prev => ({ ...prev, price: formatted }))
                                }}
                                className="bg-zinc-800 border-zinc-700"
                            />
                            <Input
                                placeholder="Duração (HH:mm)"
                                value={newService.duration}
                                maxLength={5}
                                onChange={(e) => {
                                    const formatted = formatDurationMask(e.target.value)
                                    setNewService(prev => ({ ...prev, duration: formatted }))
                                }}
                                className="bg-zinc-800 border-zinc-700"
                            />
                            <Input
                                placeholder="Descrição (opcional)"
                                value={newService.description}
                                onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-500 text-white">
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Serviço
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead className="text-zinc-400">Serviço</TableHead>
                                    <TableHead className="text-zinc-400">Preço</TableHead>
                                    <TableHead className="text-zinc-400">Duração</TableHead>
                                    <TableHead className="text-right text-zinc-400">Ações</TableHead>
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
                                            />
                                        ))
                                    )}
                                </SortableContext>
                            </TableBody>
                        </Table>
                    </DndContext>
                </CardContent>
            </Card>
        </div>
    )
}
