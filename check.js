import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
async function run() {
    const { data, error } = await supabase.from('bookings').select('id, date, time, customer_name, status, created_at, barbershop_id').order('created_at', { ascending: false }).limit(5);
    console.log(data, error)
}
run()
