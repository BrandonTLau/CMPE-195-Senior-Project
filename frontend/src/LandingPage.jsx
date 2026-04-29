import React, { useEffect, useRef } from 'react';

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

const useFadeIn = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        } else {
          el.style.opacity = '0';
          el.style.transform = 'translateY(28px)';
        }
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

const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ borderTop:`1px solid ${T.border}`, padding:'20px 0' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', padding:0, gap:16 }}>
        <p style={{ fontFamily:T.font, fontSize:15, fontWeight:600, color:T.cream, margin:0, textAlign:'left' }}>{question}</p>
        <div style={{ width:24, height:24, borderRadius:99, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'transform .2s', transform: open ? 'rotate(45deg)' : 'none' }}>
          <Icon d="M12 4v16m8-8H4" size={12} color={T.muted} />
        </div>
      </button>
      {open && <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:'14px 0 0', lineHeight:1.75, maxWidth:620 }}>{answer}</p>}
    </div>
  );
};

const LandingPage = ({ onStart, onSignIn }) => {
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const prevBodyMargin  = body.style.margin;
    const prevBodyPadding = body.style.padding;
    const prevHtmlMargin  = html.style.margin;
    const prevHtmlPadding = html.style.padding;
    body.style.margin  = '0';
    body.style.padding = '0';
    html.style.margin  = '0';
    html.style.padding = '0';

    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id = 'lp-styles';
    style.textContent = `
      @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
      @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      .lp-nav-link:hover { color: #EDE8DC !important; }
      .lp-feature-row:hover { background: #161B27 !important; }
      .lp-feature-row:hover .lp-feature-num { color: rgba(245,166,35,0.45) !important; }
      .lp-team-card:hover { border-color: rgba(255,255,255,0.13) !important; }
    `;
    document.head.appendChild(style);

    return () => {
      body.style.margin   = prevBodyMargin;
      body.style.padding  = prevBodyPadding;
      html.style.margin   = prevHtmlMargin;
      html.style.padding  = prevHtmlPadding;
      document.head.removeChild(link);
      const s = document.head.querySelector('#lp-styles');
      if (s) document.head.removeChild(s);
    };
  }, []);

  const features = [
    {
      num: '01', label: 'Text Recognition',
      title: 'Scan. Instantly searchable.',
      desc: 'Upload any photo of handwritten notes and our OCR engine converts it into editable, searchable digital text with 85–90% accuracy.',
      icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
      color: T.amber, colorDim: T.amberDim,
    },
    {
      num: '02', label: 'AI Summarization',
      title: 'Summaries and flashcards. One click.',
      desc: 'AI generates concise bullet summaries and study flashcards directly from your notes — no manual work required.',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      color: T.amber, colorDim: T.amberDim,
    },
    {
      num: '03', label: 'Organization',
      title: 'Everything in one place.',
      desc: 'Organize notes into folders, star your favorites, export as PDF or TXT, and access everything from one clean dashboard.',
      icon: 'M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
      color: T.amber, colorDim: T.amberDim,
    },
  ];

  const team = [
    { name: 'Brandon Lau',            role: 'Frontend Developer',  linkedin: '' },
    { name: 'Taras Tishchenko',       role: 'Backend Developer',   linkedin: '' },
    { name: 'Yuzhen Kuang',           role: 'OCR Engineer',        linkedin: '' },
    { name: 'Sebastien Roumain-Zala', role: 'OCR Engineer',        linkedin: '' },
  ];

  return (
    <div style={{ minHeight:'100vh', width:'100%', background:T.bg, fontFamily:T.font, color:T.cream, boxSizing:'border-box', overflowX:'hidden' }}>

      {/* Nav */}
      <nav style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 48px', boxSizing:'border-box', animation:'fadeIn .4s ease both', position:'sticky', top:0, background:T.bg, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={15} color="#0E1117" />
          </div>
          <span style={{ fontFamily:T.serif, fontSize:19, color:T.cream }}>NoteScan</span>
        </div>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <button onClick={onSignIn} style={{ padding:'7px 18px', background:'transparent', border:`1px solid ${T.border}`, color:T.cream, borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:T.font, transition:'border-color .2s, background .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.borderHi; e.currentTarget.style.background=T.surfaceHi; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background='transparent'; }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign:'center', padding:'96px 48px 80px' }}>
        <div style={{ animation:'fadeUp .7s ease both' }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 24px', fontFamily:T.font }}>Built for students</p>
          <h1 style={{ fontFamily:T.serif, fontSize:58, fontWeight:400, color:T.cream, margin:'0 0 22px', lineHeight:1.08, letterSpacing:'-1px' }}>
            Your entire study workflow,<br /><em style={{ fontStyle:'italic', color:T.amber }}>in one place.</em>
          </h1>
          <p style={{ fontFamily:T.font, fontSize:16, color:T.muted, margin:'0 auto 36px', lineHeight:1.75, maxWidth:440 }}>
            Upload a photo of your handwritten notes and get searchable text, AI summaries, and flashcards — in seconds.
          </p>
          <button onClick={onStart}
            style={{ padding:'13px 32px', background:T.amber, border:'none', color:'#0E1117', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:T.font, display:'inline-flex', alignItems:'center', gap:8, transition:'opacity .2s, transform .15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; }}>
            <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={16} color="#0E1117" />
            Start Converting
          </button>
        </div>
      </section>

      {/* Statement */}
      <FadeSection style={{ textAlign:'center', padding:'80px 48px' }}>
        <h2 style={{ fontFamily:T.serif, fontSize:38, fontWeight:400, color:T.cream, lineHeight:1.2, maxWidth:560, margin:'0 auto 16px', letterSpacing:'-.5px' }}>
          Students waste hours rewriting notes that could be spent actually studying.
        </h2>
        <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, lineHeight:1.75, maxWidth:380, margin:'0 auto' }}>
          NoteScan combines OCR, AI summarization, and flashcard generation into one seamless workflow.
        </p>
      </FadeSection>

      {/* Demo Video */}
      <FadeSection style={{ padding:'0 0 72px' }}>
        <div style={{ textAlign:'center', padding:'0 48px 40px' }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 14px', fontFamily:T.font }}>See it in action</p>
          <h2 style={{ fontFamily:T.serif, fontSize:34, fontWeight:400, color:T.cream, margin:0, letterSpacing:'-.5px', lineHeight:1.2 }}>From photo to flashcards<br/>in seconds.</h2>
        </div>
        <div style={{ overflow:'hidden', background:T.bg, position:'relative', aspectRatio:'16/9', width:'100%' }}>
          <video
            ref={el => {
              if (!el) return;
              const observer = new IntersectionObserver(
                ([entry]) => {
                  if (entry.isIntersecting) {
                    el.currentTime = 0;
                    el.play();
                  } else {
                    el.pause();
                  }
                },
                { threshold: 0.3 }
              );
              observer.observe(el);
            }}
            src="/demo.mp4"
            loop
            muted
            playsInline
            style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }}
            onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }}
          />
          <div style={{ display:'none', position:'absolute', inset:0, flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, background:T.surface }}>
            <div style={{ width:64, height:64, borderRadius:99, background:T.amberDim, border:`1px solid rgba(245,166,35,.3)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={32} color={T.amber} />
            </div>
            <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:0 }}>Demo video coming soon</p>
          </div>
        </div>
      </FadeSection>

      {/* Features */}
      <div id="features">
        <FadeSection style={{ padding:'56px 48px 32px' }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:0, fontFamily:T.font }}>Features</p>
        </FadeSection>
        {features.map((f, i) => (
          <FadeSection key={i} delay={i * 0.1}>
            <div className="lp-feature-row" style={{ display:'flex', alignItems:'center', gap:48, padding:'48px 48px', transition:'background .2s' }}>
              <div className="lp-feature-num" style={{ fontFamily:T.serif, fontSize:52, fontWeight:400, color:'rgba(245,166,35,0.15)', flexShrink:0, width:72, lineHeight:1, transition:'color .3s' }}>{f.num}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.muted, margin:'0 0 10px', fontFamily:T.font }}>{f.label}</p>
                <h3 style={{ fontFamily:T.serif, fontSize:28, fontWeight:400, color:T.cream, margin:'0 0 10px', lineHeight:1.2 }}>{f.title}</h3>
                <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, lineHeight:1.75, maxWidth:440, margin:0 }}>{f.desc}</p>
              </div>
              <div style={{ width:56, height:56, borderRadius:14, background:f.colorDim, border:`1px solid ${f.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
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
          {[
            { step:'1', title:'Upload', desc:'Take a photo of your handwritten notes and upload it to NoteScan.' },
            { step:'2', title:'OCR processes', desc:'Our engine scans and converts your handwriting into searchable, editable digital text.' },
            { step:'3', title:'Get results', desc:'AI generates a summary, flashcards, and organizes everything in your dashboard.' },
          ].map((s, i) => (
            <div key={i} style={{ padding:'36px 32px' }}>
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
          {[
            { value:'85–90%', label:'OCR Accuracy' },
            { value:'3',      label:'Study Aids' },
            { value:'< 30s',  label:'Average Processing Time' },
          ].map((stat, i) => (
            <div key={i} style={{ padding:'48px 40px', textAlign:'center' }}>
              <p style={{ fontFamily:T.serif, fontSize:44, fontWeight:400, color:T.amber, margin:'0 0 8px', letterSpacing:'-1px', lineHeight:1 }}>{stat.value}</p>
              <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:0, letterSpacing:.5 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* Mid-page CTA */}
      <FadeSection style={{ padding:'80px 48px', textAlign:'center' }}>
        <h2 style={{ fontFamily:T.serif, fontSize:36, fontWeight:400, color:T.cream, margin:'0 0 12px', letterSpacing:'-.5px', lineHeight:1.2 }}>Ready to try it?</h2>
        <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:'0 auto 28px', lineHeight:1.75, maxWidth:360 }}>
          Upload your first note and see the results in under 30 seconds.
        </p>
        <button onClick={onStart}
          style={{ padding:'12px 28px', background:T.amber, border:'none', color:'#0E1117', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:T.font, display:'inline-flex', alignItems:'center', gap:8, transition:'opacity .2s, transform .15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; }}>
          <Icon d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" size={15} color="#0E1117" />
          Start Converting
        </button>
      </FadeSection>

      {/* Testimonials */}
      <FadeSection style={{ padding:'80px 48px' }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 32px', fontFamily:T.font }}>What students say</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
          {[
            { quote:'I went from spending 2 hours rewriting notes to having everything ready in 5 minutes. NoteScan completely changed how I study.', name:'Computer Science Student', school:'San José State University' },
            { quote:"The flashcard generation is incredible. I used to make them by hand — now I just upload a photo and they're done instantly.", name:'Biology Student', school:'San José State University' },
            { quote:'Being able to search my handwritten lecture notes is something I didn\'t know I needed until I tried it.', name:'Engineering Student', school:'San José State University' },
          ].map((t, i) => (
            <div key={i} style={{ padding:'28px 24px', display:'flex', flexDirection:'column', gap:20 }}>
              <p style={{ fontFamily:T.serif, fontSize:15, color:T.cream, lineHeight:1.75, margin:0, fontStyle:'italic' }}>"{t.quote}"</p>
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
            { q:'What file formats are supported?', a:'You can upload JPG, PNG, HEIC, and PDF files. For best results use a well-lit photo with the note filling most of the frame.' },
            { q:'Can I edit the transcribed text?', a:'Yes — after OCR you can edit the transcribed text directly in the results page before saving or exporting.' },
          ].map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </FadeSection>

      {/* About */}
      <div id="about">
        <FadeSection style={{ padding:'80px 48px' }}>
          <div style={{ maxWidth:640 }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 20px', fontFamily:T.font }}>About</p>
            <h2 style={{ fontFamily:T.serif, fontSize:38, fontWeight:400, color:T.cream, lineHeight:1.2, margin:'0 0 20px', letterSpacing:'-.5px' }}>
              A senior capstone project from San José State University.
            </h2>
            <p style={{ fontFamily:T.font, fontSize:15, color:T.muted, lineHeight:1.8, margin:'0 0 14px' }}>
              NoteScan was built as part of CMPE 195B by a team of four computer science students. The goal was to solve a real problem students face every day — the disconnect between handwritten notes and digital study tools.
            </p>
            <p style={{ fontFamily:T.font, fontSize:15, color:T.muted, lineHeight:1.8, margin:0 }}>
              The app combines two OCR engines (PaddleOCR and Chandra), OpenAI-powered summarization, and a React frontend — all deployed and production-ready. Advised by Dr. Magdalini Eirinaki.
            </p>
          </div>
        </FadeSection>

        {/* Team */}
        <FadeSection style={{ padding:'64px 48px' }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 8px', fontFamily:T.font }}>The Team</p>
          <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'0 0 36px' }}>San José State University · CMPE 195B · Spring 2026</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16 }}>
            {team.map((member, i) => (
              <div key={i} className="lp-team-card" style={{ padding:'28px 24px', transition:'border-color .2s', display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ width:52, height:52, borderRadius:99, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:T.serif, fontSize:20, color:T.amber }}>{member.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:T.font, fontSize:15, fontWeight:600, color:T.cream, margin:'0 0 4px' }}>{member.name}</p>
                  <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:'0 0 8px' }}>{member.role}</p>
                  <p style={{ fontFamily:T.font, fontSize:11, color:'rgba(107,118,148,0.5)', margin:0 }}>San José State University</p>
                </div>
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:T.muted, textDecoration:'none', fontFamily:T.font, transition:'color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.color=T.cream}
                    onMouseLeave={e => e.currentTarget.style.color=T.muted}>
                    <Icon d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" size={13} />
                    LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        </FadeSection>
      </div>

      {/* Footer */}
      <div style={{ padding:'24px 48px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontFamily:T.font, fontSize:11, color:'rgba(107,118,148,0.5)', margin:0 }}>© 2026 NoteScan · CMPE 195 Project · San José State University</p>
        <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:`1px solid ${T.border}`, color:T.muted, padding:'6px 14px', borderRadius:99, fontSize:12, cursor:'pointer', fontFamily:T.font, transition:'border-color .2s, color .2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=T.borderHi; e.currentTarget.style.color=T.cream; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}>
          <Icon d="M5 15l7-7 7 7" size={12} />
          Back to top
        </button>
      </div>

    </div>
  );
};

export default LandingPage;
