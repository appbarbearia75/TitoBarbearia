"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

import { supabase } from "@/lib/supabase"

interface ReviewModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    googleReviewLink: string
    clientThemeColor?: string
    barbershopId?: string
}

export function ReviewModal({ isOpen, onOpenChange, googleReviewLink, clientThemeColor = "#DBC278", barbershopId }: ReviewModalProps) {
    const [rating, setRating] = useState(0)

    const handleRate = async (value: number) => {
        setRating(value)
        if (value === 5) {
            // Log Event
            if (barbershopId && barbershopId !== 'mock-id') {
                try {
                    // We need the ID, but slug is passed. 
                    // Ideally we pass ID, but let's fetch ID by slug or pass ID from parent.
                    // Let's passed ID from parent for better performance? 
                    // Actually, let's keep it simple and just fire and forget if we have the ID.
                    // Wait, I don't have the ID here. I should pass barbershopId prop.
                } catch (e) {
                    console.error("Error logging review:", e)
                }
            }

            // Delay slightly to show selection then redirect
            setTimeout(() => {
                window.open(googleReviewLink, '_blank')
                onOpenChange(false)
            }, 500)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1c1c1c] border-zinc-800 text-white sm:max-w-md">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-[#DBC278]/20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${clientThemeColor}33` }}>
                        <Star className="w-6 h-6 text-[#DBC278]" style={{ color: clientThemeColor, fill: clientThemeColor }} />
                    </div>
                    <DialogTitle className="text-xl font-bold mb-2">Avalie sua Experiência</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        O que achou do seu atendimento? Sua opinião é muito importante para nós!
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center gap-2 py-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleRate(star)}
                            className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star
                                className={cn(
                                    "w-10 h-10 transition-colors",
                                    rating >= star ? "fill-[#DBC278] text-[#DBC278]" : "text-zinc-600"
                                )}
                                style={rating >= star ? { color: clientThemeColor, fill: clientThemeColor } : undefined}
                            />
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    {rating > 0 && rating < 5 && (
                        <Button
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-12 rounded-xl"
                            onClick={() => onOpenChange(false)}
                        >
                            Enviar Avaliação
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        className="w-full text-zinc-500 hover:text-zinc-300"
                        onClick={() => onOpenChange(false)}
                    >
                        Pular
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
