export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          base_url: string | null
          created_at: string
          id: string
          is_active: boolean
          label: string
          last_test_status: string | null
          last_tested_at: string | null
          provider: string
          user_id: string
          vault_secret_id: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          last_test_status?: string | null
          last_tested_at?: string | null
          provider: string
          user_id: string
          vault_secret_id: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          last_test_status?: string | null
          last_tested_at?: string | null
          provider?: string
          user_id?: string
          vault_secret_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          summary: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          cost_usd: number | null
          created_at: string
          id: string
          latency_ms: number | null
          model_used: string | null
          plugins_used: string[] | null
          provider_used: string | null
          role: string
          routing_decision: Json | null
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          model_used?: string | null
          plugins_used?: string[] | null
          provider_used?: string | null
          role: string
          routing_decision?: Json | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          model_used?: string | null
          plugins_used?: string[] | null
          provider_used?: string | null
          role?: string
          routing_decision?: Json | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      model_metrics: {
        Row: {
          avg_cost_per_1k_tokens: number | null
          avg_latency_ms: number | null
          id: string
          model: string
          provider: string
          recorded_at: string
          sample_count: number
          success_rate: number | null
          task_type: string
        }
        Insert: {
          avg_cost_per_1k_tokens?: number | null
          avg_latency_ms?: number | null
          id?: string
          model: string
          provider: string
          recorded_at?: string
          sample_count?: number
          success_rate?: number | null
          task_type: string
        }
        Update: {
          avg_cost_per_1k_tokens?: number | null
          avg_latency_ms?: number | null
          id?: string
          model?: string
          provider?: string
          recorded_at?: string
          sample_count?: number
          success_rate?: number | null
          task_type?: string
        }
        Relationships: []
      }
      plugins: {
        Row: {
          capabilities: string[]
          config_schema: Json | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_system: boolean
          name: string
          slug: string
          version: string
        }
        Insert: {
          capabilities?: string[]
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_system?: boolean
          name: string
          slug: string
          version?: string
        }
        Update: {
          capabilities?: string[]
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          disabled_models: string[]
          display_name: string | null
          id: string
          optimization_preferences: Json
          preferred_providers: string[]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          disabled_models?: string[]
          display_name?: string | null
          id: string
          optimization_preferences?: Json
          preferred_providers?: string[]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          disabled_models?: string[]
          display_name?: string | null
          id?: string
          optimization_preferences?: Json
          preferred_providers?: string[]
        }
        Relationships: []
      }
      user_plugins: {
        Row: {
          config: Json
          id: string
          installed_at: string
          is_enabled: boolean
          plugin_slug: string
          user_id: string
        }
        Insert: {
          config?: Json
          id?: string
          installed_at?: string
          is_enabled?: boolean
          plugin_slug: string
          user_id: string
        }
        Update: {
          config?: Json
          id?: string
          installed_at?: string
          is_enabled?: boolean
          plugin_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plugins_plugin_slug_fkey"
            columns: ["plugin_slug"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["slug"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          cost_usd: number | null
          error: string | null
          id: string
          input: Json | null
          output: Json | null
          started_at: string | null
          status: string
          steps: Json
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          cost_usd?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          started_at?: string | null
          status?: string
          steps?: Json
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          cost_usd?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          started_at?: string | null
          status?: string
          steps?: Json
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          description: string | null
          edges: Json
          id: string
          is_published: boolean
          name: string
          nodes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          is_published?: boolean
          name: string
          nodes?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          is_published?: boolean
          name?: string
          nodes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_cost_summary: {
        Row: {
          avg_latency_ms: number | null
          day: string | null
          message_count: number | null
          model_used: string | null
          provider_used: string | null
          total_cost_usd: number | null
          total_tokens_input: number | null
          total_tokens_output: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      vault_create_secret: {
        Args: { description?: string; name: string; secret: string }
        Returns: string
      }
      vault_delete_secret: { Args: { secret_id: string }; Returns: boolean }
      vault_read_secret: { Args: { secret_id: string }; Returns: string }
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
