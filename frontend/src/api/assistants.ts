import { apiClient } from "./client";

export interface AssistantCreate {
  name: string;
  description?: string;
  spec?: string;
}

export interface Assistant {
  id: number;
  name: string;
  description?: string | null;
  spec?: string | null;
  graph_json: any;
  created_at: string;
  updated_at: string;
}

export async function fetchAssistants(): Promise<Assistant[]> {
  const res = await apiClient.get<Assistant[]>("/assistants");
  return res.data;
}

export async function createAssistant(payload: AssistantCreate): Promise<Assistant> {
  const res = await apiClient.post<Assistant>("/assistants", payload);
  return res.data;
}

export async function fetchAssistant(assistantId: number): Promise<Assistant> {
  const res = await apiClient.get<Assistant>(`/assistants/${assistantId}`);
  return res.data;
}