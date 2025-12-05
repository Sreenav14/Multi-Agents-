import React, { useEffect, useRef, useState } from "react";
import styles from "./chatTranscripts.module.css";
import MessageBubble from "./MessageBubble";

const ChatTranscript = ({ messages, onDeleteMessage }) => {
  const hasMessages = messages.length > 0;
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // ✅ Check if user is at the bottom of the chat
  const isUserAtBottom = () => {
    if (!containerRef.current) return true;
    
    const container = containerRef.current;
    const threshold = 100; // 100px threshold
    
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    );
  };

  // ✅ Track scroll position - if user scrolls up, disable auto-scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShouldAutoScroll(isUserAtBottom());
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Only auto-scroll if user is at bottom AND new messages arrive
  useEffect(() => {
    if (!shouldAutoScroll) return; // Don't scroll if user scrolled up
    
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages.length, shouldAutoScroll]); // Only trigger when message count changes

  return (
    <div ref={containerRef} className={styles.container}>
      {hasMessages ? (
        <div className={styles.list}>
          {messages.map((m, idx) => (
            <MessageBubble
              key={idx}
              sender={m.sender}
              content={m.content}
              createdAt={m.createdAt}
              messageId={m.messageId}
              toolsUsed={m.toolsUsed}
              onDelete={onDeleteMessage}
            />
          ))}
          {/* Invisible div at the bottom to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className={styles.empty}>
          No conversation yet. Ask this assistant something to run the
          Planner → Researcher → Writer flow.
        </div>
      )}
    </div>
  );
};

export default ChatTranscript;
