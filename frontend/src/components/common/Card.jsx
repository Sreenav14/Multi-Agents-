import React from "react";
import styles from "./Card.module.css";

const Card = ({ title, subtitle, footer, onClick, children }) => {
  const className = onClick
    ? `${styles.card} ${styles.clickable}`
    : styles.card;

  return (
    <div className={className} onClick={onClick}>
      {title && <div className={styles.title}>{title}</div>}
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      {children}
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

export default Card;
