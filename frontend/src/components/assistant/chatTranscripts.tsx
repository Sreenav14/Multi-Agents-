import React from "react";
import styles from "./chatTranscripts.module.css";
import MessageBubble from "./MessageBubble";
import type { MessageBubbleProps } from "./MessageBubble";

export type ChatTranscriptProps = {
  messages: MessageBubbleProps[];
};

const ChatTranscript: React.FC<ChatTranscriptProps> = ({ messages }) => {
  const hasMessages = messages.length > 0;

  return (
    <div className={styles.container}>
      {hasMessages ? (
        <div className={styles.list}>
          {messages.map((m, idx) => (
            <MessageBubble
              key={idx}
              sender={m.sender}
              content={m.content}
              createdAt={m.createdAt}
            />
          ))}
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
