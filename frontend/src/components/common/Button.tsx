import React from "react";
import styles from "./Button.module.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({ children, ...rest }) => {
  return (
    <button className={styles.button} {...rest}>
      {children}
    </button>
  );
};

export default Button;
