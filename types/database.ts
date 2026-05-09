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
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["api_keys"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["conversations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["workflows"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["workflows"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["workflow_runs"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["workflow_runs"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["plugins"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["plugins"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["user_plugins"]["Row"], "id" | "installed_at">;
        Update: Partial<Database["public"]["Tables"]["user_plugins"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["model_metrics"]["Row"], "id" | "recorded_at">;
        Update: Partial<Database["public"]["Tables"]["model_metrics"]["Insert"]>;
      };
    };
  };
}
