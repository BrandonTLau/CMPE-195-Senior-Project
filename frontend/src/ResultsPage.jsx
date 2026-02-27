import React, { useState, useRef } from 'react';
import FlashcardsPage from './FlashcardsPage';

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

const ResultsPage = () => {
  const [page, setPage] = useState('results');
  const [isSaved, setIsSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const { cards, addCard } = useCards();

  const handleSaveNotes = () => {
    setIsSaved(true);
    console.log('Notes saved to library!');
  };

  const handleExport = (format) => {
    console.log(`Exporting as ${format}`);
  };

  const learnedCount = cards.filter(c => c.learned).length;
  const pct = cards.length ? Math.round((learnedCount / cards.length) * 100) : 0;

  if (page === 'flashcards') {
    return <FlashcardsPage onBack={() => setPage('results')} />;
  }

  const recognizedText = `Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.

Key Concepts:
- Supervised Learning: Training with labeled data
- Unsupervised Learning: Finding patterns in unlabeled data
- Reinforcement Learning: Learning through trial and error

Applications include image recognition, natural language processing, and predictive analytics.`;

  const aiSummary = `Machine learning is a branch of AI focused on developing algorithms that allow computers to learn from experience. It includes three main types: supervised learning (using labeled data), unsupervised learning (finding patterns), and reinforcement learning (trial and error). Common applications are image recognition, NLP, and predictive analytics.`;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
       
        <div style={styles.header}>
          <div>
            <div style={styles.logo}>
              <svg style={styles.logoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span style={styles.logoText}>NoteScan</span>
            </div>
            <h1 style={styles.title}>OCR Results</h1>
            <p style={styles.subtitle}>Your notes have been successfully processed</p>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.exportButton} onClick={() => handleExport('txt')}>
              <svg style={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export TXT
            </button>
            <button style={styles.exportButton} onClick={() => handleExport('docx')}>
              <svg style={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export DOCX
            </button>
            <button
              style={{ ...styles.saveButton, ...(isSaved ? styles.saveButtonSaved : {}) }}
              onClick={handleSaveNotes}
              disabled={isSaved}
            >
              {isSaved ? (
                <>
                  <svg style={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : (
                <>
                  <svg style={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Notes
                </>
              )}
            </button>
          </div>
        </div>

       
        <div style={styles.contentGrid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <svg style={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Original Image
            </h3>
            <div style={styles.imagePreview}>
              <svg style={styles.imagePlaceholder} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p style={styles.imagePlaceholderText}>lecture_notes_01.jpg</p>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <svg style={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recognized Text
            </h3>
            <div style={styles.textContent}>
              <pre style={styles.textPre}>{recognizedText}</pre>
            </div>
            <div style={styles.confidenceBadge}>
              <svg style={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={styles.badgeText}>87% Confidence Score</span>
            </div>
          </div>
        </div>

       
        <div style={styles.aiSection}>
          <h2 style={styles.aiSectionTitle}>AI-Powered Features</h2>
          <div style={styles.aiGrid}>
            <div style={styles.aiCard}>
              <div style={styles.aiCardHeader}>
                <h3 style={styles.aiCardTitle}>
                  <svg style={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  AI Summary
                </h3>
                <button style={styles.regenerateButton}>
                  <svg style={styles.smallIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
              </div>
              <div style={styles.summaryBox}>
                <p style={styles.summaryText}>{aiSummary}</p>
              </div>
            </div>

            <div style={styles.aiCard}>
              <div style={styles.aiCardHeader}>
                <h3 style={styles.aiCardTitle}>
                  <svg style={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Flashcards ({cards.length})
                </h3>
                <button style={styles.regenerateButton} onClick={() => setShowAdd(true)}>
                  <svg style={styles.smallIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Card
                </button>
              </div>

             
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF', marginBottom: 5 }}>
                  <span>{learnedCount}/{cards.length} learned</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: '#E5E7EB', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', borderRadius: 99, transition: 'width .4s' }} />
                </div>
              </div>

            
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 18, scrollbarWidth: 'thin' }}>
                {cards.map(c => <PreviewCard key={c.id} card={c} />)}
              </div>

             
              <button onClick={() => setPage('flashcards')} style={styles.studyButton}>
                <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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