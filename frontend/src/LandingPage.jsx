import React, { useEffect } from 'react';

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

const LandingPage = ({ onStart, onSignIn }) => {

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    const prevBodyMargin   = body.style.margin;
    const prevBodyPadding  = body.style.padding;
    const prevHtmlMargin   = html.style.margin;
    const prevHtmlPadding  = html.style.padding;

    body.style.margin  = '0';
    body.style.padding = '0';
    html.style.margin  = '0';
    html.style.padding = '0';

    // inject fonts + keyframes
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
      @keyframes float   { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }
    `;
    document.head.appendChild(style);

    return () => {
      body.style.margin   = prevBodyMargin;
      body.style.padding  = prevBodyPadding;
      html.style.margin   = prevHtmlMargin;
      html.style.padding  = prevHtmlPadding;
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  const features = [
    {
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: T.amber, colorDim: T.amberDim,
      title: 'Text Recognition',
      desc:  'Convert handwritten notes to digital text with 85–90% accuracy.',
    },
    {
      icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      color: T.purple, colorDim: T.purpleDim,
      title: 'Table Extraction',
      desc:  'Digitize tables and structured data with high accuracy.',
    },
    {
      icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
      color: T.green, colorDim: T.greenDim,
      title: 'AI Summarization',
      desc:  'Generate summaries and flashcards automatically.',
    },
  ];

  return (
    <div style={{ minHeight:'100vh', width:'100%', background:T.bg, fontFamily:T.font,
      display:'flex', flexDirection:'column', alignItems:'center', boxSizing:'border-box', overflowX:'hidden' }}>

      {/* Subtle background glow */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,166,35,0.07) 0%, transparent 70%)' }} />

      {/* ── Nav ── */}
      <nav style={{ width:'100%', maxWidth:1200, display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'20px 40px', boxSizing:'border-box', position:'relative', zIndex:10,
        borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={17} color="#0E1117" />
          </div>
          <span style={{ fontFamily:T.serif, fontSize:20, color:T.cream }}>NoteScan</span>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button style={{ padding:'8px 16px', border:'none', background:'none', color:T.muted,
            fontSize:14, cursor:'pointer', fontFamily:T.font, fontWeight:500, borderRadius:8,
            transition:'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = T.cream}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}>
            Features
          </button>
          <button style={{ padding:'8px 16px', border:'none', background:'none', color:T.muted,
            fontSize:14, cursor:'pointer', fontFamily:T.font, fontWeight:500, borderRadius:8,
            transition:'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = T.cream}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}>
            About
          </button>
          <button onClick={onSignIn}
            style={{ padding:'8px 20px', background:'transparent', border:`1px solid ${T.border}`, color:T.cream,
              borderRadius:9, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:T.font,
              transition:'border-color .2s, background .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = T.surfaceHi; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign:'center', maxWidth:720, padding:'80px 40px 64px', position:'relative', zIndex:10,
        animation:'fadeUp .6s ease both' }}>

        <h1 style={{ fontFamily:T.serif, fontSize:52, fontWeight:400, color:T.cream, margin:'0 0 20px', lineHeight:1.1, letterSpacing:'-.5px' }}>
          Transform Your<br />
          <span style={{ color:T.amber }}>Handwritten Notes</span>
        </h1>

        <p style={{ fontFamily:T.font, fontSize:17, color:T.muted, margin:'0 0 36px', lineHeight:1.7 }}>
          Upload photos of your handwritten notes and convert them into searchable,
          editable digital text in seconds.
        </p>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={onStart}
            style={{ padding:'13px 32px', background:T.amber, border:'none', color:'#0E1117',
              borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:T.font,
              transition:'opacity .2s, transform .15s', display:'inline-flex', alignItems:'center', gap:8 }}
            onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; }}>
            <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={16} color="#0E1117" />
            Start Converting
          </button>
        </div>

        
      </section>

      {/* Divider */}
      <div style={{ width:'100%', maxWidth:1200, height:1, background:T.border, position:'relative', zIndex:10 }} />

      {/* ── Features ── */}
      <div style={{ width:'100%', maxWidth:1200, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',
        gap:16, padding:'64px 40px', boxSizing:'border-box', position:'relative', zIndex:10,
        animation:'fadeUp .7s ease both' }}>
        {features.map((f, i) => (
          <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:28,
            transition:'border-color .2s, box-shadow .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.borderHi; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.boxShadow='none'; }}>
            <div style={{ width:46, height:46, borderRadius:12, background:f.colorDim,
              border:`1px solid ${f.color}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
              <Icon d={f.icon} size={22} color={f.color} />
            </div>
            <h3 style={{ fontFamily:T.font, fontSize:16, fontWeight:700, color:T.cream, margin:'0 0 8px' }}>{f.title}</h3>
            <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:0, lineHeight:1.7 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ width:'100%', borderTop:`1px solid ${T.border}`, padding:'20px 40px', boxSizing:'border-box',
        display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:10 }}>
        <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0 }}>
          © 2026 NoteScan · CMPE 195 Project
        </p>
      </div>

    </div>
  );
};

export default LandingPage;
