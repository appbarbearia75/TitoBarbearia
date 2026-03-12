"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, AlertCircle, MapPin, Star, Image as ImageIcon, Info, Users, Clock, Lock, ChevronRight, ArrowLeft, Plus, Pencil, MessageCircle, X, Calendar, Search, Loader2, Trash2 } from "lucide-react"
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
        <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
            <CardHeader>
                <CardTitle>WhatsApp de Notificações</CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">
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
                        className="bg-[var(--bg-input)] border-[var(--border-color)] max-w-sm text-[var(--text-primary)] focus-visible:ring-[var(--accent-primary)]"
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
                    <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-4 flex flex-wrap gap-2">
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
                    <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col items-center justify-center text-center text-[var(--text-secondary)]">
                        <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Nenhum número de notificação configurado.</p>
                        <p className="text-xs mt-1 text-[var(--text-muted)]">Neste caso, a notificação irá para o número público da barbearia ({'{'}client.phone{'}'}).</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [searchTerm, setSearchTerm] = useState("")
    const [teamCount, setTeamCount] = useState(0)
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

            const { count } = await supabase.from('barbers').select('*', { count: 'exact', head: true }).eq('barbershop_id', data.id).eq('active', true)
            setTeamCount(count || 0)
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
        {
            id: 'images',
            title: 'Imagens',
            description: 'Gerencie logo e imagens da página de agendamento.',
            icon: <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-[10px]"><ImageIcon className="w-5 h-5" /></div>,
            category: 'NEGÓCIO',
            status: formData.avatar_url ? 'Imagens configuradas' : 'Sem imagens'
        },
        {
            id: 'general',
            title: 'Informações Gerais',
            description: 'Configure nome da barbearia, endereço e dados visíveis aos clientes.',
            icon: <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-[10px]"><Info className="w-5 h-5" /></div>,
            category: 'NEGÓCIO',
            status: formData.name ? 'Preenchido' : 'Não configurado'
        },
        {
            id: 'hours',
            title: 'Horários de Atendimento',
            description: 'Defina os dias e horários que a barbearia funciona.',
            icon: <div className="p-2.5 bg-[#DBC278]/10 text-[#DBC278] rounded-[10px]"><Clock className="w-5 h-5" /></div>,
            category: 'NEGÓCIO',
            status: 'Horário configurado'
        },
        {
            id: 'agenda',
            title: 'Configurações da Agenda',
            description: 'Defina a duração padrão de serviços, intervalos e regras de agendamento automáticos.',
            icon: <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-[10px]"><Calendar className="w-5 h-5" /></div>,
            category: 'AGENDA',
            status: formData.auto_complete_bookings ? 'Auto-completar ON' : 'Auto-completar OFF'
        },
        {
            id: 'team',
            title: 'Gestão de Equipe',
            description: 'Adicione os profissionais que atendem na barbearia e gerencie regras.',
            icon: <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-[10px]"><Users className="w-5 h-5" /></div>,
            category: 'EQUIPE',
            status: teamCount > 0 ? `${teamCount} profissional(is)` : 'Sem equipe configurada'
        },
        {
            id: 'whatsapp',
            title: 'Configurar WhatsApp',
            description: 'Gerencie os números que recebem notificações de novos agendamentos.',
            icon: <div className="p-2.5 bg-[#25D366]/10 text-[#25D366] rounded-[10px]"><MessageCircle className="w-5 h-5" /></div>,
            category: 'COMUNICAÇÃO',
            status: formData.whatsapp_notification_numbers.length > 0 ? 'Status: Conectado' : 'Não configurado'
        },
        {
            id: 'security',
            title: 'Segurança',
            description: 'Gerencie credenciais de acesso e segurança.',
            icon: <div className="p-2.5 bg-red-500/10 text-red-500 rounded-[10px]"><Lock className="w-5 h-5" /></div>,
            category: 'SISTEMA',
            status: 'Protegido'
        },
    ]

    const filteredSections = sectionsList.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const categories = ['NEGÓCIO', 'AGENDA', 'EQUIPE', 'COMUNICAÇÃO', 'SISTEMA']

    return (
        <div className="space-y-8 max-w-[1200px] mx-auto pb-24 px-4 sm:px-6 lg:px-8">
            {!activeSection ? (
                <>
                    <div className="mb-10 text-center">
                        <h1 className="text-[32px] md:text-4xl font-bold tracking-tight">Configurações</h1>
                        <p className="text-zinc-400 mt-2 mb-8 text-[13px] md:text-sm">Personalize sua barbearia e gerencie o sistema.</p>

                        <div className="relative max-w-[500px] mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                            <Input
                                placeholder="Buscar configuração..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] rounded-[12px] focus-visible:ring-[var(--accent-primary)] shadow-lg text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-8">
                        {categories.map(cat => {
                            const catSections = filteredSections.filter(s => s.category === cat)
                            if (catSections.length === 0) return null

                            return (
                                <div key={cat} className="space-y-4">
                                    <div className="flex items-center gap-3 pl-1 mb-2">
                                        <h2 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest">{cat}</h2>
                                        <div className="flex-1 h-px bg-[var(--border-color)]" />
                                    </div>
                                    <div
                                        className="grid gap-[20px]"
                                        style={{
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
                                        }}
                                    >
                                        {catSections.map((sec) => (
                                            <button
                                                key={sec.id}
                                                onClick={() => setActiveSection(sec.id)}
                                                className="group w-full text-left p-[20px] flex items-start gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[12px] hover:border-[var(--border-color)]/80 transition-all duration-200 hover:-translate-y-[4px] shadow-sm hover:shadow-md"
                                            >
                                                <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                                                    {sec.icon}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col pt-0">
                                                    <h3 className="font-bold text-[var(--text-primary)] text-[16px] tracking-tight truncate">{sec.title}</h3>
                                                    <p className="text-[13px] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">{sec.description}</p>

                                                    {sec.status && (
                                                        <div className="mt-2 pt-1 border-t border-white/5">
                                                            <span className={`text-[12px] font-medium ${sec.status?.includes('Não') || sec.status?.includes('Sem') ? 'text-red-400' : 'text-green-500'}`}>
                                                                {sec.status}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}

                        {filteredSections.length === 0 && (
                            <div className="text-center py-12 text-[var(--text-secondary)] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                                <Search className="w-8 h-8 mx-auto mb-3 opacity-20 text-[var(--text-muted)]" />
                                <p>Nenhuma configuração encontrada para "{searchTerm}".</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]" onClick={() => setActiveSection(null)}>
                            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{sectionsList.find(s => s.id === activeSection)?.title}</h1>
                            <p className="text-sm text-[var(--text-secondary)]">{sectionsList.find(s => s.id === activeSection)?.description}</p>
                        </div>
                    </div>

                    <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                        {activeSection === 'images' && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
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
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
                                <CardContent className="space-y-6 p-6">
                                    <div className="space-y-2">
                                        <Label>Nome da Barbearia</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Telefone / WhatsApp</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Endereço Completo</Label>
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            className="bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Link Google Maps</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                            <Input
                                                value={formData.google_maps_link}
                                                onChange={(e) => setFormData(prev => ({ ...prev, google_maps_link: e.target.value }))}
                                                className="pl-9 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
                                                placeholder="https://maps.google.com/..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Link Avaliações Google</Label>
                                        <div className="relative">
                                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                            <Input
                                                value={formData.google_reviews_link}
                                                onChange={(e) => setFormData(prev => ({ ...prev, google_reviews_link: e.target.value }))}
                                                className="pl-9 bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)]"
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
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
                                <CardContent className="space-y-6 p-6">
                                    <TeamManager slug={slug} />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'hours' && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
                                <CardContent className="p-6">
                                    <WorkingHoursEditor
                                        value={formData.opening_hours}
                                        onChange={(newHours) => setFormData(prev => ({ ...prev, opening_hours: newHours as any }))}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'security' && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
                                <CardContent className="p-6">
                                    <PasswordChangeForm />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'agenda' && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl">
                                <CardContent className="space-y-6 p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base text-[var(--text-primary)] font-bold">Encerrar agendamentos automático</Label>
                                                <p className="text-sm text-[var(--text-secondary)]">
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
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg-page)]/90 backdrop-blur-md border-t border-[var(--border-color)] flex gap-3 justify-center z-40 lg:ml-64 animate-in slide-in-from-bottom">
                    <Button onClick={() => setActiveSection(null)} variant="outline" className="border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] w-full md:w-auto h-12 md:min-w-[150px]">
                        Voltar
                    </Button>
                    <Button onClick={handleSave} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-black font-bold w-full md:w-auto h-12 md:min-w-[200px]" disabled={loading}>
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
    const [lunchStart, setLunchStart] = useState("")
    const [lunchEnd, setLunchEnd] = useState("")
    const [hasLunchBreak, setHasLunchBreak] = useState(false)
    const [workingHours, setWorkingHours] = useState<any>({
        seg: { open: true },
        ter: { open: true },
        qua: { open: true },
        qui: { open: true },
        sex: { open: true },
        sab: { open: true },
        dom: { open: false }
    })
    const [isDraggingDays, setIsDraggingDays] = useState(false)
    const [dragAction, setDragAction] = useState<boolean | null>(null)
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
        setLunchStart("")
        setLunchEnd("")
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
        setLunchStart(barber.lunch_start || "")
        setLunchEnd(barber.lunch_end || "")
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
                    <h4 className="font-medium text-sm text-[var(--text-secondary)]">Equipe Atual</h4>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Gerencie os profissionais que atuam nesta unidade.</p>
                </div>
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-black font-bold h-10 px-4"
                            onClick={() => {
                                setEditingId(null)
                                setName("")
                                setPhotoUrl("")
                                setRole("Funcionario")
                                setWorkStart("")
                                setWorkEnd("")
                                setLunchStart("")
                                setLunchEnd("")
                                setHasLunchBreak(false)
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Profissional
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] max-w-[520px] p-0 flex flex-col gap-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-4 border-b border-[var(--border-color)]">
                            <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">{editingId ? "Editar Profissional" : "Adicionar Profissional"}</DialogTitle>
                            <DialogDescription className="text-[var(--text-secondary)] mt-1">
                                {editingId ? "Atualize os detalhes cadastrais do profissional." : "Preencha as informações do novo membro da barbearia."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8">
                            {/* BLOCO: INFORMAÇÕES PESSOAIS */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--accent-primary)]">Informações do profissional</h3>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Preencha os dados básicos do membro da equipe.</p>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="space-y-2">
                                            <Label className="text-[var(--text-secondary)] text-xs">Nome Completo <span className="text-[var(--accent-primary)]">*</span></Label>
                                            <Input
                                                placeholder="João Silva"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="bg-[var(--bg-input)] border-[var(--border-color)] h-11 text-base focus-visible:ring-[var(--accent-primary)] transition-all text-[var(--text-primary)]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[var(--text-secondary)] text-xs">Cargo / Função <span className="text-[var(--accent-primary)]">*</span></Label>
                                            <Select value={role} onValueChange={setRole}>
                                                <SelectTrigger className="w-full bg-[var(--bg-input)] border-[var(--border-color)] focus:ring-[var(--accent-primary)] transition-colors h-11 text-[var(--text-primary)]">
                                                    <SelectValue placeholder="Selecione o cargo" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]">
                                                    <SelectItem value="Dono">Dono</SelectItem>
                                                    <SelectItem value="Funcionario">Funcionário</SelectItem>
                                                    <SelectItem value="Recepcionista">Recepcionista</SelectItem>
                                                    <SelectItem value="Freelancer">Freelancer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2 flex flex-col items-start w-full">
                                        <Label className="text-[var(--text-secondary)] text-xs">Foto de Perfil</Label>
                                        <div className="border bg-[var(--bg-input)] hover:bg-[var(--bg-page)] border-[var(--border-color)] transition-colors rounded-xl overflow-hidden flex flex-col justify-center items-center h-28 w-28 relative group shadow-sm">
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
                            </div>

                            {/* BLOCO: HORÁRIO DE TRABALHO */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--accent-primary)]">Horário de trabalho</h3>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Defina os turnos específicos apenas para este profissional.</p>
                                </div>

                                <div className="space-y-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-5">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="flex items-center gap-3 w-full flex-col sm:flex-row">
                                            <div className="flex items-center gap-2 w-full">
                                                <Input
                                                    type="time"
                                                    value={workStart}
                                                    onChange={e => setWorkStart(e.target.value)}
                                                    className="bg-[var(--bg-page)] border-[var(--border-color)] h-11 text-sm text-center font-mono w-full text-[var(--text-primary)]"
                                                />
                                                <span className="text-[var(--text-muted)] text-sm font-medium">—</span>
                                                <Input
                                                    type="time"
                                                    value={workEnd}
                                                    onChange={e => setWorkEnd(e.target.value)}
                                                    className="bg-[var(--bg-page)] border-[var(--border-color)] h-11 text-sm text-center font-mono w-full text-[var(--text-primary)]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {!hasLunchBreak ? (
                                        <div className="pt-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setHasLunchBreak(true)}
                                                className="h-8 px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors w-full sm:w-auto"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                Adicionar pausa
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="pt-4 mt-4 border-t border-[var(--border-color)] space-y-3 relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-[var(--text-secondary)]">Pausa almoço</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setHasLunchBreak(false)
                                                        setLunchStart("")
                                                        setLunchEnd("")
                                                    }}
                                                    className="h-6 w-6 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2 w-full">
                                                <Input
                                                    type="time"
                                                    value={lunchStart}
                                                    onChange={e => setLunchStart(e.target.value)}
                                                    className="bg-[var(--bg-page)]/50 border-transparent focus-visible:border-[var(--border-color)] h-10 text-sm text-center font-mono text-[var(--text-secondary)] w-full"
                                                />
                                                <span className="text-[var(--text-muted)] text-sm font-medium">—</span>
                                                <Input
                                                    type="time"
                                                    value={lunchEnd}
                                                    onChange={e => setLunchEnd(e.target.value)}
                                                    className="bg-[var(--bg-page)]/50 border-transparent focus-visible:border-[var(--border-color)] h-10 text-sm text-center font-mono text-[var(--text-secondary)] w-full"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* BLOCO: DIAS DE TRABALHO */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--accent-primary)]">Dias de trabalho</h3>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Selecione os dias da semana em que o membro estará disponível.</p>
                                </div>

                                <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-5 space-y-5">
                                    {/* AÇÕES RÁPIDAS */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Ações rápidas</Label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    const newHours = { ...workingHours };
                                                    Object.keys(newHours).forEach(k => newHours[k].open = true);
                                                    setWorkingHours(newHours);
                                                }}
                                                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-transparent border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                            >
                                                Todos
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    const newHours = { ...workingHours };
                                                    ['seg', 'ter', 'qua', 'qui', 'sex'].forEach(k => newHours[k].open = true);
                                                    ['sab', 'dom'].forEach(k => newHours[k].open = false);
                                                    setWorkingHours(newHours);
                                                }}
                                                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-transparent border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                            >
                                                Seg-Sex
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    const newHours = { ...workingHours };
                                                    ['sab', 'dom'].forEach(k => newHours[k].open = true);
                                                    ['seg', 'ter', 'qua', 'qui', 'sex'].forEach(k => newHours[k].open = false);
                                                    setWorkingHours(newHours);
                                                }}
                                                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-transparent border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                            >
                                                Fim de Semana
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                    const newHours = { ...workingHours };
                                                    Object.keys(newHours).forEach(k => newHours[k].open = false);
                                                    setWorkingHours(newHours);
                                                }}
                                                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-transparent border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors sm:ml-auto"
                                            >
                                                Limpar
                                            </Button>
                                        </div>
                                    </div>

                                        <div className="w-full h-[1px] bg-[var(--border-color)]" />

                                    {/* GRID DE DIAS */}
                                    <div
                                        className="space-y-3"
                                        onMouseLeave={() => { setIsDraggingDays(false); setDragAction(null); }}
                                        onMouseUp={() => { setIsDraggingDays(false); setDragAction(null); }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                                Seleção de dias
                                            </Label>
                                            <span className="text-[10px] font-medium text-[var(--text-muted)] hidden sm:inline-block">Arraste para selecionar vários</span>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                            {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        const newValue = !workingHours[day]?.open;
                                                        setIsDraggingDays(true);
                                                        setDragAction(newValue);
                                                        setWorkingHours((prev: any) => ({ ...prev, [day]: { ...prev[day], open: newValue } }));
                                                    }}
                                                    onMouseEnter={() => {
                                                        if (isDraggingDays && dragAction !== null) {
                                                            setWorkingHours((prev: any) => ({ ...prev, [day]: { ...prev[day], open: dragAction } }));
                                                        }
                                                    }}
                                                    className={`h-10 rounded-md text-[11px] font-bold uppercase transition-all duration-200 border w-full text-center select-none outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] ${workingHours[day]?.open
                                                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/15 hover:border-[var(--accent-primary)]/50'
                                                        : 'bg-[var(--bg-page)]/40 text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--hover-bg)] hover:border-[var(--border-color)]/80'
                                                        }`}
                                                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[var(--border-color)] flex flex-col-reverse sm:flex-row justify-end gap-3 bg-[var(--bg-card)]">
                            <Button
                                variant="ghost"
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] h-11 w-full sm:w-auto transition-colors"
                                onClick={() => {
                                    setModalOpen(false)
                                    resetForm()
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveBarber}
                                disabled={loading || !name || !role}
                                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-black font-bold h-11 w-full sm:w-auto shadow-lg shadow-[var(--accent-primary)]/20 transition-all hover:scale-[1.02]"
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {loading ? "Processando..." : (editingId ? "Salvar Alterações" : "Adicionar profissional")}
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
                            <div key={barber.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[var(--bg-input)] hover:bg-[var(--bg-card)] transition-colors rounded-xl border border-[var(--border-color)] gap-4 shadow-sm group">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-page)] overflow-hidden shrink-0 border border-[var(--border-color)] shadow-inner">
                                        {barber.photo_url ? (
                                            <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs font-medium bg-[var(--bg-page)]">
                                                {barber.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[var(--text-primary)] text-base">{barber.name}</span>
                                            {barber.role === 'Dono' && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-yellow-500/10 text-[#DBC278] uppercase font-black tracking-wider border border-yellow-500/20">Dono</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col mt-0.5 gap-1 text-xs text-[var(--text-secondary)]">
                                            <span>
                                                {barber.role === 'Recepcionista' || barber.role === 'Freelancer' ? barber.role : (barber.role !== 'Dono' && 'Funcionário')}
                                            </span>
                                            {(barber.work_start && barber.work_end) && (
                                                <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{barber.work_start.substring(0, 5)} — {barber.work_end.substring(0, 5)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-[var(--border-color)] justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-medium border-[var(--border-color)] bg-transparent hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors flex-1 sm:flex-none"
                                        onClick={() => openEditModal(barber)}
                                    >
                                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-medium border-red-900/30 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-colors flex-1 sm:flex-none"
                                        onClick={() => handleRemoveBarber(barber.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                        Excluir
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
