// src/components/assistant/AssistantHeader.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AssistantHeader.module.css";

const AssistantHeader = ({
  name,
  description,
  spec,
}) => {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <button className={styles.backButton} onClick={() => navigate("/")}>
        ← Back
      </button>
      <div className={styles.nameRow}>
        <div className={styles.name}>{name}</div>
        <div className={styles.badge}>Assistant</div>
      </div>

      {description && description.trim().length > 0 && (
        <div className={styles.description}>{description}</div>
      )}

      {spec && spec.trim().length > 0 && (
        <>
          <div className={styles.specLabel}>Spec</div>
          <div className={styles.spec}>{spec}</div>
        </>
      )}
    </div>
  );
};

export default AssistantHeader;
