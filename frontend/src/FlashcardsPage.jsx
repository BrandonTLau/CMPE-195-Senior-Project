import { useState, useRef } from "react";


const INITIAL_CARDS = [
  { id: 1, question: "What is machine learning?", answer: "A subset of AI that enables computer systems to improve performance through experience.", learned: false },
  { id: 2, question: "What are the three main types of machine learning?", answer: "Supervised Learning, Unsupervised Learning, and Reinforcement Learning.", learned: false },
  { id: 3, question: "What is supervised learning?", answer: "Training machine learning models with labeled data.", learned: false },
  { id: 4, question: "What is unsupervised learning?", answer: "Finding patterns and structure in unlabeled data without explicit guidance.", learned: false },
  { id: 5, question: "What is reinforcement learning?", answer: "Learning through trial and error, where the model receives rewards or penalties for actions.", learned: false },
  { id: 6, question: "Name a common application of machine learning.", answer: "Image recognition, natural language processing, and predictive analytics.", learned: false },
];

function useCards() {
  const [cards, setCards] = useState(INITIAL_CARDS.map(c => ({ ...c })));
  const nextId = useRef(INITIAL_CARDS.length + 1);
  const addCard     = (q, a) => setCards(p => [...p, { id: nextId.current++, question: q, answer: a, learned: false }]);
  const deleteCard  = (id)   => setCards(p => p.filter(c => c.id !== id));
  const editCard    = (id, q, a) => setCards(p => p.map(c => c.id === id ? { ...c, question: q, answer: a } : c));
  const toggleLearned = (id) => setCards(p => p.map(c => c.id === id ? { ...c, learned: !c.learned } : c));
  const resetAll    = ()     => setCards(INITIAL_CARDS.map(c => ({ ...c, learned: false })));
  return { cards, addCard, deleteCard, editCard, toggleLearned, resetAll };
}


function CardModal({ initial, onSave, onClose }) {
  const [q, setQ] = useState(initial?.question ?? "");
  const [a, setA] = useState(initial?.answer ?? "");
  const valid = q.trim() && a.trim();
  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <h3 style={S.modalTitle}>{initial ? "Edit Card" : "Add New Card"}</h3>
        <label style={S.label}>Question</label>
        <textarea value={q} onChange={e => setQ(e.target.value)} style={S.textarea} placeholder="Enter question…" rows={3} />
        <label style={S.label}>Answer</label>
        <textarea value={a} onChange={e => setA(e.target.value)} style={S.textarea} placeholder="Enter answer…" rows={3} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={S.ghostBtn}>Cancel</button>
          <button onClick={() => valid && onSave(q.trim(), a.trim())} style={{ ...S.solidBtn, opacity: valid ? 1 : 0.45 }}>Save</button>
        </div>
      </div>
    </div>
  );
}


function DotNav({ total, current, learned, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", maxWidth: 480 }}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          title={`Card ${i + 1}`}
          style={{
            width: 10, height: 10, borderRadius: "50%", border: "none", padding: 0, cursor: "pointer",
            background: learned[i] ? "#34D399" : i === current ? "#fff" : "rgba(255,255,255,0.35)",
            transform: i === current ? "scale(1.4)" : "scale(1)",
            transition: "all .2s",
          }}
        />
      ))}
    </div>
  );
}


export default function FlashcardsPage({ onBack }) {
  const { cards, addCard, deleteCard, editCard, toggleLearned, resetAll } = useCards();
  const [index, setIndex]       = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [animDir, setAnimDir]   = useState(null); 
  const [showAdd, setShowAdd]   = useState(false);
  const [editTarget, setEdit]   = useState(null);
  const [filter, setFilter]     = useState("all"); 

  const visible = filter === "unlearned" ? cards.filter(c => !c.learned) : cards;
  const card    = visible[index];
  const learned = visible.map(c => c.learned);
  const learnedCount = cards.filter(c => c.learned).length;
  const pct     = cards.length ? Math.round((learnedCount / cards.length) * 100) : 0;

 
  const go = (dir) => {
    if (animDir) return;
    const next = dir === 1
      ? Math.min(index + 1, visible.length - 1)
      : Math.max(index - 1, 0);
    if (next === index) return;
    setAnimDir(dir === 1 ? "left" : "right");
    setFlipped(false);
    setTimeout(() => { setIndex(next); setAnimDir(null); }, 240);
  };

 
  const handleKey = (e) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft")  go(-1);
    if (e.key === " ")          { e.preventDefault(); setFlipped(f => !f); }
  };

  const handleDelete = () => {
    deleteCard(card.id);
    setIndex(i => Math.min(i, visible.length - 2));
    setFlipped(false);
  };

  const jumpTo = (i) => { setIndex(i); setFlipped(false); };

  if (visible.length === 0) return (
    <div style={{ ...S.page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <p style={{ color: "rgba(255,255,255,.6)", fontSize: 18 }}>
        {filter === "unlearned" ? "All cards learned! 🎉" : "No cards yet."}
      </p>
      {filter === "unlearned" && <button onClick={() => setFilter("all")} style={S.solidBtn}>Show All Cards</button>}
      <button onClick={() => setShowAdd(true)} style={S.solidBtn}>+ Add Card</button>
      {showAdd && <CardModal onSave={(q, a) => { addCard(q, a); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
    </div>
  );

  return (
    <div style={S.page} onKeyDown={handleKey} tabIndex={0}>

      <div style={S.topBar}>
        <button onClick={onBack ?? (() => {})} style={S.backBtn}>
          ← Back to Results
        </button>
        <div style={S.topCenter}>
          <span style={S.deckTitle}>Introduction to Machine Learning</span>
          <span style={S.cardCount}>{index + 1} / {visible.length}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { setFilter(f => f === "all" ? "unlearned" : "all"); setIndex(0); setFlipped(false); }}
            style={{ ...S.topBtn, background: filter === "unlearned" ? "rgba(52,211,153,.25)" : "rgba(255,255,255,.12)" }}
          >
            {filter === "unlearned" ? "🟢 Unlearned only" : "All cards"}
          </button>
          <button onClick={() => setShowAdd(true)} style={S.topBtn}>+ Add</button>
          <button onClick={() => { resetAll(); setIndex(0); setFlipped(false); }} style={S.topBtn}>↺ Reset</button>
        </div>
      </div>

     
      <div style={S.progressWrap}>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${pct}%` }} />
        </div>
        <span style={S.progressLabel}>{learnedCount}/{cards.length} learned</span>
      </div>

     
      <div style={S.stage}>
        <div
          style={{
            ...S.cardWrap,
            transform: animDir === "left"  ? "translateX(-80px) scale(.96)" :
                       animDir === "right" ? "translateX(80px) scale(.96)"  : "none",
            opacity: animDir ? 0 : 1,
            transition: "transform .22s ease, opacity .22s ease",
          }}
        >
       
          <div
            onClick={() => setFlipped(f => !f)}
            style={{
              width: "100%", height: "100%",
              transformStyle: "preserve-3d",
              transition: "transform .6s cubic-bezier(.4,0,.2,1)",
              transform: flipped ? "rotateY(180deg)" : "none",
              cursor: "pointer",
              position: "relative",
            }}
          >
         
            <div style={{ ...S.face, ...S.front, background: card.learned ? "linear-gradient(135deg,#064E3B,#065F46)" : "linear-gradient(135deg,#1E1B4B,#312E81)" }}>
              <span style={S.faceTag}>QUESTION {card.learned ? "✓" : ""}</span>
              <p style={S.faceText}>{card.question}</p>
              <span style={S.tapHint}>tap to flip · space bar</span>
            </div>
            
            <div style={{ ...S.face, ...S.back, background: "linear-gradient(135deg,#1C1917,#292524)" }}>
              <span style={S.faceTag}>ANSWER</span>
              <p style={{ ...S.faceText, fontWeight: 400, fontSize: "clamp(16px,2.5vw,22px)" }}>{card.answer}</p>
              <span style={S.tapHint}>tap to flip back</span>
            </div>
          </div>
        </div>
      </div>

      
      <div style={S.actions}>
        <button
          onClick={() => toggleLearned(card.id)}
          style={{ ...S.actionBtn, background: card.learned ? "rgba(52,211,153,.2)" : "rgba(255,255,255,.1)", borderColor: card.learned ? "#34D399" : "rgba(255,255,255,.2)", color: card.learned ? "#34D399" : "#fff" }}
        >
          {card.learned ? "✓ Learned" : "Mark Learned"}
        </button>
        <button onClick={() => setEdit(card)} style={S.actionBtn}>✏️ Edit</button>
        <button onClick={handleDelete} style={{ ...S.actionBtn, borderColor: "#F87171", color: "#F87171" }}>🗑 Delete</button>
      </div>

     
      <div style={S.navRow}>
        <button onClick={() => go(-1)} disabled={index === 0} style={{ ...S.navBtn, opacity: index === 0 ? 0.3 : 1 }}>
          ← Prev
        </button>
        <DotNav total={visible.length} current={index} learned={learned} onChange={jumpTo} />
        <button onClick={() => go(1)} disabled={index === visible.length - 1} style={{ ...S.navBtn, opacity: index === visible.length - 1 ? 0.3 : 1 }}>
          Next →
        </button>
      </div>

      <p style={S.keyHint}>← → arrow keys to navigate · space to flip</p>

      {showAdd && (
        <CardModal onSave={(q, a) => { addCard(q, a); setShowAdd(false); }} onClose={() => setShowAdd(false)} />
      )}
      {editTarget && (
        <CardModal
          initial={editTarget}
          onSave={(q, a) => { editCard(editTarget.id, q, a); setEdit(null); setFlipped(false); }}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}


const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0F0C29 0%, #1a1040 50%, #0F0C29 100%)",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0 16px 40px",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    outline: "none",
  },
  topBar: {
    width: "100%", maxWidth: 900,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 0 10px", gap: 12, flexWrap: "wrap",
  },
  backBtn: {
    background: "none", border: "none", color: "rgba(255,255,255,.55)",
    fontSize: 14, cursor: "pointer", fontFamily: "inherit", padding: "6px 0",
    letterSpacing: .3,
  },
  topCenter: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  },
  deckTitle: {
    color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: .4,
  },
  cardCount: {
    color: "rgba(255,255,255,.45)", fontSize: 13,
  },
  topBtn: {
    padding: "7px 14px", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8,
    background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 13,
    cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(6px)",
  },
  progressWrap: {
    width: "100%", maxWidth: 600,
    display: "flex", alignItems: "center", gap: 12, marginBottom: 8,
  },
  progressTrack: {
    flex: 1, height: 5, borderRadius: 99,
    background: "rgba(255,255,255,.12)", overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: 99,
    background: "linear-gradient(90deg,#34D399,#10B981)",
    transition: "width .5s ease",
  },
  progressLabel: {
    color: "rgba(255,255,255,.4)", fontSize: 12, whiteSpace: "nowrap",
  },
  stage: {
    flex: 1, width: "100%", maxWidth: 680,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px 0 16px",
    perspective: 1200,
  },
  cardWrap: {
    width: "100%", height: 340,
  },
  face: {
    position: "absolute", inset: 0,
    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
    borderRadius: 24,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "40px 48px",
    boxShadow: "0 32px 64px rgba(0,0,0,.5)",
    border: "1px solid rgba(255,255,255,.08)",
  },
  front: {},
  back: { transform: "rotateY(180deg)" },
  faceTag: {
    fontSize: 11, fontWeight: 700, letterSpacing: 2,
    color: "rgba(255,255,255,.35)", marginBottom: 20, fontFamily: "system-ui, sans-serif",
  },
  faceText: {
    fontSize: "clamp(18px,3vw,26px)", fontWeight: 700,
    color: "#fff", textAlign: "center", lineHeight: 1.5, margin: 0,
  },
  tapHint: {
    marginTop: 28, fontSize: 12,
    color: "rgba(255,255,255,.2)", fontFamily: "system-ui, sans-serif",
  },
  actions: {
    display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center",
    marginBottom: 28,
  },
  actionBtn: {
    padding: "9px 20px",
    border: "1px solid rgba(255,255,255,.2)", borderRadius: 10,
    background: "rgba(255,255,255,.08)", color: "#fff",
    fontSize: 13, cursor: "pointer", fontFamily: "system-ui, sans-serif",
    backdropFilter: "blur(6px)", transition: "all .15s",
  },
  navRow: {
    display: "flex", alignItems: "center", gap: 24,
    marginBottom: 20, width: "100%", maxWidth: 600,
    justifyContent: "space-between",
  },
  navBtn: {
    padding: "10px 24px",
    border: "1px solid rgba(255,255,255,.25)", borderRadius: 10,
    background: "rgba(255,255,255,.1)", color: "#fff",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    fontFamily: "system-ui, sans-serif", backdropFilter: "blur(6px)",
    transition: "opacity .2s",
  },
  keyHint: {
    color: "rgba(255,255,255,.2)", fontSize: 12,
    fontFamily: "system-ui, sans-serif", letterSpacing: .3,
  },
  /* modal */
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#1E1B4B", border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 18, padding: 32, width: 440, maxWidth: "90vw",
    boxShadow: "0 32px 64px rgba(0,0,0,.5)",
  },
  modalTitle: {
    margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#fff",
  },
  label: {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "rgba(255,255,255,.5)", marginBottom: 6, fontFamily: "system-ui, sans-serif",
  },
  textarea: {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.15)",
    borderRadius: 10, padding: "10px 14px", fontSize: 14,
    fontFamily: "Georgia, serif", color: "#fff", resize: "vertical",
    outline: "none", display: "block", marginBottom: 14,
  },
  solidBtn: {
    padding: "10px 22px", background: "#6366F1", color: "#fff",
    border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: "pointer", fontFamily: "system-ui, sans-serif",
  },
  ghostBtn: {
    padding: "10px 22px", background: "transparent",
    border: "1.5px solid rgba(255,255,255,.2)", borderRadius: 10,
    color: "rgba(255,255,255,.7)", fontSize: 14, cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
};