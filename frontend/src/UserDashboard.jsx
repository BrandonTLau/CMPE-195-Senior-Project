import React, { useState, useEffect } from "react";
import UploadPage from "./UploadPage";
import ProcessingScreen from "./ProcessingPage";
import ResultsPage from "./ResultsPage";
import NotesLibrary from "./NotesLibrary";
import FavoritesPage from "./FavoritesPage";

const INITIAL_NOTES = [
  { id: 1, title: "Introduction to Machine Learning", date: "Dec 6, 2025",
    preview: "Machine learning is a subset of artificial intelligence that focuses on...",
    tags: ["AI", "Computer Science"], confidence: 87, favorite: false },
  { id: 2, title: "Calculus Notes - Chapter 5", date: "Dec 5, 2025",
    preview: "Integration techniques and applications including u-substitution...",
    tags: ["Math", "Calculus"], confidence: 92, favorite: false },
  { id: 3, title: "History Lecture Notes", date: "Dec 3, 2025",
    preview: "World War II timeline and key events that shaped the modern world...",
    tags: ["History"], confidence: 85, favorite: false },
  { id: 4, title: "Chemistry Lab Report", date: "Dec 1, 2025",
    preview: "Experiment results and analysis of chemical reactions...",
    tags: ["Chemistry", "Lab"], confidence: 90, favorite: false },
  { id: 5, title: "Biology Study Guide", date: "Nov 29, 2025",
    preview: "Cell structure and function, including organelles and their roles...",
    tags: ["Biology", "Study Guide"], confidence: 88, favorite: false },
  { id: 6, title: "Physics Problem Set", date: "Nov 27, 2025",
    preview: "Mechanics and kinematics problems with detailed solutions...",
    tags: ["Physics"], confidence: 91, favorite: false },
];

const UserDashboard = ({
  onLogout,
  onProcess,
  onFinishProcessing,
  onNewScan,
  onNoteSelect,
  showUploadPage = false,
  showProcessingPage = false,
  showResultsPage = false,
  initialTab = null,
  onInitialTabConsumed,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || "dashboard");
  const [notes, setNotes] = useState(INITIAL_NOTES);

  // Jump to the requested tab (e.g. "notes" when coming back from ResultsPage)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (onInitialTabConsumed) onInitialTabConsumed();
    }
  }, [initialTab]);

  const handleToggleFavorite = (id) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, favorite: !n.favorite } : n))
    );
  };

  const handleDeleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

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

  useEffect(() => {
    if (showProcessingPage) { setActiveTab("processing"); return; }
    if (showResultsPage)    { setActiveTab("results");    return; }
    if (showUploadPage)     { setActiveTab("upload");     return; }
  }, [showUploadPage, showProcessingPage, showResultsPage]);

  const handleNewScan = () => {
    setActiveTab("upload");
    if (onNewScan) onNewScan();
  };

  return (
    <div style={styles.container}>
      <div style={styles.layout}>

        {/* ── Sidebar ── */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarContent}>

            <div style={styles.logo}>
              <div style={styles.logoIcon}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "24px", height: "24px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span style={styles.logoText}>NoteScan</span>
            </div>

            <nav style={styles.nav}>
              <button
                style={{ ...styles.navItem, ...(activeTab === "dashboard" ? styles.navItemActive : {}) }}
                onClick={() => setActiveTab("dashboard")}
              >
                <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>

              <button
                style={{ ...styles.navItem, ...(activeTab === "upload" ? styles.navItemActive : {}) }}
                onClick={handleNewScan}
              >
                <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                New Scan
              </button>

              <button
                style={{ ...styles.navItem, ...(activeTab === "notes" ? styles.navItemActive : {}) }}
                onClick={() => setActiveTab("notes")}
              >
                <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                My Notes
              </button>

              <button
                style={{ ...styles.navItem, ...(activeTab === "favorites" ? styles.navItemActive : {}) }}
                onClick={() => setActiveTab("favorites")}
              >
                <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Favorites
                {notes.filter((n) => n.favorite).length > 0 && (
                  <span style={styles.favBadge}>
                    {notes.filter((n) => n.favorite).length}
                  </span>
                )}
              </button>

              {activeTab === "processing" && (
                <button style={{ ...styles.navItem, ...styles.navItemActive }} disabled>
                  <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                  </svg>
                  Processing…
                </button>
              )}

              {activeTab === "results" && (
                <button style={{ ...styles.navItem, ...styles.navItemActive }} disabled>
                  <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Results
                </button>
              )}
            </nav>

            <div style={{ flexGrow: 1 }} />

            <button style={styles.logoutButton} onClick={onLogout}>
              <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={styles.main}>
          <div style={styles.wrapper}>

            {activeTab === "dashboard" && (
              <>
                <div style={styles.header}>
                  <div>
                    <h1 style={styles.title}>Welcome back!</h1>
                    <p style={styles.subtitle}>Transform your handwritten notes into searchable digital text</p>
                  </div>
                  <button style={styles.newScanButton} onClick={handleNewScan}>New Scan</button>
                </div>

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

                <div style={styles.actionCard}>
                  <h2 style={styles.actionTitle}>Ready to scan a new note?</h2>
                  <p style={styles.actionSubtitle}>Upload your handwritten notes and get instant digital transcription.</p>
                  <button style={styles.actionButton} onClick={handleNewScan}>Start New Scan →</button>
                </div>
              </>
            )}

            {activeTab === "upload" && (
              <UploadPage onProcess={() => { setActiveTab("processing"); if (onProcess) onProcess(); }} />
            )}

            {activeTab === "processing" && (
              <ProcessingScreen onAutoFinish={() => { setActiveTab("results"); if (onFinishProcessing) onFinishProcessing(); }} />
            )}

            {activeTab === "results" && (
              <ResultsPage onBack={() => setActiveTab("notes")} />
            )}

            {activeTab === "notes" && (
              <NotesLibrary
                notes={notes}
                onNewScan={handleNewScan}
                onNoteSelect={onNoteSelect}
                onToggleFavorite={handleToggleFavorite}
                onDeleteNote={handleDeleteNote}
              />
            )}

            {activeTab === "favorites" && (
              <FavoritesPage
                notes={notes}
                onNoteSelect={onNoteSelect}
                onRemoveFavorite={handleToggleFavorite}
                onNewScan={handleNewScan}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#E8EEF5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  layout: { display: "flex", height: "100vh", width: "100%", overflow: "hidden" },
  sidebar: {
    width: "260px",
    background: "linear-gradient(to bottom, #6366F1, #8B5CF6)",
    padding: "1.5rem", display: "flex", flexDirection: "column",
    color: "white", flexShrink: 0,
  },
  sidebarContent: { display: "flex", flexDirection: "column", height: "100%" },
  logo: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" },
  logoIcon: {
    width: "36px", height: "36px", background: "rgba(255,255,255,0.2)",
    borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: "1.25rem", fontWeight: "700" },
  nav: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  navItem: {
    padding: "0.75rem 1rem", background: "transparent", border: "none",
    borderRadius: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem",
    color: "white", cursor: "pointer", fontSize: "0.95rem", transition: "0.2s",
  },
  navItemActive: { background: "rgba(255,255,255,0.25)" },
  navIcon: { width: "20px", height: "20px", flexShrink: 0 },
  favBadge: {
    marginLeft: "auto", backgroundColor: "#FCD34D", color: "#78350F",
    borderRadius: "9999px", fontSize: "0.7rem", fontWeight: "700",
    padding: "0.1rem 0.5rem", minWidth: "1.25rem", textAlign: "center",
  },
  logoutButton: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "0.75rem 1rem", backgroundColor: "rgba(255,255,255,0.1)",
    border: "none", borderRadius: "0.75rem", color: "white",
    cursor: "pointer", fontSize: "0.95rem", marginBottom: "1rem",
  },
  main: { flex: 1, overflowY: "auto", height: "100vh", padding: "2rem 3rem", boxSizing: "border-box" },
  wrapper: { width: "100%", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  title: { fontSize: "2.5rem", fontWeight: "700" },
  subtitle: { fontSize: "1rem", color: "#6B7280" },
  newScanButton: {
    background: "linear-gradient(to right, #6366F1, #8B5CF6)",
    padding: "0.875rem 1.5rem", borderRadius: "0.75rem",
    border: "none", color: "white", cursor: "pointer",
  },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.5rem", marginBottom: "1.5rem",
  },
  statCard: { padding: "1.75rem", borderRadius: "1.25rem", border: "1px solid #ccc" },
  statCardTeal: { background: "linear-gradient(to bottom right, #EEF2FF, #E0E7FF)" },
  statCardBlue: { background: "linear-gradient(to bottom right, #EFF6FF, #DBEAFE)" },
  statCardPurple: { background: "linear-gradient(to bottom right, #FAF5FF, #F3E8FF)" },
  statLabel: { fontSize: "0.9rem", fontWeight: "600", color: "#4F46E5" },
  statValue: { fontSize: "2.25rem", fontWeight: "700" },
  actionCard: {
    padding: "2.5rem", borderRadius: "1.5rem",
    background: "linear-gradient(to bottom right, #6366F1, #8B5CF6)", color: "white",
  },
  actionTitle: { fontSize: "2rem", fontWeight: "700" },
  actionSubtitle: { opacity: 0.9, marginBottom: "1.5rem", fontSize: "1rem", maxWidth: "600px" },
  actionButton: {
    padding: "1rem 2rem", borderRadius: "0.875rem", backgroundColor: "white",
    color: "#6366F1", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: "600",
  },
};

export default UserDashboard;
