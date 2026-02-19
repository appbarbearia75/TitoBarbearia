import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    const { data, error } = await supabase
        .from('barbershops')
        .select('id, name, slug, is_active')

    if (error) {
        console.error('Error fetching barbershops:', error)
        return
    }

    console.log('Barbershops:', data)
}

main()
