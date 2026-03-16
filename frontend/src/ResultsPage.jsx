import { createPortal } from "react-dom";
import React, { useState, useRef, useEffect } from 'react';
import FlashcardsPage from './FlashcardsPage';

//Google fonts
const fontLink = document.createElement('link');
fontLink.rel  = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap';
document.head.appendChild(fontLink);

//Design tokens
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


const styleEl = document.createElement('style');
styleEl.textContent = `
  html, body, #root { margin: 0; padding: 0; min-height: 100%; background: #0E1117; }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes tabIn   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideIn { from { opacity:0; transform:scale(0.97)      } to { opacity:1; transform:scale(1)      } }

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
  .ns-scrollbar::-webkit-scrollbar       { width:4px; height:4px; }
  .ns-scrollbar::-webkit-scrollbar-track { background:transparent; }
  .ns-scrollbar::-webkit-scrollbar-thumb { background:${T.border}; border-radius:99px; }
  .ns-study-btn {
    width:100%; padding:14px 20px;
    background:linear-gradient(135deg,#4F46E5,#7C3AED);
    color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:600;
    font-family:${T.font}; cursor:pointer; display:flex; align-items:center;
    justify-content:center; gap:8px; box-shadow:0 4px 24px rgba(79,70,229,.4);
    transition:transform .15s,box-shadow .15s;
  }
  .ns-study-btn:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(79,70,229,.5); }
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
  .ns-tool:hover  { color:${T.cream}; background:${T.surfaceHi}; border-color:${T.border}; }
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

  .ns-fullscreen {
    position:fixed; inset:0; background:${T.bg}; z-index:500;
    display:flex; flex-direction:column;
    animation:slideIn .2s ease both;
  }
  .ns-fullscreen-inner {
    flex:1; display:flex; flex-direction:column; overflow:hidden;
  }

  .ns-export-menu {
    position:absolute; top:calc(100% + 6px); right:0;
    background:${T.surface}; border:1px solid ${T.border};
    border-radius:12px; padding:6px; min-width:170px;
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
  .ns-export-item.copied { color:${T.green}; }

  .ns-status-bar {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 24px; border-top:1px solid ${T.border};
    background:${T.bg}; flex-shrink:0;
  }
  .ns-char-count { font-size:11px; color:${T.muted}; font-family:${T.font}; }
  .ns-unsaved    { font-size:11px; color:${T.amber}; font-family:${T.font}; }

  @media print {
    body * { visibility:hidden; }
    #ns-print-area, #ns-print-area * { visibility:visible; }
    #ns-print-area {
      position:fixed; left:0; top:0; width:100%;
      font-family:Georgia,serif; font-size:14pt; line-height:1.7;
      color:#111; background:#fff; padding:40px 60px; box-sizing:border-box;
    }
    #ns-print-area h1 { font-size:24pt; margin-bottom:12pt; }
    #ns-print-area h2 { font-size:18pt; margin-bottom:10pt; }
    #ns-print-area h3 { font-size:13pt; font-weight:bold; margin-bottom:8pt; }
    #ns-print-area ul, #ns-print-area ol { padding-left:20pt; }
    #ns-print-area li { margin-bottom:4pt; }
  }
`;
document.head.appendChild(styleEl);

let printDiv = document.getElementById('ns-print-area');
if (!printDiv) {
  printDiv = document.createElement('div');
  printDiv.id = 'ns-print-area';
  document.body.appendChild(printDiv);
}

const Icon = ({ d, size = 18, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} fill={fill} stroke={color} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

//mock data
const INITIAL_CARDS = [
  { id: 1, question: 'What is machine learning?',                        answer: 'A subset of AI that enables systems to improve through experience.',     learned: false },
  { id: 2, question: 'What are the three main types of machine learning?', answer: 'Supervised Learning, Unsupervised Learning, and Reinforcement Learning.', learned: false },
  { id: 3, question: 'What is supervised learning?',                     answer: 'Training ML models with labeled data.',                                  learned: false },
];

function useCards() {
  const [cards, setCards] = useState(INITIAL_CARDS.map(c => ({ ...c })));
  const nextId = useRef(INITIAL_CARDS.length + 1);
  const addCard    = (q, a) => setCards(p => [...p, { id: nextId.current++, question: q, answer: a, learned: false }]);
  const toggleLearned = (id) => setCards(p => p.map(c => c.id === id ? { ...c, learned: !c.learned } : c));
  return { cards, addCard, toggleLearned };
}

function CardModal({ onSave, onClose }) {
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const valid = q.trim() && a.trim();
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, padding:32, width:440, maxWidth:'90vw', boxShadow:'0 32px 64px rgba(0,0,0,.6)' }}>
        <p style={{ fontFamily:T.serif, fontSize:22, color:T.cream, margin:'0 0 24px' }}>New Flashcard</p>
        {[['Question', q, setQ], ['Answer', a, setA]].map(([label, val, set]) => (
          <div key={label} style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:1, textTransform:'uppercase', color:T.muted, marginBottom:8, fontFamily:T.font }}>{label}</label>
            <textarea value={val} onChange={e => set(e.target.value)} rows={3} placeholder={`Enter ${label.toLowerCase()}…`}
              style={{ width:'100%', boxSizing:'border-box', background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, fontFamily:T.font, color:T.cream, resize:'vertical', outline:'none' }} />
          </div>
        ))}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
          <button className="ns-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ns-btn-amber" onClick={() => valid && onSave(q.trim(), a.trim())} style={{ opacity: valid ? 1 : 0.4 }}>Save Card</button>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ card }) {
  const [flipped, setFlipped] = useState(false);
  const face = { position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', borderRadius:14, border:`1px solid ${T.border}`, display:'flex', flexDirection:'column', padding:'16px 18px', overflow:'hidden' };
  return (
    <div style={{ perspective:700, height:140, flex:'0 0 220px' }}>
      <div onClick={() => setFlipped(f => !f)} style={{ position:'relative', width:'100%', height:'100%', transformStyle:'preserve-3d', transition:'transform .5s cubic-bezier(.4,0,.2,1)', transform:flipped ? 'rotateY(180deg)' : 'none', cursor:'pointer' }}>
        <div style={{ ...face, background:card.learned ? 'rgba(52,211,153,.08)' : T.surfaceHi, borderColor:card.learned ? 'rgba(52,211,153,.3)' : T.border }}>
          <span className="ns-tag" style={{ background:T.amberDim, color:T.amber, marginBottom:10, alignSelf:'flex-start' }}>Q</span>
          <p style={{ fontSize:13, fontWeight:500, color:T.cream, margin:0, lineHeight:1.5, fontFamily:T.font, display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{card.question}</p>
        </div>
        <div style={{ ...face, transform:'rotateY(180deg)', background:T.surfaceHi }}>
          <span className="ns-tag" style={{ background:T.purpleDim, color:T.purple, marginBottom:10, alignSelf:'flex-start' }}>A</span>
          <p style={{ fontSize:13, fontWeight:400, color:T.muted, margin:0, lineHeight:1.5, fontFamily:T.font, display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{card.answer}</p>
        </div>
      </div>
    </div>
  );
}

function ExportMenu({ editorRef, onClose }) {
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const getPlainText = () => editorRef.current?.innerText || '';
  const getHTML      = () => editorRef.current?.innerHTML || '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getPlainText());
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 1200);
  };

  const handleTXT = () => {
    const blob = new Blob([getPlainText()], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'recognized-text.txt'; a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handlePDF = () => {
    printDiv.innerHTML = getHTML();
    window.print();
    setTimeout(() => { printDiv.innerHTML = ''; onClose(); }, 500);
  };

  const items = [
    { label: copied ? 'Copied!' : 'Copy to clipboard', icon: copied ? 'M5 13l4 4L19 7' : 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z', action: handleCopy, cls: copied ? 'copied' : '' },
    { label: 'Export as TXT', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: handleTXT },
    { label: 'Export as PDF', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', action: handlePDF },
  ];

  return (
    <div ref={menuRef} className="ns-export-menu">
      {items.map(item => (
        <button key={item.label} className={`ns-export-item ${item.cls || ''}`} onClick={item.action}>
          <Icon d={item.icon} size={14} color="currentColor" />
          {item.label}
        </button>
      ))}
    </div>
  );
}

function RichTextEditor({ initialText, onSave, isFullscreen, onToggleFullscreen }) {
  const editorRef = useRef(null);
  const [editorHTML,    setEditorHTML]    = useState('');
  const [charCount,     setCharCount]     = useState(0);
  const [isDirty,       setIsDirty]       = useState(false);
  const [activeFormats, setActiveFormats] = useState({});
  const [showExport,    setShowExport]    = useState(false);

  // Re-populate editor whenever initialText arrives from the backend
  useEffect(() => {
    if (!editorRef.current) return;
    const html = (initialText || '')
      .split('\n')
      .map(line => `<p>${line || '<br>'}</p>`)
      .join('');
    setEditorHTML(html);
    setCharCount(initialText?.length || 0);
    editorRef.current.innerHTML = html;
  }, [initialText]);

  // ESC to exit fullscreen
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isFullscreen) onToggleFullscreen(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen, onToggleFullscreen]);

  const exec = (cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    updateFormats();
  };

  const updateFormats = () => setActiveFormats({
    bold:                document.queryCommandState('bold'),
    italic:              document.queryCommandState('italic'),
    insertUnorderedList: document.queryCommandState('insertUnorderedList'),
    insertOrderedList:   document.queryCommandState('insertOrderedList'),
  });

  const handleInput = () => {
    if (!editorRef.current) return;
    setEditorHTML(editorRef.current.innerHTML);
    setCharCount(editorRef.current.innerText.length);
    setIsDirty(true);
    updateFormats();
  };

  const handleKeyUp   = () => updateFormats();
  const handleMouseUp = () => updateFormats();

  const handleSave = () => {
    onSave({ newText: editorRef.current?.innerText || '', html: editorHTML, previousText: initialText });
    setIsDirty(false);
  };

  const toolbar = (fullscreen = false) => (
    <div className={`ns-toolbar${fullscreen ? ' fullscreen-bar' : ''}`}>
      {['h1','h2','h3'].map((h, i) => (
        <button key={h} className="ns-tool" title={`Heading ${i+1}`} onMouseDown={e => { e.preventDefault(); exec('formatBlock', h); }}>{h.toUpperCase()}</button>
      ))}
      <button className="ns-tool" title="Paragraph" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'p'); }}>¶</button>
      <div className="ns-tool-sep" />
      <button className={`ns-tool${activeFormats.bold   ? ' pressed' : ''}`} title="Bold (⌘B)"   onMouseDown={e => { e.preventDefault(); exec('bold'); }}><strong>B</strong></button>
      <button className={`ns-tool${activeFormats.italic ? ' pressed' : ''}`} title="Italic (⌘I)" onMouseDown={e => { e.preventDefault(); exec('italic'); }}><em>I</em></button>
      <button className="ns-tool" title="Underline (⌘U)" onMouseDown={e => { e.preventDefault(); exec('underline'); }}>U̲</button>
      <div className="ns-tool-sep" />
      <button className={`ns-tool${activeFormats.insertUnorderedList ? ' pressed' : ''}`} title="Bullet list"   onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}><Icon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" size={13} /></button>
      <button className={`ns-tool${activeFormats.insertOrderedList   ? ' pressed' : ''}`} title="Numbered list" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}><Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={13} /></button>
      <div className="ns-tool-sep" />
      <button className="ns-tool" title="Undo" onMouseDown={e => { e.preventDefault(); exec('undo'); }}><Icon d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" size={13} /></button>
      <button className="ns-tool" title="Redo" onMouseDown={e => { e.preventDefault(); exec('redo'); }}><Icon d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" size={13} /></button>
      <div className="ns-tool-sep" />
      <div style={{ position:'relative' }}>
        <button className="ns-tool" title="Export" onMouseDown={e => { e.preventDefault(); setShowExport(v => !v); }}>
          <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={13} />
          Export
        </button>
        {showExport && <ExportMenu editorRef={editorRef} onClose={() => setShowExport(false)} />}
      </div>
      <div style={{ flex:1 }} />
      <button className="ns-tool" title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Expand to fullscreen'} onMouseDown={e => { e.preventDefault(); onToggleFullscreen(); }}>
        {isFullscreen
          ? <Icon d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" size={14} />
          : <Icon d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3" size={14} />
        }
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
          <Icon d="M5 13l4 4L19 7" size={14} color="#0E1117" />
          Save
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
    onKeyUp: handleKeyUp,
    onMouseUp: handleMouseUp,
    spellCheck: false,
  };

  if (isFullscreen) {
    return createPortal(
      <div className="ns-fullscreen">
        <div className="ns-fullscreen-inner">
          {toolbar(true)}
          <div {...editableProps} />
        </div>
        {statusBar()}
      </div>,
      document.body
    );
  }

  return (
    <div>
      {toolbar(false)}
      <div {...editableProps} />
      {statusBar()}
    </div>
  );
}

const TABS = [
  { id:'scan_edit',  label:'Scan & Edit',      icon:'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { id:'summary',    label:'AI Summary',       icon:'M13 10V3L4 14h7v7l9-11h-7z' },
  { id:'flashcards', label:'Flashcards',       icon:'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
];

const ResultsPage = ({ onBack }) => {
  const [page,             setPage]             = useState('results');
  const [activeTab,        setActiveTab]        = useState('scan_edit');
  const [isSaved,          setIsSaved]          = useState(false);
  const [showAdd,          setShowAdd]          = useState(false);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [scanEditView,     setScanEditView]     = useState('both'); // 'both' | 'image' | 'editor'
  const { cards, addCard } = useCards();

  //backend wiring
  const fileId  = sessionStorage.getItem('lastUploadId');
  const token   = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = token
    ? { 'Content-Type': 'application/json', 'x-auth-token': token }
    : { 'Content-Type': 'application/json' };

  const [fileData,            setFileData]            = useState(null);
  const [recognizedText,      setRecognizedText]      = useState('');
  const [aiSummary,           setAiSummary]           = useState('');
  const [studyGuideText,      setStudyGuideText]      = useState('');
  const [transcriptionEdited, setTranscriptionEdited] = useState(false);
  const [summaryEdited, setSummaryEdited]     = useState(false);
  const [overlayUrl, setOverlayUrl] = useState(sessionStorage.getItem("lastOcrOverlayUrl") || "");

  useEffect(() => {
    if (!fileId) return;
    fetch(`/api/files/${fileId}`, { headers })
      .then(r => r.json())
      .then(data => {
        setFileData(data);
        if (data.currentContent?.transcribedText) setRecognizedText(data.currentContent.transcribedText);
        if (data.currentContent?.summary)         setAiSummary(data.currentContent.summary);
        if (data.currentContent?.studyGuide)      setStudyGuideText(data.currentContent.studyGuide);
        const ssOverlay = sessionStorage.getItem("lastOcrOverlayUrl");
        if (ssOverlay) setOverlayUrl(ssOverlay);

        const ssMerged = sessionStorage.getItem("lastOcrMergedText");
        if (ssMerged) setRecognizedText(ssMerged);
      })
      .catch(err => console.error('Failed to load file data:', err));
  }, [fileId]);

  const saveEdit = async (endpoint, payload, onSuccess, setEdited) => {
    if (!fileId) return;
    try {
      const res  = await fetch(`/api/files/${fileId}/${endpoint}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.currentContent) { onSuccess(data.currentContent); if (setEdited) setEdited(true); }
    } catch (err) { console.error('Save edit error:', err); }
  };

  const requestRegenerate = async (contentType) => {
    if (!fileId) return;
    await fetch(`/api/files/${fileId}/regenerate`, { method: 'POST', headers, body: JSON.stringify({ contentType }) });
  };

  const learnedCount = cards.filter(c => c.learned).length;
  const pct          = cards.length ? Math.round((learnedCount / cards.length) * 100) : 0;

  if (page === 'flashcards') return <FlashcardsPage onBack={() => setPage('results')} />;

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, color:T.cream }}>

      {/* Top bar */}
      <div style={{ borderBottom:`1px solid ${T.border}`, padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:58, position:'sticky', top:0, background:`${T.bg}ee`, backdropFilter:'blur(12px)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          {onBack && (
            <button className="ns-btn-ghost" onClick={onBack} style={{ padding:'6px 12px', fontSize:13 }}>
              <Icon d="M15 19l-7-7 7-7" size={14} /> Back
            </button>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={15} color="#0E1117" />
            </div>
            <span style={{ fontFamily:T.serif, fontSize:17, color:T.cream }}>NoteScan</span>
          </div>
        </div>
        <button className="ns-btn-amber" onClick={() => setIsSaved(true)} disabled={isSaved} style={{ opacity:isSaved ? .7 : 1 }}>
          {isSaved
            ? <><Icon d="M5 13l4 4L19 7" size={14} color="#0E1117" />Saved</>
            : <><Icon d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" size={14} color="#0E1117" />Save Notes</>
          }
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding:'40px 40px 0', animation:'fadeUp .4s ease both' }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 10px' }}>Processing Complete</p>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:T.serif, fontSize:38, fontWeight:400, margin:'0 0 8px', lineHeight:1.1, letterSpacing:'-.4px' }}>OCR Results</h1>
            <p style={{ color:T.muted, fontSize:14, margin:0 }}>Your notes have been scanned and processed successfully.</p>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', background:T.greenDim, border:`1px solid rgba(52,211,153,.2)`, borderRadius:99, flexShrink:0 }}>
            <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={15} color={T.green} />
            <span style={{ fontSize:13, fontWeight:600, color:T.green }}>87% Confidence</span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:6, borderBottom:`1px solid ${T.border}`, overflowX:'auto' }} className="ns-scrollbar">
          {TABS.map(tab => (
            <button key={tab.id}
              className={`ns-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ marginBottom:-1, borderBottomLeftRadius:activeTab === tab.id ? 0 : 10, borderBottomRightRadius:activeTab === tab.id ? 0 : 10, borderBottom:activeTab === tab.id ? `1px solid ${T.bg}` : '1px solid transparent' }}
            >
              <Icon d={tab.icon} size={14} color="currentColor" />
              {tab.label}
              {tab.id === 'flashcards' && (
                <span style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:99, padding:'1px 7px', fontSize:11, color:T.muted, fontWeight:600 }}>{cards.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

        {/* Content grid */}
        <div style={styles.contentGrid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <svg style={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Original Image
            </h3>
            <div style={styles.imagePreview}>
              {overlayUrl ? (
                <img src={overlayUrl} alt="OCR overlay" style={styles.imageActual} />
              ) : (
                <>
                  <svg style={styles.imagePlaceholder} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p style={styles.imagePlaceholderText}>{fileData?.originalName || "Uploaded image"}</p>
                </>
              )}
            </div>
          </div>
        </div>
      {/* Tab panels */}
      <div style={{ padding:'0 40px 64px' }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderTop:'none', borderRadius:'0 0 16px 16px', padding:'32px 36px', minHeight:400 }}>

          {/* Scan & Edit */}
          {activeTab === 'scan_edit' && (
            <div key="scan_edit" className="ns-tab-panel">

              {/* Mobile toggle */}
              <div style={{ display:'flex', gap:6, marginBottom:16 }}>
                {[['both','Both'],['image','Scan'],['editor','Editor']].map(([val, label]) => (
                  <button key={val} onClick={() => setScanEditView(val)}
                    style={{ padding:'5px 14px', borderRadius:8, fontSize:12, fontWeight:600, fontFamily:T.font, cursor:'pointer', border:`1px solid ${scanEditView===val ? T.amber : T.border}`, background:scanEditView===val ? T.amberDim : 'transparent', color:scanEditView===val ? T.amber : T.muted, transition:'all .15s' }}>
                    {label}
                  </button>
                ))}
                <div style={{ flex:1 }} />
                {transcriptionEdited && (
                  <button className="ns-regen" onClick={() => requestRegenerate('all')}>
                    <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={12} />
                    Regenerate all
                  </button>
                )}
              </div>

              {/* Split layout */}
              <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>

                {/* Image pane */}
                {(scanEditView === 'both' || scanEditView === 'image') && (
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.muted, margin:'0 0 10px', fontFamily:T.font }}>Original Scan</p>
                    <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:14, overflow:'hidden', minHeight:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:24 }}>
                      {/* Placeholder — replace with <img src={scanImageUrl} /> when backend provides it */}
                      <div style={{ width:80, height:80, borderRadius:20, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" size={36} color={T.amber} />
                      </div>
                      <p style={{ fontSize:14, fontWeight:600, color:T.cream, margin:0 }}>lecture_notes_01.jpg</p>
                      <p style={{ fontSize:12, color:T.muted, margin:0, textAlign:'center' }}>Scanned image will appear here once<br/>image serving is wired up.</p>
                    </div>
                  </div>
                )}

                {/* Divider */}
                {scanEditView === 'both' && (
                  <div style={{ width:1, alignSelf:'stretch', background:T.border, flexShrink:0 }} />
                )}

                {/* Editor pane */}
                {(scanEditView === 'both' || scanEditView === 'editor') && (
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.muted, margin:'0 0 10px', fontFamily:T.font }}>Recognized Text</p>
                    <RichTextEditor
                      initialText={recognizedText}
                      isFullscreen={editorFullscreen}
                      onToggleFullscreen={() => setEditorFullscreen(f => !f)}
                      onSave={(payload) => saveEdit(
                        'edit/transcription',
                        payload,
                        (c) => { setRecognizedText(c.transcribedText); setTranscriptionEdited(true); },
                        setTranscriptionEdited
                      )}
                    />
                  </div>
                )}

              </div>
            </div>
          )}

          {/* AI Summary */}
          {activeTab === 'summary' && (
            <div key="summary" className="ns-tab-panel">
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:16 }}>
                <button className="ns-regen" onClick={() => requestRegenerate('summary')}>
                  <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={12} /> Regenerate
                </button>
              </div>
              <div style={{ background:'linear-gradient(135deg,rgba(245,166,35,.06) 0%,rgba(129,140,248,.06) 100%)', border:`1px solid ${T.border}`, borderRadius:12, padding:'20px 24px', fontFamily:T.font, fontSize:14, lineHeight:1.8, color:T.cream }}>
                {aiSummary || <span style={{ color:T.muted, fontStyle:'italic' }}>Waiting for AI summary…</span>}
              </div>
            </div>
          )}

          {/* Flashcards */}
          {activeTab === 'flashcards' && (
            <div key="flashcards" className="ns-tab-panel">
              <div style={{ marginBottom:28 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:T.muted, marginBottom:10 }}>
                  <span>{learnedCount} of {cards.length} cards learned</span>
                  <span style={{ color:pct === 100 ? T.green : T.amber, fontWeight:600 }}>{pct}%</span>
                </div>
                <div style={{ height:5, borderRadius:99, background:T.surfaceHi, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${T.amber},${T.purple})`, borderRadius:99, transition:'width .5s cubic-bezier(.4,0,.2,1)' }} />
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:14, marginBottom:28 }}>
                {cards.map(c => <PreviewCard key={c.id} card={c} />)}
                <div onClick={() => setShowAdd(true)}
                  style={{ height:140, flex:'0 0 220px', background:T.surfaceHi, border:`1px dashed ${T.borderHi}`, borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', transition:'border-color .2s,background .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=T.amber; e.currentTarget.style.background=T.amberDim; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=T.borderHi; e.currentTarget.style.background=T.surfaceHi; }}
                >
                  <Icon d="M12 6v6m0 0v6m0-6h6m-6 0H6" size={20} color={T.muted} />
                  <span style={{ fontSize:12, color:T.muted, fontFamily:T.font }}>Add card</span>
                </div>
              </div>
              <button className="ns-study-btn" onClick={() => setPage('flashcards')}>
                <Icon d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={17} color="#fff" />
                Study All {cards.length} Flashcards
              </button>
            </div>
          )}

        </div>
      </div>

      {showAdd && <CardModal onSave={(q, a) => { addCard(q, a); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
    </div>
  );
};

const previewFace = {
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
  borderRadius: 10, border: '1.5px solid',
  display: 'flex', flexDirection: 'column', padding: '10px 14px', overflow: 'hidden',
};
const previewTag = { fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#9CA3AF', marginBottom: 6 };
const previewText = {
  fontSize: 12, fontWeight: 600, color: '#1F2937', margin: 0, lineHeight: 1.45,
  display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  box: { background: '#fff', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 24px 48px rgba(0,0,0,.18)' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 },
  textarea: { width: '100%', boxSizing: 'border-box', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', color: '#111827', resize: 'vertical', outline: 'none', display: 'block', marginBottom: 14 },
  solid: { padding: '9px 18px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  ghost: { padding: '9px 18px', background: 'transparent', color: '#374151', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '2rem' },
  wrapper: { maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  backButton: {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'white', color: '#4F46E5',
    border: '1px solid #E5E7EB', borderRadius: '0.625rem',
    fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  },
  backIcon: { width: '16px', height: '16px' },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
  logoIcon: { width: '28px', height: '28px', color: '#4F46E5' },
  logoText: { fontSize: '1.25rem', fontWeight: '700', color: '#1F2937' },
  title: { fontSize: '2rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.25rem' },
  subtitle: { color: '#6B7280' },
  headerActions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  exportButton: { padding: '0.625rem 1.25rem', backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', fontFamily: 'inherit' },
  saveButton: { padding: '0.625rem 1.25rem', backgroundColor: '#22C55E', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', fontFamily: 'inherit' },
  saveButtonSaved: { backgroundColor: '#10B981', cursor: 'default' },
  buttonIcon: { width: '18px', height: '18px' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  card: { backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' },
  cardTitle: { fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1F2937' },
  cardIcon: { width: '20px', height: '20px', color: '#4F46E5' },
  imagePreview: { backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '0.75rem', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' },
  imageActual: { width: "100%", height: "100%", objectFit: "contain", borderRadius: "0.75rem" },
  imagePlaceholder: { width: '64px', height: '64px', color: '#9CA3AF' },
  imagePlaceholderText: { color: '#6B7280', fontSize: '0.875rem' },
  textContent: { backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: '0.75rem', padding: '1rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' },
  textPre: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif', fontSize: '0.875rem', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap', color: '#1F2937' },
  confidenceBadge: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.5rem' },
  badgeIcon: { width: '20px', height: '20px', color: '#3B82F6' },
  badgeText: { fontSize: '0.875rem', fontWeight: '500', color: '#1E40AF' },
  aiSection: { marginTop: '2rem' },
  aiSectionTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', marginBottom: '1.5rem' },
  aiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' },
  aiCard: { backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' },
  aiCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  aiCardTitle: { fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1F2937', margin: 0 },
  regenerateButton: { padding: '0.5rem 0.75rem', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'background-color 0.2s', fontFamily: 'inherit' },
  smallIcon: { width: '14px', height: '14px' },
  summaryBox: { padding: '1.25rem', background: 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%)', border: '1px solid #E9D5FF', borderRadius: '0.75rem' },
  summaryText: { fontSize: '0.875rem', lineHeight: '1.6', color: '#1F2937', margin: 0 },
  studyButton: {
    width: '100%', padding: '12px 20px',
    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
    color: '#fff', border: 'none', borderRadius: '0.75rem',
    fontSize: '0.9375rem', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(79,70,229,.35)',
  },
};

export default ResultsPage;
