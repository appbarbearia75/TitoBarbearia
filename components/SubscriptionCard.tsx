import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Crown } from "lucide-react"

interface SubscriptionCardProps {
    onSubscribe: () => void
}

export function SubscriptionCard({ onSubscribe }: SubscriptionCardProps) {
    return (
        <Card className="relative border-primary/50 bg-gradient-to-b from-card to-primary/5 overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Crown className="w-24 h-24 text-primary" />
            </div>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-5 h-5 text-primary fill-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Tito VIP</span>
                </div>
                <CardTitle className="text-xl">Seja assinante e economize</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {[
                        "Cortes ilimitados (1 por semana)",
                        "Prioridade no agendamento",
                        "Barba inclusa no plano VIP+",
                        "Bebida cortesia em toda visita",
                    ].map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{benefit}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">R$ 99,90</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={onSubscribe} className="w-full font-bold text-base" size="lg">
                    QUERO SER ASSINANTE
                </Button>
            </CardFooter>
        </Card>
    )
}
