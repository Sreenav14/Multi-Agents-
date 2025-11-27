import { apiClient } from "./client";
import type { Assistant } from "../types/api";

export async function fetchAssistants(): Promise<Assistant[]> {
  const res = await apiClient.get<Assistant[]>("/assistants");
  return res.data;
}

export type CreateAssistantPayload = {
  name: string;
  description?: string;
  spec?: string;
};


export async function createAssistant(
  payload: CreateAssistantPayload
): Promise<Assistant> {
  const res = await apiClient.post<Assistant>("/assistants", payload);
  return res.data;
}

export async function fetchAssistantById(id: number): Promise<Assistant> {
  const res = await apiClient.get<Assistant>(`/assistants/${id}`);
  return res.data;
}

export async function deleteAssistant(id: number): Promise<void> {
    await apiClient.delete(`/assistants/${id}`);
}

export async function updateAssistantGraph(
  assistantId: number,
  graphJson: any
): Promise<Assistant> {
  const res = await apiClient.put<Assistant>(`/assistants/${assistantId}/graph`,{
    graph_json : graphJson,
  });
  return res.data;
}

// Alias for fetchAssistantById - keeping for backward compatibility
export async function fetchAssistant(
  assistantId: number
): Promise<Assistant> {
  return fetchAssistantById(assistantId);
}