"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Scissors, User, Mail, Lock, Building2, AlertTriangle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function RegisterPage() {
    const params = useParams()
    const router = useRouter()
    const code = params.code as string

    const [isValid, setIsValid] = useState<boolean | null>(null)
    const [formData, setFormData] = useState({
        barbershopName: "",
        slug: "",
        email: "",
        password: ""
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (code) {
            checkInvite(code)
        }
    }, [code])

    const checkInvite = async (inviteCode: string) => {
        try {
            const res = await fetch(`/api/invites?code=${inviteCode}`)
            const data = await res.json()
            setIsValid(data.valid)
        } catch (error) {
            setIsValid(false)
        }
    }

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

            // IMPORTANT: If "Confirm Email" is enabled in Supabase, session will be null.
            // We tell the user to check their email, OR we proceed if session exists.
            if (!authData.session && !authData.user) throw new Error("Erro ao criar usuário.")

            if (authData.user && !authData.session) {
                // User created but waiting for confirmation.
                // We CANNOT insert into barbershops yet because RLS requires auth.uid() which comes from session.
                // UNLESS we use a postgres trigger or disable RLS for insertion (risky).
                // Best approach: Tell user to verify email.
                throw new Error("Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta antes de continuar.")
            }

            // 2. Create Barbershop Profile
            const finalSlug = formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

            const { error: profileError } = await supabase
                .from('barbershops')
                .insert([
                    {
                        id: authData.user!.id, // Link to Auth User
                        slug: finalSlug,
                        name: formData.barbershopName,
                        email: formData.email,
                    }
                ])

            if (profileError) {
                // Determine if error is duplicate slug
                if (profileError.code === '23505') { // Postgres unique violation
                    throw new Error("Este identificador (slug) já está em uso.")
                }
                throw new Error(profileError.message)
            }

            // 3. Invalidate Invite
            await fetch(`/api/invites?code=${code}`, { method: 'DELETE' })

            // 4. Redirect
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

    if (isValid === null) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <p>Verificando convite...</p>
            </div>
        )
    }

    if (isValid === false) {
        return (
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white font-sans">
                <div className="text-center max-w-md">
                    <AlertTriangle className="w-16 h-16 text-[#DBC278] mx-auto mb-6" />
                    <h1 className="text-2xl font-bold mb-4">Convite Inválido ou Expirado</h1>
                    <p className="text-zinc-500 mb-8">
                        O link que você acessou não é válido ou já foi utilizado.
                        Entre em contato com o administrador para solicitar um novo convite.
                    </p>
                    <Link href="/">
                        <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">
                            Voltar ao Início
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-white font-sans">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-[#DBC278]/10 rounded-3xl flex items-center justify-center border border-[#DBC278]/20 shadow-[0_0_40px_-10px_rgba(219,194,120,0.3)]">
                        <Image
                            src="/simbol-logo.svg"
                            alt="Logo"
                            width={40}
                            height={40}
                            className="w-10 h-10"
                        />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-2">Convite Aceito!</h1>
                <p className="text-zinc-500 text-center mb-8 text-sm">Crie sua conta exclusiva agora.</p>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            name="barbershopName"
                            placeholder="Nome da Barbearia"
                            className="pl-10 h-12 bg-[#1c1c1c] border-white/5 text-white placeholder:text-zinc-600 focus:border-[#DBC278] focus:ring-[#DBC278]/20"
                            value={formData.barbershopName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex h-12 w-full items-center rounded-md border border-white/5 bg-[#1c1c1c] px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-[#DBC278] focus-within:ring-[#DBC278]/20">
                            <span className="text-zinc-500 text-base font-medium select-none whitespace-nowrap">agendae.com/</span>
                            <input
                                name="slug"
                                placeholder="sua-barbearia"
                                className="flex-1 bg-transparent border-0 outline-none text-white text-base placeholder:text-zinc-600 h-full ml-0.5"
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
                            placeholder="Seu melhor e-mail"
                            className="pl-10 h-12 bg-[#1c1c1c] border-white/5 text-white placeholder:text-zinc-600 focus:border-[#DBC278] focus:ring-[#DBC278]/20"
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
                            placeholder="Senha segura"
                            className="pl-10 h-12 bg-[#1c1c1c] border-white/5 text-white placeholder:text-zinc-600 focus:border-[#DBC278] focus:ring-[#DBC278]/20"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-zinc-600 mt-1 ml-1">Mínimo de 6 caracteres.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold text-base rounded-xl mt-2 shadow-[0_0_20px_rgba(219,194,120,0.2)] hover:shadow-[0_0_30px_rgba(219,194,120,0.4)] transition-all"
                        disabled={loading}
                    >
                        {loading ? "Criando Conta..." : "Começar Agora"}
                    </Button>
                </form>

                <p className="text-center mt-8 text-xs text-zinc-600">
                    Já tem uma conta? <Link href="/login" className="text-[#DBC278] hover:underline font-medium">Fazer Login</Link>
                </p>
            </div>
        </div>
    )
}
