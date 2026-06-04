'use client';

import { useState, useEffect, useRef } from 'react';
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
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 },
  statCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: '24px 20px',
  },
  statNum: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 36, color: C.accent, lineHeight: 1, marginBottom: 6,
  },
  statLabel: { color: C.muted, fontSize: 14 },
  sectionHeading: { fontWeight: 700, fontSize: 18, marginBottom: 16 },
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: '24px', marginBottom: 16,
  },
  offerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  offerAddress: { fontWeight: 700, fontSize: 16, marginBottom: 6 },
  offerMeta: { color: C.muted, fontSize: 14, lineHeight: 1.6 },
  earningsRow: { display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' },
  earningPill: (variant) => ({
    padding: '8px 16px', borderRadius: 10,
    background: variant === 'primary' ? C.accentDim : C.surfaceUp,
    border: `1px solid ${variant === 'primary' ? 'rgba(91,214,166,0.3)' : C.border}`,
    fontSize: 14, color: variant === 'primary' ? C.accent : C.text, fontWeight: 600,
  }),
  btnGreen: {
    height: 42, borderRadius: 10, border: 'none', background: C.accent,
    color: '#080A0C', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    padding: '0 24px', transition: 'opacity 0.2s',
  },
  btnSecondary: {
    height: 42, borderRadius: 10, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontWeight: 600, fontSize: 14,
    cursor: 'pointer', padding: '0 20px',
  },
  uploadZone: {
    border: `2px dashed ${C.border}`, borderRadius: 12, padding: '24px',
    textAlign: 'center', cursor: 'pointer', background: C.surfaceUp,
    color: C.muted, fontSize: 14, marginTop: 12,
  },
  photoGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: 8, marginTop: 12,
  },
  photoThumb: {
    aspectRatio: '1', borderRadius: 8, background: C.surfaceUp,
    border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 24, overflow: 'hidden',
  },
  emptyState: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: '48px 24px', textAlign: 'center',
    color: C.muted, fontSize: 15,
  },
};

function fmt(n) { return `$${Number(n).toFixed(2)}`; }

function OfferCard({ offer, onAccept }) {
  const [accepting, setAccepting] = useState(false);
  const booking = offer.bookings;
  const prop    = booking?.properties;

  async function handleAccept() {
    setAccepting(true);
    await onAccept(booking.id);
    setAccepting(false);
  }

  return (
    <div style={s.card}>
      <div style={s.offerHeader}>
        <div style={{ flex: 1 }}>
          <div style={s.offerAddress}>{prop?.address || 'Address unavailable'}</div>
          <div style={s.offerMeta}>
            {prop?.sqft} sqft · {prop?.beds} bed · {prop?.baths} bath
          </div>
          <div style={s.offerMeta}>
            {booking?.scheduled_date} at {booking?.scheduled_time}
          </div>
          <div style={s.earningsRow}>
            <div style={s.earningPill('secondary')}>Total: {fmt(booking?.total_price)}</div>
            <div style={s.earningPill('primary')}>Your cut: {fmt(booking?.total_price * 0.75)}</div>
          </div>
        </div>
        <button
          style={{ ...s.btnGreen, opacity: accepting ? 0.6 : 1 }}
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? 'Accepting…' : 'Accept job'}
        </button>
      </div>
    </div>
  );
}

function JobCard({ booking, supabase, cleanerId, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [photos, setPhotos] = useState([]);
  const fileRef = useRef(null);

  const prop = booking.properties;

  useEffect(() => {
    supabase
      .from('job_photos')
      .select('*')
      .eq('booking_id', booking.id)
      .then(({ data }) => setPhotos(data || []));
  }, [booking.id, supabase]);

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const path = `${booking.id}/${Date.now()}-${file.name}`;
      const { error: storageErr } = await supabase.storage.from('job-photos').upload(path, file);
      if (!storageErr) {
        await supabase.from('job_photos').insert({
          booking_id: booking.id,
          cleaner_id: cleanerId,
          storage_path: path,
        });
      }
    }
    const { data } = await supabase.from('job_photos').select('*').eq('booking_id', booking.id);
    setPhotos(data || []);
    setUploading(false);
  }

  async function handleComplete() {
    setCompleting(true);
    const res = await fetch(`/api/bookings/${booking.id}/complete`, { method: 'POST' });
    if (res.ok) onRefresh();
    setCompleting(false);
  }

  return (
    <div style={s.card}>
      <div style={s.offerHeader}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={s.offerAddress}>{prop?.address}</div>
            <span style={{
              padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
              background: booking.status === 'in_progress'
                ? 'rgba(100,160,255,0.12)' : C.accentDim,
              color: booking.status === 'in_progress' ? '#64A0FF' : C.accent,
            }}>
              {booking.status === 'in_progress' ? 'In progress' : 'Matched'}
            </span>
          </div>
          <div style={s.offerMeta}>{booking.scheduled_date} at {booking.scheduled_time}</div>
          <div style={{ ...s.offerMeta, color: C.accent, fontWeight: 600, marginTop: 4 }}>
            Earnings: {fmt(booking.total_price * 0.75)}
          </div>
        </div>
      </div>

      {/* Photo upload */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Job photos</div>
        {photos.length > 0 && (
          <div style={s.photoGrid}>
            {photos.map(p => (
              <div key={p.id} style={s.photoThumb}>📸</div>
            ))}
          </div>
        )}
        <div
          style={s.uploadZone}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Uploading…' : '+ Upload photos'}
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>

      {/* Complete button */}
      {booking.status !== 'completed' && (
        <div style={{ marginTop: 16 }}>
          <button
            style={{ ...s.btnGreen, opacity: completing ? 0.6 : 1 }}
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? 'Marking complete…' : '✓ Mark job complete'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CleanerPage() {
  const router  = useRouter();
  const [supabase] = useState(() => typeof window !== 'undefined' ? createClient() : null);

  const [profile, setProfile]     = useState(null);
  const [cleanerRow, setCleanerRow] = useState(null);
  const [offers, setOffers]       = useState([]);
  const [jobs, setJobs]           = useState([]);
  const [stats, setStats]         = useState({ jobs: 0, earned: 0, rating: 0 });
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (supabase) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login?redirect=/cleaner'); return; }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(prof);

    if (prof?.role !== 'cleaner') {
      router.push('/dashboard');
      return;
    }

    const { data: cl } = await supabase.from('cleaners').select('*').eq('user_id', user.id).single();
    setCleanerRow(cl);

    if (cl) {
      await Promise.all([fetchOffers(cl.id), fetchJobs(cl.id), computeStats(cl)]);
    }
    setLoading(false);
  }

  async function fetchOffers(cleanerId) {
    const { data } = await supabase
      .from('job_offers')
      .select(`
        *,
        bookings (
          id, total_price, scheduled_date, scheduled_time, status,
          properties (address, sqft, beds, baths)
        )
      `)
      .eq('cleaner_id', cleanerId)
      .eq('status', 'sent');
    setOffers(data || []);
  }

  async function fetchJobs(cleanerId) {
    const { data } = await supabase
      .from('bookings')
      .select('*, properties (address, sqft, beds, baths)')
      .eq('assigned_cleaner_id', cleanerId)
      .in('status', ['matched', 'in_progress', 'completed'])
      .order('scheduled_date', { ascending: false });
    setJobs(data || []);
  }

  function computeStats(cl) {
    setStats({
      jobs:   cl.jobs_completed || 0,
      earned: (cl.jobs_completed || 0) * 120, // rough estimate
      rating: cl.rating || 0,
    });
  }

  async function acceptOffer(bookingId) {
    const res = await fetch(`/api/bookings/${bookingId}/accept`, { method: 'POST' });
    if (res.ok) {
      await fetchOffers(cleanerRow.id);
      await fetchJobs(cleanerRow.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const activeJobs = jobs.filter(j => ['matched', 'in_progress'].includes(j.status));

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <a href="/" style={s.logo}>✦ Sweepr</a>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: C.muted, fontSize: 14 }}>Cleaner portal</span>
          <button
            onClick={signOut}
            style={{
              height: 38, borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'transparent', color: C.muted, fontSize: 14, cursor: 'pointer',
              padding: '0 16px',
            }}
          >Sign out</button>
        </div>
      </nav>

      <div style={s.container}>
        {loading ? (
          <div style={{ color: C.muted }}>Loading…</div>
        ) : (
          <>
            <h1 style={s.h1}>
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Cleaner'} 👋
            </h1>
            <p style={s.greeting}>
              {cleanerRow?.bg_check_status === 'cleared'
                ? 'You\'re cleared to accept jobs.'
                : cleanerRow?.bg_check_status === 'pending'
                ? 'Your background check is pending — you\'ll be notified when cleared.'
                : 'Your background check status needs attention. Contact support.'}
            </p>

            {/* Stats */}
            <div style={s.statsRow}>
              <div style={s.statCard}>
                <div style={s.statNum}>{stats.jobs}</div>
                <div style={s.statLabel}>Jobs completed</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statNum}>${(stats.earned).toLocaleString()}</div>
                <div style={s.statLabel}>Total earned (est.)</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statNum}>{stats.rating > 0 ? stats.rating.toFixed(1) : '—'}</div>
                <div style={s.statLabel}>Average rating</div>
              </div>
            </div>

            {/* Open offers */}
            <div style={{ marginBottom: 48 }}>
              <div style={s.sectionHeading}>
                Open offers
                {offers.length > 0 && (
                  <span style={{
                    marginLeft: 10, fontSize: 12, fontWeight: 700, padding: '3px 8px',
                    borderRadius: 100, background: C.accentDim, color: C.accent,
                  }}>{offers.length}</span>
                )}
              </div>
              {offers.length === 0 ? (
                <div style={s.emptyState}>No open offers right now — check back soon.</div>
              ) : (
                offers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} onAccept={acceptOffer} />
                ))
              )}
            </div>

            {/* Active jobs */}
            <div style={{ marginBottom: 48 }}>
              <div style={s.sectionHeading}>Active jobs</div>
              {activeJobs.length === 0 ? (
                <div style={s.emptyState}>No active jobs. Accept an offer above to get started.</div>
              ) : (
                activeJobs.map(job => (
                  <JobCard
                    key={job.id}
                    booking={job}
                    supabase={supabase}
                    cleanerId={cleanerRow?.id}
                    onRefresh={() => fetchJobs(cleanerRow?.id)}
                  />
                ))
              )}
            </div>

            {/* Completed jobs */}
            {jobs.filter(j => j.status === 'completed').length > 0 && (
              <div>
                <div style={s.sectionHeading}>Completed jobs</div>
                {jobs.filter(j => j.status === 'completed').map(job => (
                  <JobCard
                    key={job.id}
                    booking={job}
                    supabase={supabase}
                    cleanerId={cleanerRow?.id}
                    onRefresh={() => fetchJobs(cleanerRow?.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
