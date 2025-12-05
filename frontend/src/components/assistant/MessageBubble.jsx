import React from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import styles from "./MessageBubble.module.css";

const MessageBubble = ({
  sender,
  content,
  createdAt,
  messageId,
  toolsUsed = [],
  onDelete,
}) => {
  const isUser = sender === "user";

  const rowClass = isUser ? styles.rowUser : styles.rowAgent;
  const bubbleClass = isUser
    ? `${styles.bubble} ${styles.bubbleUser}`
    : `${styles.bubble} ${styles.bubbleAgent}`;

  const label = isUser ? "You" : "Assistant";

  // Fix broken markdown patterns from LLM output
  const preprocessMarkdown = (text) => {
    return text
      // Fix broken bold: "**\n\nText\n\n**" → "**Text**"
      .replace(/\*\*\s*\n+\s*/g, '**')
      .replace(/\s*\n+\s*\*\*/g, '**')
      // Fix "**\n\n**" patterns (empty bold)
      .replace(/\*\*\s*\*\*/g, '')
      // Fix isolated "**" on lines
      .replace(/^\s*\*\*\s*$/gm, '')
      // Fix "*\n\n" patterns (broken bullets)
      .replace(/^\*\s*$/gm, '')
      // Fix numbered lists with broken formatting: "2.\n\n" → proper list
      .replace(/^(\d+)\.\s*\n+/gm, '$1. ')
      // Fix merged words: add space between lowercase and uppercase (camelCase breaks)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Fix merged words after punctuation without space
      .replace(/([.,:;!?])([A-Z])/g, '$1 $2')
      // Clean up excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace from lines
      .split('\n').map(line => line.trim()).join('\n')
      .trim();
  };

  return (
    <div className={`${styles.row} ${rowClass}`}>
      <div style={{ position: "relative", width: "100%" }}>
        <div className={styles.meta}>
          <span className={styles.sender}>{label}</span>
          {createdAt ? ` • ${createdAt}` : null}
          {toolsUsed.length > 0 && (
            <span className={styles.toolsBadge}>
              🔧 {toolsUsed.join(", ")}
            </span>
          )}
          {!isUser && messageId && onDelete && (
            <button
              className={styles.deleteMessageButton}
              onClick={() => onDelete(messageId)}
              title="Delete message"
            >
              ×
            </button>
          )}
        </div>
        <div className={bubbleClass}>
          {isUser ? (
          <div style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {content}
          </div>
          ) : (
            <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', overflow: 'hidden' }}>
              <ReactMarkdown
                remarkPlugins={[remarkBreaks]}
                skipHtml={false}
                components={{
                  h1: ({children, node, ...props}) => (
                    <h1 style={{
                      fontSize: '1.5em',
                      fontWeight: 'bold',
                      marginTop: '1em',
                      marginBottom: '0.75em',
                      lineHeight: '1.3'
                    }} {...props}>{children}</h1>
                  ),
                  h2: ({children, node, ...props}) => (
                    <h2 style={{
                      fontSize: '1.3em',
                      fontWeight: 'bold',
                      marginTop: '0.9em',
                      marginBottom: '0.6em',
                      lineHeight: '1.3'
                    }} {...props}>{children}</h2>
                  ),
                  h3: ({children, node, ...props}) => (
                    <h3 style={{
                      fontSize: '1.1em',
                      fontWeight: 'bold',
                      marginTop: '0.8em',
                      marginBottom: '0.5em',
                      lineHeight: '1.3'
                    }} {...props}>{children}</h3>
                  ),
                  ul: ({children, node, ...props}) => (
                    <ul style={{
                      marginLeft: '1.5em',
                      marginTop: '0.6em',
                      marginBottom: '0.6em',
                      paddingLeft: '0.5em'
                    }} {...props}>{children}</ul>
                  ),
                  ol: ({children, node, ...props}) => (
                    <ol style={{
                      marginLeft: '1.5em',
                      marginTop: '0.6em',
                      marginBottom: '0.6em',
                      paddingLeft: '0.5em'
                    }} {...props}>{children}</ol>
                  ),
                  li: ({children, node, ...props}) => (
                    <li style={{
                      marginBottom: '0.4em',
                      lineHeight: '1.5'
                    }} {...props}>{children}</li>
                  ),
                  p: ({children, node, ...props}) => (
                    <p style={{
                      marginBottom: '0.8em',
                      lineHeight: '1.6'
                    }} {...props}>{children}</p>
                  ),
                  strong: ({children, node, ...props}) => (
                    <strong style={{ fontWeight: 'bold' }} {...props}>{children}</strong>
                  ),
                  blockquote: ({children, node, ...props}) => (
                    <blockquote style={{
                      borderLeft: '3px solid #D4C9B8',
                      paddingLeft: '1em',
                      marginLeft: '0',
                      marginTop: '0.8em',
                      marginBottom: '0.8em',
                      fontStyle: 'italic',
                      color: '#5A4A3A'
                    }} {...props}>{children}</blockquote>
                  ),
                }}
              >{preprocessMarkdown(content)}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
