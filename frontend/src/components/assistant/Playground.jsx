import React, { useState, useEffect, useCallback } from "react";
import styles from "./Playground.module.css";
import Button from "../common/Button";
import ChatTranscript from "./chatTranscripts";
import { createRun } from "../../api/runs.js";
import { fetchChats, fetchChat, deleteChat } from "../../api/chats.js";

const Playground = ({
  assistantName,
  assistantId,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);

  // Map backend messages to frontend format - show ALL messages
  const mapBackendMessages = (backendMessages) => {
    return backendMessages.map((m) => {
      const metadata = m.message_metadata;
      const toolsUsed = metadata?.tools_used || [];
      
      return {
        sender: m.sender === "user" ? "user" : "assistant", // All non-user messages are assistant
        content: m.content,
        createdAt: new Date(m.created_at).toLocaleTimeString(),
        messageId: m.id,
        toolsUsed: toolsUsed,
      };
    });
  };

  const loadChats = useCallback(async () => {
    try {
      const chatsData = await fetchChats(assistantId);
      setChats(chatsData);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  }, [assistantId]);

  const loadChatMessages = useCallback(async (chatId) => {
    try {
      const chatData = await fetchChat(assistantId, chatId);
      const mapped = mapBackendMessages(chatData.messages);
      setMessages(mapped);
      setCurrentChatId(chatId);
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  }, [assistantId]);

  // Load chats when assistant changes
  useEffect(() => {
    // Reset state when assistant changes
    setCurrentChatId(null);
    setMessages([]);
    setInput("");
    loadChats();
  }, [assistantId, loadChats]);

  // Auto-load most recent chat when chats are loaded (and no chat is currently selected)
  useEffect(() => {
    if (chats.length > 0 && currentChatId === null) {
      // Sort by updated_at descending to get most recent chat
      const sortedChats = [...chats].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      const mostRecentChat = sortedChats[0];
      if (mostRecentChat) {
        loadChatMessages(mostRecentChat.id);
      }
    }
  }, [chats, currentChatId, loadChatMessages]);

  // ✅ FIXED: Proper conversation flow - chat and reply
  const handleRun = async () => {
    if (!input.trim() || running) return;
    try {
      setRunning(true);
      setError(null);
      const userInput = input.trim();

      // Show user message immediately (optimistic update)
      const optimisticUserMessage = {
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
      // Just replace all messages with the complete conversation
      const allMapped = mapBackendMessages(res.messages);
      setMessages(allMapped); // Replace with complete conversation
      
      // Reload chat list to update timestamps
      await loadChats();
      
    } catch (err) {
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

  const handleKeyDown = (e) => {
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
          >
            <div
              className={styles.chatTitle}
              onClick={() => loadChatMessages(chat.id)}
            >
              {chat.title || `Chat ${chat.id}`}
            </div>
            <button
              className={styles.deleteChatButton}
              onClick={async (e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    "Delete this chat? All messages will be permanently deleted."
                  )
                ) {
                  try {
                    await deleteChat(assistantId, chat.id);
                    await loadChats(); // Reload chat list
                    if (currentChatId === chat.id) {
                      // If deleted chat was active, clear it
                      setCurrentChatId(null);
                      setMessages([]);
                    }
                  } catch (err) {
                    console.error("Failed to delete chat:", err);
                    alert("Failed to delete chat");
                  }
                }
              }}
              title="Delete chat"
            >
              ×
            </button>
          </div>
        ))}
      </div>
  
      {/* ✅ FIXED: Transcript comes first (grows to fill space) */}
      <div className={styles.transcriptSection}>
        <ChatTranscript 
          messages={messages} 
          onDeleteMessage={async (messageId) => {
            try {
              // TODO: Add API endpoint to delete message
              console.log("Delete message:", messageId);
              // For now, just reload the chat to refresh
              if (currentChatId) {
                await loadChatMessages(currentChatId);
              }
            } catch (err) {
              console.error("Failed to delete message:", err);
            }
          }}
        />
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
              color: "#dc2626",
              marginTop: 4,
              padding: "8px 12px",
              background: "#fee",
              borderRadius: "6px",
              border: "1px solid #fcc",
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
