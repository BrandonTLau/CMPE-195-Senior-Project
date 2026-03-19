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
  font:      '"DM Sans", system-ui, sans-serif',
  serif:     '"DM Serif Display", Georgia, serif',
};

const TAG_PALETTE = [
  { bg: 'rgba(129,140,248,0.15)', text: '#818CF8' },
  { bg: 'rgba(52,211,153,0.15)',  text: '#34D399' },
  { bg: 'rgba(245,166,35,0.15)',  text: '#F5A623' },
  { bg: 'rgba(248,113,113,0.15)', text: '#F87171' },
  { bg: 'rgba(96,165,250,0.15)',  text: '#60A5FA' },
];
const tagColor = (tag) => TAG_PALETTE[tag.charCodeAt(0) % TAG_PALETTE.length];

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const ConfidencePill = ({ score }) => {
  const color = score >= 90 ? { bg: T.greenDim, text: T.green }
              : score >= 80 ? { bg: T.amberDim, text: T.amber }
              : { bg: 'rgba(248,113,113,0.12)', text: '#F87171' };
  return (
    <span style={{ display:'inline-block', fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase',
      padding:'2px 8px', borderRadius:99, background:color.bg, color:color.text, fontFamily:T.font }}>
      {score}%
    </span>
  );
};

const FavoritesPage = ({ notes, onNoteSelect, onRemoveFavorite, onNewScan }) => {
  const [search, setSearch] = useState('');

  const favoriteNotes = notes.filter(n => n.favorite);
  const filtered = favoriteNotes.filter(n => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return n.title.toLowerCase().includes(q) ||
      n.preview.toLowerCase().includes(q) ||
      n.tags.join(' ').toLowerCase().includes(q);
  });

  return (
    <div style={{ fontFamily:T.font, animation:'fadeUp .35s ease both' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.amber, margin:'0 0 6px', fontFamily:T.font }}>Starred</p>
          <h1 style={{ fontFamily:T.serif, fontSize:32, fontWeight:400, color:T.cream, margin:0, lineHeight:1.1 }}>Favorites</h1>
          <p style={{ fontFamily:T.font, fontSize:13, color:T.muted, margin:'6px 0 0' }}>
            {favoriteNotes.length} favorited note{favoriteNotes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={onNewScan}
          style={{ background:T.amber, border:'none', color:'#0E1117', borderRadius:9, padding:'8px 18px',
            fontFamily:T.font, fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6,
            transition:'opacity .2s, transform .15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; }}>
          <Icon d="M12 4v16m8-8H4" size={14} color="#0E1117" /> New Scan
        </button>
      </div>

      {/* Search */}
      <div style={{ display:'flex', alignItems:'center', gap:10, background:T.surface, border:`1px solid ${T.border}`,
        borderRadius:10, padding:'9px 14px', marginBottom:24 }}>
        <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" size={15} color={T.muted} />
        <input type="text" placeholder="Search favorites…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:T.font, fontSize:13, color:T.cream }}  />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex', padding:0 }}>
            <Icon d="M6 18L18 6M6 6l12 12" size={13} />
          </button>
        )}
      </div>

      {/* Empty — no favorites */}
      {favoriteNotes.length === 0 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:12 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:T.surface, border:`1px solid ${T.border}`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={24} color={T.muted} />
          </div>
          <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:0 }}>No favorites yet</p>
          <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0, opacity:.6, textAlign:'center', maxWidth:260 }}>
            Star any note from My Notes to see it here.
          </p>
        </div>
      )}

      {/* Empty — no search results */}
      {favoriteNotes.length > 0 && filtered.length === 0 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 0', gap:8 }}>
          <p style={{ fontFamily:T.font, fontSize:14, color:T.muted, margin:0 }}>No favorites found for "{search}"</p>
        </div>
      )}

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
        {filtered.map(note => (
          <div key={note.id}
            onClick={() => onNoteSelect(note)}
            style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:18,
              display:'flex', flexDirection:'column', gap:12, cursor:'pointer', position:'relative',
              transition:'border-color .2s, box-shadow .2s', animation:'fadeUp .3s ease both' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.borderHi; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.boxShadow='none'; }}>

            {/* Amber star badge */}
            <div style={{ position:'absolute', top:-8, right:14, width:22, height:22, borderRadius:99,
              background:T.amber, display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 2px 8px rgba(245,166,35,.4)' }}>
              <Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={12} color="#0E1117" />
            </div>

            {/* Top row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ width:30, height:30, borderRadius:8, background:T.amberDim,
                border:`1px solid rgba(245,166,35,.2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={14} color={T.amber} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <ConfidencePill score={note.confidence} />
                <button
                  onClick={e => { e.stopPropagation(); onRemoveFavorite(note.id); }}
                  title="Remove from favorites"
                  style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, padding:3, display:'flex',
                    transition:'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color='#F87171'}
                  onMouseLeave={e => e.currentTarget.style.color=T.muted}>
                  <Icon d="M6 18L18 6M6 6l12 12" size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div>
              <p style={{ fontFamily:T.font, fontSize:14, fontWeight:600, color:T.cream, margin:'0 0 6px', lineHeight:1.3 }}>{note.title}</p>
              <p style={{ fontFamily:T.font, fontSize:12, color:T.muted, margin:0, lineHeight:1.6,
                display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{note.preview}</p>
            </div>

            {/* Tags */}
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {note.tags.map(tag => {
                const c = tagColor(tag);
                return (
                  <span key={tag} style={{ display:'inline-block', fontSize:10, fontWeight:700, letterSpacing:1,
                    textTransform:'uppercase', padding:'2px 8px', borderRadius:99, background:c.bg, color:c.text, fontFamily:T.font }}>
                    {tag}
                  </span>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              paddingTop:12, borderTop:`1px solid ${T.border}`, marginTop:'auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:T.font, fontSize:11, color:T.muted }}>
                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={12} />
                {note.date}
              </div>
              <button className="ud-note-open" onClick={e => { e.stopPropagation(); onNoteSelect(note); }}
                style={{ padding:'5px 12px', borderRadius:7, fontSize:12, fontWeight:600, fontFamily:T.font,
                  cursor:'pointer', border:`1px solid ${T.border}`, background:'transparent', color:T.muted,
                  transition:'border-color .15s, color .15s, background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=T.amber; e.currentTarget.style.color=T.amber; e.currentTarget.style.background=T.amberDim; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; e.currentTarget.style.background='transparent'; }}>
                Open →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesPage;
