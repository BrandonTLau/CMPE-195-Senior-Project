import React, { useMemo, useState } from "react";

const UploadPage = ({ onProcess }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{ file, name, size, type }]
  const [dragActive, setDragActive] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const getFileType = (file) => {
    if (file.type && file.type.startsWith("image/")) return "Image";
    return "Unknown";
  };

  const addFiles = (files) => {
    const newFiles = files.map((file) => ({
      file,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: getFileType(file),
    }));

    const merged = [...uploadedFiles, ...newFiles];
    setUploadedFiles(merged);
    if (merged.length > 0) setSelectedIndex(merged.length - newFiles.length); // select first of newly added
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    addFiles(files);
    // reset input so you can upload same file twice
    event.target.value = "";
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    }
  };

  const removeFile = (index) => {
    const next = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(next);
    setSelectedIndex((prev) => {
      if (!next.length) return 0;
      if (index === prev) return 0;
      return Math.min(prev, next.length - 1);
    });
  };

  const selectedFile = useMemo(() => {
    if (!uploadedFiles.length) return null;
    return uploadedFiles[Math.min(selectedIndex, uploadedFiles.length - 1)]?.file || null;
  }, [uploadedFiles, selectedIndex]);

  const handleProcessNotes = () => {
    if (!selectedFile) return;
    if (onProcess) onProcess(selectedFile);
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.uploadBox}>
          <h2 style={styles.title}>Upload Your Notes</h2>
          <p style={styles.subtitle}>
            MVP: images only (JPEG/PNG/WebP). PDF support can be added later.
          </p>

          {/* Drag & Drop Area */}
          <div
            style={{
              ...styles.dropzone,
              ...(dragActive ? styles.dropzoneActive : {}),
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload").click()}
          >
            <svg style={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            <p style={styles.dropzoneText}>Drag and drop your files here</p>
            <p style={styles.dropzoneOr}>or</p>

            <button style={styles.browseButton}>Browse Files</button>

            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div style={styles.filesList}>
              <h3 style={styles.filesTitle}>Uploaded Files ({uploadedFiles.length})</h3>

              <div style={styles.filesContainer}>
                {uploadedFiles.map((file, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={index}
                      style={{
                        ...styles.fileItem,
                        ...(isSelected ? styles.fileItemSelected : {}),
                      }}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <div style={styles.fileInfo}>
                        <svg style={styles.fileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>

                        <div>
                          <p style={styles.fileName}>
                            {file.name} {isSelected ? " (selected)" : ""}
                          </p>
                          <p style={styles.fileSize}>
                            {file.size} • {file.type}
                          </p>
                        </div>
                      </div>

                      <div style={styles.fileActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          style={styles.removeButton}
                          aria-label="Remove file"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={handleProcessNotes}
            style={{
              ...styles.processButton,
              ...(uploadedFiles.length === 0 ? styles.processButtonDisabled : {}),
            }}
            disabled={uploadedFiles.length === 0}
          >
            Process Selected Image
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#F9FAFB",
    padding: "2rem",
  },
  wrapper: {
    maxWidth: "1024px",
    margin: "0 auto",
  },
  uploadBox: {
    backgroundColor: "white",
    borderRadius: "1rem",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    padding: "3rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#6B7280",
    textAlign: "center",
    marginBottom: "2rem",
  },
  dropzone: {
    border: "4px dashed #C7D2FE",
    borderRadius: "1rem",
    padding: "4rem",
    textAlign: "center",
    backgroundColor: "#EEF2FF",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  dropzoneActive: {
    backgroundColor: "#E0E7FF",
    borderColor: "#818CF8",
  },
  uploadIcon: {
    width: "64px",
    height: "64px",
    color: "#A5B4FC",
    margin: "0 auto 1rem",
  },
  dropzoneText: {
    fontSize: "1.25rem",
    marginBottom: "0.5rem",
  },
  dropzoneOr: {
    color: "#9CA3AF",
    marginBottom: "1rem",
  },
  browseButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#4F46E5",
    color: "white",
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
  },
  filesList: {
    marginTop: "2rem",
  },
  filesTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    marginBottom: "1rem",
  },
  filesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  fileItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "1rem",
    backgroundColor: "#F9FAFB",
    borderRadius: "0.5rem",
    cursor: "pointer",
    border: "1px solid transparent",
  },
  fileItemSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  fileIcon: {
    width: "24px",
    height: "24px",
    color: "#9CA3AF",
  },
  fileName: {
    fontWeight: "500",
    margin: 0,
  },
  fileSize: {
    fontSize: "0.875rem",
    color: "#6B7280",
    margin: 0,
  },
  fileActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  removeButton: {
    width: "28px",
    height: "28px",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    borderRadius: "50%",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    lineHeight: "1.5rem",
  },
  processButton: {
    width: "100%",
    marginTop: "2rem",
    padding: "1rem",
    backgroundColor: "#4F46E5",
    color: "white",
    borderRadius: "0.5rem",
    border: "none",
    fontSize: "1.125rem",
    cursor: "pointer",
  },
  processButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};

export default UploadPage;
