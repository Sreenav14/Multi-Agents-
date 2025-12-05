// src/layout/AppShell.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./AppShell.module.css";

const AppShell = ({ children }) => {
  return (
    <div className={styles.appRoot}>
      {/* Left sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Multi-Agents Studio</div>

        <nav className={styles.sidebarNav}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? styles.navItemActive : styles.navItem
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? styles.navItemActive : styles.navItem
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/studio"
            className={({ isActive }) =>
              isActive ? styles.navItemActive : styles.navItem
            }
          >
            Studio
          </NavLink>
          <div className={styles.navItemDisabled}>Runs (coming soon)</div>
        </nav>
      </aside>

      {/* Right side */}
      <div className={styles.mainArea}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>Multi-Agent MVP</div>
          <div className={styles.envBadge}>Local</div>
        </header>

        {/* Page content */}
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
