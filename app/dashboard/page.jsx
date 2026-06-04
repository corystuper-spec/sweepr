'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const C = {
  bg:        '#080A0C',
  surface:   '#101316',
  surfaceUp: '#181C20',
  accent:    '#5BD6A6',
  accentDim: 'rgba(91,214,166,0.12)',
  border:    'rgba(255,255,255,0.07)',
  text:      '#F3F4F2',
  muted:     '#8A8F96',
  error:     '#FF6B6B',
};

const s = {
  page: { background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: 64,
    borderBottom: `1px solid ${C.border}`,
    background: 'rgba(8,10,12,0.9)', backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 50,
  },
  logo: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 20, color: C.text, textDecoration: 'none',
  },
  container: { maxWidth: 900, margin: '0 auto', padding: '48px 24px' },
  h1: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 32, letterSpacing: '-1px', marginBottom: 8,
  },
  greeting: { color: C.muted, fontSize: 15, marginBottom: 40 },
  sectionHeading: { fontWeight: 700, fontSize: 18, marginBottom: 16 },
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: '28px 24px', marginBottom: 16,
  },
  statusBadge: (status) => {
    const map = {
      pending_match: { bg: 'rgba(255,170,50,0.12)', color: '#FFAA32', label: 'Matching…' },
      matched:       { bg: 'rgba(91,214,166,0.12)', color: '#5BD6A6', label: 'Cleaner matched' },
      in_progress:   { bg: 'rgba(100,160,255,0.12)', color: '#64A0FF', label: 'In progress' },
      completed:     { bg: 'rgba(100,200,100,0.12)', color: '#64C864', label: 'Completed' },
      cancelled:     { bg: 'rgba(255,100,100,0.12)', color: '#FF6464', label: 'Cancelled' },
    };
    const d = map[status] || map.pending_match;
    return {
      display: 'inline-block', padding: '4px 12px', borderRadius: 100,
      background: d.bg, color: d.color, fontSize: 12, fontWeight: 700,
    };
  },
  meta: { color: C.muted, fontSize: 14, marginTop: 6, lineHeight: 1.6 },
  cleanerRow: {
    marginTop: 16, padding: '16px', borderRadius: 12,
    background: C.surfaceUp, border: `1px solid ${C.border}`,
  },
  actionBtn: (variant) => ({
    height: 38, borderRadius: 10, border: 'none',
    background: variant === 'primary' ? C.accent : C.surfaceUp,
    color: variant === 'primary' ? '#080A0C' : C.text,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    padding: '0 16px',
    border: variant !== 'primary' ? `1px solid ${C.border}` : 'none',
  }),
  photoGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 10, marginTop: 16,
  },
  photoThumb: {
    aspectRatio: '1', borderRadius: 10, background: C.surfaceUp,
    border: `1px solid ${C.border}`, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28,
  },
  stars: (rating) => ({ display: 'flex', gap: 3 }),
};

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{
            fontSize: 28, cursor: onChange ? 'pointer' : 'default',
            color: n <= (hover || value) ? '#FFAA32' : C.surfaceUp,
            transition: 'color 0.1s',
          }}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(n)}
        >★</span>
      ))}
    </div>
  );
}

function BookingCard({ booking, supabase, onRefresh }) {
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (booking.status === 'completed') {
      supabase
        .from('job_photos')
        .select('*')
        .eq('booking_id', booking.id)
        .then(({ data }) => setPhotos(data || []));
    }
  }, [booking.id, booking.status, supabase]);

  async function submitReview() {
    if (!reviewRating) return;
    setSubmittingReview(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('reviews').insert({
      booking_id:  booking.id,
      customer_id: user.id,
      cleaner_id:  booking.assigned_cleaner_id,
      rating:      reviewRating,
      comment:     reviewText,
    });
    setReviewing(false);
    setSubmittingReview(false);
    onRefresh();
  }

  const prop = booking.properties;
  const cleaner = booking.cleaners;

  return (
    <div style={s.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {prop?.address || 'Property'}
          </div>
          <div style={s.meta}>
            {booking.scheduled_date} at {booking.scheduled_time} ·{' '}
            {prop?.sqft} sqft · {prop?.beds} bed · {prop?.baths} bath
          </div>
          <div style={s.meta}>
            {booking.recurrence !== 'once' && (
              <span style={{ color: C.accent }}>
                {booking.recurrence.charAt(0).toUpperCase() + booking.recurrence.slice(1)} recurring ·{' '}
              </span>
            )}
            Total: <strong style={{ color: C.text }}>${booking.total_price}</strong>
          </div>
        </div>
        <span style={s.statusBadge(booking.status)}>{s.statusBadge(booking.status).label}</span>
      </div>

      {/* Matched cleaner info */}
      {booking.status === 'matched' && cleaner && (
        <div style={s.cleanerRow}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{cleaner.profiles?.full_name || 'Your cleaner'}</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>
                ⭐ {cleaner.rating} · {cleaner.jobs_completed} jobs · {cleaner.profiles?.phone || 'Phone on app'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {cleaner.profiles?.phone && (
                <a href={`tel:${cleaner.profiles.phone}`}>
                  <button style={s.actionBtn('secondary')}>📞 Call</button>
                </a>
              )}
              {cleaner.profiles?.phone && (
                <a href={`sms:${cleaner.profiles.phone}`}>
                  <button style={s.actionBtn('secondary')}>💬 Message</button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed: photos + review */}
      {booking.status === 'completed' && (
        <div>
          {photos.length > 0 && (
            <div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 16, marginBottom: 8 }}>Job photos</div>
              <div style={s.photoGrid}>
                {photos.map(p => (
                  <div key={p.id} style={s.photoThumb}>🏠</div>
                ))}
              </div>
            </div>
          )}

          {!reviewing && (
            <button
              style={{ ...s.actionBtn('secondary'), marginTop: 16 }}
              onClick={() => setReviewing(true)}
            >
              ⭐ Leave a review
            </button>
          )}

          {reviewing && (
            <div style={{ marginTop: 16, padding: 16, background: C.surfaceUp, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Rate your experience</div>
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <textarea
                placeholder="Leave a comment (optional)"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                style={{
                  width: '100%', borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.text, fontSize: 14, padding: '10px 14px',
                  fontFamily: 'inherit', marginTop: 12, resize: 'vertical', minHeight: 80,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  style={s.actionBtn('primary')}
                  disabled={!reviewRating || submittingReview}
                  onClick={submitReview}
                >
                  {submittingReview ? 'Submitting…' : 'Submit review'}
                </button>
                <button style={s.actionBtn('secondary')} onClick={() => setReviewing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [supabase] = useState(() => typeof window !== 'undefined' ? createClient() : null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [recurringPlans, setRecurringPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabase) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login?redirect=/dashboard'); return; }
    setUser(user);
    await Promise.all([fetchProfile(user.id), fetchBookings(user.id), fetchPlans(user.id)]);
    setLoading(false);
  }

  async function fetchProfile(uid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile(data);
  }

  async function fetchBookings(uid) {
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
      .order('created_at', { ascending: false });
    setBookings(data || []);
  }

  async function fetchPlans(uid) {
    const { data } = await supabase
      .from('recurring_plans')
      .select('*, properties (address), cleaners:cleaner_id (id, rating, profiles:user_id (full_name))')
      .eq('customer_id', uid)
      .eq('active', true);
    setRecurringPlans(data || []);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const active = bookings.filter(b => ['pending_match', 'matched', 'in_progress'].includes(b.status));
  const past   = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <a href="/" style={s.logo}>✦ Sweepr</a>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => router.push('/book')}
            style={{
              height: 38, borderRadius: 10, border: 'none',
              background: C.accent, color: '#080A0C', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', padding: '0 20px',
            }}
          >
            + Book a clean
          </button>
          <button
            onClick={signOut}
            style={{
              height: 38, borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'transparent', color: C.muted, fontSize: 14, cursor: 'pointer',
              padding: '0 16px',
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div style={s.container}>
        {loading ? (
          <div style={{ color: C.muted, fontSize: 16 }}>Loading…</div>
        ) : (
          <>
            <h1 style={s.h1}>
              Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p style={s.greeting}>Here's a snapshot of your Sweepr account.</p>

            {/* Active bookings */}
            <div style={{ marginBottom: 48 }}>
              <div style={s.sectionHeading}>Active bookings</div>
              {active.length === 0 ? (
                <div style={s.card}>
                  <p style={{ color: C.muted, fontSize: 15 }}>
                    No active bookings.{' '}
                    <button
                      style={{ color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
                      onClick={() => router.push('/book')}
                    >
                      Book your first clean →
                    </button>
                  </p>
                </div>
              ) : (
                active.map(b => (
                  <BookingCard key={b.id} booking={b} supabase={supabase} onRefresh={() => fetchBookings(user?.id)} />
                ))
              )}
            </div>

            {/* Recurring plans */}
            {recurringPlans.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={s.sectionHeading}>Recurring plans</div>
                {recurringPlans.map(plan => (
                  <div key={plan.id} style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                          {plan.properties?.address}
                        </div>
                        <div style={{ color: C.muted, fontSize: 14 }}>
                          {plan.cadence.charAt(0).toUpperCase() + plan.cadence.slice(1)} ·{' '}
                          Next: {plan.next_date || 'TBD'} ·{' '}
                          {plan.cleaners?.profiles?.full_name || 'Unassigned cleaner'}
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                        background: C.accentDim, color: C.accent,
                      }}>Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Past bookings */}
            {past.length > 0 && (
              <div>
                <div style={s.sectionHeading}>Past bookings</div>
                {past.map(b => (
                  <BookingCard key={b.id} booking={b} supabase={supabase} onRefresh={() => fetchBookings(user?.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
