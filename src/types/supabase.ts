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
          updated_at?: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          is_public: boolean
          status: 'draft' | 'published' | 'archived'
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          is_public?: boolean
          status?: 'draft' | 'published' | 'archived'
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          is_public?: boolean
          status?: 'draft' | 'published' | 'archived'
          metadata?: Json | null
        }
      }
      scenes: {
        Row: {
          id: string
          created_at: string
          project_id: string
          name: string
          order: number
          duration: number
          thumbnail_url: string | null
          elements: Json | null
          transitions: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          project_id: string
          name: string
          order: number
          duration?: number
          thumbnail_url?: string | null
          elements?: Json | null
          transitions?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          project_id?: string
          name?: string
          order?: number
          duration?: number
          thumbnail_url?: string | null
          elements?: Json | null
          transitions?: Json | null
        }
      }
      media: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          path: string
          url: string
          size: number
          mime_type: string
          metadata: Json | null
          is_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          path: string
          url: string
          size: number
          mime_type: string
          metadata?: Json | null
          is_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          path?: string
          url?: string
          size?: number
          mime_type?: string
          metadata?: Json | null
          is_public?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      project_status: 'draft' | 'published' | 'archived'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
