import React, { useState, useEffect } from "react";
import UploadPage from "./UploadPage";

const UserDashboard = ({ onLogout, onProcess, onNewScan, showUploadPage }) => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Auto-open Upload tab when coming from App.jsx
  useEffect(() => {
    if (showUploadPage) {
      setActiveTab("upload");
    }
  }, [showUploadPage]);

  // Remove body margins (your layout fix)
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    const prevBodyMargin = body.style.margin;
    const prevBodyPadding = body.style.padding;
    const prevHtmlMargin = html.style.margin;
    const prevHtmlPadding = html.style.padding;

    body.style.margin = "0";
    body.style.padding = "0";
    html.style.margin = "0";
    html.style.padding = "0";

    return () => {
      body.style.margin = prevBodyMargin;
      body.style.padding = prevBodyPadding;
      html.style.margin = prevHtmlMargin;
      html.style.padding = prevHtmlPadding;
    };
  }, []);

  const handleNewScanClick = () => {
    setActiveTab("upload");
    if (onNewScan) onNewScan();
  };

  return (
    <div style={styles.container}>
      <div style={styles.layout}>
        
        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarContent}>

            {/* Logo */}
            <div style={styles.logo}>
              <div style={styles.logoIcon}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "24px", height: "24px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span style={styles.logoText}>NoteScan</span>
            </div>

            {/* NAVIGATION */}
            <nav style={styles.nav}>
              <button
                style={{ ...styles.navItem, ...(activeTab === "dashboard" ? styles.navItemActive : {}) }}
                onClick={() => setActiveTab("dashboard")}
              >
                Dashboard
              </button>

              <button
                style={{ ...styles.navItem, ...(activeTab === "upload" ? styles.navItemActive : {}) }}
                onClick={handleNewScanClick}
              >
                New Scan
              </button>

              <button
                style={{ ...styles.navItem, ...(activeTab === "notes" ? styles.navItemActive : {}) }}
                onClick={() => setActiveTab("notes")}
              >
                My Notes
              </button>

              <button
                style={{ ...styles.navItem, ...(activeTab === "favorites" ? styles.navItemActive : {}) }}
                onClick={() => setActiveTab("favorites")}
              >
                Favorites
              </button>
            </nav>

            <div style={{ flexGrow: 1 }} />

            {/* LOGOUT */}
            <button style={styles.logoutButton} onClick={onLogout}>
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={styles.main}>
          <div style={styles.wrapper}>

            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <>
                <div style={styles.header}>
                  <div>
                    <h1 style={styles.title}>Welcome back!</h1>
                    <p style={styles.subtitle}>Transform your handwritten notes into searchable text</p>
                  </div>

                  <button style={styles.newScanButton} onClick={handleNewScanClick}>
                    New Scan
                  </button>
                </div>

                {/* STATS GRID */}
                <div style={styles.statsGrid}>
                  <div style={{ ...styles.statCard, ...styles.statCardTeal }}>
                    <div style={styles.statLabel}>Total Scans</div>
                    <div style={styles.statValue}>127</div>
                  </div>

                  <div style={{ ...styles.statCard, ...styles.statCardBlue }}>
                    <div style={styles.statLabel}>Accuracy</div>
                    <div style={styles.statValue}>92%</div>
                  </div>

                  <div style={{ ...styles.statCard, ...styles.statCardPurple }}>
                    <div style={styles.statLabel}>Storage</div>
                    <div style={styles.statValue}>2.4 GB</div>
                  </div>
                </div>

                {/* CALL TO ACTION */}
                <div style={styles.actionCard}>
                  <h2 style={styles.actionTitle}>Ready to scan a new note?</h2>
                  <p style={styles.actionSubtitle}>
                    Upload your handwritten notes and get instant digital transcription with AI-powered accuracy.
                  </p>
                  <button style={styles.actionButton} onClick={handleNewScanClick}>
                    Start New Scan →
                  </button>
                </div>
              </>
            )}

            {/* UPLOAD TAB */}
            {activeTab === "upload" && (
              <UploadPage onProcess={onProcess} />
            )}

            {activeTab === "notes" && <h2>My Notes (Coming Soon)</h2>}
            {activeTab === "favorites" && <h2>Favorites (Coming Soon)</h2>}

          </div>
        </main>
      </div>
    </div>
  );
};


/* FULL STYLES (unchanged from your version) */
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#E8EEF5",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  layout: {
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
  },

  sidebar: {
    width: "260px",
    background: "linear-gradient(to bottom, #6366F1, #8B5CF6)",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    color: "white",
    flexShrink: 0,
  },

  sidebarContent: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.5rem",
  },

  logoIcon: {
    width: "36px",
    height: "36px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    fontSize: "1.25rem",
    fontWeight: "700",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },

  navItem: {
    padding: "0.75rem 1rem",
    background: "transparent",
    border: "none",
    borderRadius: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    color: "white",
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "0.2s",
  },

  navItemActive: {
    background: "rgba(255,255,255,0.25)",
  },

  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    backgroundColor: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: "0.75rem",
    color: "white",
    cursor: "pointer",
    fontSize: "0.95rem",
    marginBottom: "1rem",
  },

  main: {
    flex: 1,
    overflowY: "auto",
    height: "100vh",
    padding: "2rem 3rem",
    boxSizing: "border-box",
  },

  wrapper: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
  },

  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
  },

  subtitle: {
    fontSize: "1rem",
    color: "#6B7280",
  },

  newScanButton: {
    background: "linear-gradient(to right, #6366F1, #8B5CF6)",
    padding: "0.875rem 1.5rem",
    borderRadius: "0.75rem",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },

  statCard: {
    padding: "1.75rem",
    borderRadius: "1.25rem",
    border: "1px solid #ccc",
  },

  statCardTeal: {
    background: "linear-gradient(to bottom right, #EEF2FF, #E0E7FF)",
  },

  statCardBlue: {
    background: "linear-gradient(to bottom right, #EFF6FF, #DBEAFE)",
  },

  statCardPurple: {
    background: "linear-gradient(to bottom right, #FAF5FF, #F3E8FF)",
  },

  statLabel: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#4F46E5",
  },

  statValue: {
    fontSize: "2.25rem",
    fontWeight: "700",
  },

  actionCard: {
    padding: "2.5rem",
    borderRadius: "1.5rem",
    background: "linear-gradient(to bottom right, #6366F1, #8B5CF6)",
    color: "white",
  },

  actionTitle: {
    fontSize: "2rem",
    fontWeight: "700",
  },

  actionSubtitle: {
    opacity: 0.9,
    marginBottom: "1.5rem",
    fontSize: "1rem",
    maxWidth: "600px",
  },

  actionButton: {
    padding: "1rem 2rem",
    borderRadius: "0.875rem",
    backgroundColor: "white",
    color: "#6366F1",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
};

export default UserDashboard;
