"use client"

import { useState } from "react"
import { SERVICES } from "@/app/data"
import { ServiceCard } from "@/components/ServiceCard"
import { DateSelector } from "@/components/DateSelector"
import { BottomStickyCTA } from "@/components/BottomStickyCTA"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { Calendar, Crown, MapPin, Check, ChevronDown, ChevronUp, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"agenda" | "assinatura">("agenda")
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSelectService = (id: string) => {
    setSelectedService(selectedService === id ? null : id)
  }

  const handleConfirm = () => {
    if (selectedService) {
      // Format date as YYYY-MM-DD for URL
      const dateStr = selectedDate.toISOString().split('T')[0]
      router.push(`/booking?service=${selectedService}&date=${dateStr}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white pb-32 font-sans selection:bg-[#DBC278] selection:text-black">

      {/* HERO SECTION */}
      {/* HERO SECTION */}
      <div className="relative w-full h-[260px] overflow-hidden">
        {/* Background Image */}
        <NextImage
          src="/background_santthiago.png"
          alt="Barbershop Background"
          fill
          className="object-cover opacity-85"
          priority
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#09090b]"></div>

        {/* Admin Link (Hidden/Discrete) */}
        <button
          onClick={() => router.push('/admin')}
          className="absolute top-6 right-6 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white/50 hover:bg-black/50 hover:text-[#DBC278] transition-all backdrop-blur-sm"
        >
          <ChevronUp className="w-4 h-4" /> {/* Simple discreet icon, or Lock */}
        </button>

        <div className="absolute -bottom-20 left-0 right-0 flex flex-col items-center z-10">
          <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-b from-[#DBC278] to-[#b39220] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
            {/* Real Avatar */}
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden relative">
              <NextImage src="/avatar_santthiago.png" alt="Barber Profile" width={112} height={112} className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white drop-shadow-md">Santthiago Barbearia</h1>

          {/* 5-Star Rating */}
          <div className="flex items-center justify-center gap-1 mt-2 mb-1">
            <Star className="w-5 h-5 fill-[#DBC278] stroke-[#DBC278]" strokeWidth={1} />
            <Star className="w-5 h-5 fill-[#DBC278] stroke-[#DBC278]" strokeWidth={1} />
            <Star className="w-5 h-5 fill-[#DBC278] stroke-[#DBC278]" strokeWidth={1} />
            <Star className="w-5 h-5 fill-[#DBC278] stroke-[#DBC278]" strokeWidth={1} />
            <Star className="w-5 h-5 fill-[#DBC278] stroke-[#DBC278]" strokeWidth={1} />
          </div>

          <div className="glass flex items-center gap-1.5 text-xs font-medium text-zinc-300 mt-2 px-3 py-1 rounded-full">
            <MapPin className="w-3 h-3 text-[#DBC278]" />
            <span>Rua das Flores, 123 - Centro</span>
          </div>
        </div>
      </div>

      {/* TABS (Agenda / Assinatura) */}
      <div className="mt-24 px-6 flex gap-4 relative z-0">
        <button
          onClick={() => setActiveTab("agenda")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all border",
            activeTab === "agenda"
              ? "bg-black border-transparent text-white shadow-lg"
              : "bg-black border-transparent text-zinc-500 opacity-60"
          )}
        >
          <Calendar className={cn("w-4 h-4", activeTab === "agenda" ? "text-[#DBC278]" : "text-zinc-500")} />
          <span>Agenda</span>
        </button>
        <button
          onClick={() => setActiveTab("assinatura")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all border",
            activeTab === "assinatura"
              ? "bg-black border-transparent text-white shadow-lg"
              : "bg-black border-transparent text-zinc-500 opacity-60"
          )}
        >
          <Crown className={cn("w-4 h-4", activeTab === "assinatura" ? "text-[#DBC278]" : "text-zinc-500")} />
          <span>Assinatura</span>
        </button>
      </div>

      {/* CONTENT */}
      <main className="mt-8 px-6 space-y-8">
        {activeTab === "agenda" ? (
          <>
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Serviços</h2>
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">
                  {selectedService ? "1 Selecionado" : "0 Selecionados"}
                </span>
              </div>
              {/* List Style Container - Updated to Separate Cards */}
              <div className="space-y-3">
                {SERVICES.slice(0, isExpanded ? SERVICES.length : 4).map((service, index) => (
                  <div key={service.id} className="animate-enter" style={{ animationDelay: `${index * 50}ms` }}>
                    <ServiceCard
                      id={service.id}
                      title={service.title}
                      price={service.price}
                      icon={service.icon}
                      selected={selectedService === service.id}
                      onSelect={handleSelectService}
                    />
                  </div>
                ))}
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-3 py-3 flex items-center justify-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {isExpanded ? (
                  <>
                    <span>Ver menos serviços</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Ver todos os serviços ({SERVICES.length})</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>

              {!isExpanded && (
                <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-4"></div>
              )}
            </section>

            <section className="pb-8">
              <h2 className="text-lg font-bold mb-4 text-white">Escolha o dia</h2>
              <div className="-mx-6">
                <DateSelector selectedDate={selectedDate} onSelect={setSelectedDate} />
              </div>
            </section>
          </>
        ) : (
          <div className="relative group perspective-1000">
            <div className="w-full bg-[url('/noise.png')] bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_20px_40px_-10px_rgba(219,194,120,0.2)]">

              {/* Luxury Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-black opacity-90 z-0"></div>
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity z-10">
                <Crown className="w-40 h-40 text-[#DBC278] -rotate-12" />
              </div>

              <div className="relative z-10 p-8 flex flex-col items-center text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#DBC278]/30 bg-[#DBC278]/5 mb-6 backdrop-blur-md">
                  <Crown className="w-3 h-3 text-[#DBC278] fill-[#DBC278]" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#DBC278] uppercase">Tito Club Member</span>
                </div>

                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                  Cortes <span className="text-[#DBC278]">Ilimitados</span>
                </h2>
                <p className="text-zinc-400 text-sm font-medium mb-8 max-w-[280px] leading-relaxed">
                  Tenha acesso livre à barbearia e tratamento VIP em cada visita.
                </p>

                {/* Minimalist Price Display */}
                <div className="mb-8">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-[#DBC278] font-bold">R$</span>
                    <span className="text-5xl font-black text-white tracking-tighter">99</span>
                    <span className="text-xl font-bold text-zinc-400">,90</span>
                    <span className="text-sm text-zinc-500 font-medium">/mês</span>
                  </div>
                  <div className="text-zinc-600 text-[10px] font-medium uppercase tracking-wider mt-2 line-through">De R$ 150,00</div>
                </div>

                <Button
                  className="w-full h-14 bg-[#DBC278] hover:bg-[#c4ad6b] text-black font-extrabold text-lg rounded-xl shadow-[0_0_25px_rgba(219,194,120,0.3)] hover:shadow-[0_0_40px_rgba(219,194,120,0.5)] transition-all transform active:scale-[0.98] animate-pulse-slow"
                  onClick={() => router.push('/vip')}
                >
                  ATIVAR MEU VIP
                </Button>
                <p className="text-[10px] text-zinc-600 mt-3 font-medium uppercase tracking-wider">Saiba mais sobre os benefícios</p>
              </div>

              {/* Bottom Reflection */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-[#DBC278] blur-xl opacity-30"></div>
            </div>
          </div>
        )}
      </main>

      {/* CONFIRM BUTTON (Persistent) */}
      <BottomStickyCTA className="translate-y-0">
        <Button
          className={cn(
            "w-full font-bold text-lg h-14 rounded-xl transition-all",
            selectedService
              ? "bg-[#DBC278] text-black hover:bg-[#fcec9f] shadow-[0_0_20px_rgba(255,216,77,0.3)]"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed hover:bg-zinc-800"
          )}
          onClick={handleConfirm}
          disabled={!selectedService}
        >
          {selectedService ? "Confirmar Agendamento" : "Selecione um serviço"}
        </Button>
      </BottomStickyCTA>

    </div>
  )
}
