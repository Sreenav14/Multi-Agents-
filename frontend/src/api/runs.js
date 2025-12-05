// src/api/runs.js
import { apiClient } from "./client.js";

export async function createRun(assistantId, inputText, chatId) {
  const res = await apiClient.post(
    `/assistants/${assistantId}/runs`,
    {
      input_text: inputText,
      chat_id:chatId || null,
    }
  );
  return res.data;
}
