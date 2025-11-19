import React from "react";
import styles from "./MessageBubble.module.css";

export type MessageBubbleProps = {
  sender: string;
  content: string;
  createdAt?: string;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  sender,
  content,
  createdAt,
}) => {
  const isUser = sender === "user";

  const rowClass = isUser ? styles.rowUser : styles.rowAgent;
  const bubbleClass = isUser
    ? `${styles.bubble} ${styles.bubbleUser}`
    : `${styles.bubble} ${styles.bubbleAgent}`;

  const label = isUser ? "You" : "Assistant";

  return (
    <div className={`${styles.row} ${rowClass}`}>
      <div>
        <div className={styles.meta}>
          <span className={styles.sender}>{label}</span>
          {createdAt ? ` • ${createdAt}` : null}
        </div>
        <div className={bubbleClass}>
          <div style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
