import React from "react";
import styles from "./EmptyState.module.css";

const EmptyState = ({
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
