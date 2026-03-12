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
    const [filter, setFilter] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
                        Relatórios
                    </h1>
                    <p className="text-text-secondary mt-1">Estatísticas, métricas de negócio e estudos de clientes.</p>
                </div>

                {/* Seletor de Período Global */}
                <div className="flex bg-bg-card p-1 rounded-xl border border-border-color shadow-sm w-fit self-start md:self-auto">
                    {[
                        { id: '7d', label: '7d' },
                        { id: '30d', label: '30d' },
                        { id: '90d', label: '90d' },
                        { id: '1y', label: '1y' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${filter === f.id ? 'bg-primary-action text-white shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <Tabs defaultValue="faturamento" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-bg-card border border-border-color p-1 gap-1 w-full sm:w-fit">
                    <TabsTrigger 
                        value="faturamento" 
                        className="flex-1 sm:flex-initial px-6 py-1.5 rounded-md font-bold transition-all text-text-secondary bg-bg-input border border-border-color hover:bg-bg-card-hover data-[state=active]:bg-primary-action data-[state=active]:text-white data-[state=active]:border-primary-action dark:data-[state=active]:bg-[#DBC278] dark:data-[state=active]:text-black gap-2"
                    >
                        <DollarSign className="w-4 h-4" />
                        Faturamento
                    </TabsTrigger>
                    <TabsTrigger 
                        value="clientes" 
                        className="flex-1 sm:flex-initial px-6 py-1.5 rounded-md font-bold transition-all text-text-secondary bg-bg-input border border-border-color hover:bg-bg-card-hover data-[state=active]:bg-primary-action data-[state=active]:text-white data-[state=active]:border-primary-action dark:data-[state=active]:bg-[#DBC278] dark:data-[state=active]:text-black gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Estudo de Clientes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="faturamento" className="m-0 border-none p-0 outline-none">
                    <RevenueTab slug={slug} filter={filter} />
                </TabsContent>

                <TabsContent value="clientes" className="m-0 border-none p-0 outline-none">
                    <CustomersTab slug={slug} filter={filter} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
