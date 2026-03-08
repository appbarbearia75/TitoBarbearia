"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, AlertCircle, MapPin, Star, Image as ImageIcon, Info, Users, Clock, Lock, ChevronRight, ArrowLeft, Plus, Pencil, MessageCircle, X, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ImageUpload } from "@/components/ui/image-upload"
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor"
import { PasswordChangeForm } from "@/components/admin/PasswordChangeForm"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

function WhatsAppSettingsManager({ numbers, onChange }: { numbers: string[], onChange: (numbers: string[]) => void }) {
    const [newNumber, setNewNumber] = useState("")

    const handleAdd = () => {
        const cleanNumber = newNumber.replace(/\D/g, '')
        if (cleanNumber.length < 10) {
            alert("Digite um número de telefone válido com DDD.")
            return
        }
        if (!numbers.includes(cleanNumber)) {
            onChange([...numbers, cleanNumber])
        }
        setNewNumber("")
    }

    const handleRemove = (numberToRemove: string) => {
        onChange(numbers.filter(n => n !== numberToRemove))
    }

    return (
        <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-xl">
            <CardHeader>
                <CardTitle>WhatsApp de Notificações</CardTitle>
                <CardDescription className="text-zinc-400">
                    Estes números receberão uma notificação automática via Z-API sempre que um novo agendamento for realizado no sistema. <br />
                    Sugerimos adicionar o número pessoal da gerência e da recepção. (Somente números do Brasil).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                    <Input
                        value={newNumber}
                        onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '')
                            if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '($1) $2')
                            if (v.length > 7) v = v.replace(/(\d{5})(\d)/, '$1-$2')
                            setNewNumber(v.substring(0, 15))
                        }}
                        placeholder="(11) 99999-9999"
                        className="bg-zinc-800 border-zinc-700 max-w-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <Button
                        type="button"
                        onClick={handleAdd}
                        disabled={!newNumber || newNumber.replace(/\D/g, '').length < 10}
                        className="bg-[#25D366] hover:bg-[#1DA851] text-white"
                    >
                        <Plus className="w-5 h-5 mr-1" /> Adicionar
                    </Button>
                </div>

                {numbers.length > 0 ? (
                    <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex flex-wrap gap-2">
                        {numbers.map(num => {
                            const formatted = num.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
                            return (
                                <div key={num} className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] px-3 py-1.5 rounded-full text-sm font-medium">
                                    {formatted}
                                    <button
                                        onClick={() => handleRemove(num)}
                                        className="hover:text-red-400 p-0.5 rounded-full hover:bg-[#25D366]/20 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center text-zinc-500">
                        <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Nenhum número de notificação configurado.</p>
                        <p className="text-xs mt-1">Neste caso, a notificação irá para o número público da barbearia ({'{'}client.phone{'}'}).</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [activeSection, setActiveSection] = useState<string | null>(null)
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
        },
        whatsapp_notification_numbers: [] as string[],
        auto_complete_bookings: true
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
                opening_hours: data.opening_hours || formData.opening_hours,
                whatsapp_notification_numbers: data.whatsapp_notification_numbers || [],
                auto_complete_bookings: data.auto_complete_bookings !== false
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
                    opening_hours: formData.opening_hours,
                    whatsapp_notification_numbers: formData.whatsapp_notification_numbers,
                    auto_complete_bookings: formData.auto_complete_bookings
                })
                .eq('id', user.id)

            if (error) throw error

            if (formData.auto_complete_bookings) {
                // Force an immediate completion run upon saving.
                const now = new Date()
                const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0]

                const { data: pending } = await supabase
                    .from('bookings')
                    .select(`*, services(title, duration, price), barbers(commission_type, commission_value)`)
                    .eq('barbershop_id', user.id)
                    .eq('status', 'confirmed')
                    .lte('date', todayStr)

                if (pending && pending.length > 0) {
                    for (const b of pending) {
                        let shouldComplete = false;
                        const [year, month, day] = b.date.split('-').map(Number);
                        const [hour, min] = b.time.split(':').map(Number);
                        const bDate = new Date(year, month - 1, day, hour, min);

                        let durationMins = 30;
                        const durationStr = (b.services as any)?.duration?.toString() || '30';
                        if (durationStr.includes(':')) {
                            const [dh, dm] = durationStr.split(':').map(Number);
                            durationMins = (dh * 60) + (dm || 0);
                        } else if (durationStr.toLowerCase().includes('h')) {
                            const hMatch = durationStr.match(/(\d+)\s*h/i);
                            const mMatch = durationStr.match(/(\d+)\s*m/i);
                            const dh = hMatch ? parseInt(hMatch[1]) : 0;
                            const dm = mMatch ? parseInt(mMatch[1]) : 0;
                            durationMins = (dh * 60) + dm;
                            if (durationMins === 0) durationMins = parseInt(durationStr.replace(/\D/g, '')) || 30;
                        } else {
                            durationMins = parseInt(durationStr.replace(/\D/g, '')) || 30;
                        }
                        bDate.setMinutes(bDate.getMinutes() + durationMins)

                        if (now >= bDate) {
                            shouldComplete = true
                        }

                        if (shouldComplete) {
                            let commission_earned = 0
                            if (b.barbers) {
                                const cType = (b.barbers as any).commission_type || 'percentage'
                                const cValue = parseFloat((b.barbers as any).commission_value) || 0
                                const bPrice = parseFloat((b.services as any)?.price || '0')
                                if (cType === 'percentage') {
                                    commission_earned = bPrice * (cValue / 100)
                                } else if (cType === 'fixed') {
                                    commission_earned = cValue
                                }
                            }
                            await supabase.from('bookings').update({ status: 'completed', commission_earned }).eq('id', b.id)
                        }
                    }
                }
            }

            setMsg({ type: "success", text: "Configurações salvas com sucesso!" })
        } catch (error) {
            console.error("Error saving settings:", error)
            setMsg({ type: "error", text: "Erro ao salvar alterações." })
        } finally {
            setLoading(false)
        }
    }

    const sectionsList = [
        { id: 'images', title: 'Imagens', description: 'Gerencie o visual da sua página.', icon: <ImageIcon className="w-5 h-5 text-zinc-400" /> },
        { id: 'general', title: 'Informações Gerais', description: 'Dados visíveis para seus clientes.', icon: <Info className="w-5 h-5 text-zinc-400" /> },
        { id: 'whatsapp', title: 'Configurar WhatsApp', description: 'Gerencie os números que receberão notificações de novos agendamentos.', icon: <MessageCircle className="w-5 h-5 text-[#25D366]" /> },
        { id: 'agenda', title: 'Configurações da Agenda', description: 'Personalize o funcionamento geral da sua agenda.', icon: <Calendar className="w-5 h-5 text-zinc-400" /> },
        { id: 'team', title: 'Gestão de Equipe', description: 'Adicione os profissionais que atendem na barbearia.', icon: <Users className="w-5 h-5 text-zinc-400" /> },
        { id: 'hours', title: 'Horários de Atendimento', description: 'Defina os dias e horários que sua barbearia está aberta.', icon: <Clock className="w-5 h-5 text-zinc-400" /> },
        { id: 'security', title: 'Segurança', description: 'Gerencie suas credenciais de acesso.', icon: <Lock className="w-5 h-5 text-zinc-400" /> },
    ]

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-24">
            {!activeSection ? (
                <>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">Configurações</h1>
                        <p className="text-zinc-400 mt-1">Personalize sua barbearia e suas informações.</p>
                    </div>

                    <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        {sectionsList.map((sec, index) => (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id)}
                                className={`w-full text-left p-5 flex items-center justify-between hover:bg-white/5 transition-colors ${index !== sectionsList.length - 1 ? 'border-b border-white/5' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl">
                                        {sec.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">{sec.title}</h3>
                                        <p className="border-none text-sm text-zinc-400 mt-0.5">{sec.description}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-600" />
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 bg-[#1c1c1c] border border-white/5 hover:bg-white/10" onClick={() => setActiveSection(null)}>
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{sectionsList.find(s => s.id === activeSection)?.title}</h1>
                            <p className="text-sm text-zinc-400">{sectionsList.find(s => s.id === activeSection)?.description}</p>
                        </div>
                    </div>

                    <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                        {activeSection === 'images' && (
                            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-xl">
                                <CardContent className="space-y-8 p-6">
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
                        )}

                        {activeSection === 'general' && (
                            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-xl">
                                <CardContent className="space-y-6 p-6">
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
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'whatsapp' && (
                            <WhatsAppSettingsManager
                                numbers={formData.whatsapp_notification_numbers}
                                onChange={(newNumbers) => setFormData(prev => ({ ...prev, whatsapp_notification_numbers: newNumbers }))}
                            />
                        )}

                        {activeSection === 'team' && (
                            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-xl">
                                <CardContent className="space-y-6 p-6">
                                    <TeamManager slug={slug} />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'hours' && (
                            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-xl">
                                <CardContent className="p-6">
                                    <WorkingHoursEditor
                                        value={formData.opening_hours}
                                        onChange={(newHours) => setFormData(prev => ({ ...prev, opening_hours: newHours as any }))}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'security' && (
                            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-xl">
                                <CardContent className="p-6">
                                    <PasswordChangeForm />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'agenda' && (
                            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-xl">
                                <CardContent className="space-y-6 p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base text-white font-bold">Encerrar agendamentos automático</Label>
                                                <p className="text-sm text-zinc-400">
                                                    Ao ativar, o sistema finalizará automaticamente os agendamentos assim que o horário de término for atingido (comissão percentual base será registrada sem fluxo de PDV).
                                                </p>
                                            </div>
                                            <Switch
                                                checked={formData.auto_complete_bookings}
                                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_complete_bookings: checked }))}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}

            {msg.text && (
                <div className={`p-4 rounded-lg text-sm flex items-center gap-2 fixed bottom-8 right-8 z-50 shadow-xl animate-in fade-in slide-in-from-bottom-4 ${msg.type === 'success' ? 'bg-green-900 border border-green-800 text-green-100' : 'bg-red-900 border border-red-800 text-red-100'}`}>
                    <AlertCircle className="w-5 h-5" />
                    {msg.text}
                </div>
            )}

            {activeSection && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#09090b]/80 backdrop-blur-sm border-t border-white/5 flex gap-3 justify-center z-40 lg:ml-64 animate-in slide-in-from-bottom">
                    <Button onClick={() => setActiveSection(null)} variant="outline" className="border-white/10 bg-zinc-900 text-white hover:bg-zinc-800 w-full md:w-auto h-12 md:min-w-[150px]">
                        Voltar
                    </Button>
                    <Button onClick={handleSave} className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold w-full md:w-auto h-12 md:min-w-[200px]" disabled={loading}>
                        {loading ? "Salvando..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}

function TeamManager({ slug }: { slug: string }) {
    const [barbers, setBarbers] = useState<any[]>([])
    const [name, setName] = useState("")
    const [photoUrl, setPhotoUrl] = useState("")
    const [role, setRole] = useState("Funcionario")
    const [workStart, setWorkStart] = useState("")
    const [workEnd, setWorkEnd] = useState("")
    const [lunchStart, setLunchStart] = useState("12:00")
    const [lunchEnd, setLunchEnd] = useState("13:00")
    const [workingHours, setWorkingHours] = useState<any>({
        seg: { open: true },
        ter: { open: true },
        qua: { open: true },
        qui: { open: true },
        sex: { open: true },
        sab: { open: true },
        dom: { open: false }
    })
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

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

    const handleSaveBarber = async () => {
        if (!name) return
        setLoading(true)
        try {
            const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
            if (!barbershop) return

            const payload = {
                name,
                photo_url: photoUrl,
                role,
                work_start: workStart || null,
                work_end: workEnd || null,
                lunch_start: lunchStart || null,
                lunch_end: lunchEnd || null,
                working_hours: workingHours
            }

            if (editingId) {
                const { error } = await supabase.from('barbers').update(payload).eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase.from('barbers').insert({
                    ...payload,
                    barbershop_id: barbershop.id
                })
                if (error) throw error
            }

            resetForm()
            setModalOpen(false)
            fetchBarbers()
        } catch (error) {
            console.error("Error saving barber:", error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName("")
        setPhotoUrl("")
        setRole("Funcionario")
        setWorkStart("")
        setWorkEnd("")
        setLunchStart("12:00")
        setLunchEnd("13:00")
        setWorkingHours({
            seg: { open: true },
            ter: { open: true },
            qua: { open: true },
            qui: { open: true },
            sex: { open: true },
            sab: { open: true },
            dom: { open: false }
        })
        setEditingId(null)
    }

    const openEditModal = (barber: any) => {
        setName(barber.name || "")
        setPhotoUrl(barber.photo_url || "")
        setRole(barber.role || "Funcionario")
        setWorkStart(barber.work_start || "")
        setWorkEnd(barber.work_end || "")
        setLunchStart(barber.lunch_start || "12:00")
        setLunchEnd(barber.lunch_end || "13:00")
        setWorkingHours(barber.working_hours || {
            seg: { open: true },
            ter: { open: true },
            qua: { open: true },
            qui: { open: true },
            sex: { open: true },
            sab: { open: true },
            dom: { open: false }
        })
        setEditingId(barber.id)
        setModalOpen(true)
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
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-sm text-zinc-400">Equipe Atual</h4>
                    <p className="text-sm text-zinc-500 mt-1">Gerencie os profissionais que atuam nesta unidade.</p>
                </div>
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold h-10 px-4"
                            onClick={() => {
                                setEditingId(null)
                                setName("")
                                setPhotoUrl("")
                                setRole("Funcionario")
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Profissional
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1c1c1c] border-white/10 text-white max-w-lg p-6 flex flex-col gap-6 overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{editingId ? "Editar Profissional" : "Cadastrar Profissional"}</DialogTitle>
                            <DialogDescription className="text-zinc-400 mt-1.5">
                                {editingId ? "Atualize os detalhes do membro da equipe." : "Adicione os detalhes do membro da equipe para que ele possa gerenciar agenda e recebimentos."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nome</Label>
                                        <Input
                                            placeholder="Nome do profissional..."
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="bg-black/20 border-white/10 h-11 text-base focus-visible:ring-[#DBC278]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cargo / Função</Label>
                                        <Select value={role} onValueChange={setRole}>
                                            <SelectTrigger className="w-full bg-black/20 border-white/10 focus:border-[#DBC278]/50 transition-colors h-11 text-white">
                                                <SelectValue placeholder="Selecione o cargo" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                                <SelectItem value="Dono">Dono</SelectItem>
                                                <SelectItem value="Funcionario">Funcionário</SelectItem>
                                                <SelectItem value="Recepcionista">Recepcionista</SelectItem>
                                                <SelectItem value="Freelancer">Freelancer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col shrink-0">
                                    <Label>Foto de Perfil</Label>
                                    <div className="flex-1 border bg-black/20 border-white/5 rounded-lg overflow-hidden flex flex-col justify-center items-center h-32 w-32 relative group">
                                        <ImageUpload
                                            bucket="images"
                                            onUpload={setPhotoUrl}
                                            currentUrl={photoUrl}
                                            label=""
                                            aspectRatio="square"
                                            className="w-full h-full border-0 rounded-none absolute inset-0 z-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Horário Particular (Opcional)</Label>
                                    <p className="text-[10px] text-zinc-500 italic mt-0">Deixe em branco para usar o horário de funcionamento padrão da barbearia.</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] text-zinc-500">Início</span>
                                            <Input
                                                type="time"
                                                value={workStart}
                                                onChange={e => setWorkStart(e.target.value)}
                                                className="bg-black/20 border-white/10 h-10 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] text-zinc-500">Fim</span>
                                            <Input
                                                type="time"
                                                value={workEnd}
                                                onChange={e => setWorkEnd(e.target.value)}
                                                className="bg-black/20 border-white/10 h-10 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Intervalo de Almoço</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] text-zinc-500">Início</span>
                                            <Input
                                                type="time"
                                                value={lunchStart || ""}
                                                onChange={e => setLunchStart(e.target.value)}
                                                className="bg-black/20 border-white/10 h-10 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] text-zinc-500">Fim</span>
                                            <Input
                                                type="time"
                                                value={lunchEnd || ""}
                                                onChange={e => setLunchEnd(e.target.value)}
                                                className="bg-black/20 border-white/10 h-10 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Dias de Trabalho na Semana</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => setWorkingHours((prev: any) => ({
                                                ...prev,
                                                [day]: { ...prev[day], open: !prev[day]?.open }
                                            }))}
                                            className={`px-3 py-2 rounded-lg text-xs font-black uppercase transition-all border ${workingHours[day]?.open
                                                ? 'bg-[#DBC278] text-black border-[#DBC278] shadow-lg shadow-[#DBC278]/20'
                                                : 'bg-zinc-800/50 text-zinc-500 border-white/5 hover:bg-zinc-800'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-500 italic">Os dias desmarcados ficarão bloqueados na agenda deste profissional.</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-end gap-3 mt-2">
                            <Button
                                variant="ghost"
                                className="text-zinc-400 hover:text-white"
                                onClick={() => {
                                    setModalOpen(false)
                                    resetForm()
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveBarber}
                                disabled={loading || !name}
                                className="bg-green-600 hover:bg-green-500 text-white font-bold"
                            >
                                {loading ? "Salvando..." : (editingId ? "Salvar Alterações" : "Cadastrar na Equipe")}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {barbers.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">Nenhum barbeiro cadastrado.</p>
                ) : (
                    <div className="grid gap-2">
                        {barbers.map(barber => (
                            <div key={barber.id} className="flex items-center justify-between p-3 bg-[#1c1c1c] rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                                        {barber.photo_url ? (
                                            <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">Foto</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white">{barber.name}</span>
                                        <div className="mt-1">
                                            {barber.role === 'Dono' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 uppercase tracking-widest border border-yellow-500/30">Dono</span>
                                            )}
                                            {(barber.role === 'Funcionario' || !barber.role) && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 uppercase tracking-widest border border-zinc-500/30">Funcionário</span>
                                            )}
                                            {barber.role === 'Recepcionista' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-widest border border-blue-500/30">Recepcionista</span>
                                            )}
                                            {barber.role === 'Freelancer' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-widest border border-purple-500/30">Freelancer</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-zinc-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                                        onClick={() => openEditModal(barber)}
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        <span className="sr-only">Editar</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                                        onClick={() => handleRemoveBarber(barber.id)}
                                        title="Remover"
                                    >
                                        <span className="sr-only">Remover</span>
                                        &times;
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
