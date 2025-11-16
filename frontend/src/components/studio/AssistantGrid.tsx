import React from "react";
import AssistantCard, { type AssistantCardProps } from "./AssistantCard";
import styles from "./AssistantGrid.module.css";

type AssistantGridProps = {
  assistants: AssistantCardProps[];
};

const AssistantGrid: React.FC<AssistantGridProps> = ({ assistants }) => {
  return (
    <div className={styles.grid}>
      {assistants.map((assistant, idx) => (
        <AssistantCard key={idx} {...assistant} />
      ))}
    </div>
  );
};

export default AssistantGrid;
