'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const C = {
  bg: '#080A0C', surface: '#101316', surfaceUp: '#181C20',
  accent: '#5BD6A6', accentDim: 'rgba(91,214,166,0.12)', accentGlow: 'rgba(91,214,166,0.25)',
  border: 'rgba(255,255,255,0.07)', text: '#F3F4F2', muted: '#8A8F96',
  error: '#FF6B6B', warning: '#FFAA32', blue: '#64A0FF',
};

const s = {
  page:  { background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" },
  logo:  { fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 20, color: C.text, textDecoration: 'none' },
  card:  { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '24px', marginBottom: 14 },
  stat:  { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px' },
  label: { fontSize: 12, color: C.muted, marginBottom: 6, display: 'block', fontWeight: 500 },
  input: { width: '100%', height: 46, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceUp, color: C.text, fontSize: 14, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  btn:   (v) => ({ height: 38, borderRadius: 10, border: v === 'primary' ? 'none' : `1px solid ${C.border}`, background: v === 'primary' ? C.accent : C.surfaceUp, color: v === 'primary' ? '#080A0C' : C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 16px', fontFamily: 'inherit', transition: 'opacity 0.2s' }),
  badge: (st) => {
    const m = { pending_match: [C.warning, 'rgba(255,170,50,0.12)', 'Matching…'], matched: [C.accent, C.accentDim, 'Confirmed'], in_progress: [C.blue, 'rgba(100,160,255,0.12)', 'In progress'], completed: ['#64C864', 'rgba(100,200,100,0.12)', 'Completed'], cancelled: [C.error, 'rgba(255,100,100,0.12)', 'Cancelled'] };
    const [color, bg, label] = m[st] || m.pending_match;
    return { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 100, background: bg, color, fontSize: 12, fontWeight: 700, border: `1px solid ${color}40`, label };
  },
};

function fmt(n) { return `$${Number(n || 0).toFixed(2)}`; }
function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d + 'T12:00:00');
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Availability toggle ─────────────────────────────────────────
function AvailabilityToggle({ available, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 14px', borderRadius: 100,
        border: `1px solid ${available ? 'rgba(91,214,166,0.4)' : C.border}`,
        background: available ? C.accentDim : C.surfaceUp,
        color: available ? C.accent : C.muted,
        cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: available ? C.accent : C.muted, flexShrink: 0, transition: 'background 0.2s' }} />
      {available ? 'Available' : 'Unavailable'}
    </button>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ num, label, sub, accent }) {
  return (
    <div style={s.stat}>
      <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 28, color: accent || C.accent, lineHeight: 1, marginBottom: 6 }}>{num}</div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ color: C.muted, fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

// ── New offer notification banner ────────────────────────────
function NewOfferBanner({ count, onView }) {
  return (
    <div onClick={onView} style={{ background: C.accentDim, border: `1px solid rgba(91,214,166,0.4)`, borderRadius: 14, padding: '14px 18px', marginBottom: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }}>🔔</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.accent }}>
          {count === 1 ? 'New job offer!' : `${count} new job offers!`}
        </div>
        <div style={{ color: C.muted, fontSize: 13 }}>Tap to review and accept</div>
      </div>
      <span style={{ color: C.accent, fontSize: 18 }}>→</span>
    </div>
  );
}

// ── Offer card ────────────────────────────────────────────────
function OfferCard({ offer, onAccept, isMobile }) {
  const [busy, setBusy] = useState(false);
  const b = offer.bookings;
  const p = b?.properties;
  const addons = Array.isArray(b?.addons) ? b.addons : [];
  const cleanerPay = (b?.total_price || 0) * 0.75;

  async function accept() { setBusy(true); await onAccept(b.id); setBusy(false); }

  const mapsUrl = p?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`
    : null;

  return (
    <div style={{ ...s.card, border: `1px solid rgba(91,214,166,0.25)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p?.address || 'Address unavailable'}</div>
          <div style={{ color: C.muted, fontSize: 14, marginBottom: 2 }}>
            {[p?.sqft && `${p.sqft} sqft`, p?.beds && `${p.beds} bed`, p?.baths && `${p.baths} bath`].filter(Boolean).join(' · ')}
          </div>
          <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            {fmtDate(b?.scheduled_date)} · {b?.scheduled_time}
          </div>
          {addons.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {addons.map(a => (
                <span key={a.id} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: C.surfaceUp, border: `1px solid ${C.border}`, color: C.muted }}>
                  {a.label}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ padding: '6px 12px', borderRadius: 8, background: C.surfaceUp, border: `1px solid ${C.border}`, fontSize: 13 }}>Total: <strong>{fmt(b?.total_price)}</strong></div>
            <div style={{ padding: '6px 12px', borderRadius: 8, background: C.accentDim, border: `1px solid rgba(91,214,166,0.3)`, fontSize: 13, color: C.accent, fontWeight: 700 }}>Your cut: {fmt(cleanerPay)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button style={{ ...s.btn('primary'), height: 44, padding: '0 22px', opacity: busy ? 0.6 : 1 }} onClick={accept} disabled={busy}>
            {busy ? 'Accepting…' : '✓ Accept'}
          </button>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ ...s.btn('secondary'), height: 36, padding: '0 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              🗺 Map
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Job card (active + history) ───────────────────────────────
function JobCard({ booking, supabase, cleanerId, onRefresh, compact }) {
  const [uploading, setUploading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [photos, setPhotos] = useState([]);
  const fileRef = useRef(null);
  const p = booking.properties;
  const bdg = s.badge(booking.status);
  const cleanerPay = booking.total_price * 0.75;

  useEffect(() => {
    if (compact) return;
    supabase?.from('job_photos').select('*').eq('booking_id', booking.id).then(({ data }) => setPhotos(data || []));
  }, [booking.id, supabase, compact]);

  async function upload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const path = `${booking.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('job-photos').upload(path, file);
      if (!error) await supabase.from('job_photos').insert({ booking_id: booking.id, cleaner_id: cleanerId, storage_path: path });
    }
    const { data } = await supabase.from('job_photos').select('*').eq('booking_id', booking.id);
    setPhotos(data || []);
    setUploading(false);
  }

  async function complete() {
    setCompleting(true);
    await fetch(`/api/bookings/${booking.id}/complete`, { method: 'POST' });
    onRefresh();
    setCompleting(false);
  }

  const mapsUrl = p?.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.address)}`
    : null;

  return (
    <div style={s.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: booking.status !== 'completed' ? 16 : 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{p?.address}</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 2 }}>
            {[p?.sqft && `${p.sqft} sqft`, p?.beds && `${p.beds} bed`, p?.baths && `${p.baths} bath`].filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>
            {fmtDate(booking.scheduled_date)} · {booking.scheduled_time}
          </div>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 14, marginTop: 4 }}>Payout: {fmt(cleanerPay)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <span style={bdg}>{bdg.label}</span>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', padding: '4px 10px', borderRadius: 8, background: C.surfaceUp, border: `1px solid ${C.border}` }}>
              🗺 Directions
            </a>
          )}
        </div>
      </div>

      {booking.status !== 'completed' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={s.btn('secondary')} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : '📸 Add photos'}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={upload} />
          <button style={{ ...s.btn('primary'), opacity: completing ? 0.6 : 1 }} onClick={complete} disabled={completing}>
            {completing ? 'Updating…' : '✓ Mark complete'}
          </button>
        </div>
      )}

      {!compact && photos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {photos.map(ph => (
            <div key={ph.id} style={{ width: 56, height: 56, borderRadius: 8, background: C.surfaceUp, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📸</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Schedule tab ─────────────────────────────────────────────
function ScheduleTab({ jobs, supabase, cleanerId, onRefresh }) {
  const upcoming = jobs
    .filter(j => ['matched', 'in_progress'].includes(j.status))
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date) || a.scheduled_time.localeCompare(b.scheduled_time));

  if (upcoming.length === 0) {
    return (
      <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px', color: C.muted }}>
        No upcoming jobs. Accept an offer to see your schedule here.
      </div>
    );
  }

  // Group by date label
  const grouped = [];
  let lastLabel = null;
  upcoming.forEach(j => {
    const label = fmtDate(j.scheduled_date);
    if (label !== lastLabel) { grouped.push({ label, jobs: [] }); lastLabel = label; }
    grouped[grouped.length - 1].jobs.push(j);
  });

  return (
    <div>
      {grouped.map(group => (
        <div key={group.label} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: group.label === 'Today' ? C.accent : C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
            {group.label}
          </div>
          {group.jobs.map(j => (
            <JobCard key={j.id} booking={j} supabase={supabase} cleanerId={cleanerId} onRefresh={onRefresh} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Earnings tab ──────────────────────────────────────────────
function EarningsTab({ jobs }) {
  const completed = jobs.filter(j => j.status === 'completed');

  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  function jobDate(j) { return new Date(j.scheduled_date + 'T12:00:00'); }

  const thisWeek  = completed.filter(j => jobDate(j) >= startOfWeek);
  const thisMonth = completed.filter(j => jobDate(j) >= startOfMonth);

  const totalEarned = completed.reduce((s, j) => s + j.total_price * 0.75, 0);
  const weekEarned  = thisWeek.reduce((s, j) => s + j.total_price * 0.75, 0);
  const monthEarned = thisMonth.reduce((s, j) => s + j.total_price * 0.75, 0);

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'This week', val: weekEarned },
          { label: 'This month', val: monthEarned },
          { label: 'All time', val: totalEarned },
        ].map(({ label, val }) => (
          <div key={label} style={{ ...s.stat, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 22, color: C.accent, lineHeight: 1, marginBottom: 6 }}>{fmt(val)}</div>
            <div style={{ color: C.muted, fontSize: 12 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...s.card, fontSize: 13, color: C.muted, marginBottom: 24 }}>
        Payouts are 75% of each job total. Payments are processed after each booking is marked complete.
      </div>

      {/* Per-job history */}
      {completed.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '40px 24px', color: C.muted }}>No completed jobs yet.</div>
      ) : (
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Payout history</div>
          {[...completed].sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date)).map(j => (
            <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{j.properties?.address}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{fmtDate(j.scheduled_date)} · {j.scheduled_time}</div>
              </div>
              <div style={{ fontWeight: 700, color: C.accent, fontSize: 15 }}>{fmt(j.total_price * 0.75)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, fontWeight: 700, fontSize: 16 }}>
            <span>Total</span>
            <span style={{ color: C.accent }}>{fmt(totalEarned)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────
function ProfileTab({ cleanerRow, profile, supabase, onRefresh }) {
  const [bio, setBio]     = useState(cleanerRow?.bio || '');
  const [zips, setZips]   = useState((cleanerRow?.service_zips || []).join(', '));
  const [payout, setPayout] = useState(cleanerRow?.payout_info || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('cleaners').update({
      bio,
      service_zips: zips.split(',').map(z => z.trim()).filter(Boolean),
      payout_info: payout,
    }).eq('id', cleanerRow.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onRefresh();
  }

  return (
    <div>
      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Your profile</div>
        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Bio (shown to customers after matching)</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} style={{ ...s.input, height: 'auto', minHeight: 90, padding: '10px 12px', resize: 'vertical', lineHeight: 1.6 }} placeholder="Tell customers a bit about yourself…" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Zip codes you serve (comma-separated)</label>
          <input style={s.input} value={zips} onChange={e => setZips(e.target.value)} placeholder="80202, 80205, 80218" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Payout info (Venmo, Zelle, bank — internal use only)</label>
          <input style={s.input} value={payout} onChange={e => setPayout(e.target.value)} placeholder="@venmo-username or last4 of bank account" />
        </div>
        <button style={{ ...s.btn('primary'), height: 44, padding: '0 28px' }} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>

      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Account status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            ['Background check', cleanerRow?.bg_check_status === 'cleared' ? '✓ Cleared' : cleanerRow?.bg_check_status === 'failed' ? '✗ Failed' : '⏳ Pending', cleanerRow?.bg_check_status === 'cleared' ? C.accent : C.muted],
            ['Account active', cleanerRow?.is_active ? '✓ Active' : '✗ Inactive', cleanerRow?.is_active ? C.accent : C.muted],
            ['Jobs completed', cleanerRow?.jobs_completed ?? 0, C.text],
            ['Rating', cleanerRow?.rating > 0 ? `${Number(cleanerRow.rating).toFixed(1)} ⭐` : 'No ratings yet', C.text],
            ['Member since', cleanerRow?.created_at ? new Date(cleanerRow.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—', C.muted],
          ].map(([k, v, color]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{ color, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
function CleanerDashboardInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const welcome = params.get('welcome') === '1';
  const isMobile = useIsMobile();

  const [supabase]    = useState(() => typeof window !== 'undefined' ? createClient() : null);
  const [tab, setTab] = useState('offers');

  const [profile, setProfile]       = useState(null);
  const [cleanerRow, setCleanerRow] = useState(null);
  const [offers, setOffers]         = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showWelcome, setShowWelcome] = useState(welcome);
  const [newOfferCount, setNewOfferCount] = useState(0);
  const [available, setAvailable]   = useState(true);
  const prevOfferCount = useRef(0);

  const fetchOffers = useCallback(async (cid) => {
    const { data } = await supabase.from('job_offers')
      .select('*, bookings(id, total_price, scheduled_date, scheduled_time, addons, properties(address, sqft, beds, baths))')
      .eq('cleaner_id', cid)
      .eq('status', 'sent');
    const next = data || [];
    if (next.length > prevOfferCount.current) {
      setNewOfferCount(next.length - prevOfferCount.current);
    }
    prevOfferCount.current = next.length;
    setOffers(next);
  }, [supabase]);

  const fetchJobs = useCallback(async (cid) => {
    const { data } = await supabase.from('bookings')
      .select('*, properties(address, sqft, beds, baths)')
      .eq('assigned_cleaner_id', cid)
      .in('status', ['matched', 'in_progress', 'completed'])
      .order('scheduled_date', { ascending: true });
    setJobs(data || []);
  }, [supabase]);

  const init = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login?redirect=/cleaner'); return; }

    const [{ data: prof }, { data: cl }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('cleaners').select('*').eq('user_id', user.id).single(),
    ]);

    setProfile(prof);
    setCleanerRow(cl);
    setAvailable(cl?.is_active ?? true);

    if (cl) {
      await Promise.all([fetchOffers(cl.id), fetchJobs(cl.id)]);
    }
    setLoading(false);
  }, [supabase, router, fetchOffers, fetchJobs]);

  useEffect(() => { init(); }, [init]);

  // Real-time: new job_offers for this cleaner
  useEffect(() => {
    if (!supabase || !cleanerRow) return;
    const channel = supabase.channel(`cleaner-offers-${cleanerRow.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'job_offers',
        filter: `cleaner_id=eq.${cleanerRow.id}`,
      }, () => {
        fetchOffers(cleanerRow.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, cleanerRow, fetchOffers]);

  async function toggleAvailability() {
    const next = !available;
    setAvailable(next);
    if (cleanerRow) {
      await supabase.from('cleaners').update({ is_active: next }).eq('id', cleanerRow.id);
    }
  }

  async function acceptOffer(bookingId) {
    await fetch(`/api/bookings/${bookingId}/accept`, { method: 'POST' });
    await Promise.all([fetchOffers(cleanerRow.id), fetchJobs(cleanerRow.id)]);
  }

  const allJobs      = jobs;
  const activeJobs   = jobs.filter(j => ['matched', 'in_progress'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const totalEarned  = completedJobs.reduce((s, j) => s + j.total_price * 0.75, 0);

  const TABS = [
    ['offers',   `Offers${offers.length ? ` (${offers.length})` : ''}`],
    ['schedule', 'Schedule'],
    ['earnings', 'Earnings'],
    ['profile',  'Profile'],
  ];

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 40px', height: 64,
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(8,10,12,0.92)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <a href="/" style={s.logo}>✦ Sweepr</a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!loading && cleanerRow && (
            <AvailabilityToggle available={available} onChange={toggleAvailability} />
          )}
          {!isMobile && <span style={{ color: C.muted, fontSize: 14 }}>{profile?.full_name}</span>}
          <button style={s.btn('secondary')} onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}>
            {isMobile ? '↩' : 'Sign out'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '28px 16px 80px' : '40px 24px 80px' }}>
        {loading ? (
          <div style={{ color: C.muted, paddingTop: 40 }}>Loading…</div>
        ) : (
          <>
            {showWelcome && (
              <div style={{ background: C.accentDim, border: `1px solid rgba(91,214,166,0.3)`, borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>🎉 Welcome, {profile?.full_name?.split(' ')[0]}!</div>
                  <div style={{ color: C.muted, fontSize: 14 }}>Your account is active. Job offers appear here once you're background-checked and cleared.</div>
                </div>
                <button onClick={() => setShowWelcome(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 28, letterSpacing: '-0.5px', marginBottom: 4 }}>
                Cleaner portal
              </h1>
              <p style={{ color: C.muted, fontSize: 14 }}>
                {cleanerRow?.bg_check_status === 'cleared'
                  ? available ? "You're active — new offers will appear below." : "You're set to unavailable. Toggle above to receive jobs."
                  : cleanerRow?.bg_check_status === 'pending'
                  ? 'Background check in progress — hang tight.'
                  : 'Contact support about your account status.'}
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
              <StatCard num={offers.length} label="Open offers" sub="Waiting for you" />
              <StatCard num={activeJobs.length} label="Upcoming jobs" sub="Confirmed" />
              <StatCard num={cleanerRow?.jobs_completed ?? 0} label="Jobs done" sub="All time" />
              <StatCard num={`$${Math.round(totalEarned)}`} label="Total earned" sub="75% of jobs" />
            </div>

            {/* Real-time new offer banner */}
            {newOfferCount > 0 && tab !== 'offers' && (
              <NewOfferBanner count={newOfferCount} onView={() => { setTab('offers'); setNewOfferCount(0); }} />
            )}

            {/* Tabs */}
            <div style={{ overflowX: isMobile ? 'auto' : undefined, WebkitOverflowScrolling: 'touch', marginBottom: 28, paddingBottom: isMobile ? 4 : 0 }}>
              <div style={{ display: 'flex', gap: 4, background: C.surface, borderRadius: 12, padding: 4, width: 'fit-content', minWidth: isMobile ? 'max-content' : undefined }}>
                {TABS.map(([id, label]) => (
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
                      position: 'relative',
                    }}
                    onClick={() => { setTab(id); if (id === 'offers') setNewOfferCount(0); }}
                  >
                    {label}
                    {id === 'offers' && newOfferCount > 0 && (
                      <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: C.accent }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'offers' && (
              <div>
                {offers.length === 0 ? (
                  <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>No open offers right now</div>
                    <div style={{ color: C.muted, fontSize: 14 }}>New jobs are posted daily. Make sure you're set to Available above.</div>
                  </div>
                ) : (
                  offers.map(o => <OfferCard key={o.id} offer={o} onAccept={acceptOffer} isMobile={isMobile} />)
                )}
              </div>
            )}

            {tab === 'schedule' && (
              <ScheduleTab jobs={allJobs} supabase={supabase} cleanerId={cleanerRow?.id} onRefresh={() => fetchJobs(cleanerRow?.id)} />
            )}

            {tab === 'earnings' && <EarningsTab jobs={allJobs} />}

            {tab === 'profile' && cleanerRow && (
              <ProfileTab cleanerRow={cleanerRow} profile={profile} supabase={supabase} onRefresh={init} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CleanerPage() {
  return (
    <Suspense fallback={<div style={{ background: '#080A0C', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8F96' }}>Loading…</div>}>
      <CleanerDashboardInner />
    </Suspense>
  );
}
