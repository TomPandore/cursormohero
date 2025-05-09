import { PostgrestClient } from '@supabase/postgrest-js'
import { GoTrueClient } from '@supabase/gotrue-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔑 SUPABASE_URL', supabaseUrl)
console.log('🪙 SUPABASE_KEY', supabaseAnonKey)

const auth = new GoTrueClient({
  url: `${supabaseUrl}/auth/v1`,
  headers: {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  },
})

const db = new PostgrestClient<Database>(`${supabaseUrl}/rest/v1`, {
  headers: {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  },
})

export const supabase = {
  auth,
  db,

  // ✅ Raccourcis rétro-compatibles
  from: db.from.bind(db),
  insert: <T extends keyof Database['public']['Tables']>(
    table: T,
    values: Database['public']['Tables'][T]['Insert']
  ) => db.from(table).insert(values),

  update: <T extends keyof Database['public']['Tables']>(
    table: T,
    values: Partial<Database['public']['Tables'][T]['Update']>
  ) => db.from(table).update(values),

  delete: <T extends keyof Database['public']['Tables']>(
    table: T
  ) => db.from(table).delete(),
}
