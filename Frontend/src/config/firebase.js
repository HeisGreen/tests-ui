import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// These should be set in environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
