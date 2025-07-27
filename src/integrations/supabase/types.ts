export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_improvements: {
        Row: {
          agent_id: string | null
          created_at: string
          created_by: string | null
          id: string
          improved_data: Json
          improvement_prompt: string | null
          original_data: Json
          status: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          improved_data: Json
          improvement_prompt?: string | null
          original_data: Json
          status?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          improved_data?: Json
          improvement_prompt?: string | null
          original_data?: Json
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_improvements_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          avatar_url: string | null
          category: string
          character: string | null
          created_at: string
          created_by: string | null
          description: string | null
          goals: string[] | null
          id: string
          is_default: boolean | null
          name: string
          rating: number | null
          rules: string[] | null
          status: string | null
          system_prompt: string | null
          tools: string[] | null
          updated_at: string
          users_count: number | null
        }
        Insert: {
          avatar_url?: string | null
          category?: string
          character?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          goals?: string[] | null
          id?: string
          is_default?: boolean | null
          name: string
          rating?: number | null
          rules?: string[] | null
          status?: string | null
          system_prompt?: string | null
          tools?: string[] | null
          updated_at?: string
          users_count?: number | null
        }
        Update: {
          avatar_url?: string | null
          category?: string
          character?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          goals?: string[] | null
          id?: string
          is_default?: boolean | null
          name?: string
          rating?: number | null
          rules?: string[] | null
          status?: string | null
          system_prompt?: string | null
          tools?: string[] | null
          updated_at?: string
          users_count?: number | null
        }
        Relationships: []
      }
      api_health_logs: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          model: string | null
          provider: string
          response_time: number | null
          status: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          model?: string | null
          provider: string
          response_time?: number | null
          status: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          model?: string | null
          provider?: string
          response_time?: number | null
          status?: string
        }
        Relationships: []
      }
      artifact_versions: {
        Row: {
          artifact_id: string
          changes_summary: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_current: boolean | null
          title: string | null
          version_number: number
        }
        Insert: {
          artifact_id: string
          changes_summary?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          title?: string | null
          version_number?: number
        }
        Update: {
          artifact_id?: string
          changes_summary?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          title?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "artifact_versions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          chat_id: string
          code: string
          created_at: string
          description: string | null
          file_path: string | null
          file_type: string | null
          fragment_id: string | null
          id: string
          is_main_file: boolean | null
          language: string
          message_id: string | null
          parent_id: string | null
          preview_url: string | null
          project_structure: Json | null
          status: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          chat_id: string
          code: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          fragment_id?: string | null
          id?: string
          is_main_file?: boolean | null
          language?: string
          message_id?: string | null
          parent_id?: string | null
          preview_url?: string | null
          project_structure?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          chat_id?: string
          code?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          fragment_id?: string | null
          id?: string
          is_main_file?: boolean | null
          language?: string
          message_id?: string | null
          parent_id?: string | null
          preview_url?: string | null
          project_structure?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          agent_id: string
          agent_name: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generation_jobs: {
        Row: {
          created_at: string
          credits_used: number
          error_message: string | null
          id: string
          model: string | null
          progress: number
          provider: string
          request_params: Json
          response_data: Json | null
          status: string
          timeout_at: string | null
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          error_message?: string | null
          id?: string
          model?: string | null
          progress?: number
          provider: string
          request_params: Json
          response_data?: Json | null
          status?: string
          timeout_at?: string | null
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          error_message?: string | null
          id?: string
          model?: string | null
          progress?: number
          provider?: string
          request_params?: Json
          response_data?: Json | null
          status?: string
          timeout_at?: string | null
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      lyrics: {
        Row: {
          content: string
          created_at: string
          generation_params: Json | null
          id: string
          is_public: boolean
          language: string | null
          prompt: string
          provider: string
          provider_lyrics_id: string | null
          style: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          generation_params?: Json | null
          id?: string
          is_public?: boolean
          language?: string | null
          prompt: string
          provider?: string
          provider_lyrics_id?: string | null
          style?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          generation_params?: Json | null
          id?: string
          is_public?: boolean
          language?: string | null
          prompt?: string
          provider?: string
          provider_lyrics_id?: string | null
          style?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          position: number
          track_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          total_duration: number
          track_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          total_duration?: number
          track_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          total_duration?: number
          track_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          phone_number: string | null
          telegram_id: string | null
          updated_at: string
          user_status: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          phone_number?: string | null
          telegram_id?: string | null
          updated_at?: string
          user_status?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          telegram_id?: string | null
          updated_at?: string
          user_status?: string
          username?: string | null
        }
        Relationships: []
      }
      project_tracks: {
        Row: {
          added_at: string
          id: string
          position: number
          project_id: string
          track_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          position?: number
          project_id: string
          track_id: string
        }
        Update: {
          added_at?: string
          id?: string
          position?: number
          project_id?: string
          track_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          artist_id: string
          concept: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          style: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_id: string
          concept?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          style?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          concept?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          style?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          attached_to_id: string
          attached_to_type: string
          created_at: string
          description: string | null
          id: string
          title: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          attached_to_id: string
          attached_to_type: string
          created_at?: string
          description?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          attached_to_id?: string
          attached_to_type?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      track_likes: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_variations: {
        Row: {
          child_track_id: string
          created_at: string
          id: string
          parent_track_id: string
          updated_at: string
          variation_type: string
        }
        Insert: {
          child_track_id: string
          created_at?: string
          id?: string
          parent_track_id: string
          updated_at?: string
          variation_type?: string
        }
        Update: {
          child_track_id?: string
          created_at?: string
          id?: string
          parent_track_id?: string
          updated_at?: string
          variation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_variations_child_track_id_fkey"
            columns: ["child_track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_variations_parent_track_id_fkey"
            columns: ["parent_track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          artwork_url: string | null
          audio_format: string | null
          bpm: number | null
          created_at: string
          description: string | null
          duration: number | null
          file_path: string | null
          file_size: number | null
          file_url: string | null
          generation_params: Json | null
          genre: string | null
          id: string
          is_commercial: boolean
          is_draft: boolean
          is_public: boolean
          key_signature: string | null
          like_count: number
          lyrics: string | null
          mood: string | null
          parent_draft_id: string | null
          play_count: number
          provider: string
          provider_track_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artwork_url?: string | null
          audio_format?: string | null
          bpm?: number | null
          created_at?: string
          description?: string | null
          duration?: number | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          generation_params?: Json | null
          genre?: string | null
          id?: string
          is_commercial?: boolean
          is_draft?: boolean
          is_public?: boolean
          key_signature?: string | null
          like_count?: number
          lyrics?: string | null
          mood?: string | null
          parent_draft_id?: string | null
          play_count?: number
          provider: string
          provider_track_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artwork_url?: string | null
          audio_format?: string | null
          bpm?: number | null
          created_at?: string
          description?: string | null
          duration?: number | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          generation_params?: Json | null
          genre?: string | null
          id?: string
          is_commercial?: boolean
          is_draft?: boolean
          is_public?: boolean
          key_signature?: string | null
          like_count?: number
          lyrics?: string | null
          mood?: string | null
          parent_draft_id?: string | null
          play_count?: number
          provider?: string
          provider_track_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_parent_draft_id_fkey"
            columns: ["parent_draft_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_stuck_generation_jobs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_project_files: {
        Args: { project_artifact_id: string }
        Returns: {
          id: string
          file_path: string
          code: string
          language: string
          title: string
          is_main_file: boolean
          created_at: string
          updated_at: string
        }[]
      }
      get_track_variations: {
        Args: { track_id: string }
        Returns: {
          id: string
          title: string
          is_draft: boolean
          parent_draft_id: string
          variation_type: string
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
