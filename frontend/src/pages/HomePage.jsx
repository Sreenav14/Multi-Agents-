import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.homeRoot}>
      <div className={styles.heroCard}>
        <p className={styles.badge}>Multi-Agent MVP</p>
        <h1>Multi-Agents Studio</h1>
        <p>
          Build, connect, and orchestrate agents with MCP servers, custom tools,
          and runtime variables. Start by exploring your dashboard or jump
          straight into the Studio workspace.
        </p>
        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => navigate("/studio")}
          >
            Open Studio
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
