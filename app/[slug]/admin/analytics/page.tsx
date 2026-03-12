"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RevenueTab } from "@/components/admin/analytics/RevenueTab"
import { CustomersTab } from "@/components/admin/analytics/CustomersTab"
import { DollarSign, Users } from "lucide-react"

export default function AnalyticsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [activeTab, setActiveTab] = useState("faturamento")

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Relatórios
                </h1>
                <p className="text-zinc-400 mt-1">Estatísticas, métricas de negócio e estudos de clientes.</p>
            </div>

            <Tabs defaultValue="faturamento" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-[#1c1c1c]/50 border border-white/5 p-1">
                    <TabsTrigger 
                        value="faturamento" 
                        className="data-[state=active]:bg-[#DBC278] data-[state=active]:text-black transition-all gap-2"
                    >
                        <DollarSign className="w-4 h-4" />
                        Faturamento
                    </TabsTrigger>
                    <TabsTrigger 
                        value="clientes" 
                        className="data-[state=active]:bg-[#DBC278] data-[state=active]:text-black transition-all gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Estudo de Clientes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="faturamento" className="m-0 border-none p-0 outline-none">
                    <RevenueTab slug={slug} />
                </TabsContent>

                <TabsContent value="clientes" className="m-0 border-none p-0 outline-none">
                    <CustomersTab slug={slug} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
