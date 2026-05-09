export type Capability =
  | "web_search"
  | "file_read"
  | "math"
  | "web_read"
  | "database_read"
  | "code_execution"
  | "image_generation";

export interface PluginDefinition {
  slug: string;
  name: string;
  version: string;
  description: string;
  capabilities: Capability[];
  configSchema: Record<string, PluginConfigField>;
  tools: ToolDefinition[];
  isSystem: boolean;
  iconUrl?: string;
}

export interface PluginConfigField {
  type: "string" | "url" | "secret";
  label: string;
  description: string;
  required: boolean;
  placeholder?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface PluginContext {
  userId: string;
  userConfig: Record<string, string>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface UserPlugin {
  id: string;
  userId: string;
  pluginSlug: string;
  config: Record<string, string>;
  isEnabled: boolean;
  installedAt: string;
}
