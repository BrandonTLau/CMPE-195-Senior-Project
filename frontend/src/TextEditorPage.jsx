import React, { useState, useRef, useCallback, useEffect } from 'react';

function textToBlockHtml(text) {
  return text
    .split('\n')
    .map(line => `<div>${line.trim() === '' ? '<br>' : line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`)
    .join('');
}


function ExportModal({ editorRef, onClose }) {
  const [copied, setCopied] = useState(false);

  const getText = () => editorRef.current?.innerText || '';

  const copyClipboard = () => {
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadTxt = () => {
    const blob = new Blob([getText()], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ocr-notes.txt';
    a.click();
  };

  const printPdf = () => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>OCR Notes</title>
      <style>body{font-family:Georgia,serif;max-width:780px;margin:48px auto;line-height:1.8;color:#111;font-size:15px}h1,h2,h3{margin-top:1.4em}@media print{body{margin:24px}}</style>
      </head><body>${editorRef.current?.innerHTML || ''}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const options = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
      ),
      label: copied ? '✓ Copied!' : 'Copy to Clipboard',
      desc: 'Plain text, ready to paste anywhere',
      action: copyClipboard,
      active: copied,
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M4 19h16M4 5h16"/>
        </svg>
      ),
      label: 'Download TXT',
      desc: 'Save as a plain text file',
      action: downloadTxt,
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17H17.01M3 7h18M3 12h18M3 17h11M17 21v-4m0 0l-2 2m2-2l2 2"/>
        </svg>
      ),
      label: 'Print / Save as PDF',
      desc: 'Use your browser\'s print dialog',
      action: printPdf,
    },
  ];

  return (
    <div style={M.overlay} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div style={M.box}>
        <div style={M.header}>
          <span style={M.title}>Export</span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((o, i) => (
            <button
              key={i}
              onClick={o.action}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px',
                background: o.active ? '#EEF2FF' : 'white',
                border: `1.5px solid ${o.active ? '#C7D2FE' : '#E5E7EB'}`,
                borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'left', width: '100%',
              }}
              onMouseEnter={e => { if (!o.active) e.currentTarget.style.background = '#F9FAFB'; }}
              onMouseLeave={e => { if (!o.active) e.currentTarget.style.background = 'white'; }}
            >
              <span style={{ color: o.active ? '#4F46E5' : '#6B7280', flexShrink: 0 }}>{o.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: o.active ? '#4F46E5' : '#111827' }}>{o.label}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function TextEditorPage({ initialContent = '', onBack, onSave }) {
  const editorRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [docTitle, setDocTitle] = useState('OCR Document');
  const saveTimer = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = textToBlockHtml(initialContent);
      setWordCount(initialContent.trim().split(/\s+/).filter(Boolean).length);
    }
  }, []); 

  const handleInput = () => {
    const text = editorRef.current?.innerText || '';
    setWordCount(text.trim() === '' ? 0 : text.trim().split(/\s+/).length);
    clearTimeout(saveTimer.current);
    setIsSaving(true);
    saveTimer.current = setTimeout(() => { setIsSaving(false); setLastSaved(new Date()); }, 1200);
  };

 
  const execCmd = useCallback((cmd, value = null) => {
    editorRef.current?.focus();
    if (cmd === 'formatBlock' && value) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const container = editorRef.current;
      const BLOCK_TAGS = new Set(['H1','H2','H3','H4','H5','H6','P','DIV','LI','BLOCKQUOTE']);
      const targetTag = value.toUpperCase();
      const getTopBlock = (node) => {
        let n = node.nodeType === 3 ? node.parentElement : node;
        while (n && n.parentElement !== container) n = n.parentElement;
        return (n && n !== container && BLOCK_TAGS.has(n.tagName)) ? n : null;
      };
      const seen = new Set(); const blocks = [];
      const add = (node) => { const b = getTopBlock(node); if (b && !seen.has(b)) { seen.add(b); blocks.push(b); } };
      const tw = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let tn = tw.nextNode();
      while (tn) { if (range.intersectsNode(tn)) add(tn); tn = tw.nextNode(); }
      add(range.startContainer); add(range.endContainer);
      if (blocks.length === 0) { document.execCommand('formatBlock', false, value); return; }
      const allMatch = blocks.every(b => b.tagName === targetTag);
      blocks.forEach(block => {
        const el = document.createElement(allMatch ? 'DIV' : targetTag);
        el.innerHTML = block.innerHTML;
        block.parentNode.replaceChild(el, block);
      });
      selection.removeAllRanges();
      return;
    }
    document.execCommand(cmd, false, value);
  }, []);

  const handleSaveAndBack = () => {
    onSave?.(editorRef.current?.innerText || '');
    onBack?.();
  };

  const formatTime = d => d
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const tools = [
    { title: 'Undo',  cmd: 'undo', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg> },
    { title: 'Redo',  cmd: 'redo', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg> },
    { divider: true },
    { title: 'Bold',      cmd: 'bold',      icon: <b style={{ fontSize: 13, fontFamily: 'serif' }}>B</b> },
    { title: 'Italic',    cmd: 'italic',    icon: <i style={{ fontSize: 13, fontFamily: 'serif' }}>I</i> },
    { title: 'Underline', cmd: 'underline', icon: <u style={{ fontSize: 13 }}>U</u> },
    { divider: true },
    { title: 'Heading 1', cmd: 'formatBlock', val: 'H1', icon: <span style={{ fontSize: 11, fontWeight: 800 }}>H1</span> },
    { title: 'Heading 2', cmd: 'formatBlock', val: 'H2', icon: <span style={{ fontSize: 11, fontWeight: 800 }}>H2</span> },
    { title: 'Heading 3', cmd: 'formatBlock', val: 'H3', icon: <span style={{ fontSize: 11, fontWeight: 800 }}>H3</span> },
    { divider: true },
    { title: 'Bullet list',   cmd: 'insertUnorderedList', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
    { title: 'Numbered list', cmd: 'insertOrderedList',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6h11M10 12h11M10 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg> },
  ];

  return (
    <div style={E.page}>
     
      <div style={E.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={E.backBtn} onClick={handleSaveAndBack}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <div style={E.docPill}>
            <input
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.target.blur()}
              style={E.titleInput}
              spellCheck={false}
            />
          </div>
          <span style={{ fontSize: 11, color: isSaving ? '#9CA3AF' : lastSaved ? '#10B981' : '#C0C0C0', whiteSpace: 'nowrap' }}>
            {isSaving ? 'Saving…' : lastSaved ? `✓ Saved at ${formatTime(lastSaved)}` : 'Unsaved'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{wordCount} words</span>
          <button style={E.exportBtn} onClick={() => setShowExport(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M4 19h16"/>
            </svg>
            Export
          </button>
          <button style={E.saveBtn} onClick={handleSaveAndBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Save & Close
          </button>
        </div>
      </div>

     
      <div style={E.toolbar}>
        {tools.map((t, i) =>
          t.divider
            ? <div key={i} style={E.divider} />
            : (
              <button
                key={i}
                title={t.title}
                onMouseDown={e => { e.preventDefault(); execCmd(t.cmd, t.val || null); }}
                style={E.toolBtn}
                onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {t.icon}
              </button>
            )
        )}
      </div>

     
      <div style={E.canvas}>
        <div style={E.paper}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            style={E.editable}
          />
        </div>
      </div>

      {showExport && <ExportModal editorRef={editorRef} onClose={() => setShowExport(false)} />}
    </div>
  );
}


const E = {
  page: {
    minHeight: '100vh', background: '#F8F9FA',
    display: 'flex', flexDirection: 'column',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', background: 'white',
    borderBottom: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', background: 'white', color: '#374151',
    border: '1px solid #E5E7EB', borderRadius: 7,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  },
  docPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 10px', background: 'white',
    border: '1px solid #E5E7EB', borderRadius: 7,
  },
  titleInput: {
    fontSize: 13, fontWeight: 600, color: '#1F2937',
    background: 'transparent', border: 'none', outline: 'none',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    width: 170,
  },
  exportBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', background: 'white', color: '#374151',
    border: '1px solid #E5E7EB', borderRadius: 7,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  },
  saveBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
    color: 'white', border: 'none', borderRadius: 7,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 1,
    padding: '5px 16px', background: 'white',
    borderBottom: '1px solid #E5E7EB',
  },
  toolBtn: {
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 'none', borderRadius: 5,
    color: '#374151', cursor: 'pointer', flexShrink: 0,
  },
  divider: { width: 1, height: 18, background: '#E5E7EB', margin: '0 5px', flexShrink: 0 },
  canvas: {
    flex: 1, overflowY: 'auto', padding: '36px 24px',
    display: 'flex', justifyContent: 'center',
  },
  paper: {
    width: '100%', maxWidth: 780,
    background: 'white', minHeight: 'calc(100vh - 180px)',
    borderRadius: 4,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
    padding: '56px 68px',
  },
  editable: {
    outline: 'none', fontSize: 15, lineHeight: 1.8,
    color: '#1F2937', minHeight: 360, caretColor: '#4F46E5',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
};

const M = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(2px)',
  },
  box: {
    background: 'white', borderRadius: 12, width: 380, maxWidth: '92vw',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
  },
  title: { fontSize: 15, fontWeight: 700, color: '#111827' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 13, color: '#9CA3AF',
    cursor: 'pointer', padding: 4, borderRadius: 4, fontFamily: 'inherit',
  },
};
