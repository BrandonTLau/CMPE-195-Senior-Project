import React, { useEffect, useRef, useState, useCallback } from 'react';

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
  purple:    '#818CF8',
  purpleDim: 'rgba(129,140,248,0.12)',
  font:      '"DM Sans", system-ui, sans-serif',
  serif:     '"DM Serif Display", Georgia, serif',
};

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

// ── Scroll-triggered fade-up ──────────────────────────────────
const useFadeIn = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.style.opacity='1'; el.style.transform='translateY(0)'; }
        else { el.style.opacity='0'; el.style.transform='translateY(28px)'; }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const FadeSection = ({ children, delay = 0, style = {} }) => {
  const ref = useFadeIn();
  return (
    <div ref={ref} style={{ opacity:0, transform:'translateY(28px)', transition:`opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`, ...style }}>
      {children}
    </div>
  );
};

// ── Animated stat — re-triggers every scroll into view ────────
const AnimatedStat = ({ value, label }) => {
  const ref     = useRef(null);
  const animRef = useRef(null);
  const [displayed, setDisplayed] = useState('0');

  const runAnimation = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const numeric = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) { setDisplayed(value); return; }
    const suffix   = String(value).replace(/[0-9.]/g, '');
    const duration = 1400;
    const start    = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = numeric * eased;
      setDisplayed((Number.isInteger(numeric) ? Math.round(current).toString() : current.toFixed(1)) + suffix);
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) runAnimation(); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [runAnimation]);

  return (
    <div ref={ref} className="lp-stat-cell" style={{ padding:'48px 40px', textAlign:'center' }}>
      <p style={{ fontFamily:T.serif, fontSize:44, fontWeight:400, color:T.amber, margin:'0 0 8px', letterSpacing:'-1px', lineHeight:1 }}>{displayed}</p>
      <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:0, letterSpacing:.5 }}>{label}</p>
    </div>
  );
};

// ── Typewriter text — replays every scroll into view ─────────
const Typewriter = ({ text, delay = 0, speed = 28 }) => {
  const [displayed, setDisplayed] = useState('');
  const [version,   setVersion]   = useState(0); // bumped each time section re-enters
  const ref        = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          visible = true;
          setVersion(v => v + 1);
        } else if (!entry.isIntersecting) {
          visible = false;
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (version === 0) return;
    clearInterval(intervalRef.current);
    setDisplayed('');
    let i = 0;
    const timer = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(intervalRef.current);
      }, speed);
    }, delay * 1000);
    return () => { clearTimeout(timer); clearInterval(intervalRef.current); };
  }, [version, text, delay, speed]);

  return (
    <span ref={ref}>
      {displayed}
      {displayed.length < text.length && version > 0 && (
        <span style={{ display:'inline-block', width:2, height:'1em', background:T.amber, marginLeft:2, verticalAlign:'text-bottom', animation:'cursorBlink 0.6s steps(1) infinite' }} />
      )}
    </span>
  );
};

// ── Cycling hero word ─────────────────────────────────────────
const CyclingWord = ({ words, interval = 2400 }) => {
  const [index,   setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIndex(i => (i + 1) % words.length); setVisible(true); }, 350);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval]);
  return (
    <em style={{ fontStyle:'italic', color:T.amber, display:'inline-block', transition:'opacity 0.35s ease, transform 0.35s ease', opacity:visible?1:0, transform:visible?'translateY(0)':'translateY(10px)', minWidth:220 }}>
      {words[index]}
    </em>
  );
};

// ── Floating particles ────────────────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length:38 }, () => ({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      r:Math.random()*1.8+0.4, vx:(Math.random()-0.5)*0.25,
      vy:(Math.random()-0.5)*0.25, a:Math.random()*0.45+0.1,
    }));
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(245,166,35,${p.a})`; ctx.fill();
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0;
        if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize',resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />;
};

// ── Shimmer CTA button ────────────────────────────────────────
const ShimmerButton = ({ onClick, children, large = false, ghost = false }) => {
  const [hovered, setHovered] = useState(false);
  if (ghost) return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding:large?'13px 24px':'7px 18px', background:'transparent', border:`1px solid ${T.border}`, color:T.cream, borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:T.font, transition:'border-color .2s,background .2s', borderColor:hovered?T.borderHi:T.border, backgroundColor:hovered?T.surfaceHi:'transparent' }}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position:'relative', overflow:'hidden', padding:large?'13px 32px':'12px 28px', background:T.amber, border:'none', color:'#0E1117', borderRadius:10, fontSize:large?15:14, fontWeight:700, cursor:'pointer', fontFamily:T.font, display:'inline-flex', alignItems:'center', gap:8, transition:'opacity .2s, transform .15s, box-shadow .2s', opacity:hovered?0.92:1, transform:hovered?'translateY(-2px)':'none', boxShadow:hovered?'0 8px 28px rgba(245,166,35,0.35)':'none' }}>
      <span style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%', background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)', transform:hovered?'translateX(350%)':'translateX(0)', transition:hovered?'transform 0.55s ease':'none', pointerEvents:'none' }} />
      {children}
    </button>
  );
};

// ── FAQ item ──────────────────────────────────────────────────
const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop:`1px solid ${T.border}`, padding:'20px 0', borderLeft: open ? `3px solid ${T.amber}` : '3px solid transparent', paddingLeft: open ? 16 : 0, transition:'border-color .25s, padding-left .25s' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', padding:0, gap:16 }}>
        <p style={{ fontFamily:T.font, fontSize:15, fontWeight:600, color: open ? T.cream : T.cream, margin:0, textAlign:'left' }}>{question}</p>
        <div style={{ width:24, height:24, borderRadius:99, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'transform .2s, background .2s, border-color .2s', transform:open?'rotate(45deg)':'none', background:open?T.amberDim:'transparent', borderColor:open?'rgba(245,166,35,.3)':T.border }}>
          <Icon d="M12 4v16m8-8H4" size={12} color={open?T.amber:T.muted} />
        </div>
      </button>
      <div style={{ overflow:'hidden', maxHeight:open?300:0, transition:'max-height 0.35s ease' }}>
        <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:'14px 0 0', lineHeight:1.75, maxWidth:620 }}>{answer}</p>
      </div>
    </div>
  );
};

// ── Before / After draggable divider ─────────────────────────
const BeforeAfter = () => {
  const [pos,      setPos]      = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  const onMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - left) / width) * 100));
    setPos(pct);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e) => onMove(e.clientX);
    const onTouchMove = (e) => onMove(e.touches[0].clientX);
    const stop = () => setDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
  }, [dragging, onMove]);

  const noteLines = [
    'Photosynthesis converts light energy',
    'into chemical energy stored in glucose.',
    'Requires CO₂, H₂O, and sunlight.',
    'Chlorophyll absorbs red + blue light.',
    'Products: glucose + O₂',
    '',
    'Light Rxn → ATP + NADPH',
    'Calvin Cycle → G3P → Glucose',
  ];

  const transcribed = [
    { label:'Photosynthesis', bold:true },
    { label:' converts light energy into chemical energy stored in glucose.' },
    { label:'\n\nRequires ', newline:true },
    { label:'CO₂, H₂O,', bold:true },
    { label:' and sunlight.' },
    { label:'\n\nChlorophyll', newline:true, bold:true },
    { label:' absorbs red + blue wavelengths.' },
    { label:'\n\nProducts: ', newline:true },
    { label:'glucose + O₂', bold:true },
    { label:'\n\nLight Rxn → ATP + NADPH\nCalvin Cycle → G3P → Glucose', newline:true },
  ];

  return (
    <div ref={containerRef}
      style={{ position:'relative', height:420, userSelect:'none', cursor: dragging ? 'col-resize' : 'default', overflow:'hidden', borderRadius:16, border:`1px solid ${T.border}` }}
      onMouseMove={e => dragging && onMove(e.clientX)}
      onTouchMove={e => dragging && onMove(e.touches[0].clientX)}>

      {/* Right panel — transcribed (full width, behind clip) */}
      <div style={{ position:'absolute', inset:0, background:T.surfaceHi, padding:'28px 32px', overflow:'hidden' }}>
        <p style={{ fontFamily:T.font, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.green, margin:'0 0 16px', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:T.green, display:'inline-block' }} />
          NoteScan — Transcribed
        </p>
        <div style={{ fontFamily:T.font, fontSize:13, color:T.cream, lineHeight:1.9 }}>
          {noteLines.filter(Boolean).map((line, i) => (
            <p key={i} style={{ margin:'0 0 4px' }}>{line}</p>
          ))}
        </div>
        {/* Confidence badge */}
        <div style={{ position:'absolute', bottom:20, right:20, display:'flex', alignItems:'center', gap:6, background:T.greenDim, border:'1px solid rgba(52,211,153,.25)', borderRadius:99, padding:'4px 12px' }}>
          <span style={{ fontFamily:T.font, fontSize:11, fontWeight:700, color:T.green }}>88% confidence</span>
        </div>
      </div>

      {/* Left panel — handwritten (clipped to pos%) */}
      <div style={{ position:'absolute', inset:0, background:T.surface, padding:'28px 32px', overflow:'hidden', clipPath:`inset(0 ${100-pos}% 0 0)` }}>
        <p style={{ fontFamily:T.font, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.muted, margin:'0 0 16px', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:T.muted, display:'inline-block' }} />
          Original — Handwritten
        </p>
        {noteLines.map((line, i) => (
          <div key={i} style={{ fontFamily:'"Caveat", cursive', fontSize:17, color:T.cream, marginBottom:10, opacity:0.88, minHeight:24 }}>{line}</div>
        ))}
        {/* Lined paper effect */}
        {Array.from({ length:10 }).map((_, i) => (
          <div key={i} style={{ position:'absolute', left:0, right:0, top: 68 + i*34, height:1, background:'rgba(255,255,255,0.03)' }} />
        ))}
      </div>

      {/* Divider handle */}
      <div
        onMouseDown={e => { e.preventDefault(); setDragging(true); }}
        onTouchStart={() => setDragging(true)}
        style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, transform:'translateX(-50%)', width:44, display:'flex', alignItems:'center', justifyContent:'center', cursor:'col-resize', zIndex:10 }}>
        {/* Line */}
        <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:2, background:T.amber, boxShadow:`0 0 12px ${T.amber}`, transform:'translateX(-50%)' }} />
        {/* Handle pill */}
        <div style={{ width:36, height:36, borderRadius:'50%', background:T.bg, border:`2px solid ${T.amber}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 16px rgba(245,166,35,0.4)`, zIndex:1, gap:3 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth={2.5} strokeLinecap="round">
            <path d="M8 12H16M8 8l-4 4 4 4M16 8l4 4-4 4"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div style={{ position:'absolute', top:12, left:16, fontFamily:T.font, fontSize:10, fontWeight:600, color:T.muted, pointerEvents:'none', opacity: pos > 20 ? 1 : 0, transition:'opacity .2s' }}>Before</div>
      <div style={{ position:'absolute', top:12, right:16, fontFamily:T.font, fontSize:10, fontWeight:600, color:T.green, pointerEvents:'none', opacity: pos < 80 ? 1 : 0, transition:'opacity .2s' }}>After</div>
    </div>
  );
};

// ── Problem / Solution table ──────────────────────────────────
const ProblemSolutionTable = () => {
  const rows = [
    {
      problem:  'Handwritten notes can\'t be searched — you have to flip through pages to find anything',
      solution: 'OCR converts your handwriting to fully searchable, editable digital text',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    },
    {
      problem:  'Digitizing handwritten notes means retyping every word — 30 to 60 minutes of work',
      solution: 'Upload a photo and get digital text back in under 30 seconds',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      problem:  'Handwritten notes are just raw text — no summaries or study aids without extra work',
      solution: 'AI instantly generates a concise summary and flashcards from your scanned notes',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
      problem:  'Creating quizzes or flashcards from handwritten notes takes hours of manual effort',
      solution: 'Built-in quiz and flashcard generation turns your notes into study tools instantly',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
  ];

  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:16, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:T.surfaceHi }}>
        <div style={{ padding:'16px 24px', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(248,113,113,0.7)' }} />
          <span style={{ fontFamily:T.font, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:T.muted }}>The Problem</span>
        </div>
        <div style={{ padding:'16px 24px', borderLeft:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:8, background:T.amberDim }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:T.amber }} />
          <span style={{ fontFamily:T.font, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:T.amber }}>NoteScan Solves It</span>
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div key={i} className="lp-compare-row"
          style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:`1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>

          {/* Problem */}
          <div style={{ padding:'18px 24px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(248,113,113,0.5)', flexShrink:0 }} />
            <span style={{ fontFamily:T.font, fontSize:13, color:T.muted, lineHeight:1.5 }}>{row.problem}</span>
          </div>

          {/* Solution */}
          <div style={{ padding:'18px 24px', borderLeft:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:14, background:'rgba(245,166,35,0.03)' }}>
            <div style={{ width:28, height:28, borderRadius:8, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon d={row.icon} size={13} color={T.amber} />
            </div>
            <span style={{ fontFamily:T.font, fontSize:13, color:T.cream, lineHeight:1.5 }}>{row.solution}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Product showcase animation ────────────────────────────────
const OCRDemoAnimation = () => {
  const PHASES         = ['scan', 'summary', 'flashcard', 'quiz'];
  const PHASE_LABELS   = ['OCR Scan', 'AI Summary', 'Flashcards', 'Quiz'];
  const PHASE_DURATION = 4500;

  const [phase,        setPhase]        = useState(0);
  const [scanY,        setScanY]        = useState(0);
  const [typedChars,   setTypedChars]   = useState(0);
  const [confidence,   setConfidence]   = useState(0);
  const [flipped,      setFlipped]      = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [revealed,     setRevealed]     = useState(false);
  const [summaryLines, setSummaryLines] = useState(0);
  const [entering,     setEntering]     = useState(false);
  const frameRef  = useRef(null);
  const timerRef  = useRef(null);
  const cancelRef = useRef(false);

  const FULL_TEXT = 'Photosynthesis converts light energy into chemical energy stored in glucose. Requires CO₂, H₂O, and sunlight. Chlorophyll absorbs red and blue wavelengths.';
  const SUMMARY_LINES = [
    'Converts light → glucose via chlorophyll',
    'Inputs: CO₂ + H₂O + sunlight',
    'Chlorophyll absorbs red & blue light',
    'Produces O₂ as a byproduct',
  ];
  const QUIZ_OPTIONS = ['Mitochondria', 'Chloroplast', 'Nucleus', 'Ribosome'];
  const CORRECT = 1;

  const goToPhase = (next) => {
    setEntering(true);
    setTimeout(() => {
      setPhase(next);
      setEntering(false);
      if (PHASES[next] === 'scan')      { setScanY(0); setTypedChars(0); setConfidence(0); }
      if (PHASES[next] === 'summary')   { setSummaryLines(0); }
      if (PHASES[next] === 'flashcard') { setFlipped(false); }
      if (PHASES[next] === 'quiz')      { setSelected(null); setRevealed(false); }
    }, 280);
  };

  useEffect(() => {
    if (PHASES[phase] !== 'scan') return;
    cancelRef.current = false;
    const run = async () => {
      await new Promise(res => {
        const start = performance.now(); const dur = 1400;
        const tick = (now) => {
          if (cancelRef.current) return;
          const p = Math.min((now - start) / dur, 1);
          setScanY(p * 100);
          if (p < 1) frameRef.current = requestAnimationFrame(tick); else res();
        };
        frameRef.current = requestAnimationFrame(tick);
      });
      if (cancelRef.current) return;
      for (let i = 0; i <= FULL_TEXT.length; i++) {
        if (cancelRef.current) return;
        setTypedChars(i);
        setConfidence(Math.round((i / FULL_TEXT.length) * 88 + 4));
        await new Promise(res => setTimeout(res, 14));
      }
    };
    run();
    return () => { cancelRef.current = true; cancelAnimationFrame(frameRef.current); };
  }, [phase]);

  useEffect(() => {
    if (PHASES[phase] !== 'summary') return;
    let cancelled = false;
    const run = async () => {
      for (let i = 1; i <= SUMMARY_LINES.length; i++) {
        if (cancelled) return;
        setSummaryLines(i);
        await new Promise(res => setTimeout(res, 450));
      }
    };
    run();
    return () => { cancelled = true; };
  }, [phase]);

  useEffect(() => {
    if (PHASES[phase] !== 'flashcard') return;
    setFlipped(false);
    const t = setTimeout(() => setFlipped(true), 1700);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (PHASES[phase] !== 'quiz') return;
    setSelected(null); setRevealed(false);
    const t1 = setTimeout(() => setSelected(CORRECT), 1200);
    const t2 = setTimeout(() => setRevealed(true), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => goToPhase((phase + 1) % PHASES.length), PHASE_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [phase]);

  return (
    <div style={{ position:'absolute', inset:0, background:T.surface, display:'flex', flexDirection:'column', overflow:'hidden', opacity:entering?0:1, transform:entering?'translateY(8px)':'translateY(0)', transition:'opacity 0.28s ease, transform 0.28s ease' }}>
      <div style={{ display:'flex', borderBottom:`1px solid ${T.border}`, background:T.bg, flexShrink:0 }}>
        {PHASE_LABELS.map((label, i) => (
          <button key={i} onClick={() => goToPhase(i)}
            style={{ flex:1, padding:'12px 8px', background:'none', border:'none', borderBottom:phase===i?`2px solid ${T.amber}`:'2px solid transparent', color:phase===i?T.amber:T.muted, fontFamily:T.font, fontSize:12, fontWeight:600, cursor:'pointer', transition:'color .2s, border-color .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:phase===i?T.amber:'transparent', border:`1px solid ${phase===i?T.amber:T.muted}`, transition:'all .2s', boxShadow:phase===i?`0 0 6px ${T.amber}`:'none' }} />
            {label}
          </button>
        ))}
      </div>
      <div style={{ height:2, background:'rgba(255,255,255,0.04)', flexShrink:0 }}>
        <div style={{ height:'100%', background:T.amber, width:entering?'0%':'100%', transition:entering?'none':`width ${PHASE_DURATION}ms linear` }} />
      </div>
      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
        {PHASES[phase] === 'scan' && (
          <div style={{ display:'flex', height:'100%' }}>
            <div style={{ flex:1, borderRight:`1px solid ${T.border}`, padding:'20px 18px', position:'relative', overflow:'hidden' }}>
              <p style={{ fontFamily:T.font, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.muted, margin:'0 0 14px' }}>Original scan</p>
              <div style={{ position:'relative' }}>
                {['Photosynthesis converts light', 'energy into chemical energy', 'stored in glucose. Requires', 'CO₂, H₂O, and sunlight.', 'Chlorophyll absorbs red +', 'blue wavelengths.'].map((line, i) => (
                  <div key={i} style={{ fontFamily:'"Caveat", cursive', fontSize:14, color:T.cream, marginBottom:9, opacity:0.85 }}>{line}</div>
                ))}
                {scanY < 100 && <div style={{ position:'absolute', left:-4, right:-4, top:`${scanY}%`, height:2, background:`linear-gradient(90deg, transparent, ${T.amber}, transparent)`, boxShadow:`0 0 12px rgba(245,166,35,0.6)`, transition:'top 0.016s linear' }} />}
              </div>
              <div style={{ position:'absolute', bottom:14, left:18, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:typedChars>=FULL_TEXT.length?T.green:T.amber, animation:'pulseDot 1s infinite' }} />
                <span style={{ fontFamily:T.font, fontSize:10, color:T.muted }}>{typedChars>=FULL_TEXT.length?'Complete':'Scanning…'}</span>
              </div>
            </div>
            <div style={{ flex:1, padding:'20px 18px', display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <p style={{ fontFamily:T.font, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.muted, margin:0 }}>Transcribed text</p>
                {confidence > 0 && <span style={{ fontFamily:T.font, fontSize:10, fontWeight:700, color:confidence>=80?T.green:T.amber, background:confidence>=80?T.greenDim:T.amberDim, padding:'2px 8px', borderRadius:99 }}>{confidence}%</span>}
              </div>
              <div style={{ flex:1, background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 12px' }}>
                <p style={{ fontFamily:T.font, fontSize:11, color:T.cream, lineHeight:1.8, margin:0 }}>
                  {FULL_TEXT.slice(0, typedChars)}
                  {typedChars < FULL_TEXT.length && <span style={{ display:'inline-block', width:2, height:11, background:T.amber, marginLeft:2, verticalAlign:'middle', animation:'cursorBlink 0.6s steps(1) infinite' }} />}
                </p>
              </div>
              <div style={{ height:2, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', background:T.amber, width:`${(typedChars/FULL_TEXT.length)*100}%`, transition:'width 0.05s linear', borderRadius:99 }} />
              </div>
            </div>
          </div>
        )}
        {PHASES[phase] === 'summary' && (
          <div style={{ padding:'20px 24px', height:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:26, height:26, borderRadius:8, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M13 10V3L4 14h7v7l9-11h-7z" size={13} color={T.amber} />
              </div>
              <p style={{ fontFamily:T.font, fontSize:13, fontWeight:600, color:T.cream, margin:0 }}>AI Summary</p>
              <span style={{ fontFamily:T.font, fontSize:10, color:T.muted, marginLeft:'auto' }}>Photosynthesis Notes</span>
            </div>
            <div style={{ flex:1, background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
              <p style={{ fontFamily:T.font, fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:T.muted, margin:0 }}>Key Points</p>
              {SUMMARY_LINES.map((line, i) => (
                <div key={i} style={{ fontFamily:T.font, fontSize:12, color:T.cream, lineHeight:1.6, opacity:i<summaryLines?1:0, transform:i<summaryLines?'translateX(0)':'translateX(-12px)', transition:'opacity 0.35s ease, transform 0.35s ease', display:'flex', alignItems:'flex-start', gap:8 }}>
                  <span style={{ color:T.amber, flexShrink:0 }}>—</span>{line}
                </div>
              ))}
            </div>
          </div>
        )}
        {PHASES[phase] === 'flashcard' && (
          <div style={{ padding:'20px 24px', height:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:26, height:26, borderRadius:8, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" size={13} color={T.amber} />
              </div>
              <p style={{ fontFamily:T.font, fontSize:13, fontWeight:600, color:T.cream, margin:0 }}>Flashcards</p>
              <span style={{ fontFamily:T.font, fontSize:10, color:T.muted, background:T.surfaceHi, padding:'2px 8px', borderRadius:99, border:`1px solid ${T.border}`, marginLeft:'auto' }}>1 of 4</span>
            </div>
            <div style={{ flex:1, perspective:800, cursor:'pointer' }} onClick={() => setFlipped(f => !f)}>
              <div style={{ position:'relative', width:'100%', height:'100%', transformStyle:'preserve-3d', transition:'transform 0.6s cubic-bezier(.4,0,.2,1)', transform:flipped?'rotateY(180deg)':'none' }}>
                <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:12, padding:'20px', display:'flex', flexDirection:'column', gap:10 }}>
                  <span style={{ fontFamily:T.font, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.amber, background:T.amberDim, padding:'2px 10px', borderRadius:99, alignSelf:'flex-start' }}>Question</span>
                  <p style={{ fontFamily:T.serif, fontSize:16, color:T.cream, margin:0, lineHeight:1.4, flex:1, display:'flex', alignItems:'center' }}>What molecule absorbs light energy during photosynthesis?</p>
                  <p style={{ fontFamily:T.font, fontSize:10, color:T.muted, margin:0 }}>Click to reveal answer</p>
                </div>
                <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', transform:'rotateY(180deg)', background:T.surfaceHi, border:`1px solid rgba(245,166,35,.2)`, borderRadius:12, padding:'20px', display:'flex', flexDirection:'column', gap:10 }}>
                  <span style={{ fontFamily:T.font, fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:T.purple, background:T.purpleDim, padding:'2px 10px', borderRadius:99, alignSelf:'flex-start' }}>Answer</span>
                  <p style={{ fontFamily:T.serif, fontSize:22, color:T.cream, margin:0, lineHeight:1.4, flex:1, display:'flex', alignItems:'center' }}>Chlorophyll</p>
                  <p style={{ fontFamily:T.font, fontSize:10, color:T.muted, margin:0 }}>Found in chloroplasts of plant cells</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {PHASES[phase] === 'quiz' && (
          <div style={{ padding:'20px 24px', height:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:26, height:26, borderRadius:8, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={13} color={T.amber} />
              </div>
              <p style={{ fontFamily:T.font, fontSize:13, fontWeight:600, color:T.cream, margin:0 }}>Quiz</p>
              <span style={{ fontFamily:T.font, fontSize:10, color:T.muted, marginLeft:'auto' }}>Question 1 of 5</span>
            </div>
            <p style={{ fontFamily:T.font, fontSize:13, fontWeight:600, color:T.cream, margin:0, lineHeight:1.5 }}>
              <span style={{ color:T.amber, marginRight:6 }}>1.</span>
              Where does photosynthesis primarily take place in a plant cell?
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:7, flex:1 }}>
              {QUIZ_OPTIONS.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect  = i === CORRECT;
                let bg = 'transparent', border = T.border, color = T.muted;
                if (isSelected && !revealed)              { bg=T.amberDim; border='rgba(245,166,35,.4)'; color=T.amber; }
                if (revealed && isCorrect)                { bg=T.greenDim; border='rgba(52,211,153,.4)'; color=T.green; }
                if (revealed && isSelected && !isCorrect) { bg='rgba(248,113,113,.1)'; border='rgba(248,113,113,.3)'; color='#FCA5A5'; }
                return (
                  <div key={i} onClick={() => !revealed && setSelected(i)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, border:`1px solid ${border}`, background:bg, transition:'all 0.25s', cursor:'pointer' }}>
                    <span style={{ width:20, height:20, borderRadius:'50%', border:`1.5px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color, flexShrink:0 }}>{String.fromCharCode(65+i)}</span>
                    <span style={{ fontFamily:T.font, fontSize:12, color, flex:1 }}>{opt}</span>
                    {revealed && isCorrect && <svg width={13} height={13} fill="none" stroke={T.green} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Demo wrapper — self-contained reset on scroll into view ───
const DemoWrapper = () => {
  const ref      = useRef(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          visible = true;
          setResetKey(k => k + 1);
        } else if (!entry.isIntersecting) {
          visible = false;
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ overflow:'hidden', background:T.bg, position:'relative', aspectRatio:'21/9', width:'100%' }}>
      <OCRDemoAnimation key={resetKey} />
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────
const LandingPage = ({ onStart, onSignIn, onSignUp }) => {
  const [scrolled,    setScrolled]    = useState(false);
  const [mousePos,    setMousePos]    = useState({ x:0, y:0 });
  const [scrollPct,   setScrollPct]   = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const body = document.body; const html = document.documentElement;
    const prevBM=body.style.margin, prevBP=body.style.padding, prevHM=html.style.margin, prevHP=html.style.padding;
    body.style.margin='0'; body.style.padding='0'; html.style.margin='0'; html.style.padding='0';

    const link = document.createElement('link');
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&family=Caveat:wght@500&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id='lp-styles';
    style.textContent=`
      @keyframes fadeUp      { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
      @keyframes pulseDot    { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
      @keyframes floatUp     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes avatarGlow  { 0%,100%{box-shadow:0 0 0 rgba(245,166,35,0)} 50%{box-shadow:0 0 20px rgba(245,166,35,0.4)} }

      .lp-feature-row { border-left:3px solid transparent; transition:background .25s,border-color .25s; }
      .lp-feature-row:hover { background:#161B27!important; border-left-color:rgba(245,166,35,0.5)!important; }
      .lp-feature-row:hover .lp-feature-num { color:rgba(245,166,35,0.45)!important; }
      .lp-feature-row:hover .lp-feature-icon { transform:scale(1.1) rotate(-4deg); box-shadow:0 0 20px rgba(245,166,35,0.2); }
      .lp-feature-icon { transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s; }

      .lp-team-card { border:1px solid rgba(255,255,255,0.07); border-radius:16px; transition:border-color .2s,transform .2s,box-shadow .2s; }
      .lp-team-card:hover { border-color:rgba(245,166,35,0.25)!important; transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.3); }
      .lp-team-card:hover .lp-avatar { animation:avatarGlow 1.2s ease-in-out infinite; }

      .lp-testimonial { border:1px solid rgba(255,255,255,0.07); border-radius:16px; transition:border-color .2s,transform .2s; }
      .lp-testimonial:hover { border-color:rgba(245,166,35,0.2); transform:translateY(-2px); }

      .lp-step-card { border-radius:16px; transition:background .2s,transform .2s; }
      .lp-step-card:hover { background:rgba(245,166,35,0.05)!important; transform:translateY(-3px); }

      .lp-stat-cell { border-radius:16px; transition:background .2s; }
      .lp-stat-cell:hover { background:rgba(245,166,35,0.04)!important; }

      .lp-compare-row { transition:background .15s; }
      .lp-compare-row:hover { background:rgba(245,166,35,0.03)!important; }

      .lp-back-top {
        position:fixed; bottom:28px; right:28px; z-index:200;
        display:flex; align-items:center; gap:6px;
        background:rgba(14,17,23,0.9); border:1px solid rgba(245,166,35,.3);
        color:#F5A623; padding:8px 16px; border-radius:99px; font-size:12px;
        cursor:pointer; font-family:"DM Sans",system-ui,sans-serif; font-weight:600;
        backdrop-filter:blur(8px); box-shadow:0 4px 20px rgba(0,0,0,.4);
        transition:opacity .3s,transform .3s,box-shadow .2s;
      }
      .lp-back-top:hover { box-shadow:0 4px 24px rgba(245,166,35,0.25); }
    `;
    document.head.appendChild(style);

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(scrollTop > 40);
      setScrollPct(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setShowBackTop(scrollTop > window.innerHeight * 0.8);
    };
    const onMouse = (e) => setMousePos({ x:e.clientX, y:e.clientY });
    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouse);
    return () => {
      body.style.margin=prevBM; body.style.padding=prevBP;
      html.style.margin=prevHM; html.style.padding=prevHP;
      document.head.removeChild(link);
      const s=document.head.querySelector('#lp-styles'); if(s) document.head.removeChild(s);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  const features = [
    { num:'01', label:'Text Recognition', title:'Scan. Instantly searchable.', desc:'Upload any photo of handwritten notes and our OCR engine converts it into editable, searchable digital text with 85–90% accuracy.', icon:'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z', color:T.amber, colorDim:T.amberDim },
    { num:'02', label:'AI Summarization', title:'Summaries and flashcards. One click.', desc:'AI generates concise bullet summaries and study flashcards directly from your notes — no manual work required.', icon:'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', color:T.amber, colorDim:T.amberDim },
    { num:'03', label:'Organization', title:'Everything in one place.', desc:'Organize notes into folders, star your favorites, export as PDF or TXT, and access everything from one clean dashboard.', icon:'M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z', color:T.amber, colorDim:T.amberDim },
  ];

  const team = [
    { name:'Brandon Lau',            role:'Frontend Developer', linkedin:'' },
    { name:'Taras Tishchenko',       role:'Backend Developer',  linkedin:'' },
    { name:'Yuzhen Kuang',           role:'OCR Engineer',       linkedin:'' },
    { name:'Sebastien Roumain-Zala', role:'OCR Engineer',       linkedin:'' },
  ];

  return (
    <div style={{ minHeight:'100vh', width:'100%', background:T.bg, fontFamily:T.font, color:T.cream, boxSizing:'border-box', overflowX:'hidden', position:'relative' }}>

      {/* Amber top accent border */}
      <div style={{ position:'fixed', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${T.amber}, transparent)`, zIndex:200, opacity:0.7 }} />

      {/* Scroll progress bar */}
      <div style={{ position:'fixed', top:2, left:0, height:2, background:T.amber, width:`${scrollPct}%`, zIndex:201, transition:'width 0.1s linear', boxShadow:`0 0 8px ${T.amber}` }} />

      {/* Cursor glow */}
      <div style={{ position:'fixed', pointerEvents:'none', zIndex:0, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,166,35,0.055) 0%, transparent 70%)', transform:`translate(${mousePos.x-250}px, ${mousePos.y-250}px)`, transition:'transform 0.15s ease' }} />

      {/* Floating back to top */}
      {showBackTop && (
        <button className="lp-back-top"
          onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
          style={{ opacity: showBackTop ? 1 : 0, transform: showBackTop ? 'translateY(0)' : 'translateY(16px)' }}>
          <Icon d="M5 15l7-7 7 7" size={13} color={T.amber} />
          Back to top
        </button>
      )}

      {/* Nav */}
      <nav style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 48px', boxSizing:'border-box', animation:'fadeIn .4s ease both', position:'sticky', top:2, zIndex:100, background:scrolled?'rgba(14,17,23,0.85)':T.bg, backdropFilter:scrolled?'blur(12px)':'none', borderBottom:scrolled?`1px solid ${T.border}`:'1px solid transparent', transition:'background .3s,border-color .3s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:T.amber, display:'flex', alignItems:'center', justifyContent:'center', animation:'floatUp 4s ease-in-out infinite' }}>
            <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={15} color="#0E1117" />
          </div>
          <span style={{ fontFamily:T.serif, fontSize:19, color:T.cream }}>NoteScan</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <ShimmerButton onClick={onSignIn} ghost>Sign In</ShimmerButton>
          <ShimmerButton onClick={onSignUp || onStart}>
            <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={14} color="#0E1117" />
            Get Started
          </ShimmerButton>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign:'center', padding:'96px 48px 80px', position:'relative', overflow:'hidden' }}>
        <ParticleField />
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(245,166,35,0.07) 0%, transparent 70%)', zIndex:0 }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <h1 style={{ fontFamily:T.serif, fontSize:58, fontWeight:400, color:T.cream, margin:'0 0 22px', lineHeight:1.08, letterSpacing:'-1px', animation:'fadeUp .7s ease both .1s', opacity:0 }}>
            Your entire <CyclingWord words={['study workflow,', 'note library,', 'exam prep,']} /><br />
            <em style={{ fontStyle:'italic', color:T.amber }}>in one place.</em>
          </h1>
          <p style={{ fontFamily:T.font, fontSize:16, color:T.muted, margin:'0 auto 36px', lineHeight:1.75, maxWidth:460, animation:'fadeUp .7s ease both .25s', opacity:0 }}>
            <Typewriter text="Upload a photo of your handwritten notes and get searchable text, AI summaries, and flashcards — in seconds." delay={0.8} speed={22} />
          </p>
          <div style={{ animation:'fadeUp .7s ease both .4s', opacity:0 }}>
            <ShimmerButton onClick={onStart} large>
              <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={16} color="#0E1117" />
              Start Converting
            </ShimmerButton>
          </div>
        </div>
      </section>

      {/* Statement */}
      <FadeSection style={{ textAlign:'center', padding:'80px 48px' }}>
        <h2 style={{ fontFamily:T.serif, fontSize:38, fontWeight:400, color:T.cream, lineHeight:1.2, maxWidth:560, margin:'0 auto 16px', letterSpacing:'-.5px' }}>Students waste hours rewriting notes that could be spent actually studying.</h2>
        <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, lineHeight:1.75, maxWidth:380, margin:'0 auto' }}>NoteScan combines OCR, AI summarization, and flashcard generation into one seamless workflow.</p>
      </FadeSection>

      {/* Demo */}
      <FadeSection style={{ padding:'0 0 72px' }}>
        <div style={{ textAlign:'center', padding:'0 48px 40px' }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 14px', fontFamily:T.font }}>See it in action</p>
          <h2 style={{ fontFamily:T.serif, fontSize:34, fontWeight:400, color:T.cream, margin:0, letterSpacing:'-.5px', lineHeight:1.2 }}>From photo to flashcards<br/>in seconds.</h2>
        </div>
        <DemoWrapper />
      </FadeSection>

      {/* Before / After */}
      <FadeSection style={{ padding:'80px 48px' }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 16px', fontFamily:T.font }}>Before & After</p>
        <h2 style={{ fontFamily:T.serif, fontSize:34, fontWeight:400, color:T.cream, margin:'0 0 12px', letterSpacing:'-.5px', lineHeight:1.2 }}>Drag to compare.</h2>
        <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'0 0 32px', lineHeight:1.7 }}>Slide the handle to see the difference between your original handwritten note and the NoteScan output.</p>
        <BeforeAfter />
      </FadeSection>

      {/* Features */}
      <div id="features">
        <FadeSection style={{ padding:'56px 48px 32px' }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:0, fontFamily:T.font }}>Features</p>
        </FadeSection>
        {features.map((f,i) => (
          <FadeSection key={i} delay={i*0.1}>
            <div className="lp-feature-row" style={{ display:'flex', alignItems:'center', gap:48, padding:'48px 48px' }}>
              <div className="lp-feature-num" style={{ fontFamily:T.serif, fontSize:52, fontWeight:400, color:'rgba(245,166,35,0.15)', flexShrink:0, width:72, lineHeight:1, transition:'color .3s' }}>{f.num}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.muted, margin:'0 0 10px', fontFamily:T.font }}>{f.label}</p>
                <h3 style={{ fontFamily:T.serif, fontSize:28, fontWeight:400, color:T.cream, margin:'0 0 10px', lineHeight:1.2 }}>{f.title}</h3>
                <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, lineHeight:1.75, maxWidth:440, margin:0 }}>{f.desc}</p>
              </div>
              <div className="lp-feature-icon" style={{ width:56, height:56, borderRadius:14, background:f.colorDim, border:`1px solid ${f.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon d={f.icon} size={24} color={f.color} />
              </div>
            </div>
          </FadeSection>
        ))}
      </div>

      {/* How it works */}
      <FadeSection style={{ padding:'80px 48px' }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 16px', fontFamily:T.font }}>How it works</p>
        <h2 style={{ fontFamily:T.serif, fontSize:34, fontWeight:400, color:T.cream, margin:'0 0 48px', letterSpacing:'-.5px', lineHeight:1.2 }}>Three steps to smarter studying.</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24 }}>
          {[{ step:'1', title:'Upload', desc:'Take a photo of your handwritten notes and upload it to NoteScan.' },{ step:'2', title:'OCR processes', desc:'Our engine scans and converts your handwriting into searchable, editable digital text.' },{ step:'3', title:'Get results', desc:'AI generates a summary, flashcards, and organizes everything in your dashboard.' }].map((s,i) => (
            <div key={i} className="lp-step-card" style={{ padding:'36px 32px' }}>
              <p style={{ fontFamily:T.serif, fontSize:40, fontWeight:400, color:'rgba(245,166,35,0.2)', lineHeight:1, margin:'0 0 20px' }}>{s.step}</p>
              <p style={{ fontFamily:T.font, fontSize:15, fontWeight:600, color:T.cream, margin:'0 0 8px' }}>{s.title}</p>
              <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:0, lineHeight:1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* Stats */}
      <FadeSection style={{ padding:'0 48px 80px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24 }}>
          <AnimatedStat value="90" label="OCR Accuracy %" />
          <AnimatedStat value="3"  label="Study Aids Generated" />
          <AnimatedStat value="30" label="Seconds Average Processing" />
        </div>
      </FadeSection>

      {/* Comparison table */}
      <FadeSection style={{ padding:'0 48px 80px' }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 16px', fontFamily:T.font }}>Why NoteScan</p>
        <h2 style={{ fontFamily:T.serif, fontSize:34, fontWeight:400, color:T.cream, margin:'0 0 12px', letterSpacing:'-.5px', lineHeight:1.2 }}>The problem with handwritten notes.</h2>
        <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:'0 0 32px', lineHeight:1.75, maxWidth:480 }}>Handwritten notes are how most students learn — but they come with real limitations. NoteScan fixes every one of them.</p>
        <ProblemSolutionTable />
      </FadeSection>

      {/* Mid CTA */}
      <FadeSection style={{ padding:'80px 48px', textAlign:'center' }}>
        <h2 style={{ fontFamily:T.serif, fontSize:36, fontWeight:400, color:T.cream, margin:'0 0 12px', letterSpacing:'-.5px', lineHeight:1.2 }}>Ready to try it?</h2>
        <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:'0 auto 28px', lineHeight:1.75, maxWidth:360 }}>Upload your first note and see the results in under 30 seconds.</p>
        <ShimmerButton onClick={onStart}>
          <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={15} color="#0E1117" />
          Start Converting
        </ShimmerButton>
      </FadeSection>

      {/* Testimonials */}
      <FadeSection style={{ padding:'80px 48px' }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 32px', fontFamily:T.font }}>What students say</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
          {[{ quote:'I went from spending 2 hours rewriting notes to having everything ready in 5 minutes. NoteScan completely changed how I study.', name:'Computer Science Student', school:'San José State University' },{ quote:"The flashcard generation is incredible. I used to make them by hand — now I just upload a photo and they're done instantly.", name:'Biology Student', school:'San José State University' },{ quote:"Being able to search my handwritten lecture notes is something I didn't know I needed until I tried it.", name:'Engineering Student', school:'San José State University' }].map((t,i) => (
            <div key={i} className="lp-testimonial" style={{ padding:'28px 24px', display:'flex', flexDirection:'column', gap:20 }}>
              <span style={{ fontFamily:T.serif, fontSize:48, color:'rgba(245,166,35,0.15)', lineHeight:1, marginBottom:-12 }}>"</span>
              <p style={{ fontFamily:T.serif, fontSize:15, color:T.cream, lineHeight:1.75, margin:0 }}>{t.quote}</p>
              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:16 }}>
                <p style={{ fontFamily:T.font, fontSize:13, fontWeight:600, color:T.muted, margin:'0 0 2px' }}>{t.name}</p>
                <p style={{ fontFamily:T.font, fontSize:11, color:'rgba(107,118,148,0.5)', margin:0 }}>{t.school}</p>
              </div>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* FAQ */}
      <FadeSection style={{ padding:'80px 48px' }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 16px', fontFamily:T.font }}>FAQ</p>
        <h2 style={{ fontFamily:T.serif, fontSize:34, fontWeight:400, color:T.cream, margin:'0 0 40px', letterSpacing:'-.5px', lineHeight:1.2 }}>Frequently asked questions.</h2>
        <div style={{ display:'flex', flexDirection:'column' }}>
          {[
            { q:'What handwriting styles work best?', a:'NoteScan works best with clear, legible handwriting. Print works better than cursive. The Chandra engine is specifically optimized for handwritten content.' },
            { q:'How accurate is the OCR?', a:'Our OCR engines achieve 85–90% accuracy on typical handwritten notes. Accuracy improves with better lighting and clearer handwriting.' },
            { q:'Can NoteScan extract tables from my notes?', a:'Yes — if your notes contain hand-drawn tables, the Chandra OCR engine can detect and extract the table structure, preserving rows and columns in the transcribed output. Results are best when table borders are clearly drawn and content is legible.' },
            { q:'What file formats are supported?', a:'You can upload JPG, PNG, HEIC, and PDF files. For best results use a well-lit photo with the note filling most of the frame.' },
            { q:'Can I edit the transcribed text?', a:'Yes — after OCR you can edit the transcribed text directly in the results page before saving or exporting.' },
          ].map((faq,i) => <FaqItem key={i} question={faq.q} answer={faq.a} />)}
        </div>
      </FadeSection>

      {/* About */}
      <div id="about">
        <FadeSection style={{ padding:'80px 48px' }}>
          <div style={{ maxWidth:640 }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 20px', fontFamily:T.font }}>About</p>
            <h2 style={{ fontFamily:T.serif, fontSize:38, fontWeight:400, color:T.cream, lineHeight:1.2, margin:'0 0 20px', letterSpacing:'-.5px' }}>A senior capstone project from San José State University.</h2>
            <p style={{ fontFamily:T.font, fontSize:15, color:T.muted, lineHeight:1.8, margin:'0 0 14px' }}>NoteScan was built as part of CMPE 195B by a team of four computer science students. The goal was to solve a real problem students face every day — the disconnect between handwritten notes and digital study tools.</p>
            <p style={{ fontFamily:T.font, fontSize:15, color:T.muted, lineHeight:1.8, margin:0 }}>The app combines two OCR engines (PaddleOCR and Chandra), OpenAI-powered summarization, and a React frontend — all deployed and production-ready. Advised by Dr. Magdalini Eirinaki.</p>
          </div>
        </FadeSection>

        <FadeSection style={{ padding:'64px 48px' }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 8px', fontFamily:T.font }}>The Team</p>
          <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'0 0 36px' }}>San José State University · CMPE 195B · Spring 2026</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16 }}>
            {team.map((member,i) => (
              <div key={i} className="lp-team-card" style={{ padding:'28px 24px', display:'flex', flexDirection:'column', gap:16 }}>
                <div className="lp-avatar" style={{ width:52, height:52, borderRadius:99, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center', transition:'box-shadow .3s' }}>
                  <span style={{ fontFamily:T.serif, fontSize:20, color:T.amber }}>{member.name.split(' ').map(n=>n[0]).join('')}</span>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:T.font, fontSize:15, fontWeight:600, color:T.cream, margin:'0 0 4px' }}>{member.name}</p>
                  <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:'0 0 8px' }}>{member.role}</p>
                  <p style={{ fontFamily:T.font, fontSize:11, color:'rgba(107,118,148,0.5)', margin:0 }}>San José State University</p>
                </div>
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:T.muted, textDecoration:'none', fontFamily:T.font, transition:'color .15s' }} onMouseEnter={e=>e.currentTarget.style.color=T.cream} onMouseLeave={e=>e.currentTarget.style.color=T.muted}>
                    <Icon d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" size={13} />LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        </FadeSection>
      </div>

      {/* Footer */}
      <div style={{ padding:'24px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:`1px solid ${T.border}` }}>
        <p style={{ fontFamily:T.font, fontSize:11, color:'rgba(107,118,148,0.5)', margin:0 }}>© 2026 NoteScan · CMPE 195 Project · San José State University</p>
      </div>

    </div>
  );
};

export default LandingPage;
