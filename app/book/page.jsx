'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ADDONS, RECURRENCE, quote, standardPrice } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/client';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

// ─── Design tokens ─────────────────────────────────────────────────
const C = {
  bg:        '#080A0C',
  surface:   '#101316',
  surfaceUp: '#181C20',
  accent:    '#5BD6A6',
  accentDim: 'rgba(91,214,166,0.12)',
  accentGlow:'rgba(91,214,166,0.25)',
  border:    'rgba(255,255,255,0.07)',
  text:      '#F3F4F2',
  muted:     '#8A8F96',
  error:     '#FF6B6B',
};

const s = {
  page: { background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" },
  container: { maxWidth: 720, margin: '0 auto', padding: '0 24px 120px' },
  header: {
    padding: '24px 0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: `1px solid ${C.border}`, marginBottom: 40,
  },
  logo: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 20, color: C.text, textDecoration: 'none',
  },
  stepBar: { display: 'flex', gap: 8, alignItems: 'center' },
  stepDot: (active, done) => ({
    width: active ? 28 : 10, height: 10, borderRadius: 8,
    background: done ? C.accent : active ? C.accent : C.surface,
    border: `1px solid ${done || active ? C.accent : C.border}`,
    transition: 'all 0.3s',
    opacity: done || active ? 1 : 0.4,
  }),
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: '32px 28px', marginBottom: 24,
  },
  label: { fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', color: C.accent, textTransform: 'uppercase', marginBottom: 8 },
  h2: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 28, letterSpacing: '-0.5px', marginBottom: 8,
  },
  sub: { color: C.muted, fontSize: 15, marginBottom: 28, lineHeight: 1.6 },
  input: {
    width: '100%', height: 52, borderRadius: 12, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontSize: 15, padding: '0 16px',
    outline: 'none', fontFamily: 'inherit', marginBottom: 16,
  },
  row: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 },
  fieldLabel: { fontSize: 14, color: C.muted, width: 60, flexShrink: 0 },
  stepper: { display: 'flex', alignItems: 'center', gap: 0 },
  stepperBtn: {
    width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontSize: 20, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300,
  },
  stepperVal: {
    width: 60, textAlign: 'center', fontSize: 16, fontWeight: 600,
  },
  badge: {
    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
    background: C.accentDim, color: C.accent, border: `1px solid rgba(91,214,166,0.3)`,
    marginLeft: 8,
  },
  addonCard: (active) => ({
    background: active ? C.accentDim : C.surfaceUp,
    border: `1px solid ${active ? 'rgba(91,214,166,0.5)' : C.border}`,
    borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, transition: 'all 0.2s',
  }),
  timeSlot: (active) => ({
    padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
    background: active ? C.accentDim : C.surfaceUp,
    border: `1px solid ${active ? 'rgba(91,214,166,0.5)' : C.border}`,
    color: active ? C.accent : C.text, fontWeight: active ? 600 : 400,
    fontSize: 15, textAlign: 'center', flex: 1, transition: 'all 0.15s',
  }),
  lineItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: `1px solid ${C.border}`,
    fontSize: 15,
  },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 0 0', fontSize: 20, fontWeight: 700,
  },
  cta: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'rgba(8,10,12,0.95)', backdropFilter: 'blur(16px)',
    borderTop: `1px solid ${C.border}`, padding: '20px 24px',
    display: 'flex', justifyContent: 'center', zIndex: 50,
  },
  btnGreen: {
    height: 52, borderRadius: 12, border: 'none', background: C.accent,
    color: '#080A0C', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    padding: '0 40px', maxWidth: 720, width: '100%',
    transition: 'box-shadow 0.2s, transform 0.2s',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  },
  btnBack: {
    height: 42, borderRadius: 10, border: `1px solid ${C.border}`,
    background: 'transparent', color: C.muted, fontSize: 14, cursor: 'pointer',
    padding: '0 20px',
  },
  recurrencePill: (active) => ({
    padding: '8px 18px', borderRadius: 100, cursor: 'pointer', fontSize: 14, fontWeight: 500,
    background: active ? C.accentDim : C.surfaceUp,
    border: `1px solid ${active ? 'rgba(91,214,166,0.5)' : C.border}`,
    color: active ? C.accent : C.muted, transition: 'all 0.15s',
  }),
};

const TIME_SLOTS = ['8:00 AM', '10:30 AM', '1:00 PM', '3:30 PM'];
const STEPS = ['Address', 'Property', 'Services', 'Schedule', 'Review'];

function fmt(n) { return `$${n.toFixed(2)}`; }

function BookPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const isMobile = useIsMobile();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  // Step 0 — address
  const [addressInput, setAddressInput] = useState(searchParams.get('address') || '');
  const [lookupResult, setLookupResult] = useState(null);

  // Step 1 — property
  const [sqft, setSqft] = useState(1200);
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [propertyType, setPropertyType] = useState('Single Family');
  const [autoFilled, setAutoFilled] = useState(false);

  // Step 2 — services
  const [pickedAddons, setPickedAddons] = useState([]);
  const [recurrence, setRecurrence] = useState('once');

  // Step 3 — schedule
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Pre-fill from URL address on mount
  useEffect(() => {
    const addr = searchParams.get('address');
    if (addr) {
      lookupAddress(addr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookupAddress(addr) {
    if (!addr?.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/property-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
      });
      const data = await res.json();
      setLookupResult(data);
      if (data.found) {
        if (data.sqft)  { setSqft(data.sqft); }
        if (data.beds)  { setBeds(data.beds); }
        if (data.baths) { setBaths(data.baths); }
        if (data.property_type) { setPropertyType(data.property_type); }
        setAutoFilled(true);
      }
    } catch {
      setError('Lookup failed — you can still enter your details manually.');
    } finally {
      setLoading(false);
    }
  }

  function toggleAddon(id) {
    setPickedAddons(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }

  const property = {
    address: addressInput,
    sqft, beds, baths,
    property_type: propertyType,
    raw: lookupResult?.raw ?? null,
  };
  const priceQuote = quote({ property, pickedAddonIds: pickedAddons, recurrence });

  async function handleNext() {
    setError('');

    if (step === 0) {
      if (!addressInput.trim()) { setError('Please enter an address.'); return; }
      if (!lookupResult) await lookupAddress(addressInput);
      setStep(1);
      return;
    }
    if (step === 1) { setStep(2); return; }
    if (step === 2) { setStep(3); return; }
    if (step === 3) {
      if (!date) { setError('Please pick a date.'); return; }
      if (!time) { setError('Please pick a time slot.'); return; }
      setStep(4);
      return;
    }
    if (step === 4) {
      await submitBooking();
    }
  }

  async function submitBooking() {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/book');
        return;
      }
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property, pickedAddonIds: pickedAddons, recurrence, date, time }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBookingId(data.booking.id);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function ctaLabel() {
    if (loading) return 'Please wait…';
    if (step === 4) return 'Confirm booking';
    return 'Continue →';
  }

  const todayStr = new Date().toISOString().split('T')[0];

  if (done) {
    return (
      <div style={s.page}>
        <div style={{ ...s.container, paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
          <h2 style={{ ...s.h2, marginBottom: 16 }}>Booking submitted!</h2>
          <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            We're matching you with an available cleaner. You'll be notified
            as soon as someone accepts — you're only charged when that happens.
          </p>
          <div style={{ ...s.card, textAlign: 'left', marginBottom: 24 }}>
            <div style={{ color: C.muted, fontSize: 14, marginBottom: 4 }}>Booking ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: C.accent }}>{bookingId}</div>
          </div>
          <button
            style={{ ...s.btnGreen, display: 'inline-block', width: 'auto', padding: '0 32px' }}
            onClick={() => router.push('/dashboard')}
          >
            View my bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={{ ...s.container, padding: isMobile ? '0 16px 120px' : '0 24px 120px' }}>
        {/* Header */}
        <div style={{ ...s.header, padding: isMobile ? '16px 0 24px' : '24px 0 32px', marginBottom: isMobile ? 28 : 40 }}>
          <a href="/" style={s.logo}>✦ Sweepr</a>
          <div style={s.stepBar}>
            {STEPS.map((_, i) => (
              <div key={i} style={s.stepDot(i === step, i < step)} />
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 13 }}>
            Step {step + 1} of {STEPS.length}
          </div>
        </div>

        {/* ── Step 0: Address ── */}
        {step === 0 && (
          <div>
            <div style={s.label}>Step 1</div>
            <h2 style={s.h2}>What's your address?</h2>
            <p style={s.sub}>We'll look up your property details automatically.</p>
            <input
              style={s.input}
              placeholder="123 Main St, Denver, CO 80202"
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              autoFocus
            />
            {error && <p style={{ color: C.error, fontSize: 14, marginTop: -8, marginBottom: 12 }}>{error}</p>}
          </div>
        )}

        {/* ── Step 1: Property confirm ── */}
        {step === 1 && (
          <div>
            <div style={s.label}>Step 2</div>
            <h2 style={s.h2}>
              Confirm your property
              {autoFilled && <span style={s.badge}>Auto-filled</span>}
            </h2>
            <p style={s.sub}>
              {lookupResult?.found
                ? 'We pulled these details from public records — adjust if needed.'
                : "Enter your home's details for accurate pricing."}
            </p>
            <div style={s.card}>
              <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
                {lookupResult?.address || addressInput}
              </div>
              {[
                { label: 'Sq ft', value: sqft, set: setSqft, step: 50, min: 300, max: 10000, fmt: v => `${v} sqft` },
                { label: 'Beds', value: beds, set: setBeds, step: 1, min: 1, max: 10, fmt: v => `${v} bed${v !== 1 ? 's' : ''}` },
                { label: 'Baths', value: baths, set: setBaths, step: 1, min: 1, max: 10, fmt: v => `${v} bath${v !== 1 ? 's' : ''}` },
              ].map(field => (
                <div key={field.label} style={s.row}>
                  <div style={s.fieldLabel}>{field.label}</div>
                  <div style={s.stepper}>
                    <button
                      style={s.stepperBtn}
                      onClick={() => field.set(v => Math.max(field.min, v - field.step))}
                    >−</button>
                    <div style={s.stepperVal}>{field.fmt(field.value)}</div>
                    <button
                      style={s.stepperBtn}
                      onClick={() => field.set(v => Math.min(field.max, v + field.step))}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...s.card, padding: '20px 28px' }}>
              <div style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>Estimated base price</div>
              <div style={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                fontWeight: 800, fontSize: 36, color: C.accent,
              }}>
                {fmt(standardPrice(property))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Services ── */}
        {step === 2 && (
          <div>
            <div style={s.label}>Step 3</div>
            <h2 style={s.h2}>Customize your clean</h2>
            <p style={s.sub}>Start with a standard clean and add extras as needed.</p>

            {/* Standard clean card */}
            <div style={{ ...s.card, border: `1px solid rgba(91,214,166,0.4)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Standard Clean</div>
                  <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.5 }}>
                    Kitchen, bathrooms, living areas, bedrooms, floors, surfaces
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 22, color: C.accent, whiteSpace: 'nowrap', marginLeft: 16 }}>
                  {fmt(standardPrice(property))}
                </div>
              </div>
            </div>

            {/* Add-ons */}
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: C.muted }}>Add-ons</div>
            {ADDONS.map(addon => (
              <div
                key={addon.id}
                style={s.addonCard(pickedAddons.includes(addon.id))}
                onClick={() => toggleAddon(addon.id)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{addon.label}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: C.accent, fontWeight: 700 }}>+{fmt(addon.price)}</span>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: pickedAddons.includes(addon.id) ? C.accent : C.surfaceUp,
                    border: `1.5px solid ${pickedAddons.includes(addon.id) ? C.accent : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#080A0C', fontWeight: 700, fontSize: 13,
                  }}>
                    {pickedAddons.includes(addon.id) ? '✓' : ''}
                  </div>
                </div>
              </div>
            ))}

            {/* Recurrence */}
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, marginTop: 24, color: C.muted }}>
              How often?
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(RECURRENCE).map(([key, val]) => (
                <button key={key} style={s.recurrencePill(recurrence === key)} onClick={() => setRecurrence(key)}>
                  {val.label}
                  {val.discount > 0 && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: C.accent }}>
                      −{Math.round(val.discount * 100)}%
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Running total */}
            <div style={{ ...s.card, marginTop: 28, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 14, marginBottom: 8 }}>
                <span>Subtotal</span><span>{fmt(priceQuote.base_price + priceQuote.addons_total)}</span>
              </div>
              {priceQuote.addons_total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 13, marginBottom: 8 }}>
                  <span>Add-ons</span><span>+{fmt(priceQuote.addons_total)}</span>
                </div>
              )}
              {RECURRENCE[recurrence].discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: C.accent, fontSize: 13, marginBottom: 8 }}>
                  <span>{RECURRENCE[recurrence].label} discount</span>
                  <span>−{Math.round(RECURRENCE[recurrence].discount * 100)}%</span>
                </div>
              )}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                <span>Total</span><span style={{ color: C.accent }}>{fmt(priceQuote.total_price)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Schedule ── */}
        {step === 3 && (
          <div>
            <div style={s.label}>Step 4</div>
            <h2 style={s.h2}>When should we come?</h2>
            <p style={s.sub}>Pick a date and your preferred arrival window.</p>
            <div style={s.card}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>Date</div>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{ ...s.input, marginBottom: 0, colorScheme: 'dark' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>Arrival window</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
                  {TIME_SLOTS.map(slot => (
                    <button key={slot} style={{ ...s.timeSlot(time === slot), flex: undefined }} onClick={() => setTime(slot)}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <p style={{ color: C.error, fontSize: 14 }}>{error}</p>}
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div>
            <div style={s.label}>Step 5</div>
            <h2 style={s.h2}>Review your booking</h2>
            <p style={s.sub}>Everything look right? Submit and we'll match you with a cleaner.</p>
            <div style={s.card}>
              <div style={s.lineItem}>
                <span style={{ color: C.muted }}>Address</span>
                <span style={{ maxWidth: 320, textAlign: 'right', fontSize: 14 }}>{addressInput}</span>
              </div>
              <div style={s.lineItem}>
                <span style={{ color: C.muted }}>Property</span>
                <span>{sqft} sqft · {beds} bed · {baths} bath</span>
              </div>
              <div style={s.lineItem}>
                <span style={{ color: C.muted }}>Standard clean</span>
                <span>{fmt(priceQuote.base_price)}</span>
              </div>
              {priceQuote.addons.map(a => (
                <div key={a.id} style={s.lineItem}>
                  <span style={{ color: C.muted }}>{a.label}</span>
                  <span>+{fmt(a.price)}</span>
                </div>
              ))}
              <div style={s.lineItem}>
                <span style={{ color: C.muted }}>Frequency</span>
                <span>{RECURRENCE[recurrence].label}</span>
              </div>
              <div style={s.lineItem}>
                <span style={{ color: C.muted }}>Date &amp; time</span>
                <span>{date} at {time}</span>
              </div>
              {RECURRENCE[recurrence].discount > 0 && (
                <div style={{ ...s.lineItem, color: C.accent }}>
                  <span>Recurring discount</span>
                  <span>−{Math.round(RECURRENCE[recurrence].discount * 100)}%</span>
                </div>
              )}
              <div style={s.totalRow}>
                <span>Total</span>
                <span style={{ color: C.accent }}>{fmt(priceQuote.total_price)}</span>
              </div>
            </div>
            <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
              Your card is <strong style={{ color: C.text }}>not charged</strong> until a cleaner accepts your job.
            </p>
            {error && <p style={{ color: C.error, fontSize: 14, marginTop: 12, textAlign: 'center' }}>{error}</p>}
          </div>
        )}

        {/* Spacer for fixed CTA */}
        <div style={{ height: 100 }} />
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={s.cta}>
        <div style={{ maxWidth: 720, width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {step > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
              <button style={s.btnBack} onClick={() => setStep(s => s - 1)}>← Back</button>
            </div>
          )}
          <button
            style={s.btnGreen}
            disabled={loading}
            onClick={handleNext}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            {ctaLabel()}
          </button>
          {step >= 2 && (
            <div style={{ textAlign: 'center', marginTop: 10, color: C.muted, fontSize: 13 }}>
              Total: <strong style={{ color: C.accent }}>{fmt(priceQuote.total_price)}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#080A0C', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8F96' }}>
        Loading…
      </div>
    }>
      <BookPageInner />
    </Suspense>
  );
}
