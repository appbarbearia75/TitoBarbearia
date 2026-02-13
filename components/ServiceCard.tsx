"use client"

import { cn } from "@/lib/utils"
import { Check, Scissors, Zap, User, Crown, Eye, Sparkles, Sun, Feather, Droplet, Smile } from "lucide-react"

interface ServiceCardProps {
    id: string
    title: string
    price: number
    icon?: string
    selected?: boolean
    onSelect: (id: string) => void
}

const ICON_MAP: Record<string, React.ElementType> = {
    scissors: Scissors,
    zap: Zap,
    user: User,
    crown: Crown,
    eye: Eye,
    sparkles: Sparkles,
    sun: Sun,
    feather: Feather,
    droplet: Droplet,
    smile: Smile
}

export function ServiceCard({
    id,
    title,
    price,
    icon,
    selected,
    onSelect,
}: ServiceCardProps) {
    const IconComponent = icon && ICON_MAP[icon] ? ICON_MAP[icon] : Scissors

    return (
        <div
            onClick={() => onSelect(id)}
            className={cn(
                "group flex items-center justify-between p-4 transition-all cursor-pointer rounded-xl border active:scale-[0.98]",
                selected
                    ? "bg-zinc-900 border-[#DBC278]/50"
                    : "bg-gradient-to-br from-[#1c1c1c] to-[#151515] border-transparent hover:border-zinc-700"
            )}
        >
            {/* Left Content: Title & Price */}
            <div className="flex flex-col">
                <h3 className={cn("font-semibold text-white text-[15px]")}>{title}</h3>
                <span className="text-[13px] text-zinc-500 font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
                </span>
            </div>

            {/* Right Action: Button */}
            <div>
                <button
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all",
                        selected
                            ? "bg-transparent border border-[#DBC278] text-[#DBC278]"
                            : "bg-[#DBC278] text-black hover:bg-[#c4ad6b]"
                    )}
                >
                    {selected ? "Remover" : "Adicionar"}
                </button>
            </div>
        </div>
    )
}
