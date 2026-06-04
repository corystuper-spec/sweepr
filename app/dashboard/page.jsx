'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  btn:   (v) => ({ height: 38, borderRadius: 10, border: v === 'primary' ? 'none' : `1px solid ${C.border}`, background: v === 'primary' ? C.accent : v === 'danger' ? 'rgba(255,107,107,0.1)' : C.surfaceUp, color: v === 'primary' ? '#080A0C' : v === 'danger' ? C.error : C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 16px', fontFamily: 'inherit', transition: 'opacity 0.2s', borderColor: v === 'danger' ? 'rgba(255,107,107,0.3)' : undefined }),
  badge: (st) => {
    const map = {
      pending_match: { color: C.warning, bg: 'rgba(255,170,50,0.12)', label: 'Finding cleaner…' },
      matched:       { color: C.accent,  bg: C.accentDim,             label: 'Cleaner matched' },
      in_progress:   { color: C.blue,    bg: 'rgba(100,160,255,0.12)', label: 'In progress' },
      completed:     { color: '#64C864', bg: 'rgba(100,200,100,0.12)', label: 'Completed' },
      cancelled:     { color: C.error,   bg: 'rgba(255,107,107,0.1)',  label: 'Cancelled' },
    };
    const d = map[st] || map.pending_match;
    return { style: { display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 100, background: d.bg, color: d.color, fontSize: 12, fontWeight: 700, border: `1px solid ${d.color}30` }, label: d.label };
  },
};

function fmt(n) { return `$${Number(n || 0).toFixed(2)}`; }
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr + 'T12:00:00') - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Star rating ────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{ fontSize: 28, cursor: onChange ? 'pointer' : 'default', color: n <= (hover || value) ? C.warning : C.surfaceUp, transition: 'color 0.1s', userSelect: 'none' }}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(n)}
        >★</span>
      ))}
    </div>
  );
}

// ── Booking card ───────────────────────────────────────────────
function BookingCard({ booking, supabase, userId, onRefresh, isMobile }) {
  const router = useRouter();
  const [reviewing, setReviewing]       = useState(false);
  const [reviewRating, setRating]       = useState(0);
  const [reviewText, setReviewText]     = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [cancelling, setCancelling]     = useState(false);
  const [photos, setPhotos]             = useState([]);
  const [hasReview, setHasReview]       = useState(false);

  const prop    = booking.properties;
  const cleaner = booking.cleaners;
  const bdg     = s.badge(booking.status);
  const days    = daysUntil(booking.scheduled_date);

  useEffect(() => {
    if (booking.status !== 'completed') return;
    Promise.all([
      supabase.from('job_photos').select('*').eq('booking_id', booking.id),
      supabase.from('reviews').select('id').eq('booking_id', booking.id).eq('customer_id', userId).maybeSingle(),
    ]).then(([{ data: ph }, { data: rv }]) => {
      setPhotos(ph || []);
      setHasReview(!!rv);
    });
  }, [booking.id, booking.status, supabase, userId]);

  async function cancel() {
    setCancelling(true);
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id).eq('customer_id', userId).eq('status', 'pending_match');
    onRefresh();
    setCancelling(false);
  }

  async function submitReview() {
    if (!reviewRating) return;
    setSubmitting(true);
    await supabase.from('reviews').insert({
      booking_id:  booking.id,
      customer_id: userId,
      cleaner_id:  booking.assigned_cleaner_id,
      rating:      reviewRating,
      comment:     reviewText,
    });
    setReviewing(false);
    setSubmitting(false);
    setHasReview(true);
    onRefresh();
  }

  function rebook() {
    router.push(`/book?address=${encodeURIComponent(prop?.address || '')}`);
  }

  const paymentColor = { authorized: C.muted, paid: C.accent, pending: C.muted, failed: C.error }[booking.payment_status] || C.muted;
  const paymentLabel = { authorized: 'Card saved', paid: 'Paid', pending: 'Payment pending', failed: 'Payment failed' }[booking.payment_status] || '';

  return (
    <div style={s.card}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{prop?.address || 'Property'}</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 2 }}>
            {[prop?.sqft && `${prop.sqft} sqft`, prop?.beds && `${prop.beds} bed`, prop?.baths && `${prop.baths} bath`].filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>
            {new Date(booking.scheduled_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {booking.scheduled_time}
            {days !== null && days >= 0 && days <= 7 && booking.status !== 'completed' && booking.status !== 'cancelled' && (
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: days === 0 ? C.accent : C.warning }}>
                {days === 0 ? '• Today' : `• ${days}d away`}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={bdg.style}>{bdg.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: C.accent, fontWeight: 700 }}>{fmt(booking.total_price)}</span>
            {paymentLabel && <span style={{ fontSize: 11, color: paymentColor }}>· {paymentLabel}</span>}
          </div>
        </div>
      </div>

      {/* Addons */}
      {Array.isArray(booking.addons) && booking.addons.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {booking.addons.map(a => (
            <span key={a.id} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: C.surfaceUp, border: `1px solid ${C.border}`, color: C.muted }}>
              {a.label}
            </span>
          ))}
          {booking.recurrence !== 'once' && (
            <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: C.accentDim, border: `1px solid rgba(91,214,166,0.3)`, color: C.accent }}>
              {booking.recurrence}
            </span>
          )}
        </div>
      )}

      {/* Matched cleaner */}
      {['matched', 'in_progress'].includes(booking.status) && cleaner && (
        <div style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                🧹 {cleaner.profiles?.full_name || 'Your cleaner'}
              </div>
              <div style={{ color: C.muted, fontSize: 13 }}>
                ⭐ {Number(cleaner.rating || 0).toFixed(1)} · {cleaner.jobs_completed ?? 0} jobs completed
              </div>
              {cleaner.bio && <div style={{ color: C.muted, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{cleaner.bio}</div>}
            </div>
            {cleaner.profiles?.phone && (
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`tel:${cleaner.profiles.phone}`} style={{ textDecoration: 'none' }}>
                  <button style={{ ...s.btn('secondary'), fontSize: 12 }}>📞 Call</button>
                </a>
                <a href={`sms:${cleaner.profiles.phone}`} style={{ textDecoration: 'none' }}>
                  <button style={{ ...s.btn('secondary'), fontSize: 12 }}>💬 Text</button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completed: photos + review */}
      {booking.status === 'completed' && (
        <div>
          {photos.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Job photos from your cleaner</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {photos.map(p => (
                  <div key={p.id} style={{ width: 64, height: 64, borderRadius: 10, background: C.surfaceUp, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏠</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={s.btn('secondary')} onClick={rebook}>↺ Rebook</button>
            {!hasReview && !reviewing && (
              <button style={s.btn('secondary')} onClick={() => setReviewing(true)}>⭐ Leave a review</button>
            )}
            {hasReview && <span style={{ fontSize: 13, color: C.accent, display: 'flex', alignItems: 'center', gap: 4 }}>✓ Review submitted</span>}
          </div>

          {reviewing && (
            <div style={{ marginTop: 14, padding: '16px', background: C.surfaceUp, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>How was your clean?</div>
              <StarRating value={reviewRating} onChange={setRating} />
              <textarea
                placeholder="What went well? Anything to improve? (optional)"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                style={{ width: '100%', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, padding: '10px 14px', fontFamily: 'inherit', marginTop: 12, resize: 'vertical', minHeight: 80, outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button style={{ ...s.btn('primary'), opacity: !reviewRating || submitting ? 0.6 : 1 }} disabled={!reviewRating || submitting} onClick={submitReview}>
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
                <button style={s.btn('secondary')} onClick={() => setReviewing(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending: cancel option */}
      {booking.status === 'pending_match' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button style={{ ...s.btn('danger'), opacity: cancelling ? 0.6 : 1 }} disabled={cancelling} onClick={cancel}>
            {cancelling ? 'Cancelling…' : 'Cancel booking'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Upcoming tab ───────────────────────────────────────────────
function UpcomingTab({ bookings, supabase, userId, onRefresh, isMobile, router }) {
  const active = bookings.filter(b => ['pending_match', 'matched', 'in_progress'].includes(b.status));

  if (active.length === 0) {
    return (
      <div style={{ ...s.card, textAlign: 'center', padding: '56px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No upcoming cleans</div>
        <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Book your first clean and we'll match you with a top-rated cleaner.</div>
        <button style={{ ...s.btn('primary'), height: 46, padding: '0 32px' }} onClick={() => router.push('/book')}>
          Book a clean →
        </button>
      </div>
    );
  }

  return (
    <div>
      {active.map(b => (
        <BookingCard key={b.id} booking={b} supabase={supabase} userId={userId} onRefresh={onRefresh} isMobile={isMobile} />
      ))}
    </div>
  );
}

// ── History tab ────────────────────────────────────────────────
function HistoryTab({ bookings, supabase, userId, onRefresh, isMobile }) {
  const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
  const totalSpent = past.filter(b => b.status === 'completed').reduce((s, b) => s + (b.total_price || 0), 0);

  if (past.length === 0) {
    return (
      <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px', color: C.muted }}>
        No past bookings yet.
      </div>
    );
  }

  return (
    <div>
      {totalSpent > 0 && (
        <div style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ color: C.muted, fontSize: 14 }}>Total spent with Sweepr</span>
          <span style={{ fontWeight: 800, fontSize: 22, color: C.accent, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>{fmt(totalSpent)}</span>
        </div>
      )}
      {past.map(b => (
        <BookingCard key={b.id} booking={b} supabase={supabase} userId={userId} onRefresh={onRefresh} isMobile={isMobile} />
      ))}
    </div>
  );
}

// ── Account tab ────────────────────────────────────────────────
function AccountTab({ profile, user, supabase, onRefresh }) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone]       = useState(profile?.phone || '');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onRefresh();
  }

  return (
    <div>
      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Personal info</div>
        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Full name</label>
          <input style={s.input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Email address</label>
          <input style={{ ...s.input, opacity: 0.5, cursor: 'not-allowed' }} value={user?.email || ''} readOnly />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Email can't be changed here. Contact support if needed.</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Phone number</label>
          <input style={s.input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
        </div>
        <button style={{ ...s.btn('primary'), height: 44, padding: '0 28px' }} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>

      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Account details</div>
        {[
          ['Member since', profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'],
          ['Account ID', user?.id?.slice(0, 8) + '…'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
            <span style={{ color: C.muted }}>{k}</span>
            <span style={{ fontFamily: k === 'Account ID' ? 'monospace' : 'inherit', fontSize: k === 'Account ID' ? 12 : 14 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter();
  const isMobile = useIsMobile();
  const [supabase] = useState(() => typeof window !== 'undefined' ? createClient() : null);

  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('upcoming');
  const [matchedAlert, setMatchedAlert] = useState(null);

  const fetchBookings = useCallback(async (uid) => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        properties (*),
        cleaners:assigned_cleaner_id (
          id, rating, jobs_completed, bio,
          profiles:user_id (full_name, phone)
        )
      `)
      .eq('customer_id', uid)
      .order('scheduled_date', { ascending: false });
    setBookings(data || []);
    return data || [];
  }, [supabase]);

  const fetchProfile = useCallback(async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile(data);
  }, [supabase]);

  const init = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login?redirect=/dashboard'); return; }
    setUser(user);
    await Promise.all([fetchProfile(user.id), fetchBookings(user.id)]);
    setLoading(false);
  }, [supabase, router, fetchProfile, fetchBookings]);

  useEffect(() => { init(); }, [init]);

  // Real-time: watch booking status changes
  useEffect(() => {
    if (!supabase || !user) return;
    const prev = {};
    bookings.forEach(b => { prev[b.id] = b.status; });

    const channel = supabase.channel(`customer-bookings-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `customer_id=eq.${user.id}`,
      }, async (payload) => {
        if (prev[payload.new.id] === 'pending_match' && payload.new.status === 'matched') {
          setMatchedAlert(payload.new.id);
          setTimeout(() => setMatchedAlert(null), 6000);
        }
        await fetchBookings(user.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, user, bookings, fetchBookings]);

  const active    = bookings.filter(b => ['pending_match', 'matched', 'in_progress'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'completed');
  const totalSpent = completed.reduce((s, b) => s + (b.total_price || 0), 0);
  const nextClean  = active.filter(b => b.scheduled_date).sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];
  const nextDays   = nextClean ? daysUntil(nextClean.scheduled_date) : null;

  const TABS = [
    ['upcoming', `Upcoming${active.length ? ` (${active.length})` : ''}`],
    ['history',  'History'],
    ['account',  'Account'],
  ];

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 48px', height: 64,
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(8,10,12,0.92)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <a href="/" style={s.logo}>✦ Sweepr</a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            style={{ ...s.btn('primary'), height: 38 }}
            onClick={() => router.push('/book')}
          >
            {isMobile ? '+ Book' : '+ Book a clean'}
          </button>
          <button
            style={s.btn('secondary')}
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
          >
            {isMobile ? '↩' : 'Sign out'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '28px 16px 80px' : '40px 24px 80px' }}>
        {loading ? (
          <div style={{ color: C.muted, paddingTop: 40 }}>Loading…</div>
        ) : (
          <>
            {/* Greeting */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: isMobile ? 26 : 32, letterSpacing: '-0.5px', marginBottom: 4 }}>
                Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
              </h1>
              <p style={{ color: C.muted, fontSize: 14 }}>
                {nextClean
                  ? nextDays === 0 ? "You have a clean today — enjoy!" : nextDays === 1 ? "Your cleaner comes tomorrow." : `Next clean in ${nextDays} days.`
                  : "Your home is clean. Book whenever you're ready."}
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
              <div style={s.stat}>
                <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 28, color: C.accent, lineHeight: 1, marginBottom: 6 }}>{active.length}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Upcoming</div>
                <div style={{ color: C.muted, fontSize: 11 }}>Scheduled cleans</div>
              </div>
              <div style={s.stat}>
                <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 28, color: C.accent, lineHeight: 1, marginBottom: 6 }}>{completed.length}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Completed</div>
                <div style={{ color: C.muted, fontSize: 11 }}>All time</div>
              </div>
              <div style={{ ...s.stat, gridColumn: isMobile ? 'span 2' : undefined }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 28, color: C.accent, lineHeight: 1, marginBottom: 6 }}>{fmt(totalSpent)}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Total spent</div>
                <div style={{ color: C.muted, fontSize: 11 }}>All time</div>
              </div>
            </div>

            {/* Cleaner matched alert */}
            {matchedAlert && (
              <div style={{ background: C.accentDim, border: `1px solid rgba(91,214,166,0.4)`, borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.accent }}>Cleaner matched!</div>
                  <div style={{ color: C.muted, fontSize: 13 }}>A cleaner has accepted your booking. Check the details below.</div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{ overflowX: isMobile ? 'auto' : undefined, WebkitOverflowScrolling: 'touch', marginBottom: 24, paddingBottom: isMobile ? 4 : 0 }}>
              <div style={{ display: 'flex', gap: 4, background: C.surface, borderRadius: 12, padding: 4, width: 'fit-content', minWidth: isMobile ? 'max-content' : undefined }}>
                {TABS.map(([id, label]) => (
                  <button
                    key={id}
                    style={{
                      padding: '8px 20px', borderRadius: 9, border: 'none',
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

            {tab === 'upcoming' && (
              <UpcomingTab bookings={bookings} supabase={supabase} userId={user?.id} onRefresh={() => fetchBookings(user?.id)} isMobile={isMobile} router={router} />
            )}
            {tab === 'history' && (
              <HistoryTab bookings={bookings} supabase={supabase} userId={user?.id} onRefresh={() => fetchBookings(user?.id)} isMobile={isMobile} />
            )}
            {tab === 'account' && (
              <AccountTab profile={profile} user={user} supabase={supabase} onRefresh={() => fetchProfile(user?.id)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
