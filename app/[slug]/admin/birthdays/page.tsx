"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/admin/birthdays/Header"
import { ClientList } from "@/components/admin/birthdays/ClientList"
import { UpcomingBirthdays } from "@/components/admin/birthdays/UpcomingBirthdays"
import { OpportunitiesGrid } from "@/components/admin/birthdays/OpportunitiesGrid"
import { GamificationPanel } from "@/components/admin/birthdays/GamificationPanel"
import { AutomationTimeline } from "@/components/admin/birthdays/AutomationTimeline"
import { Client } from "@/components/admin/birthdays/ClientCard"

export interface BirthdayMetrics {
    today: number
    tomorrow: number
    week: number
    potentialRevenue: number
    noContact: number
}

export default function BirthdaysPage() {
    const params = useParams()
    const slug = params.slug as string
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<Client[]>([])
    const [allClients, setAllClients] = useState<Client[]>([]) // base for upcoming section
    const [metrics, setMetrics] = useState<BirthdayMetrics>({
        today: 0, tomorrow: 0, week: 0, potentialRevenue: 0, noContact: 0
    })
    const [filter, setFilter] = useState("hoje")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchBirthdays()
    }, [slug, filter])

    const fetchBirthdays = async () => {
        setLoading(true)
        try {
            const { data: barbershop } = await supabase
                .from('barbershops')
                .select('id, name')
                .eq('slug', slug)
                .single()

            if (!barbershop) return

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

            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay())
            startOfWeek.setHours(0, 0, 0, 0)
            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 6)
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
                    const age = currentYear - birthDate.getUTCFullYear()
                    uniqueClients.set(booking.customer_phone, {
                        id: booking.customer_phone,
                        name: booking.customer_name,
                        phone: booking.customer_phone,
                        age,
                        avatar: null,
                        lastVisit: "Recentemente",
                        lastService: "Corte",
                        ltvAmount: price,
                        frequency: "A calcular",
                        tags: [],
                        matchesFilter
                    })
                } else {
                    uniqueClients.get(booking.customer_phone).ltvAmount += price
                }
            })

            const formattedClients: Client[] = []
            const allFormatted: Client[] = []

            Array.from(uniqueClients.values()).forEach(c => {
                const isVip = c.ltvAmount > 500

                const clientData: Client = {
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    age: c.age,
                    avatar: null,
                    lastVisit: "Recentemente",
                    lastService: "Serviço padrão",
                    ltv: `R$ ${c.ltvAmount.toLocaleString('pt-BR')}`,
                    frequency: "Cliente regular",
                    tags: isVip ? ["vip", "alto_valor"] : ["frequente"],
                    suggestion: isVip
                        ? { type: "opportunity", text: "Aniversariante! Cliente VIP. Ofereça um serviço premium." }
                        : { type: "info", text: "Aniversariante! Mande uma mensagem amigável." }
                }

                allFormatted.push(clientData)

                if (!c.matchesFilter) return
                if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return
                potentialRevenue += c.ltvAmount
                formattedClients.push(clientData)
            })

            setMetrics({
                today: totalToday,
                tomorrow: totalTomorrow,
                week: totalWeek,
                potentialRevenue,
                noContact: formattedClients.length
            })

            setClients(formattedClients)
            setAllClients(allFormatted)

        } catch (error) {
            console.error("Error fetching birthdays:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    )

    const upcomingClients = allClients.filter(c => !filteredClients.find(f => f.id === c.id)).slice(0, 4)

    return (
        <div className="flex flex-col h-full">
            {/* ── Page Header ── */}
            <Header
                filter={filter}
                onFilterChange={setFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center flex-1 py-24 text-text-secondary">
                    <div className="w-8 h-8 border-4 border-border-color border-t-emerald-500 rounded-full animate-spin mb-3" />
                    <p className="text-xs font-semibold text-text-secondary">Calculando insights de CRM...</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-x divide-border-color">
                    {/* ── Main Column ── */}
                    <div className="lg:col-span-8 overflow-y-auto">
                        <div className="p-6 space-y-8">
                            {/* Today's Birthdays */}
                            <ClientList clients={filteredClients} />

                            {/* Upcoming 7 Days */}
                            <UpcomingBirthdays clients={upcomingClients} weekCount={metrics.week} />

                            {/* Opportunities Grid */}
                            <OpportunitiesGrid
                                weekCount={metrics.week}
                                potentialRevenue={metrics.potentialRevenue}
                            />
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-4 overflow-y-auto">
                        <div className="p-6 space-y-4">
                            <GamificationPanel />
                            <AutomationTimeline />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
