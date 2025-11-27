// src/api/chats.ts
import { apiClient } from "./client";
import type { Run, Message } from "../types/api";

export type Chat = {
  id: number;
  assistant_id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchChats(assistantId: number): Promise<Chat[]> {
  const res = await apiClient.get<Chat[]>(`/assistants/${assistantId}/chats`);
  return res.data;
}

export async function fetchChat(
  assistantId: number,
  chatId: number
): Promise<{
  chat: Chat;
  runs: Run[];
  messages: Message[];
}> {
  const res = await apiClient.get(
    `/assistants/${assistantId}/chats/${chatId}`
  );
  return res.data;
}

export async function deleteChat(
  assistantId: number,
  chatId: number
): Promise<void> {
  await apiClient.delete(`/assistants/${assistantId}/chats/${chatId}`);
}

