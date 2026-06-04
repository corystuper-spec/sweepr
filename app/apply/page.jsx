'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

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
  page: {
    background: C.bg, minHeight: '100vh', color: C.text,
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: 68,
    borderBottom: `1px solid ${C.border}`,
    background: 'rgba(8,10,12,0.9)', backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 50,
  },
  logo: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 20, color: C.text, textDecoration: 'none',
  },
  body: { maxWidth: 680, margin: '0 auto', padding: '56px 24px 120px' },
  stepBar: {
    display: 'flex', gap: 4, marginBottom: 48,
  },
  stepSeg: (done, active) => ({
    flex: 1, height: 4, borderRadius: 4,
    background: done ? C.accent : active ? 'rgba(91,214,166,0.4)' : C.surface,
    transition: 'background 0.3s',
  }),
  label: {
    fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
    color: C.accent, textTransform: 'uppercase', marginBottom: 6,
    display: 'block',
  },
  h2: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 30, letterSpacing: '-0.5px', marginBottom: 6,
  },
  sub: { color: C.muted, fontSize: 15, lineHeight: 1.6, marginBottom: 36 },
  group: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, color: C.muted, marginBottom: 6, display: 'block', fontWeight: 500 },
  input: {
    width: '100%', height: 50, borderRadius: 12, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontSize: 15, padding: '0 14px',
    outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%', height: 50, borderRadius: 12, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontSize: 15, padding: '0 14px',
    outline: 'none', fontFamily: 'inherit', appearance: 'none', cursor: 'pointer',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', borderRadius: 12, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontSize: 15, padding: '14px',
    outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: 100,
    boxSizing: 'border-box', lineHeight: 1.6,
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  checkRow: {
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px',
    background: C.surfaceUp, border: `1px solid ${C.border}`,
    borderRadius: 12, cursor: 'pointer',
  },
  checkbox: (checked) => ({
    width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
    background: checked ? C.accent : C.surface,
    border: `2px solid ${checked ? C.accent : C.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, color: '#080A0C', fontWeight: 800, transition: 'all 0.15s',
  }),
  pill: (active) => ({
    padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500,
    background: active ? C.accentDim : C.surfaceUp,
    border: `1px solid ${active ? 'rgba(91,214,166,0.5)' : C.border}`,
    color: active ? C.accent : C.muted, transition: 'all 0.15s',
    fontFamily: 'inherit',
  }),
  notice: {
    background: 'rgba(255,170,50,0.08)', border: '1px solid rgba(255,170,50,0.25)',
    borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#FFAA32',
    lineHeight: 1.6, marginBottom: 24,
  },
  cta: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'rgba(8,10,12,0.96)', backdropFilter: 'blur(16px)',
    borderTop: `1px solid ${C.border}`, padding: '20px 24px',
    display: 'flex', justifyContent: 'center', zIndex: 50,
  },
  btnGreen: {
    height: 52, borderRadius: 12, border: 'none', background: C.accent,
    color: '#080A0C', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    padding: '0 40px', maxWidth: 680, width: '100%',
    transition: 'box-shadow 0.2s, transform 0.2s',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  },
  btnBack: {
    height: 40, borderRadius: 10, border: `1px solid ${C.border}`,
    background: 'transparent', color: C.muted, fontSize: 14, cursor: 'pointer',
    padding: '0 20px', fontFamily: 'inherit',
  },
  errorMsg: { color: C.error, fontSize: 13, marginTop: 6 },
};

const STEPS = ['Personal', 'Address', 'Identity', 'Experience', 'Review'];

const ID_TYPES = [
  "Driver's License",
  'Passport',
  'State ID',
  'Military ID',
  'Permanent Resident Card',
];

const EXPERIENCE_LEVELS = [
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  '5+ years',
];

const SERVICE_TYPES = [
  'Standard residential',
  'Deep cleaning',
  'Move-in / move-out',
  'Post-construction',
  'Office / commercial',
  'Airbnb / short-term rental',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

function Field({ label, children, hint }) {
  return (
    <div style={s.group}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function MaskedSSN({ value, onChange }) {
  const [visible, setVisible] = useState(false);

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 9);
    let formatted = raw;
    if (raw.length > 5) formatted = raw.slice(0,3) + '-' + raw.slice(3,5) + '-' + raw.slice(5);
    else if (raw.length > 3) formatted = raw.slice(0,3) + '-' + raw.slice(3);
    onChange(formatted);
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        style={s.input}
        type={visible ? 'text' : 'password'}
        placeholder="XXX-XX-XXXX"
        value={value}
        onChange={handleChange}
        autoComplete="off"
        inputMode="numeric"
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
          fontSize: 13, fontFamily: 'inherit',
        }}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export default function ApplyPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 0 — Personal
  const [firstName, setFirstName]     = useState('');
  const [lastName, setLastName]       = useState('');
  const [dob, setDob]                 = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');

  // Step 1 — Address
  const [street, setStreet]           = useState('');
  const [city, setCity]               = useState('');
  const [stateVal, setStateVal]       = useState('CO');
  const [zip, setZip]                 = useState('');

  // Step 2 — Identity
  const [idType, setIdType]           = useState('');
  const [idNumber, setIdNumber]       = useState('');
  const [ssn, setSsn]                 = useState('');
  const [workAuth, setWorkAuth]       = useState(false);
  const [ageConfirm, setAgeConfirm]   = useState(false);

  // Step 3 — Experience
  const [experience, setExperience]   = useState('');
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceZips, setServiceZips] = useState('');
  const [bio, setBio]                 = useState('');

  function toggleService(s) {
    setServiceTypes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function validate() {
    if (step === 0) {
      if (!firstName.trim()) return 'First name is required.';
      if (!lastName.trim())  return 'Last name is required.';
      if (!dob)              return 'Date of birth is required.';
      if (!email.includes('@')) return 'Enter a valid email address.';
      if (phone.replace(/\D/g, '').length < 10) return 'Enter a valid 10-digit phone number.';
    }
    if (step === 1) {
      if (!street.trim()) return 'Street address is required.';
      if (!city.trim())   return 'City is required.';
      if (!zip.trim() || zip.replace(/\D/g,'').length < 5) return 'Enter a valid 5-digit zip code.';
    }
    if (step === 2) {
      if (!idType)   return 'Select an ID type.';
      if (!idNumber.trim()) return 'Enter your ID number.';
      if (ssn.replace(/\D/g,'').length !== 9) return 'Enter your full 9-digit Social Security Number.';
      if (!workAuth) return 'You must confirm you are authorized to work in the United States.';
      if (!ageConfirm) return 'You must confirm you are 18 or older.';
    }
    if (step === 3) {
      if (!experience) return 'Select your experience level.';
      if (serviceTypes.length === 0) return 'Select at least one service type.';
      if (!serviceZips.trim()) return 'Enter at least one zip code you can serve.';
    }
    return '';
  }

  function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name:    firstName,
          last_name:     lastName,
          dob,
          email,
          phone,
          street,
          city,
          state:         stateVal,
          zip,
          id_type:       idType,
          id_number:     idNumber,
          ssn,
          work_authorized: workAuth,
          experience,
          service_types: serviceTypes,
          service_zips:  serviceZips.split(',').map(z => z.trim()).filter(Boolean),
          bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      router.push(`/onboard?email=${encodeURIComponent(email)}&name=${encodeURIComponent(firstName)}&appId=${data.application.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <nav style={{ ...s.nav, padding: isMobile ? '0 16px' : '0 48px' }}>
        <a href="/join" style={s.logo}>✦ Sweepr</a>
        <span style={{ color: C.muted, fontSize: 14 }}>
          Step {step + 1} of {STEPS.length}
        </span>
      </nav>

      <div style={s.body}>
        {/* Progress bar */}
        <div style={s.stepBar}>
          {STEPS.map((_, i) => (
            <div key={i} style={s.stepSeg(i < step, i === step)} />
          ))}
        </div>

        {/* ── Step 0: Personal info ── */}
        {step === 0 && (
          <div>
            <div style={s.label}>Step 1 of 5</div>
            <h2 style={s.h2}>Personal information</h2>
            <p style={s.sub}>This information is used for your background check and cleaner profile.</p>

            <div style={{ ...s.row2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <Field label="First name">
                <input style={s.input} placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus />
              </Field>
              <Field label="Last name">
                <input style={s.input} placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} />
              </Field>
            </div>

            <Field label="Date of birth">
              <input style={s.input} type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]} />
            </Field>

            <Field label="Email address">
              <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>

            <Field label="Phone number">
              <input style={s.input} type="tel" placeholder="(303) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} />
            </Field>
          </div>
        )}

        {/* ── Step 1: Address ── */}
        {step === 1 && (
          <div>
            <div style={s.label}>Step 2 of 5</div>
            <h2 style={s.h2}>Home address</h2>
            <p style={s.sub}>Your residential address. This stays private and is used for background check purposes only.</p>

            <Field label="Street address">
              <input style={s.input} placeholder="123 Main St, Apt 4B" value={street} onChange={e => setStreet(e.target.value)} autoFocus />
            </Field>

            <Field label="City">
              <input style={s.input} placeholder="Denver" value={city} onChange={e => setCity(e.target.value)} />
            </Field>

            <div style={{ ...s.row2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <Field label="State">
                <select style={s.select} value={stateVal} onChange={e => setStateVal(e.target.value)}>
                  {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </Field>
              <Field label="Zip code">
                <input style={s.input} placeholder="80202" value={zip} onChange={e => setZip(e.target.value)} inputMode="numeric" maxLength={5} />
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 2: Identity ── */}
        {step === 2 && (
          <div>
            <div style={s.label}>Step 3 of 5</div>
            <h2 style={s.h2}>Identity verification</h2>
            <p style={s.sub}>Required to run your background check. All information is encrypted and handled securely.</p>

            <div style={s.notice}>
              🔒 Your SSN and ID number are transmitted over an encrypted connection and stored securely.
              They are used solely for background check verification and are never shared with customers.
            </div>

            <Field label="Government-issued ID type">
              <select style={s.select} value={idType} onChange={e => setIdType(e.target.value)}>
                <option value="">Select ID type…</option>
                {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="ID number">
              <input
                style={s.input}
                placeholder="As it appears on your ID"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                autoComplete="off"
              />
            </Field>

            <Field
              label="Social Security Number"
              hint="Format: XXX-XX-XXXX. Required for background check. Never shared with customers."
            >
              <MaskedSSN value={ssn} onChange={setSsn} />
            </Field>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
              <label
                style={{ ...s.checkRow, border: `1px solid ${workAuth ? 'rgba(91,214,166,0.4)' : C.border}` }}
                onClick={() => setWorkAuth(v => !v)}
              >
                <div style={s.checkbox(workAuth)}>{workAuth ? '✓' : ''}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>
                    Authorized to work in the United States
                  </div>
                  <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
                    I confirm that I am legally authorized to work in the U.S. and understand that
                    Sweepr may verify this as part of the onboarding process.
                  </div>
                </div>
              </label>

              <label
                style={{ ...s.checkRow, border: `1px solid ${ageConfirm ? 'rgba(91,214,166,0.4)' : C.border}` }}
                onClick={() => setAgeConfirm(v => !v)}
              >
                <div style={s.checkbox(ageConfirm)}>{ageConfirm ? '✓' : ''}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>
                    I am 18 years of age or older
                  </div>
                  <div style={{ color: C.muted, fontSize: 13 }}>
                    Sweepr requires all cleaners to be at least 18 years old.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── Step 3: Experience ── */}
        {step === 3 && (
          <div>
            <div style={s.label}>Step 4 of 5</div>
            <h2 style={s.h2}>Your experience</h2>
            <p style={s.sub}>Tell us about your cleaning background so we can match you with the right jobs.</p>

            <Field label="Years of cleaning experience">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {EXPERIENCE_LEVELS.map(lvl => (
                  <button key={lvl} type="button" style={s.pill(experience === lvl)} onClick={() => setExperience(lvl)}>
                    {lvl}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Types of cleaning you offer">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {SERVICE_TYPES.map(t => (
                  <button key={t} type="button" style={s.pill(serviceTypes.includes(t))} onClick={() => toggleService(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label="Zip codes you can serve"
              hint="Comma-separated. Example: 80202, 80205, 80218"
            >
              <input
                style={s.input}
                placeholder="80202, 80205, 80218"
                value={serviceZips}
                onChange={e => setServiceZips(e.target.value)}
              />
            </Field>

            <Field
              label="Tell us about yourself (optional)"
              hint="Share your experience, why you want to join, or anything else relevant."
            >
              <textarea
                style={s.textarea}
                placeholder="I've been cleaning homes in Denver for 4 years and take pride in attention to detail…"
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </Field>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div>
            <div style={s.label}>Step 5 of 5</div>
            <h2 style={s.h2}>Review your application</h2>
            <p style={s.sub}>Everything look right? Submitting will kick off your background check.</p>

            {[
              {
                heading: 'Personal',
                rows: [
                  ['Name', `${firstName} ${lastName}`],
                  ['Date of birth', dob],
                  ['Email', email],
                  ['Phone', phone],
                ],
              },
              {
                heading: 'Address',
                rows: [
                  ['Street', street],
                  ['City / State / Zip', `${city}, ${stateVal} ${zip}`],
                ],
              },
              {
                heading: 'Identity',
                rows: [
                  ['ID type', idType],
                  ['ID number', idNumber],
                  ['SSN', '•••-••-' + ssn.replace(/\D/g,'').slice(-4)],
                  ['Work authorized', workAuth ? 'Yes ✓' : 'No'],
                ],
              },
              {
                heading: 'Experience',
                rows: [
                  ['Experience', experience],
                  ['Services', serviceTypes.join(', ')],
                  ['Zip codes', serviceZips],
                ],
              },
            ].map(section => (
              <div key={section.heading} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 14, marginBottom: 16, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 20px', borderBottom: `1px solid ${C.border}`,
                  fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
                  color: C.accent, textTransform: 'uppercase',
                }}>{section.heading}</div>
                {section.rows.map(([k, v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between', gap: 16,
                    padding: '12px 20px', borderBottom: `1px solid ${C.border}`,
                    fontSize: 14,
                  }}>
                    <span style={{ color: C.muted, flexShrink: 0 }}>{k}</span>
                    <span style={{ textAlign: 'right', wordBreak: 'break-word' }}>{v || '—'}</span>
                  </div>
                ))}
              </div>
            ))}

            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginTop: 20 }}>
              By submitting, you confirm all information is accurate and authorize Sweepr to run a
              background check. You'll be notified by email within 2–3 business days.
            </p>

            {error && <p style={{ color: C.error, fontSize: 13, marginTop: 12 }}>{error}</p>}
          </div>
        )}

        {error && step < 4 && (
          <p style={s.errorMsg}>{error}</p>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* Fixed CTA */}
      <div style={s.cta}>
        <div style={{ maxWidth: 680, width: '100%' }}>
          {step > 0 && (
            <div style={{ marginBottom: 10 }}>
              <button style={s.btnBack} onClick={() => { setStep(s => s - 1); setError(''); }}>
                ← Back
              </button>
            </div>
          )}
          <button
            style={s.btnGreen}
            disabled={loading}
            onClick={step < 4 ? handleNext : handleSubmit}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            {loading ? 'Submitting…' : step < 4 ? 'Continue →' : 'Submit application'}
          </button>
        </div>
      </div>
    </div>
  );
}
