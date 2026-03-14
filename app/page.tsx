"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
    ArrowRight, 
    Check, 
    Scissors, 
    BarChart3, 
    Users, 
    Calendar, 
    DollarSign, 
    Smartphone, 
    ShieldCheck, 
    Star,
    X,
    MessageSquare,
    TrendingUp,
    Package,
    Bell,
    Lock
} from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-white selection:bg-[#DBC278] selection:text-black font-sans scroll-smooth">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/simbol-and-logo-horizontal.svg" alt="BarberPlatform" className="h-12 w-auto" />
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <Link href="#beneficios" className="hover:text-white transition-colors">Benefícios</Link>
                        <Link href="#diferencial" className="hover:text-white transition-colors">Como Funciona</Link>
                        <Link href="#precos" className="hover:text-white transition-colors">Planos</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                            Fazer Login
                        </Link>
                        <Link href="/cadastro">
                            <Button className="bg-[#DBC278] text-black hover:bg-[#c9b06b] font-bold rounded-lg h-10 px-6 transition-all shadow-[0_0_15px_rgba(219,194,120,0.2)]">
                                Teste grátis
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* 1️⃣ HERO (primeira dobra) */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#DBC278]/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

                <div className="container mx-auto flex flex-col items-center text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl lg:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent max-w-5xl leading-[1.1]">
                        Transforme sua barbearia em um negócio organizado e lucrativo.
                    </h1>

                    <p className="text-xl text-zinc-400 max-w-3xl mb-10 leading-relaxed font-light">
                        Agenda inteligente, CRM de clientes, controle financeiro e automações que fazem sua barbearia crescer.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-6">
                        <Link href="/cadastro" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-16 px-10 bg-[#DBC278] hover:bg-[#c9b06b] text-black rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(219,194,120,0.3)] hover:shadow-[0_0_60px_rgba(219,194,120,0.5)] transition-all transform hover:-translate-y-1">
                                Começar teste grátis
                            </Button>
                        </Link>
                        <Link href="#visual" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-16 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-2xl font-bold text-lg backdrop-blur-sm">
                                Ver como funciona
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 text-sm font-medium text-zinc-400 mb-16">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#DBC278]" />
                            <span>Seus dados estão seguros</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 rounded-full bg-zinc-700"></div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span>Teste grátis por 7 dias</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 rounded-full bg-zinc-700"></div>
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-[#DBC278]" />
                            <span>Cancele quando quiser</span>
                        </div>
                    </div>

                    {/* Mockup / Prints */}
                    <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#1c1c1c]/50 p-2 md:p-4 shadow-2xl backdrop-blur-sm overflow-hidden mb-12">
                        <div className="w-full aspect-video bg-zinc-900 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                            {/* Dashboard Placeholder Text */}
                            <div className="text-zinc-600 text-lg font-medium flex items-center justify-center h-full w-full bg-gradient-to-br from-[#1c1c1c] to-[#09090b]">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 w-full h-full opacity-30">
                                    <div className="bg-zinc-800 rounded-lg col-span-2 md:col-span-1 border border-white/5"></div>
                                    <div className="bg-zinc-800 rounded-lg border border-white/5"></div>
                                    <div className="bg-zinc-800 rounded-lg border border-white/5"></div>
                                    <div className="bg-zinc-800 rounded-lg border border-white/5"></div>
                                    <div className="bg-zinc-800 rounded-lg col-span-2 md:col-span-3 row-span-2 border border-white/5"></div>
                                    <div className="bg-zinc-800 rounded-lg row-span-2 border border-white/5"></div>
                                </div>
                                <span className="absolute">Interface do Dashboard / Agenda / CRM / Financeiro</span>
                            </div>
                        </div>
                    </div>

                    {/* Prova social rápida */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex text-[#DBC278]">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                        </div>
                        <p className="text-zinc-300 font-medium">
                            Mais de 2.000 barbearias organizando seus negócios com o Agendaê
                        </p>
                    </div>
                </div>
            </section>

            {/* 2️⃣ Sessão de dores (identificação) */}
            <section className="py-24 bg-[#09090b] relative border-t border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Sua barbearia passa por isso?</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                        {[
                            "Agenda bagunçada no WhatsApp",
                            "Clientes esquecem horário",
                            "Difícil saber quanto realmente faturou",
                            "Clientes cortam uma vez e nunca mais voltam",
                            "Controle financeiro confuso",
                            "Comissão de barbeiros complicada"
                        ].map((dor, i) => (
                            <div key={i} className="bg-[#1c1c1c] p-6 rounded-2xl border border-red-500/10 flex items-start gap-4">
                                <div className="mt-1 bg-red-500/10 p-1.5 rounded-full shrink-0">
                                    <X className="w-4 h-4 text-red-500" />
                                </div>
                                <p className="text-zinc-300 font-medium text-lg">{dor}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <p className="text-xl text-[#DBC278] font-medium mb-8">
                            O Agendaê resolve tudo isso em um único sistema.
                        </p>
                        <Link href="#beneficios">
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                                Conhecer o sistema
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 3️⃣ Sessão de benefícios (não features) */}
            <section id="beneficios" className="py-24 bg-[#111] relative border-t border-white/5">
                <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-[#DBC278]/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight">
                            Tudo que você precisa para organizar e crescer sua barbearia
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 hover:border-[#DBC278]/20 transition-colors">
                            <div className="w-12 h-12 bg-[#DBC278]/10 rounded-xl flex items-center justify-center mb-6">
                                <Calendar className="w-6 h-6 text-[#DBC278]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Agenda Inteligente</h3>
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                Clientes agendam online e sua agenda se organiza automaticamente.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> múltiplos barbeiros</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> horários automáticos</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> controle de disponibilidade</li>
                            </ul>
                        </div>

                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 hover:border-[#DBC278]/20 transition-colors">
                            <div className="w-12 h-12 bg-[#DBC278]/10 rounded-xl flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-[#DBC278]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">CRM de Clientes</h3>
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                Veja exatamente quem são seus melhores clientes.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> frequência de visitas</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> gasto total (LTV)</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> clientes VIP</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> clientes em risco</li>
                            </ul>
                        </div>

                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 hover:border-[#DBC278]/20 transition-colors">
                            <div className="w-12 h-12 bg-[#DBC278]/10 rounded-xl flex items-center justify-center mb-6">
                                <DollarSign className="w-6 h-6 text-[#DBC278]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Controle Financeiro</h3>
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                Saiba exatamente quanto entra e sai.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> caixa automático</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> ticket médio</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> previsão de faturamento</li>
                            </ul>
                        </div>

                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 hover:border-[#DBC278]/20 transition-colors lg:col-span-1 lg:col-start-1 lg:ml-auto lg:w-full lg:max-w-md">
                            <div className="w-12 h-12 bg-[#DBC278]/10 rounded-xl flex items-center justify-center mb-6">
                                <TrendingUp className="w-6 h-6 text-[#DBC278]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Relatórios de Crescimento</h3>
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                Entenda a saúde da sua barbearia.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> retenção de clientes</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> faturamento mensal</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> análise de clientes</li>
                            </ul>
                        </div>

                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 hover:border-[#DBC278]/20 transition-colors lg:col-span-2 lg:w-full lg:max-w-md">
                            <div className="w-12 h-12 bg-[#DBC278]/10 rounded-xl flex items-center justify-center mb-6">
                                <Package className="w-6 h-6 text-[#DBC278]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Estoque Integrado</h3>
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                Controle produtos e vendas em um só lugar.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> entrada de produtos</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> controle de estoque</li>
                                <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="w-4 h-4 text-[#DBC278]" /> margem de lucro</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4️⃣ Sessão de diferencial */}
            <section id="diferencial" className="py-24 bg-[#09090b] border-t border-white/5">
                <div className="container mx-auto px-6">
                    <div className="md:w-3/4 lg:w-2/3 mx-auto bg-gradient-to-r from-[#DBC278]/20 to-transparent p-1 sm:p-px rounded-3xl">
                        <div className="bg-[#111] p-8 md:p-12 rounded-[23px] flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#25D366]/10 mb-6">
                                    <MessageSquare className="w-6 h-6 text-[#25D366]" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">O sistema que trabalha por você</h2>
                                <p className="text-lg text-zinc-300 mb-6 leading-relaxed">
                                    Quando alguém agenda ou cancela um horário, o barbeiro recebe aviso automático no WhatsApp.
                                </p>
                                <p className="text-lg text-zinc-400 mb-8 italic">
                                    Sem precisar ficar abrindo o aplicativo durante o dia.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-white font-medium">
                                        <div className="bg-[#25D366]/20 p-1 rounded-full"><Check className="w-4 h-4 text-[#25D366]" /></div>
                                        notificação de novo agendamento
                                    </li>
                                    <li className="flex items-center gap-3 text-white font-medium">
                                        <div className="bg-[#25D366]/20 p-1 rounded-full"><Check className="w-4 h-4 text-[#25D366]" /></div>
                                        aviso de cancelamento
                                    </li>
                                    <li className="flex items-center gap-3 text-white font-medium">
                                        <div className="bg-[#25D366]/20 p-1 rounded-full"><Check className="w-4 h-4 text-[#25D366]" /></div>
                                        lembrete dos próximos clientes
                                    </li>
                                </ul>
                            </div>
                            
                            {/* Mockup WhatsApp */}
                            <div className="w-full max-w-[280px] shrink-0 bg-[#0b141a] rounded-[2rem] border-[8px] border-zinc-800 h-[500px] relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 left-0 right-0 h-16 bg-[#202c33] flex items-center px-4 gap-3 z-10">
                                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                                        <img src="/simbol-logo.svg" className="w-5 h-5 opacity-50" />
                                    </div>
                                    <span className="text-white font-medium text-sm">Agendaê Bot</span>
                                </div>
                                <div className="absolute inset-0 pt-20 pb-4 px-3 flex flex-col gap-3 justify-end bg-[#0b141a] z-0 overflow-hidden opacity-90" style={{backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover', backgroundBlendMode: 'overlay'}}>
                                    <div className="bg-[#202c33] text-zinc-200 text-sm p-3 rounded-lg rounded-tl-none self-start max-w-[90%] shadow-sm">
                                        Aviso de Agendamento: Lucas Silva marcou Corte para hoje às 14:00.
                                    </div>
                                    <div className="bg-[#202c33] text-zinc-200 text-sm p-3 rounded-lg rounded-tl-none self-start max-w-[90%] shadow-sm">
                                        Seu próximo cliente é João Paulo (Corte + Barba) em 15 minutos.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5️⃣ Sessão de inteligência do sistema */}
            <section className="py-24 bg-[#09090b] relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl mx-auto">
                        <div className="flex-1 order-2 lg:order-1 relative">
                            <div className="absolute -inset-4 bg-[#DBC278]/5 rounded-3xl blur-2xl"></div>
                            {/* CRM Mockup Placeholder */}
                            <div className="relative bg-[#1c1c1c] border border-white/10 rounded-2xl p-6 shadow-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="font-bold text-white text-lg">Clientes VIP</div>
                                    <Users className="text-[#DBC278] w-5 h-5" />
                                </div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800"></div>
                                                <div>
                                                    <div className="h-3 w-24 bg-zinc-700 rounded mb-2"></div>
                                                    <div className="h-2 w-16 bg-zinc-800 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[#DBC278] font-bold text-sm">R$ {1200 - i*200},00</div>
                                                <div className="text-xs text-zinc-500">{15 - i*2} visitas</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 order-1 lg:order-2">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                Entenda seus clientes como nunca antes
                            </h2>
                            <p className="text-xl text-zinc-400 mb-8">
                                O Agendaê mostra:
                            </p>
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3 text-lg font-medium text-white">
                                    <div className="w-2 h-2 rounded-full bg-[#DBC278]" /> clientes VIP
                                </li>
                                <li className="flex items-center gap-3 text-lg font-medium text-white">
                                    <div className="w-2 h-2 rounded-full bg-red-500" /> clientes em risco
                                </li>
                                <li className="flex items-center gap-3 text-lg font-medium text-white">
                                    <div className="w-2 h-2 rounded-full bg-[#DBC278]" /> frequência de visitas
                                </li>
                                <li className="flex items-center gap-3 text-lg font-medium text-white">
                                    <div className="w-2 h-2 rounded-full bg-[#DBC278]" /> gasto total por cliente
                                </li>
                            </ul>

                            <div className="bg-[#111] border border-white/5 p-6 rounded-2xl">
                                <p className="text-zinc-400 mb-4 font-medium uppercase tracking-wider text-sm">Isso ajuda você a:</p>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3 text-white"><ArrowRight className="w-4 h-4 text-[#DBC278]" /> recuperar clientes</div>
                                    <div className="flex items-center gap-3 text-white"><ArrowRight className="w-4 h-4 text-[#DBC278]" /> aumentar faturamento</div>
                                    <div className="flex items-center gap-3 text-white"><ArrowRight className="w-4 h-4 text-[#DBC278]" /> fidelizar clientes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6️⃣ Sessão visual do sistema */}
            <section id="visual" className="py-24 bg-[#111] border-t border-white/5">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white">Veja o Agendaê em ação</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                        {[
                            { name: "Dashboard", icon: BarChart3 },
                            { name: "Agenda", icon: Calendar },
                            { name: "CRM clientes", icon: Users },
                            { name: "Caixa / vendas", icon: DollarSign },
                            { name: "Estoque", icon: Package },
                            { name: "Relatórios", icon: TrendingUp }
                        ].map((item, index) => (
                            <div key={index} className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center aspect-square md:aspect-video hover:border-[#DBC278]/30 hover:bg-[#DBC278]/5 transition-all group cursor-default">
                                <item.icon className="w-10 h-10 text-zinc-600 group-hover:text-[#DBC278] transition-colors mb-4" />
                                <span className="text-zinc-400 group-hover:text-white font-medium text-center">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7️⃣ Sessão de crescimento */}
            <section className="py-24 bg-[#09090b] relative overflow-hidden">
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-16 max-w-4xl mx-auto leading-tight">
                        Transforme sua barbearia em um negócio previsível
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[#1c1c1c] flex items-center justify-center border border-white/10 mb-6">
                                <TrendingUp className="w-8 h-8 text-[#DBC278]" />
                            </div>
                            <p className="text-lg font-bold text-white text-center">saiba quanto vai faturar no mês</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[#1c1c1c] flex items-center justify-center border border-white/10 mb-6">
                                <Users className="w-8 h-8 text-[#DBC278]" />
                            </div>
                            <p className="text-lg font-bold text-white text-center">aumente a recorrência de clientes</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[#1c1c1c] flex items-center justify-center border border-white/10 mb-6">
                                <BarChart3 className="w-8 h-8 text-[#DBC278]" />
                            </div>
                            <p className="text-lg font-bold text-white text-center">entenda os números do seu negócio</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[#1c1c1c] flex items-center justify-center border border-white/10 mb-6">
                                <DollarSign className="w-8 h-8 text-[#DBC278]" />
                            </div>
                            <p className="text-lg font-bold text-white text-center">aumente o ticket médio</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8️⃣ Sessão de comparação */}
            <section className="py-24 bg-[#111] border-y border-white/5">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Agenda no WhatsApp vs Agendaê</h2>
                    </div>

                    <div className="bg-[#1c1c1c] rounded-3xl overflow-hidden border border-white/5">
                        <div className="grid grid-cols-2 bg-black/50 border-b border-white/5">
                            <div className="p-6 text-center text-zinc-500 font-bold text-xl">WhatsApp</div>
                            <div className="p-6 text-center text-[#DBC278] font-bold text-xl flex items-center justify-center gap-2">
                                <img src="/simbol-logo.svg" className="w-6 h-6 grayscale brightness-200 invert" /> Agendaê
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {[
                                ["horários confusos", "agenda automática"],
                                ["clientes esquecem", "controle de clientes"],
                                ["sem relatórios", "métricas completas"],
                                ["controle manual", "financeiro automático"]
                            ].map((row, i) => (
                                <div key={i} className="grid grid-cols-2 hover:bg-white/[0.02] transition-colors">
                                    <div className="p-6 text-center text-zinc-400 flex items-center justify-center gap-3">
                                        <X className="w-5 h-5 text-red-500 shrink-0" />
                                        <span>{row[0]}</span>
                                    </div>
                                    <div className="p-6 text-center text-white font-medium flex items-center justify-center gap-3 border-l border-white/5 bg-[#DBC278]/5">
                                        <Check className="w-5 h-5 text-[#DBC278] shrink-0" />
                                        <span>{row[1]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 9️⃣ Sessão de depoimentos */}
            <section className="py-24 bg-[#09090b]">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">O que donos de barbearia dizem</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                name: "Carlos Silva",
                                shop: "Barbearia Vintage",
                                text: "Depois que comecei a usar o Agendaê minha barbearia ficou muito mais organizada.",
                            },
                            {
                                name: "André Santos",
                                shop: "The King Barber",
                                text: "Agora sei exatamente quanto cada cliente já gastou.",
                            },
                            {
                                name: "Rafael Lima",
                                shop: "Corte Moderno",
                                text: "O controle financeiro é absurdo de bom.",
                            }
                        ].map((feedback, i) => (
                            <div key={i} className="bg-[#1c1c1c] p-8 rounded-3xl border border-white/5 relative">
                                <div className="flex text-[#DBC278] mb-6">
                                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-zinc-300 mb-8 relative z-10 text-lg leading-relaxed">"{feedback.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white font-bold text-xl">
                                        {feedback.name.charAt(0)}
                                    </div>
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

            {/* 🔟 Sessão de preços */}
            <section id="precos" className="py-24 bg-[#111] border-y border-white/5">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Comece agora mesmo</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Mensal */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 flex flex-col hover:border-[#DBC278]/30 transition-all">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Mensal</h4>
                            </div>
                            <div className="mb-6">
                                <span className="text-sm font-bold text-zinc-500 align-top">R$</span>
                                <span className="text-4xl font-bold text-white">49,90</span>
                                <span className="text-zinc-500">/mês</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Agendamento e Gestão</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> Financeiro Completo</li>
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> CRM de clientes</li>
                            </ul>
                        </div>

                        {/* Anual */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-[#DBC278] relative transform md:-translate-y-4 shadow-2xl shadow-[#DBC278]/10 flex flex-col">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#DBC278] text-black px-4 py-2 rounded-xl uppercase tracking-wider shadow-lg shadow-[#DBC278]/20 flex flex-col items-center">
                                <span className="text-xs font-bold leading-none mb-0.5">Melhor Custo-Benefício</span>
                                <span className="text-[10px] font-extrabold opacity-80 leading-none">(2 Meses Off)</span>
                            </div>
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Anual</h4>
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
                                <li className="flex items-center gap-3 text-white"><div className="bg-[#DBC278] rounded-full p-1"><Check className="w-3 h-3 text-black" /></div> Tudo do mensal</li>
                                <li className="flex items-center gap-3 text-white"><div className="bg-[#DBC278] rounded-full p-1"><Check className="w-3 h-3 text-black" /></div> Prioridade no suporte</li>
                            </ul>
                        </div>

                        {/* Semestral */}
                        <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 flex flex-col hover:border-[#DBC278]/30 transition-all">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-white mb-2">Semestral</h4>
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
                                <li className="flex items-center gap-3 text-zinc-300"><Check className="w-5 h-5 text-[#DBC278]" /> CRM de clientes</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col items-center">
                        <Link href="/cadastro">
                            <Button className="h-16 px-12 bg-[#DBC278] hover:bg-[#c9b06b] text-black rounded-2xl font-bold text-xl shadow-[0_0_40px_rgba(219,194,120,0.3)] hover:shadow-[0_0_60px_rgba(219,194,120,0.5)] transition-all transform hover:-translate-y-1">
                                Começar teste grátis
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 11️⃣ Sessão final */}
            <section className="py-32 relative border-t border-white/5 overflow-hidden bg-[#09090b]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#DBC278]/10 to-transparent pointer-events-none"></div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Pronto para profissionalizar sua barbearia?</h2>
                    <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto font-light">
                        Pare de depender de agenda no WhatsApp e organize seu negócio de verdade.
                    </p>
                    <Link href="/cadastro">
                        <Button className="h-20 px-16 bg-[#DBC278] hover:bg-[#c9b06b] text-black rounded-full font-bold text-2xl shadow-2xl shadow-[#DBC278]/20 transition-transform hover:scale-105">
                            Começar teste grátis
                        </Button>
                    </Link>
                    
                    {/* Elementos que aumentam conversão final */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-zinc-400 font-medium">
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-[#DBC278]" />
                            <span>Seus dados estão seguros</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            <span>Teste grátis por 7 dias</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            <span>Cancele quando quiser</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 12️⃣ Rodapé */}
            <footer className="py-12 bg-black border-t border-white/10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-80">
                    <div className="flex items-center gap-3">
                        <img src="/simbol-logo.svg" alt="Logo" className="w-6 h-6 grayscale brightness-200" />
                        <p className="text-sm font-medium text-zinc-400">© 2024 Agendaê. Todos os direitos reservados.</p>
                    </div>
                    <div className="flex gap-6 text-sm font-medium text-zinc-400">
                        <Link href="#" className="hover:text-white transition-colors">Termos</Link>
                        <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
                        <Link href="#" className="hover:text-white transition-colors">Suporte</Link>
                        <Link href="#" className="hover:text-white transition-colors">Contato</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
