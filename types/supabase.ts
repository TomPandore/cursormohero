export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
          updated_at: string
          progress: Json
          programme_id: string | null
          jour_actuel: number
          clan_id: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          created_at?: string
          updated_at?: string
          progress?: Json
          programme_id?: string | null
          jour_actuel?: number
          clan_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string
          updated_at?: string
          progress?: Json
          programme_id?: string | null
          jour_actuel?: number
          clan_id?: string | null
        }
      }
    }
  }
}