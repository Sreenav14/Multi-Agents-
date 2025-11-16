// src/components/assistant/AgentNode.tsx
import React from "react";
import styles from "./AgentNode.module.css";

export type AgentNodeProps = {
  id: string;
  role: string;
  systemPrompt?: string;
};

const AgentNode: React.FC<AgentNodeProps> = ({ id, role, systemPrompt }) => {
  return (
    <div className={styles.node}>
      <div className={styles.roleRow}>
        <div className={styles.role}>{role}</div>
        <div className={styles.id}>{id}</div>
      </div>
      {systemPrompt && (
        <>
          <div className={styles.promptLabel}>System prompt</div>
          <div className={styles.prompt}>{systemPrompt}</div>
        </>
      )}
    </div>
  );
};

export default AgentNode;
