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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // COMMENTED OUT INITIAL SIGNUP HANDLER; MODIFIED VERSION BELOW
  /* const handleSignUp = (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Mock success
    onSignUpSuccess();
  }; */

  // MODIFIED SIGNUP HANDLER: NOW TALKS TO BACKEND
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!formData.email.trim()) { setError('Please enter your email address.'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email:    formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.msg || 'Registration failed.'); return; }
      if (data?.token) sessionStorage.setItem('token', data.token);
      onSignUpSuccess();
    } catch (err) {
      setError('Could not connect to server. Is the backend running on port 5000?');
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

  return (
    <div style={{ display:'flex', minHeight:'100vh', width:'100%', overflow:'hidden', fontFamily:T.font, background:T.bg }}>

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
          <div style={{ marginBottom:28, textAlign:'center' }}>
            <h2 style={{ fontFamily:T.serif, fontSize:30, fontWeight:400, color:T.cream, margin:'0 0 8px' }}>Create your account</h2>
            <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:0 }}>Get started with NoteScan today</p>
          </div>

          <form style={{ display:'flex', flexDirection:'column', gap:16 }} onSubmit={handleSignUp}>

            {/* Full Name */}
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontFamily:T.font, fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', color:T.muted }}>Full name</label>
              <input type="text" name="fullName" placeholder="John Doe"
                value={formData.fullName} onChange={handleInputChange} required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.amber}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>

            {/* Email */}
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <label style={{ fontFamily:T.font, fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', color:T.muted }}>Email address</label>
              <input type="email" name="email" placeholder="you@example.com"
                value={formData.email} onChange={handleInputChange} required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.amber}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>

            {/* Password */}
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

            {/* Confirm Password */}
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

            {/* Error */}
            {error && (
              <div style={{ background:'rgba(248,113,113,0.1)', border:`1px solid rgba(248,113,113,.25)`,
                borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
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
              Create account
            </button>
          </form>

          {/* Sign in link */}
          <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, textAlign:'center', marginTop:24 }}>
            Already have an account?{' '}
            <span onClick={onBack}
              style={{ color:T.amber, fontWeight:600, cursor:'pointer' }}>
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
