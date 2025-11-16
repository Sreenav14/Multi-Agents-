// src/components/studio/AssistantCard.tsx
import React from "react";
import Card from "../common/Card";
import styles from "./AssistantCard.module.css";

export type AssistantCardProps = {
  name: string;
  description?: string | null;
  spec?: string | null;
  createdAt?: string;
  onClick?: () => void;
};

const AssistantCard: React.FC<AssistantCardProps> = ({
  name,
  description,
  spec,
  createdAt,
  onClick,
}) => {
  const subtitle =
    description && description.trim().length > 0
      ? description
      : "No description";

  const footer = createdAt ? `Created ${createdAt}` : undefined;

  return (
    <Card title={name} subtitle={subtitle} footer={footer} onClick={onClick}>
      {spec && (
        <div className={styles.spec}>
          <strong>Spec:</strong> {spec}
        </div>
      )}
    </Card>
  );
};

export default AssistantCard;
