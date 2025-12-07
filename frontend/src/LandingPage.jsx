
const LandingPage = ({onStart}) => {
  const handleStartConverting = () => {
    onStart();
  };

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <svg style={styles.logoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span style={styles.logoText}>NoteScan</span>
        </div>
        <div style={styles.navButtons}>
          <button style={styles.navButton}>Features</button>
          <button style={styles.navButton}>My Notes</button>
          <button style={styles.navButton}>About</button>
          <button style={styles.signInButton}>Sign In</button>
        </div>
      </nav>

     
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Transform Your Handwritten Notes</h1>
        <p style={styles.heroSubtitle}>
          Upload photos of your handwritten notes and convert them to searchable, 
          editable digital text in seconds
        </p>
        <button style={styles.ctaButton} onClick={handleStartConverting}>
          Start Converting
        </button>
      </div>

      
      <div style={styles.featuresGrid}>
        
        <div style={styles.featureCard}>
          <svg style={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 style={styles.featureTitle}>Text Recognition</h3>
          <p style={styles.featureDescription}>
            Convert handwritten notes to digital text with 85-90% accuracy
          </p>
        </div>

       
        <div style={styles.featureCard}>
          <svg style={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 style={styles.featureTitle}>Table Extraction</h3>
          <p style={styles.featureDescription}>
            Digitize tables and structured data with 85-95% accuracy
          </p>
        </div>

       
        <div style={styles.featureCard}>
          <svg style={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h3 style={styles.featureTitle}>AI Summarization</h3>
          <p style={styles.featureDescription}>
            Generate summaries and flashcards from your notes
          </p>
        </div>
      </div>
    </div>
  );
};


const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)',
    padding: '2rem',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4rem',
    maxWidth: '1280px',
    margin: '0 auto 4rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    color: '#4F46E5',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1F2937',
  },
  navButtons: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  navButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    background: 'none',
    color: '#4B5563',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'color 0.2s',
    fontFamily: 'inherit',
  },
  signInButton: {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto 4rem',
    padding: '3rem 0',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '1.25rem',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#6B7280',
    marginBottom: '2rem',
    lineHeight: '1.6',
  },
  ctaButton: {
    padding: '1rem 2rem',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1280px',
    margin: '4rem auto 0',
  },
  featureCard: {
    backgroundColor: 'white',
    padding: '1.875rem',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  featureIcon: {
    width: '48px',
    height: '48px',
    color: '#4F46E5',
    marginBottom: '1rem',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#1F2937',
  },
  featureDescription: {
    fontSize: '0.875rem',
    color: '#6B7280',
    lineHeight: '1.5',
  },
};

// Add hover effects via inline event handlers (alternative approach)
const addHoverEffect = (e, hoverStyle) => {
  Object.assign(e.target.style, hoverStyle);
};

const removeHoverEffect = (e, originalStyle) => {
  Object.assign(e.target.style, originalStyle);
};

export default LandingPage;