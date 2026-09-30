import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://ozyftbtzpoobkzjwwkln.supabase.co"
const SUPABASE_KEY = "sb_publishable_mfXH8z8l--w-MFfASIOuLA_N6cnQOsR"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
