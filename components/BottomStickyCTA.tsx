import { cn } from "@/lib/utils"

interface BottomStickyCTAProps {
    children: React.ReactNode
    className?: string
}

export function BottomStickyCTA({ children, className }: BottomStickyCTAProps) {
    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-50 animate-slide-up",
            className
        )}>
            <div className="max-w-md mx-auto">
                {children}
            </div>
        </div>
    )
}
