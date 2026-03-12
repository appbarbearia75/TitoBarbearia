"use client"

import { MessageCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface HeaderProps {
    filter: string
    onFilterChange: (val: string) => void
    searchQuery: string
    onSearchChange: (val: string) => void
}

export function Header({ filter, onFilterChange, searchQuery, onSearchChange }: HeaderProps) {
    const filters = [
        { id: 'hoje', label: 'Hoje' },
        { id: 'semana', label: 'Próximos 7 dias' },
        { id: 'mes', label: 'Mês' },
    ]

    return (
        <div className="px-6 py-5 border-b border-border-color bg-bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Title */}
            <div>
                <h1 className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
                    Aniversariantes 🎉
                </h1>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed max-w-md">
                    Use aniversários para fidelizar clientes, gerar retorno e aumentar o LTV.
                </p>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Filter Pills */}
                <div className="flex bg-bg-app border border-border-color rounded-lg p-0.5 gap-0.5">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => onFilterChange(f.id)}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                filter === f.id
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <Input
                        placeholder="Buscar cliente..."
                        className="pl-9 bg-bg-app border-border-color text-text-primary text-xs h-9 w-52 rounded-lg placeholder:text-text-muted"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Primary CTA */}
                <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-lg flex items-center gap-2 shrink-0"
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Disparar mensagens de hoje
                </Button>
            </div>
        </div>
    )
}
