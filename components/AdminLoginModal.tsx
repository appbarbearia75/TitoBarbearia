"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogIn } from "lucide-react"

interface AdminLoginModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function AdminLoginModal({ isOpen, onOpenChange }: AdminLoginModalProps) {
    const router = useRouter()

    const handleLogin = () => {
        router.push("/login")
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#09090b] border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Área Administrativa</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Acesse o painel administrativo para gerenciar a barbearia.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button
                        onClick={handleLogin}
                        className="w-full bg-[#DBC278] text-black hover:bg-[#c4ad6b] font-bold"
                    >
                        <LogIn className="w-4 h-4 mr-2" />
                        Fazer Login
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
