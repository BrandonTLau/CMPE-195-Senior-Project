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
  red:       '#F87171',
  font:      '"DM Sans", system-ui, sans-serif',
  serif:     '"DM Serif Display", Georgia, serif',
};

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const inputStyle = {
  background: T.surfaceHi, border: `1px solid ${T.border}`, color: T.cream,
  borderRadius: 9, padding: '10px 14px', fontFamily: T.font, fontSize: 14,
  outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .2s',
};

const SignUp = ({ onBack, onSignUpSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: ''
  });
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error,               setError]               = useState('');
  const [isLoading,           setIsLoading]           = useState(false);
  const [isSuccess,           setIsSuccess]           = useState(false);

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
    style.textContent = `
      @keyframes fadeUp      { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
      @keyframes spin        { to   { transform: rotate(360deg) } }
      @keyframes popIn       { 0% { opacity:0; transform:scale(0.5) } 70% { transform:scale(1.15) } 100% { opacity:1; transform:scale(1) } }
      @keyframes slideUpFade { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
      @keyframes drawCheck   { from { stroke-dashoffset: 50 } to { stroke-dashoffset: 0 } }
      @keyframes pulseRing   {
        0%   { transform:scale(0.8); opacity:0.8; }
        50%  { transform:scale(1.3); opacity:0.2; }
        100% { transform:scale(1.6); opacity:0; }
      }
      @keyframes shimmerText {
        0%,100% { opacity:1; }
        50%     { opacity:0.6; }
      }
      @keyframes floatDot {
        0%,100% { transform:translateY(0) scale(1); opacity:0.7; }
        50%     { transform:translateY(-12px) scale(1.2); opacity:1; }
      }
      @keyframes orbitRing {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName.trim())                      { setError('Please enter your full name.');                  return; }
    if (!formData.email.trim())                         { setError('Please enter your email address.');              return; }
    if (formData.password.length < 8)                  { setError('Password must be at least 8 characters long.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.');                      return; }

    setIsLoading(true);
    try {
      const [res] = await Promise.all([
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName,
            email:    formData.email,
            password: formData.password,
          }),
        }),
        new Promise(resolve => setTimeout(resolve, 2000)),
      ]);
      const data = await res.json();
      if (!res.ok) { setError(data?.msg || 'Registration failed.'); return; }

      setIsSuccess(true);
      setTimeout(() => onBack(), 2500);
    } catch (err) {
      setError('Could not connect to server. Is the backend running on port 5000?');
    } finally {
      setIsLoading(false);
    }
  };

  const EyeToggle = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle}
      style={{ position:'absolute', top:'50%', right:12, transform:'translateY(-50%)',
        background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex', padding:0,
        transition:'color .15s' }}
      onMouseEnter={e => e.currentTarget.style.color = T.cream}
      onMouseLeave={e => e.currentTarget.style.color = T.muted}>
      {show ? (
        <Icon d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" size={17} />
      ) : (
        <Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" size={17} />
      )}
    </button>
  );

  // ── Success overlay ───────────────────────────────────────────
  const SuccessOverlay = () => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(14,17,23,0.92)', backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 28,
    }}>
      {/* Floating amber dots — decorative background particles */}
      {[
        { top:'20%', left:'15%', delay:'0s',    size:6  },
        { top:'70%', left:'10%', delay:'0.3s',  size:4  },
        { top:'30%', left:'80%', delay:'0.6s',  size:5  },
        { top:'75%', left:'75%', delay:'0.9s',  size:7  },
        { top:'15%', left:'55%', delay:'0.4s',  size:4  },
        { top:'60%', left:'40%', delay:'1.1s',  size:3  },
      ].map((dot, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: dot.top, left: dot.left,
          width: dot.size, height: dot.size,
          borderRadius: '50%',
          background: T.amber,
          opacity: 0.4,
          animation: `floatDot 2.4s ease-in-out infinite`,
          animationDelay: dot.delay,
        }} />
      ))}

      {/* Orbiting ring */}
      <div style={{
        position: 'absolute',
        width: 180, height: 180,
        borderRadius: '50%',
        border: `1px dashed rgba(245,166,35,0.2)`,
        animation: 'orbitRing 8s linear infinite',
      }}>
        <div style={{
          position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)',
          width: 10, height: 10, borderRadius: '50%',
          background: T.amber, opacity: 0.6,
        }} />
      </div>

      {/* Outer pulse ring */}
      <div style={{
        position: 'absolute',
        width: 120, height: 120, borderRadius: '50%',
        border: `2px solid rgba(245,166,35,0.35)`,
        animation: 'pulseRing 2s ease-out infinite',
      }} />

      {/* Icon container */}
      <div style={{
        position: 'relative',
        width: 80, height: 80, borderRadius: '50%',
        background: T.amberDim,
        border: `1.5px solid rgba(245,166,35,0.5)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'popIn 0.5s cubic-bezier(.34,1.56,.64,1) both',
        boxShadow: `0 0 32px rgba(245,166,35,0.25)`,
      }}>
        {/* Animated checkmark */}
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke={T.amber}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="50"
            strokeDashoffset="50"
            style={{ animation: 'drawCheck 0.45s ease forwards 0.3s' }}
          />
        </svg>
      </div>

      {/* Text block */}
      <div style={{ textAlign: 'center', animation: 'slideUpFade 0.5s ease both 0.2s' }}>
        <p style={{
          fontFamily: T.serif, fontSize: 30, color: T.cream,
          margin: '0 0 10px', letterSpacing: '-.3px',
        }}>
          Account created!
        </p>
        <p style={{
          fontFamily: T.font, fontSize: 14, color: T.muted,
          margin: '0 0 18px', lineHeight: 1.6,
        }}>
          Welcome to NoteScan, {formData.fullName.split(' ')[0]}.
        </p>
        {/* Amber progress bar draining down */}
        <div style={{
          width: 180, height: 3, borderRadius: 99,
          background: 'rgba(255,255,255,0.07)',
          overflow: 'hidden', margin: '0 auto',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${T.amber}, rgba(245,166,35,0.4))`,
            width: '100%',
            animation: 'shrinkBar 2.4s linear forwards',
          }} />
        </div>
        <p style={{
          fontFamily: T.font, fontSize: 12, color: T.muted,
          margin: '10px 0 0', opacity: 0.6,
          animation: 'shimmerText 1.5s ease-in-out infinite',
        }}>
          Redirecting you to sign in…
        </p>
      </div>

     
      <style>{`
        @keyframes shrinkBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', width:'100%', overflow:'hidden', fontFamily:T.font, background:T.bg }}>

      {/* ── Loading overlay ── */}
      {isLoading && !isSuccess && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(14,17,23,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <svg width={48} height={48} viewBox="0 0 48 48" fill="none"
            style={{ animation: 'spin 0.85s linear infinite' }}>
            <circle cx={24} cy={24} r={20} stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
            <path d="M24 4a20 20 0 0 1 20 20" stroke={T.amber} strokeWidth={4} strokeLinecap="round" />
          </svg>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: T.serif, fontSize: 22, color: T.cream, margin: '0 0 6px' }}>
              Creating your account…
            </p>
            <p style={{ fontFamily: T.font, fontSize: 13, color: T.muted, margin: 0 }}>
              This will only take a moment
            </p>
          </div>
        </div>
      )}

      {/* ── Success overlay ── */}
      {isSuccess && <SuccessOverlay />}

      {/* ── Left branding panel ── */}
      <div style={{ flex:1, background:T.surface, borderRight:`1px solid ${T.border}`, padding:'48px',
        display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(245,166,35,0.06) 0%, transparent 70%)' }} />
        <div style={{ maxWidth:420, position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:48 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={18} color="#0E1117" />
            </div>
            <span style={{ fontFamily:T.serif, fontSize:22, color:T.cream }}>NoteScan</span>
          </div>
          <h1 style={{ fontFamily:T.serif, fontSize:40, fontWeight:400, color:T.cream, margin:'0 0 16px', lineHeight:1.15, letterSpacing:'-.4px' }}>
            Join NoteScan<br /><span style={{ color:T.amber }}>Today</span>
          </h1>
          <p style={{ fontFamily:T.font, fontSize:15, color:T.muted, lineHeight:1.7, margin:'0 0 40px' }}>
            Create your account and start converting handwritten notes to digital text instantly.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'48px', overflowY:'auto', position:'relative' }}>

        <button onClick={onBack}
          style={{ position:'absolute', top:24, left:24, background:'transparent', border:`1px solid ${T.border}`,
            color:T.muted, borderRadius:8, padding:'6px 14px', fontFamily:T.font, fontSize:13, fontWeight:500,
            cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, transition:'color .15s, border-color .15s' }}
          onMouseEnter={e => { e.currentTarget.style.color=T.cream; e.currentTarget.style.borderColor=T.borderHi; }}
          onMouseLeave={e => { e.currentTarget.style.color=T.muted; e.currentTarget.style.borderColor=T.border; }}>
          <Icon d="M15 19l-7-7 7-7" size={13} /> Back
        </button>

        <div style={{ width:'100%', maxWidth:400, animation:'fadeUp .4s ease both' }}>
          <div style={{ marginBottom:28, textAlign:'center' }}>
            <h2 style={{ fontFamily:T.serif, fontSize:30, fontWeight:400, color:T.cream, margin:'0 0 8px' }}>Create your account</h2>
            <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:0 }}>Get started with NoteScan today</p>
          </div>

          <form style={{ display:'flex', flexDirection:'column', gap:16 }} onSubmit={handleSignUp}>

            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontFamily:T.font, fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', color:T.muted }}>Full name</label>
              <input type="text" name="fullName" placeholder="John Doe"
                value={formData.fullName} onChange={handleInputChange} required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.amber}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontFamily:T.font, fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', color:T.muted }}>Email address</label>
              <input type="email" name="email" placeholder="you@example.com"
                value={formData.email} onChange={handleInputChange} required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.amber}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontFamily:T.font, fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', color:T.muted }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Create a password"
                  value={formData.password} onChange={handleInputChange} required
                  style={{ ...inputStyle, paddingRight:42 }}
                  onFocus={e => e.target.style.borderColor = T.amber}
                  onBlur={e => e.target.style.borderColor = T.border} />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword(v => !v)} />
              </div>
              <p style={{ fontFamily:T.font, fontSize:11, color:T.muted, margin:0 }}>Must be at least 8 characters</p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontFamily:T.font, fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', color:T.muted }}>Confirm password</label>
              <div style={{ position:'relative' }}>
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Re-enter your password"
                  value={formData.confirmPassword} onChange={handleInputChange} required
                  style={{ ...inputStyle, paddingRight:42 }}
                  onFocus={e => e.target.style.borderColor = T.amber}
                  onBlur={e => e.target.style.borderColor = T.border} />
                <EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} />
              </div>
            </div>

            {error && (
              <div style={{ background:'rgba(248,113,113,0.1)', border:`1px solid rgba(248,113,113,.25)`,
                borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                <Icon d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={15} color={T.red} />
                <span style={{ fontFamily:T.font, fontSize:13, color:T.red }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={isLoading || isSuccess}
              style={{ background:T.amber, border:'none', color:'#0E1117', borderRadius:10, padding:'12px',
                fontFamily:T.font, fontSize:14, fontWeight:700,
                cursor: (isLoading || isSuccess) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || isSuccess) ? 0.6 : 1, width:'100%',
                transition:'opacity .2s, transform .15s', marginTop:4 }}
              onMouseEnter={e => { if (!isLoading && !isSuccess) { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-1px)'; }}}
              onMouseLeave={e => { e.currentTarget.style.opacity= (isLoading || isSuccess) ? '0.6' : '1'; e.currentTarget.style.transform='none'; }}>
              Create account
            </button>
          </form>

          <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, textAlign:'center', marginTop:24 }}>
            Already have an account?{' '}
            <span onClick={onBack} style={{ color:T.amber, fontWeight:600, cursor:'pointer' }}>
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
