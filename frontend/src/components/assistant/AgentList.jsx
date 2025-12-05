// src/components/assistant/AgentList.jsx
import React from "react";
import styles from "./AgentList.module.css";
import AgentNode from "./AgentNode";

const AgentList = ({ agents }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <div className={styles.title}>Agent graph</div>
        <div className={styles.subtitle}>
          {agents.length} node{agents.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className={styles.nodes}>
        {agents.map((agent) => (
          <AgentNode
            key={agent.id}
            id={agent.id}
            role={agent.role}
            systemPrompt={agent.systemPrompt}
          />
        ))}
      </div>
    </div>
  );
};

export default AgentList;
