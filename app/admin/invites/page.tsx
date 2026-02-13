"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, RefreshCw } from "lucide-react"

export default function AdminPage() {
    const [inviteLink, setInviteLink] = useState("")
    const [loading, setLoading] = useState(false)

    const generateInvite = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/invites", { method: "POST" })
            const data = await res.json()

            // Assuming localhost for dev, in prod strictly use env var or window.location
            const origin = window.location.origin
            setInviteLink(`${origin}/cadastro/${data.code}`)
        } catch (error) {
            console.error("Erro ao gerar convite:", error)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink)
        alert("Link copiado!")
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Gerenciador de Convites</h1>
                <p className="text-neutral-400">Gere novos links para cadastro de barbearias.</p>
            </div>

            <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-white">
                <CardHeader>
                    <CardTitle>Gerar Convite</CardTitle>
                    <CardDescription className="text-neutral-400">
                        Cria um link único válido para um cadastro.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={generateInvite}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Gerar Novo link de Convite
                    </Button>

                    {inviteLink && (
                        <div className="p-4 bg-black rounded-lg border border-neutral-800 break-all">
                            <p className="text-xs text-neutral-500 mb-2">Link gerado (válido para 1 cadastro):</p>
                            <div className="flex items-center gap-2">
                                <code className="text-yellow-500 flex-1">{inviteLink}</code>
                                <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
