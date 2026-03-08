"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Loader2, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase"

function SubscriptionSuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const transactionId = searchParams.get('transaction_id')

    const [loading, setLoading] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed'>('pending')
    const [checkingPayment, setCheckingPayment] = useState(true)

    useEffect(() => {
        if (!transactionId) {
            setCheckingPayment(false)
            return
        }

        const checkPayment = async () => {
            console.log('Checking payment for:', transactionId)
            const { data, error } = await supabase
                .from('payments')
                .select('status')
                .eq('transaction_id', transactionId)
                .single()

            console.log('Payment status check:', { data, error })

            if (data?.status === 'confirmed') {
                setPaymentStatus('confirmed')
                setCheckingPayment(false)
            }
        }

        // Initial check
        checkPayment()

        // Poll every 3 seconds
        const interval = setInterval(checkPayment, 3000)

        return () => clearInterval(interval)
    }, [transactionId])

    const handleCreateAccount = async () => {
        if (paymentStatus !== 'confirmed') return

        setLoading(true)
        try {
            const res = await fetch("/api/invites", { method: "POST" })
            const data = await res.json()
            if (data.code) {
                router.push(`/cadastro/${data.code}`)
            }
        } catch (error) {
            console.error("Erro ao gerar convite:", error)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white p-6 font-sans relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#DBC278]/10 blur-[100px] rounded-full pointer-events-none opacity-50"></div>

            <div className="relative z-10 flex flex-col items-center max-w-md text-center">
                <div className="mb-8 relative">
                    <div className="w-24 h-24 bg-[#DBC278]/10 rounded-full flex items-center justify-center border border-[#DBC278]/20 shadow-[0_0_40px_-10px_rgba(219,194,120,0.3)] animate-in zoom-in duration-700">
                        <CheckCircle2 className="w-10 h-10 text-[#DBC278]" />
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                    Pagamento Confirmado!
                </h1>

                <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
                    Sua assinatura foi ativada com sucesso.<br />
                    Agora você tem acesso ilimitado a todos os recursos do seu plano.
                </p>

                <div className="space-y-4 w-full">
                    <Button
                        onClick={handleCreateAccount}
                        disabled={loading || paymentStatus !== 'confirmed'}
                        className={`w-full h-14 font-bold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${paymentStatus === 'confirmed'
                            ? "bg-[#DBC278] hover:bg-[#c9b06b] text-black shadow-[0_0_20px_rgba(219,194,120,0.2)] hover:shadow-[0_0_30px_rgba(219,194,120,0.4)]"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Gerando acesso...
                            </>
                        ) : paymentStatus === 'confirmed' ? (
                            <>
                                Criar minha conta
                                <ArrowRight className="w-5 h-5" />
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                Aguardando confirmação...
                            </>
                        )}
                    </Button>

                    <Link href="/" className="w-full block">
                        <Button variant="ghost" className="w-full h-12 text-zinc-500 hover:text-white hover:bg-white/5 font-medium rounded-xl">
                            Voltar ao Início
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-8 text-zinc-600 text-xs">
                ID da Transação: {transactionId || '---'}
            </div>
        </div>
    )
}

export default function SubscriptionSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#DBC278]" />
            </div>
        }>
            <SubscriptionSuccessContent />
        </Suspense>
    )
}
