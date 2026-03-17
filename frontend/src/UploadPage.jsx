import React, { useState } from 'react';
import { runOcr } from "./api/ocrClient";

//design tokens
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
  green:     '#34D399',
  greenDim:  'rgba(52,211,153,0.12)',
  red:       '#F87171',
  redDim:    'rgba(248,113,113,0.12)',
  font:      '"DM Sans", system-ui, sans-serif',
  serif:     '"DM Serif Display", Georgia, serif',
};

const fontLink = document.createElement('link');
fontLink.rel  = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap';
if (!document.head.querySelector('link[href*="DM+Sans"]')) {
  document.head.appendChild(fontLink);
}

const styleEl = document.createElement('style');
styleEl.id = 'up-styles';
styleEl.textContent = `
  .up-dropzone {
    border: 2px dashed ${T.border};
    border-radius: 16px;
    padding: 56px 40px;
    text-align: center;
    background: ${T.surfaceHi};
    cursor: pointer;
    transition: border-color .2s, background .2s;
  }
  .up-dropzone:hover, .up-dropzone.active {
    border-color: ${T.amber};
    background: ${T.amberDim};
  }
  .up-btn-amber {
    background: ${T.amber}; border: none; color: #0E1117;
    border-radius: 10px; padding: 9px 22px;
    font-family: ${T.font}; font-size: 13px; font-weight: 600;
    cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    transition: opacity .2s, transform .15s;
  }
  .up-btn-amber:hover  { opacity: .88; transform: translateY(-1px); }
  .up-btn-amber:disabled { opacity: .4; cursor: not-allowed; transform: none; }
  .up-btn-ghost {
    background: transparent; border: 1px solid ${T.border}; color: ${T.muted};
    border-radius: 10px; padding: 8px 16px;
    font-family: ${T.font}; font-size: 13px; font-weight: 500;
    cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    transition: border-color .2s, color .2s, background .2s;
  }
  .up-btn-ghost:hover { border-color: ${T.borderHi}; color: ${T.cream}; background: ${T.surfaceHi}; }
  .up-remove {
    width: 26px; height: 26px; border-radius: 50%;
    background: ${T.redDim}; border: 1px solid rgba(248,113,113,.2);
    color: ${T.red}; font-size: 16px; line-height: 1;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .15s; flex-shrink: 0;
  }
  .up-remove:hover { background: rgba(248,113,113,.25); }
  .up-process {
    width: 100%; padding: 14px 20px; margin-top: 28px;
    background: ${T.amber};
    color: #0E1117; border: none; border-radius: 12px;
    font-size: 15px; font-weight: 700; font-family: ${T.font};
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 24px rgba(245,166,35,.25);
    transition: opacity .2s, transform .15s, box-shadow .15s;
  }
  .up-process:hover:not(:disabled) { opacity: .88; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(245,166,35,.35); }
  .up-process:disabled { opacity: .4; cursor: not-allowed; transform: none; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
`;
if (!document.head.querySelector('#up-styles')) {
  document.head.appendChild(styleEl);
}

const Icon = ({ d, size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

// ── component ──────────────────────────────────────────────────
const UploadPage = ({ onBack, onProcess }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive,    setDragActive]    = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [error,         setError]         = useState('');

  const parseFiles = (files) =>
    Array.from(files).map((file) => ({
      file,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type.startsWith('image/') ? 'Image' : file.type === 'application/pdf' ? 'PDF' : 'Unknown',
    }));

  const handleFileUpload = (e) =>
    setUploadedFiles((prev) => [...prev, ...parseFiles(e.target.files)]);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0)
      setUploadedFiles((prev) => [...prev, ...parseFiles(e.dataTransfer.files)]);
  };

  const removeFile = (index) =>
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));

  //backend
  const uploadOne = async (fileObj) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const form  = new FormData();
    form.append('file', fileObj.file);

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: token ? { 'x-auth-token': token } : {},
      body: form,
    });

    let data;
    try { data = await res.json(); } catch {
      throw new Error(`Server returned status ${res.status} with non-JSON response`);
    }

    if (!res.ok) {
      const msg = data?.msg || data?.message || data?.error || `Server error ${res.status}`;
      console.error('Upload error:', res.status, data);
      throw new Error(msg);
    }
    return data;
  };

  const handleProcessNotes = async () => {
    setError('');
    if (uploadedFiles.length === 0) { setError('Please add at least one file.'); return; }
    try {
      setUploading(true);
      const saved = await uploadOne(uploadedFiles[0]);
      sessionStorage.setItem('lastUploadId', saved._id);
      const first = uploadedFiles[0];
      if (first?.file?.type?.startsWith('image/')) {
        const ocrData = await runOcr(first.file);
        sessionStorage.setItem('lastOcrOverlayUrl', ocrData?.overlay_url || '');
        sessionStorage.setItem('lastOcrMergedText',  ocrData?.merged_text || ocrData?.text || '');
      } else {
        sessionStorage.removeItem('lastOcrOverlayUrl');
        sessionStorage.removeItem('lastOcrMergedText');
      }
      if (onProcess) onProcess();
    } catch (e) {
      console.error('handleProcessNotes:', e);
      setError(e.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };
  // ────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, color:T.cream }}>

      {/* Hero */}
      <div style={{ padding:'48px 40px 0', animation:'fadeUp .4s ease both' }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 10px' }}>Get Started</p>
        <h1 style={{ fontFamily:T.serif, fontSize:38, fontWeight:400, margin:'0 0 8px', lineHeight:1.1, letterSpacing:'-.4px' }}>Upload Your Notes</h1>
        <p style={{ color:T.muted, fontSize:14, margin:'0 0 40px' }}>Supports JPEG, PNG, and PDF formats</p>
      </div>

      {/* Main card */}
      <div style={{ padding:'0 40px 64px', animation:'fadeUp .4s ease .1s both' }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:'36px 40px' }}>

          {/* Drop zone */}
          <div
            className={`up-dropzone${dragActive ? ' active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <div style={{ width:64, height:64, borderRadius:16, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
              <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={28} color={T.amber} />
            </div>
            <p style={{ fontSize:15, fontWeight:600, color:T.cream, margin:'0 0 6px' }}>Drag and drop your files here</p>
            <p style={{ fontSize:13, color:T.muted, margin:'0 0 20px' }}>or</p>
            <button className="up-btn-amber" onClick={e => e.stopPropagation()}>
              <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" size={14} color="#0E1117" />
              Browse Files
            </button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              style={{ display:'none' }}
            />
          </div>

          {/* File list */}
          {uploadedFiles.length > 0 && (
            <div style={{ marginTop:28 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.muted, margin:'0 0 12px', fontFamily:T.font }}>
                Queued Files ({uploadedFiles.length})
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {uploadedFiles.map((file, index) => (
                  <div key={index} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={16} color={T.amber} />
                      </div>
                      <div>
                        <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.cream }}>{file.name}</p>
                        <p style={{ margin:0, fontSize:11, color:T.muted }}>{file.size} · {file.type}</p>
                      </div>
                    </div>
                    <button className="up-remove" onClick={() => removeFile(index)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process button */}
          <button
            className="up-process"
            onClick={handleProcessNotes}
            disabled={uploadedFiles.length === 0 || uploading}
          >
            {uploading ? 'Processing…' : 'Process Notes'}
          </button>

          {/* Error */}
          {error && (
            <div style={{ marginTop:16, padding:'12px 16px', background:T.redDim, border:`1px solid rgba(248,113,113,.2)`, borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
              <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} color={T.red} />
              <span style={{ fontSize:13, color:T.red, fontWeight:500 }}>{error}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UploadPage;

