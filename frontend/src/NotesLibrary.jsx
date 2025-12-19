import React, { useMemo, useState } from "react";

const NotesLibrary = ({ onNewScan }) => {
  const [notes] = useState([
    {
      id: 1,
      title: "Introduction to Machine Learning",
      date: "Dec 6, 2025",
      preview:
        "Machine learning is a subset of artificial intelligence that focuses on...",
      tags: ["AI", "Computer Science"],
      confidence: 87,
    },
    {
      id: 2,
      title: "Calculus Notes - Chapter 5",
      date: "Dec 5, 2025",
      preview:
        "Integration techniques and applications including u-substitution...",
      tags: ["Math", "Calculus"],
      confidence: 92,
    },
    {
      id: 3,
      title: "History Lecture Notes",
      date: "Dec 3, 2025",
      preview:
        "World War II timeline and key events that shaped the modern world...",
      tags: ["History"],
      confidence: 85,
    },
    {
      id: 4,
      title: "Chemistry Lab Report",
      date: "Dec 1, 2025",
      preview: "Experiment results and analysis of chemical reactions...",
      tags: ["Chemistry", "Lab"],
      confidence: 90,
    },
    {
      id: 5,
      title: "Biology Study Guide",
      date: "Nov 29, 2025",
      preview:
        "Cell structure and function, including organelles and their roles...",
      tags: ["Biology", "Study Guide"],
      confidence: 88,
    },
    {
      id: 6,
      title: "Physics Problem Set",
      date: "Nov 27, 2025",
      preview:
        "Mechanics and kinematics problems with detailed solutions...",
      tags: ["Physics"],
      confidence: 91,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filteredNotes = useMemo(() => {
    let arr = [...notes];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      arr = arr.filter((n) => {
        const inTitle = n.title.toLowerCase().includes(q);
        const inPreview = n.preview.toLowerCase().includes(q);
        const inTags = n.tags.join(" ").toLowerCase().includes(q);
        return inTitle || inPreview || inTags;
      });
    }

    if (selectedFilter === "Recent") {
      arr = arr.slice(0, 3); // simplest "recent" based on array order
    } else if (selectedFilter === "Oldest") {
      arr = arr.slice().reverse();
    }

    return arr;
  }, [notes, searchQuery, selectedFilter]);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Notes</h1>
            <p style={styles.subtitle}>View and manage all your scanned notes</p>
          </div>

          <button style={styles.newScanButton} onClick={onNewScan}>
            <svg
              style={styles.buttonIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            New Scan
          </button>
        </div>

        {/* Search and Filters */}
        <div style={styles.controls}>
          <div style={styles.searchBox}>
            <svg
              style={styles.searchIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterButtons}>
            <button
              style={
                selectedFilter === "All"
                  ? { ...styles.filterButton, ...styles.filterButtonActive }
                  : styles.filterButton
              }
              onClick={() => setSelectedFilter("All")}
            >
              All Notes
            </button>

            <button
              style={
                selectedFilter === "Recent"
                  ? { ...styles.filterButton, ...styles.filterButtonActive }
                  : styles.filterButton
              }
              onClick={() => setSelectedFilter("Recent")}
            >
              Recent
            </button>

            <button
              style={
                selectedFilter === "Oldest"
                  ? { ...styles.filterButton, ...styles.filterButtonActive }
                  : styles.filterButton
              }
              onClick={() => setSelectedFilter("Oldest")}
            >
              Oldest
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        <div style={styles.notesGrid}>
          {filteredNotes.map((note) => (
            <div key={note.id} style={styles.noteCard}>
              <div style={styles.noteHeader}>
                <h3 style={styles.noteTitle}>{note.title}</h3>
                <button style={styles.noteMenuButton}>⋮</button>
              </div>

              <p style={styles.notePreview}>{note.preview}</p>

              <div style={styles.noteTags}>
                {note.tags.map((tag, idx) => (
                  <span key={idx} style={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div style={styles.noteFooter}>
                <div style={styles.noteDate}>
                  <svg
                    style={styles.footerIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {note.date}
                </div>

                <div style={styles.confidence}>
                  <svg
                    style={styles.footerIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {note.confidence}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div style={styles.emptyState}>
            No notes found{searchQuery ? ` for “${searchQuery}”` : ""}.
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
  },
  wrapper: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#6B7280",
  },
  newScanButton: {
    padding: "0.875rem 1.75rem",
    background: "linear-gradient(to right, #6366F1, #8B5CF6)",
    color: "white",
    border: "none",
    borderRadius: "0.75rem",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontFamily: "inherit",
  },
  buttonIcon: {
    width: "20px",
    height: "20px",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  searchBox: {
  position: "relative",
  width: "700px",     
  maxWidth: "100%",
},

  searchIcon: {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    width: "20px",
    height: "20px",
    color: "#9CA3AF",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 3rem",
    border: "1px solid #E5E7EB",
    borderRadius: "0.75rem",
    fontSize: "0.9375rem",
    outline: "none",
    backgroundColor: "white",
    fontFamily: "inherit",
  },
  filterButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  filterButton: {
    padding: "0.75rem 1.25rem",
    border: "1px solid #E5E7EB",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    backgroundColor: "white",
    color: "#6B7280",
    fontFamily: "inherit",
  },
  filterButtonActive: {
    backgroundColor: "#6366F1",
    color: "white",
    borderColor: "#6366F1",
  },
  notesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
  },
  noteCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "1rem",
    border: "1px solid #E5E7EB",
  },
  noteHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.75rem",
  },
  noteTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    margin: 0,
  },
  noteMenuButton: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    color: "#9CA3AF",
    cursor: "pointer",
    padding: "0.25rem",
  },
  notePreview: {
    fontSize: "0.875rem",
    color: "#6B7280",
    marginBottom: "1rem",
    lineHeight: "1.5",
  },
  noteTags: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  tag: {
    padding: "0.25rem 0.75rem",
    backgroundColor: "#EEF2FF",
    color: "#6366F1",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "500",
  },
  noteFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "1rem",
    borderTop: "1px solid #F3F4F6",
  },
  noteDate: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontSize: "0.8125rem",
    color: "#6B7280",
  },
  confidence: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontSize: "0.8125rem",
    color: "#10B981",
    fontWeight: "500",
  },
  footerIcon: {
    width: "14px",
    height: "14px",
  },
  emptyState: {
    marginTop: "2rem",
    padding: "1rem",
    borderRadius: "0.75rem",
    backgroundColor: "white",
    border: "1px solid #E5E7EB",
    color: "#6B7280",
  },
};

export default NotesLibrary;
