"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoveLeft, Crown, Check, Star, ShieldCheck } from "lucide-react"
import NextImage from "next/image"
import { BottomStickyCTA } from "@/components/BottomStickyCTA"

export default function VipPage() {
    const router = useRouter()

    const handleSubscribe = () => {
        const message = "Olá, gostaria de assinar o *Tito VIP* e ter cortes ilimitados!"
        window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank')
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans pb-64">
            {/* Header / Nav */}
            <header className="absolute top-0 left-0 right-0 p-6 z-50 flex items-center justify-between">
                <button
                    onClick={() => router.push('/')}
                    className="w-12 h-12 rounded-full bg-[#1c1c1c] flex items-center justify-center text-white hover:bg-zinc-800 transition-colors border border-zinc-700 shadow-lg z-50"
                >
                    <MoveLeft className="w-6 h-6" />
                </button>
                <div className="bg-[#DBC278]/10 backdrop-blur-md px-3 py-1 rounded-full border border-[#DBC278]/20">
                    <span className="text-[#DBC278] text-xs font-bold tracking-widest uppercase">Membro VIP</span>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative w-full overflow-hidden bg-[#09090b]">
                {/* Background Glows */}
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-[#DBC278]/20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 px-6 pt-32 pb-8">
                    <h1 className="text-4xl font-black text-white leading-[1.1] mb-2 tracking-tight">
                        Seu Estilo <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DBC278] to-[#FCE59F]">Sem Limites.</span>
                    </h1>
                    <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-xs">
                        Acesso total à barbearia por um valor único mensal.
                    </p>
                </div>

                {/* THE BLACK CARD - Premium Refined */}
                <div className="px-6 mb-12 relative z-20 perspective-1000">
                    <div className="w-full aspect-[1.586] bg-[url('/noise.png')] bg-zinc-950 rounded-3xl border border-white/10 shadow-[0_30px_60px_-12px_rgba(219,194,120,0.15)] relative overflow-hidden group hover:scale-[1.02] transition-transform duration-700">

                        {/* Luxury Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-black opacity-90 z-0"></div>

                        {/* Gold Foil Effect on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#DBC278]/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out z-20 skew-x-12 pointer-events-none"></div>

                        {/* Card Content */}
                        <div className="absolute inset-0 p-7 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <Crown className="w-8 h-8 text-[#DBC278] drop-shadow-[0_0_8px_rgba(219,194,120,0.6)]" />
                                    <div className="h-8 w-[1px] bg-zinc-800"></div>
                                    <span className="text-zinc-500 font-bold tracking-[0.2em] text-[10px] uppercase">Tito Barber</span>
                                </div>
                                <span className="text-[#DBC278] font-bold tracking-[0.2em] text-[10px] uppercase border border-[#DBC278]/30 px-2 py-1 rounded">VIP Access</span>
                            </div>

                            {/* EMV Chip Simulation */}
                            <div className="w-12 h-9 rounded-md bg-gradient-to-br from-[#eecda3] to-[#ef629f] relative overflow-hidden opacity-80 shadow-inner border border-[#DBC278]/20">
                                <div className="absolute left-[30%] top-0 bottom-0 w-[1px] bg-black/30"></div>
                                <div className="absolute right-[30%] top-0 bottom-0 w-[1px] bg-black/30"></div>
                                <div className="absolute top-[30%] left-0 right-0 h-[1px] bg-black/30"></div>
                                <div className="absolute bottom-[30%] left-0 right-0 h-[1px] bg-black/30"></div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end">
                                    <div className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Titular</div>
                                    <div className="text-[#DBC278] text-[8px] font-bold tracking-widest uppercase mb-1 opacity-60">Desde 2024</div>
                                </div>
                                <div className="text-white font-mono text-xl tracking-widest drop-shadow-md">LUCAS SANTOS</div>
                            </div>
                        </div>

                        {/* Subtle Noise Texture */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                    </div>

                    {/* Reflection under card */}
                    <div className="h-4 w-[80%] mx-auto bg-[#DBC278]/20 blur-2xl rounded-full mt-6 opacity-60"></div>
                </div>
            </div>

            {/* Benefits Grid */}
            <main className="px-6 relative z-20 bg-[#09090b]">

                {/* 2-Column Grid for Speed Reading */}
                <div className="grid grid-cols-2 gap-3 mb-12">
                    <div className="bg-[#151515] p-5 rounded-3xl border border-zinc-800/60 flex flex-col items-center text-center gap-3 hover:border-[#DBC278]/20 transition-colors shadow-lg">
                        <div className="w-10 h-10 rounded-full bg-[#1c1c1c] flex items-center justify-center border border-zinc-800 text-[#DBC278] shadow-inner">
                            <Check className="w-5 h-5" />
                        </div>
                        <span className="text-zinc-200 font-bold text-xs uppercase tracking-wide">Cortes Ilimitados</span>
                    </div>
                    <div className="bg-[#151515] p-5 rounded-3xl border border-zinc-800/60 flex flex-col items-center text-center gap-3 hover:border-[#DBC278]/20 transition-colors shadow-lg">
                        <div className="w-10 h-10 rounded-full bg-[#1c1c1c] flex items-center justify-center border border-zinc-800 text-[#DBC278] shadow-inner">
                            <Star className="w-5 h-5" />
                        </div>
                        <span className="text-zinc-200 font-bold text-xs uppercase tracking-wide">Agenda VIP</span>
                    </div>
                    <div className="bg-[#151515] p-5 rounded-3xl border border-zinc-800/60 flex flex-col items-center text-center gap-3 hover:border-[#DBC278]/20 transition-colors shadow-lg">
                        <div className="w-10 h-10 rounded-full bg-[#1c1c1c] flex items-center justify-center border border-zinc-800 text-[#DBC278] shadow-inner">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-zinc-200 font-bold text-xs uppercase tracking-wide">Sem Multas</span>
                    </div>
                    <div className="bg-[#151515] p-5 rounded-3xl border border-zinc-800/60 flex flex-col items-center text-center gap-3 hover:border-[#DBC278]/20 transition-colors shadow-lg">
                        <div className="w-10 h-10 rounded-full bg-[#1c1c1c] flex items-center justify-center border border-zinc-800 text-[#DBC278] shadow-inner">
                            <Crown className="w-5 h-5" />
                        </div>
                        <span className="text-zinc-200 font-bold text-xs uppercase tracking-wide">Status Premium</span>
                    </div>
                </div>

                {/* Comparison Table (Pro vs Basic) */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h2 className="text-xl font-bold text-white">Comparativo</h2>
                        <span className="text-[10px] text-[#DBC278] font-bold uppercase tracking-widest border border-[#DBC278]/30 px-2 py-1 rounded-full">Economia Garantida</span>
                    </div>

                    <div className="bg-[#151515] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
                        {/* Header Row */}
                        <div className="grid grid-cols-3 bg-zinc-900 border-b border-zinc-800">
                            <div className="p-4"></div>
                            <div className="p-4 text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">Avulso</div>
                            <div className="p-4 text-center text-[10px] font-black text-[#DBC278] uppercase bg-[#DBC278]/5 tracking-widest border-b-2 border-[#DBC278]">VIP Member</div>
                        </div>

                        {/* Row 1 */}
                        <div className="grid grid-cols-3 border-b border-zinc-800/50">
                            <div className="p-4 py-6 text-xs font-bold text-zinc-400 self-center">Custo Médio</div>
                            <div className="p-4 py-6 text-center text-sm font-medium text-zinc-500">R$ 100+</div>
                            <div className="p-4 py-6 text-center text-lg font-bold text-white bg-[#DBC278]/5">R$ 99</div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-3 border-b border-zinc-800/50">
                            <div className="p-4 py-6 text-xs font-bold text-zinc-400 self-center">Frequência</div>
                            <div className="p-4 py-6 text-center text-sm font-medium text-zinc-500">2x mês</div>
                            <div className="p-4 py-6 text-center text-lg font-bold text-white bg-[#DBC278]/5">Ilimitado</div>
                        </div>

                        {/* Row 3 */}
                        <div className="grid grid-cols-3">
                            <div className="p-4 py-6 text-xs font-bold text-zinc-400 self-center">Estilo</div>
                            <div className="p-4 py-6 text-center text-sm font-medium text-zinc-500">Básico</div>
                            <div className="p-4 py-6 text-center text-lg font-bold text-[#DBC278] bg-[#DBC278]/5">Impecável</div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="space-y-4 mb-32">
                    <h2 className="text-xl font-bold text-white">Dúvidas Frequentes</h2>
                    <div className="divide-y divide-zinc-800">
                        <div className="py-4">
                            <h4 className="text-white font-medium text-sm mb-1">Como funciona o pagamento?</h4>
                            <p className="text-zinc-500 text-xs leading-relaxed">Assinatura no cartão de crédito ou PIX recorrente. Sem comprometer o limite.</p>
                        </div>
                        <div className="py-4">
                            <h4 className="text-white font-medium text-sm mb-1">Posso cancelar?</h4>
                            <p className="text-zinc-500 text-xs leading-relaxed">Sim, a qualquer momento pelo WhatsApp. Sem burocracia.</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Sticky CTA */}
            <BottomStickyCTA className="bg-[#09090b]/90 border-zinc-800 backdrop-blur-xl">
                <Button
                    className="w-full bg-[#DBC278] text-black font-extrabold text-lg h-14 rounded-xl hover:bg-[#c9b06b] shadow-[0_0_25px_rgba(219,194,120,0.4)] transition-all transform active:scale-[0.98]"
                    onClick={handleSubscribe}
                >
                    QUERO SER VIP • R$ 99,90
                </Button>
                <div className="mt-3 flex items-center justify-between px-2">
                    <button
                        onClick={() => router.push('/')}
                        className="text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Voltar
                    </button>
                    <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Compra Segura
                    </span>
                </div>
            </BottomStickyCTA>
        </div>
    )
}
