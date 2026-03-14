"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Building2, Mail, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function PublicRegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        barbershopName: "",
        slug: "",
        email: "",
        password: ""
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            })

            if (authError) throw new Error(authError.message)

            if (!authData.session && !authData.user) throw new Error("Erro ao criar usuário.")

            if (authData.user && !authData.session) {
                throw new Error("Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta antes de continuar.")
            }

            // 2. Create Barbershop Profile with 7-day trial
            const finalSlug = formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

            const { error: profileError } = await supabase
                .from('barbershops')
                .insert([
                    {
                        id: authData.user!.id,
                        slug: finalSlug,
                        name: formData.barbershopName,
                        email: formData.email,
                        subscription_status: 'trial',
                        subscription_end_date: trialEndDate
                    }
                ])

            if (profileError) {
                if (profileError.code === '23505') {
                    throw new Error("Este identificador (slug) já está em uso.")
                }
                throw new Error(profileError.message)
            }

            // 3. Redirect to their new admin dashboard
            router.push(`/${finalSlug}/admin`)

        } catch (err: any) {
            console.error("Registration error:", err)
            let msg = err.message || "Erro ao realizar cadastro."
            if (msg.includes("Password should be at least 6 characters")) {
                msg = "A senha deve ter no mínimo 6 caracteres."
            } else if (msg.includes("email rate limit exceeded")) {
                msg = "Muitas tentativas. Aguarde um momento ou use outro e-mail."
            } else if (msg.includes("User already registered")) {
                msg = "Este e-mail já está cadastrado."
            }
            setError(msg)
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-[#DBC278] selection:text-black">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <img src="/simbol-logo.svg" alt="Logo" className="w-20 h-20 shadow-2xl shadow-[#DBC278]/20 rounded-2xl" />
                </div>

                <h1 className="text-2xl font-bold text-center mb-2">Crie sua Conta</h1>
                <p className="text-zinc-500 text-center mb-8 text-sm">Cadastre-se e ganhe 7 dias de teste grátis.</p>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            name="barbershopName"
                            placeholder="Nome da Barbearia"
                            className="pl-10 h-12 bg-[#1c1c1c] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#DBC278] transition-colors"
                            value={formData.barbershopName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex h-12 w-full items-center rounded-md border border-zinc-800 bg-[#1c1c1c] px-3 py-2 text-sm focus-within:border-[#DBC278] transition-colors">
                            <span className="text-zinc-500 text-sm font-medium select-none whitespace-nowrap">agendae.com/</span>
                            <input
                                name="slug"
                                placeholder="sua-barbearia"
                                className="flex-1 bg-transparent border-0 outline-none text-white text-sm placeholder:text-zinc-600 h-full ml-0.5 w-full min-w-0"
                                value={formData.slug}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <p className="text-xs text-zinc-500 ml-1">Defina o link exclusivo para seus clientes.</p>
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            name="email"
                            type="email"
                            placeholder="Seu e-mail"
                            className="pl-10 h-12 bg-[#1c1c1c] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#DBC278] transition-colors"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            name="password"
                            type="password"
                            placeholder="Sua senha seguranga"
                            className="pl-10 h-12 bg-[#1c1c1c] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#DBC278] transition-colors"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-zinc-600 mt-1 ml-1">Mínimo de 6 caracteres.</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold text-base rounded-xl mt-2 shadow-[0_0_20px_rgba(219,194,120,0.2)] hover:shadow-[0_0_30px_rgba(219,194,120,0.4)] transition-all"
                        disabled={loading}
                    >
                        {loading ? "Criando Conta..." : "Começar Teste Grátis"}
                    </Button>
                </form>

                <p className="text-center mt-8 text-sm text-zinc-400">
                    Já tem uma conta? <Link href="/login" className="text-[#DBC278] hover:underline font-medium">Fazer Login</Link>
                </p>
            </div>
        </div>
    )
}
