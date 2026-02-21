"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, Scissors, BarChart3, Users, Calendar, DollarSign, Smartphone, ShieldCheck, Star } from "lucide-react"
import { CheckoutModal } from "@/components/checkout/CheckoutModal"

export default function LandingPage() {
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly' | null>(null)

    const handleSubscribe = (plan: 'monthly' | 'quarterly' | 'yearly') => {
        setSelectedPlan(plan)
        setIsCheckoutOpen(true)
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-[#DBC278] selection:text-black font-sans">
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                plan={selectedPlan}
            />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/simbol-and-logo-horizontal.svg" alt="BarberPlatform" className="h-12 w-auto" />
                        <span className="hidden md:block text-[#DBC278] text-xs uppercase tracking-widest ml-2 font-medium bg-[#DBC278]/10 px-2 py-0.5 rounded-full border border-[#DBC278]/20">Enterprise</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <Link href="#recursos" className="hover:text-white transition-colors">Recursos</Link>
                        <Link href="#solucoes" className="hover:text-white transition-colors">Soluções</Link>
                        <Link href="#precos" className="hover:text-white transition-colors">Planos</Link>
                        <Link href="/demo" className="text-[#DBC278] hover:text-[#ead085] transition-colors">Ver Demonstração</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button className="bg-white text-black hover:bg-zinc-200 font-bold rounded-lg h-10 px-6 transition-all">
                                Fazer Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-12 px-6 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#DBC278]/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

                <div className="container mx-auto flex flex-col items-center text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                        Novo: Integração com WhatsApp
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent max-w-5xl leading-[1.1]">
                        A plataforma completa para gestão da sua barbearia.
                    </h1>

                    <p className="text-xl text-zinc-400 max-w-3xl mb-12 leading-relaxed font-light">
                        Agendamento, financeiro, comissões e marketing em um só lugar.
                        Tenha o controle total do seu negócio com a tecnologia usada pelas maiores redes do Brasil.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-slide-up">
                        <Link href="#precos" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-16 px-10 bg-[#DBC278] hover:bg-[#c9b06b] text-black rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(219,194,120,0.3)] hover:shadow-[0_0_60px_rgba(219,194,120,0.5)] transition-all transform hover:-translate-y-1">
                                Começar Agora
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/demo" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-16 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-2xl font-bold text-lg backdrop-blur-sm">
                                Ver Demonstração
                            </Button>
                        </Link>
                    </div>

                    {/* Social Proof */}
                    <div className="mt-12 pt-8 border-t border-white/5 w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-[#09090b] overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-left ml-3">
                                <div className="flex text-[#DBC278]">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                                </div>
                                <p className="text-xs font-medium text-white mt-1">+2.000 barbearias confiam</p>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-white/20 hidden md:block"></div>
                        <p className="text-sm font-medium">Gestão simplificada para <strong className="text-white">empresas de todos os tamanhos</strong>.</p>
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section id="recursos" className="pt-12 pb-32 bg-[#09090b] relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-[#DBC278] font-bold tracking-widest text-sm uppercase mb-4">Recursos Premium</h2>
                        <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Tudo que você precisa para crescer.</h3>
                        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Centralize sua operação. Elimine planilhas e apps desconexos.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {/* Large Card - Dashboard/Finance */}
                        <div className="md:col-span-2 bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 hover:border-[#DBC278]/30 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-32 bg-[#DBC278]/5 blur-3xl rounded-full"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-[#DBC278]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#DBC278]/20 group-hover:scale-110 transition-transform duration-300">
                                    <BarChart3 className="w-7 h-7 text-[#DBC278]" />
                                </div>
                                <h4 className="text-2xl font-bold mb-3 text-white">Gestão Financeira Completa</h4>
                                <p className="text-zinc-400 mb-8 max-w-md">Controle de caixa, fluxo de despesas, fechamento diário e previsibilidade de lucro em tempo real.</p>

                                <div className="bg-[#09090b] rounded-xl p-6 border border-white/5 shadow-2xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-zinc-500 text-xs uppercase font-bold">Faturamento Hoje</p>
                                            <p className="text-3xl font-bold text-white">R$ 2.850,00</p>
                                        </div>
                                        <div className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20 flex items-center gap-1">
                                            +15% vs ontem
                                        </div>
                                    </div>
                                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full w-[70%] bg-[#DBC278]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card - Scheduling */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 hover:border-[#DBC278]/30 transition-all group">
                            <div className="w-14 h-14 bg-[#DBC278]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#DBC278]/20 group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="w-7 h-7 text-[#DBC278]" />
                            </div>
                            <h4 className="text-2xl font-bold mb-3 text-white">Agendamento Inteligente</h4>
                            <p className="text-zinc-400">Link exclusivo para seus clientes agendarem 24/7 sem ocupar seu WhatsApp. Sincronização automática de horários.</p>
                        </div>

                        {/* Card - Commissions */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 hover:border-[#DBC278]/30 transition-all group">
                            <div className="w-14 h-14 bg-[#DBC278]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#DBC278]/20 group-hover:scale-110 transition-transform duration-300">
                                <DollarSign className="w-7 h-7 text-[#DBC278]" />
                            </div>
                            <h4 className="text-2xl font-bold mb-3 text-white">Aumente o faturamento</h4>
                            <p className="text-zinc-400">Chega de calcular na mão. Defina as % e o sistema divide o valor de cada serviço automaticamente.</p>
                        </div>

                        {/* Large Card - Marketing/Loyalty */}
                        <div className="md:col-span-2 bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 hover:border-[#DBC278]/30 transition-all group overflow-hidden relative">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-1">
                                    <div className="w-14 h-14 bg-[#DBC278]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#DBC278]/20 group-hover:scale-110 transition-transform duration-300">
                                        <Smartphone className="w-7 h-7 text-[#DBC278]" />
                                    </div>
                                    <h4 className="text-2xl font-bold mb-3 text-white">App Personalizado + Clube VIP</h4>
                                    <p className="text-zinc-400 mb-6">Ofereça um aplicativo com a sua marca. Fidelize clientes com planos de assinatura recorrente (Clube de Barbearia) e garanta receita todo mês.</p>
                                    <div className="flex items-center gap-4 text-sm font-medium text-white">
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#DBC278]" /><span>Sem taxas por agendamento</span></div>
                                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#DBC278]" /><span>Domínio próprio</span></div>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/3 bg-[#09090b] rounded-2xl p-4 border border-zinc-800 rotate-3 group-hover:rotate-0 transition-transform">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800"></div>
                                        <div>
                                            <div className="h-2 w-20 bg-zinc-800 rounded mb-1"></div>
                                            <div className="h-2 w-12 bg-zinc-800 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-12 w-full bg-[#DBC278] rounded-lg opacity-20"></div>
                                        <div className="h-12 w-full bg-zinc-800 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Soluções Section */}
            <section id="solucoes" className="py-24 bg-[#09090b] relative border-t border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-[#DBC278] font-bold tracking-widest text-sm uppercase mb-4">Soluções</h2>
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Resolvendo os problemas reais da sua barbearia</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[#1c1c1c] p-8 rounded-3xl border border-white/5 hover:border-[#DBC278]/30 transition-colors">
                            <div className="w-12 h-12 bg-[#DBC278]/10 rounded-xl flex items-center justify-center mb-6 border border-[#DBC278]/20">
                                <Users className="w-6 h-6 text-[#DBC278]" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-3">Redução de Faltas</h4>
                            <p className="text-zinc-400">Com lembretes automáticos via WhatsApp, seus clientes não esquecem o horário agendado.</p>
                        </div>
                        <div className="bg-[#1c1c1c] p-8 rounded-3xl border border-white/5 hover:border-[#DBC278]/30 transition-colors">
                            <div className="w-12 h-12 bg-[#DBC278]/10 rounded-xl flex items-center justify-center mb-6 border border-[#DBC278]/20">
                                <DollarSign className="w-6 h-6 text-[#DBC278]" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-3">Controle Financeiro</h4>
                            <p className="text-zinc-400">Saiba exatamente quanto entra e sai. Relatórios de comissões calculados automaticamente.</p>
                        </div>
                        <div className="bg-[#1c1c1c] p-8 rounded-3xl border border-white/5 hover:border-[#DBC278]/30 transition-colors">
                            <div className="w-12 h-12 bg-[#DBC278]/10 rounded-xl flex items-center justify-center mb-6 border border-[#DBC278]/20">
                                <Smartphone className="w-6 h-6 text-[#DBC278]" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-3">Fidelização de Clientes</h4>
                            <p className="text-zinc-400">Crie seu próprio clube de assinaturas e garanta que o cliente volte todos os meses.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feedbacks Section */}
            <section className="py-24 bg-[#1c1c1c] border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-[#DBC278] text-[#DBC278]" />)}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">O que dizem os donos de barbearia</h2>
                        <p className="text-zinc-400">Junte-se a mais de 2.000 barbearias que transformaram sua gestão.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Carlos Silva",
                                shop: "Barbearia Vintage",
                                text: "Desde que comecei a usar a plataforma, meu faturamento aumentou 30%. O controle financeiro é impecável.",
                                img: "https://i.pravatar.cc/150?img=11"
                            },
                            {
                                name: "André Santos",
                                shop: "The King Barber",
                                text: "A melhor decisão que tomei. Meus clientes adoram o agendamento online e o clube de assinatura é um sucesso.",
                                img: "https://i.pravatar.cc/150?img=12"
                            },
                            {
                                name: "Rafael Lima",
                                shop: "Corte Moderno",
                                text: "O suporte é incrível e a plataforma não para de evoluir. As comissões são calculadas sozinhas, uma maravilha.",
                                img: "https://i.pravatar.cc/150?img=13"
                            }
                        ].map((feedback, i) => (
                            <div key={i} className="bg-[#09090b] p-8 rounded-3xl border border-white/5 relative">
                                <div className="absolute top-8 right-8 text-[#DBC278] opacity-20 text-6xl font-serif">"</div>
                                <p className="text-zinc-300 mb-8 relative z-10 text-lg leading-relaxed">"{feedback.text}"</p>
                                <div className="flex items-center gap-4">
                                    <img src={feedback.img} alt={feedback.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#DBC278]" />
                                    <div>
                                        <h4 className="font-bold text-white">{feedback.name}</h4>
                                        <p className="text-[#DBC278] text-sm">{feedback.shop}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="precos" className="py-24 bg-[#09090b]">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-[#DBC278] font-bold tracking-widest text-sm uppercase mb-4">Planos e Preços</h2>
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Escolha o plano ideal para o seu momento</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Mensal */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 flex flex-col hover:border-[#DBC278]/30 transition-all">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Mensal</h4>
                                <p className="text-zinc-400 text-sm">Flexibilidade total.</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-sm font-bold text-zinc-500 align-top">R$</span>
                                <span className="text-4xl font-bold text-white">49,90</span>
                                <span className="text-zinc-500">/mês</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Agendamento e Gestão</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Financeiro Completo</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Aumente o faturamento</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Suporte 24hrs</li>
                            </ul>
                            <Link href="https://wa.me/5543998662506?text=Ol%C3%A1!%20Gostaria%20de%20assinar%20o%20plano%20Mensal%20da%20Agenda%C3%AA." target="_blank" className="w-full">
                                <Button
                                    variant="outline"
                                    className="w-full border-zinc-700 hover:bg-zinc-800 text-white"
                                >
                                    Assinar Mensal
                                </Button>
                            </Link>
                        </div>

                        {/* Anual */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-[#DBC278] relative transform md:-translate-y-4 shadow-2xl shadow-[#DBC278]/10 flex flex-col">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#DBC278] text-black px-4 py-2 rounded-xl uppercase tracking-wider shadow-lg shadow-[#DBC278]/20 flex flex-col items-center">
                                <span className="text-xs font-bold leading-none mb-0.5">Melhor Valor</span>
                                <span className="text-[10px] font-extrabold opacity-80 leading-none">(2 Meses Off)</span>
                            </div>
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Anual</h4>
                                <p className="text-zinc-400 text-sm">Para quem quer economizar.</p>
                            </div>
                            <div className="mb-6">
                                <div className="text-zinc-500 line-through text-sm mb-1">R$ 598,80</div>
                                <span className="text-sm font-bold text-zinc-500 align-top">R$</span>
                                <span className="text-5xl font-bold text-white">499,90</span>
                                <span className="text-zinc-500">/ano</span>
                                <div className="text-[#DBC278] font-bold text-sm mt-1">Eq. a R$ 41,65/mês</div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-white"><div className="bg-[#DBC278] rounded-full p-1"><Check className="w-3 h-3 text-black" /></div> <strong>2 Meses Grátis</strong></li>
                                <li className="flex items-center gap-3 text-white"><div className="bg-[#DBC278] rounded-full p-1"><Check className="w-3 h-3 text-black" /></div> Todas as Funções Pro</li>
                                <li className="flex items-center gap-3 text-white"><div className="bg-[#DBC278] rounded-full p-1"><Check className="w-3 h-3 text-black" /></div> Orientação no faturamento</li>
                            </ul>
                            <Link href="https://wa.me/5543998662506?text=Ol%C3%A1!%20Gostaria%20de%20assinar%20o%20plano%20Anual%20da%20Agenda%C3%AA." target="_blank" className="w-full">
                                <Button
                                    className="w-full bg-[#DBC278] hover:bg-[#c9b06b] text-black font-bold h-12"
                                >
                                    Assinar Anual
                                </Button>
                            </Link>
                        </div>

                        {/* Semestral */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 flex flex-col hover:border-[#DBC278]/30 transition-all">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Semestral</h4>
                                <p className="text-zinc-400 text-sm">Equilíbrio ideal.</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-sm font-bold text-zinc-500 align-top">R$</span>
                                <span className="text-4xl font-bold text-white">269,90</span>
                                <span className="text-zinc-500">/semestre</span>
                                <div className="text-zinc-500 text-sm mt-1">Eq. a R$ 44,98/mês</div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Agendamento e Gestão</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Financeiro Completo</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Aumente o faturamento</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Desconto de ~10%</li>
                            </ul>
                            <Link href="https://wa.me/5543998662506?text=Ol%C3%A1!%20Gostaria%20de%20assinar%20o%20plano%20Semestral%20da%20Agenda%C3%AA." target="_blank" className="w-full">
                                <Button
                                    variant="outline"
                                    className="w-full border-zinc-700 hover:bg-zinc-800 text-white"
                                >
                                    Assinar Semestral
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-zinc-500 mb-4">Precisa de um plano personalizado para rede de barbearias?</p>
                        <Link href="https://wa.me/5543998662506?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20planos%20para%20redes%20de%20barbearias." target="_blank" className="text-[#DBC278] hover:underline font-bold">Falar com Consultor da Agendaê</Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative border-t border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-[#DBC278]/5"></div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Pronto para profissionalizar sua barbearia?</h2>
                    <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">Junte-se às barbearias que mais crescem no Brasil. Entre em contato para uma consultoria personalizada.</p>
                    <Link href="https://wa.me/5543998662506?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20sistema%20para%20minha%20barbearia." target="_blank">
                        <Button className="h-16 px-12 bg-[#DBC278] hover:bg-[#c9b06b] text-black rounded-full font-bold text-lg shadow-2xl shadow-[#DBC278]/20 transition-transform hover:scale-105">
                            Falar com Consultor da Agendaê
                        </Button>
                    </Link>
                    <p className="mt-6 text-sm text-zinc-500 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Seus dados estão 100% seguros
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-black border-t border-white/10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
                    <div className="flex items-center gap-2">
                        <Scissors className="w-5 h-5 text-zinc-500" />
                        <p className="text-sm font-medium">© 2024 Agendaê.</p>
                    </div>
                    <div className="flex gap-8 text-sm font-medium">
                        <Link href="#" className="hover:text-white transition-colors">Termos</Link>
                        <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
                        <Link href="#" className="hover:text-white transition-colors">Suporte</Link>
                        <Link href="#" className="hover:text-white transition-colors">Contato Commercial</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
