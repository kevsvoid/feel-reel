// lib/supabase.ts
// Supabase client — swap in your real keys when ready for backend
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co' // placeholder URL for local dev
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anonymous-key' // placeholder key for local dev

export const supabase = createClient(supabaseUrl, supabaseKey)
