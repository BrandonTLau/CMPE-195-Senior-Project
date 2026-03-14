import React, { useState, useEffect, useRef } from "react";
import UploadPage from "./UploadPage";
import ProcessingScreen from "./ProcessingPage";
import ResultsPage from "./ResultsPage";
import FavoritesPage from "./FavoritesPage";

// ── Initial data ──────────────────────────────────────────────────────────────
const INITIAL_NOTES = [
  { id: 1, title: "Introduction to Machine Learning", date: "Dec 6, 2025", folderId: null,
    preview: "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data...",
    tags: ["AI", "Computer Science"], confidence: 87, favorite: false, deleted: false },
  { id: 2, title: "Calculus Notes - Chapter 5", date: "Dec 5, 2025", folderId: "f1",
    preview: "Integration techniques and applications including u-substitution and integration by parts...",
    tags: ["Math", "Calculus"], confidence: 92, favorite: false, deleted: false },
  { id: 3, title: "History Lecture Notes", date: "Dec 3, 2025", folderId: null,
    preview: "World War II timeline and key events that shaped the modern world and geopolitical landscape...",
    tags: ["History"], confidence: 85, favorite: false, deleted: false },
  { id: 4, title: "Chemistry Lab Report", date: "Dec 1, 2025", folderId: "f3",
    preview: "Experiment results and analysis of chemical reactions observed during the titration experiment...",
    tags: ["Chemistry", "Lab"], confidence: 90, favorite: false, deleted: false },
  { id: 5, title: "Biology Study Guide", date: "Nov 29, 2025", folderId: "f2",
    preview: "Cell structure and function, including organelles and their roles in cellular metabolism...",
    tags: ["Biology", "Study Guide"], confidence: 88, favorite: false, deleted: false },
  { id: 6, title: "Physics Problem Set", date: "Nov 27, 2025", folderId: "f2",
    preview: "Mechanics and kinematics problems with detailed solutions using Newton's laws of motion...",
    tags: ["Physics"], confidence: 91, favorite: false, deleted: false },
];

const INITIAL_FOLDERS = [
  { id: "f1", name: "Math" },
  { id: "f2", name: "Science" },
  { id: "f3", name: "Chemistry" },
  { id: "f4", name: "Humanities" },
];

const TAG_COLORS = [
  { bg: "#EDE9FE", text: "#6D28D9" }, { bg: "#DBEAFE", text: "#1D4ED8" },
  { bg: "#D1FAE5", text: "#065F46" }, { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#FCE7F3", text: "#9D174D" },
];
const tagColor = (tag) => TAG_COLORS[tag.charCodeAt(0) % TAG_COLORS.length];


const DragContext = React.createContext(null);


const NoteIcon = ({ size = 18, color = "#6366F1" }) => (
  <svg fill="none" stroke={color} viewBox="0 0 24 24" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ConfidencePill = ({ score }) => {
  const color = score >= 90 ? { bg: "#D1FAE5", text: "#065F46" }
              : score >= 80 ? { bg: "#FEF3C7", text: "#92400E" }
              : { bg: "#FEE2E2", text: "#991B1B" };
  return (
    <span style={{ fontSize: "0.7rem", fontWeight: "700", padding: "0.2rem 0.55rem",
      borderRadius: "999px", backgroundColor: color.bg, color: color.text, whiteSpace: "nowrap" }}>
      {score}%
    </span>
  );
};

// ── New folder modal ──────────────────────────────────────────────────────────
const NewFolderModal = ({ onSave, onClose }) => {
  const [name, setName] = useState("");
  return (
    <div style={mo.overlay}>
      <div style={mo.box}>
        <h3 style={mo.title}>New Folder</h3>
        <label style={mo.label}>Folder name</label>
        <input style={mo.input} value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Math, Science…" autoFocus
          onKeyDown={e => e.key === "Enter" && name.trim() && onSave(name.trim())} />
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button style={mo.cancel} onClick={onClose}>Cancel</button>
          <button style={{ ...mo.save, opacity: name.trim() ? 1 : 0.5 }}
            onClick={() => name.trim() && onSave(name.trim())}>
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
};

const mo = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 1000 },
  box: { background: "#fff", borderRadius: "1rem", padding: "1.5rem", width: "360px",
    maxWidth: "90vw", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" },
  title: { fontSize: "1rem", fontWeight: "700", margin: "0 0 1rem", color: "#111827" },
  label: { display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#374151", margin: "0 0 0.35rem" },
  input: { width: "100%", padding: "0.55rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #D1D5DB",
    fontSize: "0.88rem", boxSizing: "border-box", marginBottom: "0.85rem", outline: "none" },
  cancel: { flex: 1, padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB",
    background: "#F9FAFB", cursor: "pointer", fontSize: "0.85rem", color: "#6B7280" },
  save: { flex: 1, padding: "0.6rem", borderRadius: "0.5rem", border: "none",
    background: "linear-gradient(to right,#6366F1,#8B5CF6)", color: "#fff",
    cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },
};


const DropToast = ({ message, visible }) => (
  <div style={{
    position: "fixed", bottom: "1.5rem", left: "50%", transform: `translateX(-50%) translateY(${visible ? "0" : "80px"})`,
    background: "linear-gradient(to right, #6366F1, #8B5CF6)",
    color: "white", padding: "0.65rem 1.25rem", borderRadius: "2rem",
    fontSize: "0.82rem", fontWeight: "600", boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
    transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s",
    opacity: visible ? 1 : 0, zIndex: 2000, pointerEvents: "none",
    display: "flex", alignItems: "center", gap: "0.5rem",
  }}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
    {message}
  </div>
);

// ── Folders strip (collapsible) ───────────────────────────────────────────────
const FoldersStrip = ({ folders, notes, selectedFolderId, onSelect, onAdd, onDelete, onRename, onDropNote, search = "" }) => {
  const [expanded, setExpanded] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null); 
  const { draggingNoteId } = React.useContext(DragContext);

  const allRootFolders = folders;
  const rootFolders = search.trim()
    ? allRootFolders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : allRootFolders;

  const getFolderNoteCount = (folderId) =>
    notes.filter(n => n.folderId === folderId).length;

  const handleDragOver = (e, targetId) => {
    if (!draggingNoteId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(targetId);
  };

  const handleDragLeave = () => setDragOverId(undefined);

  const handleDrop = (e, targetFolderId) => {
    e.preventDefault();
    const noteId = parseInt(e.dataTransfer.getData("noteId"), 10);
    if (noteId) onDropNote(noteId, targetFolderId);
    setDragOverId(undefined);
  };

  const isOver = (id) => draggingNoteId && dragOverId === id;

  return (
    <div style={fs.wrap}>
      <button style={fs.header} onClick={() => setExpanded(e => !e)}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ width: "14px", height: "14px", transition: "transform 0.2s",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
        <span style={fs.headerLabel}>Folders</span>
        <span style={fs.folderCount}>{allRootFolders.length}</span>
        <div style={{ flex: 1 }} />
        <button style={fs.addBtn}
          onClick={e => { e.stopPropagation(); onAdd(); }}
          title="New folder">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "13px", height: "13px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Folder
        </button>
      </button>

      {expanded && (
        <div style={fs.strip}>
          
          <button
            style={{
              ...fs.card,
              ...(selectedFolderId === null ? fs.cardSelected : {}),
              ...(isOver(null) ? fs.cardDropOver : {}),
            }}
            onClick={() => onSelect(null)}
            onDragOver={e => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, null)}>
            <div style={{ ...fs.cardIcon, backgroundColor: selectedFolderId === null && !isOver(null) ? "#6366F1" : isOver(null) ? "#10B981" : "#E5E7EB" }}>
              {isOver(null) ? (
                <svg fill="none" stroke="white" viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              ) : (
                <svg fill="none" stroke={selectedFolderId === null ? "white" : "#6B7280"} viewBox="0 0 24 24"
                  style={{ width: "18px", height: "18px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              )}
            </div>
            <span style={fs.cardName}>{isOver(null) ? "Remove folder" : "All Notes"}</span>
            <span style={fs.cardCount}>{notes.length}</span>
          </button>

          {/* Folder cards */}
          {rootFolders.map(folder => {
            const isSelected = selectedFolderId === folder.id;
            const isHovered  = hoveredId === folder.id;
            const isDragOver = isOver(folder.id);
            const count      = getFolderNoteCount(folder.id);

            return (
              <div key={folder.id} style={{ position: "relative" }}
                onMouseEnter={() => setHoveredId(folder.id)}
                onMouseLeave={() => setHoveredId(null)}>
                {renamingId === folder.id ? (
                  <div style={{ ...fs.card, padding: "0.5rem 0.65rem" }}>
                    <input autoFocus value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && renameVal.trim()) { onRename(folder.id, renameVal.trim()); setRenamingId(null); }
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onBlur={() => setRenamingId(null)}
                      style={{ width: "100%", border: "1.5px solid #6366F1", borderRadius: "0.4rem",
                        padding: "0.3rem 0.5rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ) : (
                  <button
                    style={{
                      ...fs.card,
                      ...(isSelected ? fs.cardSelected : {}),
                      ...(isDragOver ? fs.cardDropOver : {}),
                    }}
                    onClick={() => onSelect(folder.id)}
                    onDragOver={e => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, folder.id)}>
                    <div style={{
                      ...fs.cardIcon,
                      backgroundColor: isDragOver ? "#10B981" : isSelected ? "#6366F1" : "#EEF2FF",
                    }}>
                      {isDragOver ? (
                        <svg fill="none" stroke="white" viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      ) : (
                        <svg fill="none" stroke={isSelected ? "white" : "#6366F1"} viewBox="0 0 24 24"
                          style={{ width: "18px", height: "18px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={{
                        ...fs.cardName,
                        color: isDragOver ? "#111827" : (search.trim() && folder.name.toLowerCase().includes(search.toLowerCase()) ? "#4F46E5" : "#111827"),
                      }}>{isDragOver ? `Move to ${folder.name}` : folder.name}</div>
                    </div>
                    <span style={fs.cardCount}>{count}</span>
                  </button>
                )}

                {isHovered && renamingId !== folder.id && !isDragOver && (
                  <div style={fs.hoverActions}>
                    <button style={fs.hoverBtn} title="Rename"
                      onClick={e => { e.stopPropagation(); setRenamingId(folder.id); setRenameVal(folder.name); }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "11px", height: "11px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414A2 2 0 019 13z" />
                      </svg>
                    </button>
                    <button style={{ ...fs.hoverBtn, color: "#EF4444" }} title="Delete"
                      onClick={e => { e.stopPropagation(); onDelete(folder.id); }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "11px", height: "11px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {rootFolders.length === 0 && (
            <p style={fs.empty}>
              {search.trim() ? `No folders match "${search}"` : "No folders yet — click New Folder to create one."}
            </p>
          )}
        </div>
      )}

      {/* Drag hint */}
      {draggingNoteId && (
        <div style={fs.dragHint}>
          <svg fill="none" stroke="#6366F1" viewBox="0 0 24 24" style={{ width: "12px", height: "12px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Drop onto a folder to move the note
        </div>
      )}

      <div style={fs.divider} />
    </div>
  );
};

const fs = {
  wrap: { marginBottom: "0.5rem" },
  header: { display: "flex", alignItems: "center", gap: "0.5rem", width: "100%",
    background: "none", border: "none", cursor: "pointer", padding: "0.4rem 0",
    marginBottom: "0.65rem" },
  headerLabel: { fontSize: "0.8rem", fontWeight: "700", color: "#374151",
    textTransform: "uppercase", letterSpacing: "0.05em" },
  folderCount: { fontSize: "0.68rem", fontWeight: "700", backgroundColor: "#E5E7EB",
    color: "#6B7280", borderRadius: "999px", padding: "0.05rem 0.45rem" },
  addBtn: { display: "flex", alignItems: "center", gap: "0.3rem",
    background: "none", border: "1px solid #E5E7EB", borderRadius: "0.45rem",
    color: "#6366F1", cursor: "pointer", padding: "0.3rem 0.65rem",
    fontSize: "0.75rem", fontWeight: "600" },
  strip: { display: "flex", gap: "0.65rem", flexWrap: "wrap", marginBottom: "1rem" },
  card: { display: "flex", alignItems: "center", gap: "0.6rem",
    padding: "0.65rem 0.85rem", borderRadius: "0.75rem",
    border: "1.5px solid #E5E7EB", backgroundColor: "#fff",
    cursor: "pointer", minWidth: "140px", maxWidth: "200px",
    transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  cardSelected: { borderColor: "#6366F1", backgroundColor: "#EEF2FF",
    boxShadow: "0 2px 8px rgba(99,102,241,0.15)" },
  cardDropOver: {
    borderColor: "#10B981", backgroundColor: "#ECFDF5",
    boxShadow: "0 0 0 3px rgba(16,185,129,0.2), 0 4px 12px rgba(16,185,129,0.15)",
    transform: "scale(1.04)",
  },
  cardIcon: { width: "34px", height: "34px", borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    transition: "background-color 0.15s" },
  cardName: { fontSize: "0.85rem", fontWeight: "700", color: "#111827",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cardCount: { fontSize: "0.68rem", fontWeight: "700", backgroundColor: "#F3F4F6",
    color: "#6B7280", borderRadius: "999px", padding: "0.1rem 0.45rem", flexShrink: 0 },
  hoverActions: { position: "absolute", top: "0.35rem", right: "0.35rem",
    display: "flex", gap: "0.2rem", background: "rgba(255,255,255,0.9)",
    borderRadius: "0.35rem", padding: "0.15rem" },
  hoverBtn: { background: "none", border: "none", cursor: "pointer",
    color: "#6B7280", padding: "0.15rem", display: "flex", alignItems: "center",
    borderRadius: "0.25rem" },
  empty: { fontSize: "0.8rem", color: "#9CA3AF", margin: "0.25rem 0 0.75rem",
    fontStyle: "italic" },
  divider: { height: "1px", backgroundColor: "#F3F4F6", marginBottom: "1.25rem" },
  dragHint: { display: "flex", alignItems: "center", gap: "0.35rem",
    fontSize: "0.72rem", color: "#6366F1", fontWeight: "500",
    backgroundColor: "#EEF2FF", border: "1px dashed #C7D2FE",
    borderRadius: "0.5rem", padding: "0.35rem 0.75rem",
    marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" },
};

// ── Grid card ─────────────────────────────────────────────────────────────────
const GridCard = ({ note, folders, onOpen, onToggleFavorite, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const { draggingNoteId, setDraggingNoteId } = React.useContext(DragContext);
  const isDragging = draggingNoteId === note.id;
  const folder = folders.find(f => f.id === note.folderId);

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData("noteId", note.id);
        e.dataTransfer.effectAllowed = "move";
        setDraggingNoteId(note.id);
      }}
      onDragEnd={() => setDraggingNoteId(null)}
      style={{
        ...gc.card,
        boxShadow: isDragging
          ? "0 16px 40px rgba(99,102,241,0.3)"
          : hovered
          ? "0 4px 20px rgba(99,102,241,0.13)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        opacity: isDragging ? 0.55 : 1,
        transform: isDragging ? "rotate(2deg) scale(1.03)" : "none",
        cursor: isDragging ? "grabbing" : "grab",
        transition: "box-shadow 0.2s, opacity 0.15s, transform 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div style={gc.top}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={gc.iconWrap}><NoteIcon size={16} /></div>
          {folder && <span style={gc.folderChip}>{folder.name}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <ConfidencePill score={note.confidence} />
          <button style={{ ...gc.iconBtn, color: note.favorite ? "#F59E0B" : "#D1D5DB" }}
            onClick={() => onToggleFavorite && onToggleFavorite(note.id)} title="Toggle favorite">
            <svg fill={note.favorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button style={{ ...gc.iconBtn, color: "#D1D5DB" }}
            onClick={() => onDelete && onDelete(note.id)} title="Move to trash">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div>
        <h3 style={gc.title}>{note.title}</h3>
        <p style={gc.preview}>{note.preview}</p>
      </div>
      <div style={gc.footer}>
        <div style={gc.tags}>
          {note.tags.slice(0, 2).map(tag => {
            const c = tagColor(tag);
            return <span key={tag} style={{ ...gc.tag, backgroundColor: c.bg, color: c.text }}>{tag}</span>;
          })}
        </div>
        <span style={gc.date}>{note.date}</span>
      </div>
      <button style={gc.openBtn} onClick={() => onOpen && onOpen(note)}>Open →</button>

      
      {hovered && !isDragging && (
        <div style={gc.dragHandle}>
          <svg fill="none" stroke="#9CA3AF" viewBox="0 0 24 24" style={{ width: "12px", height: "12px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}
    </div>
  );
};

const gc = {
  card: { backgroundColor: "#fff", borderRadius: "1rem", padding: "1.1rem",
    border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", gap: "0.65rem",
    position: "relative", userSelect: "none" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  iconWrap: { width: "28px", height: "28px", backgroundColor: "#EEF2FF", borderRadius: "7px",
    display: "flex", alignItems: "center", justifyContent: "center" },
  folderChip: { fontSize: "0.65rem", fontWeight: "600", color: "#4F46E5",
    backgroundColor: "#EEF2FF", padding: "0.1rem 0.45rem", borderRadius: "999px" },
  title: { fontSize: "0.9rem", fontWeight: "700", color: "#111827", margin: "0 0 0.3rem", lineHeight: 1.35 },
  preview: { fontSize: "0.78rem", color: "#6B7280", margin: 0, lineHeight: 1.5,
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tags: { display: "flex", gap: "0.3rem", flexWrap: "wrap" },
  tag: { fontSize: "0.65rem", fontWeight: "600", padding: "0.15rem 0.45rem", borderRadius: "999px" },
  date: { fontSize: "0.7rem", color: "#9CA3AF", whiteSpace: "nowrap" },
  openBtn: { padding: "0.4rem 1rem", borderRadius: "0.5rem",
    background: "linear-gradient(to right, #6366F1, #8B5CF6)",
    border: "none", color: "white", cursor: "pointer", fontSize: "0.76rem", fontWeight: "600", alignSelf: "flex-end" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: "0.15rem",
    display: "flex", alignItems: "center", borderRadius: "0.3rem", transition: "color 0.15s" },
  dragHandle: { position: "absolute", top: "0.5rem", left: "50%", transform: "translateX(-50%)",
    backgroundColor: "#F3F4F6", borderRadius: "4px", padding: "0.15rem 0.4rem",
    display: "flex", alignItems: "center", pointerEvents: "none" },
};

// ── List row ──────────────────────────────────────────────────────────────────
const ListRow = ({ note, folders, onOpen, onToggleFavorite, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const { draggingNoteId, setDraggingNoteId } = React.useContext(DragContext);
  const isDragging = draggingNoteId === note.id;
  const folder = folders.find(f => f.id === note.folderId);

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData("noteId", note.id);
        e.dataTransfer.effectAllowed = "move";
        setDraggingNoteId(note.id);
      }}
      onDragEnd={() => setDraggingNoteId(null)}
      style={{
        ...lr.row,
        backgroundColor: hovered ? "#F9FAFB" : "#fff",
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? "scale(1.01)" : "none",
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isDragging ? "0 8px 24px rgba(99,102,241,0.2)" : "none",
        transition: "background-color 0.15s, opacity 0.15s, transform 0.15s, box-shadow 0.15s",
        userSelect: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {/* Drag grip */}
      <div style={{ ...lr.grip, opacity: hovered ? 1 : 0 }}>
        <svg fill="none" stroke="#9CA3AF" viewBox="0 0 24 24" style={{ width: "12px", height: "12px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      <div style={lr.iconWrap}><NoteIcon size={15} /></div>
      <div style={lr.info}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={lr.title}>{note.title}</span>
          {folder && <span style={lr.folderChip}>{folder.name}</span>}
        </div>
        <span style={lr.preview}>{note.preview}</span>
      </div>
      <div style={lr.tags}>
        {note.tags.slice(0, 2).map(tag => {
          const c = tagColor(tag);
          return <span key={tag} style={{ ...lr.tag, backgroundColor: c.bg, color: c.text }}>{tag}</span>;
        })}
      </div>
      <ConfidencePill score={note.confidence} />
      <span style={lr.date}>{note.date}</span>
      <button style={{ ...lr.iconBtn, color: note.favorite ? "#F59E0B" : "#D1D5DB" }}
        onClick={() => onToggleFavorite && onToggleFavorite(note.id)}>
        <svg fill={note.favorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
      <button style={{ ...lr.iconBtn, color: "#D1D5DB" }}
        onClick={() => onDelete && onDelete(note.id)}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      <button style={lr.openBtn} onClick={() => onOpen && onOpen(note)}>Open</button>
    </div>
  );
};

const lr = {
  row: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.8rem 1rem",
    borderRadius: "0.75rem", border: "1px solid #E5E7EB", position: "relative" },
  grip: { display: "flex", alignItems: "center", flexShrink: 0, transition: "opacity 0.15s" },
  iconWrap: { width: "28px", height: "28px", backgroundColor: "#EEF2FF", borderRadius: "7px",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  info: { flex: 1, display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: 0 },
  title: { fontSize: "0.86rem", fontWeight: "700", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  folderChip: { fontSize: "0.63rem", fontWeight: "600", color: "#4F46E5",
    backgroundColor: "#EEF2FF", padding: "0.08rem 0.4rem", borderRadius: "999px", whiteSpace: "nowrap", flexShrink: 0 },
  preview: { fontSize: "0.74rem", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  tags: { display: "flex", gap: "0.3rem", flexShrink: 0 },
  tag: { fontSize: "0.64rem", fontWeight: "600", padding: "0.12rem 0.4rem", borderRadius: "999px" },
  date: { fontSize: "0.72rem", color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0, width: "76px", textAlign: "right" },
  openBtn: { padding: "0.32rem 0.85rem", borderRadius: "0.45rem",
    background: "linear-gradient(to right, #6366F1, #8B5CF6)",
    border: "none", color: "white", cursor: "pointer", fontSize: "0.74rem", fontWeight: "600", flexShrink: 0 },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: "0.2rem",
    display: "flex", alignItems: "center", borderRadius: "0.3rem", transition: "color 0.15s", flexShrink: 0 },
};

// ── Notes home ────────────────────────────────────────────────────────────────
const NotesHome = ({ notes, folders, onNewScan, onNoteSelect, onToggleFavorite, onDelete,
  onAddFolder, onDeleteFolder, onRenameFolder, onMoveNote }) => {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("date");
  const [search, setSearch] = useState("");

  const visibleNotes = selectedFolderId === null
    ? notes
    : notes.filter(n => n.folderId === selectedFolderId);

  const filtered = visibleNotes.filter(n => {
    const q = search.toLowerCase();
    const folderName = folders.find(f => f.id === n.folderId)?.name || "";
    return (
      n.title.toLowerCase().includes(q) ||
      n.preview.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q)) ||
      folderName.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "alpha") return a.title.localeCompare(b.title);
    if (sortBy === "confidence") return b.confidence - a.confidence;
    return 0;
  });

  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const heading = selectedFolder ? selectedFolder.name : "My Notes";

  return (
    <>
      <div style={nh.header}>
        <div>
          <h1 style={nh.title}>{heading}</h1>
          <p style={nh.subtitle}>{sorted.length} note{sorted.length !== 1 ? "s" : ""}
            {notes[0] ? ` · last edited ${notes[0].date}` : ""}</p>
        </div>
        <button style={nh.newBtn} onClick={onNewScan}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Scan
        </button>
      </div>

      <div style={nh.searchWrap}>
        <svg fill="none" stroke="#9CA3AF" viewBox="0 0 24 24" style={{ width: "15px", height: "15px", flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input style={nh.searchInput} type="text"
          placeholder="Search notes and folders…"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button style={nh.clearBtn} onClick={() => setSearch("")}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "13px", height: "13px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>}
      </div>

      <FoldersStrip
        folders={folders} notes={notes}
        selectedFolderId={selectedFolderId}
        onSelect={setSelectedFolderId}
        onAdd={onAddFolder}
        onDelete={onDeleteFolder}
        onRename={onRenameFolder}
        onDropNote={onMoveNote}
        search={search}
      />

      <div style={nh.toolbar}>
        <div style={nh.sortGroup}>
          {[{ key: "date", label: "Recent" }, { key: "alpha", label: "A – Z" }, { key: "confidence", label: "Confidence" }].map(opt => (
            <button key={opt.key}
              style={{ ...nh.sortBtn, ...(sortBy === opt.key ? nh.sortBtnActive : {}) }}
              onClick={() => setSortBy(opt.key)}>{opt.label}</button>
          ))}
        </div>
        <div style={nh.toggleGroup}>
          <button style={{ ...nh.toggleBtn, ...(viewMode === "grid" ? nh.toggleActive : {}) }} onClick={() => setViewMode("grid")}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button style={{ ...nh.toggleBtn, ...(viewMode === "list" ? nh.toggleActive : {}) }} onClick={() => setViewMode("list")}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={nh.empty}>
          <NoteIcon size={36} color="#C7D2FE" />
          <p style={{ color: "#9CA3AF", marginTop: "0.5rem" }}>
            {search ? `No notes found for "${search}"` : "No notes here yet."}
          </p>
          {!search && <button style={nh.newBtn} onClick={onNewScan}>New Scan</button>}
        </div>
      ) : viewMode === "grid" ? (
        <div style={nh.grid}>
          {sorted.map(note => (
            <GridCard key={note.id} note={note} folders={folders}
              onOpen={onNoteSelect} onToggleFavorite={onToggleFavorite} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div style={nh.list}>
          {sorted.map(note => (
            <ListRow key={note.id} note={note} folders={folders}
              onOpen={onNoteSelect} onToggleFavorite={onToggleFavorite} onDelete={onDelete} />
          ))}
        </div>
      )}
    </>
  );
};

const nh = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  title: { fontSize: "1.85rem", fontWeight: "800", margin: "0 0 0.15rem", color: "#111827" },
  subtitle: { fontSize: "0.83rem", color: "#9CA3AF", margin: 0 },
  newBtn: { display: "flex", alignItems: "center", gap: "0.4rem",
    background: "linear-gradient(to right, #6366F1, #8B5CF6)",
    padding: "0.65rem 1.2rem", borderRadius: "0.7rem",
    border: "none", color: "white", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", flexShrink: 0 },
  searchWrap: { display: "flex", alignItems: "center", gap: "0.5rem",
    backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "0.7rem",
    padding: "0.55rem 0.85rem", marginBottom: "0.85rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "0.875rem", color: "#111827", backgroundColor: "transparent" },
  clearBtn: { background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center", padding: 0 },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  sortGroup: { display: "flex", gap: "0.3rem" },
  sortBtn: { padding: "0.38rem 0.85rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB",
    backgroundColor: "#fff", color: "#6B7280", cursor: "pointer", fontSize: "0.78rem", fontWeight: "500" },
  sortBtnActive: { backgroundColor: "#EEF2FF", color: "#4F46E5", borderColor: "#C7D2FE", fontWeight: "700" },
  toggleGroup: { display: "flex", gap: "0.2rem", backgroundColor: "#F3F4F6", padding: "0.2rem", borderRadius: "0.5rem" },
  toggleBtn: { padding: "0.35rem 0.5rem", borderRadius: "0.4rem", border: "none",
    backgroundColor: "transparent", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" },
  toggleActive: { backgroundColor: "#fff", color: "#4F46E5", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "0.9rem" },
  list: { display: "flex", flexDirection: "column", gap: "0.45rem" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 0", gap: "0.5rem" },
};

// ── Trash page ────────────────────────────────────────────────────────────────
const TrashPage = ({ notes, onRestore, onPermanentDelete, onEmptyTrash }) => (
  <>
    <div style={tp.header}>
      <div>
        <h1 style={tp.title}>Trash</h1>
        <p style={tp.subtitle}>{notes.length === 0 ? "Trash is empty" : `${notes.length} deleted note${notes.length !== 1 ? "s" : ""}`}</p>
      </div>
      {notes.length > 0 && <button style={tp.emptyBtn} onClick={onEmptyTrash}>Empty Trash</button>}
    </div>
    {notes.length === 0 ? (
      <div style={tp.empty}>
        <svg fill="none" stroke="#C7D2FE" viewBox="0 0 24 24" style={{ width: "40px", height: "40px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <p style={{ color: "#9CA3AF", marginTop: "0.75rem" }}>Nothing in trash</p>
      </div>
    ) : (
      <div style={tp.list}>
        {notes.map(note => (
          <div key={note.id} style={tp.row}>
            <div style={tp.iconWrap}><NoteIcon size={15} color="#9CA3AF" /></div>
            <div style={tp.info}>
              <span style={tp.noteTitle}>{note.title}</span>
              <span style={tp.preview}>{note.preview}</span>
            </div>
            <span style={tp.date}>{note.date}</span>
            <button style={tp.restoreBtn} onClick={() => onRestore(note.id)}>Restore</button>
            <button style={tp.deleteBtn} onClick={() => onPermanentDelete(note.id)}>Delete</button>
          </div>
        ))}
      </div>
    )}
  </>
);

const tp = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  title: { fontSize: "2rem", fontWeight: "800", margin: "0 0 0.2rem", color: "#111827" },
  noteTitle: { fontSize: "0.86rem", fontWeight: "700", color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  subtitle: { fontSize: "0.85rem", color: "#9CA3AF", margin: 0 },
  emptyBtn: { padding: "0.65rem 1.3rem", borderRadius: "0.7rem", border: "1px solid #FCA5A5",
    backgroundColor: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 0", gap: "0.5rem" },
  list: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  row: { display: "flex", alignItems: "center", gap: "1rem", padding: "0.8rem 1rem",
    backgroundColor: "#fff", borderRadius: "0.75rem", border: "1px solid #E5E7EB" },
  iconWrap: { width: "28px", height: "28px", backgroundColor: "#F3F4F6", borderRadius: "6px",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  info: { flex: 1, display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: 0 },
  preview: { fontSize: "0.74rem", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  date: { fontSize: "0.72rem", color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0, width: "76px", textAlign: "right" },
  restoreBtn: { padding: "0.32rem 0.85rem", borderRadius: "0.45rem",
    backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE", color: "#4F46E5",
    cursor: "pointer", fontSize: "0.74rem", fontWeight: "600", flexShrink: 0 },
  deleteBtn: { padding: "0.32rem 0.85rem", borderRadius: "0.45rem",
    backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626",
    cursor: "pointer", fontSize: "0.74rem", fontWeight: "600", flexShrink: 0 },
};

// ── Main component ────────────────────────────────────────────────────────────
const UserDashboard = ({
  onLogout, onProcess, onFinishProcessing, onNewScan, onNoteSelect,
  showUploadPage = false, showProcessingPage = false, showResultsPage = false,
  initialTab = null, onInitialTabConsumed,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || "notes");
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const nextFolderId = useRef(200);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (initialTab) { setActiveTab(initialTab); if (onInitialTabConsumed) onInitialTabConsumed(); }
  }, [initialTab]);

  useEffect(() => {
    const body = document.body, html = document.documentElement;
    const bm = body.style.margin, bp = body.style.padding, hm = html.style.margin, hp = html.style.padding;
    body.style.margin = body.style.padding = html.style.margin = html.style.padding = "0";

    // Inject pulse keyframe
    const style = document.createElement("style");
    style.textContent = `@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.6 } }`;
    document.head.appendChild(style);

    return () => {
      body.style.margin = bm; body.style.padding = bp;
      html.style.margin = hm; html.style.padding = hp;
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (showProcessingPage) { setActiveTab("processing"); return; }
    if (showResultsPage)    { setActiveTab("results");    return; }
    if (showUploadPage)     { setActiveTab("upload");     return; }
  }, [showUploadPage, showProcessingPage, showResultsPage]);

  const showToast = (message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const handleNewScan = () => { setActiveTab("upload"); if (onNewScan) onNewScan(); };

  const handleToggleFavorite  = id => setNotes(p => p.map(n => n.id === id ? { ...n, favorite: !n.favorite } : n));
  const handleDeleteNote      = id => setNotes(p => p.map(n => n.id === id ? { ...n, deleted: true, favorite: false } : n));
  const handleRestoreNote     = id => setNotes(p => p.map(n => n.id === id ? { ...n, deleted: false } : n));
  const handlePermanentDelete = id => setNotes(p => p.filter(n => n.id !== id));
  const handleEmptyTrash      = () => setNotes(p => p.filter(n => !n.deleted));

  const handleMoveNote = (noteId, targetFolderId) => {
    setNotes(p => p.map(n => n.id === noteId ? { ...n, folderId: targetFolderId } : n));
    const noteName = notes.find(n => n.id === noteId)?.title || "Note";
    const folderName = targetFolderId
      ? folders.find(f => f.id === targetFolderId)?.name
      : null;
    showToast(folderName ? `"${noteName.slice(0, 20)}…" moved to ${folderName}` : `Removed from folder`);
  };

  const handleAddFolder    = (name) => {
    setFolders(p => [...p, { id: `f${nextFolderId.current++}`, name }]);
    setShowNewFolder(false);
  };
  const handleDeleteFolder = folderId => {
    setNotes(p => p.map(n => n.folderId === folderId ? { ...n, folderId: null } : n));
    setFolders(p => p.filter(f => f.id !== folderId));
  };
  const handleRenameFolder = (id, name) => setFolders(p => p.map(f => f.id === id ? { ...f, name } : f));

  const activeNotes  = notes.filter(n => !n.deleted);
  const trashedNotes = notes.filter(n => n.deleted);

  const navItems = [
    { key: "notes",     label: "My Notes",  path: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",      onClick: () => setActiveTab("notes") },
    { key: "upload",    label: "New Scan",  path: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12", onClick: handleNewScan },
    { key: "favorites", label: "Favorites", path: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z", onClick: () => setActiveTab("favorites") },
    { key: "trash",     label: "Trash",     path: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", onClick: () => setActiveTab("trash") },
  ];

  return (
    <DragContext.Provider value={{ draggingNoteId, setDraggingNoteId }}>
      <div style={s.container}>
        <div style={s.layout}>
          <aside style={s.sidebar}>
            <div style={s.sidebarContent}>
              <div style={s.logo}>
                <div style={s.logoIcon}><NoteIcon size={22} color="white" /></div>
                <span style={s.logoText}>NoteScan</span>
              </div>
              <nav style={s.nav}>
                {navItems.map(item => (
                  <button key={item.key}
                    style={{ ...s.navItem, ...(activeTab === item.key ? s.navItemActive : {}) }}
                    onClick={item.onClick}>
                    <svg style={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.path} />
                    </svg>
                    {item.label}
                    {item.key === "favorites" && activeNotes.filter(n => n.favorite).length > 0 && (
                      <span style={s.badge}>{activeNotes.filter(n => n.favorite).length}</span>
                    )}
                    {item.key === "trash" && trashedNotes.length > 0 && (
                      <span style={{ ...s.badge, backgroundColor: "#FCA5A5", color: "#7F1D1D" }}>{trashedNotes.length}</span>
                    )}
                  </button>
                ))}
                {activeTab === "processing" && (
                  <button style={{ ...s.navItem, ...s.navItemActive }} disabled>
                    <svg style={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                    </svg>
                    Processing…
                  </button>
                )}
                {activeTab === "results" && (
                  <button style={{ ...s.navItem, ...s.navItemActive }} disabled>
                    <svg style={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Results
                  </button>
                )}
              </nav>
              <div style={{ flexGrow: 1 }} />
              <button style={s.logoutButton} onClick={onLogout}>
                <svg style={s.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </aside>

          <main style={s.main}>
            <div style={s.wrapper}>
              {activeTab === "notes" && (
                <NotesHome
                  notes={activeNotes} folders={folders}
                  onNewScan={handleNewScan} onNoteSelect={onNoteSelect}
                  onToggleFavorite={handleToggleFavorite} onDelete={handleDeleteNote}
                  onAddFolder={() => setShowNewFolder(true)}
                  onDeleteFolder={handleDeleteFolder}
                  onRenameFolder={handleRenameFolder}
                  onMoveNote={handleMoveNote}
                />
              )}
              {activeTab === "upload" && (
                <UploadPage onProcess={() => { setActiveTab("processing"); if (onProcess) onProcess(); }} />
              )}
              {activeTab === "processing" && (
                <ProcessingScreen onAutoFinish={() => { setActiveTab("results"); if (onFinishProcessing) onFinishProcessing(); }} />
              )}
              {activeTab === "results" && <ResultsPage onBack={() => setActiveTab("notes")} />}
              {activeTab === "favorites" && (
                <FavoritesPage notes={activeNotes} onNoteSelect={onNoteSelect}
                  onRemoveFavorite={handleToggleFavorite} onNewScan={handleNewScan} />
              )}
              {activeTab === "trash" && (
                <TrashPage notes={trashedNotes} onRestore={handleRestoreNote}
                  onPermanentDelete={handlePermanentDelete} onEmptyTrash={handleEmptyTrash} />
              )}
            </div>
          </main>
        </div>

        {showNewFolder && (
          <NewFolderModal onSave={handleAddFolder} onClose={() => setShowNewFolder(false)} />
        )}

        <DropToast visible={toast.visible} message={toast.message} />
      </div>
    </DragContext.Provider>
  );
};

const s = {
  container: { minHeight: "100vh", backgroundColor: "#E8EEF5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  layout: { display: "flex", height: "100vh", width: "100%", overflow: "hidden" },
  sidebar: { width: "220px", background: "linear-gradient(to bottom, #6366F1, #8B5CF6)",
    padding: "1.25rem 0.75rem 1rem", display: "flex", flexDirection: "column",
    color: "white", flexShrink: 0 },
  sidebarContent: { display: "flex", flexDirection: "column", height: "100%" },
  logo: { display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1.25rem", padding: "0 0.25rem" },
  logoIcon: { width: "34px", height: "34px", background: "rgba(255,255,255,0.2)",
    borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoText: { fontSize: "1.2rem", fontWeight: "700" },
  nav: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  navItem: { padding: "0.65rem 0.75rem", background: "transparent", border: "none",
    borderRadius: "0.7rem", display: "flex", alignItems: "center", gap: "0.7rem",
    color: "white", cursor: "pointer", fontSize: "0.9rem", transition: "0.15s" },
  navItemActive: { background: "rgba(255,255,255,0.25)" },
  navIcon: { width: "18px", height: "18px", flexShrink: 0 },
  badge: { marginLeft: "auto", backgroundColor: "#FCD34D", color: "#78350F",
    borderRadius: "999px", fontSize: "0.68rem", fontWeight: "700",
    padding: "0.1rem 0.45rem", minWidth: "1.2rem", textAlign: "center" },
  logoutButton: { display: "flex", alignItems: "center", gap: "0.7rem",
    padding: "0.65rem 0.75rem", backgroundColor: "rgba(255,255,255,0.1)",
    border: "none", borderRadius: "0.7rem", color: "white",
    cursor: "pointer", fontSize: "0.9rem", marginTop: "0.5rem" },
  main: { flex: 1, overflowY: "auto", height: "100vh", padding: "2rem 2.5rem", boxSizing: "border-box" },
  wrapper: { width: "100%", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" },
};

export default UserDashboard;
