"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { MoveLeft } from "lucide-react"

export default function TenantNotFound() {
    const params = useParams()
    const slug = params?.slug as string

    // If we have a slug, we link back to the tenant home. 
    // Otherwise fallback to root (though this file is inside [slug], so slug should exist in params)
    const homeLink = slug ? `/${slug}` : '/'

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-black text-[#DBC278] mb-4">404</h2>
            <p className="text-zinc-400 mb-8 max-w-md">
                Página não encontrada nesta barbearia.
            </p>
            <Link
                href={homeLink}
                className="flex items-center gap-2 bg-[#DBC278] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#c4ad6b] transition-colors"
            >
                <MoveLeft className="w-4 h-4" />
                Voltar para o Início
            </Link>
        </div>
    )
}
