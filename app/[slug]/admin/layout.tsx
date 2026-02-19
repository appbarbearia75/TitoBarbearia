"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Calendar, Settings, Scissors, BarChart, LogOut, LayoutDashboard, Users, Menu, X, Gift } from "lucide-react"
import { supabase } from "@/lib/supabase"

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        checkOwner()
    }, [slug])

    const checkOwner = async () => {
        try {
            console.log("Checking owner for slug:", slug)
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                console.log("Auth error or no user:", authError)
                router.push("/login")
                return
            }

            console.log("User found:", user.id)

            // Verify if the current user owns the barbershop with this slug
            const { data: barbershop, error } = await supabase
                .from("barbershops")
                .select("id, name, is_active")
                .eq("slug", slug)
                .single()

            console.log("Barbershop query result:", { barbershop, error })

            if (error || !barbershop) {
                console.error("Barbershop not found or error", error)
                router.push("/")
                return
            }

            if (barbershop.id !== user.id) {
                console.error("Access denied: Not the owner")
                router.push("/")
                return
            }

            setBarbershopName(barbershop.name)
            setLoading(false)
        } catch (err) {
            console.error("Unexpected error in checkOwner:", err)
            router.push("/login")
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
                        href={`/${slug}/admin/services`}
                        icon={<Scissors className="w-5 h-5" />}
                        label="Serviços"
                        active={pathname.includes(`/${slug}/admin/services`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/clients`}
                        icon={<Users className="w-5 h-5" />}
                        label="Clientes"
                        active={pathname.includes(`/${slug}/admin/clients`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/analytics`}
                        icon={<BarChart className="w-5 h-5" />}
                        label="Analytics"
                        active={pathname.includes(`/${slug}/admin/analytics`)}
                    />
                    <NavItem
                        href={`/${slug}/admin/birthdays`}
                        icon={<Gift className="w-5 h-5" />}
                        label="Aniversariantes"
                        active={pathname.includes(`/${slug}/admin/birthdays`)}
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
                    <Button size="icon" variant="ghost" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>
                {children}
            </main>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 md:hidden animate-in fade-in">
                    <div className="fixed inset-y-0 left-0 w-64 bg-[#09090b] border-r border-white/10 p-6 flex flex-col animate-in slide-in-from-left">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center justify-start">
                                <Image
                                    src="/simbol-and-logo-horizontal.svg"
                                    alt={barbershopName}
                                    width={140}
                                    height={30}
                                    className="h-8 w-auto"
                                />
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => setIsMobileMenuOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
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
                                href={`/${slug}/admin/services`}
                                icon={<Scissors className="w-5 h-5" />}
                                label="Serviços"
                                active={pathname.includes(`/${slug}/admin/services`)}
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
                                href={`/${slug}/admin/analytics`}
                                icon={<BarChart className="w-5 h-5" />}
                                label="Analytics"
                                active={pathname.includes(`/${slug}/admin/analytics`)}
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
                                href={`/${slug}/admin/settings`}
                                icon={<Settings className="w-5 h-5" />}
                                label="Configurações"
                                active={pathname.includes(`/${slug}/admin/settings`)}
                                onClick={() => setIsMobileMenuOpen(false)}
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
                    </div>
                    {/* Backdrop click to close */}
                    <div className="flex-1 h-full" onClick={() => setIsMobileMenuOpen(false)} />
                </div>
            )}
        </div>
    )
}

function NavItem({ href, icon, label, active, onClick }: { href: string, icon: React.ReactNode, label: string, active: boolean, onClick?: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center w-full p-2 rounded-md transition-colors ${active
                ? "bg-white/10 text-[#DBC278]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
        >
            {icon}
            <span className="ml-3 font-medium text-sm">{label}</span>
        </Link>
    )
}
