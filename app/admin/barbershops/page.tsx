"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

export default function BarbershopsPage() {
    const [barbershops, setBarbershops] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBarbershops()
    }, [])

    const fetchBarbershops = async () => {
        const { data, error } = await supabase
            .from("barbershops")
            .select("*")
            .order("created_at", { ascending: false })

        if (data) setBarbershops(data)
        setLoading(false)
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setBarbershops(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b))

        const { error } = await supabase
            .from("barbershops")
            .update({ is_active: !currentStatus })
            .eq("id", id)

        if (error) {
            console.error("Error updating status:", error)
            // Revert on error
            fetchBarbershops()
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Barbearias</h1>
                    <p className="text-neutral-400">Gerencie todas as barbearias cadastradas no sistema.</p>
                </div>
            </div>

            <Card className="bg-neutral-900 border-neutral-800 text-white">
                <CardHeader>
                    <CardTitle>Todas as Barbearias</CardTitle>
                    <CardDescription>Lista completa de clientes da plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-neutral-400">Barbearia</TableHead>
                                <TableHead className="text-neutral-400">Slug</TableHead>
                                <TableHead className="text-neutral-400">Data Cadastro</TableHead>
                                <TableHead className="text-neutral-400">Status Assinatura</TableHead>
                                <TableHead className="text-neutral-400">Ativo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                                </TableRow>
                            ) : barbershops.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-neutral-500">Nenhuma barbearia encontrada.</TableCell>
                                </TableRow>
                            ) : (
                                barbershops.map((shop) => (
                                    <TableRow key={shop.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={shop.avatar_url} />
                                                <AvatarFallback>{shop.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{shop.name}</span>
                                                <span className="text-xs text-neutral-500">{shop.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{shop.slug}</TableCell>
                                        <TableCell>{format(new Date(shop.created_at), "dd/MM/yyyy")}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-neutral-700 bg-neutral-800">
                                                {shop.subscription_status || "active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={shop.is_active}
                                                onCheckedChange={() => toggleStatus(shop.id, shop.is_active)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
