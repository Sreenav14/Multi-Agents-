import React from "react";
import styles from "./Card.module.css";

type CardProps = {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
};

const Card: React.FC<CardProps> = ({ title, subtitle, footer, onClick, children }) => {
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
