import React, { useMemo, useState } from "react";

const ResultsPage = ({ ocrResult }) => {
  const [activeTab, setActiveTab] = useState("recognized");
  const [isSaved, setIsSaved] = useState(false);

  const recognizedText = useMemo(() => {
    const txt = ocrResult?.text;
    if (txt && typeof txt === "string" && txt.trim().length > 0) return txt;
    return "No OCR text available yet. Try uploading an image and running OCR.";
  }, [ocrResult]);

  const items = useMemo(() => {
    return Array.isArray(ocrResult?.items) ? ocrResult.items : [];
  }, [ocrResult]);

  const avgConfidence = useMemo(() => {
    const scores = items.map((x) => Number(x.score)).filter((s) => !Number.isNaN(s));
    if (!scores.length) return null;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round((sum / scores.length) * 100);
  }, [items]);

  // Placeholder summary
  const aiSummary =
    "Summary is not implemented yet. The Results tab currently shows OCR text and per-line confidence.";

  const handleSaveNotes = () => {
    setIsSaved(true);
    console.log("Notes saved to library! (placeholder)");
  };

  const handleExport = (format) => {
    console.log(`Exporting as ${format} (placeholder)`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Results</h1>
          <p style={styles.subtitle}>
            {avgConfidence !== null
              ? `Average confidence: ${avgConfidence}%`
              : "Confidence unavailable"}
          </p>
        </div>

        <div style={styles.actions}>
          <button style={styles.saveButton} onClick={handleSaveNotes}>
            {isSaved ? "Saved ✓" : "Save to Library"}
          </button>

          <div style={styles.exportGroup}>
            <button style={styles.exportButton} onClick={() => handleExport("txt")}>
              Export TXT
            </button>
            <button style={styles.exportButton} onClick={() => handleExport("pdf")}>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("recognized")}
          style={{
            ...styles.tab,
            ...(activeTab === "recognized" ? styles.tabActive : {}),
          }}
        >
          Recognized Text
        </button>
        <button
          onClick={() => setActiveTab("lines")}
          style={{
            ...styles.tab,
            ...(activeTab === "lines" ? styles.tabActive : {}),
          }}
        >
          Lines + Scores
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          style={{
            ...styles.tab,
            ...(activeTab === "summary" ? styles.tabActive : {}),
          }}
        >
          Summary (placeholder)
        </button>
      </div>

      {activeTab === "recognized" && (
        <textarea
          value={recognizedText}
          readOnly
          rows={14}
          style={styles.textarea}
        />
      )}

      {activeTab === "lines" && (
        <div style={styles.linesBox}>
          {items.length === 0 ? (
            <p style={{ color: "#6B7280" }}>No line items available.</p>
          ) : (
            <ul style={styles.linesList}>
              {items.map((it, idx) => (
                <li key={idx} style={styles.lineItem}>
                  <span style={styles.score}>
                    {(Number(it.score) || 0).toFixed(2)}
                  </span>
                  <span>{it.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === "summary" && (
        <div style={styles.summaryBox}>
          <p style={{ margin: 0 }}>{aiSummary}</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    background: "white",
    borderRadius: "1.25rem",
    padding: "2rem",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1.5rem",
    alignItems: "flex-start",
    marginBottom: "1.25rem",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 700,
  },
  subtitle: {
    marginTop: "0.5rem",
    color: "#6B7280",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  saveButton: {
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(to right, #6366F1, #8B5CF6)",
    color: "white",
    fontWeight: 600,
  },
  exportGroup: { display: "flex", gap: "0.5rem" },
  exportButton: {
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  tab: {
    padding: "0.6rem 0.9rem",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "white",
    cursor: "pointer",
  },
  tabActive: {
    background: "#EEF2FF",
    borderColor: "#C7D2FE",
    fontWeight: 700,
  },
  textarea: {
    width: "100%",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    padding: "1rem",
    fontFamily: "inherit",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  linesBox: {
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "1rem",
  },
  linesList: {
    margin: 0,
    paddingLeft: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  lineItem: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "baseline",
  },
  score: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    background: "#F3F4F6",
    padding: "0.1rem 0.4rem",
    borderRadius: "8px",
    minWidth: "3.5rem",
    textAlign: "right",
  },
  summaryBox: {
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "1rem",
    background: "#F9FAFB",
  },
};

export default ResultsPage;
