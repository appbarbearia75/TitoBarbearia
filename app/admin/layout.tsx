"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Ticket, LogOut, Scissors, Menu, Palette } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAdmin()
    }, [])

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push("/login")
            return
        }

        // Check if user is in app_admins table
        const { data: admin, error } = await supabase
            .from("app_admins")
            .select("id")
            .eq("id", user.id)
            .single()

        if (error || !admin) {
            console.error("Access denied: Not an admin")
            router.push("/") // Redirect non-admins to home
            return
        }

        setLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white font-sans">
                Verificando credenciais...
            </div>
        )
    }

    const SidebarContent = () => (
        <>
            <div className="flex items-center gap-2 mb-10 px-2">
                <div className="relative w-40 h-10">
                    <Image
                        src="/simbol-and-logo-horizontal.svg"
                        alt="Tito Barber Logo"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                <NavItem
                    href="/admin"
                    icon={<LayoutDashboard className="w-5 h-5" />}
                    label="Dashboard"
                    active={pathname === "/admin"}
                />
                <NavItem
                    href="/admin/barbershops"
                    icon={<Users className="w-5 h-5" />}
                    label="Barbearias"
                    active={pathname === "/admin/barbershops"}
                />
                <NavItem
                    href="/admin/invites"
                    icon={<Ticket className="w-5 h-5" />}
                    label="Convites"
                    active={pathname === "/admin/invites"}
                />
                <NavItem
                    href="/admin/demo"
                    icon={<Palette className="w-5 h-5" />}
                    label="Demonstração"
                    active={pathname === "/admin/demo"}
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
        </>
    )

    return (
        <div className="min-h-screen bg-[#09090b] flex font-sans text-white">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 border-r border-white/10 bg-[#1c1c1c]/50 p-6 flex-col">
                <SidebarContent />
            </aside>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden border-b border-white/10 bg-black/50 p-4 flex items-center justify-between">
                    <div className="relative w-32 h-8">
                        <Image
                            src="/simbol-and-logo-horizontal.svg"
                            alt="Tito Barber Logo"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 border-r border-white/10 bg-[#09090b] p-6 flex flex-col text-white">
                            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                            <SheetDescription className="sr-only">Navegue pelas opções do painel administrativo</SheetDescription>
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}

function NavItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
    return (
        <Link href={href}>
            <Button
                variant="ghost"
                className={`w-full justify-start ${active ? "bg-white/10 text-[#DBC278]" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
            >
                {icon}
                <span className="ml-3">{label}</span>
            </Button>
        </Link>
    )
}
