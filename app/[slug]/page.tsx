import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { BookingPage } from "@/components/BookingPage"
import { Client, Service, CLIENTS } from "@/app/data"

// Force dynamic rendering since we are fetching user-generated content
export const dynamic = 'force-dynamic'

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const slug = (await params).slug

    // 0. Demo Mode
    if (slug === 'demo') {
        // Fetch from demo_settings table for dynamic content
        const { data: demoSettings } = await supabase
            .from('demo_settings')
            .select('*')
            .single()

        if (demoSettings) {
            const demoClient: Client = {
                slug: "demo", // or keep as is
                name: demoSettings.name || "Barbearia Modelo",
                address: "Av. Paulista, 1000 - SP", // Keep hardcoded or add to settings if needed later
                phone: "(11) 99999-9999",
                avatar: demoSettings.avatar || "/real_avatar.png",
                cover: demoSettings.cover || "/background_v2.png",
                themeColor: "#DBC278",
                services: demoSettings.services || [],
                barbers: demoSettings.barbers || [],
                email: "demo@barber.com"
            }
            return <BookingPage client={demoClient} />
        }

        // Fallback if DB fetch fails or no settings
        const demoClient = CLIENTS.find(c => c.slug === 'barbearia-modelo') || CLIENTS[0]
        return <BookingPage client={demoClient} />
    }

    // 1. Fetch Barbershop
    const { data: barbershop, error: barbershopError } = await supabase
        .from('barbershops')
        .select('*')
        .eq('slug', slug)
        .single()

    console.log(`[Page] Fetching barbershop for slug: ${slug}`, { found: !!barbershop, error: barbershopError, active: barbershop?.is_active })

    if (!barbershop) {
        console.error(`[Page] Barbershop not found: ${slug}`)
        return notFound()
    }

    // 2. Fetch Services
    const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', barbershop.id)
        .order('position', { ascending: true })
        .order('price', { ascending: true })

    // 3. Map to Client Interface
    const services: Service[] = (servicesData || []).map(s => ({
        id: s.id,
        title: s.title,
        price: Number(s.price),
        duration: s.duration || "30 min",
        description: s.description || "",
        icon: s.icon || "scissors" // Default icon
    }))

    const client: Client = {
        slug: barbershop.slug,
        name: barbershop.name,
        address: barbershop.address || "Endereço não informado",
        phone: barbershop.phone || "",
        avatar: barbershop.avatar_url || "/real_avatar.png", // Use a valid default asset if null
        cover: barbershop.cover_url || "/background_v2.png", // Use a valid default asset if null
        themeColor: barbershop.theme_color || "#DBC278",
        services: services,
        email: barbershop.email,
        openingHours: barbershop.opening_hours,
        isActive: barbershop.is_active,
        vipPlanTitle: barbershop.vip_plan_title,
        vipPlanPrice: barbershop.vip_plan_price,
        vipPlanPriceFrom: barbershop.vip_plan_price_from
    }

    return <BookingPage client={client} />
}
