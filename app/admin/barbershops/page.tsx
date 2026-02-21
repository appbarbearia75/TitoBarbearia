"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { Edit, Trash2, Save, X, QrCode, Link, Copy, Check, Download } from "lucide-react"
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor"
import { QRCodeSVG } from "qrcode.react"

export default function BarbershopsPage() {
    const [barbershops, setBarbershops] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingShop, setEditingShop] = useState<any>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        phone: "",
        address: "",
        google_maps_link: "",
        google_reviews_link: "",
        vip_plan_title: "",
        vip_plan_price: "",
        opening_hours: {},
        subscription_status: "active",
        is_active: true
    })
    const [qrShop, setQrShop] = useState<any>(null)
    const [isQrModalOpen, setIsQrModalOpen] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        fetchBarbershops()
    }, [])

    const fetchBarbershops = async () => {
        const { data, error } = await supabase
            .from("barbershops")
            .select("*")
            .order("created_at", { ascending: false })

        if (data) setBarbershops(data)
        setLoading(false)
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setBarbershops(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b))

        const { error } = await supabase
            .from("barbershops")
            .update({ is_active: !currentStatus })
            .eq("id", id)

        if (error) {
            console.error("Error updating status:", error)
            // Revert on error
            fetchBarbershops()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta barbearia? Esta ação não pode ser desfeita.")) return

        const { error } = await supabase
            .from("barbershops")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting barbershop:", error)
            alert("Erro ao excluir barbearia.")
        } else {
            setBarbershops(prev => prev.filter(b => b.id !== id))
        }
    }

    const openEditModal = (shop: any) => {
        setEditingShop(shop)
        setFormData({
            name: shop.name || "",
            slug: shop.slug || "",
            phone: shop.phone || "",
            address: shop.address || "",
            google_maps_link: shop.google_maps_link || "",
            google_reviews_link: shop.google_reviews_link || "",
            vip_plan_title: shop.vip_plan_title || "VIP",
            vip_plan_price: shop.vip_plan_price || "R$ 0,00",
            opening_hours: shop.opening_hours || {
                seg: { open: false, start: "09:00", end: "19:00" },
                ter: { open: true, start: "09:00", end: "19:00" },
                qua: { open: true, start: "09:00", end: "19:00" },
                qui: { open: true, start: "09:00", end: "19:00" },
                sex: { open: true, start: "09:00", end: "19:00" },
                sab: { open: true, start: "09:00", end: "18:00" },
                dom: { open: false, start: "09:00", end: "13:00" },
            },
            subscription_status: shop.subscription_status || "active",
            is_active: shop.is_active
        })
        setIsEditModalOpen(true)
    }

    const handleSave = async () => {
        if (!editingShop) return

        const { error } = await supabase
            .from("barbershops")
            .update({
                name: formData.name,
                slug: formData.slug,
                phone: formData.phone,
                address: formData.address,
                google_maps_link: formData.google_maps_link,
                google_reviews_link: formData.google_reviews_link,
                vip_plan_title: formData.vip_plan_title,
                vip_plan_price: formData.vip_plan_price,
                opening_hours: formData.opening_hours,
                subscription_status: formData.subscription_status,
                is_active: formData.is_active
            })
            .eq("id", editingShop.id)

        if (error) {
            console.error("Error updating barbershop:", error)
            alert("Erro ao atualizar barbearia.")
        } else {
            setBarbershops(prev => prev.map(b => b.id === editingShop.id ? { ...b, ...formData } : b))
            setIsEditModalOpen(false)
            setEditingShop(null)
        }
    }

    const copyLink = (slug: string, id: string) => {
        const url = `${window.location.origin}/${slug}`
        navigator.clipboard.writeText(url)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const openQrModal = (shop: any) => {
        setQrShop(shop)
        setIsQrModalOpen(true)
    }

    const downloadQrCode = () => {
        const svg = document.querySelector("#qr-code-svg")
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()

        img.onload = () => {
            canvas.width = 1000
            canvas.height = 1000
            ctx?.drawImage(img, 0, 0, 1000, 1000)
            const pngFile = canvas.toDataURL("image/png")
            const downloadLink = document.createElement("a")
            downloadLink.download = `qrcode-${qrShop.slug}.png`
            downloadLink.href = pngFile
            downloadLink.click()
        }

        img.src = "data:image/svg+xml;base64," + btoa(svgData)
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Barbearias</h1>
                    <p className="text-neutral-400">Gerencie todas as barbearias cadastradas no sistema.</p>
                </div>
            </div>

            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                <CardHeader>
                    <CardTitle>Todas as Barbearias</CardTitle>
                    <CardDescription>Lista completa de clientes da plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-neutral-400">Barbearia</TableHead>
                                <TableHead className="text-neutral-400">Slug</TableHead>
                                <TableHead className="text-neutral-400">Data Cadastro</TableHead>
                                <TableHead className="text-neutral-400">Status Assinatura</TableHead>
                                <TableHead className="text-neutral-400">Ativo</TableHead>
                                <TableHead className="text-neutral-400 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                                </TableRow>
                            ) : barbershops.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-neutral-500">Nenhuma barbearia encontrada.</TableCell>
                                </TableRow>
                            ) : (
                                barbershops.map((shop) => (
                                    <TableRow key={shop.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={shop.avatar_url} />
                                                <AvatarFallback>{shop.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{shop.name}</span>
                                                <span className="text-xs text-neutral-500">{shop.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{shop.slug}</TableCell>
                                        <TableCell>{format(new Date(shop.created_at), "dd/MM/yyyy")}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`
                                                ${shop.subscription_status === 'active' ? 'border-green-500/30 text-green-500 bg-green-500/10' : ''}
                                                ${shop.subscription_status === 'inactive' ? 'border-red-500/30 text-red-500 bg-red-500/10' : ''}
                                                ${shop.subscription_status === 'trial' ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' : ''}
                                            `}>
                                                {shop.subscription_status || "active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={shop.is_active}
                                                onCheckedChange={() => toggleStatus(shop.id, shop.is_active)}
                                                className="data-[state=checked]:bg-[#DBC278] data-[state=unchecked]:bg-zinc-600 border-zinc-500"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-[#DBC278]"
                                                    onClick={() => copyLink(shop.slug, shop.id)}
                                                    title="Copiar Link"
                                                >
                                                    {copiedId === shop.id ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-[#DBC278]"
                                                    onClick={() => openQrModal(shop)}
                                                    title="Gerar QR Code"
                                                >
                                                    <QrCode className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-white" onClick={() => openEditModal(shop)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/20 text-zinc-400 hover:text-red-500" onClick={() => handleDelete(shop.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-[#1c1c1c] border-zinc-800 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Barbearia</DialogTitle>
                        <DialogDescription>
                            Faça alterações nas informações da barbearia.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Barbearia</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (URL)</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Endereço</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="google_maps_link">Link Google Maps</Label>
                            <Input
                                id="google_maps_link"
                                value={formData.google_maps_link}
                                onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="google_reviews_link">Link Avaliações Google</Label>
                            <Input
                                id="google_reviews_link"
                                value={formData.google_reviews_link}
                                onChange={(e) => setFormData({ ...formData, google_reviews_link: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vip_plan_title">Nome Plano VIP</Label>
                                <Input
                                    id="vip_plan_title"
                                    value={formData.vip_plan_title}
                                    onChange={(e) => setFormData({ ...formData, vip_plan_title: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vip_plan_price">Preço Plano VIP</Label>
                                <Input
                                    id="vip_plan_price"
                                    value={formData.vip_plan_price}
                                    onChange={(e) => setFormData({ ...formData, vip_plan_price: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 border-t border-zinc-800 pt-4">
                            <Label>Horários de Atendimento</Label>
                            <WorkingHoursEditor
                                value={formData.opening_hours as any}
                                onChange={(newHours) => setFormData({ ...formData, opening_hours: newHours })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subscription">Plano</Label>
                            <Select
                                value={formData.subscription_status}
                                onValueChange={(value) => setFormData({ ...formData, subscription_status: value })}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="Selecione o plano" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="active">Ativo</SelectItem>
                                    <SelectItem value="inactive">Inativo</SelectItem>
                                    <SelectItem value="trial">Trial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 bg-zinc-900/50">
                            <div className="space-y-0.5">
                                <Label className="text-base">Agenda Ativa</Label>
                                <p className="text-xs text-zinc-500">
                                    Desativar irá impedir novos agendamentos.
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                className="data-[state=checked]:bg-[#DBC278] data-[state=unchecked]:bg-zinc-600 border-zinc-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-[#DBC278] text-black hover:bg-[#c4ad6b]">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
                <DialogContent className="bg-[#1c1c1c] border-zinc-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>QR Code da Barbearia</DialogTitle>
                        <DialogDescription>
                            QR Code permanente para acesso direto à agenda.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-10 space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-2xl">
                            {qrShop && (
                                <QRCodeSVG
                                    id="qr-code-svg"
                                    value={`${window.location.origin}/${qrShop.slug}`}
                                    size={256}
                                    level="H"
                                    includeMargin={false}
                                />
                            )}
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-[#DBC278]">{qrShop?.name}</h3>
                            <p className="text-sm text-zinc-500 font-mono mt-1">
                                {window.location.origin}/{qrShop?.slug}
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-row justify-between sm:justify-between items-center sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsQrModalOpen(false)}>
                            Fechar
                        </Button>
                        <Button
                            onClick={downloadQrCode}
                            className="bg-[#DBC278] text-black hover:bg-[#c4ad6b]"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar PNG
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
