"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function UpdateNotification() {
    const [open, setOpen] = useState(false)
    const [updates, setUpdates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkUpdates()
    }, [])

    const checkUpdates = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Get all updates
            const { data: allUpdates } = await supabase
                .from('system_updates')
                .select('*')
                .order('created_at', { ascending: false })

            if (!allUpdates || allUpdates.length === 0) return

            // 2. Get seen updates for this user
            const { data: seenUpdates } = await supabase
                .from('update_views')
                .select('update_id')
                .eq('user_id', user.id)

            const seenIds = new Set(seenUpdates?.map(u => u.update_id) || [])

            // 3. Filter unseen
            const unseen = allUpdates.filter(u => !seenIds.has(u.id))

            if (unseen.length > 0) {
                setUpdates(unseen)
                setOpen(true)
            }
        } catch (error) {
            console.error("Error checking updates:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = async () => {
        setOpen(false) // Close immediately for better UX

        // Mark all as seen
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || updates.length === 0) return

        const views = updates.map(u => ({
            update_id: u.id,
            user_id: user.id
        }))

        await supabase.from('update_views').insert(views)
    }

    if (updates.length === 0) return null

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleClose()
        }}>
            <DialogContent className="max-w-xl bg-[#1c1c1c] border-white/10 text-white shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#DBC278]/20 rounded-full">
                            <Bell className="w-6 h-6 text-[#DBC278]" />
                        </div>
                        <DialogTitle className="text-2xl">Novidades no App!</DialogTitle>
                    </div>
                    <DialogDescription className="text-zinc-400 text-base">
                        Confira as últimas atualizações e melhorias que preparamos para você.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4 mt-4">
                    <div className="space-y-6">
                        {updates.map((update, index) => (
                            <div key={update.id} className="relative pl-6 border-l-2 border-[#DBC278]/20 pb-2">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#1c1c1c] border-2 border-[#DBC278]" />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-lg text-white">{update.title}</h3>
                                        <span className="text-xs text-zinc-500">
                                            {format(new Date(update.created_at), "d 'de' MMMM", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                        {update.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-6 pt-4 border-t border-white/5">
                    <Button
                        onClick={handleClose}
                        className="w-full sm:w-auto bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Entendi, vamos lá!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
