"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Scissors, Lock, Mail, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            if (error) throw error

            if (data.user) {
                // 1. Check if Super Admin
                const { data: admin, error: adminError } = await supabase
                    .from("app_admins")
                    .select("id")
                    .eq("id", data.user.id)
                    .single()

                if (adminError && adminError.code !== 'PGRST116') {
                    console.error("Admin check error:", adminError)
                }

                if (admin) {
                    router.push("/admin")
                    return
                }

                // 2. Check if Barbershop Owner
                const { data: profile, error: profileError } = await supabase
                    .from('barbershops')
                    .select('slug')
                    .eq('id', data.user.id)
                    .single()

                if (profileError || !profile) {
                    throw new Error("Conta não vinculada a nenhuma barbearia ou admin.")
                }

                router.push(`/${profile.slug}/admin`)
            }
        } catch (err: any) {
            console.error("Login Error:", err)
            setError(err.message || "Erro ao entrar.")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-[#DBC278] selection:text-black">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <img src="/simbol-logo.svg" alt="Logo" className="w-20 h-20 shadow-2xl shadow-[#DBC278]/20 rounded-2xl" />
                </div>

                <h1 className="text-2xl font-bold text-center mb-2">Painel do Barbeiro</h1>
                <p className="text-zinc-500 text-center mb-8 text-sm">Entre com suas credenciais para acessar.</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            type="email"
                            placeholder="Seu e-mail"
                            className="pl-10 h-12 bg-[#1c1c1c] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#DBC278] transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            type="password"
                            placeholder="Sua senha"
                            className="pl-10 h-12 bg-[#1c1c1c] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#DBC278] transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold text-base rounded-xl transition-all shadow-[0_0_20px_rgba(219,194,120,0.2)] hover:shadow-[0_0_30px_rgba(219,194,120,0.4)]"
                        disabled={loading}
                    >
                        {loading ? "Entrando..." : "Acessar Painel"}
                    </Button>
                </form>

                <p className="text-center mt-8 text-xs text-zinc-600">
                    &copy; 2024 Agendaê
                </p>
            </div>
        </div>
    )
}
