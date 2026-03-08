"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Calendar, Settings, Scissors, BarChart, LogOut, LayoutDashboard, Users, Menu, X, Gift, Crown, DollarSign, ShoppingCart, Package } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { UpdateNotification } from "@/components/UpdateNotification"
import { RealtimeNotification } from "@/components/admin/RealtimeNotification"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { format } from "date-fns"

export default function TenantAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()
    const slug = params.slug as string
    const [loading, setLoading] = useState(true)
    const [barbershopName, setBarbershopName] = useState("")
    const [barbershopId, setBarbershopId] = useState("")
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        const init = async () => {
            const bId = await checkOwner()
            if (bId) {
                runAutoComplete(bId)
                intervalId = setInterval(() => {
                    runAutoComplete(bId)
                }, 60000) // check every minute
            }
        }
        init()
        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [slug])

    const runAutoComplete = async (bId: string) => {
        try {
            const { data: globalShop } = await supabase.from('barbershops').select('auto_complete_bookings, pdv_enabled').eq('id', bId).single()
            if (globalShop && globalShop.auto_complete_bookings !== false && globalShop.pdv_enabled !== false) {
                const now = new Date()
                const todayStr = format(now, 'yyyy-MM-dd')

                const { data: pending } = await supabase
                    .from('bookings')
                    .select(`*, services(title, duration, price), barbers(commission_type, commission_value)`)
                    .eq('barbershop_id', bId)
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
        } catch (bgErr) {
            console.error("Background auto-complete error:", bgErr)
        }
    }

    const checkOwner = async () => {
        try {
            console.log("Checking owner for slug:", slug)
            const { data, error: authError } = await supabase.auth.getUser()
            const user = data?.user

            if (authError || !user) {
                console.log("Auth error or no user:", authError?.message || "No user found")
                router.push("/login")
                return null
            }

            console.log("User found:", user.id)

            // Verify if the current user owns the barbershop with this slug
            const { data: barbershop, error } = await supabase
                .from("barbershops")
                .select("id, name, is_active, pdv_enabled")
                .eq("slug", slug)
                .single()

            console.log("Barbershop query result:", { barbershop, error })

            if (error || !barbershop) {
                console.log("Barbershop not found or error", error?.message || "Not found")
                router.push("/")
                return null
            }

            if (barbershop.id !== user.id) {
                console.error("Access denied: Not the owner")
                router.push("/")
                return null
            }

            setBarbershopName(barbershop.name)
            setBarbershopId(barbershop.id)

            // Unblock UI immediately so the user can navigate without waiting
            setLoading(false)

            return barbershop.id
        } catch (err) {
            console.log("Unexpected error in checkOwner:", err instanceof Error ? err.message : err)
            router.push("/login")
            return null
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white font-sans">
                Verificando permissões...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#09090b] flex font-sans text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-[#1c1c1c]/50 p-6 flex flex-col hidden md:flex">
                <div className="flex items-center justify-start mb-10">
                    <Image
                        src="/simbol-and-logo-horizontal.svg"
                        alt={barbershopName}
                        width={180}
                        height={40}
                        className="h-10 w-auto"
                    />
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem
                        href={`/${slug}/admin`}
                        icon={<LayoutDashboard className="w-5 h-5" />}
                        label="Visão Geral"
                        active={pathname === `/${slug}/admin`}
                    />
                    <NavItem
                        href={`/${slug}/admin/agenda`}
                        icon={<Calendar className="w-5 h-5" />}
                        label="Agenda"
                        active={pathname.includes(`/${slug}/admin/agenda`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/pdv`}
                        icon={<ShoppingCart className="w-5 h-5" />}
                        label="Caixa / Vendas"
                        active={pathname.includes(`/${slug}/admin/pdv`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/clients`}
                        icon={<Users className="w-5 h-5" />}
                        label="Clientes"
                        active={pathname.includes(`/${slug}/admin/clients`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/products`}
                        icon={<Package className="w-5 h-5" />}
                        label="Produtos"
                        active={pathname.includes(`/${slug}/admin/products`)}
                    />

                    <NavItem
                        href={`/${slug}/admin/services`}
                        icon={<Scissors className="w-5 h-5" />}
                        label="Serviços"
                        active={pathname.includes(`/${slug}/admin/services`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/commissions`}
                        icon={<DollarSign className="w-5 h-5" />}
                        label="Comissões"
                        active={pathname.includes(`/${slug}/admin/commissions`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/vip`}
                        icon={<Crown className="w-5 h-5" />}
                        label="Fidelidade"
                        active={pathname.includes(`/${slug}/admin/vip`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/birthdays`}
                        icon={<Gift className="w-5 h-5" />}
                        label="Aniversariantes"
                        active={pathname.includes(`/${slug}/admin/birthdays`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/analytics`}
                        icon={<BarChart className="w-5 h-5" />}
                        label="Relatórios"
                        active={pathname.includes(`/${slug}/admin/analytics`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/settings`}
                        icon={<Settings className="w-5 h-5" />}
                        label="Configurações"
                        active={pathname.includes(`/${slug}/admin/settings`)}
                    />
                </nav>

                <Button
                    variant="ghost"
                    className="mt-auto justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    Sair
                </Button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-auto">
                {/* Mobile Header (simplified) */}
                <div className="md:hidden flex justify-between items-center mb-6">
                    <span className="font-bold">{barbershopName}</span>
                    <button
                        className="relative w-10 h-10 flex flex-col items-center justify-center gap-[6px] group"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <div className="w-8 h-[2px] bg-[#DBC278] rounded-full transition-all duration-300" />
                        <div className="w-8 h-[2px] bg-[#DBC278] rounded-full transition-all duration-300" />
                        <div className="w-8 h-[2px] bg-[#DBC278] rounded-full transition-all duration-300" />
                    </button>
                </div>
                {children}
            </main>

            {/* Mobile Sidebar Overlay */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent
                    side="top"
                    className="w-full max-w-none h-auto max-h-[85vh] rounded-b-3xl bg-[#09090b] border-b border-x-0 border-t-0 border-[#DBC278]/20 shadow-[0_10px_40px_-10px_rgba(219,194,120,0.15)] px-6 pb-10 pt-16 flex flex-col md:hidden [&>button]:hidden overflow-y-auto"
                >
                    <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center justify-start">
                            <Image
                                src="/simbol-and-logo-horizontal.svg"
                                alt={barbershopName}
                                width={140}
                                height={30}
                                className="h-8 w-auto"
                            />
                        </div>
                        <button
                            className="w-10 h-10 flex flex-col items-center justify-center gap-[6px] group cursor-pointer"
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-label="Fechar menu"
                        >
                            <div className="w-7 h-[2.5px] bg-[#DBC278] shadow-[0_0_10px_rgba(219,194,120,0.8)] rounded-full origin-center translate-y-[8.5px] rotate-45" />
                            <div className="w-7 h-[2.5px] bg-[#DBC278] shadow-[0_0_10px_rgba(219,194,120,0.8)] rounded-full origin-center opacity-0 scale-0" />
                            <div className="w-7 h-[2.5px] bg-[#DBC278] shadow-[0_0_10px_rgba(219,194,120,0.8)] rounded-full origin-center -translate-y-[8.5px] -rotate-45" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <NavItem
                            href={`/${slug}/admin`}
                            icon={<LayoutDashboard className="w-5 h-5" />}
                            label="Visão Geral"
                            active={pathname === `/${slug}/admin`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <NavItem
                            href={`/${slug}/admin/agenda`}
                            icon={<Calendar className="w-5 h-5" />}
                            label="Agenda"
                            active={pathname.includes(`/${slug}/admin/agenda`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <NavItem
                            href={`/${slug}/admin/pdv`}
                            icon={<ShoppingCart className="w-5 h-5" />}
                            label="Caixa / Vendas"
                            active={pathname.includes(`/${slug}/admin/pdv`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <NavItem
                            href={`/${slug}/admin/clients`}
                            icon={<Users className="w-5 h-5" />}
                            label="Clientes"
                            active={pathname.includes(`/${slug}/admin/clients`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <NavItem
                            href={`/${slug}/admin/products`}
                            icon={<Package className="w-5 h-5" />}
                            label="Produtos"
                            active={pathname.includes(`/${slug}/admin/products`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        <NavItem
                            href={`/${slug}/admin/services`}
                            icon={<Scissors className="w-5 h-5" />}
                            label="Serviços"
                            active={pathname.includes(`/${slug}/admin/services`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <NavItem
                            href={`/${slug}/admin/commissions`}
                            icon={<DollarSign className="w-5 h-5" />}
                            label="Comissões"
                            active={pathname.includes(`/${slug}/admin/commissions`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <NavItem
                            href={`/${slug}/admin/vip`}
                            icon={<Crown className="w-5 h-5" />}
                            label="Fidelidade"
                            active={pathname.includes(`/${slug}/admin/vip`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <NavItem
                            href={`/${slug}/admin/birthdays`}
                            icon={<Gift className="w-5 h-5" />}
                            label="Aniversariantes"
                            active={pathname.includes(`/${slug}/admin/birthdays`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <NavItem
                            href={`/${slug}/admin/analytics`}
                            icon={<BarChart className="w-5 h-5" />}
                            label="Relatórios"
                            active={pathname.includes(`/${slug}/admin/analytics`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <NavItem
                            href={`/${slug}/admin/settings`}
                            icon={<Settings className="w-5 h-5" />}
                            label="Configurações"
                            active={pathname.includes(`/${slug}/admin/settings`)}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    </nav>

                    <Button
                        variant="ghost"
                        className="mt-auto mb-2 justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Sair
                    </Button>
                </SheetContent>
            </Sheet>
            <UpdateNotification />
            {barbershopId && <RealtimeNotification barbershopId={barbershopId} />}
        </div>
    )
}

function NavItem({ href, icon, label, active, onClick }: { href: string, icon: React.ReactNode, label: string, active: boolean, onClick?: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 group ${active
                ? "bg-[#DBC278]/10 text-[#DBC278]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
        >
            <div className={`transition-colors ${active ? "text-[#DBC278]/90" : "text-zinc-500 group-hover:text-zinc-400"}`}>
                {icon}
            </div>
            <span className={`ml-3 text-sm tracking-wide ${active ? "font-semibold" : "font-medium"}`}>
                {label}
            </span>
        </Link>
    )
}
