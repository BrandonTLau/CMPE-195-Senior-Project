import { createPortal } from "react-dom";
import React, { useState, useRef, useEffect } from 'react';

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
  font:      '"DM Sans", system-ui, sans-serif',
  serif:     '"DM Serif Display", Georgia, serif',
};

const fontLink = document.createElement('link');
fontLink.rel  = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap';
if (!document.head.querySelector('link[href*="DM+Sans"]')) {
  document.head.appendChild(fontLink);
}

const styleEl = document.createElement('style');
styleEl.textContent = `
  html, body, #root { margin: 0; padding: 0; min-height: 100%; background: #0E1117; }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes tabIn   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideIn { from { opacity:0; transform:scale(0.97)      } to { opacity:1; transform:scale(1)      } }
  @keyframes zoomIn  { from { opacity:0; transform:scale(0.95)      } to { opacity:1; transform:scale(1)      } }
  @keyframes spin    { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }

  .ns-btn-ghost {
    background:transparent; border:1px solid ${T.border}; color:${T.muted};
    border-radius:10px; padding:8px 16px; font-family:${T.font}; font-size:13px;
    font-weight:500; cursor:pointer; display:inline-flex; align-items:center; gap:6px;
    transition:border-color .2s,color .2s,background .2s;
  }
  .ns-btn-ghost:hover { border-color:${T.borderHi}; color:${T.cream}; background:${T.surfaceHi}; }
  .ns-btn-amber {
    background:${T.amber}; border:none; color:#0E1117; border-radius:10px;
    padding:9px 20px; font-family:${T.font}; font-size:13px; font-weight:600;
    cursor:pointer; display:inline-flex; align-items:center; gap:6px;
    transition:opacity .2s,transform .15s;
  }
  .ns-btn-amber:hover  { opacity:.88; transform:translateY(-1px); }
  .ns-btn-amber:disabled { opacity:.45; cursor:default; transform:none; }
  .ns-regen {
    background:${T.surfaceHi}; border:1px solid ${T.border}; color:${T.muted};
    border-radius:8px; padding:6px 12px; font-family:${T.font}; font-size:12px;
    font-weight:500; cursor:pointer; display:inline-flex; align-items:center; gap:5px;
    transition:color .2s,border-color .2s;
  }
  .ns-regen:hover { color:${T.amber}; border-color:${T.amber}; }
  .ns-regen:disabled { opacity:.4; cursor:default; }
  .ns-scrollbar::-webkit-scrollbar       { width:4px; height:4px; }
  .ns-scrollbar::-webkit-scrollbar-track { background:transparent; }
  .ns-scrollbar::-webkit-scrollbar-thumb { background:${T.border}; border-radius:99px; }
  .ns-tag {
    display:inline-block; font-size:9px; font-weight:700; letter-spacing:1.5px;
    text-transform:uppercase; padding:2px 8px; border-radius:99px;
  }
  .ns-tab {
    display:flex; align-items:center; gap:8px;
    padding:10px 18px; border-radius:10px; cursor:pointer;
    font-family:${T.font}; font-size:13px; font-weight:500;
    color:${T.muted}; border:1px solid transparent;
    transition:color .15s,background .15s,border-color .15s;
    white-space:nowrap; background:transparent;
  }
  .ns-tab:hover  { color:${T.cream}; background:${T.surfaceHi}; }
  .ns-tab.active { color:${T.amber}; background:${T.amberDim}; border-color:rgba(245,166,35,.25); }
  .ns-tab-panel  { animation:tabIn .25s ease both; }

  .ns-toolbar {
    display:flex; align-items:center; gap:3px; flex-wrap:wrap;
    padding:8px 12px; background:${T.bg};
    border:1px solid ${T.border}; border-bottom:none;
    border-radius:12px 12px 0 0;
  }
  .ns-toolbar.fullscreen-bar {
    border-radius:0; border-left:none; border-right:none; border-top:none;
    border-bottom:1px solid ${T.border}; position:sticky; top:0; z-index:10;
    background:${T.bg}f0; backdrop-filter:blur(10px);
  }
  .ns-tool {
    background:transparent; border:1px solid transparent;
    color:${T.muted}; border-radius:6px; padding:5px 9px;
    font-family:${T.font}; font-size:12px; font-weight:600;
    cursor:pointer; display:inline-flex; align-items:center; gap:4px;
    transition:color .15s,background .15s,border-color .15s;
    white-space:nowrap; line-height:1; min-width:28px; justify-content:center;
  }
  .ns-tool:hover   { color:${T.cream}; background:${T.surfaceHi}; border-color:${T.border}; }
  .ns-tool.pressed { color:${T.amber}; background:${T.amberDim}; border-color:rgba(245,166,35,.25); }
  .ns-tool-sep { width:1px; height:16px; background:${T.border}; margin:0 3px; flex-shrink:0; align-self:center; }

  .ns-editable {
    background:${T.surfaceHi}; border:1px solid ${T.border};
    border-radius:0 0 12px 12px;
    padding:20px 24px; min-height:300px; max-height:480px;
    overflow-y:auto; outline:none;
    font-family:${T.font}; font-size:14px; line-height:1.8;
    color:${T.cream}; caret-color:${T.amber};
    transition:border-color .2s;
  }
  .ns-editable.fullscreen-body {
    border-radius:0; border:none; max-height:none;
    flex:1; padding:40px 80px; font-size:16px; line-height:1.9;
  }
  .ns-editable:focus { border-color:${T.borderHi}; }
  .ns-editable h1 { font-family:${T.serif}; font-size:28px; font-weight:400; color:${T.cream}; margin:4px 0 12px; line-height:1.2; }
  .ns-editable h2 { font-family:${T.serif}; font-size:22px; font-weight:400; color:${T.cream}; margin:4px 0 10px; line-height:1.3; }
  .ns-editable h3 { font-family:${T.font};  font-size:15px; font-weight:600; color:${T.cream}; margin:4px 0 6px; }
  .ns-editable ul, .ns-editable ol { padding-left:22px; margin:4px 0; }
  .ns-editable li { margin-bottom:3px; }
  .ns-editable strong, .ns-editable b { color:${T.cream}; font-weight:700; }
  .ns-editable em,     .ns-editable i { color:#C8C3B5; font-style:italic; }
  .ns-editable p  { margin:0 0 4px; }
  .ns-editable ::selection { background:${T.amberDim}; }
  .ns-editable table { border-collapse:collapse; width:100%; margin:8px 0; }
  .ns-editable th, .ns-editable td { border:1px solid ${T.border}; padding:8px 12px; font-size:13px; text-align:left; }
  .ns-editable th { background:${T.surfaceHi}; font-weight:600; color:${T.amber}; }
  .ns-editable tr:nth-child(even) td { background:rgba(255,255,255,0.02); }

  .ns-title-input {
    font-family:${T.serif}; font-size:38px; font-weight:400;
    line-height:1.1; letter-spacing:-.4px;
    color:${T.cream}; background:transparent;
    border:none; border-bottom:1px solid ${T.border};
    outline:none; width:100%; padding:0 0 4px;
    margin:0 0 8px; transition:border-color .2s;
  }
  .ns-title-input:focus { border-bottom-color:${T.amber}; }
  .ns-title-input::placeholder { color:${T.muted}; }

  .ns-fullscreen {
    position:fixed; inset:0; background:${T.bg}; z-index:500;
    display:flex; flex-direction:column;
    animation:slideIn .2s ease both;
  }
  .ns-fullscreen-inner { flex:1; display:flex; flex-direction:column; overflow:hidden; }

  .ns-export-menu {
    position:absolute; top:calc(100% + 6px); right:0;
    background:${T.surface}; border:1px solid ${T.border};
    border-radius:12px; padding:6px; min-width:190px;
    box-shadow:0 16px 40px rgba(0,0,0,.5); z-index:600;
    animation:tabIn .15s ease both;
  }
  .ns-export-item {
    display:flex; align-items:center; gap:10px;
    padding:9px 12px; border-radius:8px; cursor:pointer;
    font-family:${T.font}; font-size:13px; font-weight:500; color:${T.muted};
    transition:background .15s,color .15s; border:none; background:transparent; width:100%;
  }
  .ns-export-item:hover { background:${T.surfaceHi}; color:${T.cream}; }

  .ns-status-bar {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 24px; border-top:1px solid ${T.border};
    background:${T.bg}; flex-shrink:0;
  }
  .ns-char-count { font-size:11px; color:${T.muted}; font-family:${T.font}; }
  .ns-unsaved    { font-size:11px; color:${T.amber}; font-family:${T.font}; }

  @media print {
    @page { size: A4; margin: 1.2cm 1.5cm; }
    html, body { background: #fff !important; }
    body * { visibility:hidden; background: transparent !important; }
    #ns-print-area, #ns-print-area * { visibility:visible; }
    #ns-print-area {
      position:absolute; left:0; top:0; width:100%;
      font-family:Georgia,serif; font-size:12pt; line-height:1.7;
      color:#111; background:#fff; padding:0; box-sizing:border-box;
    }
    #ns-print-area h1 { font-size:22pt; margin:0 0 10pt; page-break-after:avoid; }
    #ns-print-area h2 { font-size:16pt; margin:10pt 0 8pt; page-break-after:avoid; }
    #ns-print-area h3 { font-size:13pt; font-weight:bold; margin:8pt 0 6pt; page-break-after:avoid; }
    #ns-print-area p  { margin:0 0 6pt; orphans:3; widows:3; }
    #ns-print-area ul, #ns-print-area ol { padding-left:18pt; margin:4pt 0; }
    #ns-print-area li { margin-bottom:3pt; }
    #ns-print-area table { border-collapse:collapse; width:100%; margin:8pt 0; }
    #ns-print-area th, #ns-print-area td { border:1px solid #999; padding:6pt 10pt; font-size:11pt; text-align:left; background:#fff !important; color:#111 !important; }
    #ns-print-area th { font-weight:bold; background:#f5f5f5 !important; }
    #ns-print-area tr:nth-child(even) td { background:#fafafa !important; }
  }
`;
document.head.appendChild(styleEl);

let printDiv = document.getElementById('ns-print-area');
if (!printDiv) {
  printDiv = document.createElement('div');
  printDiv.id = 'ns-print-area';
  document.body.appendChild(printDiv);
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Icon = ({ d, size = 18, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} fill={fill} stroke={color} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

// ── Spinner ───────────────────────────────────────────────────
const Spinner = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} style={{ flexShrink:0, animation:'spin 0.75s linear infinite' }}>
    <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function makeCardId() {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toLearnedMap(cards = []) {
  return Object.fromEntries(
    (Array.isArray(cards) ? cards : []).map((card) => [String(card.cardId || card.id), Boolean(card.learned)])
  );
}

function normalizeFlashcards(cards = [], learnedMap = {}) {
  return (Array.isArray(cards) ? cards : [])
    .map((card, index) => {
      const cardId = String(card?.cardId || card?.id || `card-${index + 1}`);
      return {
        id: cardId, cardId,
        question: String(card?.question || '').trim(),
        answer:   String(card?.answer   || '').trim(),
        learned:  Boolean(card?.learned ?? learnedMap[cardId]),
      };
    })
    .filter((card) => card.question || card.answer);
}

function serializeFlashcards(cards = []) {
  return normalizeFlashcards(cards).map(({ cardId, question, answer }) => ({ cardId, question, answer }));
}

function CardModal({ onSave, onClose, initialValues }) {
  const [q, setQ] = useState(initialValues?.question || '');
  const [a, setA] = useState(initialValues?.answer   || '');
  const valid  = q.trim() && a.trim();
  const isEdit = Boolean(initialValues);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, padding:32, width:440, maxWidth:'90vw', boxShadow:'0 32px 64px rgba(0,0,0,.6)' }}>
        <p style={{ fontFamily:T.serif, fontSize:22, color:T.cream, margin:'0 0 24px' }}>{isEdit ? 'Edit Flashcard' : 'New Flashcard'}</p>
        {[['Question', q, setQ], ['Answer', a, setA]].map(([label, val, set]) => (
          <div key={label} style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:1, textTransform:'uppercase', color:T.muted, marginBottom:8, fontFamily:T.font }}>{label}</label>
            <textarea value={val} onChange={e => set(e.target.value)} rows={3} placeholder={`Enter ${label.toLowerCase()}…`}
              style={{ width:'100%', boxSizing:'border-box', background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, fontFamily:T.font, color:T.cream, resize:'vertical', outline:'none' }} />
          </div>
        ))}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
          <button className="ns-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ns-btn-amber" onClick={() => valid && onSave(q.trim(), a.trim())} style={{ opacity: valid ? 1 : 0.4 }}>{isEdit ? 'Save Changes' : 'Save Card'}</button>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ card, onEdit, onDelete }) {
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const face = { position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', borderRadius:14, border:`1px solid ${T.border}`, display:'flex', flexDirection:'column', padding:'16px 18px', overflow:'hidden' };
  return (
    <div style={{ perspective:700, height:140, flex:'0 0 220px', position:'relative' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div onClick={() => setFlipped(f => !f)} style={{ position:'relative', width:'100%', height:'100%', transformStyle:'preserve-3d', transition:'transform .5s cubic-bezier(.4,0,.2,1)', transform:flipped ? 'rotateY(180deg)' : 'none', cursor:'pointer' }}>
        <div style={{ ...face, background:T.surfaceHi }}>
          <span className="ns-tag" style={{ background:T.amberDim, color:T.amber, marginBottom:10, alignSelf:'flex-start' }}>Q</span>
          <p style={{ fontSize:13, fontWeight:500, color:T.cream, margin:0, lineHeight:1.5, fontFamily:T.font, display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{card.question}</p>
        </div>
        <div style={{ ...face, transform:'rotateY(180deg)', background:T.surfaceHi }}>
          <span className="ns-tag" style={{ background:T.purpleDim, color:T.purple, marginBottom:10, alignSelf:'flex-start' }}>A</span>
          <p style={{ fontSize:13, fontWeight:400, color:T.muted, margin:0, lineHeight:1.5, fontFamily:T.font, display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{card.answer}</p>
        </div>
      </div>
      {hovered && (
        <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:5, zIndex:10 }}>
          <button onClick={e => { e.stopPropagation(); onEdit(card); }} title="Edit card"
            style={{ width:26, height:26, borderRadius:8, background:T.surfaceHi, border:`1px solid ${T.border}`, color:T.muted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'color .15s, border-color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color=T.amber; e.currentTarget.style.borderColor=T.amber; }}
            onMouseLeave={e => { e.currentTarget.style.color=T.muted; e.currentTarget.style.borderColor=T.border; }}>
            <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={13} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(card.id); }} title="Delete card"
            style={{ width:26, height:26, borderRadius:8, background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.2)', color:'#F87171', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(248,113,113,.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(248,113,113,.1)'; }}>
            <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function RichTextEditor({ initialText, initialHtml, onSave, onLiveChange, isFullscreen, onToggleFullscreen }) {
  const editorRef = useRef(null);
  const [editorHTML,    setEditorHTML]    = useState('');
  const [charCount,     setCharCount]     = useState(0);
  const [isDirty,       setIsDirty]       = useState(false);
  const [activeFormats, setActiveFormats] = useState({});

  useEffect(() => {
    if (!editorRef.current) return;
    let html = '';
    if (initialHtml) {
      html = initialHtml;
    } else {
      html = (initialText || '')
        .replace(/\n{2,}/g, '\n\n')
        .split('\n\n')
        .map(para => {
          const lines = para.split('\n').filter(Boolean);
          return `<p>${lines.join(' ') || '<br>'}</p>`;
        })
        .join('');
    }
    setEditorHTML(html);
    setCharCount(editorRef.current.innerText?.length || 0);
    editorRef.current.innerHTML = html;
  }, [initialText, initialHtml]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isFullscreen) onToggleFullscreen(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen, onToggleFullscreen]);

  useEffect(() => {
    if (editorRef.current && editorHTML) editorRef.current.innerHTML = editorHTML;
  }, [isFullscreen]);

  const exec = (cmd, value = null) => { editorRef.current?.focus(); document.execCommand(cmd, false, value); updateFormats(); };
  const updateFormats = () => setActiveFormats({
    bold:                document.queryCommandState('bold'),
    italic:              document.queryCommandState('italic'),
    insertUnorderedList: document.queryCommandState('insertUnorderedList'),
    insertOrderedList:   document.queryCommandState('insertOrderedList'),
    block:               document.queryCommandValue('formatBlock').toLowerCase(),
  });

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText;
    setEditorHTML(html); setCharCount(text.length); setIsDirty(true); updateFormats();
    if (onLiveChange) onLiveChange({ text, html });
  };

  const handleSave = () => {
    setIsDirty(false);
    onSave({ newText: editorRef.current?.innerText || '', html: editorHTML, previousText: initialText });
  };

  const toolbar = (fullscreen = false) => (
    <div className={`ns-toolbar${fullscreen ? ' fullscreen-bar' : ''}`}>
      {['h1','h2','h3'].map((h, i) => {
        const isActive = activeFormats.block === h;
        return (
          <button key={h} className={`ns-tool${isActive ? ' pressed' : ''}`} title={`Heading ${i+1}`} onMouseDown={e => {
            e.preventDefault();
            const current = document.queryCommandValue('formatBlock').toLowerCase();
            exec('formatBlock', current === h ? 'p' : h);
          }}>{h.toUpperCase()}</button>
        );
      })}
      <button className={`ns-tool${(activeFormats.block === 'p' || activeFormats.block === 'div') ? ' pressed' : ''}`} title="Paragraph" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'p'); }}>¶</button>
      <div className="ns-tool-sep" />
      <button className={`ns-tool${activeFormats.bold   ? ' pressed' : ''}`} title="Bold"   onMouseDown={e => { e.preventDefault(); exec('bold'); }}><strong>B</strong></button>
      <button className={`ns-tool${activeFormats.italic ? ' pressed' : ''}`} title="Italic" onMouseDown={e => { e.preventDefault(); exec('italic'); }}><em>I</em></button>
      <button className="ns-tool" title="Underline" onMouseDown={e => { e.preventDefault(); exec('underline'); }}>U̲</button>
      <div className="ns-tool-sep" />
      <button className={`ns-tool${activeFormats.insertUnorderedList ? ' pressed' : ''}`} title="Bullet list"   onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}><Icon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" size={13} /></button>
      <button className={`ns-tool${activeFormats.insertOrderedList   ? ' pressed' : ''}`} title="Numbered list" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}><Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={13} /></button>
      <div className="ns-tool-sep" />
      <button className="ns-tool" title="Undo" onMouseDown={e => { e.preventDefault(); exec('undo'); }}><Icon d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" size={13} /></button>
      <button className="ns-tool" title="Redo" onMouseDown={e => { e.preventDefault(); exec('redo'); }}><Icon d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" size={13} /></button>
      <div className="ns-tool-sep" />
      <div style={{ flex:1 }} />
      <button className="ns-tool" title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Expand to fullscreen'} onMouseDown={e => { e.preventDefault(); onToggleFullscreen(); }}>
        {isFullscreen
          ? <Icon d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" size={14} />
          : <Icon d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3" size={14} />}
        {isFullscreen ? 'Exit' : 'Expand'}
      </button>
    </div>
  );

  const statusBar = () => (
    <div className="ns-status-bar">
      <span className="ns-char-count">{charCount.toLocaleString()} characters</span>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {isDirty && <span className="ns-unsaved">Unsaved changes</span>}
        <button className="ns-btn-amber" onClick={handleSave} disabled={!isDirty} style={{ padding:'7px 18px', fontSize:13 }}>
          <Icon d="M5 13l4 4L19 7" size={14} color="#0E1117" />Save
        </button>
      </div>
    </div>
  );

  const editableProps = {
    ref: editorRef,
    className: `ns-editable ns-scrollbar${isFullscreen ? ' fullscreen-body' : ''}`,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onInput: handleInput,
    onKeyUp: updateFormats,
    onMouseUp: updateFormats,
    spellCheck: false,
  };

  if (isFullscreen) {
    return createPortal(
      <div className="ns-fullscreen">
        <div className="ns-fullscreen-inner">{toolbar(true)}<div {...editableProps} /></div>
        {statusBar()}
      </div>,
      document.body
    );
  }

  return <div>{toolbar(false)}<div {...editableProps} />{statusBar()}</div>;
}

// ── Custom PDF Viewer ─────────────────────────────────────────
const PdfViewer = ({ src }) => {
  const canvasRef    = useRef(null);
  const [pdfDoc,     setPdfDoc]     = useState(null);
  const [pageNum,    setPageNum]    = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale,      setScale]      = useState(1.2);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const renderTaskRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true); setError('');
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = resolve; script.onerror = reject;
            document.head.appendChild(script);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        const doc = await window.pdfjsLib.getDocument(src).promise;
        if (cancelled) return;
        setPdfDoc(doc); setTotalPages(doc.numPages); setPageNum(1); setLoading(false);
      } catch (err) {
        if (!cancelled) { setError('Failed to load PDF.'); setLoading(false); }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    const render = async () => {
      try {
        if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const canvas   = canvasRef.current;
        canvas.width   = viewport.width;
        canvas.height  = viewport.height;
        const task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') console.warn('PDF render error:', err);
      }
    };
    render();
    return () => { cancelled = true; if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; } };
  }, [pdfDoc, pageNum, scale]);

  return (
    <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:T.bg, height:'100%', width:'100%', minHeight:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:T.surfaceHi, borderBottom:`1px solid ${T.border}`, flexShrink:0, gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1 || loading}
            style={{ width:28, height:28, borderRadius:7, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s', opacity: pageNum <= 1 ? 0.35 : 1 }}
            onMouseEnter={e => { if (pageNum > 1) { e.currentTarget.style.borderColor=T.amber; e.currentTarget.style.color=T.amber; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}>
            <Icon d="M15 19l-7-7 7-7" size={13} />
          </button>
          <span style={{ fontFamily:T.font, fontSize:12, color:T.cream, minWidth:80, textAlign:'center' }}>
            {loading ? '…' : `Page ${pageNum} of ${totalPages}`}
          </span>
          <button onClick={() => setPageNum(p => Math.min(totalPages, p + 1))} disabled={pageNum >= totalPages || loading}
            style={{ width:28, height:28, borderRadius:7, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s', opacity: pageNum >= totalPages ? 0.35 : 1 }}
            onMouseEnter={e => { if (pageNum < totalPages) { e.currentTarget.style.borderColor=T.amber; e.currentTarget.style.color=T.amber; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}>
            <Icon d="M9 5l7 7-7 7" size={13} />
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button onClick={() => setScale(s => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))))} disabled={scale <= 0.5}
            style={{ padding:'4px 10px', borderRadius:7, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, fontSize:14, cursor:'pointer', opacity: scale <= 0.5 ? 0.35 : 1, fontFamily:T.font }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.amber; e.currentTarget.style.color=T.amber; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}>−</button>
          <span style={{ fontFamily:T.font, fontSize:11, color:T.muted, minWidth:40, textAlign:'center' }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, parseFloat((s + 0.25).toFixed(2))))} disabled={scale >= 3}
            style={{ padding:'4px 10px', borderRadius:7, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, fontSize:14, cursor:'pointer', opacity: scale >= 3 ? 0.35 : 1, fontFamily:T.font }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.amber; e.currentTarget.style.color=T.amber; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}>+</button>
          <button onClick={() => setScale(1.2)}
            style={{ padding:'4px 10px', borderRadius:7, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, fontSize:11, cursor:'pointer', fontFamily:T.font }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.borderHi; e.currentTarget.style.color=T.cream; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}>Reset</button>
        </div>
      </div>
      <div className="ns-scrollbar" style={{ flex:1, minHeight:0, overflow:'auto', background:T.bg, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:24 }}>
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, height:'100%', minHeight:200 }}>
            <Spinner size={28} color={T.amber} />
            <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:0 }}>Loading PDF…</p>
          </div>
        )}
        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.2)', borderRadius:10, color:'#FCA5A5', fontSize:13, fontFamily:T.font }}>
            <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} color="#FCA5A5" />
            {error}
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: loading || error ? 'none' : 'block', borderRadius:8, boxShadow:'0 4px 24px rgba(0,0,0,.5)', maxWidth:'100%' }} />
      </div>
      {totalPages > 1 && totalPages <= 20 && (
        <div style={{ display:'flex', gap:5, justifyContent:'center', padding:'10px 16px', borderTop:`1px solid ${T.border}`, flexWrap:'wrap', flexShrink:0 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPageNum(i + 1)}
              style={{ width: pageNum === i + 1 ? 20 : 7, height:7, borderRadius:99, border:'none', background: pageNum === i + 1 ? T.amber : T.border, cursor:'pointer', transition:'all .2s', padding:0 }} />
          ))}
        </div>
      )}
    </div>
  );
};

function ScanViewPage({ src, title, fileType, onBack }) {
  const [zoom, setZoom] = useState(0.75);
  const isPdf = fileType === 'pdf' || src?.toLowerCase().endsWith('.pdf');
  return (
    <div style={{ height:'100vh', background:T.bg, fontFamily:T.font, color:T.cream, display:'flex', flexDirection:'column', animation:'zoomIn .2s ease both', overflow:'hidden' }}>
      <div style={{ borderBottom:`1px solid ${T.border}`, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:58, background:T.bg, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button className="ns-btn-ghost" onClick={onBack} style={{ padding:'6px 12px', fontSize:13 }}>
            <Icon d="M15 19l-7-7 7-7" size={14} /> Back to Results
          </button>
          <div style={{ height:20, width:1, background:T.border }} />
          <span style={{ fontFamily:T.serif, fontSize:16, color:T.cream }}>{title || 'Original Scan'}</span>
        </div>
        {!isPdf && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12, color:T.muted, fontFamily:T.font }}>{Math.round(zoom * 100)}%</span>
            <button className="ns-btn-ghost" onClick={() => setZoom(z => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))))} style={{ padding:'5px 12px', fontSize:13 }}>−</button>
            <button className="ns-btn-ghost" onClick={() => setZoom(0.75)} style={{ padding:'5px 12px', fontSize:12 }}>Reset</button>
            <button className="ns-btn-ghost" onClick={() => setZoom(z => Math.min(1, parseFloat((z + 0.25).toFixed(2))))} disabled={zoom >= 1} style={{ padding:'5px 12px', fontSize:13, opacity: zoom >= 1 ? 0.4 : 1 }}>+</button>
          </div>
        )}
      </div>
      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
        {src ? (
          isPdf ? (
            <div style={{ position:'absolute', inset:0 }}><PdfViewer src={src} /></div>
          ) : (
            <div className="ns-scrollbar" style={{ position:'absolute', inset:0, overflow:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:40 }}>
              <img src={src} alt="Original scan" style={{ width:`${zoom * 100}%`, maxWidth:'100%', height:'auto', display:'block', borderRadius:12, border:`1px solid ${T.border}`, boxShadow:'0 8px 32px rgba(0,0,0,.4)', transition:'width .2s ease' }} />
            </div>
          )
        ) : (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ width:80, height:80, borderRadius:20, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" size={36} color={T.amber} />
            </div>
            <p style={{ fontSize:15, color:T.muted, margin:0 }}>No scan image available</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ImagePane({ imageUrl, overlayUrl, fileType, onExpand }) {
  const src   = imageUrl || overlayUrl;
  const isPdf = fileType === 'pdf' || src?.toLowerCase().endsWith('.pdf');
  return (
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.muted, margin:0, fontFamily:T.font }}>
          {isPdf ? 'PDF Document' : 'Original Scan'}
        </p>
        {src && (
          <button className="ns-btn-ghost" onClick={onExpand} style={{ padding:'4px 10px', fontSize:11 }}>
            <Icon d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3" size={13} />Expand
          </button>
        )}
      </div>
      <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:14, overflow:'hidden', height:480, display:'flex', flexDirection:'column' }}>
        {src ? (
          isPdf ? <PdfViewer src={src} /> : (
            <img src={src} alt="OCR scan" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
          )
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:24 }}>
            <div style={{ width:64, height:64, borderRadius:16, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" size={28} color={T.amber} />
            </div>
            <p style={{ fontSize:13, color:T.muted, margin:0, textAlign:'center', fontFamily:T.font }}>No file available</p>
          </div>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id:'scan_edit',  label:'Scan & Edit',  icon:'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { id:'summary',    label:'AI Summary',   icon:'M13 10V3L4 14h7v7l9-11h-7z' },
  { id:'flashcards', label:'Flashcards',   icon:'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id:'quiz',       label:'Quiz',         icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
];

const ResultsPage = ({ onBack, onSave, noteId }) => {
  const [activeTab,        setActiveTab]        = useState('scan_edit');
  const [isSaved,          setIsSaved]          = useState(false);
  const [showAdd,          setShowAdd]          = useState(false);
  const [editingCard,      setEditingCard]      = useState(null);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [scanEditView,     setScanEditView]     = useState('both');
  const [title,            setTitle]            = useState('');
  const [showExportMenu,   setShowExportMenu]   = useState(false);
  const [confidence,       setConfidence]       = useState(null);
  const [ocrEngine,        setOcrEngine]        = useState(sessionStorage.getItem('lastOcrEngine') || '');
  const [cards,            setCards]            = useState([]);
  const [summaryBusy,      setSummaryBusy]      = useState(false);
  const [flashcardsBusy,   setFlashcardsBusy]   = useState(false);
  const [allBusy,          setAllBusy]          = useState(false);
  const [summaryError,     setSummaryError]     = useState('');
  const [flashcardsError,  setFlashcardsError]  = useState('');
  const [showScanView,     setShowScanView]     = useState(false);
  const [quizQuestions,    setQuizQuestions]    = useState([]);
  const [quizBusy,         setQuizBusy]         = useState(false);
  const [quizError,        setQuizError]        = useState('');
  const [quizAnswers,      setQuizAnswers]      = useState({});
  const [quizSubmitted,    setQuizSubmitted]    = useState(false);
  const [quizCurrent,      setQuizCurrent]      = useState(0);
  const [uploadedFileType, setUploadedFileType] = useState('');

  const exportMenuRef = useRef(null);
  const cardsRef      = useRef([]);
  const liveTextRef   = useRef('');
  const liveHtmlRef   = useRef('');

  const fileId = noteId || sessionStorage.getItem('lastUploadId');
  const token  = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = token
    ? { 'Content-Type': 'application/json', 'x-auth-token': token }
    : { 'Content-Type': 'application/json' };

  const [fileData,            setFileData]            = useState(null);
  const [recognizedText,      setRecognizedText]      = useState('');
  const [recognizedTextIsHtml, setRecognizedTextIsHtml] = useState(false);
  const [aiSummary,           setAiSummary]           = useState('');
  const [transcriptionEdited, setTranscriptionEdited] = useState(false);
  const [overlayUrl,          setOverlayUrl]          = useState(sessionStorage.getItem('lastOcrOverlayUrl') || '');
  const [ocrImageUrl,         setOcrImageUrl]         = useState(sessionStorage.getItem('lastOcrImageUrl')   || '');

  useEffect(() => { cardsRef.current = cards; }, [cards]);

  useEffect(() => {
    if (!fileId) return;
    if (noteId) { setOcrImageUrl(''); setOverlayUrl(''); setOcrEngine(''); }
    fetch(`/api/files/${fileId}`, { headers })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.msg || 'Failed to load file data.');
        return data;
      })
      .then((data) => {
        setFileData(data);
        if (data.title) setTitle(data.title);
        else if (data.originalName) setTitle(data.originalName.replace(/\.[^/.]+$/, ''));
        if (data.confidence) setConfidence(data.confidence);

        const storedMergedText = !noteId ? sessionStorage.getItem('lastOcrMergedText') : '';
        const isHtml           = !noteId && sessionStorage.getItem('lastOcrIsHtml') === 'true';
        const resolvedText    = storedMergedText || data.currentContent?.transcribedText || data.extractionData?.rawText || '';
        const resolvedSummary = data.currentContent?.summary || data.aiGeneratedContent?.summary || '';
        const resolvedCards   = data.currentContent?.flashCards || data.aiGeneratedContent?.flashCards || [];
        const learnedMap      = toLearnedMap(cardsRef.current);

        setRecognizedText(resolvedText);
        setRecognizedTextIsHtml(isHtml);
        setAiSummary(resolvedSummary);
        setCards(normalizeFlashcards(resolvedCards, learnedMap));

        // Set file URL for both images and PDFs
        if (data.fileLocation && (
          data.fileType === 'image' || data.mimeType?.startsWith('image/') ||
          data.fileType === 'pdf'   || data.mimeType === 'application/pdf'
        )) {
          const normalized = data.fileLocation.replace(/\\/g, '/').replace(/^\/+/, '');
          setOcrImageUrl(`${BACKEND_URL}/${encodeURI(normalized)}`);
        }

        // Track file type for PDF viewer
        if (data.fileType) setUploadedFileType(data.fileType);
        else if (data.mimeType === 'application/pdf') setUploadedFileType('pdf');

        if (!noteId) {
          const ssOverlay = sessionStorage.getItem('lastOcrOverlayUrl');
          if (ssOverlay) setOverlayUrl(ssOverlay);
          const ssImageUrl = sessionStorage.getItem('lastOcrImageUrl');
          if (ssImageUrl) setOcrImageUrl(ssImageUrl);
          const ssConfidence = sessionStorage.getItem('lastOcrConfidence');
          if (ssConfidence) setConfidence(Math.round(parseFloat(ssConfidence)));
          const ssEngine = sessionStorage.getItem('lastOcrEngine');
          if (ssEngine) setOcrEngine(ssEngine);
        }
      })
      .catch((err) => console.error('Failed to load file data:', err));
  }, [fileId, noteId]);

  useEffect(() => {
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target))
        setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveEdit = async (endpoint, payload, onSuccess, setEdited) => {
    if (!fileId) return;
    try {
      const res  = await fetch(`/api/files/${fileId}/${endpoint}`, { method:'PUT', headers, body:JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.msg || 'Failed to save changes.');
      if (data.currentContent) { onSuccess(); if (setEdited) setEdited(true); }
    } catch (err) { console.error('Save edit error:', err); }
  };

  const persistFlashcards = async (nextCards) => {
    if (!fileId) return nextCards;
    const res  = await fetch(`/api/files/${fileId}/edit/flashcards`, { method:'PUT', headers, body:JSON.stringify({ cards: serializeFlashcards(nextCards) }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.msg || 'Failed to save flashcards.');
    const learnedMap = toLearnedMap(nextCards);
    const normalized = normalizeFlashcards(data.currentContent?.flashCards || [], learnedMap);
    cardsRef.current = normalized;
    setCards(normalized);
    return normalized;
  };

  const updateCards = async (updater, { persist = false } = {}) => {
    const prev       = cardsRef.current;
    const rawNext    = typeof updater === 'function' ? updater(prev) : updater;
    const learnedMap = toLearnedMap(rawNext);
    const next       = normalizeFlashcards(rawNext, learnedMap);
    cardsRef.current = next;
    setCards(next);
    setFlashcardsError('');
    if (persist) {
      try { return await persistFlashcards(next); }
      catch (err) { console.error('Save flashcards error:', err); setFlashcardsError(err.message); }
    }
    return next;
  };

  
  const generateAiContent = async (contentType) => {
    if (!fileId) return;
    if (!recognizedText.trim()) {
      const message = 'No OCR text is available yet. Save or generate text first.';
      if (contentType === 'summary'    || contentType === 'all') setSummaryError(message);
      if (contentType === 'flashCards' || contentType === 'all') setFlashcardsError(message);
      return;
    }
    if (contentType === 'summary')    setSummaryBusy(true);
    if (contentType === 'flashCards') setFlashcardsBusy(true);
    if (contentType === 'all')        setAllBusy(true);
    setSummaryError(''); setFlashcardsError('');
    try {
      const res  = await fetch(`/api/files/${fileId}/generate`, { method:'POST', headers, body:JSON.stringify({ contentType, sourceText: recognizedText }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.msg || 'AI generation failed.');
      const learnedMap = toLearnedMap(cardsRef.current);
      if (typeof data.currentContent?.summary === 'string') setAiSummary(data.currentContent.summary);
      if (Array.isArray(data.currentContent?.flashCards)) {
        const normalized = normalizeFlashcards(data.currentContent.flashCards, learnedMap);
        cardsRef.current = normalized;
        setCards(normalized);
      }
      setFileData((prev) => prev ? ({ ...prev, currentContent: data.currentContent, aiGeneratedContent: data.aiGeneratedContent }) : prev);
    } catch (err) {
      console.error('Generate AI content error:', err);
      if (contentType === 'summary'    || contentType === 'all') setSummaryError(err.message);
      if (contentType === 'flashCards' || contentType === 'all') setFlashcardsError(err.message);
    } finally {
      if (contentType === 'summary')    setSummaryBusy(false);
      if (contentType === 'flashCards') setFlashcardsBusy(false);
      if (contentType === 'all')        setAllBusy(false);
    }
  };

  const generateQuiz = async () => {
    if (!fileId) return;
    if (!recognizedText.trim()) { setQuizError('No OCR text available yet.'); return; }
    setQuizBusy(true); setQuizError(''); setQuizAnswers({}); setQuizSubmitted(false);
    try {
      const res  = await fetch(`/api/files/${fileId}/generate`, { method:'POST', headers, body:JSON.stringify({ contentType:'quiz', sourceText: recognizedText }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.msg || 'Quiz generation failed.');
      const questions = data.currentContent?.quiz || data.aiGeneratedContent?.quiz || [];
      setQuizQuestions(questions);
      if (!questions.length) setQuizError('No quiz questions were returned. Try regenerating.');
    } catch (err) {
      console.error('Generate quiz error:', err);
      setQuizError(err.message);
    } finally {
      setQuizBusy(false);
    }
  };

  const getCurrentText = () => liveTextRef.current || recognizedText;
  const getCurrentHtml = () => liveHtmlRef.current || `<p>${recognizedText}</p>`;

  const handleExportCopy = async () => { await navigator.clipboard.writeText(getCurrentText()); setShowExportMenu(false); };
  const handleExportTXT  = () => {
    const blob = new Blob([getCurrentText()], { type:'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${title || 'notes'}.txt`; a.click();
    URL.revokeObjectURL(url); setShowExportMenu(false);
  };
  const handleExportPDF = () => {
    const titleHtml = title ? `<h1>${title}</h1>` : '';
    printDiv.innerHTML = `${titleHtml}<div>${getCurrentHtml()}</div>`;
    setShowExportMenu(false);
    setTimeout(() => { window.print(); setTimeout(() => { printDiv.innerHTML = ''; }, 1000); }, 100);
  };

  const engineLabel = ocrEngine === 'chandra' ? 'Chandra' : ocrEngine === 'paddleocr' ? 'PaddleOCR' : '';

  if (showScanView) {
    return <ScanViewPage src={ocrImageUrl || overlayUrl} title={title} fileType={uploadedFileType} onBack={() => setShowScanView(false)} />;
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, color:T.cream }}>

      {/* Top bar */}
      <div style={{ borderBottom:`1px solid ${T.border}`, padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:58, background:T.bg }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {onBack && (
            <button className="ns-btn-ghost" onClick={onBack} style={{ padding:'6px 12px', fontSize:13 }}>
              <Icon d="M15 19l-7-7 7-7" size={14} /> Back
            </button>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div ref={exportMenuRef} style={{ position:'relative' }}>
            <button className="ns-btn-ghost" onClick={() => setShowExportMenu(v => !v)} style={{ padding:'6px 12px', fontSize:13 }}>
              <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={14} />
              Export
              <Icon d="M19 9l-7 7-7-7" size={12} />
            </button>
            {showExportMenu && (
              <div className="ns-export-menu">
                <button className="ns-export-item" onClick={handleExportCopy}>
                  <Icon d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" size={14} color="currentColor" />Copy to clipboard
                </button>
                <button className="ns-export-item" onClick={handleExportTXT}>
                  <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={14} color="currentColor" />Download TXT
                </button>
                <button className="ns-export-item" onClick={handleExportPDF}>
                  <Icon d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" size={14} color="currentColor" />Download PDF
                </button>
              </div>
            )}
          </div>
          <button className="ns-btn-amber" disabled={isSaved} style={{ opacity: isSaved ? 0.7 : 1 }}
            onClick={async () => {
              if (!fileId) { if (onSave) onSave(); return; }
              try {
                await fetch(`/api/files/${fileId}/meta`, { method:'PATCH', headers, body:JSON.stringify({ title }) });
                await fetch(`/api/files/${fileId}/edit/transcription`, { method:'PUT', headers, body:JSON.stringify({ newText: liveTextRef.current || recognizedText }) });
                if (aiSummary) await fetch(`/api/files/${fileId}/edit/summary`, { method:'PUT', headers, body:JSON.stringify({ newText: aiSummary }) });
                if (cards.length) await fetch(`/api/files/${fileId}/edit/flashcards`, { method:'PUT', headers, body:JSON.stringify({ cards: serializeFlashcards(cards) }) });
                setIsSaved(true);
                if (onSave) onSave();
              } catch (err) { console.error('Failed to save notes:', err); }
            }}>
            {isSaved
              ? <><Icon d="M5 13l4 4L19 7" size={14} color="#0E1117" />Saved</>
              : <><Icon d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" size={14} color="#0E1117" />Save Notes</>
            }
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding:'40px 20px 0', animation:'fadeUp .4s ease both' }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 10px' }}>OCR Results</p>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <input className="ns-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter a title for your notes…" />
            <p style={{ color:T.muted, fontSize:14, margin:0 }}>Your notes have been scanned and processed successfully.</p>
          </div>
          {(confidence !== null || engineLabel) && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:99, flexShrink:0 }}>
              
              {confidence !== null && <span style={{ fontSize:13, fontWeight:600, color:T.cream }}>{confidence}% Confidence</span>}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:6, borderBottom:`1px solid ${T.border}`, overflowX:'auto' }} className="ns-scrollbar">
          {TABS.map(tab => (
            <button key={tab.id} className={`ns-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ marginBottom:-1, borderBottomLeftRadius:activeTab===tab.id?0:10, borderBottomRightRadius:activeTab===tab.id?0:10, borderBottom:activeTab===tab.id?`1px solid ${T.bg}`:'1px solid transparent' }}>
              <Icon d={tab.icon} size={14} color="currentColor" />
              {tab.label}
              {tab.id === 'flashcards' && (
                <span style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:99, padding:'1px 7px', fontSize:11, color:T.muted, fontWeight:600 }}>{cards.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div style={{ padding:'0 20px 64px' }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderTop:'none', borderRadius:'0 0 16px 16px', padding:'32px 36px', minHeight:400 }}>

          {/* Scan & Edit */}
          {activeTab === 'scan_edit' && (
            <div key="scan_edit" className="ns-tab-panel">
              <div style={{ display:'flex', gap:6, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
                {[['both','Both'],['image','Scan'],['editor','Editor']].map(([val, label]) => (
                  <button key={val} onClick={() => setScanEditView(val)}
                    style={{ padding:'5px 14px', borderRadius:8, fontSize:12, fontWeight:600, fontFamily:T.font, cursor:'pointer', border:`1px solid ${scanEditView===val?T.amber:T.border}`, background:scanEditView===val?T.amberDim:'transparent', color:scanEditView===val?T.amber:T.muted, transition:'all .15s' }}>
                    {label}
                  </button>
                ))}
                <div style={{ flex:1 }} />
                {transcriptionEdited && (
                  <button className="ns-regen" onClick={() => generateAiContent('all')} disabled={allBusy}>
                    {allBusy ? <Spinner size={12} color={T.amber} /> : <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={12} />}
                    {allBusy ? 'Generating…' : 'Regenerate all'}
                  </button>
                )}
              </div>
              {scanEditView === 'both' && (
                <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                  <ImagePane imageUrl={ocrImageUrl} overlayUrl={overlayUrl} fileType={uploadedFileType} onExpand={() => setShowScanView(true)} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.muted, margin:'0 0 10px', fontFamily:T.font }}>Recognized Text</p>
                    <RichTextEditor initialText={recognizedTextIsHtml ? '' : recognizedText} initialHtml={recognizedTextIsHtml ? recognizedText : undefined} isFullscreen={editorFullscreen} onToggleFullscreen={() => setEditorFullscreen(f => !f)}
                      onLiveChange={({ text, html }) => { liveTextRef.current = text; liveHtmlRef.current = html; }}
                      onSave={(payload) => saveEdit('edit/transcription', payload, () => { setTranscriptionEdited(true); }, setTranscriptionEdited)} />
                  </div>
                </div>
              )}
              {scanEditView === 'image' && <ImagePane imageUrl={ocrImageUrl} overlayUrl={overlayUrl} fileType={uploadedFileType} onExpand={() => setShowScanView(true)} />}
              {scanEditView === 'editor' && (
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.muted, margin:'0 0 10px', fontFamily:T.font }}>Recognized Text</p>
                  <RichTextEditor initialText={recognizedTextIsHtml ? '' : recognizedText} initialHtml={recognizedTextIsHtml ? recognizedText : undefined} isFullscreen={editorFullscreen} onToggleFullscreen={() => setEditorFullscreen(f => !f)}
                    onLiveChange={({ text, html }) => { liveTextRef.current = text; liveHtmlRef.current = html; }}
                    onSave={(payload) => saveEdit('edit/transcription', payload, () => { setTranscriptionEdited(true); }, setTranscriptionEdited)} />
                </div>
              )}
            </div>
          )}

          {/* AI Summary */}
          {activeTab === 'summary' && (
            <div key="summary" className="ns-tab-panel">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                <p style={{ margin:0, fontSize:13, color:T.muted }}>Generate a concise summary from the current OCR text when you want it.</p>
                <button className={aiSummary ? 'ns-regen' : 'ns-btn-amber'} onClick={() => generateAiContent('summary')}
                  disabled={summaryBusy || !recognizedText.trim()} style={aiSummary ? undefined : { padding:'9px 16px' }}>
                  {summaryBusy ? <Spinner size={12} color={aiSummary ? T.amber : '#0E1117'} /> : <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={12} />}
                  {summaryBusy ? 'Generating…' : aiSummary ? 'Regenerate Summary' : 'Generate Summary'}
                </button>
              </div>
              {summaryError && <div style={{ marginBottom:12, padding:'10px 12px', borderRadius:10, border:'1px solid rgba(248,113,113,.35)', background:'rgba(248,113,113,.08)', color:'#FCA5A5', fontSize:13 }}>{summaryError}</div>}
              <div style={{ background:'linear-gradient(135deg,rgba(245,166,35,.06) 0%,rgba(129,140,248,.06) 100%)', border:`1px solid ${T.border}`, borderRadius:12, padding:'20px 24px', fontFamily:T.font, fontSize:14, lineHeight:1.8, color:T.cream, whiteSpace:'pre-wrap' }}>
                {aiSummary || <span style={{ color:T.muted, fontStyle:'italic' }}>No AI summary yet. Click Generate Summary when you are ready.</span>}
              </div>
            </div>
          )}

          {/* Flashcards */}
          {activeTab === 'flashcards' && (
            <div key="flashcards" className="ns-tab-panel">
              <div style={{ display:'flex', justifyContent:'flex-end', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom:18 }}>
                <button className={cards.length ? 'ns-regen' : 'ns-btn-amber'} onClick={() => generateAiContent('flashCards')}
                  disabled={flashcardsBusy || !recognizedText.trim()} style={cards.length ? undefined : { padding:'9px 16px' }}>
                  {flashcardsBusy ? <Spinner size={12} color={cards.length ? T.amber : '#0E1117'} /> : <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={12} />}
                  {flashcardsBusy ? 'Generating…' : cards.length ? 'Regenerate Flashcards' : 'Generate Flashcards'}
                </button>
                <button className="ns-btn-ghost" onClick={() => setShowAdd(true)}>
                  <Icon d="M12 6v6m0 0v6m0-6h6m-6 0H6" size={14} />Add Card
                </button>
              </div>
              {flashcardsError && <div style={{ marginBottom:12, padding:'10px 12px', borderRadius:10, border:'1px solid rgba(248,113,113,.35)', background:'rgba(248,113,113,.08)', color:'#FCA5A5', fontSize:13 }}>{flashcardsError}</div>}
              {cards.length === 0 ? (
                <div style={{ background:T.surfaceHi, border:`1px dashed ${T.borderHi}`, borderRadius:14, padding:'28px 24px', textAlign:'center', color:T.muted, marginBottom:28 }}>
                  No flashcards yet. Generate them from the OCR text or add your own card manually.
                </div>
              ) : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:14, marginBottom:28 }}>
                  {cards.map(c => (
                    <PreviewCard key={c.id} card={c}
                      onEdit={(card) => setEditingCard(card)}
                      onDelete={(id) => updateCards(prev => prev.filter(x => x.id !== id), { persist: true })} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quiz */}
          {activeTab === 'quiz' && (() => {
  const answeredAll = Object.keys(quizAnswers).length === quizQuestions.length && quizQuestions.length > 0;
  const q = quizQuestions[quizCurrent];

  return (
    <div key="quiz" className="ns-tab-panel">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <p style={{ margin:0, fontSize:13, color:T.muted }}>Generate a multiple choice quiz from your scanned notes.</p>
        <button
          className={quizQuestions.length ? 'ns-regen' : 'ns-btn-amber'}
          onClick={generateQuiz}
          disabled={quizBusy || !recognizedText.trim()}
          style={quizQuestions.length ? undefined : { padding:'9px 16px' }}>
          {quizBusy
            ? <Spinner size={12} color={quizQuestions.length ? T.amber : '#0E1117'} />
            : <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={12} />}
          {quizBusy ? 'Generating…' : quizQuestions.length ? 'Regenerate Quiz' : 'Generate Quiz'}
        </button>
      </div>

      {quizError && (
        <div style={{ marginBottom:12, padding:'10px 12px', borderRadius:10, border:'1px solid rgba(248,113,113,.35)', background:'rgba(248,113,113,.08)', color:'#FCA5A5', fontSize:13 }}>
          {quizError}
        </div>
      )}

      {quizQuestions.length === 0 && !quizBusy && (
        <div style={{ background:T.surfaceHi, border:`1px dashed ${T.borderHi}`, borderRadius:14, padding:'28px 24px', textAlign:'center', color:T.muted }}>
          No quiz yet. Click Generate Quiz when you are ready.
        </div>
      )}

      {quizQuestions.length > 0 && !quizSubmitted && q && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:T.muted, fontFamily:T.font }}>
              Question {quizCurrent + 1} of {quizQuestions.length}
            </span>
            <div style={{ display:'flex', gap:4 }}>
              {quizQuestions.map((_, i) => (
                <div key={i} onClick={() => setQuizCurrent(i)} style={{
                  width:28, height:6, borderRadius:99, cursor:'pointer',
                  background: quizAnswers[i] !== undefined
                    ? T.amber
                    : i === quizCurrent ? T.cream : T.border,
                  transition:'background .2s'
                }} />
              ))}
            </div>
          </div>

          {/* Question */}
          <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:14, padding:'24px 28px' }}>
            <p style={{ fontFamily:T.serif, fontSize:20, color:T.cream, margin:'0 0 20px', lineHeight:1.4 }}>{q.question}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {(q.options || []).map((option, oi) => {
                const isSelected = quizAnswers[quizCurrent] === option;
                return (
                  <button key={oi} onClick={() => {
                    if (quizSubmitted) return;
                    setQuizAnswers(prev => ({ ...prev, [quizCurrent]: option }));
                  }} style={{
                    textAlign:'left', padding:'12px 16px', borderRadius:10, cursor:'pointer',
                    fontFamily:T.font, fontSize:14, color: isSelected ? T.amber : T.cream,
                    background: isSelected ? T.amberDim : T.bg,
                    border: `1px solid ${isSelected ? T.amber : T.border}`,
                    transition:'all .15s'
                  }}>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button className="ns-btn-ghost" onClick={() => setQuizCurrent(c => Math.max(0, c - 1))} disabled={quizCurrent === 0} style={{ opacity: quizCurrent === 0 ? 0.4 : 1 }}>
              <Icon d="M15 19l-7-7 7-7" size={14} /> Previous
            </button>
            {quizCurrent < quizQuestions.length - 1 ? (
              <button className="ns-btn-ghost" onClick={() => setQuizCurrent(c => c + 1)}>
                Next <Icon d="M9 5l7 7-7 7" size={14} />
              </button>
            ) : (
              <button className="ns-btn-amber" onClick={() => setQuizSubmitted(true)} disabled={!answeredAll} style={{ opacity: answeredAll ? 1 : 0.4 }}>
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {quizSubmitted && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Score */}
          <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:14, padding:'24px 28px', textAlign:'center' }}>
            {(() => {
              const correct = quizQuestions.filter((qq, i) => quizAnswers[i] === qq.correctAnswer).length;
              const pct = Math.round(correct / quizQuestions.length * 100);
              const color = pct >= 70 ? T.green : T.amber;
              return (
                <>
                  <p style={{ fontFamily:T.serif, fontSize:32, color, margin:'0 0 4px' }}>{pct}%</p>
                  <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:'0 0 16px' }}>{correct} of {quizQuestions.length} correct</p>
                  <button className="ns-btn-ghost" onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizCurrent(0); }}>
                    Retake Quiz
                  </button>
                </>
              );
            })()}
          </div>

          {/* Review */}
          {quizQuestions.map((qq, i) => {
            const userAns = quizAnswers[i];
            const isCorrect = userAns === qq.correctAnswer;
            return (
              <div key={i} style={{ background:T.surfaceHi, border:`1px solid ${isCorrect ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'}`, borderRadius:14, padding:'20px 24px' }}>
                <p style={{ fontFamily:T.font, fontSize:13, fontWeight:600, color: isCorrect ? T.green : '#F87171', margin:'0 0 8px' }}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </p>
                <p style={{ fontFamily:T.serif, fontSize:16, color:T.cream, margin:'0 0 12px' }}>{qq.question}</p>
                <p style={{ fontSize:13, color:T.muted, margin:'0 0 4px' }}>Your answer: <span style={{ color: isCorrect ? T.green : '#F87171' }}>{userAns || 'Not answered'}</span></p>
                {!isCorrect && <p style={{ fontSize:13, color:T.muted, margin:'0 0 4px' }}>Correct answer: <span style={{ color:T.green }}>{qq.correctAnswer}</span></p>}
                {qq.explanation && <p style={{ fontSize:12, color:T.muted, margin:'8px 0 0', fontStyle:'italic' }}>{qq.explanation}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
})()}

        </div>
      </div>

      {showAdd && (
        <CardModal
          onSave={async (q, a) => {
            const newId = makeCardId();
            await updateCards((prev) => [...prev, { id:newId, cardId:newId, question:q, answer:a, learned:false }], { persist:true });
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editingCard && (
        <CardModal
          initialValues={{ question: editingCard.question, answer: editingCard.answer }}
          onSave={async (q, a) => {
            await updateCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, question:q, answer:a } : c), { persist:true });
            setEditingCard(null);
          }}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  );
};

export default ResultsPage;
