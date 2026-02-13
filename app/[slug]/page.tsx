import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { BookingPage } from "@/components/BookingPage"
import { Client, Service } from "@/app/data"

// Force dynamic rendering since we are fetching user-generated content
export const dynamic = 'force-dynamic'

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const slug = (await params).slug

    // 1. Fetch Barbershop
    const { data: barbershop } = await supabase
        .from('barbershops')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!barbershop) {
        return notFound()
    }

    // 2. Fetch Services
    const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', barbershop.id)
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
        openingHours: barbershop.opening_hours
    }

    return <BookingPage client={client} />
}
