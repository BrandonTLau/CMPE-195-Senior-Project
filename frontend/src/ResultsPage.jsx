import React, { useEffect, useState } from 'react';

const ResultsPage = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isSaved, setIsSaved] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fileDoc, setFileDoc] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setError("");
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch("/api/files", {
          headers: token ? { "x-auth-token": token } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.msg || "Failed to load files");

        // pick last uploaded (if we stored it), else most recent
        const lastId = sessionStorage.getItem("lastUploadId");
        const picked = lastId ? data.find((f) => f._id === lastId) : data?.[0];
        setFileDoc(picked || null);
      } catch (e) {
        setError(e.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  //need to add save logic
  const handleSaveNotes = () => {
    setIsSaved(true);
    console.log('Notes saved to library!');
  };

  //need to add export logic 
  const handleExport = (format) => {
    console.log(`Exporting as ${format}`);
  };

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  if (!fileDoc) return <div style={{ padding: 24 }}>No uploads found.</div>;

  const recognizedText =
    fileDoc?.userEdits?.editedText ??
    fileDoc?.extractionData?.rawText ??
    "No extracted text yet.";

  const aiSummary =
    fileDoc?.userEdits?.editedSummary ??
    fileDoc?.extractionData?.summary ??
    "No summary yet.";

  const flashcards =
    fileDoc?.userEdits?.editedFlashCards ??
    fileDoc?.extractionData?.flashCards ??
    [];

  /** const recognizedText = `Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.

Key Concepts:
• Supervised Learning: Training with labeled data
• Unsupervised Learning: Finding patterns in unlabeled data
• Reinforcement Learning: Learning through trial and error

Applications include image recognition, natural language processing, and predictive analytics.`;

  const aiSummary = `Machine learning is a branch of AI focused on developing algorithms that allow computers to learn from experience. It includes three main types: supervised learning (using labeled data), unsupervised learning (finding patterns), and reinforcement learning (trial and error). Common applications are image recognition, NLP, and predictive analytics.`;

  const flashcards = [
    {
      question: 'What is machine learning?',
      answer: 'A subset of AI that enables computer systems to improve performance through experience'
    },
    {
      question: 'What are the three main types of machine learning?',
      answer: 'Supervised Learning, Unsupervised Learning, and Reinforcement Learning'
    },
    {
      question: 'What is supervised learning?',
      answer: 'Training machine learning models with labeled data'
    }
  ]; */

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
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
            <button 
              style={styles.exportButton}
              onClick={() => handleExport('txt')}
            >
              <svg style={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export TXT
            </button>
            <button 
              style={styles.exportButton}
              onClick={() => handleExport('docx')}
            >
              <svg style={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export DOCX
            </button>
            <button 
              style={{
                ...styles.saveButton,
                ...(isSaved ? styles.saveButtonSaved : {})
              }}
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

        {/* Main Content Grid */}
        <div style={styles.contentGrid}>
          {/* Original Image */}
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

          {/* Recognized Text */}
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

        {/* AI Features Section */}
        <div style={styles.aiSection}>
          <h2 style={styles.aiSectionTitle}>AI-Powered Features</h2>
          
          <div style={styles.aiGrid}>
            {/* AI Summary */}
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

            {/* Flashcards */}
            <div style={styles.aiCard}>
              <div style={styles.aiCardHeader}>
                <h3 style={styles.aiCardTitle}>
                  <svg style={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Flashcards ({flashcards.length})
                </h3>
                <button style={styles.regenerateButton}>
                  <svg style={styles.smallIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add More
                </button>
              </div>
              <div style={styles.flashcardsContainer}>
                {flashcards.map((card, index) => (
                  <div key={index} style={styles.flashcard}>
                    <div style={styles.flashcardLabel}>Q:</div>
                    <p style={styles.flashcardQuestion}>{card.question}</p>
                    <div style={styles.flashcardDivider}></div>
                    <div style={styles.flashcardLabel}>A:</div>
                    <p style={styles.flashcardAnswer}>{card.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    padding: '2rem',
  },
  wrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    color: '#4F46E5',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1F2937',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: '#6B7280',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  exportButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  saveButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#22C55E',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  saveButtonSaved: {
    backgroundColor: '#10B981',
    cursor: 'default',
  },
  buttonIcon: {
    width: '18px',
    height: '18px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#1F2937',
  },
  cardIcon: {
    width: '20px',
    height: '20px',
    color: '#4F46E5',
  },
  imagePreview: {
    backgroundColor: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: '0.75rem',
    height: '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  imagePlaceholder: {
    width: '64px',
    height: '64px',
    color: '#9CA3AF',
  },
  imagePlaceholderText: {
    color: '#6B7280',
    fontSize: '0.875rem',
  },
  textContent: {
    backgroundColor: '#F9FAFB',
    border: '1px solid #F3F4F6',
    borderRadius: '0.75rem',
    padding: '1rem',
    maxHeight: '300px',
    overflowY: 'auto',
    marginBottom: '1rem',
  },
  textPre: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    margin: 0,
    whiteSpace: 'pre-wrap',
    color: '#1F2937',
  },
  confidenceBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '0.5rem',
  },
  badgeIcon: {
    width: '20px',
    height: '20px',
    color: '#3B82F6',
  },
  badgeText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1E40AF',
  },
  aiSection: {
    marginTop: '2rem',
  },
  aiSectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '1.5rem',
  },
  aiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
  },
  aiCard: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  aiCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  aiCardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#1F2937',
    margin: 0,
  },
  regenerateButton: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  smallIcon: {
    width: '14px',
    height: '14px',
  },
  summaryBox: {
    padding: '1.25rem',
    backgroundColor: 'linear-gradient(to bottom right, #F3E8FF, #FCE7F3)',
    background: 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%)',
    border: '1px solid #E9D5FF',
    borderRadius: '0.75rem',
  },
  summaryText: {
    fontSize: '0.875rem',
    lineHeight: '1.6',
    color: '#1F2937',
    margin: 0,
  },
  flashcardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  flashcard: {
    padding: '1rem',
    backgroundColor: '#F0FDFA',
    border: '1px solid #CCFBF1',
    borderRadius: '0.75rem',
  },
  flashcardLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#0F766E',
    marginBottom: '0.375rem',
  },
  flashcardQuestion: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: '0.75rem',
    margin: '0 0 0.75rem 0',
  },
  flashcardDivider: {
    height: '1px',
    backgroundColor: '#99F6E4',
    marginBottom: '0.75rem',
  },
  flashcardAnswer: {
    fontSize: '0.875rem',
    color: '#4B5563',
    margin: 0,
  },
};

export default ResultsPage;