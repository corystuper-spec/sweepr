'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const C = {
  bg: '#080A0C', surface: '#101316', surfaceUp: '#181C20',
  accent: '#5BD6A6', accentDim: 'rgba(91,214,166,0.12)', accentGlow: 'rgba(91,214,166,0.25)',
  border: 'rgba(255,255,255,0.07)', text: '#F3F4F2', muted: '#8A8F96', error: '#FF6B6B',
};

const s = {
  page:  { background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" },
  logo:  { fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 20, color: C.text, textDecoration: 'none' },
  card:  { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '24px', marginBottom: 14 },
  stat:  { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px' },
  badge: (st) => {
    const m = { pending_match: ['#FFAA32','rgba(255,170,50,0.12)','Matching…'], matched: [C.accent,C.accentDim,'Matched'], in_progress: ['#64A0FF','rgba(100,160,255,0.12)','In progress'], completed: ['#64C864','rgba(100,200,100,0.12)','Completed'], cancelled: [C.error,'rgba(255,100,100,0.12)','Cancelled'] };
    const [color, bg, label] = m[st] || m.pending_match;
    return { display:'inline-block', padding:'3px 10px', borderRadius:100, background:bg, color, fontSize:12, fontWeight:700, label };
  },
  btn:   (v) => ({ height: 38, borderRadius: 10, border: v === 'primary' ? 'none' : `1px solid ${C.border}`, background: v === 'primary' ? C.accent : C.surfaceUp, color: v === 'primary' ? '#080A0C' : C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 16px', fontFamily: 'inherit', transition: 'opacity 0.2s' }),
  input: { width: '100%', height: 46, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceUp, color: C.text, fontSize: 14, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: 12, color: C.muted, marginBottom: 6, display: 'block', fontWeight: 500 },
};

function fmt(n) { return `$${Number(n || 0).toFixed(2)}`; }

function WelcomeBanner({ name, onDismiss }) {
  return (
    <div style={{ background: C.accentDim, border: `1px solid rgba(91,214,166,0.3)`, borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>🎉 Welcome to Sweepr, {name}!</div>
        <div style={{ color: C.muted, fontSize: 14 }}>Your account is active. Job offers will appear here once you're background-checked and cleared.</div>
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1, flexShrink: 0 }}>×</button>
    </div>
  );
}

function StatCard({ num, label, sub }) {
  return (
    <div style={s.stat}>
      <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 28, color: C.accent, lineHeight: 1, marginBottom: 6 }}>{num}</div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ color: C.muted, fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

function OfferCard({ offer, onAccept }) {
  const [busy, setBusy] = useState(false);
  const b = offer.bookings;
  const p = b?.properties;
  async function accept() { setBusy(true); await onAccept(b.id); setBusy(false); }
  return (
    <div style={{ ...s.card, border: `1px solid rgba(91,214,166,0.2)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{p?.address || 'Address unavailable'}</div>
          <div style={{ color: C.muted, fontSize: 14, marginBottom: 4 }}>{p?.sqft} sqft · {p?.beds} bed · {p?.baths} bath</div>
          <div style={{ color: C.muted, fontSize: 14, marginBottom: 14 }}>{b?.scheduled_date} at {b?.scheduled_time}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ padding: '6px 12px', borderRadius: 8, background: C.surfaceUp, border: `1px solid ${C.border}`, fontSize: 13 }}>Job: <strong>{fmt(b?.total_price)}</strong></div>
            <div style={{ padding: '6px 12px', borderRadius: 8, background: C.accentDim, border: `1px solid rgba(91,214,166,0.3)`, fontSize: 13, color: C.accent, fontWeight: 600 }}>Yours: {fmt(b?.total_price * 0.75)}</div>
          </div>
        </div>
        <button style={{ ...s.btn('primary'), height: 44, padding: '0 20px', opacity: busy ? 0.6 : 1, flexShrink: 0 }} onClick={accept} disabled={busy}>
          {busy ? 'Accepting…' : 'Accept'}
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
  const p = booking.properties;
  const bdg = s.badge(booking.status);

  useEffect(() => {
    supabase?.from('job_photos').select('*').eq('booking_id', booking.id).then(({ data }) => setPhotos(data || []));
  }, [booking.id, supabase]);

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

  return (
    <div style={s.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p?.address}</div>
          <div style={{ color: C.muted, fontSize: 14 }}>{booking.scheduled_date} at {booking.scheduled_time}</div>
          <div style={{ color: C.accent, fontWeight: 600, fontSize: 14, marginTop: 4 }}>Payout: {fmt(booking.total_price * 0.75)}</div>
        </div>
        <span style={bdg}>{bdg.label}</span>
      </div>

      {booking.status !== 'completed' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={s.btn('secondary')} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : '📸 Upload photos'}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={upload} />
          <button style={{ ...s.btn('primary'), opacity: completing ? 0.6 : 1 }} onClick={complete} disabled={completing}>
            {completing ? 'Updating…' : '✓ Mark complete'}
          </button>
        </div>
      )}

      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {photos.map(ph => (
            <div key={ph.id} style={{ width: 56, height: 56, borderRadius: 8, background: C.surfaceUp, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📸</div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ cleanerRow, profile, supabase, onRefresh }) {
  const [bio, setBio]   = useState(cleanerRow?.bio || '');
  const [zips, setZips] = useState((cleanerRow?.service_zips || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('cleaners').update({ bio, service_zips: zips.split(',').map(z => z.trim()).filter(Boolean) }).eq('id', cleanerRow.id);
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
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Zip codes you serve (comma-separated)</label>
          <input style={s.input} value={zips} onChange={e => setZips(e.target.value)} placeholder="80202, 80205, 80218" />
        </div>
        <button style={{ ...s.btn('primary'), height: 44, padding: '0 28px' }} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>

      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Account status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Background check', cleanerRow?.bg_check_status === 'cleared' ? '✓ Cleared' : cleanerRow?.bg_check_status === 'failed' ? '✗ Failed' : '⏳ Pending', cleanerRow?.bg_check_status === 'cleared' ? C.accent : C.muted],
            ['Account active', cleanerRow?.is_active ? '✓ Active' : '✗ Inactive', cleanerRow?.is_active ? C.accent : C.muted],
            ['Jobs completed', cleanerRow?.jobs_completed ?? 0, C.text],
            ['Average rating', cleanerRow?.rating > 0 ? `${Number(cleanerRow.rating).toFixed(1)} ⭐` : 'No ratings yet', C.text],
          ].map(([k, v, color]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{ color, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CleanerDashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const welcome = params.get('welcome') === '1';
  const isMobile = useIsMobile();

  const [supabase]      = useState(() => typeof window !== 'undefined' ? createClient() : null);
  const [tab, setTab]   = useState('offers');
  const [profile, setProfile]     = useState(null);
  const [cleanerRow, setCleanerRow] = useState(null);
  const [offers, setOffers]       = useState([]);
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showWelcome, setShowWelcome] = useState(welcome);

  useEffect(() => { if (supabase) init(); }, [supabase]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login?redirect=/cleaner'); return; }

    const [{ data: prof }, { data: cl }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('cleaners').select('*').eq('user_id', user.id).single(),
    ]);

    setProfile(prof);
    setCleanerRow(cl);

    if (cl) {
      await Promise.all([fetchOffers(cl.id), fetchJobs(cl.id)]);
    }
    setLoading(false);
  }

  async function fetchOffers(cid) {
    const { data } = await supabase.from('job_offers').select('*, bookings(id, total_price, scheduled_date, scheduled_time, properties(address, sqft, beds, baths))').eq('cleaner_id', cid).eq('status', 'sent');
    setOffers(data || []);
  }

  async function fetchJobs(cid) {
    const { data } = await supabase.from('bookings').select('*, properties(address, sqft, beds, baths)').eq('assigned_cleaner_id', cid).in('status', ['matched','in_progress','completed']).order('scheduled_date', { ascending: false });
    setJobs(data || []);
  }

  async function acceptOffer(bookingId) {
    await fetch(`/api/bookings/${bookingId}/accept`, { method: 'POST' });
    await Promise.all([fetchOffers(cleanerRow.id), fetchJobs(cleanerRow.id)]);
  }

  const earned = jobs.filter(j => j.status === 'completed').reduce((s, j) => s + j.total_price * 0.75, 0);
  const activeJobs = jobs.filter(j => ['matched','in_progress'].includes(j.status));
  const doneJobs   = jobs.filter(j => j.status === 'completed');

  return (
    <div style={s.page}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 40px', height: 64,
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(8,10,12,0.92)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <a href="/" style={s.logo}>✦ Sweepr</a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {profile?.role === 'admin' && (
            <button style={s.btn('secondary')} onClick={() => router.push('/admin')}>Admin</button>
          )}
          {!isMobile && <span style={{ color: C.muted, fontSize: 14 }}>{profile?.full_name}</span>}
          <button style={s.btn('secondary')} onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}>
            {isMobile ? '↩' : 'Sign out'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '28px 16px 80px' : '40px 24px 80px' }}>
        {loading ? (
          <div style={{ color: C.muted }}>Loading…</div>
        ) : (
          <>
            {showWelcome && <WelcomeBanner name={profile?.full_name?.split(' ')[0]} onDismiss={() => setShowWelcome(false)} />}

            <h1 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 28, letterSpacing: '-0.5px', marginBottom: 4 }}>
              Cleaner portal
            </h1>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>
              {cleanerRow?.bg_check_status === 'cleared' ? "You're cleared and active." : cleanerRow?.bg_check_status === 'pending' ? 'Background check pending — hang tight.' : 'Contact support about your account status.'}
            </p>

            {/* Stats — 2x2 on mobile, 4-col on desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
              <StatCard num={offers.length} label="Open offers" sub="Waiting for you" />
              <StatCard num={activeJobs.length} label="Active jobs" sub="In progress" />
              <StatCard num={cleanerRow?.jobs_completed ?? 0} label="Jobs done" sub="All time" />
              <StatCard num={`$${Math.round(earned)}`} label="Earned" sub="This period" />
            </div>

            {/* Tabs — scrollable on mobile */}
            <div style={{
              overflowX: isMobile ? 'auto' : undefined,
              WebkitOverflowScrolling: 'touch',
              marginBottom: 28,
              paddingBottom: isMobile ? 4 : 0,
            }}>
              <div style={{
                display: 'flex', gap: 4, background: C.surface, borderRadius: 12, padding: 4,
                width: 'fit-content', minWidth: isMobile ? 'max-content' : undefined,
              }}>
                {[
                  ['offers', `Offers${offers.length ? ` (${offers.length})` : ''}`],
                  ['active', 'Active jobs'],
                  ['history', 'History'],
                  ['profile', 'Profile'],
                ].map(([id, label]) => (
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

            {/* Offers */}
            {tab === 'offers' && (
              <div>
                {offers.length === 0 ? (
                  <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px', color: C.muted }}>
                    No open offers right now. Check back soon — new jobs come in daily.
                  </div>
                ) : offers.map(o => (
                  <OfferCard key={o.id} offer={o} onAccept={acceptOffer} />
                ))}
              </div>
            )}

            {/* Active jobs */}
            {tab === 'active' && (
              <div>
                {activeJobs.length === 0 ? (
                  <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px', color: C.muted }}>No active jobs. Accept an offer to get started.</div>
                ) : activeJobs.map(j => (
                  <JobCard key={j.id} booking={j} supabase={supabase} cleanerId={cleanerRow?.id} onRefresh={() => fetchJobs(cleanerRow?.id)} />
                ))}
              </div>
            )}

            {/* History */}
            {tab === 'history' && (
              <div>
                {doneJobs.length === 0 ? (
                  <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px', color: C.muted }}>No completed jobs yet.</div>
                ) : doneJobs.map(j => (
                  <JobCard key={j.id} booking={j} supabase={supabase} cleanerId={cleanerRow?.id} onRefresh={() => fetchJobs(cleanerRow?.id)} />
                ))}
                {doneJobs.length > 0 && (
                  <div style={{ ...s.card, marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                      <span style={{ color: C.muted }}>Total earned</span>
                      <span style={{ fontWeight: 700, color: C.accent }}>{fmt(earned)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
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
