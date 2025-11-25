import React from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
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

  // Preprocess content to ensure proper markdown formatting
  // Convert text to proper markdown structure with line breaks
  const preprocessMarkdown = (text: string): string => {
    let processed = text;
    
    // Step 1: Split by numbered list items first (most important)
    const numberedPattern = /\d+\.\s+\*\*[^*]+\*\*\s*:/g;
    const numberedMatches = Array.from(text.matchAll(numberedPattern));
    
    if (numberedMatches.length > 0) {
      // Split the text by numbered items
      const segments: string[] = [];
      let lastPos = 0;
      
      numberedMatches.forEach((match, idx) => {
        const start = match.index!;
        const nextStart = numberedMatches[idx + 1]?.index ?? text.length;
        
        // Get content before this numbered item
        if (start > lastPos) {
          segments.push(text.substring(lastPos, start));
        }
        
        // Get this numbered item and its content
        segments.push(text.substring(start, nextStart));
        lastPos = nextStart;
      });
      
      // Process each segment
      processed = segments.map((segment) => {
        const isNumbered = /^\d+\.\s+\*\*/.test(segment.trim());
        const trimmed = segment.trim();
        
        if (!trimmed) return '';
        
        // For numbered items, ensure they start on new line
        if (isNumbered) {
          // Add line break before the number
          let formatted = trimmed.replace(/^(\d+\.\s+\*\*[^*]+\*\*\s*:)/, '\n\n$1');
          // Ensure content after colon starts on new line
          formatted = formatted.replace(/(\*\*[^*]+\*\*\s*:)\s+/, '$1\n\n');
          return formatted;
        }
        
        // For regular content, split into paragraphs
        // Split on sentence endings followed by capital letters (paragraph breaks)
        let formatted = trimmed
          .replace(/([.!?])\s+([A-Z][^.!?]*?)(?=\s+[A-Z][^.!?]*?[.!?]|$)/g, '$1\n\n$2')
          .trim();
        
        // Ensure headings are on their own lines
        formatted = formatted.replace(/(\*\*[^*]+\*\*)/g, '\n\n$1\n\n');
        
        return formatted;
      }).filter(s => s.trim()).join('\n\n').trim();
    }
    
    // Step 2: General paragraph splitting (for non-numbered content)
    // Split paragraphs based on sentence endings and structure
    processed = processed
      // Split on sentence endings that are followed by capital letters (likely new paragraph)
      // This pattern: ". A" or "? The" indicates a new sentence that might be a new paragraph
      .replace(/([.!?])\s+([A-Z][a-z]+(?:\s+[a-z]+){0,3}(?:\s+[A-Z][a-z]+))/g, '$1\n\n$2')
      // More aggressive: split after periods followed by space and capital letter
      .replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2')
      // Ensure bold headings are on separate lines with spacing
      .replace(/([^\n])(\*\*[^*]+\*\*)/g, '$1\n\n$2')
      .replace(/(\*\*[^*]+\*\*)([^\n])/g, '$1\n\n$2')
      // Ensure numbered items are on separate lines
      .replace(/([^\n])(\d+\.\s+\*\*)/g, '$1\n\n$2')
      // Ensure colons after bold text have proper spacing
      .replace(/(\*\*[^*]+\*\*\s*:)\s+([A-Z])/g, '$1\n\n$2')
      // Clean up excessive newlines (more than 2 consecutive)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return processed;
  };

  return (
    <div className={`${styles.row} ${rowClass}`}>
      <div>
        <div className={styles.meta}>
          <span className={styles.sender}>{label}</span>
          {createdAt ? ` • ${createdAt}` : null}
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
                  h1: ({children, node, ...props}: any) => (
                    <h1 style={{
                      fontSize: '1.5em',
                      fontWeight: 'bold',
                      marginTop: '1em',
                      marginBottom: '0.75em',
                      lineHeight: '1.3'
                    }} {...props}>{children}</h1>
                  ),
                  h2: ({children, node, ...props}: any) => (
                    <h2 style={{
                      fontSize: '1.3em',
                      fontWeight: 'bold',
                      marginTop: '0.9em',
                      marginBottom: '0.6em',
                      lineHeight: '1.3'
                    }} {...props}>{children}</h2>
                  ),
                  h3: ({children, node, ...props}: any) => (
                    <h3 style={{
                      fontSize: '1.1em',
                      fontWeight: 'bold',
                      marginTop: '0.8em',
                      marginBottom: '0.5em',
                      lineHeight: '1.3'
                    }} {...props}>{children}</h3>
                  ),
                  ul: ({children, node, ...props}: any) => (
                    <ul style={{
                      marginLeft: '1.5em',
                      marginTop: '0.6em',
                      marginBottom: '0.6em',
                      paddingLeft: '0.5em'
                    }} {...props}>{children}</ul>
                  ),
                  ol: ({children, node, ...props}: any) => (
                    <ol style={{
                      marginLeft: '1.5em',
                      marginTop: '0.6em',
                      marginBottom: '0.6em',
                      paddingLeft: '0.5em'
                    }} {...props}>{children}</ol>
                  ),
                  li: ({children, node, ...props}: any) => (
                    <li style={{
                      marginBottom: '0.4em',
                      lineHeight: '1.5'
                    }} {...props}>{children}</li>
                  ),
                  p: ({children, node, ...props}: any) => (
                    <p style={{
                      marginBottom: '0.8em',
                      lineHeight: '1.6'
                    }} {...props}>{children}</p>
                  ),
                  strong: ({children, node, ...props}: any) => (
                    <strong style={{ fontWeight: 'bold' }} {...props}>{children}</strong>
                  ),
                  blockquote: ({children, node, ...props}: any) => (
                    <blockquote style={{
                      borderLeft: '3px solid rgba(148, 163, 184, 0.6)',
                      paddingLeft: '1em',
                      marginLeft: '0',
                      marginTop: '0.8em',
                      marginBottom: '0.8em',
                      fontStyle: 'italic',
                      opacity: '0.9'
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