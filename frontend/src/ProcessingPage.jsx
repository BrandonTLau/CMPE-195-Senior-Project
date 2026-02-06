import React from "react";

const ProcessingPage = ({ status = "processing", message = "Running OCR…", error = "", onBack }) => {
  const isError = status === "error" || Boolean(error);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isError ? "Processing failed" : "Processing…"}</h2>
        <p style={styles.subtitle}>
          {isError ? "Something went wrong while running OCR." : message}
        </p>

        {!isError && (
          <div style={styles.spinnerRow}>
            <div style={styles.spinner} />
            <span style={styles.spinnerText}>This can take ~10–40 seconds the first time.</span>
          </div>
        )}

        {isError && (
          <pre style={styles.errorBox}>{error}</pre>
        )}

        <div style={styles.actions}>
          <button
            style={styles.backButton}
            onClick={() => onBack && onBack()}
          >
            Back to Upload
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "720px",
    background: "white",
    borderRadius: "16px",
    padding: "2rem",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
  },
  title: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 700,
  },
  subtitle: {
    color: "#6B7280",
    marginTop: "0.75rem",
    marginBottom: "1.5rem",
  },
  spinnerRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.5rem",
  },
  spinner: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    border: "3px solid #E5E7EB",
    borderTop: "3px solid #6366F1",
    animation: "spin 1s linear infinite",
  },
  spinnerText: {
    color: "#374151",
    fontSize: "0.95rem",
  },
  errorBox: {
    background: "#FEF2F2",
    color: "#991B1B",
    padding: "1rem",
    borderRadius: "12px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    marginBottom: "1.5rem",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
  },
  backButton: {
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    background: "white",
    cursor: "pointer",
  },
};

export default ProcessingPage;
