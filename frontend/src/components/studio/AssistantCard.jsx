// src/components/studio/AssistantCard.jsx
import React from "react";
import Card from "../common/Card";
import styles from "./AssistantCard.module.css";

const AssistantCard = ({
  name,
  description,
  spec,
  createdAt,
  onClick,
  onDelete,
}) => {
  const subtitle =
    description && description.trim().length > 0
      ? description
      : "No description";

  const footer = createdAt ? `Created ${createdAt}` : undefined;

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card onClick from firing
    if (onDelete && window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      onDelete();
    }
  };

  return (
    <div className={styles.cardWrapper}>
      <Card title={name} subtitle={subtitle} footer={footer} onClick={onClick}>
        {spec && (
          <div className={styles.spec}>
            <strong>Spec:</strong> {spec}
          </div>
        )}
      </Card>
      {onDelete && (
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          title="Delete assistant"
          aria-label="Delete assistant"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default AssistantCard;
