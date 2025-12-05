// Type definitions (converted from TypeScript)
// These are kept as comments for reference but JavaScript doesn't enforce types

// Assistant type
// {
//   id: number;
//   name: string;
//   description?: string | null;
//   spec?: string | null;
//   graph_json: unknown; 
//   created_at: string;
//   updated_at: string;
// }

// Run type
// {
//   id: number;
//   assistant_id: number;
//   status: "created" | "running" | "completed" | "failed";
//   input_text: string;
//   created_at: string;
//   completed_at?: string | null;
//   error_message?: string | null;
// }

// Message type
// {
//   id: number;
//   run_id: number;
//   sender: string;
//   content: string;
//   message_metadata?: unknown;
//   created_at: string;
// }

// UserToolConnection interface
// {
//   id: number;
//   user_id: number;
//   template_key: string;
//   config_json?: Record<string, unknown>|null;
//   status: string;
//   created_at: string;
//   updated_at: string;
// }

// MCPServer interface
// {
//   id:number;
//   name: string;
//   description?: string | null;
//   server_type:string;
//   config_json?: Record<string, unknown>|null;
//   created_at: string;
//   updated_at: string;
// }

// ToolRefKind = "user_tool" | "mcp_server"

// ToolRef interface
// {
//   kind : ToolRefKind;
//   id: number;
// }

// AgentNode interface
// {
//   id:string;
//   label:string;
//   role?:string;
//   system_prompt: string;
//   tool_refs: ToolRef[];
// }

// GraphEdge interface
// {
//   id:string;
//   source: string;
//   target: string;
//   condition?: string;
// }

// AssistantGraph interface
// {
//   nodes:AgentNode[];
//   edges:GraphEdge[];
// }
