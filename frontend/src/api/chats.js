// src/api/chats.js
import { apiClient } from "./client.js";

export async function fetchChats(assistantId) {
  const res = await apiClient.get(`/assistants/${assistantId}/chats`);
  return res.data;
}

export async function fetchChat(assistantId, chatId) {
  const res = await apiClient.get(
    `/assistants/${assistantId}/chats/${chatId}`
  );
  return res.data;
}

export async function deleteChat(assistantId, chatId) {
  await apiClient.delete(`/assistants/${assistantId}/chats/${chatId}`);
}
