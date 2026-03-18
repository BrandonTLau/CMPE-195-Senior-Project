import { useState, useRef } from "react";

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
  red:       '#F87171',
  redDim:    'rgba(248,113,113,0.12)',
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
styleEl.id = 'fc-styles';
styleEl.textContent = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

  .fc-btn-ghost {
    background: transparent; border: 1px solid ${T.border}; color: ${T.muted};
    border-radius: 8px; padding: 7px 16px; font-family: ${T.font}; font-size: 13px;
    font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    transition: border-color .2s, color .2s, background .2s;
  }
  .fc-btn-ghost:hover { border-color: ${T.borderHi}; color: ${T.cream}; background: ${T.surfaceHi}; }

  .fc-btn-amber {
    background: ${T.amber}; border: none; color: #0E1117;
    border-radius: 9px; padding: 8px 20px; font-family: ${T.font}; font-size: 13px; font-weight: 600;
    cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    transition: opacity .2s, transform .15s;
  }
  .fc-btn-amber:hover { opacity: .88; transform: translateY(-1px); }

  .fc-nav-btn {
    padding: 10px 24px; border: 1px solid ${T.border}; border-radius: 10px;
    background: ${T.surfaceHi}; color: ${T.muted}; font-family: ${T.font};
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: border-color .2s, color .2s, background .2s;
  }
  .fc-nav-btn:hover:not(:disabled) { border-color: ${T.amber}; color: ${T.amber}; background: ${T.amberDim}; }
  .fc-nav-btn:disabled { opacity: .3; cursor: not-allowed; }

  .fc-action-btn {
    padding: 11px 28px; border: 1px solid ${T.border}; border-radius: 9px;
    background: transparent; color: ${T.muted}; font-family: ${T.font};
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: border-color .2s, color .2s, background .2s;
  }
  .fc-action-btn:hover { border-color: ${T.borderHi}; color: ${T.cream}; background: ${T.surfaceHi}; }
  .fc-action-btn.danger { border-color: rgba(248,113,113,.3); color: ${T.red}; }
  .fc-action-btn.danger:hover { background: ${T.redDim}; border-color: ${T.red}; }

  .fc-input {
    width: 100%; box-sizing: border-box;
    background: ${T.surfaceHi}; border: 1px solid ${T.border};
    color: ${T.cream}; border-radius: 10px; padding: 10px 14px;
    font-family: ${T.font}; font-size: 14px; outline: none;
    transition: border-color .2s; resize: vertical;
  }
  .fc-input:focus { border-color: ${T.amber}; }
  .fc-input::placeholder { color: ${T.muted}; }
`;
if (!document.head.querySelector('#fc-styles')) {
  document.head.appendChild(styleEl);
}

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const INITIAL_CARDS = [
  { id: 1, question: "What is machine learning?",                         answer: "A subset of AI that enables computer systems to improve performance through experience." },
  { id: 2, question: "What are the three main types of machine learning?", answer: "Supervised Learning, Unsupervised Learning, and Reinforcement Learning." },
  { id: 3, question: "What is supervised learning?",                      answer: "Training machine learning models with labeled data." },
  { id: 4, question: "What is unsupervised learning?",                    answer: "Finding patterns and structure in unlabeled data without explicit guidance." },
  { id: 5, question: "What is reinforcement learning?",                   answer: "Learning through trial and error, where the model receives rewards or penalties for actions." },
  { id: 6, question: "Name a common application of machine learning.",    answer: "Image recognition, natural language processing, and predictive analytics." },
];

function useCards() {
  const [cards, setCards] = useState(INITIAL_CARDS.map(c => ({ ...c })));
  const nextId = useRef(INITIAL_CARDS.length + 1);
  const addCard    = (q, a)    => setCards(p => [...p, { id: nextId.current++, question: q, answer: a }]);
  const deleteCard = (id)      => setCards(p => p.filter(c => c.id !== id));
  const editCard   = (id, q, a) => setCards(p => p.map(c => c.id === id ? { ...c, question: q, answer: a } : c));
  return { cards, addCard, deleteCard, editCard };
}

function CardModal({ initial, onSave, onClose }) {
  const [q, setQ] = useState(initial?.question ?? '');
  const [a, setA] = useState(initial?.answer   ?? '');
  const valid = q.trim() && a.trim();
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, padding:32, width:440, maxWidth:'90vw', boxShadow:'0 32px 64px rgba(0,0,0,.6)', animation:'fadeUp .2s ease both' }}>
        <p style={{ fontFamily:T.serif, fontSize:22, color:T.cream, margin:'0 0 24px' }}>
          {initial ? 'Edit Flashcard' : 'New Flashcard'}
        </p>
        {[['Question', q, setQ], ['Answer', a, setA]].map(([label, val, set]) => (
          <div key={label} style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:T.muted, marginBottom:8, fontFamily:T.font }}>{label}</label>
            <textarea className="fc-input" value={val} onChange={e => set(e.target.value)}
              rows={3} placeholder={`Enter ${label.toLowerCase()}…`} />
          </div>
        ))}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
          <button className="fc-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="fc-btn-amber" onClick={() => valid && onSave(q.trim(), a.trim())}
            style={{ opacity: valid ? 1 : 0.4 }}>Save Card</button>
        </div>
      </div>
    </div>
  );
}

function DotNav({ total, current, onChange }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', maxWidth:400 }}>
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} onClick={() => onChange(i)} title={`Card ${i + 1}`}
          style={{
            width:8, height:8, borderRadius:'50%', border:'none', padding:0, cursor:'pointer',
            background: i === current ? T.amber : T.border,
            transform: i === current ? 'scale(1.5)' : 'scale(1)',
            transition: 'all .2s',
          }}
        />
      ))}
    </div>
  );
}

export default function FlashcardsPage({ onBack }) {
  const { cards, addCard, deleteCard, editCard } = useCards();
  const [index,      setIndex]   = useState(0);
  const [flipped,    setFlipped] = useState(false);
  const [animDir,    setAnimDir] = useState(null);
  const [showAdd,    setShowAdd] = useState(false);
  const [editTarget, setEdit]    = useState(null);

  const card = cards[index];

  const go = (dir) => {
    if (animDir) return;
    const next = dir === 1
      ? Math.min(index + 1, cards.length - 1)
      : Math.max(index - 1, 0);
    if (next === index) return;
    setAnimDir(dir === 1 ? 'left' : 'right');
    setFlipped(false);
    setTimeout(() => { setIndex(next); setAnimDir(null); }, 220);
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft')  go(-1);
    if (e.key === ' ')          { e.preventDefault(); setFlipped(f => !f); }
  };

  const handleDelete = () => {
    deleteCard(card.id);
    setIndex(i => Math.min(i, cards.length - 2));
    setFlipped(false);
  };

  const jumpTo = (i) => { setIndex(i); setFlipped(false); };

  if (cards.length === 0) return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <p style={{ color:T.muted, fontSize:14 }}>No cards yet.</p>
      <button className="fc-btn-amber" onClick={() => setShowAdd(true)}>
        <Icon d="M12 4v16m8-8H4" size={14} color="#0E1117" /> Add Card
      </button>
      {showAdd && <CardModal onSave={(q, a) => { addCard(q, a); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, color:T.cream, display:'flex', flexDirection:'column', alignItems:'center', padding:'0 16px 48px', outline:'none' }}
      onKeyDown={handleKey} tabIndex={0}>

      {/* Top bar */}
      <div style={{ width:'100%', maxWidth:720, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 0 16px', gap:12, flexWrap:'wrap' }}>
        <button className="fc-btn-ghost" onClick={onBack ?? (() => {})}>
          <Icon d="M15 19l-7-7 7-7" size={14} /> Back
        </button>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
          <p style={{ fontFamily:T.serif, fontSize:18, color:T.cream, margin:0 }}>Flashcards</p>
          <span style={{ fontSize:12, color:T.muted }}>{index + 1} / {cards.length}</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="fc-btn-ghost" onClick={() => setShowAdd(true)} style={{ padding:'7px 14px', fontSize:12 }}>
            <Icon d="M12 4v16m8-8H4" size={13} /> Add Card
          </button>
        </div>
      </div>

      {/* Card */}
      <div style={{ width:'100%', maxWidth:680, flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px 0', perspective:1200 }}>
        <div style={{
          width:'100%', height:320,
          transform: animDir === 'left'  ? 'translateX(-60px) scale(.96)' :
                     animDir === 'right' ? 'translateX(60px) scale(.96)'  : 'none',
          opacity: animDir ? 0 : 1,
          transition: 'transform .22s ease, opacity .22s ease',
        }}>
          <div onClick={() => setFlipped(f => !f)} style={{
            width:'100%', height:'100%',
            transformStyle:'preserve-3d',
            transition:'transform .55s cubic-bezier(.4,0,.2,1)',
            transform: flipped ? 'rotateY(180deg)' : 'none',
            cursor:'pointer', position:'relative',
          }}>
            {/* Front — Question */}
            <div style={{
              position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
              borderRadius:20, border:`1px solid ${T.border}`,
              background:`linear-gradient(135deg, ${T.surface} 0%, ${T.surfaceHi} 100%)`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              padding:'40px 48px', boxShadow:'0 24px 48px rgba(0,0,0,.4)',
            }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, marginBottom:20, fontFamily:T.font }}>Question</span>
              <p style={{ fontFamily:T.serif, fontSize:'clamp(18px,3vw,26px)', fontWeight:400, color:T.cream, textAlign:'center', lineHeight:1.5, margin:0 }}>{card.question}</p>
              <span style={{ marginTop:28, fontSize:11, color:T.muted, fontFamily:T.font }}>tap to reveal answer · space bar</span>
            </div>

            {/* Back — Answer */}
            <div style={{
              position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
              borderRadius:20, border:`1px solid rgba(129,140,248,.2)`,
              background:`linear-gradient(135deg, #1a1535 0%, #1E1B4B 100%)`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              padding:'40px 48px', boxShadow:'0 24px 48px rgba(0,0,0,.4)',
              transform:'rotateY(180deg)',
            }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.purple, marginBottom:20, fontFamily:T.font }}>Answer</span>
              <p style={{ fontFamily:T.font, fontSize:'clamp(15px,2.5vw,20px)', fontWeight:400, color:T.cream, textAlign:'center', lineHeight:1.6, margin:0 }}>{card.answer}</p>
              <span style={{ marginTop:28, fontSize:11, color:T.muted, fontFamily:T.font }}>tap to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap', justifyContent:'center' }}>
        <button className="fc-action-btn" onClick={() => setEdit(card)}>
          <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={13} />
          Edit
        </button>
        <button className="fc-action-btn danger" onClick={handleDelete}>
          <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={13} />
          Delete
        </button>
      </div>

      {/* Nav */}
      <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:20, width:'100%', maxWidth:600, justifyContent:'space-between' }}>
        <button className="fc-nav-btn" onClick={() => go(-1)} disabled={index === 0}>← Prev</button>
        <DotNav total={cards.length} current={index} onChange={jumpTo} />
        <button className="fc-nav-btn" onClick={() => go(1)} disabled={index === cards.length - 1}>Next →</button>
      </div>

      <p style={{ color:T.muted, fontSize:11, fontFamily:T.font, letterSpacing:.3 }}>← → arrow keys to navigate · space to flip</p>

      {showAdd && (
        <CardModal onSave={(q, a) => { addCard(q, a); setShowAdd(false); }} onClose={() => setShowAdd(false)} />
      )}
      {editTarget && (
        <CardModal initial={editTarget}
          onSave={(q, a) => { editCard(editTarget.id, q, a); setEdit(null); setFlipped(false); }}
          onClose={() => setEdit(null)} />
      )}
    </div>
  );
}
