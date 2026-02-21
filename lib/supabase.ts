import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vuaayfuhqbrkvwutcidw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YWF5ZnVocWJya3Z3dXRjaWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NTI0MzAsImV4cCI6MjA4NjQyODQzMH0.PaNXpJEBJpYx_UWp0GwXinLA346Pr75YRuA09RK-Dno'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
