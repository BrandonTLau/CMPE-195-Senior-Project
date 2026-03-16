import React, { useState, useEffect, useRef } from "react";
import UploadPage from "./UploadPage";
import ProcessingScreen from "./ProcessingPage";
import ResultsPage from "./ResultsPage";
import FavoritesPage from "./FavoritesPage";

//design tokens
const T = {
  bg:        '#0E1117',
  surface:   '#161B27',
  surfaceHi: '#1E2537',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.13)',
  amber:     '#F5A623',
  amberDim:  'rgba(245,166,35,0.12)',
  cream:     '#EDE8DC',
  muted:     '#6B7694',
  green:     '#34D399',
  greenDim:  'rgba(52,211,153,0.12)',
  purple:    '#818CF8',
  purpleDim: 'rgba(129,140,248,0.12)',
  red:       '#F87171',
  redDim:    'rgba(248,113,113,0.12)',
  font:      '"DM Sans", system-ui, sans-serif',
  serif:     '"DM Serif Display", Georgia, serif',
};

// inject fonts + global styles once
const _fontLink = document.createElement('link');
_fontLink.rel = 'stylesheet';
_fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap';
document.head.appendChild(_fontLink);

const _style = document.createElement('style');
_style.textContent = `
  @keyframes fadeUp   { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideIn  { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
  @keyframes pulse    { 0%,100% { opacity:1 } 50% { opacity:0.55 } }
  @keyframes shimmer  { from { background-position: -200% 0 } to { background-position: 200% 0 } }

  .ud-nav-item {
    display:flex; align-items:center; gap:10px;
    padding:9px 12px; border-radius:10px; cursor:pointer;
    font-family:${T.font}; font-size:13px; font-weight:500;
    color:${T.muted}; border:none; background:transparent; width:100%;
    transition:color .15s, background .15s; position:relative;
  }
  .ud-nav-item:hover  { color:${T.cream}; background:rgba(255,255,255,0.05); }
  .ud-nav-item.active { color:${T.cream}; background:${T.surfaceHi}; }
  .ud-nav-item.active::before {
    content:''; position:absolute; left:0; top:20%; bottom:20%;
    width:3px; border-radius:0 3px 3px 0; background:${T.amber};
  }

  .ud-card {
    background:${T.surface}; border:1px solid ${T.border}; border-radius:16px;
    transition:border-color .2s, box-shadow .2s;
    position:relative; overflow:hidden;
  }
  .ud-card:hover { border-color:${T.borderHi}; box-shadow:0 8px 32px rgba(0,0,0,.3); }

  .ud-tag {
    display:inline-block; font-size:10px; font-weight:700; letter-spacing:1px;
    text-transform:uppercase; padding:2px 8px; border-radius:99px;
    font-family:${T.font};
  }

  .ud-btn-ghost {
    background:transparent; border:1px solid ${T.border}; color:${T.muted};
    border-radius:8px; padding:6px 14px; font-family:${T.font}; font-size:12px;
    font-weight:500; cursor:pointer; display:inline-flex; align-items:center; gap:5px;
    transition:border-color .2s, color .2s, background .2s;
  }
  .ud-btn-ghost:hover { border-color:${T.borderHi}; color:${T.cream}; background:${T.surfaceHi}; }

  .ud-btn-amber {
    background:${T.amber}; border:none; color:#0E1117; border-radius:9px;
    padding:8px 18px; font-family:${T.font}; font-size:13px; font-weight:600;
    cursor:pointer; display:inline-flex; align-items:center; gap:6px;
    transition:opacity .2s, transform .15s;
  }
  .ud-btn-amber:hover { opacity:.88; transform:translateY(-1px); }

  .ud-input {
    background:${T.surfaceHi}; border:1px solid ${T.border}; color:${T.cream};
    border-radius:9px; padding:9px 14px; font-family:${T.font}; font-size:13px;
    outline:none; transition:border-color .2s; width:100%; box-sizing:border-box;
  }
  .ud-input:focus { border-color:${T.amber}; }
  .ud-input::placeholder { color:${T.muted}; }

  .ud-scrollbar::-webkit-scrollbar       { width:4px; }
  .ud-scrollbar::-webkit-scrollbar-track { background:transparent; }
  .ud-scrollbar::-webkit-scrollbar-thumb { background:${T.border}; border-radius:99px; }

  .ud-folder-chip {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 12px 6px 8px; border-radius:8px;
    border:1px solid ${T.border}; background:${T.surface};
    font-family:${T.font}; font-size:12px; font-weight:500; color:${T.muted};
    cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .ud-folder-chip:hover  { border-color:${T.borderHi}; color:${T.cream}; background:${T.surfaceHi}; }
  .ud-folder-chip.active { border-color:rgba(245,166,35,.35); color:${T.amber}; background:${T.amberDim}; }
  .ud-folder-chip.dragover { border-color:${T.green}; color:${T.green}; background:${T.greenDim}; }

  .ud-note-open {
    padding:6px 14px; border-radius:7px; font-size:12px; font-weight:600;
    font-family:${T.font}; cursor:pointer; border:1px solid ${T.border};
    background:transparent; color:${T.muted};
    transition:border-color .15s, color .15s, background .15s;
  }
  .ud-note-open:hover { border-color:${T.amber}; color:${T.amber}; background:${T.amberDim}; }

  .ud-sort-btn {
    padding:5px 12px; border-radius:7px; border:1px solid transparent;
    background:transparent; color:${T.muted}; font-family:${T.font};
    font-size:12px; font-weight:500; cursor:pointer; transition:all .15s;
  }
  .ud-sort-btn:hover  { color:${T.cream}; }
  .ud-sort-btn.active { border-color:${T.border}; color:${T.cream}; background:${T.surfaceHi}; }

  .ud-view-btn {
    padding:6px 8px; border-radius:7px; border:none;
    background:transparent; color:${T.muted}; cursor:pointer;
    display:flex; align-items:center; transition:color .15s, background .15s;
  }
  .ud-view-btn:hover  { color:${T.cream}; }
  .ud-view-btn.active { color:${T.amber}; background:${T.amberDim}; }

  .ud-modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(6px);
    display:flex; align-items:center; justify-content:center; z-index:1000;
  }
  .ud-modal {
    background:${T.surface}; border:1px solid ${T.border}; border-radius:20px;
    padding:28px; width:380px; max-width:90vw;
    box-shadow:0 32px 64px rgba(0,0,0,.6); animation:fadeUp .2s ease both;
  }

  .ud-toast {
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(80px);
    background:${T.surface}; border:1px solid ${T.border}; color:${T.cream};
    padding:10px 18px; border-radius:99px; font-family:${T.font}; font-size:13px; font-weight:500;
    box-shadow:0 8px 32px rgba(0,0,0,.4); z-index:2000; pointer-events:none;
    display:flex; align-items:center; gap:8px;
    transition:transform .35s cubic-bezier(.34,1.56,.64,1), opacity .3s;
    opacity:0;
  }
  .ud-toast.visible { transform:translateX(-50%) translateY(0); opacity:1; }
`;
document.head.appendChild(_style);

//initial data
const INITIAL_NOTES = [
  { id: 1, title: "Introduction to Machine Learning", date: "Dec 6, 2025", folderId: null,
    preview: "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data...",
    tags: ["AI", "Computer Science"], confidence: 87, favorite: false, deleted: false },
  { id: 2, title: "Calculus Notes - Chapter 5", date: "Dec 5, 2025", folderId: "f1",
    preview: "Integration techniques and applications including u-substitution and integration by parts...",
    tags: ["Math", "Calculus"], confidence: 92, favorite: false, deleted: false },
  { id: 3, title: "History Lecture Notes", date: "Dec 3, 2025", folderId: null,
    preview: "World War II timeline and key events that shaped the modern world...",
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

const TAG_PALETTE = [
  { bg: 'rgba(129,140,248,0.15)', text: '#818CF8' },
  { bg: 'rgba(52,211,153,0.15)',  text: '#34D399' },
  { bg: 'rgba(245,166,35,0.15)',  text: '#F5A623' },
  { bg: 'rgba(248,113,113,0.15)', text: '#F87171' },
  { bg: 'rgba(96,165,250,0.15)',  text: '#60A5FA' },
];
const tagColor = (tag) => TAG_PALETTE[tag.charCodeAt(0) % TAG_PALETTE.length];

const DragContext = React.createContext(null);

//icons
const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const ConfidencePill = ({ score }) => {
  const color = score >= 90 ? { bg: T.greenDim, text: T.green }
              : score >= 80 ? { bg: T.amberDim, text: T.amber }
              : { bg: T.redDim, text: T.red };
  return (
    <span className="ud-tag" style={{ background: color.bg, color: color.text }}>{score}%</span>
  );
};

//new folder modal
const NewFolderModal = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  return (
    <div className="ud-modal-overlay">
      <div className="ud-modal">
        <p style={{ fontFamily: T.serif, fontSize: 20, color: T.cream, margin: '0 0 20px' }}>New Folder</p>
        <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:T.muted, marginBottom:8, fontFamily:T.font }}>Folder name</label>
        <input className="ud-input" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Math, Biology…" autoFocus
          onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())} />
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button className="ud-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ud-btn-amber" style={{ opacity: name.trim() ? 1 : 0.4 }}
            onClick={() => name.trim() && onSave(name.trim())}>
            <Icon d="M12 4v16m8-8H4" size={13} color="#0E1117" /> Create
          </button>
        </div>
      </div>
    </div>
  );
};

//folders strip
const FoldersStrip = ({ folders, notes, selectedFolderId, onSelect, onAdd, onDelete, onRename, onDropNote, search = '' }) => {
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal,  setRenameVal]  = useState('');
  const [dragOverId, setDragOverId] = useState(undefined);
  const { draggingNoteId } = React.useContext(DragContext);

  const visible = search.trim()
    ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : folders;

  const count = (fid) => notes.filter(n => n.folderId === fid).length;

  const handleDragOver = (e, id) => { if (!draggingNoteId) return; e.preventDefault(); setDragOverId(id); };
  const handleDrop = (e, fid) => {
    e.preventDefault();
    const nid = parseInt(e.dataTransfer.getData('noteId'), 10);
    if (nid) onDropNote(nid, fid);
    setDragOverId(undefined);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.muted, fontFamily:T.font }}>Folders</span>
        <span style={{ fontSize:10, fontWeight:700, background:T.surfaceHi, color:T.muted, borderRadius:99, padding:'1px 7px', fontFamily:T.font }}>{folders.length}</span>
        <div style={{ flex:1 }} />
        <button className="ud-btn-ghost" onClick={onAdd} style={{ padding:'4px 10px', fontSize:11 }}>
          <Icon d="M12 4v16m8-8H4" size={12} /> New Folder
        </button>
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {/* All notes chip */}
        <button className={`ud-folder-chip${selectedFolderId === null ? ' active' : ''}${draggingNoteId && dragOverId === null ? ' dragover' : ''}`}
          onClick={() => onSelect(null)}
          onDragOver={e => handleDragOver(e, null)}
          onDragLeave={() => setDragOverId(undefined)}
          onDrop={e => handleDrop(e, null)}>
          <Icon d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" size={13} />
          {draggingNoteId && dragOverId === null ? 'Remove folder' : 'All Notes'}
          <span style={{ fontSize:10, fontWeight:700, color:'inherit', opacity:.7 }}>{notes.length}</span>
        </button>

        {visible.map(folder => {
          const isActive   = selectedFolderId === folder.id;
          const isDragOver = draggingNoteId && dragOverId === folder.id;
          return renamingId === folder.id ? (
            <input key={folder.id} className="ud-input" autoFocus value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              style={{ width:120, padding:'5px 10px', fontSize:12 }}
              onKeyDown={e => {
                if (e.key === 'Enter' && renameVal.trim()) { onRename(folder.id, renameVal.trim()); setRenamingId(null); }
                if (e.key === 'Escape') setRenamingId(null);
              }}
              onBlur={() => setRenamingId(null)} />
          ) : (
            <div key={folder.id} style={{ position:'relative', display:'inline-flex' }}>
              <button className={`ud-folder-chip${isActive ? ' active' : ''}${isDragOver ? ' dragover' : ''}`}
                onClick={() => onSelect(folder.id)}
                onDragOver={e => handleDragOver(e, folder.id)}
                onDragLeave={() => setDragOverId(undefined)}
                onDrop={e => handleDrop(e, folder.id)}
                onDoubleClick={() => { setRenamingId(folder.id); setRenameVal(folder.name); }}>
                <Icon d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" size={13} />
                {isDragOver ? `Move to ${folder.name}` : folder.name}
                <span style={{ fontSize:10, fontWeight:700, color:'inherit', opacity:.7 }}>{count(folder.id)}</span>
                <button style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', opacity:.5, padding:0, display:'flex', lineHeight:1, marginLeft:2 }}
                  onClick={e => { e.stopPropagation(); onDelete(folder.id); }}
                  title="Delete folder">
                  <Icon d="M6 18L18 6M6 6l12 12" size={10} />
                </button>
              </button>
            </div>
          );
        })}
      </div>

      {draggingNoteId && (
        <p style={{ fontSize:11, color:T.muted, fontFamily:T.font, margin:'8px 0 0', fontStyle:'italic' }}>
          Drop onto a folder to move the note
        </p>
      )}

      <div style={{ height:1, background:T.border, margin:'16px 0' }} />
    </div>
  );
};

//tag editor
const TagEditor = ({ tags, onSave, onClose }) => {
  const [localTags, setLocalTags] = useState([...tags]);
  const [input, setInput]         = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const addTag = () => {
    const val = input.trim();
    if (val && !localTags.includes(val)) setLocalTags(p => [...p, val]);
    setInput('');
  };

  const removeTag = (tag) => setLocalTags(p => p.filter(t => t !== tag));

  return (
    <div style={{ background:T.surfaceHi, border:`1px solid ${T.borderHi}`, borderRadius:10, padding:'10px 12px', marginTop:4 }}
      onClick={e => e.stopPropagation()}>
      {/* Existing tags */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom: localTags.length ? 8 : 0 }}>
        {localTags.map(tag => {
          const c = tagColor(tag);
          return (
            <span key={tag} style={{ display:'inline-flex', alignItems:'center', gap:4, background:c.bg, color:c.text,
              fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', padding:'2px 7px', borderRadius:99, fontFamily:T.font }}>
              {tag}
              <button style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', padding:0, display:'flex', opacity:.7, lineHeight:1 }}
                onClick={() => removeTag(tag)}>
                <Icon d="M6 18L18 6M6 6l12 12" size={9} />
              </button>
            </span>
          );
        })}
      </div>
      {/* Input */}
      <div style={{ display:'flex', gap:6 }}>
        <input ref={inputRef} className="ud-input" value={input} onChange={e => setInput(e.target.value)}
          placeholder="Add tag…" style={{ padding:'5px 10px', fontSize:12, flex:1 }}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
            if (e.key === 'Escape') onClose();
          }} />
        <button className="ud-btn-amber" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => {
          const val = input.trim();
          const finalTags = val && !localTags.includes(val) ? [...localTags, val] : localTags;
          onSave(finalTags);
          onClose();
        }}>
          Save
        </button>
        <button className="ud-btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

//note card grid
const NoteCard = ({ note, folders, onOpen, onToggleFavorite, onDelete, onUpdateTags }) => {
  const [hovered,     setHovered]     = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const { draggingNoteId, setDraggingNoteId } = React.useContext(DragContext);
  const isDragging = draggingNoteId === note.id;
  const folder = folders.find(f => f.id === note.folderId);

  return (
    <div className="ud-card"
      draggable
      onDragStart={e => { e.dataTransfer.setData('noteId', note.id); e.dataTransfer.effectAllowed = 'move'; setDraggingNoteId(note.id); }}
      onDragEnd={() => setDraggingNoteId(null)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding:18, display:'flex', flexDirection:'column', gap:12, cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1, transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : 'none',
        transition:'opacity .15s, transform .15s', animation:'fadeUp .3s ease both' }}>

      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={14} color={T.amber} />
          </div>
          {folder && <span className="ud-tag" style={{ background:T.purpleDim, color:T.purple }}>{folder.name}</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <ConfidencePill score={note.confidence} />
          <button style={{ background:'none', border:'none', cursor:'pointer', color: note.favorite ? T.amber : T.muted, padding:3, display:'flex', transition:'color .15s' }}
            onClick={() => onToggleFavorite(note.id)}>
            <Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={14} />
          </button>
          <button style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, padding:3, display:'flex', transition:'color .15s' }}
            onClick={() => onDelete(note.id)}>
            <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        <p style={{ fontFamily:T.font, fontSize:14, fontWeight:600, color:T.cream, margin:'0 0 6px', lineHeight:1.3 }}>{note.title}</p>
        <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0, lineHeight:1.6,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{note.preview}</p>
      </div>

      {/* Footer */}
      <div style={{ marginTop:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: editingTags ? 6 : 0 }}>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
            {note.tags.slice(0,3).map(tag => {
              const c = tagColor(tag);
              return <span key={tag} className="ud-tag" style={{ background:c.bg, color:c.text }}>{tag}</span>;
            })}
            {hovered && !editingTags && (
              <button style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, padding:2, display:'flex', transition:'color .15s' }}
                title="Edit tags" onClick={e => { e.stopPropagation(); setEditingTags(true); }}>
                <Icon d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414A2 2 0 019 13z" size={13} />
              </button>
            )}
          </div>
          <span style={{ fontFamily:T.font, fontSize:11, color:T.muted }}>{note.date}</span>
        </div>
        {editingTags && (
          <TagEditor tags={note.tags} onSave={(tags) => onUpdateTags(note.id, tags)} onClose={() => setEditingTags(false)} />
        )}
      </div>

      <button className="ud-note-open" onClick={() => onOpen(note)}>Open →</button>
    </div>
  );
};

//note row
const NoteRow = ({ note, folders, onOpen, onToggleFavorite, onDelete, onUpdateTags }) => {
  const [hovered,     setHovered]     = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const { draggingNoteId, setDraggingNoteId } = React.useContext(DragContext);
  const isDragging = draggingNoteId === note.id;
  const folder = folders.find(f => f.id === note.folderId);

  return (
    <div className="ud-card"
      draggable
      onDragStart={e => { e.dataTransfer.setData('noteId', note.id); e.dataTransfer.effectAllowed = 'move'; setDraggingNoteId(note.id); }}
      onDragEnd={() => setDraggingNoteId(null)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:0, borderRadius:12,
        opacity: isDragging ? 0.5 : 1, cursor: isDragging ? 'grabbing' : 'grab',
        transition:'opacity .15s', animation:'fadeUp .25s ease both' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={15} color={T.amber} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <span style={{ fontFamily:T.font, fontSize:13, fontWeight:600, color:T.cream, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.title}</span>
            {folder && <span className="ud-tag" style={{ background:T.purpleDim, color:T.purple, flexShrink:0 }}>{folder.name}</span>}
          </div>
          <span style={{ fontFamily:T.font, fontSize:12, color:T.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{note.preview}</span>
        </div>
        <div style={{ display:'flex', gap:5, flexShrink:0, alignItems:'center' }}>
          {note.tags.slice(0,2).map(tag => { const c = tagColor(tag); return <span key={tag} className="ud-tag" style={{ background:c.bg, color:c.text }}>{tag}</span>; })}
          {hovered && !editingTags && (
            <button style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, padding:2, display:'flex' }}
              title="Edit tags" onClick={e => { e.stopPropagation(); setEditingTags(true); }}>
              <Icon d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414A2 2 0 019 13z" size={13} />
            </button>
          )}
        </div>
        <ConfidencePill score={note.confidence} />
        <span style={{ fontFamily:T.font, fontSize:11, color:T.muted, whiteSpace:'nowrap', width:70, textAlign:'right' }}>{note.date}</span>
        <button style={{ background:'none', border:'none', cursor:'pointer', color: note.favorite ? T.amber : T.muted, padding:3, display:'flex' }} onClick={() => onToggleFavorite(note.id)}>
          <Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={14} />
        </button>
      <button style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, padding:3, display:'flex' }} onClick={() => onDelete(note.id)}>
        <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14} />
      </button>
      <button className="ud-note-open" onClick={() => onOpen(note)}>Open</button>
      </div>
      {editingTags && (
        <div style={{ marginTop:8 }}>
          <TagEditor tags={note.tags} onSave={(tags) => onUpdateTags(note.id, tags)} onClose={() => setEditingTags(false)} />
        </div>
      )}
    </div>
  );
};

//notes home
const NotesHome = ({ notes, folders, onNewScan, onNoteSelect, onToggleFavorite, onDelete,
  onAddFolder, onDeleteFolder, onRenameFolder, onMoveNote, onUpdateTags }) => {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy,   setSortBy]   = useState('date');
  const [search,   setSearch]   = useState('');

  const visible = selectedFolderId === null ? notes : notes.filter(n => n.folderId === selectedFolderId);
  const filtered = visible.filter(n => {
    const q = search.toLowerCase();
    const folderName = folders.find(f => f.id === n.folderId)?.name || '';
    return n.title.toLowerCase().includes(q) || n.preview.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q)) || folderName.toLowerCase().includes(q);
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alpha')      return a.title.localeCompare(b.title);
    if (sortBy === 'confidence') return b.confidence - a.confidence;
    return 0;
  });

  return (
    <div style={{ animation:'fadeUp .35s ease both' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <p style={{ fontFamily:T.font, fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 6px' }}>Your Library</p>
          <h1 style={{ fontFamily:T.serif, fontSize:32, fontWeight:400, color:T.cream, margin:0, lineHeight:1.1 }}>My Notes</h1>
          <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'6px 0 0' }}>{sorted.length} note{sorted.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="ud-btn-amber" onClick={onNewScan}>
          <Icon d="M12 4v16m8-8H4" size={14} color="#0E1117" /> New Scan
        </button>
      </div>

      {/* Search */}
      <div style={{ display:'flex', alignItems:'center', gap:10, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'9px 14px', marginBottom:20 }}>
        <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" size={15} color={T.muted} />
        <input className="ud-input" style={{ border:'none', background:'transparent', padding:0, flex:1, fontSize:13 }}
          type="text" placeholder="Search notes, tags, folders…"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex', padding:0 }} onClick={() => setSearch('')}>
          <Icon d="M6 18L18 6M6 6l12 12" size={13} />
        </button>}
      </div>

      {/* Folders */}
      <FoldersStrip folders={folders} notes={notes} selectedFolderId={selectedFolderId}
        onSelect={setSelectedFolderId} onAdd={onAddFolder} onDelete={onDeleteFolder}
        onRename={onRenameFolder} onDropNote={onMoveNote} search={search} />

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', gap:4 }}>
          {[{k:'date',label:'Recent'},{k:'alpha',label:'A–Z'},{k:'confidence',label:'Confidence'}].map(o => (
            <button key={o.k} className={`ud-sort-btn${sortBy===o.k?' active':''}`} onClick={() => setSortBy(o.k)}>{o.label}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:2, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:3 }}>
          <button className={`ud-view-btn${viewMode==='grid'?' active':''}`} onClick={() => setViewMode('grid')}>
            <Icon d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" size={15} />
          </button>
          <button className={`ud-view-btn${viewMode==='list'?' active':''}`} onClick={() => setViewMode('list')}>
            <Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" size={15} />
          </button>
        </div>
      </div>

      {/* Notes */}
      {sorted.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:12 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={24} color={T.muted} />
          </div>
          <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:0 }}>
            {search ? `No notes found for "${search}"` : 'No notes here yet.'}
          </p>
          {!search && <button className="ud-btn-amber" onClick={onNewScan}>
            <Icon d="M12 4v16m8-8H4" size={14} color="#0E1117" /> New Scan
          </button>}
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
          {sorted.map(n => <NoteCard key={n.id} note={n} folders={folders} onOpen={onNoteSelect}
            onToggleFavorite={onToggleFavorite} onDelete={onDelete} onUpdateTags={onUpdateTags} />)}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {sorted.map(n => <NoteRow key={n.id} note={n} folders={folders} onOpen={onNoteSelect}
            onToggleFavorite={onToggleFavorite} onDelete={onDelete} onUpdateTags={onUpdateTags} />)}
        </div>
      )}
    </div>
  );
};

//trash
const TrashPage = ({ notes, onRestore, onPermanentDelete, onEmptyTrash }) => (
  <div style={{ animation:'fadeUp .35s ease both' }}>
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28 }}>
      <div>
        <p style={{ fontFamily:T.font, fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.muted, margin:'0 0 6px' }}>Deleted</p>
        <h1 style={{ fontFamily:T.serif, fontSize:32, fontWeight:400, color:T.cream, margin:0 }}>Trash</h1>
        <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'6px 0 0' }}>{notes.length} deleted note{notes.length !== 1 ? 's' : ''}</p>
      </div>
      {notes.length > 0 && (
        <button className="ud-btn-ghost" onClick={onEmptyTrash} style={{ borderColor:'rgba(248,113,113,.3)', color:T.red }}>
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={13} />
          Empty Trash
        </button>
      )}
    </div>
    {notes.length === 0 ? (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:12 }}>
        <div style={{ width:60, height:60, borderRadius:16, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={24} color={T.muted} />
        </div>
        <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:0 }}>Trash is empty</p>
      </div>
    ) : (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {notes.map(note => (
          <div key={note.id} className="ud-card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14, borderRadius:12 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:T.redDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={15} color={T.red} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontFamily:T.font, fontSize:13, fontWeight:600, color:T.muted, margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.title}</p>
              <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0, opacity:.6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.preview}</p>
            </div>
            <span style={{ fontFamily:T.font, fontSize:11, color:T.muted, whiteSpace:'nowrap' }}>{note.date}</span>
            <button className="ud-btn-ghost" onClick={() => onRestore(note.id)} style={{ fontSize:12, padding:'5px 12px' }}>Restore</button>
            <button className="ud-btn-ghost" onClick={() => onPermanentDelete(note.id)} style={{ fontSize:12, padding:'5px 12px', borderColor:'rgba(248,113,113,.3)', color:T.red }}>Delete</button>
          </div>
        ))}
      </div>
    )}
  </div>
);

//main component
const UserDashboard = ({
  onLogout, onProcess, onFinishProcessing, onNewScan, onNoteSelect,
  showUploadPage = false, showProcessingPage = false, showResultsPage = false,
  initialTab = null, onInitialTabConsumed,
}) => {
  const [activeTab,      setActiveTab]      = useState(initialTab || 'notes');
  const [notes,          setNotes]          = useState(INITIAL_NOTES);
  const [folders,        setFolders]        = useState(INITIAL_FOLDERS);
  const [showNewFolder,  setShowNewFolder]  = useState(false);
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  const [toast,          setToast]          = useState({ visible: false, message: '' });
  const nextFolderId = useRef(200);
  const toastTimer   = useRef(null);

  useEffect(() => {
    if (initialTab) { setActiveTab(initialTab); if (onInitialTabConsumed) onInitialTabConsumed(); }
  }, [initialTab]);

  useEffect(() => {
    if (showProcessingPage) { setActiveTab('processing'); return; }
    if (showResultsPage)    { setActiveTab('results');    return; }
    if (showUploadPage)     { setActiveTab('upload');     return; }
  }, [showUploadPage, showProcessingPage, showResultsPage]);

  const showToast = (msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message: msg });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const handleNewScan         = () => { setActiveTab('upload'); if (onNewScan) onNewScan(); };
  const handleToggleFavorite  = id => setNotes(p => p.map(n => n.id === id ? { ...n, favorite: !n.favorite } : n));
  const handleDeleteNote      = id => setNotes(p => p.map(n => n.id === id ? { ...n, deleted: true, favorite: false } : n));
  const handleRestoreNote     = id => setNotes(p => p.map(n => n.id === id ? { ...n, deleted: false } : n));
  const handlePermanentDelete = id => setNotes(p => p.filter(n => n.id !== id));
  const handleEmptyTrash      = () => setNotes(p => p.filter(n => !n.deleted));
  const handleUpdateTags  = (id, tags) => setNotes(p => p.map(n => n.id === id ? { ...n, tags } : n));
  const handleMoveNote = (noteId, targetFolderId) => {
    setNotes(p => p.map(n => n.id === noteId ? { ...n, folderId: targetFolderId } : n));
    const noteName   = notes.find(n => n.id === noteId)?.title || 'Note';
    const folderName = targetFolderId ? folders.find(f => f.id === targetFolderId)?.name : null;
    showToast(folderName ? `Moved to ${folderName}` : 'Removed from folder');
  };
  const handleAddFolder    = name => { setFolders(p => [...p, { id: `f${nextFolderId.current++}`, name }]); setShowNewFolder(false); };
  const handleDeleteFolder = fid  => { setNotes(p => p.map(n => n.folderId === fid ? { ...n, folderId: null } : n)); setFolders(p => p.filter(f => f.id !== fid)); };
  const handleRenameFolder = (id, name) => setFolders(p => p.map(f => f.id === id ? { ...f, name } : f));

  const activeNotes  = notes.filter(n => !n.deleted);
  const trashedNotes = notes.filter(n => n.deleted);
  const favoriteNotes = activeNotes.filter(n => n.favorite);

  const NAV = [
    { key:'notes',     label:'My Notes',  icon:'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',     onClick: () => setActiveTab('notes') },
    { key:'upload',    label:'New Scan',  icon:'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', onClick: handleNewScan },
    { key:'favorites', label:'Favorites', icon:'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', onClick: () => setActiveTab('favorites') },
    { key:'trash',     label:'Trash',     icon:'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', onClick: () => setActiveTab('trash') },
  ];

  return (
    <DragContext.Provider value={{ draggingNoteId, setDraggingNoteId }}>
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, display:'flex' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width:220, background:T.surface, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh' }}>
          {/* Logo */}
          <div style={{ padding:'20px 16px 16px', borderBottom:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={17} color="#0E1117" />
              </div>
              <span style={{ fontFamily:T.serif, fontSize:18, color:T.cream }}>NoteScan</span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding:'12px 10px', flex:1, display:'flex', flexDirection:'column', gap:2 }}>
            {/* Section label */}
            <p style={{ fontFamily:T.font, fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.muted, margin:'4px 4px 8px', opacity:.6 }}>Navigation</p>

            {NAV.map(item => (
              <button key={item.key} className={`ud-nav-item${activeTab === item.key ? ' active' : ''}`} onClick={item.onClick}>
                <Icon d={item.icon} size={15} />
                {item.label}
                {item.key === 'favorites' && favoriteNotes.length > 0 && (
                  <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, background:T.amberDim, color:T.amber, borderRadius:99, padding:'1px 7px' }}>{favoriteNotes.length}</span>
                )}
                {item.key === 'trash' && trashedNotes.length > 0 && (
                  <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, background:T.redDim, color:T.red, borderRadius:99, padding:'1px 7px' }}>{trashedNotes.length}</span>
                )}
              </button>
            ))}

            {(activeTab === 'processing' || activeTab === 'results') && (
              <>
                <div style={{ height:1, background:T.border, margin:'8px 4px' }} />
                <button className="ud-nav-item active" disabled style={{ opacity:.7 }}>
                  <Icon d={activeTab === 'processing' ? 'M12 6v6l4 2' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} size={15} />
                  {activeTab === 'processing' ? 'Processing…' : 'Results'}
                </button>
              </>
            )}

            {/* Stats section */}
            <div style={{ marginTop:'auto' }}>
              <div style={{ height:1, background:T.border, margin:'12px 4px 12px' }} />
              <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontFamily:T.font, fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.muted, margin:'0 0 10px', opacity:.7 }}>Library</p>
                {[
                  { label:'Total notes', value: activeNotes.length },
                  { label:'Favorites',   value: favoriteNotes.length },
                  { label:'Folders',     value: folders.length },
                ].map(s => (
                  <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontFamily:T.font, fontSize:12, color:T.muted }}>{s.label}</span>
                    <span style={{ fontFamily:T.font, fontSize:12, fontWeight:700, color:T.cream }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </nav>

          {/* Logout */}
          <div style={{ padding:'12px 10px', borderTop:`1px solid ${T.border}` }}>
            <button className="ud-nav-item" onClick={onLogout} style={{ color:T.red }}>
              <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={15} />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="ud-scrollbar" style={{ flex:1, overflowY:'auto', height:'100vh', padding:'32px 40px', boxSizing:'border-box' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            {activeTab === 'notes' && (
              <NotesHome notes={activeNotes} folders={folders} onNewScan={handleNewScan}
                onNoteSelect={onNoteSelect} onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteNote} onAddFolder={() => setShowNewFolder(true)}
                onDeleteFolder={handleDeleteFolder} onRenameFolder={handleRenameFolder}
                onMoveNote={handleMoveNote} onUpdateTags={handleUpdateTags} />
            )}
            {activeTab === 'upload' && (
              <UploadPage onProcess={() => { setActiveTab('processing'); if (onProcess) onProcess(); }} />
            )}
            {activeTab === 'processing' && (
              <ProcessingScreen onAutoFinish={() => { setActiveTab('results'); if (onFinishProcessing) onFinishProcessing(); }} />
            )}
            {activeTab === 'results' && <ResultsPage onBack={() => setActiveTab('notes')} />}
            {activeTab === 'favorites' && (
              <FavoritesPage notes={activeNotes} onNoteSelect={onNoteSelect}
                onRemoveFavorite={handleToggleFavorite} onNewScan={handleNewScan} />
            )}
            {activeTab === 'trash' && (
              <TrashPage notes={trashedNotes} onRestore={handleRestoreNote}
                onPermanentDelete={handlePermanentDelete} onEmptyTrash={handleEmptyTrash} />
            )}
          </div>
        </main>
      </div>

      {showNewFolder && <NewFolderModal onSave={handleAddFolder} onClose={() => setShowNewFolder(false)} />}

      {/* Toast */}
      <div className={`ud-toast${toast.visible ? ' visible' : ''}`}>
        <Icon d="M5 13l4 4L19 7" size={13} color={T.green} />
        {toast.message}
      </div>
    </DragContext.Provider>
  );
};

export default UserDashboard;
