"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, Pencil, Loader2, Package } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

function EditProductModal({
    isOpen,
    onOpenChange,
    product,
    onSave
}: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    product: any,
    onSave: (updatedProduct: any) => Promise<void>
}) {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [stockQuantity, setStockQuantity] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (product) {
            setName(product.name || "")
            const priceVal = (Number(product.price) * 100).toString()
            setPrice(formatCurrencyInternal(priceVal))
            setStockQuantity(String(product.stock_quantity || 0))
        }
    }, [product])

    const formatCurrencyInternal = (value: string) => {
        const numericValue = value.replace(/\D/g, "")
        const amount = Number(numericValue) / 100
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(amount)
    }

    const handleSave = async () => {
        setLoading(true)
        const priceNumeric = Number(price.replace(/\D/g, "")) / 100
        const stockNumeric = parseInt(stockQuantity.replace(/\D/g, "")) || 0

        await onSave({
            ...product,
            name,
            price: priceNumeric,
            stock_quantity: stockNumeric
        })
        setLoading(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#09090b] border-[#DBC278]/20 text-white shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[500px] overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-[#DBC278]/10 blur-[50px] pointer-events-none" />

                <DialogHeader className="relative z-10">
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Package className="w-6 h-6 text-[#DBC278]" />
                        Editar Produto
                    </DialogTitle>
                </DialogHeader>

                <div className="relative z-10 grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Nome do Produto</Label>
                        <Input
                            placeholder="ex: Pomada Efeito Matte"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Valor de Venda</Label>
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
                            <Label className="text-zinc-300">Qtd em Estoque</Label>
                            <Input
                                placeholder="0"
                                type="number"
                                min="0"
                                value={stockQuantity}
                                onChange={(e) => setStockQuantity(e.target.value)}
                                className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="relative z-10 border-t border-white/5 pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white hover:bg-white/5">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading || !name} className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold shadow-[0_0_15px_rgba(219,194,120,0.3)] transition-all">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ProductsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)
    const [newProduct, setNewProduct] = useState({
        name: "",
        price: "0,00",
        stock_quantity: "0"
    })

    useEffect(() => {
        fetchProducts()
    }, [slug])

    const fetchProducts = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()

        if (barbershop) {
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('barbershop_id', barbershop.id)
                .order('created_at', { ascending: false })

            if (data) setProducts(data)
        }
        setLoading(false)
    }

    const handleEditSave = async (updatedProduct: any) => {
        const { error } = await supabase
            .from('products')
            .update({
                name: updatedProduct.name,
                price: updatedProduct.price,
                stock_quantity: updatedProduct.stock_quantity
            })
            .eq('id', updatedProduct.id)

        if (error) {
            console.error("Error updating product:", error)
            alert("Erro ao atualizar produto.")
        } else {
            fetchProducts()
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

    const handleCreate = async () => {
        if (!newProduct.name || !newProduct.price) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const priceNumeric = Number(newProduct.price.replace(/\D/g, "")) / 100
            const stockNumeric = parseInt(newProduct.stock_quantity.replace(/\D/g, "")) || 0

            const { error } = await supabase.from('products').insert([
                {
                    barbershop_id: user.id,
                    name: newProduct.name,
                    price: priceNumeric,
                    stock_quantity: stockNumeric
                }
            ])

            if (error) throw error

            setNewProduct({ name: "", price: "0,00", stock_quantity: "0" })
            setIsCreating(false)
            fetchProducts()

        } catch (error) {
            console.error("Error creating product:", error)
            alert("Erro ao cadastrar produto.")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este produto do estoque? Ele é excluído permanente do menu de vendas.")) return

        const { error } = await supabase.from('products').delete().eq('id', id)
        if (!error) fetchProducts()
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Package className="w-8 h-8 text-[#DBC278]" />
                        Produtos
                    </h1>
                    <p className="text-zinc-400 mt-1 text-sm sm:text-base">Gerencie o estoque e valores de produtos sendo vendidos na Barbearia.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={() => setIsCreating(true)} className="bg-[#DBC278] hover:bg-[#c9b06b] w-full sm:w-auto text-black font-bold shadow-[0_0_20px_rgba(219,194,120,0.2)] hover:shadow-[0_0_30px_rgba(219,194,120,0.4)] transition-all duration-300">
                        <Plus className="w-4 h-4 mr-2" />
                        Cadastrar Produto
                    </Button>
                </div>
            </div>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="bg-[#09090b] border-[#DBC278]/20 text-white shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[500px] overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-[#DBC278]/10 blur-[50px] pointer-events-none" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            <Plus className="w-6 h-6 text-[#DBC278]" />
                            Novo Produto
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative z-10 grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Nome do Produto</Label>
                            <Input
                                placeholder="ex: Pomada Efeito Matte 150g"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Valor de Venda</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
                                    <Input
                                        placeholder="0,00"
                                        value={newProduct.price.replace("R$ ", "")}
                                        onChange={(e) => {
                                            const formatted = formatCurrency(e.target.value)
                                            setNewProduct(prev => ({ ...prev, price: formatted }))
                                        }}
                                        className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50 pl-9 font-bold text-[#DBC278]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Estoque Inicial</Label>
                                <Input
                                    placeholder="0"
                                    type="number"
                                    min="0"
                                    value={newProduct.stock_quantity}
                                    onChange={(e) => {
                                        setNewProduct(prev => ({ ...prev, stock_quantity: e.target.value }))
                                    }}
                                    className="bg-[#1c1c1c] border-white/10 focus-visible:ring-[#DBC278]/50"
                                />
                            </div>
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
                            disabled={!newProduct.name || !newProduct.price}
                            className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold shadow-[0_0_15px_rgba(219,194,120,0.3)] transition-all"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Cadastrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl shadow-black/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50 block md:table-row">
                                <TableHead className="text-zinc-400 font-bold hidden md:table-cell">Produto</TableHead>
                                <TableHead className="text-zinc-400 font-bold hidden md:table-cell">Preço</TableHead>
                                <TableHead className="text-zinc-400 font-bold hidden md:table-cell">Estoque</TableHead>
                                <TableHead className="text-right text-zinc-400 font-bold hidden md:table-cell pr-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#DBC278]" />
                                    </TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                                        <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        Nenhum produto em estoque.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id} className="border-zinc-800/50 hover:bg-zinc-800/30 group transition-colors block md:table-row px-4 py-4 border-b last:border-0 md:px-0 md:py-0 relative">
                                        <TableCell className="font-bold text-lg md:text-base md:table-cell p-0 md:p-4 mb-2 md:mb-0 block">
                                            {product.name}
                                        </TableCell>
                                        <TableCell className="text-[#DBC278] font-bold md:table-cell p-0 md:p-4 mb-3 md:mb-0 block">
                                            R$ {Number(product.price).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="md:table-cell p-0 md:p-4 block">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${product.stock_quantity > 5
                                                ? 'bg-green-500/20 text-green-400'
                                                : product.stock_quantity > 0
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {product.stock_quantity} unidades
                                            </span>
                                        </TableCell>
                                        <TableCell className="absolute right-4 bottom-4 md:relative md:right-0 md:bottom-0 text-right flex justify-end gap-2 md:table-cell p-0 md:p-4">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 md:bg-transparent"
                                                    onClick={() => setEditingProduct(product)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-red-500 hover:text-white hover:bg-red-600 bg-red-500/10 md:bg-transparent"
                                                    onClick={() => handleDelete(product.id)}
                                                >
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

            <EditProductModal
                isOpen={!!editingProduct}
                onOpenChange={(open) => !open && setEditingProduct(null)}
                product={editingProduct}
                onSave={handleEditSave}
            />
        </div>
    )
}
