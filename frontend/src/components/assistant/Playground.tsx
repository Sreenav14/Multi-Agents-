// src/components/assistant/Playground.tsx
import React, { useState } from "react";
import styles from "./Playground.module.css";
import Button from "../common/Button";
import ChatTranscript from "./chatTranscripts";
import type { MessageBubbleProps } from "./MessageBubble";
import { createRun } from "../../api/runs";
import type { Message } from "../../types/api";

type PlaygroundProps = {
  assistantName: string;
  assistantId: number;
};

const Playground: React.FC<PlaygroundProps> = ({
  assistantName,
  assistantId,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageBubbleProps[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapBackendMessages = (backendMessages: Message[]): MessageBubbleProps[] => {
    return backendMessages.map((m) => ({
      sender: m.sender,
      content: m.content,
      createdAt: new Date(m.created_at).toLocaleTimeString(),
    }));
  };

  const handleRun = async () => {
    if (!input.trim() || running) return;

    try {
      setRunning(true);
      setError(null);

      const userInput = input.trim();

      // Optimistically show the user message while waiting
      const optimisticUserMessage: MessageBubbleProps = {
        sender: "user",
        content: userInput,
        createdAt: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, optimisticUserMessage]);
      setInput("");

      const res = await createRun(assistantId, userInput);

      // If backend returns messages including the user, we can either:
      // 1) Replace everything with backend messages:
      const mapped = mapBackendMessages(res.messages);

      setMessages(mapped);

      // Or 2) Append agent messages only.
      // For now we replace with full truth from backend.
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to run assistant";
      setError(errorMessage);
      console.error("Error running assistant:", err);
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.title}>Playground</div>
        <div className={styles.subtitle}>
          Testing: <span>{assistantName}</span> (id {assistantId})
        </div>
      </div>

      <div className={styles.inputBlock}>
        <textarea
          className={styles.textarea}
          placeholder="Ask this assistant something…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.inputRow}>
          <div className={styles.helper}>
            Press <strong>Ctrl+Enter</strong> (or Cmd+Enter) to run
          </div>
          <Button onClick={handleRun} disabled={!input.trim() || running}>
            {running ? "Running..." : "Run"}
          </Button>
        </div>
        {error && (
          <div
            style={{
              fontSize: "0.78rem",
              color: "#f97373",
              marginTop: 4,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div className={styles.transcriptSection}>
        <ChatTranscript messages={messages} />
      </div>
    </div>
  );
};

export default Playground;
