import React, { useState } from 'react';

const UploadPage = ({ onBack, onProcess }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    const getFileType = (file) => {
      if (file.type.startsWith("image/")) return "Image";
      if (file.type === "application/pdf") return "PDF";
      return "Unknown";
    };

    /**const newFiles = files.map(file => ({
      file,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: getFileType(file)
    })); 

    setUploadedFiles([...uploadedFiles, ...newFiles]); */

    const newFiles = files.map((file) => ({
      file,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type.startsWith("image/") ? "Image" : file.type === "application/pdf" ? "PDF" : "Unknown",
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
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

      /** const newFiles = files.map(file => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type.includes("image") ? "Image" : "PDF"
      }));

      setUploadedFiles([...uploadedFiles, ...newFiles]); */

      const newFiles = files.map((file) => ({
        file,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type.startsWith("image/") ? "Image" : file.type === "application/pdf" ? "PDF" : "Unknown",
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  /** const handleProcessNotes = () => {
    if (onProcess) onProcess(); // doesn't handle uploads, only moves to next screen   
  }; */

  const handleProcessNotes = async () => {
    setError("");

    if (uploadedFiles.length === 0) {
      setError("Please add at least one file.");
      return;
    }

    try {
      setUploading(true);

      // Upload only the first file
      // to handle uploading more, add a loop + save _id
      const saved = await uploadOne(uploadedFiles[0]);

      // Memorize what was uploaded to display in Results
      sessionStorage.setItem("lastUploadId", saved._id);

      if (onProcess) onProcess();
    } catch (e) {
      setError(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };


  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Upload fx to send formData + error handling
  const uploadOne = async (fileObj) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    const form = new FormData();
    form.append("file", fileObj.file); // field name must match backend

    const res = await fetch("/api/files/upload", {
      method: "POST",
      headers: token ? { "x-auth-token": token } : {}, // adjust header name if your backend differs
      body: form,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.msg || "Upload failed");
    return data; // expected: saved file doc (includes _id)
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>

        

          
        

        {/* Upload Box */}
        <div style={styles.uploadBox}>
          <h2 style={styles.title}>Upload Your Notes</h2>
          <p style={styles.subtitle}>Support for JPEG, PNG, and PDF formats</p>

          {/* Drag & Drop Area */}
          <div
            style={{
              ...styles.dropzone,
              ...(dragActive ? styles.dropzoneActive : {})
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload").click()}
          >
            <svg style={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>

            <p style={styles.dropzoneText}>Drag and drop your files here</p>
            <p style={styles.dropzoneOr}>or</p>

            <button style={styles.browseButton}>Browse Files</button>

            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div style={styles.filesList}>
              <h3 style={styles.filesTitle}>Uploaded Files ({uploadedFiles.length})</h3>

              <div style={styles.filesContainer}>
                {uploadedFiles.map((file, index) => (
                  <div key={index} style={styles.fileItem}>
                    <div style={styles.fileInfo}>
                      <svg style={styles.fileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>

                      <div>
                        <p style={styles.fileName}>{file.name}</p>
                        <p style={styles.fileSize}>{file.size} • {file.type}</p>
                      </div>
                    </div>

                    <div style={styles.fileActions}>
                      

                      <button
                        onClick={() => removeFile(index)}
                        style={styles.removeButton}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={handleProcessNotes}
            style={styles.processButton}
            disabled={uploadedFiles.length === 0}
          >
            Process Notes
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
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
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
  backButton: {
    color: "#6B7280",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
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
  },
  fileSize: {
    fontSize: "0.875rem",
    color: "#6B7280",
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
  },
  processButton: {
    width: "100%",
    marginTop: "2rem",
    padding: "1rem",
    backgroundColor: "#4F46E5",
    color: "white",
    borderRadius: "0.5rem",
    fontSize: "1.125rem",
    cursor: "pointer",
  },
};

export default UploadPage;
