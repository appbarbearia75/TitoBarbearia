"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Scissors, Package, Calendar, Search, Trash2, Plus, Minus, User, CreditCard, Banknote, Smartphone, Receipt, CheckCircle2, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

type CartItem = {
    uid: string;
    type: 'service' | 'product';
    item_id: string;
    item_name: string;
    unit_price: number;
    quantity: number;
    barber_id?: string; // required for services
}

export default function PDVPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string

    const [loading, setLoading] = useState(true)
    const [services, setServices] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [barbers, setBarbers] = useState<any[]>([])
    const [todayBookings, setTodayBookings] = useState<any[]>([])
    const [barbershopId, setBarbershopId] = useState("")

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([])
    const [clientName, setClientName] = useState("")
    const [discountAmount, setDiscountAmount] = useState<number>(0)
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed')
    const [searchQuery, setSearchQuery] = useState("")

    // Checkout State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("pix")
    const [amountReceived, setAmountReceived] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
        fetchData()
    }, [slug])

    const fetchData = async () => {
        const { data: barbershop } = await supabase.from('barbershops').select('id').eq('slug', slug).single()
        if (!barbershop) return
        setBarbershopId(barbershop.id)

        const [svcRes, prodRes, barbRes, bookRes] = await Promise.all([
            supabase.from('services').select('*').eq('barbershop_id', barbershop.id).order('position'),
            supabase.from('products').select('*').eq('barbershop_id', barbershop.id).order('name'),
            supabase.from('barbers').select('*').eq('barbershop_id', barbershop.id).eq('active', true),
            supabase.from('bookings').select('*, services(title)').eq('barbershop_id', barbershop.id).eq('date', new Date().toISOString().split('T')[0]).eq('status', 'confirmed').order('time')
        ])

        if (svcRes.data) setServices(svcRes.data)
        if (prodRes.data) setProducts(prodRes.data)
        if (barbRes.data) setBarbers(barbRes.data)
        if (bookRes.data) setTodayBookings(bookRes.data)

        setLoading(false)
    }

    const addToCart = (item: any, type: 'service' | 'product') => {
        if (type === 'product' && item.stock_quantity <= 0) {
            alert("Produto sem estoque!")
            return
        }

        const uid = Math.random().toString(36).substring(7)
        setCart(prev => {
            // Se for produto, agrupa e soma qtde
            if (type === 'product') {
                const existing = prev.find(p => p.item_id === item.id && p.type === 'product')
                if (existing) {
                    if (existing.quantity >= item.stock_quantity) {
                        alert("Quantidade máxima em estoque atingida.")
                        return prev
                    }
                    return prev.map(p => p.uid === existing.uid ? { ...p, quantity: p.quantity + 1 } : p)
                }
            }
            // Se for serviço sempre cria linha nova (pois pode ser barbeiros diferentes e qtde = 1 dita comissão individual)
            return [...prev, {
                uid,
                type,
                item_id: item.id,
                item_name: type === 'service' ? item.title : item.name,
                unit_price: Number(item.price),
                quantity: 1,
                barber_id: type === 'service' && barbers.length === 1 ? barbers[0].id : undefined // Autoselect if only 1 barber
            }]
        })
    }

    const updateQuantity = (uid: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.uid !== uid) return item

            if (item.type === 'product') {
                const prodRef = products.find(p => p.id === item.item_id)
                if (prodRef && item.quantity + delta > prodRef.stock_quantity) {
                    return item // Can't exceed stock
                }
            }

            const newQ = Math.max(1, item.quantity + delta)
            return { ...item, quantity: newQ }
        }))
    }

    const removeItem = (uid: string) => {
        setCart(prev => prev.filter(item => item.uid !== uid))
    }

    const updateBarber = (uid: string, barberId: string) => {
        setCart(prev => prev.map(item => item.uid === uid ? { ...item, barber_id: barberId } : item))
    }

    const handleImportBooking = (booking: any) => {
        setClientName(booking.customer_name)
        if (booking.service_id) {
            const service = services.find(s => s.id === booking.service_id)
            if (service) {
                setCart([{
                    uid: Math.random().toString(36).substring(7),
                    type: 'service',
                    item_id: service.id,
                    item_name: service.title,
                    unit_price: Number(service.price),
                    quantity: 1,
                    barber_id: booking.barber_id
                }])
            }
        }
    }

    // Math
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0), [cart])

    const discountCalc = useMemo(() => {
        if (discountType === 'percentage') {
            return subtotal * (discountAmount / 100)
        }
        return discountAmount
    }, [subtotal, discountAmount, discountType])

    const total = useMemo(() => Math.max(0, subtotal - discountCalc), [subtotal, discountCalc])

    // Checkout functions
    const checkCanCheckout = () => {
        if (cart.length === 0) return false
        const missingBarber = cart.find(c => c.type === 'service' && !c.barber_id)
        if (missingBarber) {
            alert("Selecione qual profissional realizou os serviços da lista.")
            return false
        }
        return true
    }

    const proceedToCheckout = () => {
        if (!checkCanCheckout()) return
        setIsCheckoutOpen(true)
    }

    const [showConfirmation, setShowConfirmation] = useState(false)

    const handleFinalize = async () => {
        setIsSubmitting(true)

        try {
            // 1. Create Command
            const { data: command, error: cmdErr } = await supabase.from('commands').insert([{
                barbershop_id: barbershopId,
                client_name: clientName || 'Cliente Avulso',
                status: 'open',
                subtotal_amount: subtotal,
                discount_amount: discountAmount,
                discount_type: discountType,
                total_amount: total,
                payment_method: paymentMethod
            }]).select().single()

            if (cmdErr || !command) throw cmdErr

            // 2. Insert Items
            const itemsToInsert = cart.map(item => ({
                command_id: command.id,
                item_type: item.type,
                item_id: item.item_id,
                item_name: item.item_name,
                unit_price: item.unit_price,
                quantity: item.quantity,
                total_price: item.unit_price * item.quantity,
                barber_id: item.barber_id || null
            }))

            const { error: itemsErr } = await supabase.from('command_items').insert(itemsToInsert)
            if (itemsErr) throw itemsErr

            // 3. Client-side backend logic for closing (Bypasses API RLS issue)

            // 3.1 Update Stock
            const productsList = cart.filter(i => i.type === 'product' && i.item_id)
            for (const prod of productsList) {
                const { data: currentProd } = await supabase
                    .from('products')
                    .select('stock_quantity')
                    .eq('id', prod.item_id)
                    .single()

                if (currentProd) {
                    const newStock = Math.max(0, currentProd.stock_quantity - prod.quantity)
                    await supabase
                        .from('products')
                        .update({ stock_quantity: newStock })
                        .eq('id', prod.item_id)
                }
            }

            // 3.2 Update/Insert Bookings for Commissions
            const servicesList = cart.filter(i => i.type === 'service' && i.barber_id)

            const { data: linkedBookings } = await supabase
                .from('bookings')
                .select('*')
                .eq('command_id', command.id)

            for (const srv of servicesList) {
                const existingBooking = linkedBookings?.find(b => b.service_id === srv.item_id && b.barber_id === srv.barber_id)

                let commissionValue = 0
                const { data: barberData } = await supabase
                    .from('barbers')
                    .select('commission_type, commission_value')
                    .eq('id', srv.barber_id)
                    .single()

                if (barberData) {
                    const basePrice = Number(srv.unit_price)
                    if (barberData.commission_type === 'percentage') {
                        commissionValue = basePrice * (Number(barberData.commission_value) / 100)
                    } else if (barberData.commission_type === 'fixed') {
                        commissionValue = Number(barberData.commission_value)
                    }
                }

                if (existingBooking) {
                    await supabase
                        .from('bookings')
                        .update({
                            status: 'completed',
                            commission_earned: commissionValue
                        })
                        .eq('id', existingBooking.id)
                } else {
                    const now = new Date()
                    const dateStr = now.toISOString().split('T')[0]
                    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5)

                    await supabase
                        .from('bookings')
                        .insert([{
                            barbershop_id: barbershopId,
                            barber_id: srv.barber_id,
                            service_id: srv.item_id,
                            customer_name: clientName || "Cliente Avulso (PDV)",
                            customer_phone: "",
                            date: dateStr,
                            time: timeStr,
                            status: 'completed',
                            command_id: command.id,
                            commission_earned: commissionValue
                        }])
                }
            }

            // 3.3 Close Command definitively
            const { error: updErr } = await supabase
                .from('commands')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString()
                })
                .eq('id', command.id)

            if (updErr) throw updErr

            setIsSuccess(true)
            fetchData()

        } catch (error: any) {
            console.error("Erro no caixa:", error)
            alert("Erro ao finalizar a comanda.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetPdv = () => {
        setCart([])
        setClientName("")
        setDiscountAmount(0)
        setAmountReceived("")
        setIsSuccess(false)
        setIsCheckoutOpen(false)
        setShowConfirmation(false)
    }

    const filteredServices = services.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

    if (loading) {
        return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#DBC278]" /></div>
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)] h-full animate-in fade-in">
            {/* LEFT PANEL - ITEMS */}
            <div className="flex-1 flex flex-col bg-[#1c1c1c] rounded-xl border border-white/5 shadow-2xl overflow-hidden min-h-[500px] lg:min-h-0">
                <div className="p-4 border-b border-white/5 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input
                            placeholder="Buscar serviço ou produto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-900 border-none pl-10 focus-visible:ring-1 focus-visible:ring-[#DBC278] h-12 text-[16px] lg:text-lg"
                        />
                    </div>
                </div>

                <Tabs defaultValue="services" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 pt-2">
                        <TabsList className="bg-zinc-900 w-full justify-start border border-white/5 p-1 h-auto flex flex-col sm:flex-row">
                            <TabsTrigger value="services" className="flex-1 py-3 data-[state=active]:bg-[#DBC278] data-[state=active]:text-black font-bold whitespace-nowrap w-full sm:w-auto">
                                <Scissors className="w-4 h-4 mr-2" /> Serviços
                            </TabsTrigger>
                            <TabsTrigger value="products" className="flex-1 py-3 data-[state=active]:bg-[#DBC278] data-[state=active]:text-black font-bold whitespace-nowrap w-full sm:w-auto">
                                <Package className="w-4 h-4 mr-2" /> Produtos
                            </TabsTrigger>
                            <TabsTrigger value="agenda" className="flex-1 py-3 bg-zinc-800 text-zinc-300 data-[state=active]:bg-[#DBC278] data-[state=active]:text-black font-bold whitespace-nowrap w-full sm:w-auto">
                                <Calendar className="w-4 h-4 mr-2" /> Puxar da Agenda
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <TabsContent value="services" className="m-0 h-full">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {filteredServices.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => addToCart(service, 'service')}
                                        className="bg-zinc-800/50 hover:bg-zinc-700 border border-white/5 hover:border-[#DBC278]/50 rounded-xl p-4 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-[#DBC278] active:scale-95"
                                    >
                                        <h3 className="font-bold text-white group-hover:text-[#DBC278] transition-colors leading-tight mb-2">
                                            {service.title}
                                        </h3>
                                        <p className="text-[#DBC278] font-bold">R$ {Number(service.price).toFixed(2)}</p>
                                    </button>
                                ))}
                                {filteredServices.length === 0 && (
                                    <div className="col-span-full py-10 text-center text-zinc-500">Nenhum serviço encontrado.</div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="products" className="m-0 h-full">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {filteredProducts.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product, 'product')}
                                        disabled={product.stock_quantity <= 0}
                                        className="bg-zinc-800/50 hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800/50 border border-white/5 hover:border-[#DBC278]/50 rounded-xl p-4 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-[#DBC278] active:scale-95 relative overflow-hidden"
                                    >
                                        <h3 className="font-bold text-white group-hover:text-[#DBC278] transition-colors leading-tight mb-2 pr-6">
                                            {product.name}
                                        </h3>
                                        <p className="text-[#DBC278] font-bold">R$ {Number(product.price).toFixed(2)}</p>

                                        <div className={`absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded ${product.stock_quantity > 0 ? 'bg-zinc-900 text-zinc-300' : 'bg-red-500/20 text-red-400'}`}>
                                            Estoque: {product.stock_quantity}
                                        </div>
                                    </button>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full py-10 text-center text-zinc-500">Nenhum produto cadastrado.</div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="agenda" className="m-0 h-full">
                            <div className="space-y-3">
                                {todayBookings.length === 0 ? (
                                    <div className="py-10 text-center text-zinc-500">Nenhum agendamento pendente para hoje.</div>
                                ) : (
                                    todayBookings.map(booking => (
                                        <div key={booking.id} className="bg-zinc-800/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{booking.customer_name}</h3>
                                                <p className="text-sm text-zinc-400">
                                                    {booking.time} • {(booking.services as any)?.title} • Com barbeiro id: {booking.barber_id.substring(0, 8)}...
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => handleImportBooking(booking)}
                                                className="bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold"
                                            >
                                                Puxar pra Comanda
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* RIGHT PANEL - TICKET/CART */}
            <div className="w-full lg:w-[400px] xl:w-[450px] bg-[#1c1c1c] border border-white/5 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right lg:h-full h-fit flex-shrink-0">
                {/* Header Ticket */}
                <div className="bg-zinc-900/50 p-5 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-bold flex items-center gap-2 text-xl">
                            <Receipt className="w-6 h-6" /> Comanda
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/${slug}/admin/pdv/history`)}
                                className="text-xs h-7 px-2 border-white/10 bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800 hidden sm:flex"
                            >
                                Histórico
                            </Button>
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                                Aberta
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <Input
                                placeholder="Nome do Cliente (Opcional)"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="bg-zinc-900 border-zinc-800 text-white pl-9 h-10 focus-visible:ring-[#DBC278]/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Items Ticket */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#1c1c1c]">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                            <Receipt className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-medium text-zinc-400">Comanda vazia</p>
                            <p className="text-sm text-zinc-600">Adicione serviços ou produtos</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item, index) => (
                                <div key={item.uid} className="bg-zinc-800/30 border border-white/5 rounded-lg p-3 group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 pr-2">
                                            <div className="flex items-center gap-1">
                                                {item.type === 'service' ? <Scissors className="w-3.5 h-3.5 text-[#DBC278]" /> : <Package className="w-3.5 h-3.5 text-orange-400" />}
                                                <h4 className="font-bold text-white leading-tight text-sm">{item.item_name}</h4>
                                            </div>
                                            <p className="text-zinc-500 text-sm mt-1 font-medium">
                                                {item.quantity}x R$ {item.unit_price.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-bold text-white">
                                                R$ {(item.quantity * item.unit_price).toFixed(2)}
                                            </span>
                                            <button onClick={() => removeItem(item.uid)} className="text-red-400 opacity-50 hover:opacity-100 p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                                        {/* Actions for Products (Quantity) */}
                                        {item.type === 'product' && (
                                            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                                                <button onClick={() => updateQuantity(item.uid, -1)} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center text-white font-bold text-sm">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.uid, 1)} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Actions for Services (Barber Select) */}
                                        {item.type === 'service' && (
                                            <div className="w-full">
                                                <Select value={item.barber_id || ""} onValueChange={(v) => updateBarber(item.uid, v)}>
                                                    <SelectTrigger className={`w-full h-8 text-xs border-zinc-800 focus:ring-[#DBC278]/50 ${!item.barber_id ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-900 text-white'}`}>
                                                        <SelectValue placeholder="Selecionar Profissional..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        {barbers.map(b => (
                                                            <SelectItem key={b.id} value={b.id} className="focus:bg-zinc-800 focus:text-white">{b.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Ticket */}
                <div className="bg-zinc-900/50 border-t border-dashed border-white/10 p-5 shrink-0">
                    <div className="space-y-2 text-sm text-zinc-400 mb-4 font-medium">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="text-white">R$ {subtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between group">
                            <span className="cursor-pointer group-hover:text-white transition-colors">Desconto</span>
                            <div className="flex items-center gap-2">
                                {discountAmount > 0 && (
                                    <button onClick={() => setDiscountType(prev => prev === 'fixed' ? 'percentage' : 'fixed')} className="text-[10px] bg-zinc-700 text-white px-1.5 py-0.5 rounded font-bold uppercase hover:bg-zinc-600">
                                        {discountType === 'fixed' ? 'R$' : '%'}
                                    </button>
                                )}
                                <div className="relative w-20">
                                    <Input
                                        type="number"
                                        value={discountAmount || ""}
                                        onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                                        className="h-7 px-2 text-right bg-zinc-900 border-zinc-800 text-white focus-visible:ring-[#DBC278]/50"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {discountCalc > 0 && (
                            <div className="flex justify-between text-red-400 font-bold">
                                <span>Total Desconto</span>
                                <span>- R$ {discountCalc.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <span className="text-2xl font-bold text-white">Total</span>
                        <span className="text-3xl font-bold text-[#DBC278]">R$ {total.toFixed(2)}</span>
                    </div>

                    <Button
                        onClick={proceedToCheckout}
                        disabled={cart.length === 0}
                        className="w-full h-16 text-lg bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(219,194,120,0.4)] hover:shadow-[0_15px_40px_-5px_rgba(219,194,120,0.6)] transition-all"
                    >
                        Cobrar Comanda
                    </Button>
                </div>
            </div>

            {/* CHECKOUT MODAL */}
            <Dialog open={isCheckoutOpen} onOpenChange={(open) => {
                if (!isSuccess && !isSubmitting) setIsCheckoutOpen(open)
            }}>
                <DialogContent className="bg-[#09090b] border-white/10 text-white shadow-[0_0_50px_rgba(219,194,120,0.15)] sm:max-w-[450px]">
                    {isSuccess ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in fade-in duration-300">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/5">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-white">Pagamento Concluído!</h2>
                            <p className="text-zinc-400 mb-8">Comanda fechada e comissões atualizadas com sucesso.</p>
                            <Button onClick={resetPdv} className="bg-white hover:bg-zinc-200 text-black font-bold w-full h-12">
                                Nova Venda
                            </Button>
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                                    Pagamento
                                    <span className="text-[#DBC278]">R$ {total.toFixed(2)}</span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                <div className="space-y-3">
                                    <Label className="text-zinc-400 font-bold uppercase text-xs">Forma de Pagamento</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPaymentMethod('pix')}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'pix' ? 'border-[#DBC278] bg-[#DBC278]/10' : 'border-white/10 bg-zinc-900 hover:border-white/20'}`}
                                        >
                                            <Smartphone className={`w-6 h-6 mb-2 ${paymentMethod === 'pix' ? 'text-[#DBC278]' : 'text-zinc-500'}`} />
                                            <span className={`font-bold ${paymentMethod === 'pix' ? 'text-white' : 'text-zinc-400'}`}>PIX</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('credit')}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'credit' ? 'border-[#DBC278] bg-[#DBC278]/10' : 'border-white/10 bg-zinc-900 hover:border-white/20'}`}
                                        >
                                            <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'credit' ? 'text-[#DBC278]' : 'text-zinc-500'}`} />
                                            <span className={`font-bold ${paymentMethod === 'credit' ? 'text-white' : 'text-zinc-400'}`}>Crédito</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('debit')}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'debit' ? 'border-[#DBC278] bg-[#DBC278]/10' : 'border-white/10 bg-zinc-900 hover:border-white/20'}`}
                                        >
                                            <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'debit' ? 'text-[#DBC278]' : 'text-zinc-500'}`} />
                                            <span className={`font-bold ${paymentMethod === 'debit' ? 'text-white' : 'text-zinc-400'}`}>Débito</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('cash')}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-[#DBC278] bg-[#DBC278]/10' : 'border-white/10 bg-zinc-900 hover:border-white/20'}`}
                                        >
                                            <Banknote className={`w-6 h-6 mb-2 ${paymentMethod === 'cash' ? 'text-[#DBC278]' : 'text-zinc-500'}`} />
                                            <span className={`font-bold ${paymentMethod === 'cash' ? 'text-white' : 'text-zinc-400'}`}>Dinheiro</span>
                                        </button>
                                    </div>
                                </div>

                                {paymentMethod === 'cash' && (
                                    <div className="space-y-2 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <Label className="text-white font-bold">Valor Recebido (Para cálculo de troco)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
                                            <Input
                                                type="number"
                                                placeholder={total.toFixed(2)}
                                                value={amountReceived}
                                                onChange={(e) => setAmountReceived(e.target.value)}
                                                className="bg-zinc-900 border-white/10 text-white font-bold pl-9 h-12 text-lg focus-visible:ring-[#DBC278]"
                                            />
                                        </div>
                                        {Number(amountReceived) > total && (
                                            <div className="mt-3 flex justify-between font-bold text-green-400">
                                                <span>Troco Cliente:</span>
                                                <span className="text-lg">R$ {(Number(amountReceived) - total).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="mt-4 flex flex-col gap-2">
                                {!showConfirmation ? (
                                    <Button
                                        onClick={() => setShowConfirmation(true)}
                                        disabled={!paymentMethod || isSubmitting}
                                        className="w-full h-14 text-lg bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold uppercase tracking-widest shadow-[0_5px_20px_-5px_rgba(219,194,120,0.5)] transition-all"
                                    >
                                        Finalizar Venda
                                    </Button>
                                ) : (
                                    <div className="w-full space-y-3 animate-in fade-in zoom-in duration-300">
                                        <p className="text-center text-white font-bold text-lg">Tem certeza que recebeu o valor?</p>
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => setShowConfirmation(false)}
                                                disabled={isSubmitting}
                                                variant="outline"
                                                className="w-1/2 h-14 text-white border-white/20 hover:bg-white/10 font-bold uppercase transition-all"
                                            >
                                                Não
                                            </Button>
                                            <Button
                                                onClick={handleFinalize}
                                                disabled={isSubmitting}
                                                className="w-1/2 h-14 bg-green-500 hover:bg-green-600 text-white font-bold uppercase shadow-[0_5px_20px_-5px_rgba(34,197,94,0.5)] transition-all"
                                            >
                                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sim"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
