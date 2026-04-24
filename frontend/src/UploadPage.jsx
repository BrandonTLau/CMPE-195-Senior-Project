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
  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes spin    { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
  @keyframes float   { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }
  @keyframes stepIn  { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
`;
const existingStyle = document.head.querySelector('#up-styles');
if (existingStyle) existingStyle.remove();
document.head.appendChild(styleEl);

const Icon = ({ d, size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const StepRow = ({ label, status }) => {
  const isDone   = status === 'done';
  const isActive = status === 'active';
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'10px 16px',
      background:  isDone ? T.greenDim : isActive ? T.amberDim : T.surfaceHi,
      border:`1px solid ${isDone ? 'rgba(52,211,153,.25)' : isActive ? 'rgba(245,166,35,.25)' : T.border}`,
      borderRadius:10,
      animation: isActive ? 'stepIn .3s ease both' : 'none',
      transition: 'background .3s, border-color .3s',
    }}>
      <div style={{
        width:20, height:20, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
        background:  isDone ? 'rgba(52,211,153,.2)' : isActive ? T.amberDim : T.surfaceHi,
        border:`1.5px solid ${isDone ? 'rgba(52,211,153,.5)' : isActive ? 'rgba(245,166,35,.5)' : T.border}`,
      }}>
        {isDone   && <Icon d="M5 13l4 4L19 7" size={10} color="#34D399" />}
        {isActive && <div style={{ width:7, height:7, borderRadius:'50%', background:T.amber }} />}
      </div>
      <span style={{
        fontSize:12, fontWeight:600,
        color: isDone ? '#34D399' : isActive ? T.amber : T.muted,
        transition:'color .3s',
      }}>
        {label}
      </span>
      {isActive && <span style={{ marginLeft:'auto', fontSize:11, color:T.muted, fontStyle:'italic' }}>running…</span>}
      {isDone   && <span style={{ marginLeft:'auto', fontSize:11, color:'rgba(52,211,153,.7)' }}>done</span>}
    </div>
  );
};

const OCR_ENGINES = [
  { id: 'paddleocr', label: 'PaddleOCR', sub: 'General purpose' },
  { id: 'chandra',   label: 'Chandra',   sub: 'Handwriting optimized' },
];

const UploadPage = ({ onBack, onProcess }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive,    setDragActive]    = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [error,         setError]         = useState('');
  const [ocrEngine,     setOcrEngine]     = useState('paddleocr');

  const [steps, setSteps] = useState({
    upload:    'pending',
    preprocess:'pending',
    ocr:       'pending',
    results:   'pending',
  });
  const [showOverlay, setShowOverlay] = useState(false);

  const setStep = (key, status) =>
    setSteps(prev => ({ ...prev, [key]: status }));

  const parseFiles = (files) =>
    Array.from(files).slice(0, 1).map((file) => ({
      file,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type.startsWith('image/') ? 'Image' : file.type === 'application/pdf' ? 'PDF' : 'Unknown',
    }));

  const handleFileUpload = (e) =>
    setUploadedFiles(parseFiles(e.target.files));

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0)
      setUploadedFiles(parseFiles(e.dataTransfer.files));
  };

  const removeFile = () => setUploadedFiles([]);

  const uploadOne = async (fileObj) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const form  = new FormData();
    form.append('file', fileObj.file);
    const headers = token
      ? { 'x-auth-token': token, Authorization: `Bearer ${token}` }
      : {};

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers,
      body: form,
    });

    let data = null;
    try { data = await res.json(); } catch (e) {}

    if (!res.ok) {
      const msg = data?.msg || data?.message || data?.error || `Server error ${res.status}`;
      console.error('Upload error:', res.status, data);
      throw new Error(msg);
    }

    if (!data || !data._id) {
      throw new Error('Upload endpoint did not return a file id (_id).');
    }

    return data;
  };

  const handleProcessNotes = async () => {
    setError('');
    if (uploadedFiles.length === 0) { setError('Please add a file.'); return; }

    setSteps({ upload:'pending', preprocess:'pending', ocr:'pending', results:'pending' });
    setShowOverlay(true);
    setUploading(true);

    try {
      // Step 1 — Upload
      setStep('upload', 'active');
      const saved = await uploadOne(uploadedFiles[0]);
      sessionStorage.setItem('lastUploadId', saved._id);
      setStep('upload', 'done');

      const first = uploadedFiles[0];
      if (first?.file?.type?.startsWith('image/')) {

        // Step 2 — Preprocess
        setStep('preprocess', 'active');
        await new Promise(r => setTimeout(r, 400));
        setStep('preprocess', 'done');

        // Step 3 — OCR
        setStep('ocr', 'active');
        try {
          const ocrData = await runOcr(first.file, ocrEngine);
          console.log('OCR response:', ocrData);

          // Prefix relative URLs with the OCR backend base so they work in production
          const ocrBase = import.meta.env.VITE_OCR_URL || 'http://localhost:8000';
          const prefixUrl = (url) => url ? (url.startsWith('http') ? url : `${ocrBase}${url}`) : '';

          sessionStorage.setItem('lastOcrEngine',      ocrEngine);
          sessionStorage.setItem('lastOcrOverlayUrl',  prefixUrl(ocrData?.overlay_url));
          sessionStorage.setItem('lastOcrMergedText',  ocrData?.merged_text  || ocrData?.text || '');
          sessionStorage.setItem('lastOcrBlocks',      JSON.stringify(ocrData?.blocks      || []));
          sessionStorage.setItem('lastOcrImageUrl',    prefixUrl(ocrData?.image_url || ocrData?.original_url));
          sessionStorage.setItem('lastOcrImageSize',   JSON.stringify(ocrData?.image_size  || [0, 0]));

          const avgConfidence = ocrData?.items?.length
            ? Math.round(
                (ocrData.items.reduce((sum, item) => sum + (item.score || 0), 0) / ocrData.items.length) * 100
              )
            : ocrData?.confidence != null
              ? Math.round(ocrData.confidence * 100)
              : null;
          sessionStorage.setItem('lastOcrConfidence', avgConfidence ?? '');
        } catch (ocrErr) {
          console.warn('OCR service unavailable, skipping:', ocrErr.message);
          sessionStorage.removeItem('lastOcrEngine');
          sessionStorage.removeItem('lastOcrOverlayUrl');
          sessionStorage.removeItem('lastOcrMergedText');
          sessionStorage.removeItem('lastOcrBlocks');
          sessionStorage.removeItem('lastOcrImageUrl');
          sessionStorage.removeItem('lastOcrImageSize');
          sessionStorage.removeItem('lastOcrConfidence');
        }
        setStep('ocr', 'done');

        // Step 4 — Generating results
        setStep('results', 'active');
        await new Promise(r => setTimeout(r, 300));
        setStep('results', 'done');

      } else {
        // PDF — skip OCR steps
        setStep('preprocess', 'done');
        setStep('ocr', 'done');
        setStep('results', 'active');
        await new Promise(r => setTimeout(r, 300));
        setStep('results', 'done');
        sessionStorage.removeItem('lastOcrEngine');
        sessionStorage.removeItem('lastOcrOverlayUrl');
        sessionStorage.removeItem('lastOcrMergedText');
        sessionStorage.removeItem('lastOcrBlocks');
        sessionStorage.removeItem('lastOcrImageUrl');
        sessionStorage.removeItem('lastOcrImageSize');
        sessionStorage.removeItem('lastOcrConfidence');
      }

      await new Promise(r => setTimeout(r, 400));
      setShowOverlay(false);
      if (onProcess) onProcess();

    } catch (e) {
      console.error('handleProcessNotes:', e);
      setShowOverlay(false);
      setError(e.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, color:T.cream }}>

      {showOverlay && (
        <div style={{
          position:'fixed', inset:0, background:T.bg, zIndex:999,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:32, animation:'fadeIn .2s ease both',
        }}>
          <div style={{ position:'relative', width:80, height:80, animation:'float 3s ease-in-out infinite' }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid ${T.border}` }} />
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid transparent`, borderTopColor:T.amber, animation:'spin 1s linear infinite' }} />
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`3px solid transparent`, borderBottomColor:'rgba(245,166,35,.3)', animation:'spin 1.8s linear infinite reverse' }} />
            <div style={{ position:'absolute', inset:10, borderRadius:'50%', background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={22} color={T.amber} />
            </div>
          </div>

          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 10px' }}>Please Wait</p>
            <h2 style={{ fontFamily:T.serif, fontSize:32, fontWeight:400, color:T.cream, margin:'0 0 8px', lineHeight:1.1 }}>Processing Your Notes</h2>
            <p style={{ color:T.muted, fontSize:13, margin:0 }}>
              {steps.ocr     === 'active' ? `Running ${ocrEngine === 'chandra' ? 'Chandra' : 'PaddleOCR'} engine — this is the longest step…` :
               steps.upload  === 'active' ? 'Uploading your file…'  :
               steps.results === 'active' ? 'Finalizing results…'   :
               'Almost there…'}
            </p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%', maxWidth:360 }}>
            <StepRow label="Uploading file"      status={steps.upload}     />
            <StepRow label="Preprocessing image" status={steps.preprocess} />
            <StepRow label={`Running ${ocrEngine === 'chandra' ? 'Chandra' : 'PaddleOCR'} engine`} status={steps.ocr} />
            <StepRow label="Generating results"  status={steps.results}    />
          </div>
        </div>
      )}

      <div style={{ padding:'48px 40px 0', animation:'fadeUp .4s ease both' }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 10px' }}>Get Started</p>
        <h1 style={{ fontFamily:T.serif, fontSize:38, fontWeight:400, margin:'0 0 8px', lineHeight:1.1, letterSpacing:'-.4px' }}>Upload Your Notes</h1>
        <p style={{ color:T.muted, fontSize:14, margin:'0 0 40px' }}>Supports PDF, JPG, JPEG, PNG, and HEIC</p>
      </div>

      <div style={{ padding:'0 40px 64px', animation:'fadeUp .4s ease .1s both' }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:'36px 40px' }}>

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
            <p style={{ fontSize:15, fontWeight:600, color:T.cream, margin:'0 0 6px' }}>Drag and drop your file here</p>
            <p style={{ fontSize:13, color:T.muted, margin:'0 0 20px' }}>or</p>
            <button className="up-btn-amber" onClick={e => { e.stopPropagation(); document.getElementById('file-upload').click(); }}>
              <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" size={14} color="#0E1117" />
              <span style={{ flexShrink:0 }}>Browse Files</span>
            </button>
            <input
              id="file-upload"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              style={{ display:'none' }}
            />
          </div>

          {uploadedFiles.length > 0 && (
            <div style={{ marginTop:28 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.muted, margin:'0 0 12px', fontFamily:T.font }}>
                Selected File
              </p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={16} color={T.amber} />
                  </div>
                  <div>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.cream }}>{uploadedFiles[0].name}</p>
                    <p style={{ margin:0, fontSize:11, color:T.muted }}>{uploadedFiles[0].size} · {uploadedFiles[0].type}</p>
                  </div>
                </div>
                <button className="up-remove" onClick={removeFile}>×</button>
              </div>
            </div>
          )}

          {/* OCR Engine selector */}
          <div style={{ marginTop:28 }}>
            <p style={{
              fontSize:11, fontWeight:700, letterSpacing:1.2,
              textTransform:'uppercase', color:T.muted,
              margin:'0 0 10px', fontFamily:T.font,
            }}>
              OCR Engine
            </p>
            <div style={{
              display:'flex',
              background:T.surfaceHi,
              border:`1px solid ${T.border}`,
              borderRadius:10,
              padding:4,
              gap:4,
            }}>
              {OCR_ENGINES.map(({ id, label, sub }) => {
                const selected = ocrEngine === id;
                return (
                  <button
                    key={id}
                    onClick={() => setOcrEngine(id)}
                    disabled={uploading}
                    style={{
                      flex:1,
                      padding:'10px 14px',
                      border:'none',
                      borderRadius:7,
                      fontFamily:T.font,
                      fontSize:13,
                      fontWeight: selected ? 700 : 500,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      lineHeight:1.3,
                      textAlign:'center',
                      opacity: uploading ? 0.5 : 1,
                      background: selected ? T.amber : 'transparent',
                      color: selected ? '#0E1117' : T.muted,
                      boxShadow: selected ? '0 2px 10px rgba(245,166,35,.3)' : 'none',
                      transition:'background .2s, color .2s, box-shadow .2s',
                    }}
                  >
                    <div>{label}</div>
                    <div style={{ fontSize:10, fontWeight:400, marginTop:2, opacity: selected ? 0.7 : 0.5 }}>
                      {sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="up-process"
            onClick={handleProcessNotes}
            disabled={uploadedFiles.length === 0 || uploading}
          >
            {uploading ? 'Processing…' : 'Process Notes'}
          </button>

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
