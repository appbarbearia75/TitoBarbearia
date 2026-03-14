"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Bell, X } from "lucide-react"
import { format } from "date-fns"

export function RealtimeNotification({ barbershopId }: { barbershopId: string }) {
    const [notifications, setNotifications] = useState<any[]>([])

    useEffect(() => {
        if (!barbershopId) return

        const channel = supabase
            .channel('realtime_bookings')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'bookings',
                filter: `barbershop_id=eq.${barbershopId}`
            }, (payload) => {
                const newBooking = payload.new

                // Tocar o som
                playNotificationSound();

                // Adicionar na lista de notificações
                setNotifications(prev => [...prev, newBooking])

                // Sumir após 10 segundos
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== newBooking.id))
                }, 10000)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [barbershopId])

    useEffect(() => {
        if (!barbershopId) return;

        const subscribeToPush = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                        });

                        await fetch('/api/web-push/subscribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subscription,
                                userId: barbershopId
                            })
                        });
                    }
                } catch (error) {
                    console.error('Error subscribing provider to push notifications', error);
                }
            }
        };

        subscribeToPush();
    }, [barbershopId]);

    const playNotificationSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const context = new AudioContext();

            // Primeiro Tom
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);

            osc.type = "sine";
            osc.frequency.setValueAtTime(880, context.currentTime); // A5
            gain.gain.setValueAtTime(0.2, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);

            osc.start(context.currentTime);
            osc.stop(context.currentTime + 0.3);

            // Segundo Tom
            const osc2 = context.createOscillator();
            const gain2 = context.createGain();
            osc2.connect(gain2);
            gain2.connect(context.destination);

            osc2.type = "sine";
            osc2.frequency.setValueAtTime(1108.73, context.currentTime + 0.1); // C#6
            gain2.gain.setValueAtTime(0.2, context.currentTime + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);

            osc2.start(context.currentTime + 0.1);
            osc2.stop(context.currentTime + 0.5);
        } catch (e) {
            console.error("Audio block", e)
        }
    }

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    if (notifications.length === 0) return null

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pt-16 md:pt-0">
            {notifications.map(n => (
                <div key={n.id} className="bg-[#1c1c1c] border border-[#DBC278]/50 shadow-[0_0_20px_rgba(219,194,120,0.15)] p-4 rounded-xl flex items-start gap-4 animate-in slide-in-from-right-full fade-in duration-300">
                    <div className="bg-[#DBC278] p-2 rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(219,194,120,0.5)]">
                        <Bell className="w-5 h-5 text-black animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm">Novo Agendamento!</h4>
                        <p className="text-zinc-300 text-xs mt-1 leading-relaxed">
                            <span className="text-[#DBC278] font-bold">{n.customer_name}</span> agendou para <span className="font-bold">{format(new Date(n.date), "dd/MM")}</span> às <span className="font-bold">{n.time?.slice(0, 5)}</span>.
                        </p>
                    </div>
                    <button onClick={() => removeNotification(n.id)} className="text-zinc-500 hover:text-white flex-shrink-0 p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
