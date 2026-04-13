import React, { useState } from "react";

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
  redDim:    'rgba(248,113,113,0.12)',
  font:      '"DM Sans", system-ui, sans-serif',
  serif:     '"DM Serif Display", Georgia, serif',
};

const groupLabelStyle = {
  fontFamily:    '"DM Sans", system-ui, sans-serif',
  fontSize:      9,
  fontWeight:    700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color:         '#6B7694',
  opacity:       0.7,
  margin:        '20px 0 8px',
  paddingLeft:   2,
  display:       'block',
};

const Icon = ({ d, size = 16, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} fill={fill} stroke={color} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const SettingsPage = ({ notes, folders, onLogout, api }) => {
  const [pwForm,        setPwForm]        = useState({ current: '', next: '', confirm: '' });
  const [pwError,       setPwError]       = useState('');
  const [pwSuccess,     setPwSuccess]     = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError,   setDeleteError]   = useState('');

  //user info
  const getUserInfo = () => {
    const ssName  = sessionStorage.getItem('userName')  || '';
    const ssEmail = sessionStorage.getItem('userEmail') || '';
    if (ssName || ssEmail) return { name: ssName, email: ssEmail };
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          name:  payload.user?.name  || payload.name  || '',
          email: payload.user?.email || payload.email || '',
        };
      }
    } catch {}
    return { name: '', email: '' };
  };

  const { name: userName, email: userEmail } = getUserInfo();
  const displayName = userName || userEmail || 'NoteScan User';
  const initials    = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'NS';

  //stats
  const activeNotes   = notes.filter(n => !n.deleted);
  const favoriteNotes = activeNotes.filter(n => n.favorite);
  const trashedNotes  = notes.filter(n => n.deleted);

  const stats = [
    { label: 'Notes',     value: activeNotes.length,   color: T.cream },
    { label: 'Favorites', value: favoriteNotes.length,  color: T.cream },
    { label: 'Folders',   value: folders.length,        color: T.cream },
    { label: 'Trash',     value: trashedNotes.length,   color: trashedNotes.length > 0 ? T.red : T.cream },
  ];

  //password change
  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.current.trim())         { setPwError('Please enter your current password.'); return; }
    if (pwForm.next.length < 8)         { setPwError('New password must be at least 8 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match.'); return; }
    try {
      await api.changePassword(pwForm.current, pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwError(err.message || 'Failed to update password.');
    }
  };

  //delete account
  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteConfirm !== 'DELETE') { setDeleteError('Please type DELETE to confirm.'); return; }
    try {
      await api.deleteAccount();
    } catch (err) {
      console.warn('Delete account error:', err.message);
    }
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    onLogout();
  };

  
  const sectionStyle = {
    background:   T.surface,
    border:       `1px solid ${T.border}`,
    borderRadius: 14,
    overflow:     'hidden',
    marginBottom: 12,
  };
  const sectionHeaderStyle = {
    padding:      '14px 20px',
    borderBottom: `1px solid ${T.border}`,
    display:      'flex',
    alignItems:   'center',
    gap:          10,
  };
  const sectionBodyStyle = {
    padding:       '18px 20px',
    display:       'flex',
    flexDirection: 'column',
    gap:           12,
  };
  const labelStyle = {
    display:       'block',
    fontSize:      10,
    fontWeight:    700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color:         T.muted,
    marginBottom:  6,
    fontFamily:    T.font,
  };

  return (
    <div style={{ animation: 'fadeUp .35s ease both' }}>

      
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: T.font, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: T.amber, margin: '0 0 6px' }}>Account</p>
        <h1 style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 400, color: T.cream, margin: 0, lineHeight: 1.1 }}>Settings</h1>
      </div>

      
      <div style={{ ...sectionStyle, marginBottom: 12 }}>

        {/* Profile row */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.amberDim, border: `2px solid rgba(245,166,35,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.serif, fontSize: 20, color: T.amber }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: T.serif, fontSize: 17, color: T.cream, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
            {userEmail && (
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</p>
            )}
          </div>
          <button
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'transparent', border: `1px solid rgba(245,166,35,0.25)`, color: T.amber, borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font, flexShrink: 0, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.amberDim; e.currentTarget.style.borderColor = 'rgba(245,166,35,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(245,166,35,0.25)'; }}
          >
            Log out
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', borderTop: `1px solid ${T.border}` }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: i < stats.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ display: 'block', fontFamily: T.font, fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
              <span style={{ display: 'block', fontFamily: T.font, fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginTop: 4 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      
      <span style={groupLabelStyle}>Security</span>

      {/*Change Password*/}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.cream }}>Change password</span>
        </div>
        <div style={sectionBodyStyle}>
          {pwSuccess ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.greenDim, border: `1px solid rgba(52,211,153,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d="M5 13l4 4L19 7" size={15} color={T.green} />
              </div>
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.green, margin: 0, fontWeight: 600 }}>Password updated successfully!</p>
              <button className="ud-btn-ghost" onClick={() => setPwSuccess(false)} style={{ marginLeft: 'auto' }}>Change again</button>
            </div>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Current password</label>
                <input type="password" className="ud-input" placeholder="Enter current password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>New password</label>
                  <input type="password" className="ud-input" placeholder="Min 8 characters" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Confirm password</label>
                  <input type="password" className="ud-input" placeholder="Re-enter new password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
                </div>
              </div>
              {pwError && (
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.red, margin: 0, padding: '8px 12px', background: T.redDim, borderRadius: 8, border: `1px solid rgba(248,113,113,0.25)` }}>{pwError}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="ud-btn-amber" onClick={handleChangePassword}>
                  <Icon d="M5 13l4 4L19 7" size={13} color="#0E1117" /> Update password
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      
      <span style={groupLabelStyle}>Account Removal</span>

      {/*Delete Account Styling*/}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px', borderRadius: 14, border: `1px solid rgba(248,113,113,0.15)`, background: 'rgba(248,113,113,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.cream, margin: '0 0 3px' }}>Delete account</p>
            <p style={{ fontFamily: T.font, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.5 }}>Permanently removes your account, notes, and all associated data. This cannot be undone.</p>
          </div>
          {!showDelete && (
            <button
              onClick={() => setShowDelete(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid rgba(248,113,113,0.35)`, color: T.red, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = T.redDim; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={13} color={T.red} />
              Delete account
            </button>
          )}
        </div>

        {/*Delete Account Expansion*/}
        {showDelete && (
          <div style={{ borderTop: `1px solid rgba(248,113,113,0.15)`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ ...labelStyle, color: T.muted }}>
                Type <span style={{ color: T.red, fontFamily: 'monospace' }}>DELETE</span> to confirm
              </label>
              <input
                className="ud-input danger"
                placeholder="DELETE"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                style={{ borderColor: deleteConfirm.length > 0 && deleteConfirm !== 'DELETE' ? 'rgba(248,113,113,0.5)' : undefined }}
                autoFocus
              />
            </div>
            {deleteError && (
              <p style={{ fontFamily: T.font, fontSize: 12, color: T.red, margin: 0, padding: '8px 12px', background: T.redDim, borderRadius: 8, border: `1px solid rgba(248,113,113,0.25)` }}>{deleteError}</p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="ud-btn-ghost" onClick={() => { setShowDelete(false); setDeleteConfirm(''); setDeleteError(''); }}>Cancel</button>
              <button
                className="ud-btn-red"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE'}
                style={{ opacity: deleteConfirm !== 'DELETE' ? 0.4 : 1 }}
              >
                <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={13} color="#0E1117" />
                Confirm delete
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SettingsPage;
