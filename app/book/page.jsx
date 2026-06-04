'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ADDONS, RECURRENCE, quote, standardPrice } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/client';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

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
  warning:   '#FFAA32',
};

const s = {
  page: { background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" },
  container: { maxWidth: 720, margin: '0 auto', padding: '0 24px 140px' },
  header: {
    padding: '24px 0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: `1px solid ${C.border}`, marginBottom: 40,
  },
  logo: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 20, color: C.text, textDecoration: 'none',
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
    outline: 'none', fontFamily: 'inherit', marginBottom: 0,
    boxSizing: 'border-box',
  },
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: '32px 28px', marginBottom: 20,
  },
  row: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 },
  fieldLabel: { fontSize: 14, color: C.muted, width: 60, flexShrink: 0 },
  stepper: { display: 'flex', alignItems: 'center', gap: 0 },
  stepperBtn: {
    width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontSize: 20, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300,
  },
  stepperVal: { width: 72, textAlign: 'center', fontSize: 15, fontWeight: 600 },
  badge: {
    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
    background: C.accentDim, color: C.accent, border: `1px solid rgba(91,214,166,0.3)`,
    marginLeft: 8,
  },
  addonCard: (active, disabled) => ({
    background: active ? C.accentDim : C.surfaceUp,
    border: `1px solid ${active ? 'rgba(91,214,166,0.5)' : C.border}`,
    borderRadius: 12, padding: '16px 18px', cursor: disabled ? 'default' : 'pointer',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, transition: 'all 0.2s',
  }),
  timeSlot: (active, disabled) => ({
    padding: '14px 12px', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
    background: active ? C.accentDim : disabled ? 'rgba(255,255,255,0.02)' : C.surfaceUp,
    border: `1px solid ${active ? 'rgba(91,214,166,0.5)' : C.border}`,
    color: active ? C.accent : disabled ? C.muted : C.text,
    fontWeight: active ? 600 : 400,
    fontSize: 14, textAlign: 'center', transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1,
  }),
  lineItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: `1px solid ${C.border}`, fontSize: 15,
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
  notice: (color = C.warning) => ({
    background: `${color}14`, border: `1px solid ${color}40`,
    borderRadius: 12, padding: '14px 18px', fontSize: 13, color,
    lineHeight: 1.6, marginBottom: 20,
  }),
};

const TIME_SLOTS = ['8:00 AM', '10:30 AM', '1:00 PM', '3:30 PM'];
const STEPS = ['Address', 'Property', 'Services', 'Schedule', 'Review', 'Payment'];

function fmt(n) { return `$${Number(n).toFixed(2)}`; }

// ── Address autocomplete ─────────────────────────────────────────
function AddressAutocomplete({ value, onChange, onSelect }) {
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const [activeIdx, setIdx]   = useState(-1);
  const debounceRef           = useRef(null);

  function handleInput(e) {
    const val = e.target.value;
    onChange(val);
    setIdx(-1);
    clearTimeout(debounceRef.current);
    if (val.length < 3) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address-search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch { /* ignore */ }
    }, 400);
  }

  function pick(addr) {
    onChange(addr);
    setResults([]); setOpen(false);
    onSelect(addr);
  }

  function onKeyDown(e) {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(results[activeIdx].address); }
    if (e.key === 'Escape')    { setOpen(false); }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        style={s.input}
        placeholder="123 Main St, Denver, CO 80202"
        value={value}
        onChange={handleInput}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoFocus
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              style={{
                width: '100%', padding: '13px 16px', border: 'none', textAlign: 'left',
                background: i === activeIdx ? C.accentDim : 'transparent',
                color: C.text, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                borderBottom: i < results.length - 1 ? `1px solid ${C.border}` : 'none',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}
              onMouseDown={() => pick(r.address)}
            >
              <span style={{ color: C.accent, flexShrink: 0 }}>📍</span>
              <span style={{ lineHeight: 1.4 }}>{r.address}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stripe Payment Step ──────────────────────────────────────────
function PaymentStep({ onConfirmRef, isMobile }) {
  const stripe   = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!stripe || !elements) { onConfirmRef(null); return; }
    onConfirmRef(async () => {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: { return_url: window.location.origin + '/dashboard' },
      });
      if (error) throw new Error(error.message);
      return setupIntent.payment_method;
    });
  }, [stripe, elements, onConfirmRef]);

  return (
    <PaymentElement
      options={{
        layout: 'tabs',
        wallets: { applePay: 'auto', googlePay: 'auto' },
      }}
    />
  );
}

// ── Main booking flow ────────────────────────────────────────────
function BookPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const isMobile     = useIsMobile();

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);
  const [bookingId, setBookingId] = useState(null);

  // Step 0 — Address
  const [addressInput, setAddressInput] = useState(searchParams.get('address') || '');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Step 1 — Property
  const [sqft, setSqft]           = useState(1200);
  const [beds, setBeds]           = useState(3);
  const [baths, setBaths]         = useState(2);
  const [propertyType, setPropertyType] = useState('Single Family');
  const [autoFilled, setAutoFilled]     = useState(false);
  const [lastCleaned, setLastCleaned]   = useState(''); // 'recent' | 'old'

  // Step 2 — Services
  const [pickedAddons, setPickedAddons] = useState([]);
  const [recurrence, setRecurrence]     = useState('once');

  // Step 3 — Schedule
  const [date, setDate]                   = useState('');
  const [time, setTime]                   = useState('');
  const [slotAvailability, setSlotAvailability] = useState(null);
  const [availLoading, setAvailLoading]   = useState(false);

  // Step 5 — Payment
  const [clientSecret, setClientSecret]   = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const confirmPaymentRef = useRef(null);

  const stripeAppearance = {
    theme: 'night',
    variables: {
      colorPrimary:     '#5BD6A6',
      colorBackground:  '#181C20',
      colorText:        '#F3F4F2',
      colorDanger:      '#FF6B6B',
      colorTextPlaceholder: '#8A8F96',
      fontFamily:       "'Hanken Grotesk', system-ui, sans-serif",
      borderRadius:     '12px',
      spacingUnit:      '4px',
    },
    rules: {
      '.Input': { border: '1px solid rgba(255,255,255,0.07)', padding: '12px 14px' },
      '.Tab': { border: '1px solid rgba(255,255,255,0.07)' },
    },
  };

  // Pre-fill from URL
  useEffect(() => {
    const addr = searchParams.get('address');
    if (addr) lookupAddress(addr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Force deep_clean if last cleaning was >35 days
  useEffect(() => {
    if (lastCleaned === 'old') {
      setPickedAddons(prev => prev.includes('deep_clean') ? prev : [...prev, 'deep_clean']);
    }
  }, [lastCleaned]);

  // Load slot availability when date changes
  useEffect(() => {
    if (!date) { setSlotAvailability(null); return; }
    setAvailLoading(true);
    setTime('');
    fetch(`/api/availability?date=${date}`)
      .then(r => r.json())
      .then(d => { setSlotAvailability(d.availability || null); setAvailLoading(false); })
      .catch(() => setAvailLoading(false));
  }, [date]);

  // Fetch Stripe SetupIntent when entering payment step
  useEffect(() => {
    if (step !== 5 || clientSecret || !stripePromise) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login?redirect=/book'); return; }
      fetch('/api/stripe/setup-intent', { method: 'POST' })
        .then(r => r.json())
        .then(d => { if (d.clientSecret) setClientSecret(d.clientSecret); })
        .catch(console.error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function lookupAddress(addr) {
    if (!addr?.trim()) return;
    setLookupLoading(true);
    try {
      const res  = await fetch('/api/property-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
      });
      const data = await res.json();
      setLookupResult(data);
      if (data.found) {
        if (data.sqft)          setSqft(data.sqft);
        if (data.beds)          setBeds(data.beds);
        if (data.baths)         setBaths(data.baths);
        if (data.property_type) setPropertyType(data.property_type);
        setAutoFilled(true);
      }
    } catch { /* silent */ }
    setLookupLoading(false);
  }

  function toggleAddon(id) {
    if (id === 'deep_clean' && lastCleaned === 'old') return; // locked
    setPickedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }

  const property = { address: addressInput, sqft, beds, baths, property_type: propertyType, raw: lookupResult?.raw ?? null };
  const priceQuote = quote({ property, pickedAddonIds: pickedAddons, recurrence });
  const todayStr = new Date().toISOString().split('T')[0];

  function ctaLabel() {
    if (loading) return 'Please wait…';
    if (step === 4) return 'Continue to payment →';
    if (step === 5) return stripePromise ? 'Confirm booking →' : 'Confirm booking (no payment)';
    return 'Continue →';
  }

  async function handleNext() {
    setError('');

    if (step === 0) {
      if (!addressInput.trim()) { setError('Please enter your address.'); return; }
      if (!lookupResult) await lookupAddress(addressInput);
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!lastCleaned) { setError('Please tell us when your home was last professionally cleaned.'); return; }
      setStep(2);
      return;
    }

    if (step === 2) { setStep(3); return; }

    if (step === 3) {
      if (!date) { setError('Please pick a date.'); return; }
      if (!time) { setError('Please pick an arrival window.'); return; }
      const slot = slotAvailability?.find(a => a.slot === time);
      if (slot && !slot.canBook) { setError('That time slot is fully booked. Please choose another.'); return; }
      setStep(4);
      return;
    }

    if (step === 4) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?redirect=/book'); return; }
      setStep(5);
      return;
    }

    if (step === 5) {
      setLoading(true);
      let pmId = null;

      if (stripePromise && confirmPaymentRef.current) {
        try {
          pmId = await confirmPaymentRef.current();
        } catch (e) {
          setError(e.message || 'Payment failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      await submitBooking(pmId);
    }
  }

  async function submitBooking(pmId) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          pickedAddonIds:  pickedAddons,
          recurrence,
          date,
          time,
          paymentMethodId: pmId ?? undefined,
        }),
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

  const px = isMobile ? '16px' : '24px';

  if (done) {
    return (
      <div style={s.page}>
        <div style={{ ...s.container, paddingTop: 80, textAlign: 'center', padding: `80px ${px}` }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
          <h2 style={{ ...s.h2, marginBottom: 16 }}>Booking submitted!</h2>
          <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            We're matching you with an available cleaner. You'll get notified when someone accepts —
            your card is only charged at that point.
          </p>
          <div style={{ ...s.card, textAlign: 'left', marginBottom: 24 }}>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>Booking ID</div>
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
      <div style={{ ...s.container, padding: `0 ${px} 140px` }}>

        {/* Header */}
        <div style={{
          ...s.header,
          padding: isMobile ? '16px 0 24px' : '24px 0 32px',
          marginBottom: isMobile ? 28 : 40,
        }}>
          <a href="/" style={s.logo}>✦ Sweepr</a>
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 24 : 8, height: 8, borderRadius: 8,
                background: i < step ? C.accent : i === step ? C.accent : C.surface,
                border: `1px solid ${i <= step ? C.accent : C.border}`,
                transition: 'all 0.3s',
                opacity: i <= step ? 1 : 0.4,
              }} />
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 13 }}>{step + 1} / {STEPS.length}</div>
        </div>

        {/* ── Step 0: Address ── */}
        {step === 0 && (
          <div>
            <div style={s.label}>Step 1 of {STEPS.length}</div>
            <h2 style={s.h2}>What's your address?</h2>
            <p style={s.sub}>Start typing — we'll suggest addresses and look up your home automatically.</p>
            <AddressAutocomplete
              value={addressInput}
              onChange={setAddressInput}
              onSelect={lookupAddress}
            />
            {lookupLoading && (
              <p style={{ color: C.muted, fontSize: 13, marginTop: 10 }}>Looking up your property…</p>
            )}
            {error && <p style={{ color: C.error, fontSize: 14, marginTop: 10 }}>{error}</p>}
          </div>
        )}

        {/* ── Step 1: Property + cleaning history ── */}
        {step === 1 && (
          <div>
            <div style={s.label}>Step 2 of {STEPS.length}</div>
            <h2 style={s.h2}>
              Confirm your property
              {autoFilled && <span style={s.badge}>Auto-filled ✓</span>}
            </h2>
            <p style={s.sub}>
              {lookupResult?.found
                ? 'Pulled from public records — adjust anything that looks off.'
                : "Enter your home's details for accurate pricing."}
            </p>

            <div style={s.card}>
              <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
                {lookupResult?.address || addressInput}
              </div>
              {[
                { label: 'Sq ft', value: sqft, set: setSqft, step: 50, min: 300, max: 10000, fmt: v => `${v} sqft` },
                { label: 'Beds',  value: beds, set: setBeds, step: 1,  min: 1,   max: 10,    fmt: v => `${v} bed${v !== 1 ? 's' : ''}` },
                { label: 'Baths', value: baths, set: setBaths, step: 1, min: 1,  max: 10,    fmt: v => `${v} bath${v !== 1 ? 's' : ''}` },
              ].map(field => (
                <div key={field.label} style={s.row}>
                  <div style={s.fieldLabel}>{field.label}</div>
                  <div style={s.stepper}>
                    <button style={s.stepperBtn} onClick={() => field.set(v => Math.max(field.min, v - field.step))}>−</button>
                    <div style={s.stepperVal}>{field.fmt(field.value)}</div>
                    <button style={s.stepperBtn} onClick={() => field.set(v => Math.min(field.max, v + field.step))}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Estimated base price */}
            <div style={{ ...s.card, padding: '18px 24px', marginBottom: 24 }}>
              <div style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>Estimated base price</div>
              <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 32, color: C.accent }}>
                {fmt(standardPrice(property))}
              </div>
            </div>

            {/* Deep clean question */}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
                When was your last professional cleaning?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { value: 'recent', icon: '✅', title: 'Within the last 35 days', sub: 'A standard clean is all you need.' },
                  { value: 'old',    icon: '🧹', title: '35+ days ago — or never', sub: 'A deep clean add-on (+$60) will be required.' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    style={{
                      padding: '16px 18px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      background: lastCleaned === opt.value ? C.accentDim : C.surfaceUp,
                      border: `1.5px solid ${lastCleaned === opt.value ? 'rgba(91,214,166,0.6)' : C.border}`,
                      color: C.text, fontFamily: 'inherit',
                      display: 'flex', gap: 14, alignItems: 'flex-start', width: '100%',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => setLastCleaned(opt.value)}
                  >
                    <span style={{ fontSize: 24 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3, color: lastCleaned === opt.value ? C.accent : C.text }}>
                        {opt.title}
                      </div>
                      <div style={{ color: C.muted, fontSize: 13 }}>{opt.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
              {lastCleaned === 'old' && (
                <div style={{ ...s.notice(C.warning), marginTop: 14 }}>
                  🧹 Deep clean (+$60) has been added and is required for homes that haven't been professionally cleaned in over 35 days.
                </div>
              )}
            </div>
            {error && <p style={{ color: C.error, fontSize: 14, marginTop: 8 }}>{error}</p>}
          </div>
        )}

        {/* ── Step 2: Services ── */}
        {step === 2 && (
          <div>
            <div style={s.label}>Step 3 of {STEPS.length}</div>
            <h2 style={s.h2}>Customize your clean</h2>
            <p style={s.sub}>Standard clean is always included. Add extras for a deeper job.</p>

            <div style={{ ...s.card, border: `1px solid rgba(91,214,166,0.35)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Standard Clean</div>
                  <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.5 }}>Kitchen, bathrooms, living areas, bedrooms, floors, surfaces</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 22, color: C.accent, whiteSpace: 'nowrap', marginLeft: 16 }}>
                  {fmt(standardPrice(property))}
                </div>
              </div>
            </div>

            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add-ons</div>
            {ADDONS.map(addon => {
              const isActive   = pickedAddons.includes(addon.id);
              const isRequired = addon.id === 'deep_clean' && lastCleaned === 'old';
              return (
                <div
                  key={addon.id}
                  style={s.addonCard(isActive, isRequired)}
                  onClick={() => !isRequired && toggleAddon(addon.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {addon.label}
                      {isRequired && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,170,50,0.15)', color: C.warning, border: '1px solid rgba(255,170,50,0.3)' }}>
                          REQUIRED
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: C.accent, fontWeight: 700 }}>+{fmt(addon.price)}</span>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: isActive ? C.accent : C.surfaceUp,
                      border: `1.5px solid ${isActive ? C.accent : C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#080A0C', fontWeight: 700, fontSize: 13,
                    }}>
                      {isActive ? '✓' : ''}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, marginTop: 24, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Frequency
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(RECURRENCE).map(([key, val]) => (
                <button key={key} style={s.recurrencePill(recurrence === key)} onClick={() => setRecurrence(key)}>
                  {val.label}
                  {val.discount > 0 && <span style={{ marginLeft: 6, fontSize: 11, color: C.accent }}>−{Math.round(val.discount * 100)}%</span>}
                </button>
              ))}
            </div>

            <div style={{ ...s.card, marginTop: 28, padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 14, marginBottom: 8 }}>
                <span>Subtotal</span><span>{fmt(priceQuote.base_price + priceQuote.addons_total)}</span>
              </div>
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
            <div style={s.label}>Step 4 of {STEPS.length}</div>
            <h2 style={s.h2}>When should we come?</h2>
            <p style={s.sub}>Pick a date and arrival window. We'll match you with an available cleaner.</p>
            <div style={s.card}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 10 }}>Date</div>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{ ...s.input, colorScheme: 'dark' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>
                  Arrival window
                  {availLoading && <span style={{ marginLeft: 8, color: C.muted, fontSize: 12 }}>Checking availability…</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
                  {TIME_SLOTS.map(slot => {
                    const avail = slotAvailability?.find(a => a.slot === slot);
                    const unavailable = avail && !avail.canBook;
                    const spotsLeft = avail?.available ?? null;
                    return (
                      <button
                        key={slot}
                        style={{ ...s.timeSlot(time === slot, unavailable), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                        onClick={() => !unavailable && setTime(slot)}
                        disabled={unavailable}
                      >
                        <span style={{ fontWeight: time === slot ? 700 : 400 }}>{slot}</span>
                        {avail && (
                          <span style={{
                            fontSize: 10, fontWeight: 600,
                            color: unavailable ? C.error : spotsLeft <= 1 ? C.warning : C.accent,
                          }}>
                            {unavailable ? 'Full' : spotsLeft === 1 ? 'Last spot' : `${spotsLeft} open`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {date && !avail && !availLoading && (
                  <p style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>Select a date to see availability.</p>
                )}
              </div>
            </div>
            {error && <p style={{ color: C.error, fontSize: 14 }}>{error}</p>}
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div>
            <div style={s.label}>Step 5 of {STEPS.length}</div>
            <h2 style={s.h2}>Review your booking</h2>
            <p style={s.sub}>Everything look right? Your card will be added in the next step — you're only charged when a cleaner accepts.</p>
            <div style={s.card}>
              {[
                ['Address',          addressInput],
                ['Property',         `${sqft} sqft · ${beds} bed · ${baths} bath`],
                ['Standard clean',   fmt(priceQuote.base_price)],
                ...priceQuote.addons.map(a => [a.label, `+${fmt(a.price)}`]),
                ['Frequency',        RECURRENCE[recurrence].label],
                ['Date & time',      `${date} at ${time}`],
                ...(RECURRENCE[recurrence].discount > 0
                  ? [[`${RECURRENCE[recurrence].label} discount`, `−${Math.round(RECURRENCE[recurrence].discount * 100)}%`]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} style={s.lineItem}>
                  <span style={{ color: C.muted }}>{k}</span>
                  <span style={{ textAlign: 'right', fontSize: 14, maxWidth: 260 }}>{v}</span>
                </div>
              ))}
              <div style={s.totalRow}>
                <span>Total</span>
                <span style={{ color: C.accent }}>{fmt(priceQuote.total_price)}</span>
              </div>
            </div>
            <div style={{ ...s.notice(C.accent), textAlign: 'center', fontSize: 14 }}>
              💳 You'll add a payment method on the next screen. Your card is <strong>not charged</strong> until a cleaner accepts.
            </div>
          </div>
        )}

        {/* ── Step 5: Payment ── */}
        {step === 5 && (
          <div>
            <div style={s.label}>Step 6 of {STEPS.length}</div>
            <h2 style={s.h2}>Payment method</h2>
            <p style={s.sub}>
              Add your card or use Apple / Google Pay. You're only charged when a cleaner accepts your job.
            </p>

            {!stripePromise ? (
              <div style={s.card}>
                <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7 }}>
                  Payment collection isn't configured yet. You can still book and we'll collect payment separately.
                </p>
              </div>
            ) : !clientSecret ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '40px 24px', color: C.muted }}>
                Loading secure payment form…
              </div>
            ) : (
              <div style={s.card}>
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: stripeAppearance }}
                >
                  <PaymentStep
                    onConfirmRef={fn => { confirmPaymentRef.current = fn; }}
                    isMobile={isMobile}
                  />
                </Elements>
              </div>
            )}

            <div style={{ ...s.notice(C.muted), marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span>🔒</span>
              <span>Payments are processed securely by Stripe. Sweepr never stores your full card number.</span>
            </div>
            {error && <p style={{ color: C.error, fontSize: 14, marginTop: 12, textAlign: 'center' }}>{error}</p>}
          </div>
        )}

        <div style={{ height: 120 }} />
      </div>

      {/* ── Fixed CTA ── */}
      <div style={s.cta}>
        <div style={{ maxWidth: 720, width: '100%' }}>
          {step > 0 && (
            <div style={{ marginBottom: 10 }}>
              <button style={s.btnBack} onClick={() => { setStep(s => s - 1); setError(''); }}>
                ← Back
              </button>
            </div>
          )}
          <button
            style={{
              ...s.btnGreen,
              background: (step === 5 && !stripePromise) ? C.accent : C.accent,
              opacity: loading ? 0.7 : 1,
            }}
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
