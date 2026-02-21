"use client"

import { useState } from "react"
import { Client, Service } from "@/app/data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Save, Upload, Crown } from "lucide-react"

interface SuperAdminTabProps {
    client: Client
    onUpdateClient: (updates: Partial<Client>) => void
}

export function SuperAdminTab({ client, onUpdateClient }: SuperAdminTabProps) {
    const [name, setName] = useState(client.name)
    const [avatar, setAvatar] = useState(client.avatar)
    const [cover, setCover] = useState(client.cover)
    const [services, setServices] = useState<Service[]>(client.services)

    // New Service State
    const [newServiceTitle, setNewServiceTitle] = useState("")
    const [newServicePrice, setNewServicePrice] = useState("")

    const handleSaveAppearance = () => {
        onUpdateClient({ name, avatar, cover })
    }

    const handleAddService = () => {
        if (!newServiceTitle || !newServicePrice) return

        const newService: Service = {
            id: `service-${Date.now()}`,
            title: newServiceTitle,
            price: Number(newServicePrice),
            duration: "30 min",
            description: "Serviço adicionado via Painel Admin",
            icon: "scissors"
        }

        const updatedServices = [...services, newService]
        setServices(updatedServices)
        onUpdateClient({ services: updatedServices })

        setNewServiceTitle("")
        setNewServicePrice("")
    }

    const handleRemoveService = (id: string) => {
        const updatedServices = services.filter(s => s.id !== id)
        setServices(updatedServices)
        onUpdateClient({ services: updatedServices })
    }

    return (
        <div className="space-y-8 animate-fade-in p-5 pb-32">

            {/* Header */}
            <div className="bg-[#1c1c1c] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-20 bg-[#DBC278]/5 blur-3xl rounded-full"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-[#DBC278]/10 p-3 rounded-xl">
                        <Crown className="w-8 h-8 text-[#DBC278]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Super Admin Demo</h2>
                        <p className="text-zinc-400 text-sm">Personalize a barbearia em tempo real.</p>
                    </div>
                </div>
            </div>

            {/* Appearance Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#DBC278]" />
                    Aparência
                </h3>

                <div className="bg-[#1c1c1c] p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-400">Nome da Barbearia</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-[#09090b] border-zinc-800 text-white focus:border-[#DBC278]/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-400">URL do Avatar (Logo)</Label>
                        <Input
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            className="bg-[#09090b] border-zinc-800 text-white focus:border-[#DBC278]/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-400">URL da Capa (Background)</Label>
                        <Input
                            value={cover}
                            onChange={(e) => setCover(e.target.value)}
                            className="bg-[#09090b] border-zinc-800 text-white focus:border-[#DBC278]/50"
                        />
                    </div>

                    <Button
                        onClick={handleSaveAppearance}
                        className="w-full bg-[#DBC278] text-black hover:bg-[#c4ad6b] font-bold"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Atualizar Visual
                    </Button>
                </div>
            </div>

            {/* Services Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#DBC278]" />
                    Gerenciar Serviços
                </h3>

                {/* Add Service Form */}
                <div className="bg-[#1c1c1c] p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Nome do Serviço</Label>
                            <Input
                                placeholder="Ex: Corte Navalhado"
                                value={newServiceTitle}
                                onChange={(e) => setNewServiceTitle(e.target.value)}
                                className="bg-[#09090b] border-zinc-800 text-white focus:border-[#DBC278]/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Preço (R$)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={newServicePrice}
                                onChange={(e) => setNewServicePrice(e.target.value)}
                                className="bg-[#09090b] border-zinc-800 text-white focus:border-[#DBC278]/50"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleAddService}
                        className="w-full bg-zinc-800 text-white hover:bg-zinc-700 font-bold border border-white/5"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Serviço
                    </Button>
                </div>

                {/* Services List */}
                <div className="space-y-2">
                    {services.map((service) => (
                        <div key={service.id} className="bg-[#1c1c1c] p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                            <div>
                                <h4 className="font-bold text-white">{service.title}</h4>
                                <p className="text-[#DBC278] text-sm font-bold">
                                    R$ {service.price.toFixed(2).replace('.', ',')}
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveService(service.id)}
                                className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
