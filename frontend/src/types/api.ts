export type Assistant = {
    id: number;
    name: string;
    description?: string | null;
    spec?: string | null;
    graph_json: unknown; 
    created_at: string;
    updated_at: string;
  };
  
export type Run = {
  id: number;
  assistant_id: number;
  status: "created" | "running" | "completed" | "failed";
  input_text: string;
  created_at: string;
  completed_at?: string | null;
  error_message?: string | null;
};
  
export type Message = {
  id: number;
  run_id: number;
  sender: string;
  content: string;
  message_metadata?: unknown;
  created_at: string;
};
  
export interface UserToolConnection{
  id: number;
  user_id: number;
  template_key: string;
  config_json?: Record<string, unknown>|null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MCPServer{
  id:number;
  name: string;
  description?: string | null;
  server_type:string;
  config_json?: Record<string, unknown>|null;
  created_at: string;
  updated_at: string;
}

export type ToolRefKind = "user_tool" | "mcp_server";

export interface ToolRef{
  kind : ToolRefKind;
  id: number;
}

// One agent node in graph_json
export interface AgentNode{
  id:string;
  label:string;
  role?:string;
  system_prompt: string;
  tool_refs: ToolRef[];
}

// Edge between two agents
export interface GraphEdge{
  id:string;
  source: string;
  target: string;
  condition?: string;
}

// The full assistant graph structure
export interface AssistantGraph{
  nodes:AgentNode[];
  edges:GraphEdge[];
}
