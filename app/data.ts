
export interface Service {
    id: string
    title: string
    price: number
    duration: string
    description: string
    icon: string
}

export interface Barber {
    id: string
    name: string
    photo_url: string
    active?: boolean
}

export interface Client {
    slug: string
    name: string
    address: string
    phone: string
    avatar: string
    cover: string
    themeColor: string
    services: Service[]
    barbers?: Barber[]
    email?: string
    password?: string
    openingHours?: any // Using any for now to match the JSON structure from DB
    isActive?: boolean
    vipPlanTitle?: string
    vipPlanPrice?: string
    vipPlanPriceFrom?: string
}

export const CLIENTS: Client[] = [
    {
        slug: "tito-barber",
        name: "Tito Barbearia",
        address: "Rua das Flores, 123 - Centro",
        phone: "(11) 99999-9999",
        avatar: "/real_avatar.png",
        cover: "/background_v2.png",
        themeColor: "#DBC278",
        email: "tito@barber.com",
        password: "123",
        services: [
            {
                id: "corte-simples",
                title: "Corte",
                price: 45.00,
                duration: "30 min",
                description: "Corte social ou clássico.",
                icon: "scissors"
            },
            {
                id: "corte-degrade",
                title: "Corte Degradê",
                price: 50.00,
                duration: "45 min",
                description: "Acabamento detalhado com navalha.",
                icon: "scissors"
            },
            {
                id: "acabamento",
                title: "Acabamento",
                price: 20.00,
                duration: "15 min",
                description: "Pézinho e contornos.",
                icon: "zap"
            },
            {
                id: "barba",
                title: "Barba",
                price: 35.00,
                duration: "30 min",
                description: "Modelagem e toalha quente.",
                icon: "user"
            },
            {
                id: "corte-barba",
                title: "Corte + Barba",
                price: 80.00,
                duration: "60 min",
                description: "Combo completo.",
                icon: "crown"
            },
            {
                id: "sobrancelha",
                title: "Sobrancelha",
                price: 15.00,
                duration: "10 min",
                description: "Design e limpeza.",
                icon: "eye"
            },
            {
                id: "botox",
                title: "Botox",
                price: 80.00,
                duration: "40 min",
                description: "Alinhamento e redução de volume.",
                icon: "sparkles"
            },
            {
                id: "platinado",
                title: "Platinado",
                price: 150.00,
                duration: "120 min",
                description: "Descoloração global com matização.",
                icon: "sun"
            },
            {
                id: "depilacao",
                title: "Depilação de nariz ou orelha",
                price: 10.00,
                duration: "10 min",
                description: "Cera quente.",
                icon: "feather"
            },
            {
                id: "limpeza",
                title: "Limpeza de pele",
                price: 60.00,
                duration: "40 min",
                description: "Remoção de cravos e impurezas.",
                icon: "droplet"
            },
            {
                id: "mascara",
                title: "Máscara negra",
                price: 25.00,
                duration: "15 min",
                description: "Remoção de cravos superficiais.",
                icon: "smile"
            }
        ]
    },
    {
        slug: "barbearia-modelo",
        name: "Barbearia Modelo",
        address: "Av. Paulista, 1000 - SP",
        phone: "(11) 88888-8888",
        avatar: "/real_avatar.png", // Using same placeholder for now
        cover: "/background_v2.png",
        themeColor: "#DBC278", // Gold theme
        email: "modelo@barber.com",
        password: "123",
        services: [
            {
                id: "corte-rapido",
                title: "Corte Rápido",
                price: 35.00,
                duration: "20 min",
                description: "Corte máquina.",
                icon: "scissors"
            },
            {
                id: "barba-simples",
                title: "Barba Simples",
                price: 25.00,
                duration: "20 min",
                description: "Apenas máquina.",
                icon: "user"
            }
        ]
    }
]

export const getClientBySlug = (slug: string) => {
    return CLIENTS.find(client => client.slug === slug)
}

// Helper to keep support for old imports temporarily if needed, or we just update them
export const SERVICES = CLIENTS[0].services // Fallback for Tito


export const TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
]
