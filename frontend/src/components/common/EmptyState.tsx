import React from "react";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
      {action}
    </div>
  );
};

export default EmptyState;
