
export type Assistant = {
    id: number;
    name: string;
    description?: string | null;
    spec?: string | null;
    graph_json: unknown; // can narrow later
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
  