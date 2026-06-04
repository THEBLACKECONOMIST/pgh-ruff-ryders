import { createClient } from '@supabase/supabase-js'

// Fallback values prevent createClient from throwing during static prerendering.
// At runtime the real NEXT_PUBLIC_ values (baked in at build time) are always used.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(url, key)
