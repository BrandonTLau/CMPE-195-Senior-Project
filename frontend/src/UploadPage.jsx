import React, { useState } from 'react';


const UploadPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const getFileType = (file) => {
      if (file.type.startsWith("image/")) return "Image";
      if (file.type === "application/pdf") return "PDF";
      return "Unknown";
    };
    const newFiles = files.map(file => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: getFileType(file)
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const newFiles = files.map(file => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type.includes('image') ? 'Image' : 'PDF'
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const handleProcessNotes = () => {
    console.log('Processing notes...');
    // Navigate to processing screen or call API
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
   
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg style={styles.logoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span style={styles.logoText}>NoteScan</span>
          </div>
          <button style={styles.backButton}>← Back</button>
        </div>

        {/* Upload Box */}
        <div style={styles.uploadBox}>
          <h2 style={styles.title}>Upload Your Notes</h2>
          <p style={styles.subtitle}>Support for JPEG, PNG, and PDF formats</p>

          
          <div
            style={{
              ...styles.dropzone,
              ...(dragActive ? styles.dropzoneActive : {})
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <svg style={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p style={styles.dropzoneText}>Drag and drop your files here</p>
            <p style={styles.dropzoneOr}>or</p>
            <button style={styles.browseButton}>
              Browse Files
            </button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div style={styles.filesList}>
              <h3 style={styles.filesTitle}>Uploaded Files ({uploadedFiles.length})</h3>
              <div style={styles.filesContainer}>
                {uploadedFiles.map((file, index) => (
                  <div key={index} style={styles.fileItem}>
                    <div style={styles.fileInfo}>
                      <svg style={styles.fileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p style={styles.fileName}>{file.name}</p>
                        <p style={styles.fileSize}>{file.size} • {file.type}</p>
                      </div>
                    </div>
                    <div style={styles.fileActions}>
                      <svg style={styles.checkIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
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
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    padding: '2rem',
  },
  wrapper: {
    maxWidth: '1024px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem',
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
  backButton: {
    color: '#6B7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    transition: 'color 0.2s',
  },
  uploadBox: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    padding: '3rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  dropzone: {
    border: '4px dashed #C7D2FE',
    borderRadius: '1rem',
    padding: '4rem',
    textAlign: 'center',
    backgroundColor: '#EEF2FF',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  dropzoneActive: {
    backgroundColor: '#E0E7FF',
    borderColor: '#818CF8',
  },
  uploadIcon: {
    width: '64px',
    height: '64px',
    color: '#A5B4FC',
    margin: '0 auto 1rem',
  },
  dropzoneText: {
    fontSize: '1.25rem',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  dropzoneOr: {
    color: '#9CA3AF',
    marginBottom: '1rem',
  },
  browseButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  filesList: {
    marginTop: '2rem',
  },
  filesTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '1rem',
  },
  filesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  fileIcon: {
    width: '24px',
    height: '24px',
    color: '#9CA3AF',
  },
  fileName: {
    fontWeight: '500',
    marginBottom: '0.25rem',
  },
  fileSize: {
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  fileActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkIcon: {
    width: '24px',
    height: '24px',
    color: '#22C55E',
  },
  removeButton: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    fontSize: '1.5rem',
    lineHeight: '1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  processButton: {
    width: '100%',
    marginTop: '2rem',
    padding: '1rem 1.5rem',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)',
    transition: 'background-color 0.2s',
  },
};

export default UploadPage;