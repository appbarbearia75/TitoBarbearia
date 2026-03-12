"use client"

import { useState, useEffect } from "react"
// Removing useParams since this route doesn't have [slug] in its path natively
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/admin/birthdays/Header"
import { InsightCards, BirthdayMetrics } from "@/components/admin/birthdays/InsightCards"
import { ClientList } from "@/components/admin/birthdays/ClientList"
import { AutomationTimeline } from "@/components/admin/birthdays/AutomationTimeline"
import { GamificationPanel } from "@/components/admin/birthdays/GamificationPanel"
import { Client } from "@/components/admin/birthdays/ClientCard"

export default function BirthdaysPage() {
    // For this direct route, we'll try to fetch the first barbershop 
    // or rely on a global context. Since we don't have [slug], we'll fallback to a generic fetch
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<Client[]>([])
    const [metrics, setMetrics] = useState<BirthdayMetrics>({
        today: 0, tomorrow: 0, week: 0, potentialRevenue: 0, noContact: 0
    })
    
    // Header states
    const [filter, setFilter] = useState("hoje")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchBirthdays()
    }, [filter])

    const fetchBirthdays = async () => {
        setLoading(true)
        try {
            // Get first barbershop as fallback since there's no slug
            const { data: barbershops } = await supabase
                .from('barbershops')
                .select('id, name')
                .limit(1)
            
            if (!barbershops || barbershops.length === 0) return
            const barbershop = barbershops[0]

            const { data: bookings } = await supabase
                .from('bookings')
                .select('customer_name, customer_phone, customer_birthday, price, created_at')
                .eq('barbershop_id', barbershop.id)
                .not('customer_birthday', 'is', null)

            if (!bookings) {
                setClients([])
                return
            }

            const uniqueClients = new Map<string, any>()
            const now = new Date()
            const currentYear = now.getFullYear()

            // Time References
            const todayStart = new Date(now)
            todayStart.setHours(0,0,0,0)
            const tomorrowStart = new Date(todayStart)
            tomorrowStart.setDate(todayStart.getDate() + 1)
            
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
            startOfWeek.setHours(0, 0, 0, 0)
            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
            endOfWeek.setHours(23, 59, 59, 999)

            let totalToday = 0
            let totalTomorrow = 0
            let totalWeek = 0
            let potentialRevenue = 0

            bookings.forEach(booking => {
                if (!booking.customer_birthday || !booking.customer_phone) return

                const birthDate = new Date(booking.customer_birthday)
                const birthMonth = birthDate.getUTCMonth()
                const birthDay = birthDate.getUTCDate()
                
                const birthdayThisYear = new Date(currentYear, birthMonth, birthDay)

                let matchesFilter = false
                
                if (filter === 'hoje') {
                    matchesFilter = (birthMonth === now.getMonth() && birthDay === now.getDate())
                } else if (filter === 'amanha') {
                    const tom = new Date(now)
                    tom.setDate(now.getDate() + 1)
                    matchesFilter = (birthMonth === tom.getMonth() && birthDay === tom.getDate())
                } else if (filter === 'semana') {
                    matchesFilter = (birthdayThisYear >= startOfWeek && birthdayThisYear <= endOfWeek)
                } else if (filter === 'mes') {
                    matchesFilter = birthDate.getUTCMonth() === now.getMonth()
                }

                if (birthMonth === now.getMonth() && birthDay === now.getDate()) totalToday++
                
                const tomMetrics = new Date(now)
                tomMetrics.setDate(now.getDate() + 1)
                if (birthMonth === tomMetrics.getMonth() && birthDay === tomMetrics.getDate()) totalTomorrow++
                
                if (birthdayThisYear >= startOfWeek && birthdayThisYear <= endOfWeek) totalWeek++
                
                const price = booking.price ? Number(booking.price) : 0

                if (!uniqueClients.has(booking.customer_phone)) {
                    const birthYear = birthDate.getUTCFullYear()
                    const age = currentYear - birthYear

                    uniqueClients.set(booking.customer_phone, {
                        id: booking.customer_phone,
                        name: booking.customer_name,
                        phone: booking.customer_phone,
                        age: age,
                        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${booking.customer_name}`,
                        lastVisit: "...",
                        lastService: "Corte",
                        ltvAmount: price,
                        frequency: "A calcular",
                        tags: [],
                        matchesFilter
                    })
                } else {
                    const existing = uniqueClients.get(booking.customer_phone)
                    existing.ltvAmount += price
                }
            })

            const formattedClients: Client[] = []
            
            Array.from(uniqueClients.values()).forEach(c => {
                if (!c.matchesFilter) return
                if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return
                
                potentialRevenue += c.ltvAmount
                const isVip = c.ltvAmount > 500

                formattedClients.push({
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    age: c.age,
                    avatar: c.avatar,
                    lastVisit: "Recentemente",
                    lastService: "Serviço padrão",
                    ltv: `R$ ${c.ltvAmount.toLocaleString('pt-BR')}`,
                    frequency: "Cliente regular",
                    tags: isVip ? ["vip", "alto_valor"] : ["frequente"],
                    suggestion: isVip ? {
                        type: "opportunity",
                        text: "Cliente VIP. Ofereça um serviço premium de presente."
                    } : {
                        type: "info",
                        text: "Aniversariante! Mande uma mensagem amigável."
                    }
                })
            })

            setMetrics({
                today: totalToday,
                tomorrow: totalTomorrow,
                week: totalWeek,
                potentialRevenue: potentialRevenue,
                noContact: formattedClients.length
            })

            setClients(formattedClients)

        } catch (error) {
            console.error("Error fetching birthdays:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Header 
                filter={filter} 
                onFilterChange={setFilter} 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {loading ? (
                <div className="text-center py-12 text-zinc-500">
                    Calculando insights...
                </div>
            ) : (
                <>
                    <InsightCards metrics={metrics} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                        <div className="lg:col-span-2">
                            <ClientList clients={filteredClients} />
                        </div>
                        
                        <div className="flex flex-col gap-6">
                            <GamificationPanel />
                            <AutomationTimeline />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
