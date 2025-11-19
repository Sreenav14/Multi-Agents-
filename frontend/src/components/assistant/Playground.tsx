import React, { useState, useEffect } from "react";
import styles from "./Playground.module.css";
import Button from "../common/Button";
import ChatTranscript from "./chatTranscripts";
import type { MessageBubbleProps } from "./MessageBubble";
import { createRun } from "../../api/runs";
import { apiClient } from "../../api/client";
import type { Message, Run } from "../../types/api";

type PlaygroundProps = {
  assistantName: string;
  assistantId: number;
};

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

const Playground: React.FC<PlaygroundProps> = ({
  assistantName,
  assistantId,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageBubbleProps[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    loadChats();
  }, [assistantId]);

  // Filter to show only user and writer messages (WhatsApp-style)
  const mapBackendMessages = (backendMessages: Message[]): MessageBubbleProps[] => {
    // Filter: Only show "user" and "writer" messages (hide "planner" and "researcher")
    const filtered = backendMessages.filter((m) => 
      m.sender === "user" || m.sender.toLowerCase() === "writer"
    );
    
    return filtered.map((m) => ({
      sender: m.sender === "user" ? "user" : "assistant", // Show "assistant" instead of "writer"
      content: m.content,
      createdAt: new Date(m.created_at).toLocaleTimeString(),
    }));
  };

  const loadChats = async () => {
    try {
      const chatsData = await fetchChats(assistantId);
      setChats(chatsData);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  };

  const loadChatMessages = async (chatId: number) => {
    try {
      const chatData = await fetchChat(assistantId, chatId);
      const mapped = mapBackendMessages(chatData.messages);
      setMessages(mapped);
      setCurrentChatId(chatId);
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };

  // ✅ FIXED: Proper conversation flow - chat and reply
  const handleRun = async () => {
    if (!input.trim() || running) return;
    try {
      setRunning(true);
      setError(null);
      const userInput = input.trim();

      // Show user message immediately (optimistic update)
      const optimisticUserMessage: MessageBubbleProps = {
        sender: "user",
        content: userInput,
        createdAt: new Date().toLocaleTimeString(),
      };

      // Add optimistic user message
      setMessages((prev) => [...prev, optimisticUserMessage]);
      setInput("");
      
      // Send to backend - backend will include previous conversation context
      const res = await createRun(assistantId, userInput, currentChatId);
      
      // If this is a new chat, update currentChatId and reload chat list
      if (!currentChatId && res.chat_id) {
        setCurrentChatId(res.chat_id);
        await loadChats();
      }

      // ✅ FIXED: Backend returns ALL messages (previous conversation + new)
      // Just replace all messages with the complete filtered conversation
      const allMapped = mapBackendMessages(res.messages);
      setMessages(allMapped); // Replace with complete conversation
      
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to run assistant";
      setError(errorMessage);
      console.error("Error running assistant:", err);
      
      // Remove the optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setRunning(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInput("");
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
        <Button onClick={handleNewChat}>New Chat</Button>
      </div>
      
      <div className={styles.chatHistorySection}>
        <h3>Chat History</h3>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={
              currentChatId === chat.id ? styles.activeChat : styles.chatItem
            }
            onClick={() => loadChatMessages(chat.id)}
          >
            <div className={styles.chatTitle}>
              {chat.title || "New Chat"}
            </div>
          </div>
        ))}
      </div>
  
      {/* ✅ FIXED: Transcript comes first (grows to fill space) */}
      <div className={styles.transcriptSection}>
        <ChatTranscript messages={messages} />
      </div>
  
      {/* ✅ FIXED: Input bar at the bottom (fixed position) */}
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
    </div>
  );
};

export default Playground;