import React, { useEffect } from 'react';

const LandingPage = ({ onStart, onSignIn }) => {

  
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    const prevBodyMargin = body.style.margin;
    const prevBodyPadding = body.style.padding;
    const prevHtmlMargin = html.style.margin;
    const prevHtmlPadding = html.style.padding;

    body.style.margin = "0";
    body.style.padding = "0";
    html.style.margin = "0";
    html.style.padding = "0";

    return () => {
      body.style.margin = prevBodyMargin;
      body.style.padding = prevBodyPadding;
      html.style.margin = prevHtmlMargin;
      html.style.padding = prevHtmlPadding;
    };
  }, []);

  return (
    <div style={styles.container}>

      
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <svg style={styles.logoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span style={styles.logoText}>NoteScan</span>
        </div>

        <div style={styles.navButtons}>
          <button style={styles.navButton}>Features</button>
          <button style={styles.navButton}>About</button>
          <button style={styles.signInButton} onClick={onSignIn}>Sign In</button>
        </div>
      </nav>

     
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Transform Your Handwritten Notes</h1>
        <p style={styles.heroSubtitle}>
          Upload photos of your handwritten notes and convert them into searchable,
          editable digital text in seconds.
        </p>

        <button style={styles.ctaButton} onClick={onStart}>
          Start Converting
        </button>
      </section>

      {/* features list */}
      <div style={styles.featuresGrid}>
        <div style={styles.featureCard}>
          <svg style={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 style={styles.featureTitle}>Text Recognition</h3>
          <p style={styles.featureDescription}>Convert handwritten notes to digital text with 85–90% accuracy.</p>
        </div>

        <div style={styles.featureCard}>
          <svg style={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 style={styles.featureTitle}>Table Extraction</h3>
          <p style={styles.featureDescription}>Digitize tables and structured data with high accuracy.</p>
        </div>

        <div style={styles.featureCard}>
          <svg style={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h3 style={styles.featureTitle}>AI Summarization</h3>
          <p style={styles.featureDescription}>Generate summaries and flashcards automatically.</p>
        </div>
      </div>
    </div>
  );
};


const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(to bottom right, #EFF6FF, #E0E7FF)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxSizing: "border-box",
    paddingTop: "2rem",
  },

  nav: {
    width: "100%",
    maxWidth: "1280px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 2rem",
    marginBottom: "4rem",
    boxSizing: "border-box",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },

  logoIcon: {
    width: "32px",
    height: "32px",
    color: "#4F46E5",
  },

  logoText: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1F2937",
  },

  navButtons: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },

  navButton: {
  padding: "0.75rem 1.25rem",
  border: "none",
  background: "none",
  color: "#4B5563",
  fontSize: "1rem",       
  cursor: "pointer",
  fontWeight: "500",      
},


  signInButton: {
  padding: "0.75rem 1.5rem",   
  backgroundColor: "#4F46E5",
  color: "white",
  border: "none",
  borderRadius: "0.5rem",
  fontSize: "1rem",            
  cursor: "pointer",
  fontWeight: "600",          
},


  hero: {
    textAlign: "center",
    maxWidth: "800px",
    padding: "2rem",
  },

  heroTitle: {
    fontSize: "3rem",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "1rem",
  },

  heroSubtitle: {
    fontSize: "1.25rem",
    color: "#6B7280",
    marginBottom: "2rem",
  },

  ctaButton: {
    padding: "1rem 2rem",
    backgroundColor: "#4F46E5",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "1.125rem",
    fontWeight: "600",
    cursor: "pointer",
  },

  featuresGrid: {
    width: "100%",
    maxWidth: "1280px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
    padding: "0 2rem 4rem",
    boxSizing: "border-box",
  },

  featureCard: {
    backgroundColor: "white",
    padding: "1.875rem",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },

  featureIcon: {
    width: "48px",
    height: "48px",
    color: "#4F46E5",
    marginBottom: "1rem",
  },

  featureTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "0.5rem",
    color: "#1F2937",
  },

  featureDescription: {
    fontSize: "0.875rem",
    color: "#6B7280",
  },
};

export default LandingPage;
