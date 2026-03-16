import React, { useState, useEffect } from 'react';

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
  red:       '#F87171',
  font:      '"DM Sans", system-ui, sans-serif',
  serif:     '"DM Serif Display", Georgia, serif',
};

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const LoginPage = ({ onBack, onLoginSuccess, onGoToSignUp }) => {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [rememberMe,   setRememberMe]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');

  // mock login
  const MOCK_EMAIL    = 'test@example.com';
  const MOCK_PASSWORD = 'password123';

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

    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `@keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }`;
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

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      setError('');
      onLoginSuccess();
    } else {
      setError('Invalid email or password.');
    }
  };

  // replaced the mock login
  // now posts to localhost:5000/api/auth/login
  // async request -> store returned JWT token
  /*const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.msg || "Login failed.");
        return;
      }

      // returns { token } from backend
      if (data?.token) {
        if (rememberMe) {
          localStorage.setItem("token", data.token);
        } else {
          sessionStorage.setItem("token", data.token);
        }
      }

      onLoginSuccess(); 
    } catch (err) {
      setError("Failed ot connect to server. Verify that it's running.");
    }
  };*/

  return (
    <div style={{ display:'flex', minHeight:'100vh', width:'100%', overflow:'hidden', fontFamily:T.font, background:T.bg }}>

      {/* ── Left branding panel ── */}
      <div style={{ flex:1, background:T.surface, borderRight:`1px solid ${T.border}`, padding:'48px',
        display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column',
        position:'relative', overflow:'hidden' }}>

        {/* Background glow */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(245,166,35,0.06) 0%, transparent 70%)' }} />

        <div style={{ maxWidth:420, position:'relative', zIndex:1 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:48 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={18} color="#0E1117" />
            </div>
            <span style={{ fontFamily:T.serif, fontSize:22, color:T.cream }}>NoteScan</span>
          </div>

          <h1 style={{ fontFamily:T.serif, fontSize:40, fontWeight:400, color:T.cream, margin:'0 0 16px', lineHeight:1.15, letterSpacing:'-.4px' }}>
            Transform Your<br /><span style={{ color:T.amber }}>Handwritten Notes</span>
          </h1>
          <p style={{ fontFamily:T.font, fontSize:15, color:T.muted, lineHeight:1.7, margin:'0 0 40px' }}>
            Convert handwritten notes to digital text with AI-powered OCR technology.
          </p>

          {/* Feature pills */}
          {[
            { icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label:'85–90% OCR accuracy' },
            { icon:'M13 10V3L4 14h7v7l9-11h-7z',                      label:'AI-generated summaries' },
            { icon:'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label:'Auto-generated flashcards' },
          ].map(f => (
            <div key={f.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon d={f.icon} size={13} color={T.amber} />
              </div>
              <span style={{ fontFamily:T.font, fontSize:13, color:T.muted }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'48px', overflowY:'auto', position:'relative' }}>

        {/* Back button */}
        <button onClick={onBack}
          style={{ position:'absolute', top:24, left:24, background:'transparent', border:`1px solid ${T.border}`,
            color:T.muted, borderRadius:8, padding:'6px 14px', fontFamily:T.font, fontSize:13, fontWeight:500,
            cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, transition:'color .15s, border-color .15s' }}
          onMouseEnter={e => { e.currentTarget.style.color=T.cream; e.currentTarget.style.borderColor=T.borderHi; }}
          onMouseLeave={e => { e.currentTarget.style.color=T.muted; e.currentTarget.style.borderColor=T.border; }}>
          <Icon d="M15 19l-7-7 7-7" size={13} /> Back
        </button>

        <div style={{ width:'100%', maxWidth:400, animation:'fadeUp .4s ease both' }}>
          {/* Header */}
          <div style={{ marginBottom:32, textAlign:'center' }}>
            <h2 style={{ fontFamily:T.serif, fontSize:30, fontWeight:400, color:T.cream, margin:'0 0 8px' }}>Welcome back</h2>
            <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:0 }}>Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form style={{ display:'flex', flexDirection:'column', gap:18 }} onSubmit={handleLogin}>

            {/* Email */}
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontFamily:T.font, fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', color:T.muted }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, color:T.cream, borderRadius:9,
                  padding:'10px 14px', fontFamily:T.font, fontSize:14, outline:'none', width:'100%', boxSizing:'border-box',
                  transition:'border-color .2s' }}
                onFocus={e => e.target.style.borderColor = T.amber}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>

            {/* Password */}
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontFamily:T.font, fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', color:T.muted }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, color:T.cream, borderRadius:9,
                    padding:'10px 42px 10px 14px', fontFamily:T.font, fontSize:14, outline:'none',
                    width:'100%', boxSizing:'border-box', transition:'border-color .2s' }}
                  onFocus={e => e.target.style.borderColor = T.amber}
                  onBlur={e => e.target.style.borderColor = T.border} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position:'absolute', top:'50%', right:12, transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex', padding:0,
                    transition:'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = T.cream}
                  onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                  {showPassword ? (
                    <Icon d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" size={17} />
                  ) : (
                    <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Options */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:T.font, fontSize:13, color:T.muted }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  style={{ width:15, height:15, accentColor:T.amber }} />
                Remember me
              </label>
              <a href="#" style={{ fontFamily:T.font, fontSize:13, color:T.amber, textDecoration:'none', fontWeight:500 }}>
                Forgot password?
              </a>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background:'rgba(248,113,113,0.1)', border:`1px solid rgba(248,113,113,.25)`, borderRadius:8,
                padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                <Icon d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={15} color={T.red} />
                <span style={{ fontFamily:T.font, fontSize:13, color:T.red }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit"
              style={{ background:T.amber, border:'none', color:'#0E1117', borderRadius:10, padding:'12px',
                fontFamily:T.font, fontSize:14, fontWeight:700, cursor:'pointer', width:'100%',
                transition:'opacity .2s, transform .15s', marginTop:4 }}
              onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; }}>
              Sign in
            </button>
          </form>

          {/* Sign up */}
          <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, textAlign:'center', marginTop:24 }}>
            Don't have an account?{' '}
            <span onClick={onGoToSignUp}
              style={{ color:T.amber, fontWeight:600, cursor:'pointer', textDecoration:'none' }}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
