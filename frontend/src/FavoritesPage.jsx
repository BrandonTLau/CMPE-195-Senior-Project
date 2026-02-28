import React, { useState } from "react";

const FavoritesPage = ({ notes, onNoteSelect, onRemoveFavorite, onNewScan }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const favoriteNotes = notes.filter((n) => n.favorite);

  const filteredNotes = favoriteNotes.filter((n) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.preview.toLowerCase().includes(q) ||
      n.tags.join(" ").toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Favorites</h1>
            <p style={styles.subtitle}>Your saved and starred notes</p>
          </div>
          <button style={styles.newScanButton} onClick={onNewScan}>
            <svg style={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            New Scan
          </button>
        </div>

        {/* Search */}
        <div style={styles.controls}>
          <div style={styles.searchBox}>
            <svg style={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.countBadge}>
            ★ {favoriteNotes.length} favorited note{favoriteNotes.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Empty state */}
        {favoriteNotes.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>★</div>
            <h3 style={styles.emptyTitle}>No favorites yet</h3>
            <p style={styles.emptyText}>
              Open any note, tap the ⋮ menu, and choose "Add to Favorites" to see it here.
            </p>
          </div>
        )}

        {/* No search results */}
        {favoriteNotes.length > 0 && filteredNotes.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No favorites found for "{searchQuery}".</p>
          </div>
        )}

        {/* Notes Grid */}
        <div style={styles.notesGrid}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              style={styles.noteCard}
              onClick={() => onNoteSelect(note.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(99, 102, 241, 0.15)";
                e.currentTarget.style.borderColor = "#6366F1";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#FDE68A";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Star badge */}
              <div style={styles.starBadge}>★</div>

              <div style={styles.noteHeader}>
                <h3 style={styles.noteTitle}>{note.title}</h3>
                <button
                  style={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(note.id);
                  }}
                  title="Remove from favorites"
                  onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9CA3AF"}
                >
                  ✕
                </button>
              </div>

              <p style={styles.notePreview}>{note.preview}</p>

              <div style={styles.noteTags}>
                {note.tags.map((tag, idx) => (
                  <span key={idx} style={styles.tag}>{tag}</span>
                ))}
              </div>

              <div style={styles.noteFooter}>
                <div style={styles.noteDate}>
                  <svg style={styles.footerIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {note.date}
                </div>
                <div style={styles.confidence}>
                  <svg style={styles.footerIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {note.confidence}%
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { width: "100%" },
  wrapper: { width: "100%", maxWidth: "1400px", margin: "0 auto" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "2rem", flexWrap: "wrap", gap: "1rem",
  },
  title: { fontSize: "2.5rem", fontWeight: "700", color: "#1F2937", marginBottom: "0.5rem" },
  subtitle: { fontSize: "1rem", color: "#6B7280" },
  newScanButton: {
    padding: "0.875rem 1.75rem",
    background: "linear-gradient(to right, #6366F1, #8B5CF6)",
    color: "white", border: "none", borderRadius: "0.75rem",
    fontSize: "1rem", fontWeight: "600", cursor: "pointer",
    display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "inherit",
  },
  buttonIcon: { width: "20px", height: "20px" },
  controls: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "2rem", gap: "1rem", flexWrap: "wrap",
  },
  searchBox: { position: "relative", width: "700px", maxWidth: "100%" },
  searchIcon: {
    position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)",
    width: "20px", height: "20px", color: "#9CA3AF",
  },
  searchInput: {
    width: "100%", padding: "0.75rem 1rem 0.75rem 3rem",
    border: "1px solid #E5E7EB", borderRadius: "0.75rem",
    fontSize: "0.9375rem", outline: "none", backgroundColor: "white", fontFamily: "inherit",
  },
  countBadge: {
    padding: "0.5rem 1rem", backgroundColor: "#FEF9C3", color: "#92400E",
    borderRadius: "9999px", fontSize: "0.875rem", fontWeight: "600",
    border: "1px solid #FDE68A", whiteSpace: "nowrap",
  },
  emptyState: {
    textAlign: "center", padding: "4rem 2rem",
    backgroundColor: "white", borderRadius: "1rem",
    border: "1px solid #E5E7EB", marginTop: "1rem",
  },
  emptyIcon: { fontSize: "3rem", color: "#FCD34D", marginBottom: "1rem" },
  emptyTitle: { fontSize: "1.25rem", fontWeight: "600", color: "#1F2937", marginBottom: "0.5rem" },
  emptyText: { fontSize: "0.9375rem", color: "#6B7280" },
  notesGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem",
  },
  noteCard: {
    backgroundColor: "white", padding: "1.5rem", borderRadius: "1rem",
    border: "1px solid #FDE68A", cursor: "pointer", position: "relative",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
  },
  starBadge: {
    position: "absolute", top: "-0.6rem", right: "1rem",
    backgroundColor: "#FCD34D", color: "white",
    borderRadius: "9999px", width: "1.5rem", height: "1.5rem",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.75rem", fontWeight: "700", boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  noteHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem",
  },
  noteTitle: { fontSize: "1.125rem", fontWeight: "600", color: "#1F2937", flex: 1, margin: 0 },
  removeButton: {
    background: "none", border: "none", fontSize: "1rem",
    color: "#9CA3AF", cursor: "pointer", padding: "0.25rem",
    transition: "color 0.15s ease", fontFamily: "inherit",
  },
  notePreview: { fontSize: "0.875rem", color: "#6B7280", marginBottom: "1rem", lineHeight: "1.5" },
  noteTags: { display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" },
  tag: {
    padding: "0.25rem 0.75rem", backgroundColor: "#EEF2FF", color: "#6366F1",
    borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "500",
  },
  noteFooter: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: "1rem", borderTop: "1px solid #F3F4F6",
  },
  noteDate: { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "#6B7280" },
  confidence: { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "#10B981", fontWeight: "500" },
  footerIcon: { width: "14px", height: "14px" },
};

export default FavoritesPage;
