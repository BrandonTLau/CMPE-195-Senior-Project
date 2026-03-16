import React, { useState } from 'react';

const T = {
  bg:        '#0E1117',
  surface:   '#161B27',
  surfaceHi: '#1E2537',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.13)',
  amber:     '#F5A623',
  amberDim:  'rgba(245,166,35,0.12)',
  cream:     '#EDE8DC',
  muted:     '#6B7694',
  red:       '#F87171',
  redDim:    'rgba(248,113,113,0.12)',
  font:      '"DM Sans", system-ui, sans-serif',
  serif:     '"DM Serif Display", Georgia, serif',
};

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

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
/*
  const handleProcessNotes = () => {
    if (onProcess) onProcess(); // doesn't handle uploads, only moves to next screen   
  }; 
*/
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
    <div style={{ fontFamily: T.font, animation: 'fadeUp .35s ease both' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: T.amber, margin: '0 0 6px', fontFamily: T.font }}>New Scan</p>
        <h1 style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 400, color: T.cream, margin: 0, lineHeight: 1.1 }}>Upload Your Notes</h1>
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, margin: '6px 0 0' }}>Supports JPEG, PNG, and PDF formats</p>
      </div>

      {/* Upload box */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32 }}>

        {/* Drag & Drop Area */}
        <div
          style={{
            border: `2px dashed ${dragActive ? T.amber : T.border}`,
            borderRadius: 12,
            padding: '48px 32px',
            textAlign: 'center',
            background: dragActive ? T.amberDim : T.surfaceHi,
            cursor: 'pointer',
            transition: 'all .2s',
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <div style={{ width: 56, height: 56, borderRadius: 14, background: T.amberDim, border: `1px solid rgba(245,166,35,.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={26} color={T.amber} />
          </div>

          <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 500, color: T.cream, margin: '0 0 6px' }}>
            Drag and drop your files here
          </p>
          <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, margin: '0 0 20px' }}>or</p>

          <button
            style={{ background: T.amber, border: 'none', color: '#0E1117', borderRadius: 9, padding: '9px 22px',
              fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'opacity .2s, transform .15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}>
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

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
              color: T.muted, margin: '0 0 12px' }}>
              Uploaded Files ({uploadedFiles.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {uploadedFiles.map((file, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12,
                  background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.amberDim,
                    border: `1px solid rgba(245,166,35,.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={15} color={T.amber} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.cream, margin: '0 0 2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                    <p style={{ fontFamily: T.font, fontSize: 11, color: T.muted, margin: 0 }}>{file.size} · {file.type}</p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    style={{ width: 26, height: 26, borderRadius: 99, background: T.redDim, border: `1px solid rgba(248,113,113,.2)`,
                      color: T.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, flexShrink: 0, transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = T.redDim}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        <button
          onClick={handleProcessNotes}
          disabled={uploadedFiles.length === 0}
          style={{ width: '100%', marginTop: 24, padding: '13px', borderRadius: 10, border: 'none',
            background: uploadedFiles.length === 0 ? T.surfaceHi : T.amber,
            color: uploadedFiles.length === 0 ? T.muted : '#0E1117',
            fontFamily: T.font, fontSize: 14, fontWeight: 600, cursor: uploadedFiles.length === 0 ? 'default' : 'pointer',
            transition: 'opacity .2s, transform .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onMouseEnter={e => { if (uploadedFiles.length > 0) { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}>
          <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={15} color={uploadedFiles.length === 0 ? T.muted : '#0E1117'} />
          Process Notes
        </button>

      </div>
    </div>
  );
};

export default UploadPage;
