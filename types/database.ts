export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          optimization_preferences: Json;
          preferred_providers: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          optimization_preferences?: Json;
          preferred_providers?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          optimization_preferences?: Json;
          preferred_providers?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          label: string;
          vault_secret_id: string;
          base_url: string | null;
          is_active: boolean;
          last_tested_at: string | null;
          last_test_status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          label: string;
          vault_secret_id: string;
          base_url?: string | null;
          is_active?: boolean;
          last_tested_at?: string | null;
          last_test_status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          label?: string;
          vault_secret_id?: string;
          base_url?: string | null;
          is_active?: boolean;
          last_tested_at?: string | null;
          last_test_status?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          model_used: string | null;
          provider_used: string | null;
          routing_decision: Json | null;
          tokens_input: number | null;
          tokens_output: number | null;
          cost_usd: number | null;
          latency_ms: number | null;
          plugins_used: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          model_used?: string | null;
          provider_used?: string | null;
          routing_decision?: Json | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_usd?: number | null;
          latency_ms?: number | null;
          plugins_used?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          model_used?: string | null;
          provider_used?: string | null;
          routing_decision?: Json | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_usd?: number | null;
          latency_ms?: number | null;
          plugins_used?: string[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workflows: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          nodes: Json;
          edges: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          nodes?: Json;
          edges?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          nodes?: Json;
          edges?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workflow_runs: {
        Row: {
          id: string;
          workflow_id: string;
          user_id: string;
          status: string;
          input: Json | null;
          output: Json | null;
          steps: Json;
          cost_usd: number | null;
          started_at: string | null;
          completed_at: string | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          user_id: string;
          status?: string;
          input?: Json | null;
          output?: Json | null;
          steps?: Json;
          cost_usd?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          error?: string | null;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          user_id?: string;
          status?: string;
          input?: Json | null;
          output?: Json | null;
          steps?: Json;
          cost_usd?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          error?: string | null;
        };
        Relationships: [];
      };
      plugins: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          version: string;
          capabilities: string[];
          config_schema: Json | null;
          is_system: boolean;
          icon_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          version?: string;
          capabilities?: string[];
          config_schema?: Json | null;
          is_system?: boolean;
          icon_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          version?: string;
          capabilities?: string[];
          config_schema?: Json | null;
          is_system?: boolean;
          icon_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_plugins: {
        Row: {
          id: string;
          user_id: string;
          plugin_slug: string;
          config: Json;
          is_enabled: boolean;
          installed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plugin_slug: string;
          config?: Json;
          is_enabled?: boolean;
          installed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plugin_slug?: string;
          config?: Json;
          is_enabled?: boolean;
          installed_at?: string;
        };
        Relationships: [];
      };
      model_metrics: {
        Row: {
          id: string;
          provider: string;
          model: string;
          task_type: string;
          avg_latency_ms: number | null;
          avg_cost_per_1k_tokens: number | null;
          success_rate: number | null;
          sample_count: number;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          model: string;
          task_type: string;
          avg_latency_ms?: number | null;
          avg_cost_per_1k_tokens?: number | null;
          success_rate?: number | null;
          sample_count?: number;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          model?: string;
          task_type?: string;
          avg_latency_ms?: number | null;
          avg_cost_per_1k_tokens?: number | null;
          success_rate?: number | null;
          sample_count?: number;
          recorded_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      user_cost_summary: {
        Row: {
          user_id: string | null;
          provider_used: string | null;
          model_used: string | null;
          message_count: number | null;
          total_tokens_input: number | null;
          total_tokens_output: number | null;
          total_cost_usd: number | null;
          avg_latency_ms: number | null;
          day: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      vault_create_secret: {
        Args: { secret: string; name: string; description?: string };
        Returns: string;
      };
      vault_read_secret: {
        Args: { secret_id: string };
        Returns: string;
      };
      vault_delete_secret: {
        Args: { secret_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
