"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ServicesPage() {
    const params = useParams()
    const slug = params.slug as string
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newService, setNewService] = useState({
        title: "",
        price: "",
        duration: "30 min",
        description: "",
    })

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
                .order('created_at', { ascending: true })

            if (data) setServices(data)
        }
        setLoading(false)
    }

    const handleCreate = async () => {
        if (!newService.title || !newService.price) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase.from('services').insert([
                {
                    barbershop_id: user.id, // Assuming owner ID is barbershop ID (true for 1:1)
                    title: newService.title,
                    price: parseFloat(newService.price),
                    duration: newService.duration,
                    description: newService.description,
                    icon: "scissors" // Default
                }
            ])

            if (error) throw error

            setNewService({ title: "", price: "", duration: "30 min", description: "" })
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
                    <p className="text-zinc-400">Gerencie os serviços oferecidos pela sua barbearia.</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)} className="bg-yellow-500 hover:bg-yellow-400 text-black">
                    {isCreating ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isCreating ? "Cancelar" : "Novo Serviço"}
                </Button>
            </div>

            {isCreating && (
                <Card className="bg-zinc-900 border-zinc-800 text-white animate-in slide-in-from-top-4 fade-in">
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
                                placeholder="Preço (ex: 45.00)"
                                type="number"
                                value={newService.price}
                                onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                            <Input
                                placeholder="Duração (ex: 45 min)"
                                value={newService.duration}
                                onChange={(e) => setNewService(prev => ({ ...prev, duration: e.target.value }))}
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

            <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400">Serviço</TableHead>
                                <TableHead className="text-zinc-400">Preço</TableHead>
                                <TableHead className="text-zinc-400">Duração</TableHead>
                                <TableHead className="text-right text-zinc-400">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell>
                                </TableRow>
                            ) : services.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500">Nenhum serviço cadastrado.</TableCell>
                                </TableRow>
                            ) : (
                                services.map((service) => (
                                    <TableRow key={service.id} className="border-zinc-800 hover:bg-zinc-800/50">
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
                                                className="text-red-400 hover:text-red-300"
                                                onClick={() => handleDelete(service.id)}
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
