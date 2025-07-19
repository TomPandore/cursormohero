import { PostgrestClient } from '@supabase/postgrest-js'
import { GoTrueClient } from '@supabase/gotrue-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔑 SUPABASE_URL', supabaseUrl)
console.log('🪙 SUPABASE_KEY', supabaseAnonKey)

// Configuration du stockage sécurisé pour React Native
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return Promise.resolve(localStorage.getItem(key))
    }
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value)
      return Promise.resolve()
    }
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
      return Promise.resolve()
    }
    return SecureStore.deleteItemAsync(key)
  },
}

const auth = new GoTrueClient({
  url: `${supabaseUrl}/auth/v1`,
  headers: {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  },
  // Configuration pour React Native avec stockage sécurisé
  storage: ExpoSecureStoreAdapter,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false, // Important pour mobile
})

const db = new PostgrestClient(`${supabaseUrl}/rest/v1`, {
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
}
