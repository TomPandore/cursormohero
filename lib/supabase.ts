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

let db = new PostgrestClient(`${supabaseUrl}/rest/v1`, {
  headers: {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  },
})

// Assure que PostgREST utilise le JWT utilisateur (RLS) dès qu'il est disponible
function setPostgrestAuth(token?: string) {
  // Recrée un client PostgREST avec le bon header Authorization
  db = new PostgrestClient(`${supabaseUrl}/rest/v1`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token || supabaseAnonKey}`,
    },
  })
  // Mettre à jour les raccourcis exportés
  ;(supabase as any).db = db
  ;(supabase as any).from = (table: string) => db.from(table)
}

async function syncPostgrestAuthWithSession() {
  try {
    const { data: { session } } = await auth.getSession()
    const accessToken = (session as any)?.access_token || (session as any)?.accessToken
    setPostgrestAuth(accessToken)
  } catch {
    setPostgrestAuth(undefined)
  }
}

// Initial sync au chargement du module
syncPostgrestAuthWithSession()

// Mise à jour automatique sur changement d'état d'auth
auth.onAuthStateChange((_event, session) => {
  const accessToken = (session as any)?.access_token || (session as any)?.accessToken
  setPostgrestAuth(accessToken)
})

export const supabase: any = {
  auth,
  db,
  // `from` est une fonction dynamique qui référence le client courant
  from: (table: string) => db.from(table),
}
