"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function PasswordChangeForm() {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState({ type: "", text: "" })

    const handleChangePassword = async () => {
        setMsg({ type: "", text: "" })

        if (!currentPassword || !newPassword || !confirmPassword) {
            setMsg({ type: "error", text: "Preencha todos os campos." })
            return
        }

        if (newPassword !== confirmPassword) {
            setMsg({ type: "error", text: "As novas senhas não coincidem." })
            return
        }

        if (newPassword.length < 6) {
            setMsg({ type: "error", text: "A nova senha deve ter no mínimo 6 caracteres." })
            return
        }

        setLoading(true)

        try {
            // 1. Get current user to get email
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !user.email) throw new Error("Usuário não identificado")

            // 2. Verify current password by attempting a sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            })

            if (signInError) {
                setMsg({ type: "error", text: "Senha atual incorreta." })
                setLoading(false)
                return
            }

            // 3. Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (updateError) throw updateError

            setMsg({ type: "success", text: "Senha alterada com sucesso!" })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")

        } catch (error: any) {
            console.error("Error changing password:", error)
            setMsg({ type: "error", text: error.message || "Erro ao alterar senha." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Senha Atual</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-9 bg-zinc-800 border-zinc-700"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-9 bg-zinc-800 border-zinc-700"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-9 bg-zinc-800 border-zinc-700"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            </div>

            {msg.text && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {msg.text}
                </div>
            )}

            <Button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Alterar Senha
            </Button>
        </div>
    )
}
