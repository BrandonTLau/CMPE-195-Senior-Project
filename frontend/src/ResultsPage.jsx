import React, { useState, useRef } from 'react';
import FlashcardsPage from './FlashcardsPage';
import TextEditorPage from './TextEditorPage';

const INITIAL_CARDS = [
  { id: 1, question: 'What is machine learning?', answer: 'A subset of AI that enables computer systems to improve performance through experience.', learned: false },
  { id: 2, question: 'What are the three main types of machine learning?', answer: 'Supervised Learning, Unsupervised Learning, and Reinforcement Learning.', learned: false },
  { id: 3, question: 'What is supervised learning?', answer: 'Training machine learning models with labeled data.', learned: false },
];

function useCards() {
  const [cards, setCards] = useState(INITIAL_CARDS.map(c => ({ ...c })));
  const nextId = useRef(INITIAL_CARDS.length + 1);
  const addCard = (q, a) => setCards(p => [...p, { id: nextId.current++, question: q, answer: a, learned: false }]);
  const deleteCard = (id) => setCards(p => p.filter(c => c.id !== id));
  const editCard = (id, q, a) => setCards(p => p.map(c => c.id === id ? { ...c, question: q, answer: a } : c));
  const toggleLearned = (id) => setCards(p => p.map(c => c.id === id ? { ...c, learned: !c.learned } : c));
  return { cards, addCard, deleteCard, editCard, toggleLearned };
}

function CardModal({ onSave, onClose }) {
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const valid = q.trim() && a.trim();
  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.box}>
        <h3 style={{ margin: '0 0 18px', fontSize: 17, fontWeight: 700, color: '#111827' }}>New Flashcard</h3>
        <label style={modalStyles.label}>Question</label>
        <textarea value={q} onChange={e => setQ(e.target.value)} style={modalStyles.textarea} placeholder="Enter question…" rows={3} />
        <label style={modalStyles.label}>Answer</label>
        <textarea value={a} onChange={e => setA(e.target.value)} style={modalStyles.textarea} placeholder="Enter answer…" rows={3} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={modalStyles.ghost}>Cancel</button>
          <button onClick={() => valid && onSave(q.trim(), a.trim())} style={{ ...modalStyles.solid, opacity: valid ? 1 : 0.45 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div style={{ perspective: 700, height: 110, flex: '0 0 210px' }}>
      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          position: 'relative', width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform .5s cubic-bezier(.4,0,.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ ...previewFace, background: card.learned ? '#F0FDF4' : '#F8F7FF', borderColor: card.learned ? '#BBF7D0' : '#DDD6FE' }}>
          <span style={previewTag}>Q</span>
          <p style={previewText}>{card.question}</p>
        </div>
        <div style={{ ...previewFace, transform: 'rotateY(180deg)', background: '#FFF7F0', borderColor: '#FED7AA', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <span style={previewTag}>A</span>
          <p style={{ ...previewText, fontWeight: 400, color: '#374151' }}>{card.answer}</p>
        </div>
      </div>
    </div>
  );
}

const INITIAL_TEXT = `Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.

Key Concepts:
- Supervised Learning: Training with labeled data
- Unsupervised Learning: Finding patterns in unlabeled data
- Reinforcement Learning: Learning through trial and error

Applications include image recognition, natural language processing, and predictive analytics.`;

const ResultsPage = ({ onBack }) => {
  const [page, setPage] = useState('results'); // 'results' | 'flashcards' | 'editor'
  const [isSaved, setIsSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [recognizedText, setRecognizedText] = useState(INITIAL_TEXT);
  const { cards, addCard } = useCards();

  const handleSaveNotes = () => {
    setIsSaved(true);
    console.log('Notes saved to library!');
  };

  const learnedCount = cards.filter(c => c.learned).length;
  const pct = cards.length ? Math.round((learnedCount / cards.length) * 100) : 0;

  const aiSummary = `Machine learning is a branch of AI focused on developing algorithms that allow computers to learn from experience. It includes three main types: supervised learning (using labeled data), unsupervised learning (finding patterns), and reinforcement learning (trial and error). Common applications are image recognition, NLP, and predictive analytics.`;

 
  if (page === 'flashcards') {
    return <FlashcardsPage onBack={() => setPage('results')} />;
  }

  if (page === 'editor') {
    return (
      <TextEditorPage
        initialContent={recognizedText}
        imageUrl={null} 
        onBack={() => setPage('results')}
        onSave={(text) => setRecognizedText(text)}
      />
    );
  }

  //Results Page
  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>

        
        <div style={styles.header}>
          <div>
            {onBack && (
              <button style={styles.backButton} onClick={onBack}>
                <svg style={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to My Notes
              </button>
            )}
            <div style={styles.logo}>
              <svg style={styles.logoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span style={styles.logoText}>NoteScan</span>
            </div>
            <h1 style={styles.title}>OCR Results</h1>
          </div>
          <div style={styles.headerActions}>
            <button
              style={{ ...styles.saveButton, ...(isSaved ? styles.saveButtonSaved : {}) }}
              onClick={handleSaveNotes}
              disabled={isSaved}
            >
              {isSaved ? 'Saved!' : 'Save Notes'}
            </button>
          </div>
        </div>

        {/* Content grid */}
        <div style={styles.contentGrid}>
          {/* Original image */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Original Image</h3>
            <div style={styles.imagePreview}>
              <svg style={styles.imagePlaceholder} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p style={styles.imagePlaceholderText}>lecture_notes_01.jpg</p>
            </div>
          </div>

          {/* Recognized text */}
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Recognized Text</h3>
              <button style={styles.editButton} onClick={() => setPage('editor')}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit in Editor
              </button>
            </div>
            <div style={styles.textContent}>
              <pre style={styles.textPre}>{recognizedText}</pre>
            </div>
            <div style={styles.confidenceBadge}>
              <span style={styles.badgeText}>87% Confidence Score</span>
            </div>
          </div>
        </div>

        {/* AI section */}
        <div style={styles.aiSection}>
          <div style={styles.aiGrid}>
            {/* AI Summary */}
            <div style={styles.aiCard}>
              <h3 style={styles.aiCardTitle}>AI Summary</h3>
              <div style={styles.summaryBox}>
                <p style={styles.summaryText}>{aiSummary}</p>
              </div>
            </div>

            {/* Flashcards */}
            <div style={styles.aiCard}>
              <h3 style={styles.aiCardTitle}>Flashcards ({cards.length})</h3>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF', marginBottom: 5 }}>
                  <span>{learnedCount}/{cards.length} learned</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: '#E5E7EB', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', borderRadius: 99, transition: 'width .4s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 18 }}>
                {cards.map(c => <PreviewCard key={c.id} card={c} />)}
              </div>

              <button onClick={() => setPage('flashcards')} style={styles.studyButton}>
                Study All {cards.length} Flashcards
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <CardModal
          onSave={(q, a) => { addCard(q, a); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
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
  backButton: { display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: 'white', color: '#4F46E5', border: '1px solid #E5E7EB', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  backIcon: { width: '16px', height: '16px' },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
  logoIcon: { width: '28px', height: '28px', color: '#4F46E5' },
  logoText: { fontSize: '1.25rem', fontWeight: '700', color: '#1F2937' },
  title: { fontSize: '2rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.25rem' },
  subtitle: { color: '#6B7280' },
  headerActions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  exportButton: { padding: '0.625rem 1.25rem', backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  saveButton: { padding: '0.625rem 1.25rem', backgroundColor: '#22C55E', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  saveButtonSaved: { backgroundColor: '#10B981', cursor: 'default' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  card: { backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardTitle: { fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1F2937' },
  editButton: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
    color: 'white', border: 'none', borderRadius: 7,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  aiSection: { marginTop: '2rem' },
  aiSectionTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', marginBottom: '1.5rem' },
  aiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' },
  aiCard: { backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  aiCardTitle: { fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1F2937' },
  summaryBox: { minHeight: 110, display: 'flex', alignItems: 'center', padding: 12, borderRadius: 12, border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB' },
  summaryText: { fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0 },
  studyButton: { width: '100%', padding: '0.75rem', background: '#6366F1', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  textContent: { padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: 10, minHeight: 120, overflowY: 'auto', maxHeight: 280 },
  textPre: { margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  confidenceBadge: { marginTop: 12, display: 'inline-block', padding: '2px 8px', borderRadius: 8, backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, color: '#6B7280', fontWeight: 600 },
  imagePreview: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, border: '1.5px solid #E5E7EB', minHeight: 140 },
  imagePlaceholder: { width: 36, height: 36, color: '#D1D5DB', marginBottom: 6 },
  imagePlaceholderText: { fontSize: 12, color: '#6B7280', fontWeight: 500 },
};

export default ResultsPage;