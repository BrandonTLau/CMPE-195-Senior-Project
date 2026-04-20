import React, { useState, useEffect } from 'react';

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
styleEl.id = 'login-styles';
styleEl.textContent = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

  .lg-input {
    width: 100%; box-sizing: border-box;
    background: ${T.surfaceHi}; border: 1px solid ${T.border};
    color: ${T.cream}; border-radius: 10px; padding: 11px 14px;
    font-family: ${T.font}; font-size: 14px; outline: none;
    transition: border-color .2s;
  }
  .lg-input:focus { border-color: ${T.amber}; }
  .lg-input::placeholder { color: ${T.muted}; }

  .lg-submit {
    width: 100%; padding: 13px 20px;
    background: ${T.amber}; color: #0E1117;
    border: none; border-radius: 10px;
    font-size: 14px; font-weight: 700; font-family: ${T.font};
    cursor: pointer; transition: opacity .2s, transform .15s;
    box-shadow: 0 4px 20px rgba(245,166,35,.25);
  }
  .lg-submit:hover { opacity: .88; transform: translateY(-1px); }

  .lg-btn-ghost {
    background: transparent; border: 1px solid ${T.border}; color: ${T.muted};
    border-radius: 8px; padding: 6px 14px; font-family: ${T.font}; font-size: 12px;
    font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
    transition: border-color .2s, color .2s, background .2s;
  }
  .lg-btn-ghost:hover { border-color: ${T.borderHi}; color: ${T.cream}; background: ${T.surfaceHi}; }

  .lg-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: ${T.muted};
    display: flex; padding: 0; transition: color .15s;
  }
  .lg-eye:hover { color: ${T.cream}; }

  .lg-check {
    width: 15px; height: 15px; accent-color: ${T.amber}; cursor: pointer; flex-shrink: 0;
  }

  .lg-feature {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; border-radius: 12px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  }
`;
if (!document.head.querySelector('#login-styles')) {
  document.head.appendChild(styleEl);
}

const Icon = ({ d, size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

// ── component ────────────────────────────────────────────────
const LoginPage = ({ onBack, onLoginSuccess, onGoToSignUp }) => {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [rememberMe,   setRememberMe]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

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

    return () => {
      body.style.margin  = prevBodyMargin;
      body.style.padding = prevBodyPadding;
      html.style.margin  = prevHtmlMargin;
      html.style.padding = prevHtmlPadding;
    };
  }, []);

  // --------------------------------------------------------------
  // ---------------- MOCK LOGIN || NO BACKEND --------------------
  // --------------------------------------------------------------

  /* const MOCK_EMAIL = "test@example.com";
  const MOCK_PASSWORD = "password123"; */

  // ______________________________________________________________


  // --------------------------------------------------------------
  // ---------------- MOCK LOGIN || NO BACKEND --------------------
  // --------------------------------------------------------------

  /* const handleLogin = (e) => {
    e.preventDefault();

    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      setError("");
      onLoginSuccess();
    } else {
      setError("Invalid email or password.");
    }
  }; */

  // ______________________________________________________________


  // --------------------------------------------------------------
  // ----------------- LOGIN CALL TO BACKEND ----------------------
  // --------------------------------------------------------------

  // now posts to localhost:5000/api/auth/login
  // async request -> store returned JWT token
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.msg || 'Login failed.');
        return;
      }

      // returns { token } from backend
      if (data?.token) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        if (rememberMe) { localStorage.setItem('token', data.token); 
        } else { sessionStorage.setItem('token', data.token); }
         //sessionStorage.setItem('userEmail', email);
      }

      if (data?.user) { 
        sessionStorage.setItem('userName', data.user.fullName || '');
        sessionStorage.setItem('userEmail', data.user.email || '');
      }

      onLoginSuccess();
    } catch (err) {
      setError('SERVER CONNECTION ERROR. WAS MOCK LOGIN DISABLED? IS SERVER ON?');
    } finally {
      setLoading(false);
    }
  };

  // ______________________________________________________________

  const features = [
    { icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label:'AI-powered OCR',   sub:'Accurate text recognition'      },
    { icon:'M13 10V3L4 14h7v7l9-11h-7z',                                                                                               label:'Instant summaries', sub:'AI-generated study aids'        },
    { icon:'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label:'Flashcard creator', sub:'Build and study your own cards' },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', width:'100%', overflow:'hidden', fontFamily:T.font }}>

      {/* ── Left branding panel ── */}
      <div style={{ flex:1, background:`linear-gradient(145deg, #0E1117 0%, #161B27 50%, #1a1f35 100%)`, padding:'48px 52px', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden' }}>

        {/* Background glow */}
        <div style={{ position:'absolute', top:-100, left:-100, width:400, height:400, borderRadius:'50%', background:'rgba(245,166,35,0.06)', filter:'blur(80px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-50, right:-50, width:300, height:300, borderRadius:'50%', background:'rgba(129,140,248,0.06)', filter:'blur(60px)', pointerEvents:'none' }} />

        <div style={{ position:'relative', animation:'fadeUp .5s ease both' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:56 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={18} color="#0E1117" />
            </div>
            <span style={{ fontFamily:T.serif, fontSize:22, color:T.cream }}>NoteScan</span>
          </div>

          {/* Headline */}
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 14px' }}>Welcome Back</p>
          <h1 style={{ fontFamily:T.serif, fontSize:42, fontWeight:400, color:T.cream, margin:'0 0 16px', lineHeight:1.1, letterSpacing:'-.5px' }}>
            Transform Your<br/>Handwritten Notes
          </h1>
          <p style={{ fontSize:15, color:T.muted, margin:'0 0 48px', lineHeight:1.7, maxWidth:340 }}>
            Convert handwritten notes to digital text with AI-powered OCR technology.
          </p>

          {/* Features */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {features.map((f, i) => (
              <div key={i} className="lg-feature">
                <div style={{ width:36, height:36, borderRadius:9, background:T.amberDim, border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon d={f.icon} size={16} color={T.amber} />
                </div>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.cream }}>{f.label}</p>
                  <p style={{ margin:0, fontSize:12, color:T.muted }}>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex:1, background:T.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 52px', position:'relative', overflowY:'auto' }}>

        {/* Back button */}
        {onBack && (
          <div style={{ position:'absolute', top:24, left:24 }}>
            <button className="lg-btn-ghost" onClick={onBack}>
              <Icon d="M15 19l-7-7 7-7" size={13} /> Back
            </button>
          </div>
        )}

        <div style={{ width:'100%', maxWidth:400, animation:'fadeUp .4s ease both' }}>

          {/* Header */}
          <div style={{ marginBottom:32 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 10px' }}>Sign In</p>
            <h2 style={{ fontFamily:T.serif, fontSize:32, fontWeight:400, color:T.cream, margin:'0 0 8px', lineHeight:1.1 }}>Welcome back</h2>
            <p style={{ fontSize:14, color:T.muted, margin:0 }}>Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:18 }}>

            {/* Email */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:T.muted, marginBottom:8, fontFamily:T.font }}>Email address</label>
              <input className="lg-input" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {/* Password */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:T.muted, marginBottom:8, fontFamily:T.font }}>Password</label>
              <div style={{ position:'relative' }}>
                <input className="lg-input" type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password" style={{ paddingRight:42 }}
                  value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="lg-eye" onClick={() => setShowPassword(v => !v)}>
                  {showPassword
                    ? <Icon d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" size={16} />
                    : <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" size={16} />
                  }
                </button>
              </div>
            </div>

            {/* Options */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:T.muted, fontFamily:T.font }}>
                <input type="checkbox" className="lg-check" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                Remember me
              </label>
              <a href="#" style={{ fontSize:13, color:T.amber, textDecoration:'none', fontWeight:500, fontFamily:T.font }}>Forgot password?</a>
            </div>

            {/* Error message */}
            {error && (
              <div style={{ padding:'10px 14px', background:T.redDim, border:`1px solid rgba(248,113,113,.2)`, borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
                <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={15} color={T.red} />
                <span style={{ fontSize:13, color:T.red, fontWeight:500, fontFamily:T.font }}>{error}</span>
              </div>
            )}

            {/* Sign in button */}
            <button type="submit" className="lg-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Sign up link */}
          <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:T.muted, fontFamily:T.font }}>
            Don't have an account?{' '}
            <span style={{ color:T.amber, fontWeight:600, cursor:'pointer' }} onClick={onGoToSignUp}>
              Sign up
            </span>
          </p>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
