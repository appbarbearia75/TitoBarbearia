"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, AlertCircle, MapPin, Star } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ImageUpload } from "@/components/ui/image-upload"
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor"

export default function SettingsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        google_maps_link: "",
        google_reviews_link: "",
        avatar_url: "",
        cover_url: "",
        vip_plan_title: "",
        vip_plan_price: "",
        vip_plan_price_from: "",
        opening_hours: {
            seg: { open: false, start: "09:00", end: "19:00" },
            ter: { open: true, start: "09:00", end: "19:00" },
            qua: { open: true, start: "09:00", end: "19:00" },
            qui: { open: true, start: "09:00", end: "19:00" },
            sex: { open: true, start: "09:00", end: "19:00" },
            sab: { open: true, start: "09:00", end: "18:00" },
            dom: { open: false, start: "09:00", end: "13:00" },
        }
    })
    const [msg, setMsg] = useState({ type: "", text: "" })

    useEffect(() => {
        fetchSettings()
    }, [slug])

    const fetchSettings = async () => {
        const { data } = await supabase.from('barbershops').select('*').eq('slug', slug).single()
        if (data) {
            setFormData({
                name: data.name || "",
                phone: data.phone || "",
                address: data.address || "",
                google_maps_link: data.google_maps_link || "",
                google_reviews_link: data.google_reviews_link || "",
                avatar_url: data.avatar_url || "",
                cover_url: data.cover_url || "",
                vip_plan_title: data.vip_plan_title || "VIP",
                vip_plan_price: data.vip_plan_price || "R$ 0,00",
                vip_plan_price_from: data.vip_plan_price_from || "",
                opening_hours: data.opening_hours || formData.opening_hours
            })
        }
    }

    const handleUpload = (field: 'avatar_url' | 'cover_url', url: string) => {
        const oldUrl = formData[field]
        if (oldUrl && oldUrl !== url) {
            deleteImageFromStorage(oldUrl)
        }
        setFormData(prev => ({ ...prev, [field]: url }))
    }

    const deleteImageFromStorage = async (url: string) => {
        try {
            if (!url.includes('/storage/v1/object/public/')) return
            const bucketName = 'images'
            if (url.includes(`/${bucketName}/`)) {
                const relativePath = url.split(`/${bucketName}/`)[1]
                await supabase.storage.from(bucketName).remove([relativePath])
            }
        } catch (error) {
            console.error("Error deleting old image:", error)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        setMsg({ type: "", text: "" })

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('barbershops')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                    google_maps_link: formData.google_maps_link,
                    google_reviews_link: formData.google_reviews_link,
                    avatar_url: formData.avatar_url,
                    cover_url: formData.cover_url,
                    vip_plan_title: formData.vip_plan_title,
                    vip_plan_price: formData.vip_plan_price,
                    vip_plan_price_from: formData.vip_plan_price_from,
                    opening_hours: formData.opening_hours
                })
                .eq('id', user.id)

            if (error) throw error

            setMsg({ type: "success", text: "Configurações salvas com sucesso!" })
        } catch (error) {
            console.error("Error saving settings:", error)
            setMsg({ type: "error", text: "Erro ao salvar alterações." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 max-w-4xl pb-20">
            <div>
                <h1 className="text-3xl font-bold">Configurações</h1>
                <p className="text-zinc-400">Personalize sua barbearia e suas informações.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coluna da Esquerda - Informações Básicas e Imagens */}
                <div className="space-y-8">
                    <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                        <CardHeader>
                            <CardTitle>Imagens</CardTitle>
                            <CardDescription>Gerencie o visual da sua página.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 gap-8">
                                <ImageUpload
                                    label="Foto de Perfil"
                                    bucket="images"
                                    currentUrl={formData.avatar_url}
                                    onUpload={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
                                    aspectRatio="square"
                                />
                                <ImageUpload
                                    label="Foto de Capa"
                                    bucket="images"
                                    currentUrl={formData.cover_url}
                                    onUpload={(url) => setFormData(prev => ({ ...prev, cover_url: url }))}
                                    aspectRatio="video"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                        <CardHeader>
                            <CardTitle>Informações Gerais</CardTitle>
                            <CardDescription>Dados visíveis para seus clientes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Nome da Barbearia</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Telefone / WhatsApp</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Endereço Completo</Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Link Google Maps</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        value={formData.google_maps_link}
                                        onChange={(e) => setFormData(prev => ({ ...prev, google_maps_link: e.target.value }))}
                                        className="pl-9 bg-zinc-800 border-zinc-700"
                                        placeholder="https://maps.google.com/..."
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">Link para seus clientes abrirem a localização direto no GPS.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Link Avaliações Google</Label>
                                <div className="relative">
                                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        value={formData.google_reviews_link}
                                        onChange={(e) => setFormData(prev => ({ ...prev, google_reviews_link: e.target.value }))}
                                        className="pl-9 bg-zinc-800 border-zinc-700"
                                        placeholder="https://g.page/r/..."
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">Link direto para seus clientes avaliarem sua barbearia.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna da Direita - Horários e Equipe */}
                <div className="space-y-8">
                    <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                        <CardHeader>
                            <CardTitle>Plano VIP</CardTitle>
                            <CardDescription>Configure o nome e valor do seu plano de fidelidade.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do Plano</Label>
                                <Input
                                    value={formData.vip_plan_title || ''}
                                    placeholder="Ex: Clube do Tito, VIP Pass..."
                                    onChange={(e) => setFormData(prev => ({ ...prev, vip_plan_title: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Preço "De" (Original)</Label>
                                    <Input
                                        value={formData.vip_plan_price_from || ''}
                                        placeholder="R$ 150,00"
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "")
                                            const formatted = (Number(value) / 100).toLocaleString("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                            })
                                            setFormData(prev => ({ ...prev, vip_plan_price_from: formatted }))
                                        }}
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Preço "Por" (Atual)</Label>
                                    <Input
                                        value={formData.vip_plan_price || ''}
                                        placeholder="R$ 99,90"
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "")
                                            const formatted = (Number(value) / 100).toLocaleString("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                            })
                                            setFormData(prev => ({ ...prev, vip_plan_price: formatted }))
                                        }}
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                        <CardHeader>
                            <CardTitle>Gestão de Equipe</CardTitle>
                            <CardDescription>Adicione os profissionais que atendem na barbearia.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <TeamManager slug={slug} />
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                        <CardHeader>
                            <CardTitle>Horários de Atendimento</CardTitle>
                            <CardDescription>Defina os dias e horários que sua barbearia está aberta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <WorkingHoursEditor
                                value={formData.opening_hours}
                                onChange={(newHours) => setFormData(prev => ({ ...prev, opening_hours: newHours as any }))}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {msg.text && (
                <div className={`p-4 rounded-lg text-sm flex items-center gap-2 fixed bottom-8 right-8 z-50 shadow-xl animate-in fade-in slide-in-from-bottom-4 ${msg.type === 'success' ? 'bg-green-900 border border-green-800 text-green-100' : 'bg-red-900 border border-red-800 text-red-100'}`}>
                    <AlertCircle className="w-5 h-5" />
                    {msg.text}
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#09090b]/80 backdrop-blur-sm border-t border-white/5 flex justify-end md:justify-center z-40">
                <Button onClick={handleSave} className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold w-full md:w-auto md:min-w-[200px]" disabled={loading}>
                    {loading ? "Salvando..." : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

function TeamManager({ slug }: { slug: string }) {
    const [barbers, setBarbers] = useState<any[]>([])
    const [name, setName] = useState("")
    const [photoUrl, setPhotoUrl] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchBarbers()
    }, [])

    const fetchBarbers = async () => {
        // Get barbershop id first
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (barbershop) {
            const { data } = await supabase.from('barbers').select('*').eq('barbershop_id', barbershop.id).eq('active', true)
            setBarbers(data || [])
        }
    }

    const handleAddBarber = async () => {
        if (!name) return
        setLoading(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            const { error } = await supabase.from('barbers').insert({
                barbershop_id: barbershop.id,
                name,
                photo_url: photoUrl
            })

            if (error) throw error

            setName("")
            setPhotoUrl("")
            fetchBarbers()
        } catch (error) {
            console.error("Error adding barber:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveBarber = async (id: string) => {
        try {
            // Soft delete
            await supabase.from('barbers').update({ active: false }).eq('id', id)
            fetchBarbers()
        } catch (error) {
            console.error("Error removing barber:", error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4 border p-4 rounded-lg border-white/5 bg-black/20">
                <h4 className="font-medium text-sm text-zinc-400">Novo Profissional</h4>
                <div className="space-y-4">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>Nome</Label>
                            <Input
                                placeholder="Nome do barbeiro..."
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Foto</Label>
                            <ImageUpload
                                bucket="images"
                                onUpload={setPhotoUrl}
                                currentUrl={photoUrl}
                                label=""
                                aspectRatio="square"
                                className="w-32 h-32"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleAddBarber}
                        disabled={loading || !name}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 mt-4"
                    >
                        {loading ? "Adicionando..." : "Adicionar à Equipe"}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="font-medium text-sm text-zinc-400">Equipe Atual</h4>
                {barbers.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">Nenhum barbeiro cadastrado.</p>
                ) : (
                    <div className="grid gap-2">
                        {barbers.map(barber => (
                            <div key={barber.id} className="flex items-center justify-between p-3 bg-[#1c1c1c] rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                                        {barber.photo_url ? (
                                            <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">Foto</div>
                                        )}
                                    </div>
                                    <span className="font-medium">{barber.name}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                                    onClick={() => handleRemoveBarber(barber.id)}
                                >
                                    <span className="sr-only">Remover</span>
                                    &times;
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
