"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, Pencil, Loader2, Package, Search, MoveUp, AlertTriangle, DollarSign, TrendingUp, SearchX } from "lucide-react"
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

const formatCurrencyInternal = (value: string | number) => {
    if (typeof value === "number") {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }
    const numericValue = value.replace(/\D/g, "")
    const amount = Number(numericValue) / 100
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(amount)
}

function ProductModal({
    isOpen,
    onOpenChange,
    product,
    onSave,
    isCreating
}: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    product: any,
    onSave: (updatedProduct: any) => Promise<void>,
    isCreating?: boolean
}) {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("0,00")
    const [costPrice, setCostPrice] = useState("0,00")
    const [stockQuantity, setStockQuantity] = useState("0")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (product && !isCreating && product.id) {
                setName(product.name || "")
                const priceVal = (Number(product.price) * 100).toString()
                setPrice(formatCurrencyInternal(priceVal))
                
                const costVal = (Number(product.cost_price || 0) * 100).toString()
                setCostPrice(formatCurrencyInternal(costVal))

                setStockQuantity(String(product.stock_quantity || 0))
            } else {
                setName("")
                setPrice("0,00")
                setCostPrice("0,00")
                setStockQuantity("0")
            }
        }
    }, [product, isOpen, isCreating])

    const handleSave = async () => {
        setLoading(true)
        const priceNumeric = Number(price.replace(/\D/g, "")) / 100
        const costNumeric = Number(costPrice.replace(/\D/g, "")) / 100
        const stockNumeric = parseInt(stockQuantity.replace(/\D/g, "")) || 0

        await onSave({
            ...product,
            name,
            price: priceNumeric,
            cost_price: costNumeric,
            stock_quantity: stockNumeric
        })
        setLoading(false)
        onOpenChange(false)
    }

    // Calculo do Lucro na pré-visualização do Modal
    const p = Number(price.replace(/\D/g, "")) / 100
    const c = Number(costPrice.replace(/\D/g, "")) / 100
    const profit = p - c
    const margin = p > 0 ? (profit / p) * 100 : 0

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-2xl sm:max-w-[500px] overflow-hidden p-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-[var(--accent-primary)]/10 blur-[50px] pointer-events-none" />

                <DialogHeader className="relative z-10 p-6 pb-4 border-b border-[var(--border-color)]">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                        {isCreating ? <Plus className="w-5 h-5 text-[var(--accent-primary)]" /> : <Package className="w-5 h-5 text-[var(--accent-primary)]" />}
                        {isCreating ? "Novo Produto" : "Editar Produto"}
                    </DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)] mt-1 text-sm">
                        {isCreating ? "Preencha as informações do produto, incluindo custo para relatório de lucro." : "Atualize valores de venda, custo ou estoque."}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative z-10 grid gap-6 p-6">
                    <div className="space-y-2">
                        <Label className="text-[var(--text-secondary)]">Nome do Produto <span className="text-red-500">*</span></Label>
                        <Input
                            placeholder="ex: Pomada Efeito Matte 150g"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)] h-11"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">Custo de Compra</Label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold group-focus-within:text-[var(--accent-primary)] transition-colors">R$</span>
                                <Input
                                    placeholder="0,00"
                                    value={costPrice.replace("R$ ", "")}
                                    onChange={(e) => setCostPrice(formatCurrencyInternal(e.target.value))}
                                    className="bg-[var(--bg-page)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] pl-10 font-medium text-[var(--text-primary)] h-11"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">Preço de Venda <span className="text-[var(--accent-primary)]">*</span></Label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold group-focus-within:text-[var(--accent-primary)] transition-colors">R$</span>
                                <Input
                                    placeholder="0,00"
                                    value={price.replace("R$ ", "")}
                                    onChange={(e) => setPrice(formatCurrencyInternal(e.target.value))}
                                    className="bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] pl-10 font-bold text-[var(--accent-primary)] h-11"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Simulação de Lucro Visual */}
                    {p > 0 && (
                        <div className="bg-[var(--bg-page)]/50 border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mb-1">Lucro Estimado</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-black text-lg ${profit > 0 ? 'text-[var(--success-color)]' : 'text-[var(--danger-color)]'}`}>
                                        + {formatCurrencyInternal(profit)}
                                    </span>
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${profit > 0 ? 'bg-[var(--success-color)]/20 text-[var(--success-color)]' : 'bg-[var(--danger-color)]/20 text-[var(--danger-color)]'}`}>
                                        {margin.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <TrendingUp className={`w-8 h-8 opacity-20 ${profit > 0 ? 'text-[var(--success-color)]' : 'text-[var(--danger-color)]'}`} />
                        </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                        <Label className="text-[var(--text-secondary)] font-bold">Estoque Inicial / Atual</Label>
                        <Input
                            placeholder="0"
                            type="number"
                            min="0"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            className="bg-[var(--bg-input)] border-[var(--border-color)] focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)] w-full h-11"
                        />
                    </div>
                </div>

                <DialogFooter className="relative z-10 border-t border-[var(--border-color)] p-4 bg-[var(--bg-input)]/50 gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] w-full sm:w-auto h-11">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading || !name} className="bg-[var(--accent-primary)] hover:bg-black/40 text-black font-bold shadow-lg transition-all h-11 w-full sm:w-auto mt-2 sm:mt-0">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {isCreating ? "Cadastrar Produto" : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AddStockModal({
    isOpen,
    onOpenChange,
    product,
    onSave
}: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    product: any,
    onSave: (id: string, qtyObj: { increment: number }) => Promise<void>
}) {
    const [increment, setIncrement] = useState("1")
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const incNumeric = parseInt(increment.replace(/\D/g, "")) || 0
        if (incNumeric > 0) {
            await onSave(product.id, { increment: incNumeric })
        }
        setLoading(false)
        onOpenChange(false)
        setIncrement("1")
    }

    if (!product) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">Entrada de Estoque</DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)]">
                        Adicionando unidades ao produto <strong className="text-[var(--text-primary)]">{product.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[var(--bg-page)] rounded-lg border border-[var(--border-color)]">
                        <span className="text-[var(--text-secondary)] text-sm font-medium">Estoque Atual:</span>
                        <span className="text-[var(--text-primary)] font-bold text-lg">{product.stock_quantity} un</span>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[var(--text-secondary)]">Quantidade a adicionar (+)</Label>
                        <Input
                            type="number"
                            min="1"
                            value={increment}
                            onChange={(e) => setIncrement(e.target.value)}
                            className="bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)] font-bold text-center h-12 text-lg focus-visible:ring-[var(--success-color)]"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-[var(--hover-bg)] text-[var(--text-primary)]">Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading || !increment} className="bg-[var(--success-color)] text-white hover:bg-[var(--success-color)]/90 font-bold mt-2 sm:mt-0">
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Confirmar Entrada
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
    const [addingStockProduct, setAddingStockProduct] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")

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

    const handleSaveProduct = async (updatedProduct: any) => {
        const updateData: any = {
            name: updatedProduct.name,
            price: updatedProduct.price,
            stock_quantity: updatedProduct.stock_quantity
        }

        // Tentar enviar cost_price se o banco aceitar, senão deixamos quieto
        if (updatedProduct.cost_price !== undefined) {
             updateData.cost_price = updatedProduct.cost_price;
        }

        if (updatedProduct.id) {
            const { error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', updatedProduct.id)

            if (error) {
                console.error("Error updating product:", error)
                // Fallback para caso não exista coluna cost_price
                if (error.code === 'PGRST204' || String(error.message).includes('cost_price')) {
                    delete updateData.cost_price;
                    await supabase.from('products').update(updateData).eq('id', updatedProduct.id)
                    alert("Aviso: o campo 'Custo' não foi salvo porque a coluna 'cost_price' não existe no banco de dados. Contate o administrador.");
                } else {
                    alert("Erro ao atualizar produto.");
                }
            }
            fetchProducts()
        } else {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()

                if (!barbershop) return;

                updateData.barbershop_id = barbershop.id;

                const { error } = await supabase.from('products').insert([updateData])

                if (error) {
                    if (error.code === 'PGRST204' || String(error.message).includes('cost_price')) {
                        delete updateData.cost_price;
                        await supabase.from('products').insert([updateData])
                        alert("Produto criado com sucesso! Porém o campo 'Custo' não foi salvo. Crie a coluna 'cost_price' no Supabase.");
                    } else {
                        throw error;
                    }
                }
                
                fetchProducts()
            } catch (error) {
                console.error("Error creating product:", error)
                alert("Erro ao cadastrar produto.")
            }
        }
    }

    const handleAddStock = async (id: string, { increment }: { increment: number }) => {
        const prod = products.find(p => p.id === id)
        if (!prod) return
        
        const newStock = prod.stock_quantity + increment
        const { error } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', id)
        
        if (!error) fetchProducts()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este produto do estoque? Ele é excluído permanente do menu de vendas.")) return

        const { error } = await supabase.from('products').delete().eq('id', id)
        if (!error) fetchProducts()
    }

    // Calcula de Variáveis Derivadas
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [products, searchTerm])

    // KPIs
    const totalProducts = products.length
    const itemsInStock = products.reduce((acc, curr) => acc + (curr.stock_quantity || 0), 0)
    const lowStockItems = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length
    const totalStockValue = products.reduce((acc, curr) => acc + ((curr.stock_quantity || 0) * (curr.price || 0)), 0)

    // Achar o maior estoque para a barra visual da Tabela Desktop
    const maxStock = products.length > 0 ? Math.max(...products.map(p => p.stock_quantity || 0)) : 1

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
                        <Package className="w-8 h-8 text-[var(--accent-primary)]" />
                        Produtos & Estoque
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">Controle seu inventário, custo de compras e margem de lucro.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={() => setIsCreating(true)} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 w-full sm:w-auto text-black font-bold shadow-lg shadow-[var(--accent-primary)]/20 transition-all duration-300">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Produto
                    </Button>
                </div>
            </div>

            {/* KPI Cards Area */}
            {products.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Package className="w-16 h-16 text-[var(--text-primary)]" />
                        </div>
                        <CardContent className="p-5">
                            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Total de Produtos</p>
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">{totalProducts}</h3>
                        </CardContent>
                    </Card>

                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <MoveUp className="w-16 h-16 text-[var(--text-primary)]" />
                        </div>
                        <CardContent className="p-5">
                            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Itens em Estoque</p>
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">{itemsInStock}</h3>
                        </CardContent>
                    </Card>

                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign className="w-16 h-16 text-[var(--text-primary)]" />
                        </div>
                        <CardContent className="p-5">
                            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Valor do Venda Tot.</p>
                            <h3 className="text-2xl font-black text-[var(--accent-primary)]">{formatCurrencyInternal(totalStockValue)}</h3>
                        </CardContent>
                    </Card>

                    <Card className="bg-[var(--bg-card)] border-[var(--danger-color)]/20 overflow-hidden relative group shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle className="w-16 h-16 text-[var(--danger-color)]" />
                        </div>
                        <CardContent className="p-5">
                            <p className="text-[var(--danger-color)] text-xs font-bold uppercase tracking-wider mb-1">Estoque Baixo (≤ 5)</p>
                            <h3 className="text-2xl font-black text-[var(--danger-color)]">{lowStockItems} produtos</h3>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Controle / Busca */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <Input 
                    placeholder="Buscar produto por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 pl-10 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] focus-visible:ring-[var(--accent-primary)] shadow-sm rounded-xl text-md"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)] mb-4" />
                    <span className="text-[var(--text-muted)]">Carregando estoque...</span>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-center">
                    {searchTerm ? (
                        <>
                            <SearchX className="w-16 h-16 text-[var(--text-muted)] mb-4 opacity-30" />
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Nenhum produto encontrado</h3>
                            <p className="text-[var(--text-secondary)]">Sua busca por "{searchTerm}" não retornou resultados.</p>
                            <Button variant="link" onClick={() => setSearchTerm("")} className="text-[var(--accent-primary)] mt-2">Limpar busca</Button>
                        </>
                    ) : (
                        <>
                            <Package className="w-16 h-16 text-[var(--text-muted)] mb-4 opacity-30" />
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Seu estoque está vazio</h3>
                            <p className="text-[var(--text-secondary)] mb-4">Cadastre seu primeiro produto para começar a vender e gerenciar no sistema.</p>
                            <Button onClick={() => setIsCreating(true)} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-black font-bold">
                                Cadastrar Primeiro Produto
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <>
                    {/* DESKTOP TABLE */}
                    <Card className="hidden lg:block bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-[var(--border-color)] hover:bg-[var(--bg-page)]/50 bg-[var(--bg-page)]">
                                    <TableHead className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider whitespace-nowrap">Produto</TableHead>
                                    <TableHead className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">Custo / Venda</TableHead>
                                    <TableHead className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">Lucro (u.)</TableHead>
                                    <TableHead className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider w-[250px]">Status Estoque</TableHead>
                                    <TableHead className="text-right text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => {
                                    const custo = Number(product.cost_price || 0)
                                    const venda = Number(product.price || 0)
                                    const lucro = venda - custo
                                    const lucroRatio = venda > 0 ? (lucro / venda) * 100 : 0
                                    
                                    const statusColor = product.stock_quantity > 5
                                            ? 'bg-[var(--success-color)]'
                                            : product.stock_quantity > 0
                                                ? 'bg-[var(--warning-color)]'
                                                : 'bg-[var(--danger-color)]'
                                                
                                    const stockWidth = Math.min(100, (product.stock_quantity / maxStock) * 100)

                                    return (
                                        <TableRow key={product.id} className="border-[var(--border-color)] hover:bg-[var(--table-row-hover)] transition-colors h-16">
                                            <TableCell className="font-bold text-[var(--text-primary)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-page)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                                                        <Package className="w-5 h-5 text-[var(--text-muted)]" />
                                                    </div>
                                                    <span className="truncate max-w-[200px]" title={product.name}>{product.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider line-through decoration-[var(--border-color)]">
                                                        C {formatCurrencyInternal(custo)}
                                                    </span>
                                                    <span className="text-[var(--text-primary)] font-bold">
                                                        {formatCurrencyInternal(venda)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-start gap-1 w-max">
                                                    <span className={`font-bold ${lucro > 0 ? 'text-[var(--success-color)]' : 'text-[var(--text-muted)]'}`}>
                                                        {formatCurrencyInternal(lucro)}
                                                    </span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-black tracking-wider ${lucro > 0 ? 'bg-[var(--success-color)]/10 text-[var(--success-color)]' : 'bg-[var(--bg-page)] text-[var(--text-muted)]'}`}>
                                                        {lucroRatio.toFixed(0)}% MARGEM
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5 w-full pr-4">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="font-bold text-[var(--text-primary)]">{product.stock_quantity} un</span>
                                                        <span className={`font-medium ${product.stock_quantity <= 5 ? 'text-[var(--danger-color)]' : 'text-[var(--text-muted)]'}`}>
                                                            {product.stock_quantity === 0 ? "Esgotado" : product.stock_quantity <= 5 ? "Baixo" : "Normal"}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full bg-[var(--bg-page)] rounded-full overflow-hidden border border-[var(--border-color)]/50">
                                                        <div 
                                                            className={`h-full ${statusColor} rounded-full transition-all duration-500`} 
                                                            style={{ width: `${stockWidth}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-[var(--success-color)] hover:bg-[var(--success-color)]/10 hover:text-[var(--success-color)] font-medium h-8 px-2 text-xs"
                                                        onClick={() => setAddingStockProduct(product)}
                                                        title="Adicionar Estoque"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 mr-1" /> Entrar
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-page)]"
                                                        onClick={() => setEditingProduct(product)}
                                                        title="Editar Produto"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-[var(--danger-color)] hover:text-white hover:bg-[var(--danger-color)] bg-transparent"
                                                        onClick={() => handleDelete(product.id)}
                                                        title="Excluir Produto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* MOBILE / TABLET CARDS */}
                    <div className="lg:hidden grid gap-4 grid-cols-1 md:grid-cols-2">
                        {filteredProducts.map((product) => {
                            const custo = Number(product.cost_price || 0)
                            const venda = Number(product.price || 0)
                            const lucro = venda - custo
                            const lucroRatio = venda > 0 ? (lucro / venda) * 100 : 0
                            
                            const isLow = product.stock_quantity <= 5

                            return (
                                <Card key={product.id} className={`bg-[var(--bg-card)] border-[var(--border-color)] overflow-hidden shadow-sm ${isLow ? 'ring-1 ring-[var(--danger-color)]/30' : ''}`}>
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex gap-3 justify-between items-start">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-12 h-12 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                                                    <Package className="w-6 h-6 text-[var(--text-muted)]" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[var(--text-primary)] text-[15px]">{product.name}</span>
                                                    <span className="text-[var(--accent-primary)] font-black text-sm">{formatCurrencyInternal(venda)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center bg-[var(--bg-page)] rounded-md px-3 py-2 border border-[var(--border-color)]">
                                            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Estoque Atual</span>
                                            <span className={`text-sm px-2 py-0.5 rounded font-bold ${isLow ? 'bg-[var(--danger-color)]/10 text-[var(--danger-color)]' : 'bg-[var(--success-color)]/10 text-[var(--success-color)]'}`}>
                                                {product.stock_quantity} un
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col border-r border-[var(--border-color)] pr-4">
                                                <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mb-0.5">Custo Compra</span>
                                                <span className="text-[var(--text-secondary)] font-medium text-sm line-through opacity-70">{formatCurrencyInternal(custo)}</span>
                                            </div>
                                            <div className="flex flex-col pl-2">
                                                <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mb-0.5">Lucro Un.</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`font-bold text-sm ${lucro > 0 ? 'text-[var(--success-color)]' : 'text-[var(--text-muted)]'}`}>{formatCurrencyInternal(lucro)}</span>
                                                    {lucro > 0 && <span className="text-[9px] px-1 py-0.5 bg-[var(--bg-page)] text-[var(--text-muted)] rounded font-bold">{lucroRatio.toFixed(0)}%</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[var(--border-color)]">
                                            <Button
                                                variant="outline"
                                                className="col-span-2 bg-[var(--success-color)]/5 border-transparent text-[var(--success-color)] hover:bg-[var(--success-color)]/10 hover:text-[var(--success-color)] font-bold text-xs h-9"
                                                onClick={() => setAddingStockProduct(product)}
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" /> Entrada Estoque
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] h-9 w-full p-0"
                                                onClick={() => setEditingProduct(product)}
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="bg-[var(--danger-color)]/5 border-transparent text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10 hover:text-[var(--danger-color)] h-9 w-full p-0"
                                                onClick={() => handleDelete(product.id)}
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </>
            )}

            <ProductModal
                isOpen={!!editingProduct || isCreating}
                onOpenChange={(open) => {
                    if (!open) { setEditingProduct(null); setIsCreating(false); }
                }}
                product={editingProduct || {}}
                isCreating={isCreating}
                onSave={handleSaveProduct}
            />

            <AddStockModal
                isOpen={!!addingStockProduct}
                onOpenChange={(open) => !open && setAddingStockProduct(null)}
                product={addingStockProduct}
                onSave={handleAddStock}
            />
        </div>
    )
}
