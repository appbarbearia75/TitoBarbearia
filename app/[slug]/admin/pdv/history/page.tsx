"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Receipt, Calendar, CreditCard, Banknote, Smartphone, Scissors, Package } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { supabase } from "@/lib/supabase"

export default function PDVHistoryPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string

    const [commands, setCommands] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCommand, setSelectedCommand] = useState<any>(null)
    const [commandItems, setCommandItems] = useState<any[]>([])
    const [loadingItems, setLoadingItems] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    useEffect(() => {
        fetchHistory()
    }, [slug])

    const fetchHistory = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (!barbershop) return

        const { data } = await supabase
            .from('commands')
            .select('*')
            .eq('barbershop_id', barbershop.id)
            .eq('status', 'closed')
            .order('closed_at', { ascending: false })
            .limit(100)

        if (data) setCommands(data)
        setLoading(false)
    }

    const loadCommandDetails = async (command: any) => {
        setSelectedCommand(command)
        setLoadingItems(true)

        const { data } = await supabase
            .from('command_items')
            .select('*, barbers(name)')
            .eq('command_id', command.id)

        if (data) setCommandItems(data)
        setLoadingItems(false)
    }

    const handleCancelCommand = async () => {
        if (!selectedCommand) return

        const confirmCancel = window.confirm("Tem certeza que deseja estornar esta comanda? Essa ação não pode ser desfeita. O estoque dos produtos retornará e os agendamentos serão marcados como cancelados.")
        if (!confirmCancel) return

        setIsCancelling(true)
        try {
            // 1. Update Command Status
            const { error: cmdErr } = await supabase
                .from('commands')
                .update({ status: 'cancelled' })
                .eq('id', selectedCommand.id)

            if (cmdErr) throw cmdErr

            // 2. Restore Products Stock
            const products = commandItems.filter(item => item.item_type === 'product' && item.item_id)
            for (const prod of products) {
                const { data: currentProd } = await supabase
                    .from('products')
                    .select('stock_quantity')
                    .eq('id', prod.item_id)
                    .single()

                if (currentProd) {
                    await supabase
                        .from('products')
                        .update({ stock_quantity: currentProd.stock_quantity + prod.quantity })
                        .eq('id', prod.item_id)
                }
            }

            // 3. Cancel related bookings and reset commission
            const { error: bookErr } = await supabase
                .from('bookings')
                .update({
                    status: 'cancelled',
                    commission_earned: 0
                })
                .eq('command_id', selectedCommand.id)

            if (bookErr) console.error("Erro ao cancelar agendamentos:", bookErr)

            alert("Comanda estornada com sucesso!")
            setSelectedCommand(null)
            fetchHistory() // Refresh the list
        } catch (error) {
            console.error("Erro ao estornar comanda:", error)
            alert("Ocorreu um erro ao estornar a comanda.")
        } finally {
            setIsCancelling(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'pix': return <Smartphone className="w-4 h-4 text-emerald-400" />
            case 'credit': return <CreditCard className="w-4 h-4 text-blue-400" />
            case 'debit': return <CreditCard className="w-4 h-4 text-indigo-400" />
            case 'cash': return <Banknote className="w-4 h-4 text-green-500" />
            default: return <Receipt className="w-4 h-4 text-zinc-400" />
        }
    }

    const getPaymentLabel = (method: string) => {
        switch (method) {
            case 'pix': return 'PIX'
            case 'credit': return 'Crédito'
            case 'debit': return 'Débito'
            case 'cash': return 'Dinheiro'
            default: return method
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => router.push(`/${slug}/admin/pdv`)} className="mb-2 -ml-4 text-zinc-400 hover:text-white">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar ao PDV
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Receipt className="w-8 h-8 text-[#DBC278]" />
                        Histórico de Vendas
                    </h1>
                    <p className="text-zinc-400">Visualize todas as comandas fechadas e auditadas.</p>
                </div>
            </div>

            <Card className="bg-[#1c1c1c] border-white/5 text-white shadow-2xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableHead className="text-zinc-400 font-bold px-6">Data / Hora</TableHead>
                                <TableHead className="text-zinc-400 font-bold">Cliente</TableHead>
                                <TableHead className="text-zinc-400 font-bold">Pagamento</TableHead>
                                <TableHead className="text-right text-zinc-400 font-bold px-6">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DBC278]" />
                                    </TableCell>
                                </TableRow>
                            ) : commands.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                                        Nenhuma venda registrada até o momento.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                commands.map((cmd) => (
                                    <TableRow
                                        key={cmd.id}
                                        onClick={() => loadCommandDetails(cmd)}
                                        className="border-zinc-800/50 hover:bg-zinc-800/80 cursor-pointer transition-colors"
                                    >
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-zinc-500" />
                                                <span>{format(new Date(cmd.closed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {cmd.client_name || "Cliente Avulso"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getPaymentIcon(cmd.payment_method)}
                                                <span className="text-sm font-medium text-zinc-300 uppercase">
                                                    {getPaymentLabel(cmd.payment_method)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <span className="text-[#DBC278] font-black text-lg">
                                                {formatCurrency(Number(cmd.total_amount))}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedCommand} onOpenChange={(open) => !open && setSelectedCommand(null)}>
                <DialogContent className="bg-white border-zinc-200 text-black sm:max-w-[450px]">
                    {selectedCommand && (
                        <>
                            <DialogHeader className="border-b border-zinc-200 pb-4">
                                <DialogTitle className="flex flex-col items-center justify-center text-center">
                                    <Receipt className="w-10 h-10 text-zinc-300 mb-2" />
                                    <span className="text-2xl font-black">Recibo da Comanda</span>
                                    <span className="text-sm font-normal text-zinc-500 mt-1">
                                        {format(new Date(selectedCommand.closed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="py-2">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-zinc-500">Cliente:</span>
                                    <span className="font-bold text-black">{selectedCommand.client_name || "Avulso"}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-4">
                                    <span className="text-zinc-500">ID da Comanda:</span>
                                    <span className="font-mono text-xs text-zinc-400">{selectedCommand.id.split('-')[0]}</span>
                                </div>

                                <div className="border-t border-dashed border-zinc-300 py-4 my-2">
                                    <h4 className="text-xs uppercase tracking-widest font-bold text-zinc-400 mb-3">Itens Consumidos</h4>

                                    {loadingItems ? (
                                        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
                                    ) : (
                                        <div className="space-y-3">
                                            {commandItems.map((item) => (
                                                <div key={item.id} className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            {item.item_type === 'service' ? <Scissors className="w-3.5 h-3.5 text-zinc-400" /> : <Package className="w-3.5 h-3.5 text-zinc-400" />}
                                                            <span className="font-bold text-sm text-black">{item.item_name}</span>
                                                        </div>
                                                        <div className="text-xs text-zinc-500 ml-5">
                                                            {item.quantity}x R$ {Number(item.unit_price).toFixed(2)}
                                                            {item.item_type === 'service' && item.barbers && ` • Prof: ${item.barbers.name}`}
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-sm">
                                                        R$ {Number(item.total_price).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5 pt-2 text-sm">
                                    <div className="flex justify-between text-zinc-600">
                                        <span>Subtotal</span>
                                        <span>R$ {Number(selectedCommand.subtotal_amount).toFixed(2)}</span>
                                    </div>
                                    {Number(selectedCommand.discount_amount) > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Desconto ({selectedCommand.discount_type === 'percentage' ? '%' : 'R$'})</span>
                                            <span>- {selectedCommand.discount_type === 'percentage' ? '' : 'R$ '} {Number(selectedCommand.discount_amount).toFixed(2)}{selectedCommand.discount_type === 'percentage' ? '%' : ''}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-zinc-200 mt-4 pt-4 flex justify-between items-center">
                                    <span className="text-xl font-black">Total Pago</span>
                                    <span className="text-2xl font-black">R$ {Number(selectedCommand.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="text-right text-xs font-bold text-zinc-500 mt-1 uppercase">
                                    No {getPaymentLabel(selectedCommand.payment_method)}
                                </div>

                                <div className="mt-6 pt-4 border-t border-zinc-200">
                                    <Button
                                        variant="destructive"
                                        onClick={handleCancelCommand}
                                        disabled={isCancelling}
                                        className="w-full font-bold uppercase tracking-wider"
                                    >
                                        {isCancelling && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                                        Estornar Comanda
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
