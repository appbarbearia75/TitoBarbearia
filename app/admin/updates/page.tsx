"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bell, Loader2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function UpdatesPage() {
    const [updates, setUpdates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchUpdates()
    }, [])

    const fetchUpdates = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('system_updates')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setUpdates(data)
        setLoading(false)
    }

    const handleCreate = async () => {
        if (!title || !description) return

        setSubmitting(true)
        const { error } = await supabase
            .from('system_updates')
            .insert({ title, description })

        if (error) {
            console.error("Error creating update:", error)
        } else {
            setTitle("")
            setDescription("")
            fetchUpdates()
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta atualização?")) return

        const { error } = await supabase
            .from('system_updates')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Error deleting update:", error)
        } else {
            fetchUpdates()
        }
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold">Atualizações do Sistema</h1>
                <p className="text-zinc-400">Publique novidades para os donos de barbearias.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <Card className="bg-[#1c1c1c] border-white/5 text-white lg:col-span-1 h-fit sticky top-8">
                    <CardHeader>
                        <CardTitle className="text-lg">Nova Atualização</CardTitle>
                        <CardDescription>Esta mensagem aparecerá para todos os barbeiros.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Título</label>
                            <Input
                                placeholder="Ex: Nova funcionalidade de Agenda"
                                value={title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Descrição</label>
                            <Textarea
                                placeholder="Descreva as mudanças..."
                                value={description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 min-h-[150px]"
                            />
                        </div>
                        <Button
                            className="w-full bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold"
                            onClick={handleCreate}
                            disabled={submitting || !title || !description}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar Atualização"}
                        </Button>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[#DBC278]" />
                        Histórico
                    </h2>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                        </div>
                    ) : updates.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 bg-[#1c1c1c]/50 rounded-lg border border-white/5">
                            <p>Nenhuma atualização publicada.</p>
                        </div>
                    ) : (
                        updates.map(update => (
                            <Card key={update.id} className="bg-[#1c1c1c] border-white/5 text-white">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-[#DBC278]">{update.title}</h3>
                                                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                                                    {format(new Date(update.created_at), "d 'de' MMMM", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-zinc-300 text-sm whitespace-pre-wrap">{update.description}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 -mt-2 -mr-2"
                                            onClick={() => handleDelete(update.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 text-xs text-zinc-500">
                                        <span>ID: {update.id}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
