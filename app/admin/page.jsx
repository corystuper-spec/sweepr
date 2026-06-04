'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const C = {
  bg: '#080A0C', surface: '#101316', surfaceUp: '#181C20',
  accent: '#5BD6A6', accentDim: 'rgba(91,214,166,0.12)', accentGlow: 'rgba(91,214,166,0.25)',
  border: 'rgba(255,255,255,0.07)', text: '#F3F4F2', muted: '#8A8F96',
  error: '#FF6B6B', warning: '#FFAA32', success: '#5BD6A6',
};

const s = {
  page:  { background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" },
  logo:  { fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 20, color: C.text, textDecoration: 'none' },
  card:  { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  stat:  { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px' },
  th:    { padding: '12px 14px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: C.surfaceUp, whiteSpace: 'nowrap' },
  td:    { padding: '12px 14px', fontSize: 14, borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle', whiteSpace: 'nowrap' },
  btn:   (v) => ({ height: 34, borderRadius: 8, border: v === 'danger' ? `1px solid rgba(255,107,107,0.4)` : v === 'primary' ? 'none' : `1px solid ${C.border}`, background: v === 'primary' ? C.accent : v === 'danger' ? 'rgba(255,107,107,0.1)' : C.surfaceUp, color: v === 'primary' ? '#080A0C' : v === 'danger' ? C.error : C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '0 12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }),
};

function statusPill(status, map) {
  const [color, bg, label] = map[status] || [C.muted, C.surfaceUp, status];
  return <span style={{ padding: '3px 10px', borderRadius: 100, background: bg, color, fontSize: 11, fontWeight: 700 }}>{label}</span>;
}

const APP_STATUS_MAP = {
  pending:  [C.warning, 'rgba(255,170,50,0.12)', 'Pending'],
  approved: [C.accent,  C.accentDim,             'Approved'],
  rejected: [C.error,   'rgba(255,107,107,0.12)', 'Rejected'],
};

const BOOKING_STATUS_MAP = {
  pending_match: [C.warning, 'rgba(255,170,50,0.12)', 'Matching'],
  matched:       [C.accent,  C.accentDim,             'Matched'],
  in_progress:   ['#64A0FF', 'rgba(100,160,255,0.12)','In progress'],
  completed:     ['#64C864', 'rgba(100,200,100,0.12)', 'Completed'],
  cancelled:     [C.error,   'rgba(255,107,107,0.12)', 'Cancelled'],
};

// ── Overview ──────────────────────────────────────────────────────
function Overview({ stats }) {
  const isMobile = useIsMobile();
  if (!stats) return <div style={{ color: C.muted }}>Loading stats…</div>;
  const cards = [
    { label: 'Total bookings',      num: stats.bookings.total,               sub: `${stats.bookings.completed} completed · ${stats.bookings.pending_match} matching` },
    { label: 'Platform revenue',    num: `$${stats.revenue.platform_revenue.toLocaleString()}`, sub: `$${stats.revenue.total_gmv.toLocaleString()} total GMV` },
    { label: 'Active cleaners',     num: stats.cleaners.active,              sub: `${stats.cleaners.total} total · ${stats.cleaners.pending} pending bg check` },
    { label: 'Pending applications',num: stats.applications.pending,         sub: `${stats.applications.total} total · ${stats.applications.approved} approved` },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {cards.map(c => (
          <div key={c.label} style={s.stat}>
            <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 30, color: C.accent, lineHeight: 1, marginBottom: 6 }}>{c.num}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <div style={s.card}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>Booking breakdown</div>
          {Object.entries(stats.bookings).filter(([k]) => k !== 'total').map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 18px', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
              <span style={{ color: C.muted, textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={s.card}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>Cleaner breakdown</div>
          {Object.entries(stats.cleaners).filter(([k]) => k !== 'total').map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 18px', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
              <span style={{ color: C.muted, textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Applications ──────────────────────────────────────────────────
function Applications() {
  const isMobile = useIsMobile();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [busy, setBusy] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetch('/api/admin/applications').then(r => r.json()).then(d => { setApps(d.applications || []); setLoading(false); }); }, []);

  async function updateStatus(id, status) {
    setBusy(b => ({ ...b, [id]: true }));
    await fetch(`/api/admin/applications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setBusy(b => ({ ...b, [id]: false }));
  }

  const filtered = apps.filter(a => filter === 'all' || a.status === filter);

  if (loading) return <div style={{ color: C.muted }}>Loading applications…</div>;

  return (
    <div>
      {/* Filter pills — scrollable on mobile */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 4, width: 'max-content' }}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${filter === f ? C.accent : C.border}`,
              background: filter === f ? C.accentDim : 'transparent', color: filter === f ? C.accent : C.muted,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
              whiteSpace: 'nowrap',
            }}>
              {f} {f !== 'all' && `(${apps.filter(a => a.status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...s.card, padding: '40px', textAlign: 'center', color: C.muted }}>No {filter} applications.</div>
      ) : (
        <div style={s.card}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Applied', 'Status', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => (
                  <>
                    <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                      <td style={s.td}><span style={{ fontWeight: 600 }}>{app.first_name} {app.last_name}</span></td>
                      <td style={{ ...s.td, color: C.muted }}>{app.email}</td>
                      <td style={{ ...s.td, color: C.muted }}>{new Date(app.created_at).toLocaleDateString()}</td>
                      <td style={s.td}>{statusPill(app.status, APP_STATUS_MAP)}</td>
                      <td style={s.td}>
                        {app.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                            <button style={s.btn('primary')} onClick={() => updateStatus(app.id, 'approved')} disabled={busy[app.id]}>Approve</button>
                            <button style={s.btn('danger')} onClick={() => updateStatus(app.id, 'rejected')} disabled={busy[app.id]}>Reject</button>
                          </div>
                        )}
                        {app.status !== 'pending' && (
                          <button style={s.btn('secondary')} onClick={e => { e.stopPropagation(); updateStatus(app.id, 'pending'); }}>Reset</button>
                        )}
                      </td>
                    </tr>
                    {expanded === app.id && (
                      <tr key={`${app.id}-detail`}>
                        <td colSpan={5} style={{ padding: '0 0 2px 0', background: C.surfaceUp }}>
                          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16 }}>
                            {[
                              ['DOB', app.dob],
                              ['Phone', app.phone],
                              ['Address', `${app.street}, ${app.city}, ${app.state} ${app.zip}`],
                              ['ID type', app.id_type],
                              ['ID number', app.id_number],
                              ['SSN (last 4)', `•••-••-${app.ssn_last4}`],
                              ['Work authorized', app.work_authorized ? 'Yes ✓' : 'No'],
                              ['Service zips', (app.service_zips || []).join(', ')],
                              ['Services', (app.service_types || []).join(', ')],
                              ['Experience', app.experience],
                            ].map(([k, v]) => (
                              <div key={k}>
                                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{k}</div>
                                <div style={{ fontSize: 13, whiteSpace: 'normal' }}>{v || '—'}</div>
                              </div>
                            ))}
                            {app.bio && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Bio</div>
                                <div style={{ fontSize: 13, color: C.muted, whiteSpace: 'normal' }}>{app.bio}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cleaners ──────────────────────────────────────────────────────
function Cleaners({ supabase }) {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState({});

  useEffect(() => {
    if (!supabase) return;
    supabase.from('cleaners')
      .select('*, profiles:user_id(full_name, phone)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setCleaners(data || []); setLoading(false); });
  }, [supabase]);

  async function toggleActive(cleaner) {
    setBusy(b => ({ ...b, [cleaner.id]: true }));
    const res = await fetch(`/api/admin/cleaners/${cleaner.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !cleaner.is_active }),
    });
    const data = await res.json();
    if (data.cleaner) setCleaners(prev => prev.map(c => c.id === cleaner.id ? { ...c, is_active: data.cleaner.is_active } : c));
    setBusy(b => ({ ...b, [cleaner.id]: false }));
  }

  if (loading) return <div style={{ color: C.muted }}>Loading cleaners…</div>;

  const BG_MAP = {
    cleared: [C.accent,  C.accentDim,             'Cleared'],
    pending: [C.warning, 'rgba(255,170,50,0.12)', 'Pending'],
    failed:  [C.error,   'rgba(255,107,107,0.12)', 'Failed'],
  };

  return (
    <div style={s.card}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>{['Name', 'Phone', 'BG Check', 'Rating', 'Jobs', 'Active', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {cleaners.length === 0 && (
              <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: C.muted, padding: 40, whiteSpace: 'normal' }}>No cleaners yet.</td></tr>
            )}
            {cleaners.map(c => (
              <tr key={c.id}>
                <td style={s.td}><span style={{ fontWeight: 600 }}>{c.profiles?.full_name || '—'}</span></td>
                <td style={{ ...s.td, color: C.muted }}>{c.profiles?.phone || '—'}</td>
                <td style={s.td}>{statusPill(c.bg_check_status, BG_MAP)}</td>
                <td style={s.td}>{c.rating > 0 ? `⭐ ${Number(c.rating).toFixed(1)}` : <span style={{ color: C.muted }}>—</span>}</td>
                <td style={s.td}>{c.jobs_completed}</td>
                <td style={s.td}>
                  <div style={{
                    width: 42, height: 24, borderRadius: 12, cursor: 'pointer',
                    background: c.is_active ? C.accent : C.surfaceUp,
                    border: `1px solid ${c.is_active ? C.accent : C.border}`,
                    position: 'relative', transition: 'all 0.2s',
                  }} onClick={() => !busy[c.id] && toggleActive(c)}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: c.is_active ? '#080A0C' : C.muted,
                      position: 'absolute', top: 2,
                      left: c.is_active ? 22 : 2, transition: 'left 0.2s',
                    }} />
                  </div>
                </td>
                <td style={s.td}>
                  <a href={`mailto:${c.profiles?.email || ''}`} style={{ ...s.btn('secondary'), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Email</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Bookings ──────────────────────────────────────────────────────
function Bookings({ supabase }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    if (!supabase) return;
    supabase.from('bookings')
      .select('*, properties(address), profiles:customer_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => { setBookings(data || []); setLoading(false); });
  }, [supabase]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (loading) return <div style={{ color: C.muted }}>Loading bookings…</div>;

  return (
    <div>
      {/* Filter pills — scrollable */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 4, width: 'max-content' }}>
          {['all', 'pending_match', 'matched', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${filter === f ? C.accent : C.border}`,
              background: filter === f ? C.accentDim : 'transparent',
              color: filter === f ? C.accent : C.muted,
              textTransform: 'capitalize', whiteSpace: 'nowrap',
            }}>{f.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr>{['Customer', 'Address', 'Date', 'Total', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: C.muted, padding: 40 }}>No bookings.</td></tr>
              )}
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={s.td}><span style={{ fontWeight: 600 }}>{b.profiles?.full_name || '—'}</span></td>
                  <td style={{ ...s.td, maxWidth: 160 }}><span style={{ color: C.muted, fontSize: 12, whiteSpace: 'normal' }}>{b.properties?.address || '—'}</span></td>
                  <td style={{ ...s.td, color: C.muted }}>{b.scheduled_date}</td>
                  <td style={s.td}><span style={{ fontWeight: 600, color: C.accent }}>${b.total_price}</span></td>
                  <td style={s.td}>{statusPill(b.status, BOOKING_STATUS_MAP)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [supabase] = useState(() => typeof window !== 'undefined' ? createClient() : null);
  const [tab, setTab]     = useState('overview');
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied]   = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login?redirect=/admin'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      if (prof?.role !== 'admin') { setDenied(true); setLoading(false); return; }
      fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false); });
    });
  }, [supabase]);

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
      Loading…
    </div>
  );

  if (denied) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.text, fontFamily: 'inherit' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
      <h2 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 24, marginBottom: 12 }}>Access denied</h2>
      <p style={{ color: C.muted, marginBottom: 24 }}>You need admin access to view this page.</p>
      <button onClick={() => router.push('/')} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, cursor: 'pointer', fontFamily: 'inherit' }}>Go home</button>
    </div>
  );

  return (
    <div style={s.page}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 40px', height: 64,
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(8,10,12,0.92)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={s.logo}>✦ Sweepr</a>
          <span style={{ color: C.accent, fontWeight: 700, fontSize: 11, padding: '3px 8px', background: C.accentDim, borderRadius: 6 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isMobile && <span style={{ color: C.muted, fontSize: 14 }}>{profile?.full_name}</span>}
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} style={{ height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 13, cursor: 'pointer', padding: '0 14px', fontFamily: 'inherit' }}>
            {isMobile ? '↩' : 'Sign out'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '28px 16px 80px' : '40px 24px 80px' }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 28, letterSpacing: '-0.5px', marginBottom: 24 }}>
          Admin Dashboard
        </h1>

        {/* Tabs — scrollable on mobile */}
        <div style={{ overflowX: isMobile ? 'auto' : undefined, WebkitOverflowScrolling: 'touch', marginBottom: 28, paddingBottom: isMobile ? 4 : 0 }}>
          <div style={{ display: 'flex', gap: 4, background: C.surface, borderRadius: 12, padding: 4, width: 'fit-content', minWidth: isMobile ? 'max-content' : undefined }}>
            {[['overview','Overview'], ['applications','Applications'], ['cleaners','Cleaners'], ['bookings','Bookings']].map(([id, label]) => (
              <button
                key={id}
                style={{
                  padding: '8px 18px', borderRadius: 9, border: 'none',
                  background: tab === id ? C.surfaceUp : 'transparent',
                  color: tab === id ? C.text : C.muted,
                  fontWeight: tab === id ? 600 : 400, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview'     && <Overview stats={stats} />}
        {tab === 'applications' && <Applications />}
        {tab === 'cleaners'     && <Cleaners supabase={supabase} />}
        {tab === 'bookings'     && <Bookings supabase={supabase} />}
      </div>
    </div>
  );
}
