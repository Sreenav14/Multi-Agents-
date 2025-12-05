// src/components/assistant/AgentNode.jsx
import React from "react";
import styles from "./AgentNode.module.css";

const AgentNode = ({ id, role, systemPrompt }) => {
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
