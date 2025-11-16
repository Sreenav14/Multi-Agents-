// src/api/runs.ts
import { apiClient } from "./client";
import type { Run, Message } from "../types/api";

export type CreateRunResponse = {
  run: Run;
  messages: Message[];
};

// If your backend returns bare Run object with embedded messages,
// adjust this type accordingly.

export async function createRun(
  assistantId: number,
  inputText: string
): Promise<CreateRunResponse> {
  const res = await apiClient.post<CreateRunResponse>(
    `/assistants/${assistantId}/runs`,
    {
      input_text: inputText,
    }
  );
  return res.data;
}
