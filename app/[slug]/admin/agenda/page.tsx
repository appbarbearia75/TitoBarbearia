"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import { AgendaGrid } from "@/components/admin/AgendaGrid"
import { WaitlistFloatingButton } from "@/components/admin/WaitlistFloatingButton"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

export default function AgendaPage() {
    const params = useParams()
    const slug = params.slug as string
    const [copied, setCopied] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleCopyLink = () => {
        const url = `${window.location.origin}/${slug}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const refreshAll = () => setRefreshTrigger(prev => prev + 1)

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent uppercase tracking-tight">Agenda <span className="text-[#DBC278]">Pro</span></h1>
                    <p className="text-zinc-500 text-sm font-medium">Controle total dos atendimentos e produtividade.</p>
                </div>
                <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="w-full sm:w-auto gap-2 bg-[#1c1c1c]/50 border-white/5 hover:bg-zinc-800 text-white hover:text-white backdrop-blur-sm transition-all rounded-xl h-11"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Link Copiado!" : "Copiar Link da Agenda"}
                </Button>
            </div>

            <div className="flex-1 flex flex-col gap-6 min-h-0">
                <div className="flex-1 min-h-0 overflow-hidden">
                    <AgendaGrid key={`grid-${refreshTrigger}`} />
                </div>
            </div>

            {/* Floating Waitlist Button */}
            <WaitlistFloatingButton slug={slug} onUpdate={refreshAll} />
        </div>
    )
}
