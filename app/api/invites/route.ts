import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client (using service role would be better for verification if RLS was strict, but we set public RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST() {
    // Generate a simple random code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()

    const { error } = await supabase
        .from('invites')
        .insert([{ code }])

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ code })
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.json({ valid: false }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('code', code)
        .is('used_at', null) // Must not be used
        .single()

    if (error || !data) {
        return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true })
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.json({ success: false }, { status: 400 })
    }

    const { error } = await supabase
        .from('invites')
        .update({ used_at: new Date().toISOString() })
        .eq('code', code)

    if (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
