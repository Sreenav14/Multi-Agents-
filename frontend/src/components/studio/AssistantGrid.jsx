import React from "react";
import AssistantCard from "./AssistantCard";
import styles from "./AssistantGrid.module.css";

const AssistantGrid = ({ assistants }) => {
  return (
    <div className={styles.grid}>
      {assistants.map((assistant, idx) => (
        <AssistantCard key={idx} {...assistant} />
      ))}
    </div>
  );
};

export default AssistantGrid;
