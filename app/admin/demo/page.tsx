"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, UserCircle2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2, Plus, Save, Loader2, Image as ImageIcon, Scissors, Upload } from "lucide-react"
import { Service, Barber } from "@/app/data"

export default function AdminDemoPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [settings, setSettings] = useState({
        id: "",
        name: "",
        avatar: "",
        cover: "",
        services: [] as Service[],
        barbers: [] as Barber[]
    })

    // New Service State (kept as is)
    const [newService, setNewService] = useState({ title: "", price: "", description: "" })
    const [newBarber, setNewBarber] = useState({ name: "", photo: "" })

    // ... useEffect and fetchSettings ...

    const handleFileUpload = async (file: File, type: 'avatar' | 'cover') => {
        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${type}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath)

            setSettings(prev => ({
                ...prev,
                [type]: publicUrl
            }))

            alert(`Upload de ${type} realizado com sucesso!`)

        } catch (error) {
            console.error("Error uploading file:", error)
            alert("Erro ao fazer upload da imagem.")
        } finally {
            setUploading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('demo_settings')
                .select('*')
                .single()

            if (data) {
                setSettings({
                    id: data.id,
                    name: data.name || "",
                    avatar: data.avatar || "",
                    cover: data.cover || "",
                    services: data.services || [],
                    barbers: data.barbers || []
                })
            }
        } catch (error) {
            console.error("Error fetching settings:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('demo_settings')
                .update({
                    name: settings.name,
                    avatar: settings.avatar,
                    cover: settings.cover,
                    services: settings.services,
                    barbers: settings.barbers
                })
                .eq('id', settings.id)

            if (error) throw error
            alert("Configurações salvas com sucesso!")
        } catch (error) {
            console.error("Error saving settings:", error)
            alert("Erro ao salvar configurações.")
        } finally {
            setSaving(false)
        }
    }

    const handleAddService = () => {
        if (!newService.title || !newService.price) return

        const service: Service = {
            id: `demo-${Date.now()}`,
            title: newService.title,
            price: Number(newService.price),
            description: newService.description,
            duration: "30 min",
            icon: "scissors"
        }

        setSettings(prev => ({
            ...prev,
            services: [...prev.services, service]
        }))

        setNewService({ title: "", price: "", description: "" })
    }

    const handleRemoveService = (id: string) => {
        setSettings(prev => ({
            ...prev,
            services: prev.services.filter(s => s.id !== id)
        }))
    }

    const handleAddBarber = () => {
        if (!newBarber.name) return

        const barber: Barber = {
            id: `barber-${Date.now()}`,
            name: newBarber.name,
            photo_url: newBarber.photo,
            active: true
        }

        setSettings(prev => ({
            ...prev,
            barbers: [...(prev.barbers || []), barber]
        }))

        setNewBarber({ name: "", photo: "" })
    }

    const handleRemoveBarber = (id: string) => {
        setSettings(prev => ({
            ...prev,
            barbers: prev.barbers.filter(b => b.id !== id)
        }))
    }

    const handleBarberPhotoUpload = async (file: File) => {
        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `barber-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('images') // Ensure this bucket exists and is public
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath)

            setNewBarber(prev => ({ ...prev, photo: publicUrl }))
            alert("Foto do barbeiro enviada!")
        } catch (error) {
            console.error("Error uploading barber photo:", error)
            alert("Erro ao enviar foto.")
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Carregando configurações...
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Configuração da Demonstração</h1>
                <p className="text-zinc-400">Gerencie o conteúdo exibido na página pública de demonstração.</p>
            </div>

            <div className="grid gap-8">
                {/* Visual Identity */}
                <Card className="bg-[#1c1c1c] border-white/5 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-[#DBC278]" />
                            Identidade Visual
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Personalize o nome e as imagens da barbearia.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome da Barbearia</Label>
                            <Input
                                value={settings.name}
                                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                className="bg-[#09090b] border-zinc-800 focus:border-[#DBC278]"
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Avatar (Logo)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={settings.avatar}
                                        onChange={(e) => setSettings({ ...settings, avatar: e.target.value })}
                                        className="bg-[#09090b] border-zinc-800 focus:border-[#DBC278] flex-1"
                                        placeholder="https://..."
                                    />
                                    <div className="relative">
                                        <Input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleFileUpload(file, 'avatar')
                                            }}
                                            accept="image/*"
                                        />
                                        <Button variant="outline" size="icon" className="border-zinc-800 bg-[#1c1c1c] hover:bg-zinc-800">
                                            <Upload className="w-4 h-4 text-zinc-400" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Capa (Background)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={settings.cover}
                                        onChange={(e) => setSettings({ ...settings, cover: e.target.value })}
                                        className="bg-[#09090b] border-zinc-800 focus:border-[#DBC278] flex-1"
                                        placeholder="https://..."
                                    />
                                    <div className="relative">
                                        <Input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleFileUpload(file, 'cover')
                                            }}
                                            accept="image/*"
                                        />
                                        <Button variant="outline" size="icon" className="border-zinc-800 bg-[#1c1c1c] hover:bg-zinc-800">
                                            <Upload className="w-4 h-4 text-zinc-400" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Images */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="aspect-square bg-[#09090b] rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                                {settings.avatar ? (
                                    <img src={settings.avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-zinc-600">Sem Avatar</span>
                                )}
                            </div>
                            <div className="aspect-video bg-[#09090b] rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                                {settings.cover ? (
                                    <img src={settings.cover} alt="Cover Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-zinc-600">Sem Capa</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Services Management */}
                <Card className="bg-[#1c1c1c] border-white/5 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scissors className="w-5 h-5 text-[#DBC278]" />
                            Serviços
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Adicione ou remova serviços da demonstração.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Add Service Form */}
                        <div className="bg-[#09090b] p-4 rounded-xl border border-white/5 space-y-4">
                            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Novo Serviço</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    placeholder="Nome do serviço (ex: Corte)"
                                    value={newService.title}
                                    onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                                    className="bg-[#1c1c1c] border-zinc-800"
                                />
                                <Input
                                    type="number"
                                    placeholder="Preço (R$)"
                                    value={newService.price}
                                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                    className="bg-[#1c1c1c] border-zinc-800"
                                />
                            </div>
                            <Button
                                onClick={handleAddService}
                                disabled={!newService.title || !newService.price}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Serviço
                            </Button>
                        </div>

                        {/* Services List */}
                        <div className="space-y-2">
                            {settings.services.length === 0 && (
                                <p className="text-center text-zinc-500 py-8 text-sm">Nenhum serviço cadastrado.</p>
                            )}
                            {settings.services.map((service) => (
                                <div key={service.id} className="flex items-center justify-between p-3 bg-[#09090b] rounded-lg border border-white/5 group hover:border-[#DBC278]/20 transition-colors">
                                    <div>
                                        <p className="font-medium text-white">{service.title}</p>
                                        <p className="text-sm text-[#DBC278]">R$ {service.price.toFixed(2)}</p>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleRemoveService(service.id)}
                                        className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Barbers Management */}
            <Card className="bg-[#1c1c1c] border-white/5 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#DBC278]" />
                        Equipe / Barbeiros
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Gerencie os profissionais que aparecerão na demonstração.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Add Barber Form */}
                    <div className="bg-[#09090b] p-4 rounded-xl border border-white/5 space-y-4">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Novo Barbeiro</h4>
                        <div className="flex gap-4 items-end">
                            <div className="space-y-2 flex-1">
                                <Label>Nome</Label>
                                <Input
                                    placeholder="Nome do profissional"
                                    value={newBarber.name}
                                    onChange={e => setNewBarber({ ...newBarber, name: e.target.value })}
                                    className="bg-[#1c1c1c] border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2 w-1/3">
                                <Label>Foto</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={newBarber.photo}
                                            onChange={(e) => setNewBarber({ ...newBarber, photo: e.target.value })}
                                            className="bg-[#1c1c1c] border-zinc-800"
                                            placeholder="URL ou Upload"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center">
                                            <div className="relative">
                                                <Input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-10"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleBarberPhotoUpload(file)
                                                    }}
                                                    accept="image/*"
                                                />
                                                <Button type="button" variant="ghost" size="icon" className="hover:bg-zinc-700 h-10 w-10">
                                                    <Upload className="w-4 h-4 text-zinc-400" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {newBarber.photo && (
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#DBC278]">
                                <img src={newBarber.photo} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <Button
                            onClick={handleAddBarber}
                            disabled={!newBarber.name}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Barbeiro
                        </Button>
                    </div>

                    {/* Barbers List */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(settings.barbers || []).length === 0 && (
                            <p className="col-span-full text-center text-zinc-500 py-8 text-sm">Nenhum barbeiro cadastrado.</p>
                        )}
                        {(settings.barbers || []).map((barber) => (
                            <div key={barber.id} className="relative group bg-[#09090b] rounded-xl border border-white/5 p-4 flex flex-col items-center gap-3 hover:border-[#DBC278]/30 transition-all">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-900 border-2 border-zinc-800 group-hover:border-[#DBC278] transition-colors">
                                    {barber.photo_url ? (
                                        <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle2 className="w-full h-full text-zinc-700 p-2" />
                                    )}
                                </div>
                                <p className="font-bold text-white text-sm">{barber.name}</p>
                                <button
                                    onClick={() => handleRemoveBarber(barber.id)}
                                    className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>


            {/* Save Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#09090b]/80 backdrop-blur-md border-t border-white/10 flex justify-end md:pl-64 z-50">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#DBC278] hover:bg-[#c4ad6b] text-black font-bold shadow-lg shadow-[#DBC278]/20"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                        </>
                    )}
                </Button>
            </div>
        </div >
    )
}
