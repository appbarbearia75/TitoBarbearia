"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, DollarSign, TrendingUp, Scissors, Copy, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

import { OnboardingModal } from "@/components/onboarding/onboarding-modal"
import { AgendaBoard } from "@/components/admin/AgendaBoard"

export default function TenantDashboard() {
    const params = useParams()
    const slug = params.slug as string
    const [stats, setStats] = useState({
        todayBookings: 0,
        totalServices: 0,
        todayRevenue: 0,
    })
    const [onboardingOpen, setOnboardingOpen] = useState(false)
    const [barbershopId, setBarbershopId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetchStats()
    }, [slug])

    const fetchStats = async () => {
        // We first need the barbershop_id to query bookings
        // In a real app we might store this in context or lookup, but for now we query
        const { data: barbershop } = await supabase.from('barbershops').select('id, phone, address').eq('slug', slug).single()

        if (barbershop) {
            setBarbershopId(barbershop.id)

            // Check if onboarding is needed (empty phone or address)
            if (!barbershop.phone || !barbershop.address) {
                setOnboardingOpen(true)
            }

            const today = format(new Date(), 'yyyy-MM-dd')

            // Fetch counts
            const { count: todayBookings } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('barbershop_id', barbershop.id)
                .eq('date', today)
                .neq('status', 'cancelled')

            const { count: totalServices } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('barbershop_id', barbershop.id)

            // Calculate Revenue
            const { data: revenueBookings } = await supabase
                .from('bookings')
                .select(`
                    id,
                    services (price)
                `)
                .eq('barbershop_id', barbershop.id)
                .eq('date', today)
                .eq('status', 'completed')

            const todayRevenue = revenueBookings?.reduce((acc, booking) => {
                const price = (booking.services as any)?.price || 0
                return acc + Number(price)
            }, 0) || 0

            setStats({
                todayBookings: todayBookings || 0,
                totalServices: totalServices || 0,
                todayRevenue: todayRevenue
            })
        }
    }

    const handleCopyLink = () => {
        const url = `${window.location.origin}/${slug}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Visão Geral</h1>
                <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="gap-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white hover:text-white"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Link Copiado!" : "Copiar Link da Agenda"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Agendamentos Hoje"
                    value={stats.todayBookings}
                    icon={<Calendar className="w-4 h-4 text-blue-500" />}
                />
                <StatCard
                    title="Serviços Ativos"
                    value={stats.totalServices}
                    icon={<Scissors className="w-4 h-4 text-yellow-500" />}
                />
                <StatCard
                    title="Clientes Mensais"
                    value="0"
                    icon={<Users className="w-4 h-4 text-green-500" />}
                    desc="Em breve"
                />
                <StatCard
                    title="Receita Hoje"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.todayRevenue)}
                    icon={<DollarSign className="w-4 h-4 text-white" />}
                />
            </div>

            <div className="mt-8">
                <AgendaBoard onUpdate={fetchStats} />
            </div>

            {/* Onboarding Modal */}
            {onboardingOpen && barbershopId && (
                <OnboardingModal
                    isOpen={onboardingOpen}
                    onOpenChange={setOnboardingOpen}
                    barbershopId={barbershopId}
                    onComplete={() => {
                        setOnboardingOpen(false)
                        fetchStats() // Refresh stats
                    }}
                />
            )}
        </div>
    )
}

function StatCard({ title, value, icon, desc }: { title: string, value: string | number, icon: React.ReactNode, desc?: string }) {
    return (
        <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {desc && <p className="text-xs text-zinc-500 mt-1">{desc}</p>}
            </CardContent>
        </Card>
    )
}
