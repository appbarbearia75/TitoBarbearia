import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vuaayfuhqbrkvwutcidw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YWF5ZnVocWJya3Z3dXRjaWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NTI0MzAsImV4cCI6MjA4NjQyODQzMH0.PaNXpJEBJpYx_UWp0GwXinLA346Pr75YRuA09RK-Dno'

// Chave padrão baseada na URL do projeto para garantir limpeza correta
const STORAGE_KEY = 'sb-vuaayfuhqbrkvwutcidw-auth-token'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY
    }
})

// Listen for auth changes to handle invalid refresh tokens gracefully
if (typeof window !== 'undefined') {
    // Intercept console.error to suppress the "Invalid Refresh Token: Refresh Token Not Found" error
    // which causes the Next.js dev overlay to pop up whenever the session expires.
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (args.length > 0 && typeof args[0] === 'string' && (args[0].includes('Invalid Refresh Token') || args[0].includes('Refresh Token Not Found'))) {
            return;
        }
        if (args.length > 0 && args[0] instanceof Error && (args[0].message.includes('Invalid Refresh Token') || args[0].message.includes('Refresh Token Not Found'))) {
            return;
        }
        originalConsoleError(...args);
    };

    const clearAuthAndRedirect = async () => {
        console.warn("Sessão inválida ou expirada detectada. Limpando dados...")

        try {
            // Tenta dar logout no servidor (pode falhar se o token for inválido)
            await supabase.auth.signOut()
        } catch (e) {
            // Ignora erro no signOut
        }

        // Limpeza agressiva do localStorage
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.includes('supabase.auth.token') || key.includes('sb-vuaayfuhqbrkvwutcidw'))) {
                keysToRemove.push(key)
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))

        // Redireciona apenas se estiver em uma área protegida
        if (window.location.pathname.includes('/admin')) {
            window.location.href = '/login'
        }
    }

    // Check session on load to catch invalid refresh tokens early
    supabase.auth.getSession().then(({ data, error }) => {
        if (error && (
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('session_not_found')
        )) {
            clearAuthAndRedirect()
        }
    })

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            // Garante que tudo foi removido
            localStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem('supabase.auth.token')
        }
    })
}

