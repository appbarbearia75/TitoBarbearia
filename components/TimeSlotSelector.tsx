import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

interface TimeSlotSelectorProps {
    slots: string[]
    selectedSlot?: string | null
    onSelect: (slot: string) => void
}

export function TimeSlotSelector({ slots, selectedSlot, onSelect }: TimeSlotSelectorProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {slots.map((slot, index) => {
                // Mock urgency logic
                const isPopular = index === 2 || index === 5
                const isLastSpot = index === 0

                return (
                    <Button
                        key={slot}
                        variant={selectedSlot === slot ? "default" : "outline"}
                        className={cn(
                            "h-auto py-3 flex flex-col gap-1 relative overflow-hidden",
                            selectedSlot === slot ? "border-primary ring-1 ring-primary" : ""
                        )}
                        onClick={() => onSelect(slot)}
                    >
                        <span className="text-lg font-bold">{slot}</span>

                        {isPopular && !selectedSlot && (
                            <span className="text-[10px] text-primary uppercase font-bold tracking-tighter">Mais popular</span>
                        )}
                        {isLastSpot && !selectedSlot && (
                            <span className="text-[10px] text-red-500 uppercase font-bold tracking-tighter">Última vaga</span>
                        )}
                    </Button>
                )
            })}
        </div>
    )
}
