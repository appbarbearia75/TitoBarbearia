"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { Trophy, Medal, Award } from "lucide-react"

export default function RankingPage() {
    const [barbershops, setBarbershops] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRanking()
    }, [])

    const fetchRanking = async () => {
        setLoading(true)

        // Fetch barbershops
        const { data: shopsData, error: shopsError } = await supabase
            .from("barbershops")
            .select("id, name, slug, avatar_url")

        if (shopsError || !shopsData) {
            console.error("Error fetching barbershops:", shopsError)
            setLoading(false)
            return
        }

        // Fetch all bookings (ID, barbershop_id, date) to count them
        const { data: bookingsData, error: bookingsError } = await supabase
            .from("bookings")
            .select("id, barbershop_id, date")

        if (bookingsError) {
            console.error("Error fetching bookings:", bookingsError)
        }

        // Current Year and Month in string format "YYYY-MM"
        const currentYearMonth = new Date().toISOString().substring(0, 7)

        // Map and count
        const rankedData = shopsData.map(shop => {
            const shopBookings = bookingsData?.filter(b => b.barbershop_id === shop.id) || []
            const monthlyBookings = shopBookings.filter(b => b.date && b.date.startsWith(currentYearMonth))

            return {
                ...shop,
                bookingsCount: monthlyBookings.length,
                totalBookings: shopBookings.length
            }
        }).sort((a, b) => b.bookingsCount - a.bookingsCount) // Sort descending by monthly

        setBarbershops(rankedData)
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Ranking de Barbearias</h1>
                <div className="text-center py-10 text-neutral-400">Carregando ranking...</div>
            </div>
        )
    }

    const podium = barbershops.slice(0, 3)
    const rest = barbershops.slice(3)

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-bold mb-2">Ranking de Barbearias</h1>
                <p className="text-neutral-400">Classificação das barbearias com maior volume de agendamentos no sistema.</p>
            </div>

            {/* Podium View */}
            {podium.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-6 items-end mt-28 mb-16 pt-10 px-2 sm:px-4">
                    {/* 2nd Place */}
                    {podium.length >= 2 ? (
                        <div className="order-2 lg:order-1 flex flex-col items-center bg-zinc-900/50 rounded-t-xl border border-zinc-800/50 pt-20 pb-6 relative h-[260px] w-full max-w-[320px] mx-auto">
                            <div className="absolute -top-14 flex flex-col items-center">
                                <Medal className="w-8 h-8 text-[#C0C0C0] mb-2 drop-shadow-lg" />
                                <Avatar className="w-20 h-20 border-4 border-[#1c1c1c] shadow-lg shadow-[#C0C0C0]/20 bg-black">
                                    <AvatarImage src={podium[1].avatar_url} className="object-cover" />
                                    <AvatarFallback>{podium[1].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col items-center justify-between h-full w-full">
                                <div className="flex flex-col items-center w-full px-4">
                                    <h3 className="font-bold text-lg text-center w-full line-clamp-2">{podium[1].name}</h3>
                                    <span className="text-sm text-neutral-400 font-mono mt-1 w-full truncate text-center">{podium[1].slug}</span>
                                </div>
                                <div className="mt-auto flex flex-col items-center">
                                    <div className="mx-auto text-[#C0C0C0] font-black flex items-center justify-center gap-1.5 text-2xl bg-[#C0C0C0]/10 px-5 py-1.5 rounded-full whitespace-nowrap">
                                        {podium[1].bookingsCount} <span className="text-sm font-medium">mensais</span>
                                    </div>
                                    <span className="text-xs text-neutral-500 mt-2">Total: {podium[1].totalBookings}</span>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#C0C0C0]" />
                        </div>
                    ) : <div className="hidden lg:block order-1" />}

                    {/* 1st Place */}
                    <div className="order-1 lg:order-2 flex flex-col items-center bg-[#DBC278]/5 rounded-t-xl border border-[#DBC278]/20 pt-24 pb-8 relative h-[310px] w-full max-w-[340px] mx-auto shadow-xl shadow-[#DBC278]/5 z-10">
                        <div className="absolute -top-20 flex flex-col items-center">
                            <Trophy className="w-12 h-12 text-[#DBC278] mb-2 drop-shadow-[0_0_15px_rgba(219,194,120,0.5)] fill-[#DBC278]/20" />
                            <Avatar className="w-24 h-24 border-4 border-[#1c1c1c] shadow-2xl shadow-[#DBC278]/30 bg-black">
                                <AvatarImage src={podium[0].avatar_url} className="object-cover" />
                                <AvatarFallback>{podium[0].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col items-center justify-between h-full w-full">
                            <div className="flex flex-col items-center w-full px-4">
                                <h3 className="font-bold text-xl text-[#DBC278] text-center w-full line-clamp-2">{podium[0].name}</h3>
                                <span className="text-sm text-[#DBC278]/60 font-mono mt-1 w-full truncate text-center">{podium[0].slug}</span>
                            </div>
                            <div className="mt-auto flex flex-col items-center">
                                <div className="mx-auto text-[#DBC278] font-black flex items-center justify-center gap-2 text-3xl bg-[#DBC278]/10 px-8 py-2.5 rounded-full whitespace-nowrap">
                                    {podium[0].bookingsCount} <span className="text-sm font-medium">mensais</span>
                                </div>
                                <span className="text-sm text-[#DBC278]/60 mt-2 font-medium">Total: {podium[0].totalBookings}</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-[#DBC278]" />
                    </div>

                    {/* 3rd Place */}
                    {podium.length >= 3 ? (
                        <div className="order-3 flex flex-col items-center bg-zinc-900/50 rounded-t-xl border border-zinc-800/50 pt-16 pb-6 relative h-[230px] w-full max-w-[320px] mx-auto">
                            <div className="absolute -top-10 flex flex-col items-center">
                                <Award className="w-7 h-7 text-[#CD7F32] mb-1.5 drop-shadow-lg" />
                                <Avatar className="w-16 h-16 border-4 border-[#1c1c1c] shadow-lg shadow-[#CD7F32]/20 bg-black">
                                    <AvatarImage src={podium[2].avatar_url} className="object-cover" />
                                    <AvatarFallback>{podium[2].name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col items-center justify-between h-full w-full">
                                <div className="flex flex-col items-center w-full px-4">
                                    <h3 className="font-bold text-base text-center w-full line-clamp-2">{podium[2].name}</h3>
                                    <span className="text-sm text-neutral-400 font-mono mt-1 w-full truncate text-center">{podium[2].slug}</span>
                                </div>
                                <div className="mt-auto flex flex-col items-center">
                                    <div className="mx-auto text-[#CD7F32] font-black flex items-center justify-center gap-1.5 text-xl bg-[#CD7F32]/10 px-4 py-1.5 rounded-full whitespace-nowrap">
                                        {podium[2].bookingsCount} <span className="text-xs font-medium">mensais</span>
                                    </div>
                                    <span className="text-[10px] text-neutral-500 mt-2">Total: {podium[2].totalBookings}</span>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#CD7F32]" />
                        </div>
                    ) : <div className="hidden lg:block order-3" />}
                </div>
            )}

            {/* List for the rest */}
            {barbershops.length > 3 && (
                <Card className="bg-[#1c1c1c] border-white/5 text-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Demais Posições</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-neutral-400 w-[80px]">Posição</TableHead>
                                    <TableHead className="text-neutral-400">Barbearia</TableHead>
                                    <TableHead className="text-neutral-400 text-right">Agendamentos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rest.map((shop, index) => (
                                    <TableRow key={shop.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-mono text-neutral-400 font-bold">
                                            #{index + 4}
                                        </TableCell>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={shop.avatar_url} />
                                                <AvatarFallback>{shop.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{shop.name}</span>
                                                <span className="text-xs text-neutral-500 font-mono">{shop.slug}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="font-bold text-[#DBC278]">
                                                    {shop.bookingsCount} <span className="text-xs text-[#DBC278]/80 font-normal">mensais</span>
                                                </div>
                                                <span className="text-[10px] text-neutral-500">Total: {shop.totalBookings}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {barbershops.length === 0 && !loading && (
                <div className="text-center py-20 text-neutral-500 bg-zinc-900/30 rounded-lg border border-zinc-800 border-dashed">
                    Nenhuma barbearia ou agendamento encontrado no sistema.
                </div>
            )}
        </div>
    )
}
