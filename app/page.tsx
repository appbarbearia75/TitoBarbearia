import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, Scissors } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-yellow-500 selection:text-black font-sans">

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-black" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">BarberPlatform</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
                        <Link href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</Link>
                        <Link href="#precos" className="hover:text-white transition-colors">Preços</Link>
                        <Link href="/tito-barber" className="hover:text-white transition-colors">Ver Demo</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-bold text-white hover:text-yellow-500 transition-colors">
                            Entrar
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider mb-8">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                        A plataforma nº 1 para Barbearias
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent max-w-4xl">
                        Sua Barbearia em <br className="hidden md:block" />Outro Nível.
                    </h1>

                    <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
                        Tenha seu próprio aplicativo de agendamentos, clube de assinatura e gestão completa.
                        Tudo isso com a sua marca e identidade visual.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Link href="/tito-barber">
                            <Button variant="outline" className="w-full sm:w-auto h-14 px-8 border-neutral-800 text-white hover:bg-neutral-900 rounded-full font-bold text-lg">
                                Ver Demonstração
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="funcionalidades" className="py-20 bg-neutral-900/50 border-y border-white/5">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16">Tudo que você precisa</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Agendamento Online", desc: "Seus clientes agendam em segundos, sem precisar ligar." },
                            { title: "Clube de Assinatura", desc: "Crie planos recorrentes e garanta receita mensal." },
                            { title: "Gestão Financeira", desc: "Controle total do caixa, comissões e despesas." },
                            { title: "Site Personalizado", desc: "Sua marca, suas cores. Um app com a sua cara." },
                            { title: "Lembretes Automáticos", desc: "Reduza faltas com avisos via WhatsApp." },
                            { title: "Admin Completo", desc: "Painel administrativo para você e sua equipe." }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-neutral-950 border border-white/5 hover:border-yellow-500/50 transition-colors group">
                                <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 transition-colors">
                                    <Check className="w-6 h-6 text-neutral-500 group-hover:text-black transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-neutral-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/10 mt-20">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
                    <p className="text-sm">© 2024 BarberPlatform. Feito com tecnologia de ponta.</p>
                    <div className="flex gap-6 text-sm font-medium">
                        <Link href="#" className="hover:text-white">Termos</Link>
                        <Link href="#" className="hover:text-white">Privacidade</Link>
                        <Link href="#" className="hover:text-white">Suporte</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
