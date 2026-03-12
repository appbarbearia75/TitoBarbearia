"use client"

import { Gift, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface HeaderProps {
    filter: string
    onFilterChange: (val: string) => void
    searchQuery: string
    onSearchChange: (val: string) => void
}

export function Header({ filter, onFilterChange, searchQuery, onSearchChange }: HeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-color/20 to-orange-500/10 flex items-center justify-center border border-accent-color/20 shadow-[0_0_30px_rgba(219,194,120,0.15)]">
                    <Gift className="w-6 h-6 text-accent-color" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary via-text-primary to-text-secondary bg-clip-text text-transparent flex items-center gap-2">
                        Aniversariantes
                        <Sparkles className="w-5 h-5 text-orange-500 font-bold" />
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">Identifique clientes que fazem aniversário e crie campanhas de fidelização.</p>
                </div>
            </div>

            <div className="flex bg-bg-card p-1 rounded-lg border border-border-color w-fit">
                <button onClick={() => onFilterChange('hoje')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'hoje' ? 'bg-bg-sidebar text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Hoje</button>
                <button onClick={() => onFilterChange('amanha')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'amanha' ? 'bg-bg-sidebar text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Amanhã</button>
                <button onClick={() => onFilterChange('semana')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'semana' ? 'bg-bg-sidebar text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Na Semana</button>
                <button onClick={() => onFilterChange('mes')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'mes' ? 'bg-bg-sidebar text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>No Mês</button>
            </div>
            
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                    placeholder="Buscar cliente..."
                    className="pl-9 bg-bg-card border-border-color text-text-primary text-sm h-10 rounded-lg focus:border-accent-color/50 w-full placeholder:text-text-secondary"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    )
}
