import { apiClient } from "./client.js";

export async function fetchAssistants() {
  const res = await apiClient.get("/assistants");
  return res.data;
}

export async function createAssistant(payload) {
  const res = await apiClient.post("/assistants", payload);
  return res.data;
}

export async function fetchAssistantById(id) {
  const res = await apiClient.get(`/assistants/${id}`);
  return res.data;
}

export async function deleteAssistant(id) {
    await apiClient.delete(`/assistants/${id}`);
}

export async function updateAssistantGraph(assistantId, graphJson) {
  const res = await apiClient.put(`/assistants/${assistantId}/graph`,{
    graph_json : graphJson,
  });
  return res.data;
}

// Alias for fetchAssistantById - keeping for backward compatibility
export async function fetchAssistant(assistantId) {
  return fetchAssistantById(assistantId);
}
