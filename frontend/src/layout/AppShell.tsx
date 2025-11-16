// src/layout/AppShell.tsx
import React from "react";
import styles from "./AppShell.module.css";

type AppShellProps = {
  children: React.ReactNode;
};

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className={styles.appRoot}>
      {/* Left sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          Multi-Agents Studio
        </div>

        <nav className={styles.sidebarNav}>
          {/* For now these are just static; we'll wire them to Router later */}
          <div className={styles.navItem}>Studio</div>
          <div className={styles.navItem}>Runs (coming soon)</div>
        </nav>
      </aside>

      {/* Right side */}
      <div className={styles.mainArea}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            {/* Later we can show dynamic route title here */}
             Multi-Agent MVP
          </div>
          <div className={styles.envBadge}>Local</div>
        </header>

        {/* Page content */}
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
