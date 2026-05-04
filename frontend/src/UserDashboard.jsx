import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import UploadPage from "./UploadPage";
import ResultsPage from "./ResultsPage";
import SettingsPage from "./SettingsPage";

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

const _fontLink = document.createElement('link');
_fontLink.rel = 'stylesheet';
_fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap';
document.head.appendChild(_fontLink);

const _style = document.createElement('style');
_style.textContent = `
  @keyframes fadeUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
  @keyframes menuIn  { from { opacity:0; transform:scale(0.95) translateY(-4px) } to { opacity:1; transform:scale(1) translateY(0) } }
  @keyframes spin    { to { transform:rotate(360deg) } }
  @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }

  .ud-nav-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:10px; cursor:pointer; font-family:${T.font}; font-size:13px; font-weight:500; color:${T.muted}; border:none; background:transparent; width:100%; transition:color .15s, background .15s; position:relative; }
  .ud-nav-item:hover  { color:${T.cream}; background:rgba(255,255,255,0.05); }
  .ud-nav-item.active { color:${T.cream}; background:${T.surfaceHi}; }
  .ud-nav-item.active::before { content:''; position:absolute; left:0; top:20%; bottom:20%; width:3px; border-radius:0 3px 3px 0; background:${T.amber}; }

  .ud-card { background:${T.surface}; border:1px solid ${T.border}; border-radius:16px; transition:border-color .2s, box-shadow .2s; position:relative; overflow:visible; }
  .ud-card:hover { border-color:${T.borderHi}; box-shadow:0 8px 32px rgba(0,0,0,.3); }
  .ud-card-clickable { cursor:pointer; }
  .ud-card-clickable:hover { border-color:${T.amber}; }

  .ud-tag { display:inline-block; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:2px 8px; border-radius:99px; font-family:${T.font}; }

  .ud-btn-ghost { background:transparent; border:1px solid ${T.border}; color:${T.muted}; border-radius:8px; padding:6px 14px; font-family:${T.font}; font-size:12px; font-weight:500; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:border-color .2s, color .2s, background .2s; }
  .ud-btn-ghost:hover { border-color:${T.borderHi}; color:${T.cream}; background:${T.surfaceHi}; }

  .ud-btn-amber { background:${T.amber}; border:none; color:#0E1117; border-radius:9px; padding:8px 18px; font-family:${T.font}; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:opacity .2s, transform .15s; }
  .ud-btn-amber:hover { opacity:.88; transform:translateY(-1px); }

  .ud-btn-red { background:${T.red}; border:none; color:#0E1117; border-radius:9px; padding:8px 18px; font-family:${T.font}; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:opacity .2s, transform .15s; }
  .ud-btn-red:hover { opacity:.88; transform:translateY(-1px); }
  .ud-btn-red:disabled { opacity:.4; cursor:default; transform:none; }

  .ud-input { background:${T.surfaceHi}; border:1px solid ${T.border}; color:${T.cream}; border-radius:9px; padding:9px 14px; font-family:${T.font}; font-size:13px; outline:none; transition:border-color .2s; width:100%; box-sizing:border-box; }
  .ud-input:focus { border-color:${T.amber}; }
  .ud-input::placeholder { color:${T.muted}; }
  .ud-input.danger:focus { border-color:${T.red}; }

  .ud-scrollbar::-webkit-scrollbar { width:4px; }
  .ud-scrollbar::-webkit-scrollbar-track { background:transparent; }
  .ud-scrollbar::-webkit-scrollbar-thumb { background:${T.border}; border-radius:99px; }

  .ud-folder-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 12px 6px 8px; border-radius:8px; border:1px solid ${T.border}; background:${T.surface}; font-family:${T.font}; font-size:12px; font-weight:500; color:${T.muted}; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .ud-folder-chip:hover  { border-color:${T.borderHi}; color:${T.cream}; background:${T.surfaceHi}; }
  .ud-folder-chip.active { border-color:rgba(245,166,35,.35); color:${T.amber}; background:${T.amberDim}; }
  .ud-folder-chip.dragover { border-color:${T.green}; color:${T.green}; background:${T.greenDim}; }
  .ud-folder-chip.dragover-same { border-color:${T.border}; color:${T.muted}; background:${T.surfaceHi}; opacity:0.6; cursor:not-allowed; }

  .ud-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.75); display:flex; align-items:center; justify-content:center; z-index:1000; }
  .ud-modal { background:${T.surface}; border:1px solid ${T.border}; border-radius:20px; padding:28px; width:380px; max-width:90vw; box-shadow:0 32px 64px rgba(0,0,0,.6); animation:fadeUp .2s ease both; }

  .ud-toast {
    position:fixed; bottom:24px; left:50%;
    transform:translateX(-50%) translateY(80px);
    padding:10px 16px; border-radius:12px;
    font-family:${T.font}; font-size:13px; font-weight:500;
    box-shadow:0 8px 32px rgba(0,0,0,.5);
    z-index:2000; pointer-events:none;
    display:flex; align-items:center; gap:10px;
    transition:transform .35s cubic-bezier(.34,1.56,.64,1), opacity .3s;
    opacity:0; white-space:nowrap; border:1px solid transparent;
  }
  .ud-toast.visible { transform:translateX(-50%) translateY(0); opacity:1; pointer-events:auto; }
  .ud-toast.success { background:${T.surface}; border-color:rgba(52,211,153,.25);  color:${T.cream}; }
  .ud-toast.error   { background:${T.surface}; border-color:rgba(248,113,113,.25); color:${T.cream}; }
  .ud-toast.info    { background:${T.surface}; border-color:rgba(245,166,35,.25);  color:${T.cream}; }
  .ud-toast.warning { background:${T.surface}; border-color:rgba(245,166,35,.25);  color:${T.cream}; }

  .ud-dot-menu { position:fixed; z-index:1000; background:${T.surface}; border:1px solid ${T.border}; border-radius:12px; padding:6px; min-width:200px; box-shadow:0 16px 40px rgba(0,0,0,.5); animation:menuIn .15s ease both; }
  .ud-dot-item { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px; cursor:pointer; font-family:${T.font}; font-size:13px; font-weight:500; color:${T.muted}; transition:background .15s, color .15s; border:none; background:transparent; width:100%; text-align:left; }
  .ud-dot-item:hover { background:${T.surfaceHi}; color:${T.cream}; }
  .ud-dot-item.danger { color:${T.red}; }
  .ud-dot-item.danger:hover { background:${T.redDim}; color:${T.red}; }
  .ud-dot-sep { height:1px; background:${T.border}; margin:4px 0; }

  .ud-mass-bar { position:fixed; bottom:32px; left:50%; transform:translateX(-50%); background:${T.surface}; border:1px solid ${T.borderHi}; border-radius:14px; padding:12px 20px; display:flex; align-items:center; gap:14px; box-shadow:0 16px 48px rgba(0,0,0,.6); z-index:500; animation:slideUp .2s ease both; font-family:${T.font}; }
`;
document.head.appendChild(_style);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const handleRes = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || data.message || res.statusText || 'Request failed');
  return data;
};

const toNote = (file) => ({
  id:           file._id,
  title:        file.title || 'Untitled',
  date:         file.uploadDate ? new Date(file.uploadDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '',
  folderId:     file.folderId  ?? null,
  preview:      file.currentContent?.transcribedText || '',
  aiSummary:    file.currentContent?.summary        || null,
  tags:         file.tags      ?? [],
  confidence: (() => {
  const raw = file.extractionData?.extractionAccuracy ?? null;
  if (raw === null) return null;
  return raw > 1 ? Math.round(raw) : Math.round(raw * 100);
})(),
  favorite:     file.isFavorite ?? false,
  deleted:      file.isDeleted  ?? false,
  fileLocation: file.fileLocation || null,
  imageUrl:     file.fileLocation ? `${BACKEND_URL}/${file.fileLocation}` : null,
});

const toFolder = (folder) => ({ id: folder.id ?? folder._id, name: folder.name });

const api = {
  getNotes: async () => {
    const [activeRes, trashRes] = await Promise.all([
      fetch('/api/files',       { headers: { 'x-auth-token': getToken() || '' } }),
      fetch('/api/files/trash', { headers: { 'x-auth-token': getToken() || '' } }),
    ]);
    const [activeData, trashData] = await Promise.all([
      handleRes(activeRes).catch(() => []),
      handleRes(trashRes).catch(() => []),
    ]);
    return [...(Array.isArray(activeData) ? activeData : []), ...(Array.isArray(trashData) ? trashData : [])].map(toNote);
  },
  toggleFavorite:  async (id, current) => handleRes(await fetch(`/api/files/${id}/meta`, { method:'PATCH', headers:{ 'Content-Type':'application/json', 'x-auth-token':getToken()||'' }, body:JSON.stringify({ isFavorite:!current }) })),
  updateTags:      async (id, tags)     => handleRes(await fetch(`/api/files/${id}/meta`, { method:'PATCH', headers:{ 'Content-Type':'application/json', 'x-auth-token':getToken()||'' }, body:JSON.stringify({ tags }) })),
  moveNote:        async (id, folderId) => handleRes(await fetch(`/api/files/${id}/meta`, { method:'PATCH', headers:{ 'Content-Type':'application/json', 'x-auth-token':getToken()||'' }, body:JSON.stringify({ folderId }) })),
  permanentDelete: async (id)           => handleRes(await fetch(`/api/files/${id}`,      { method:'DELETE', headers:{ 'x-auth-token':getToken()||'' } })),
  trashNote:       async (id)           => handleRes(await fetch(`/api/files/${id}/meta`, { method:'PATCH', headers:{ 'Content-Type':'application/json', 'x-auth-token':getToken()||'' }, body:JSON.stringify({ isDeleted:true }) })),
  restoreNote:     async (id)           => handleRes(await fetch(`/api/files/${id}/meta`, { method:'PATCH', headers:{ 'Content-Type':'application/json', 'x-auth-token':getToken()||'' }, body:JSON.stringify({ isDeleted:false }) })),
  emptyTrash: async (trashedIds) => {
    const results = await Promise.all(trashedIds.map(id => fetch(`/api/files/${id}`, { method:'DELETE', headers:{ 'x-auth-token':getToken()||'' } }).then(handleRes).catch((err) => ({ err, id }))));
    const failed = results.filter(r => r && r.err);
    if (failed.length) throw new Error(`Failed to delete ${failed.length} of ${trashedIds.length} notes`);
  },
  getFolders:   async ()         => handleRes(await fetch('/api/folders',       { headers:{ 'x-auth-token':getToken()||'' } })),
  createFolder: async (name)     => handleRes(await fetch('/api/folders',       { method:'POST',   headers:{ 'Content-Type':'application/json', 'x-auth-token':getToken()||'' }, body:JSON.stringify({ name }) })),
  deleteFolder: async (id)       => handleRes(await fetch(`/api/folders/${id}`, { method:'DELETE', headers:{ 'x-auth-token':getToken()||'' } })),
  renameFolder: async (id, name) => handleRes(await fetch(`/api/folders/${id}`, { method:'PATCH',  headers:{ 'Content-Type':'application/json', 'x-auth-token':getToken()||'' }, body:JSON.stringify({ name }) })),
  changePassword: async (currentPassword, newPassword) => handleRes(await fetch('/api/auth/password', { method:'PUT', headers:{ 'Content-Type':'application/json', 'x-auth-token':getToken()||'' }, body:JSON.stringify({ currentPassword, newPassword }) })),
  deleteAccount:  async () => handleRes(await fetch('/api/auth/account', { method:'DELETE', headers:{ 'x-auth-token':getToken()||'' } })),
};

const getUserInfo = () => {
  const ssName  = sessionStorage.getItem('userName')  || '';
  const ssEmail = sessionStorage.getItem('userEmail') || '';
  if (ssName || ssEmail) return { name: ssName, email: ssEmail };
  try {
    const token = getToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { name: payload.user?.name || payload.name || '', email: payload.user?.email || payload.email || '' };
    }
  } catch {}
  return { name: '', email: '' };
};

const TAG_PALETTE = [
  { bg:'rgba(129,140,248,0.15)', text:'#818CF8' },
  { bg:'rgba(52,211,153,0.15)',  text:'#34D399' },
  { bg:'rgba(245,166,35,0.15)',  text:'#F5A623' },
  { bg:'rgba(248,113,113,0.15)', text:'#F87171' },
  { bg:'rgba(96,165,250,0.15)',  text:'#60A5FA' },
];
const tagColor = (tag) => TAG_PALETTE[tag.charCodeAt(0) % TAG_PALETTE.length];

const DragContext = React.createContext(null);

const Icon = ({ d, size=16, color='currentColor', fill='none' }) => (
  <svg width={size} height={size} fill={fill} stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const ConfidencePill = ({ score }) => {
  const color = score >= 90 ? { bg:T.greenDim, text:T.green }
              : score >= 80 ? { bg:T.amberDim, text:T.amber }
              :               { bg:T.redDim,   text:T.red   };
  return <span className="ud-tag" style={{ background:color.bg, color:color.text }}>{score}%</span>;
};

const LoadingScreen = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16 }}>
    <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${T.border}`, borderTopColor:T.amber, animation:'spin 0.8s linear infinite' }} />
    <p style={{ fontFamily:T.font, fontSize:13, color:T.muted }}>Loading your notes…</p>
  </div>
);

const TOAST_ICONS = {
  success: 'M5 13l4 4L19 7',
  error:   'M6 18L18 6M6 6l12 12',
  info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
};
const TOAST_COLORS = { success:T.green, error:T.red, info:T.amber, warning:T.amber };

const Toast = ({ toast }) => (
  <div className={`ud-toast ${toast.type || 'success'}${toast.visible ? ' visible' : ''}`}>
    <Icon d={TOAST_ICONS[toast.type] || TOAST_ICONS.success} size={14} color={TOAST_COLORS[toast.type] || T.green} />
    <span>{toast.message}</span>
  </div>
);

const TagEditorModal = ({ tags, onSave, onClose }) => {
  const [localTags, setLocalTags] = useState([...tags]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  const addTag = () => { const val = input.trim(); if (val && !localTags.includes(val)) setLocalTags(p => [...p, val]); setInput(''); };
  return (
    <div className="ud-modal-overlay" onClick={onClose}>
      <div className="ud-modal" onClick={e => e.stopPropagation()} style={{ width:420 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <p style={{ fontFamily:T.serif, fontSize:20, color:T.cream, margin:0 }}>Edit Tags</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex' }}><Icon d="M6 18L18 6M6 6l12 12" size={16} /></button>
        </div>
        {localTags.length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
            {localTags.map(tag => { const c = tagColor(tag); return (
              <span key={tag} style={{ display:'inline-flex', alignItems:'center', gap:5, background:c.bg, color:c.text, fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', padding:'3px 9px', borderRadius:99, fontFamily:T.font }}>
                {tag}
                <button style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', padding:0, display:'flex', opacity:.7, lineHeight:1 }} onClick={() => setLocalTags(p => p.filter(t => t !== tag))}><Icon d="M6 18L18 6M6 6l12 12" size={10} /></button>
              </span>
            ); })}
          </div>
        )}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          <input ref={inputRef} className="ud-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a tag and press Enter…" onKeyDown={e => { if (e.key==='Enter') { e.preventDefault(); addTag(); } if (e.key==='Escape') onClose(); }} />
          <button className="ud-btn-ghost" onClick={addTag} style={{ flexShrink:0 }}>Add</button>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="ud-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ud-btn-amber" onClick={() => { onSave(localTags); onClose(); }}><Icon d="M5 13l4 4L19 7" size={14} color="#0E1117" /> Save Tags</button>
        </div>
      </div>
    </div>
  );
};

const TrashConfirmModal = ({ noteTitle, onConfirm, onCancel }) => (
  <div className="ud-modal-overlay" onClick={onCancel}>
    <div className="ud-modal" onClick={e => e.stopPropagation()} style={{ width:400 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:T.redDim, border:`1px solid rgba(248,113,113,.25)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={18} color={T.red} />
        </div>
        <div>
          <p style={{ fontFamily:T.serif, fontSize:18, color:T.cream, margin:'0 0 3px' }}>Move to Trash?</p>
          <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0 }}>This note will be moved to trash and can be restored later.</p>
        </div>
      </div>
      <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 14px', marginBottom:20 }}>
        <p style={{ fontFamily:T.font, fontSize:13, color:T.cream, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>"{noteTitle}"</p>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="ud-btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="ud-btn-red" onClick={onConfirm}><Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14} color="#0E1117" />Move to Trash</button>
      </div>
    </div>
  </div>
);

const MassTrashConfirmModal = ({ count, onConfirm, onCancel }) => (
  <div className="ud-modal-overlay" onClick={onCancel}>
    <div className="ud-modal" onClick={e => e.stopPropagation()} style={{ width:400 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:T.redDim, border:`1px solid rgba(248,113,113,.25)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={18} color={T.red} />
        </div>
        <div>
          <p style={{ fontFamily:T.serif, fontSize:18, color:T.cream, margin:'0 0 3px' }}>Move {count} note{count !== 1 ? 's' : ''} to Trash?</p>
          <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0 }}>These notes will be moved to trash and can be restored later.</p>
        </div>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="ud-btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="ud-btn-red" onClick={onConfirm}><Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14} color="#0E1117" />Move to Trash</button>
      </div>
    </div>
  </div>
);

const NewFolderModal = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  return createPortal(
    <div className="ud-modal-overlay">
      <div className="ud-modal">
        <p style={{ fontFamily:T.serif, fontSize:20, color:T.cream, margin:'0 0 20px' }}>New Folder</p>
        <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:T.muted, marginBottom:8, fontFamily:T.font }}>Folder name</label>
        <input className="ud-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Math, Biology…" autoFocus onKeyDown={e => e.key==='Enter' && name.trim() && onSave(name.trim())} />
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button className="ud-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ud-btn-amber" style={{ opacity:name.trim()?1:0.4 }} onClick={() => name.trim() && onSave(name.trim())}><Icon d="M12 4v16m8-8H4" size={13} color="#0E1117" /> Create</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const MoveToFolderModal = ({ folders, currentFolderId, onMove, onClose, onCreateFolder }) =>
  createPortal(
    <div className="ud-modal-overlay" onClick={onClose}>
      <div className="ud-modal" onClick={e => e.stopPropagation()} style={{ width:340 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <p style={{ fontFamily:T.serif, fontSize:20, color:T.cream, margin:0 }}>Move to Folder</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex' }}><Icon d="M6 18L18 6M6 6l12 12" size={16} /></button>
        </div>
        {folders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0 8px' }}>
            <div style={{ width:44, height:44, borderRadius:12, background:T.surfaceHi, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Icon d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" size={20} color={T.muted} />
            </div>
            <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'0 auto 16px' }}>No folders yet.</p>
            <button className="ud-btn-amber" onClick={() => { onClose(); onCreateFolder(); }}><Icon d="M12 4v16m8-8H4" size={13} color="#0E1117" />New Folder</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {folders.map(folder => {
              const isCurrent = folder.id === currentFolderId;
              return (
                <button key={folder.id} className="ud-dot-item" onClick={() => { if (!isCurrent) { onMove(folder.id); onClose(); } }} style={{ opacity:isCurrent?0.5:1, cursor:isCurrent?'default':'pointer' }}>
                  <Icon d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" size={14} color={isCurrent?T.amber:'currentColor'} />
                  {folder.name}
                  {isCurrent && <span style={{ marginLeft:'auto', fontSize:10, color:T.amber, fontWeight:700, fontFamily:T.font, letterSpacing:'0.5px' }}>Current</span>}
                </button>
              );
            })}
            {currentFolderId && (
              <>
                <div className="ud-dot-sep" />
                <button className="ud-dot-item" onClick={() => { onMove(null); onClose(); }}>
                  <Icon d="M6 18L18 6M6 6l12 12" size={14} />
                  Remove from folder
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );

// ── FoldersStrip ──────────────────────────────────────────────────────────────
const FoldersStrip = ({ folders, notes, selectedFolderId, onSelect, onAdd, onDelete, onRename, onDropNote, onSameFolder, search='' }) => {
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal,  setRenameVal]  = useState('');
  const [dragOverId, setDragOverId] = useState(undefined);
  const [collapsed,  setCollapsed]  = useState(false);

  // draggingNoteId from context — still valid at drop time since onDragEnd
  // fires AFTER onDrop, so context state hasn't been cleared yet.
  const { draggingNoteId } = React.useContext(DragContext);

  // Visual hover state — fine to derive from context
  const draggingNote       = draggingNoteId ? notes.find(n => n.id === draggingNoteId) : null;
  const alreadyInFolderViz = (fid) => fid === null ? !draggingNote?.folderId : draggingNote?.folderId === fid;

  const visible = search.trim() ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : folders;
  const count   = (fid) => notes.filter(n => n.folderId === fid).length;

  const handleDragOver = (e, id) => { if (!draggingNoteId) return; e.preventDefault(); setDragOverId(id); };

  const handleDrop = (e, fid) => {
    e.preventDefault();
    // Use draggingNoteId from context as primary source — it's still set because
    // onDragEnd (which clears it) fires after onDrop. Fall back to dataTransfer
    // for safety. This is more reliable than dataTransfer alone, which can be
    // empty by drop time in some browsers.
    const nid = draggingNoteId || e.dataTransfer.getData('noteId');
    if (nid) {
      const droppedNote = notes.find(n => n.id === nid);
      const alreadyHere = fid === null
        ? (!droppedNote?.folderId)
        : droppedNote?.folderId === fid;

      if (alreadyHere) {
        onSameFolder(nid, fid, folders);
      } else {
        onDropNote(nid, fid);
      }
    }
    setDragOverId(undefined);
  };

  return (
    <div style={{ marginBottom:16 }}>
      <button onClick={() => setCollapsed(v => !v)} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:collapsed?0:12, background:'none', border:'none', cursor:'pointer', padding:0, width:'100%' }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.muted, fontFamily:T.font }}>Folders</span>
        <Icon d={collapsed?'M9 5l7 7-7 7':'M19 9l-7 7-7-7'} size={16} color={T.amber} />
        <span style={{ fontSize:10, fontWeight:700, background:T.surfaceHi, color:T.muted, borderRadius:99, padding:'1px 7px', fontFamily:T.font }}>{folders.length}</span>
      </button>
      {!collapsed && (
        <>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button
              className={[
                'ud-folder-chip',
                selectedFolderId === null ? 'active' : '',
                draggingNoteId && dragOverId === null && !alreadyInFolderViz(null) ? 'dragover'      : '',
                draggingNoteId && dragOverId === null &&  alreadyInFolderViz(null) ? 'dragover-same' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelect(null)}
              onDragOver={e => handleDragOver(e, null)}
              onDragLeave={() => setDragOverId(undefined)}
              onDrop={e => handleDrop(e, null)}
            >
              <Icon d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" size={13} />
              {draggingNoteId && dragOverId === null
                ? alreadyInFolderViz(null) ? 'Already unfoldered' : 'Remove folder'
                : 'All Notes'}
              <span style={{ fontSize:10, fontWeight:700, color:'inherit', opacity:.7 }}>{notes.length}</span>
            </button>

            {visible.map(folder => {
              const isActive  = selectedFolderId === folder.id;
              const isDragOver = draggingNoteId && dragOverId === folder.id;
              const isSameViz  = isDragOver && alreadyInFolderViz(folder.id);

              return renamingId === folder.id ? (
                <input key={folder.id} className="ud-input" autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)} style={{ width:120, padding:'5px 10px', fontSize:12 }}
                  onKeyDown={e => { if (e.key==='Enter'&&renameVal.trim()) { onRename(folder.id,renameVal.trim()); setRenamingId(null); } if (e.key==='Escape') setRenamingId(null); }}
                  onBlur={() => setRenamingId(null)} />
              ) : (
                <div key={folder.id} style={{ position:'relative', display:'inline-flex' }}>
                  <button
                    className={[
                      'ud-folder-chip',
                      isActive               ? 'active'        : '',
                      isDragOver && !isSameViz ? 'dragover'    : '',
                      isSameViz              ? 'dragover-same'  : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => onSelect(folder.id)}
                    onDragOver={e => handleDragOver(e, folder.id)}
                    onDragLeave={() => setDragOverId(undefined)}
                    onDrop={e => handleDrop(e, folder.id)}
                    onDoubleClick={() => { setRenamingId(folder.id); setRenameVal(folder.name); }}
                  >
                    <Icon d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" size={13} />
                    {isDragOver
                      ? isSameViz ? `Already in ${folder.name}` : `Move to ${folder.name}`
                      : folder.name}
                    <span style={{ fontSize:10, fontWeight:700, color:'inherit', opacity:.7 }}>{count(folder.id)}</span>
                    <button style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', opacity:.5, padding:0, display:'flex', lineHeight:1, marginLeft:2 }} onClick={e => { e.stopPropagation(); onDelete(folder.id); }}><Icon d="M6 18L18 6M6 6l12 12" size={10} /></button>
                  </button>
                </div>
              );
            })}

            <button onClick={onAdd} title="New folder" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:38, height:34, borderRadius:8, border:`1px dashed rgba(255,255,255,0.18)`, background:'transparent', cursor:'pointer', color:T.muted, transition:'border-color .15s, color .15s', flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(245,166,35,.4)'; e.currentTarget.style.color=T.amber; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'; e.currentTarget.style.color=T.muted; }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11v4m-2-2h4" />
              </svg>
            </button>
          </div>
          {draggingNoteId && <p style={{ fontSize:11, color:T.muted, fontFamily:T.font, margin:'8px 0 0', fontStyle:'italic' }}>Drop onto a folder to move the note</p>}
        </>
      )}
    </div>
  );
};

// ── NoteCard ──────────────────────────────────────────────────────────────────
const NoteCard = ({ note, onOpen, onToggleFavorite, onDelete, onUpdateTags, folders=[], onMoveNote, onRemoveFromFolder, onCreateFolder, selectionMode=false, selected=false, onToggleSelect, onEnterSelectionMode }) => {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [menuPos,    setMenuPos]    = useState({ top:0, right:0 });
  const [trashModal, setTrashModal] = useState(false);
  const [tagModal,   setTagModal]   = useState(false);
  const [moveModal,  setMoveModal]  = useState(false);
  const menuRef        = useRef(null);
  const longPressTimer = useRef(null);
  const didLongPress   = useRef(false);
  const { draggingNoteId, setDraggingNoteId } = React.useContext(DragContext);
  const isDragging = draggingNoteId === note.id;
  const folderName = note.folderId ? folders.find(f => f.id === note.folderId)?.name : null;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleDotClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top:rect.bottom+6, right:window.innerWidth-rect.right });
    setMenuOpen(v => !v);
  };

  const handleMouseDown = () => {
    if (selectionMode) return;
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => { didLongPress.current = true; onEnterSelectionMode(note.id); }, 500);
  };
  const handleMouseUp = () => { clearTimeout(longPressTimer.current); };
  const handleClick   = () => {
    if (didLongPress.current) { didLongPress.current = false; return; }
    if (selectionMode) { onToggleSelect(note.id); return; }
    if (!menuOpen && !trashModal && !tagModal) onOpen(note);
  };

  return (
    <>
      <div
        className="ud-card ud-card-clickable"
        draggable={!selectionMode}
        onDragStart={e => { clearTimeout(longPressTimer.current); didLongPress.current = false; e.dataTransfer.setData('noteId', note.id); e.dataTransfer.effectAllowed='move'; setDraggingNoteId(note.id); }}
        onDragEnd={() => setDraggingNoteId(null)}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        style={{ padding:18, display:'flex', flexDirection:'column', gap:10, cursor:isDragging?'grabbing':'pointer', opacity:isDragging?0.5:1, transform:isDragging?'rotate(1.5deg) scale(1.02)':'none', transition:'opacity .15s, transform .15s', animation:'fadeUp .3s ease both', outline:selected?`2px solid ${T.amber}`:'none', outlineOffset:2, height:170, overflow:'hidden' }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ minHeight:16, display:'flex', alignItems:'center' }}>
            {selectionMode ? (
              <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${selected?T.amber:T.border}`, background:selected?T.amber:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                {selected && <Icon d="M5 13l4 4L19 7" size={10} color="#0E1117" />}
              </div>
            ) : (
              note.favorite && <Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={13} color={T.amber} fill={T.amber} />
            )}
          </div>
          {!selectionMode && (
            <button onClick={handleDotClick} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, padding:'2px 6px', borderRadius:6, display:'flex', flexDirection:'column', gap:3 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:3, height:3, borderRadius:'50%', background:'currentColor' }} />)}
            </button>
          )}
        </div>
        <div>
          <p style={{ fontFamily:T.font, fontSize:14, fontWeight:600, color:T.cream, margin:'0 0 5px', lineHeight:1.3 }}>{note.title}</p>
          <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0, lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{note.aiSummary || note.preview}</p>
        </div>
        {note.tags.length > 0 && (
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
            {note.tags.map(tag => { const c = tagColor(tag); return <span key={tag} className="ud-tag" style={{ background:c.bg, color:c.text }}>{tag}</span>; })}
          </div>
        )}
        <div style={{ marginTop:'auto', paddingTop:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
              {note.confidence !== null && <ConfidencePill score={note.confidence} />}
              {folderName && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:500, color:T.muted, fontFamily:T.font, background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:99, padding:'2px 8px', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:1 }}>
                  <Icon d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" size={10} color={T.muted} />
                  {folderName}
                </span>
              )}
            </div>
            <span style={{ fontFamily:T.font, fontSize:11, color:T.muted, flexShrink:0 }}>{note.date}</span>
          </div>
        </div>
      </div>

      {menuOpen && createPortal(
        <div ref={menuRef} className="ud-dot-menu" style={{ top:menuPos.top, right:menuPos.right, border:'none' }}>
          <button className="ud-dot-item" onClick={e => { e.stopPropagation(); onToggleFavorite(note.id); setMenuOpen(false); }}>
            <Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={14} color={note.favorite?T.amber:'currentColor'} fill={note.favorite?T.amber:'none'} />
            {note.favorite ? 'Remove from favorites' : 'Add to favorites'}
          </button>
          <button className="ud-dot-item" onClick={e => { e.stopPropagation(); setMenuOpen(false); setTagModal(true); }}>
            <Icon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" size={14} />
            Edit tags
          </button>
          <button className="ud-dot-item" onClick={e => { e.stopPropagation(); setMenuOpen(false); setMoveModal(true); }}>
            <Icon d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" size={14} />
            Move to folder
          </button>
          {note.folderId && (
            <button className="ud-dot-item" onClick={e => { e.stopPropagation(); onRemoveFromFolder(note.id); setMenuOpen(false); }}>
              <Icon d="M6 18L18 6M6 6l12 12" size={14} />
              Remove from folder
            </button>
          )}
          <div className="ud-dot-sep" />
          <button className="ud-dot-item danger" onClick={e => { e.stopPropagation(); setMenuOpen(false); setTrashModal(true); }}>
            <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14} color={T.red} />
            Move to Trash
          </button>
        </div>,
        document.body
      )}
      {trashModal && createPortal(<TrashConfirmModal noteTitle={note.title} onConfirm={() => { setTrashModal(false); onDelete(note.id); }} onCancel={() => setTrashModal(false)} />, document.body)}
      {tagModal   && createPortal(<TagEditorModal tags={note.tags} onSave={(tags) => onUpdateTags(note.id, tags)} onClose={() => setTagModal(false)} />, document.body)}
      {moveModal  && <MoveToFolderModal folders={folders} currentFolderId={note.folderId??null} onMove={folderId => onMoveNote(note.id, folderId)} onClose={() => setMoveModal(false)} onCreateFolder={onCreateFolder} />}
    </>
  );
};

// ─── Notes home ───────────────────────────────────────────────────────────────
const NotesHome = ({ notes, onNewScan, onNoteSelect, onToggleFavorite, onDelete, onMassDelete, onAddFolder, onDeleteFolder, onRenameFolder, onMoveNote, onRemoveFromFolder, onUpdateTags, folders, onSameFolder }) => {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [sortBy,           setSortBy]           = useState('date');
  const [search,           setSearch]           = useState('');
  const [notesCollapsed,   setNotesCollapsed]   = useState(false);
  const [selectionMode,    setSelectionMode]    = useState(false);
  const [selectedIds,      setSelectedIds]      = useState(new Set());
  const [massTrashModal,   setMassTrashModal]   = useState(false);

  const visible  = selectedFolderId === null ? notes : notes.filter(n => n.folderId === selectedFolderId);
  const filtered = visible.filter(n => { const q = search.toLowerCase(); const fn = folders.find(f => f.id === n.folderId)?.name || ''; return n.title.toLowerCase().includes(q) || n.preview.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q)) || fn.toLowerCase().includes(q); });
  const sorted   = [...filtered].sort((a,b) => sortBy==='alpha' ? a.title.localeCompare(b.title) : sortBy==='confidence' ? b.confidence-a.confidence : 0);

  const toggleSelect    = (id) => { setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); if (next.size === 0) exitSelection(); return next; }); };
  const toggleSelectAll = ()   => { if (selectedIds.size === sorted.length) setSelectedIds(new Set()); else setSelectedIds(new Set(sorted.map(n => n.id))); };
  const exitSelection   = ()   => { setSelectionMode(false); setSelectedIds(new Set()); };
  const handleEnterSelectionMode = (id) => { setSelectionMode(true); setSelectedIds(new Set([id])); };

  useEffect(() => {
    if (!selectionMode) return;
    const handler = (e) => { if (e.key === 'Escape') exitSelection(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectionMode]);

  const handleMassTrash = () => { onMassDelete([...selectedIds]); exitSelection(); setMassTrashModal(false); };

  return (
    <div style={{ animation:'fadeUp .35s ease both' }}>
      <div style={{ marginBottom:28 }}>
        <p style={{ fontFamily:T.font, fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 6px' }}>Your Library</p>
        <h1 style={{ fontFamily:T.serif, fontSize:32, fontWeight:400, color:T.cream, margin:0, lineHeight:1.1 }}>My Notes</h1>
        <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'6px 0 0' }}>{sorted.length} note{sorted.length !== 1 ? 's' : ''}</p>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'9px 14px', marginBottom:20 }}>
        <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" size={15} color={T.muted} />
        <input className="ud-input" style={{ border:'none', background:'transparent', padding:0, flex:1, fontSize:13 }} type="text" placeholder="Search notes, tags, folders…" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex', padding:0 }} onClick={() => setSearch('')}><Icon d="M6 18L18 6M6 6l12 12" size={13} /></button>}
      </div>

      <FoldersStrip
        folders={folders} notes={notes} selectedFolderId={selectedFolderId}
        onSelect={setSelectedFolderId} onAdd={onAddFolder} onDelete={onDeleteFolder}
        onRename={onRenameFolder} onDropNote={onMoveNote} onSameFolder={onSameFolder} search={search}
      />

      <div style={{ display:'flex', alignItems:'center', marginBottom:notesCollapsed?0:14 }}>
        <button onClick={() => setNotesCollapsed(v => !v)} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', padding:0, flex:1 }}>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.muted, fontFamily:T.font }}>Notes</span>
          <Icon d={notesCollapsed?'M9 5l7 7-7 7':'M19 9l-7 7-7-7'} size={16} color={T.amber} />
          <span style={{ fontSize:10, fontWeight:700, background:T.surfaceHi, color:T.muted, borderRadius:99, padding:'1px 7px', fontFamily:T.font }}>{sorted.length}</span>
        </button>
        {!notesCollapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Icon d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" size={13} color={T.muted} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, color:T.cream, borderRadius:7, padding:'4px 10px', fontSize:12, fontFamily:T.font, fontWeight:500, cursor:'pointer', outline:'none', appearance:'none', paddingRight:24, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B7694' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 8px center' }}>
              <option value="date">Recent</option>
              <option value="alpha">A – Z</option>
              <option value="confidence">Confidence</option>
            </select>
          </div>
        )}
      </div>

      {selectionMode && !notesCollapsed && sorted.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, padding:'8px 12px', background:T.surfaceHi, borderRadius:10, border:`1px solid ${T.border}` }}>
          <button onClick={toggleSelectAll} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:T.muted, fontFamily:T.font, fontSize:13, padding:0 }}>
            <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${selectedIds.size===sorted.length?T.amber:T.border}`, background:selectedIds.size===sorted.length?T.amber:'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
              {selectedIds.size===sorted.length && <Icon d="M5 13l4 4L19 7" size={10} color="#0E1117" />}
            </div>
            <span style={{ color:T.cream }}>{selectedIds.size===sorted.length?'Deselect All':'Select All'}</span>
          </button>
          <span style={{ fontSize:12, color:T.muted, marginLeft:'auto' }}>{selectedIds.size} selected</span>
        </div>
      )}

      {!notesCollapsed && (
        sorted.length === 0 ? (
          search ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:12 }}>
              <div style={{ width:60, height:60, borderRadius:16, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" size={24} color={T.muted} />
              </div>
              <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:0 }}>No notes found for "{search}"</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:20 }}>
              <div style={{ position:'relative', width:96, height:96 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:24, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={36} color={T.muted} />
                </div>
                <div style={{ position:'absolute', top:-8, right:-8, width:28, height:28, borderRadius:99, background:T.amberDim, border:`1px solid rgba(245,166,35,.3)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d="M12 4v16m8-8H4" size={14} color={T.amber} />
                </div>
              </div>
              <div style={{ textAlign:'center', maxWidth:320 }}>
                <p style={{ fontFamily:T.serif, fontSize:22, fontWeight:400, color:T.cream, margin:'0 0 10px' }}>No notes yet</p>
                <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'0 0 6px', lineHeight:1.7 }}>Upload a photo or image of your handwritten notes and NoteScan will convert them to digital text instantly.</p>
                <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:'0 0 24px', lineHeight:1.7, opacity:.7 }}>Click <strong style={{ color:T.cream }}>New Scan</strong> in the sidebar, or use the button below to get started.</p>
                <button onClick={onNewScan} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 22px', borderRadius:10, background:T.amber, border:'none', color:'#0E1117', fontFamily:T.font, fontSize:13, fontWeight:600, cursor:'pointer', transition:'opacity .2s, transform .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; }}>
                  <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={14} color="#0E1117" />
                  Scan your first note
                </button>
              </div>
            </div>
          )
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
            {sorted.map(n => (
              <NoteCard key={n.id} note={n} onOpen={onNoteSelect} onToggleFavorite={onToggleFavorite} onDelete={onDelete} onUpdateTags={onUpdateTags} folders={folders} onMoveNote={onMoveNote} onRemoveFromFolder={onRemoveFromFolder} onCreateFolder={onAddFolder} selectionMode={selectionMode} selected={selectedIds.has(n.id)} onToggleSelect={toggleSelect} onEnterSelectionMode={handleEnterSelectionMode} />
            ))}
          </div>
        )
      )}

      {selectionMode && selectedIds.size > 0 && createPortal(
        <div className="ud-mass-bar">
          <span style={{ fontSize:13, fontWeight:600, color:T.cream }}>{selectedIds.size} note{selectedIds.size!==1?'s':''} selected</span>
          <div style={{ width:1, height:20, background:T.border }} />
          <button className="ud-btn-red" onClick={() => setMassTrashModal(true)} style={{ padding:'7px 16px', fontSize:13 }}>
            <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14} color="#0E1117" />
            Move to Trash
          </button>
          <button className="ud-btn-ghost" onClick={exitSelection} style={{ fontSize:13 }}>Cancel</button>
        </div>,
        document.body
      )}
      {massTrashModal && createPortal(<MassTrashConfirmModal count={selectedIds.size} onConfirm={handleMassTrash} onCancel={() => setMassTrashModal(false)} />, document.body)}
    </div>
  );
};

// ─── Trash page ───────────────────────────────────────────────────────────────
const TrashPage = ({ notes, onRestore, onPermanentDelete, onEmptyTrash }) => (
  <div style={{ animation:'fadeUp .35s ease both' }}>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
      <div>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 6px', fontFamily:T.font }}>Deleted</p>
        <h1 style={{ fontFamily:T.serif, fontSize:32, fontWeight:400, color:T.cream, margin:0, lineHeight:1.1 }}>Trash</h1>
        <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'6px 0 0' }}>{notes.length} deleted note{notes.length!==1?'s':''}</p>
      </div>
      {notes.length > 0 && (
        <button className="ud-btn-ghost" onClick={onEmptyTrash} style={{ borderColor:'rgba(248,113,113,.3)', color:T.red, marginTop:4 }}>
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={13} />
          Empty Trash
        </button>
      )}
    </div>
    {notes.length > 0 && (
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, marginBottom:24 }}>
        <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} color={T.red} />
        <p style={{ fontFamily:T.font, fontSize:13, color:T.red, margin:0 }}>Notes in trash can be restored or permanently deleted. Permanent deletion cannot be undone.</p>
      </div>
    )}
    {notes.length === 0 ? (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0', gap:20 }}>
        <div style={{ width:96, height:96, borderRadius:24, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={36} color={T.muted} />
        </div>
        <div style={{ textAlign:'center', maxWidth:280 }}>
          <p style={{ fontFamily:T.serif, fontSize:22, fontWeight:400, color:T.cream, margin:'0 0 8px' }}>Trash is empty</p>
          <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:0, lineHeight:1.6 }}>Deleted notes will appear here. You can restore or permanently delete them.</p>
        </div>
      </div>
    ) : (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {notes.map(note => (
          <div key={note.id} className="ud-card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16, borderRadius:14 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:T.redDim, border:`1px solid rgba(248,113,113,.15)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={16} color={T.red} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontFamily:T.font, fontSize:14, fontWeight:600, color:T.cream, margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.title}</p>
              <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.5 }}>{note.preview || 'No preview available'}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={12} color={T.muted} />
              <span style={{ fontFamily:T.font, fontSize:12, color:T.muted, whiteSpace:'nowrap' }}>{note.date}</span>
            </div>
            <div style={{ width:1, height:28, background:T.border, flexShrink:0 }} />
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <button className="ud-btn-ghost" onClick={() => onRestore(note.id)} style={{ fontSize:12, padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }}>
                <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={12} />
                Restore
              </button>
              <button className="ud-btn-ghost" onClick={() => onPermanentDelete(note.id)} style={{ fontSize:12, padding:'6px 14px', borderColor:'rgba(248,113,113,.25)', color:T.red, display:'flex', alignItems:'center', gap:6 }}>
                <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={12} color={T.red} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Favorites home ───────────────────────────────────────────────────────────
const FavoritesHome = ({ notes, folders, onNoteSelect, onToggleFavorite, onDelete, onUpdateTags, onMoveNote, onRemoveFromFolder, onAddFolder, onNewScan }) => {
  const [search, setSearch] = useState('');
  const favoriteNotes = notes.filter(n => n.favorite);
  const filtered = favoriteNotes.filter(n => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return n.title.toLowerCase().includes(q) || n.preview.toLowerCase().includes(q) || n.tags.join(' ').toLowerCase().includes(q);
  });

  return (
    <div style={{ fontFamily:T.font, animation:'fadeUp .35s ease both' }}>
      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 6px', fontFamily:T.font }}>Starred</p>
        <h1 style={{ fontFamily:T.serif, fontSize:32, fontWeight:400, color:T.cream, margin:0, lineHeight:1.1 }}>Favorites</h1>
        <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'6px 0 0' }}>{favoriteNotes.length} favorited note{favoriteNotes.length !== 1 ? 's' : ''}</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'9px 14px', marginBottom:24 }}>
        <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" size={15} color={T.muted} />
        <input type="text" placeholder="Search favorites…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:T.font, fontSize:13, color:T.cream }} />
        {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex', padding:0 }}><Icon d="M6 18L18 6M6 6l12 12" size={13} /></button>}
      </div>

      {favoriteNotes.length === 0 && (
        notes.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0', gap:20 }}>
            <div style={{ position:'relative', width:96, height:96 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:24, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={36} color={T.muted} />
              </div>
              <div style={{ position:'absolute', top:-8, right:-8, width:28, height:28, borderRadius:99, background:T.amberDim, border:`1px solid rgba(245,166,35,.3)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M12 4v16m8-8H4" size={14} color={T.amber} />
              </div>
            </div>
            <div style={{ textAlign:'center', maxWidth:300 }}>
              <p style={{ fontFamily:T.serif, fontSize:22, fontWeight:400, color:T.cream, margin:'0 0 8px' }}>No favorites yet</p>
              <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:0, lineHeight:1.7 }}>
                Open any note, click the <strong style={{ color:T.cream }}>⋯</strong> menu, and select <strong style={{ color:T.cream }}>Add to favorites</strong> to star it.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0', gap:20 }}>
            <div style={{ position:'relative', width:96, height:96 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:24, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={36} color={T.muted} />
              </div>
              <div style={{ position:'absolute', top:-8, right:-8, width:28, height:28, borderRadius:99, background:T.amberDim, border:`1px solid rgba(245,166,35,.3)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={14} color={T.amber} />
              </div>
            </div>
            <div style={{ textAlign:'center', maxWidth:300 }}>
              <p style={{ fontFamily:T.serif, fontSize:22, fontWeight:400, color:T.cream, margin:'0 0 8px' }}>No favorites yet</p>
              <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'0 0 24px', lineHeight:1.6 }}>Star your most important notes to keep them at your fingertips. Scan a note to get started.</p>
              <button onClick={onNewScan} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, background:T.amber, border:'none', color:'#0E1117', fontFamily:T.font, fontSize:13, fontWeight:600, cursor:'pointer', transition:'opacity .2s' }} onMouseEnter={e => e.currentTarget.style.opacity='.88'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={14} color="#0E1117" />
                Scan a new note
              </button>
            </div>
          </div>
        )
      )}

      {favoriteNotes.length > 0 && filtered.length === 0 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 0', gap:8 }}>
          <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:0 }}>No favorites found for "{search}"</p>
        </div>
      )}
      {filtered.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
          {filtered.map(n => (
            <NoteCard key={n.id} note={n} onOpen={onNoteSelect} onToggleFavorite={onToggleFavorite} onDelete={onDelete} onUpdateTags={onUpdateTags} folders={folders} onMoveNote={onMoveNote} onRemoveFromFolder={onRemoveFromFolder} onCreateFolder={onAddFolder} selectionMode={false} selected={false} onToggleSelect={() => {}} onEnterSelectionMode={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
};

const EmptyTrashConfirmModal = ({ count, onConfirm, onCancel }) => (
  <div className="ud-modal-overlay" onClick={onCancel}>
    <div className="ud-modal" onClick={e => e.stopPropagation()} style={{ width:400 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:T.redDim, border:`1px solid rgba(248,113,113,.25)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={18} color={T.red} />
        </div>
        <div>
          <p style={{ fontFamily:T.serif, fontSize:18, color:T.cream, margin:'0 0 3px' }}>Empty Trash?</p>
          <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0 }}>This will permanently delete {count} note{count!==1?'s':''}. This cannot be undone.</p>
        </div>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="ud-btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="ud-btn-red" onClick={onConfirm}>
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14} color="#0E1117" />
          Empty Trash
        </button>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const UserDashboard = ({ onLogout, onProcess, onNewScan, onNoteSelect, showUploadPage=false, showResultsPage=false, initialTab=null, onInitialTabConsumed }) => {
  const [activeTab,      setActiveTab]      = useState(initialTab || 'notes');
  const [notes,          setNotes]          = useState([]);
  const [folders,        setFolders]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showNewFolder,  setShowNewFolder]  = useState(false);
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  const [toast,          setToast]          = useState({ visible:false, message:'', type:'success' });
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const toastTimer = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesData, foldersData] = await Promise.all([
        api.getNotes().catch(() => []),
        api.getFolders().catch(() => []),
      ]);
      setNotes(notesData ?? []);
      setFolders(foldersData ?? []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setNotes([]); setFolders([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (initialTab) { setActiveTab(initialTab); if (onInitialTabConsumed) onInitialTabConsumed(); } }, [initialTab]);
  useEffect(() => { if (showResultsPage) { setActiveTab('results'); return; } if (showUploadPage) { setActiveTab('upload'); return; } }, [showUploadPage, showResultsPage]);

  const showToast = (msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible:true, message:msg, type });
    toastTimer.current = setTimeout(() => setToast(t => ({...t, visible:false})), 2800);
  };

  const handleNewScan = () => { setActiveTab('upload'); if (onNewScan) onNewScan(); };

  // Called when a note is dropped on the folder it already belongs to.
  // Reads from notes state in this scope — always current.
  const handleSameFolder = (noteId, folderId, foldersList) => {
    const note       = notes.find(n => n.id === noteId);
    const noteTitle  = note?.title || 'This note';
    if (folderId === null) {
      showToast(`${noteTitle} is already not in any folder`, 'info');
    } else {
      const folderName = foldersList.find(f => f.id === folderId)?.name || 'this folder';
      showToast(`${noteTitle} is already in ${folderName}`, 'info');
    }
  };

  const handleToggleFavorite = async (id) => {
    const current = notes.find(n => n.id===id)?.favorite ?? false;
    setNotes(p => p.map(n => n.id===id ? {...n, favorite:!n.favorite} : n));
    try { await api.toggleFavorite(id, current); }
    catch { setNotes(p => p.map(n => n.id===id ? {...n, favorite:!n.favorite} : n)); showToast('Failed to update favorite', 'error'); }
  };

  const handleDeleteNote = async (id) => {
    setNotes(p => p.map(n => n.id===id ? {...n, deleted:true, favorite:false} : n));
    showToast('Note moved to trash', 'success');
    try { await api.trashNote(id); }
    catch { setNotes(p => p.map(n => n.id===id ? {...n, deleted:false} : n)); showToast('Failed to move note to trash', 'error'); }
  };

  const handleMassDelete = async (ids) => {
    setNotes(p => p.map(n => ids.includes(n.id) ? {...n, deleted:true, favorite:false} : n));
    showToast(`${ids.length} note${ids.length!==1?'s':''} moved to trash`, 'success');
    try { await Promise.all(ids.map(id => api.trashNote(id))); }
    catch { setNotes(p => p.map(n => ids.includes(n.id) ? {...n, deleted:false} : n)); showToast('Failed to move some notes to trash', 'error'); }
  };

  const handleRestoreNote = async (id) => {
    setNotes(p => p.map(n => n.id===id ? {...n, deleted:false} : n));
    showToast('Note restored', 'success');
    try { await api.restoreNote(id); }
    catch { setNotes(p => p.map(n => n.id===id ? {...n, deleted:true} : n)); showToast('Failed to restore note', 'error'); }
  };

  const handlePermanentDelete = async (id) => {
    const backup = notes.find(n => n.id===id);
    setNotes(p => p.filter(n => n.id!==id));
    try { await api.permanentDelete(id); }
    catch { if (backup) setNotes(p => [...p, backup]); showToast('Failed to delete note', 'error'); }
  };

  const handleEmptyTrash = async () => {
    const trashed = notes.filter(n => n.deleted);
    const trashedIds = trashed.map(n => n.id);
    setNotes(p => p.filter(n => !n.deleted));
    try { await api.emptyTrash(trashedIds); }
    catch { setNotes(p => [...p, ...trashed]); showToast('Failed to empty trash', 'error'); }
  };

  const handleUpdateTags = async (id, tags) => {
    const prev = notes.find(n => n.id===id)?.tags;
    setNotes(p => p.map(n => n.id===id ? {...n, tags} : n));
    try { await api.updateTags(id, tags); }
    catch { if (prev) setNotes(p => p.map(n => n.id===id ? {...n, tags:prev} : n)); showToast('Failed to update tags', 'error'); }
  };

  const handleMoveNote = async (noteId, targetFolderId) => {
    const prev = notes.find(n => n.id===noteId)?.folderId;
    setNotes(p => p.map(n => n.id===noteId ? {...n, folderId:targetFolderId} : n));
    const folderName = targetFolderId ? folders.find(f => f.id===targetFolderId)?.name : null;
    showToast(folderName ? `Moved to ${folderName}` : 'Removed from folder', 'success');
    try { await api.moveNote(noteId, targetFolderId); }
    catch { setNotes(p => p.map(n => n.id===noteId ? {...n, folderId:prev} : n)); showToast('Failed to move note', 'error'); }
  };

  const handleRemoveFromFolder = async (noteId) => {
    const prev = notes.find(n => n.id===noteId)?.folderId;
    if (!prev) return;
    setNotes(p => p.map(n => n.id===noteId ? {...n, folderId:null} : n));
    showToast('Removed from folder', 'success');
    try { await api.moveNote(noteId, null); }
    catch { setNotes(p => p.map(n => n.id===noteId ? {...n, folderId:prev} : n)); showToast('Failed to remove from folder', 'error'); }
  };

  const handleAddFolder = async (name) => {
    setShowNewFolder(false);
    const tempFolder = { id:Date.now().toString(), name };
    setFolders(p => [...p, tempFolder]);
    try {
      const folder = await api.createFolder(name);
      if (folder) setFolders(p => p.map(f => f.id===tempFolder.id ? toFolder(folder) : f));
    } catch { setFolders(p => p.filter(f => f.id!==tempFolder.id)); showToast('Failed to create folder', 'error'); }
  };

  const handleDeleteFolder = async (fid) => {
    const backup = folders.find(f => f.id===fid);
    setFolders(p => p.filter(f => f.id!==fid));
    setNotes(p => p.map(n => n.folderId===fid ? {...n, folderId:null} : n));
    try { await api.deleteFolder(fid); }
    catch { if (backup) setFolders(p => [...p, backup]); showToast('Failed to delete folder', 'error'); }
  };

  const handleRenameFolder = async (id, name) => {
    const prev = folders.find(f => f.id===id)?.name;
    setFolders(p => p.map(f => f.id===id ? {...f, name} : f));
    try { await api.renameFolder(id, name); }
    catch { if (prev) setFolders(p => p.map(f => f.id===id ? {...f, name:prev} : f)); showToast('Failed to rename folder', 'error'); }
  };

  const activeNotes   = notes.filter(n => !n.deleted);
  const trashedNotes  = notes.filter(n => n.deleted);
  const favoriteNotes = activeNotes.filter(n => n.favorite);

  const { name:userName, email:userEmail } = getUserInfo();
  const sidebarName = userName || userEmail || 'My Profile';

  const NAV = [
    { key:'notes',     label:'My Notes',  icon:'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',     onClick:() => setActiveTab('notes') },
    { key:'upload',    label:'New Scan',  icon:'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', onClick:handleNewScan },
    { key:'favorites', label:'Favorites', icon:'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', onClick:() => setActiveTab('favorites') },
    { key:'trash',     label:'Trash',     icon:'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', onClick:() => setActiveTab('trash') },
  ];

  if (loading) return <LoadingScreen />;

  return (
    <DragContext.Provider value={{ draggingNoteId, setDraggingNoteId }}>
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, display:'flex' }}>
        <aside style={{ width:220, background:T.surface, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh' }}>
          <div style={{ padding:'20px 16px 16px', borderBottom:`1px solid ${T.border}` }}>
            <button onClick={() => setActiveTab('notes')} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={17} color="#0E1117" />
              </div>
              <span style={{ fontFamily:T.serif, fontSize:18, color:T.cream }}>NoteScan</span>
            </button>
          </div>
          <nav style={{ padding:'12px 10px', flex:1, display:'flex', flexDirection:'column', gap:2 }}>
            <p style={{ fontFamily:T.font, fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.muted, margin:'4px 4px 8px', opacity:.6 }}>Navigation</p>
            {NAV.map(item => (
              <button key={item.key} className={`ud-nav-item${activeTab===item.key?' active':''}`} onClick={item.onClick}>
                <Icon d={item.icon} size={15} /> {item.label}
                {item.key==='favorites' && favoriteNotes.length>0 && <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, background:T.amberDim, color:T.amber, borderRadius:99, padding:'1px 7px' }}>{favoriteNotes.length}</span>}
                {item.key==='trash'     && trashedNotes.length>0  && <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, background:T.redDim,   color:T.red,   borderRadius:99, padding:'1px 7px' }}>{trashedNotes.length}</span>}
              </button>
            ))}
            {activeTab === 'results' && (<><div style={{ height:1, background:T.border, margin:'8px 4px' }} /><button className="ud-nav-item active" disabled style={{ opacity:.7 }}><Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={15} /> Results</button></>)}
          </nav>
          <div style={{ padding:'12px 10px', borderTop:`1px solid ${T.border}` }}>
            <button className={`ud-nav-item${activeTab==='settings'?' active':''}`} onClick={() => setActiveTab('settings')} style={{ gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:T.amberDim, border:`1px solid rgba(245,166,35,.3)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" size={14} color={T.amber} />
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ margin:0, fontSize:12, fontWeight:600, color:T.cream, fontFamily:T.font, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sidebarName}</p>
                <p style={{ margin:0, fontSize:10, color:T.muted, fontFamily:T.font }}>Settings</p>
              </div>
            </button>
          </div>
        </aside>

        <main className="ud-scrollbar" style={{ flex:1, overflowY:'auto', height:'100vh', boxSizing:'border-box' }}>
          <div style={{ display:activeTab==='results'?'block':'none' }}>
            <ResultsPage onBack={() => setActiveTab('notes')} onSave={() => { api.getNotes().then(data => { setNotes(data); setActiveTab('notes'); }).catch(() => setActiveTab('notes')); }} />
          </div>
          {activeTab !== 'results' && (
            <div style={{ padding:'32px 40px', maxWidth:1100, margin:'0 auto' }}>
              {activeTab === 'notes'     && <NotesHome notes={activeNotes} folders={folders} onNewScan={handleNewScan} onNoteSelect={onNoteSelect} onToggleFavorite={handleToggleFavorite} onDelete={handleDeleteNote} onMassDelete={handleMassDelete} onAddFolder={() => setShowNewFolder(true)} onDeleteFolder={handleDeleteFolder} onRenameFolder={handleRenameFolder} onMoveNote={handleMoveNote} onRemoveFromFolder={handleRemoveFromFolder} onUpdateTags={handleUpdateTags} onSameFolder={handleSameFolder} />}
              {activeTab === 'upload'    && <UploadPage onProcess={() => { setActiveTab('results'); if (onProcess) onProcess(); }} />}
              {activeTab === 'favorites' && <FavoritesHome notes={activeNotes} folders={folders} onNoteSelect={onNoteSelect} onToggleFavorite={handleToggleFavorite} onDelete={handleDeleteNote} onUpdateTags={handleUpdateTags} onMoveNote={handleMoveNote} onRemoveFromFolder={handleRemoveFromFolder} onAddFolder={() => setShowNewFolder(true)} onNewScan={handleNewScan} />}
              {activeTab === 'trash'     && <TrashPage notes={trashedNotes} onRestore={handleRestoreNote} onPermanentDelete={handlePermanentDelete} onEmptyTrash={() => setShowEmptyTrashConfirm(true)} />}
              {activeTab === 'settings'  && <SettingsPage notes={notes} folders={folders} onLogout={onLogout} api={api} />}
            </div>
          )}
        </main>
      </div>

      {showNewFolder && <NewFolderModal onSave={handleAddFolder} onClose={() => setShowNewFolder(false)} />}
      {showEmptyTrashConfirm && createPortal(
        <EmptyTrashConfirmModal
          count={trashedNotes.length}
          onConfirm={() => { setShowEmptyTrashConfirm(false); handleEmptyTrash(); }}
          onCancel={() => setShowEmptyTrashConfirm(false)}
        />,
        document.body
      )}

      <Toast toast={toast} />
    </DragContext.Provider>
  );
};

export default UserDashboard;
