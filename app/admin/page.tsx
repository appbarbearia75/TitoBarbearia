"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Ticket, TrendingUp, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalBarbershops: 0,
        activeBarbershops: 0,
        pendingInvites: 0,
    })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        const { count: totalBarbershops } = await supabase.from("barbershops").select("*", { count: 'exact', head: true })
        const { count: activeBarbershops } = await supabase.from("barbershops").select("*", { count: 'exact', head: true }).eq("is_active", true)
        const { count: pendingInvites } = await supabase.from("invites").select("*", { count: 'exact', head: true }).is("used_at", null)

        setStats({
            totalBarbershops: totalBarbershops || 0,
            activeBarbershops: activeBarbershops || 0,
            pendingInvites: pendingInvites || 0,
        })
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Barbearias"
                    value={stats.totalBarbershops}
                    icon={<Users className="w-4 h-4 text-neutral-400" />}
                />
                <StatCard
                    title="Barbearias Ativas"
                    value={stats.activeBarbershops}
                    icon={<TrendingUp className="w-4 h-4 text-[#DBC278]" />}
                />
                <StatCard
                    title="Convites Pendentes"
                    value={stats.pendingInvites}
                    icon={<Ticket className="w-4 h-4 text-[#DBC278]" />}
                />
                <StatCard
                    title="Receita Mensal (Estimada)"
                    value={`R$ ${stats.activeBarbershops * 97},00`}
                    icon={<DollarSign className="w-4 h-4 text-[#DBC278]" />}
                    desc="Baseado no plano padrão"
                />
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, desc }: { title: string, value: string | number, icon: React.ReactNode, desc?: string }) {
    return (
        <Card className="bg-[#1c1c1c] border-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {desc && <p className="text-xs text-neutral-500 mt-1">{desc}</p>}
            </CardContent>
        </Card>
    )
}
