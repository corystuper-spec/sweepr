'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Design tokens ────────────────────────────────────────────────
const C = {
  bg:         '#080A0C',
  surface:    '#101316',
  surfaceUp:  '#181C20',
  accent:     '#5BD6A6',
  accentDim:  'rgba(91,214,166,0.12)',
  accentGlow: 'rgba(91,214,166,0.25)',
  border:     'rgba(255,255,255,0.07)',
  text:       '#F3F4F2',
  muted:      '#8A8F96',
};

const styles = {
  // Layout
  page: { background: C.bg, minHeight: '100vh', color: C.text },

  // Nav
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: 72,
    background: 'rgba(8,10,12,0.85)', backdropFilter: 'blur(16px)',
    borderBottom: `1px solid ${C.border}`,
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  navLogoText: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 22, color: C.text, letterSpacing: '-0.5px',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: 32, listStyle: 'none' },
  navLink: {
    color: C.muted, textDecoration: 'none', fontSize: 15, fontWeight: 500,
    transition: 'color 0.2s',
  },
  navCta: { display: 'flex', gap: 12, alignItems: 'center' },
  btnGhost: {
    padding: '0 20px', height: 42, borderRadius: 12, border: `1px solid ${C.border}`,
    background: 'transparent', color: C.text, fontSize: 15, fontWeight: 500,
    cursor: 'pointer', transition: 'border-color 0.2s',
  },
  btnGreen: {
    padding: '0 24px', height: 42, borderRadius: 12, border: 'none',
    background: C.accent, color: '#080A0C', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s',
  },
  btnGreenLg: {
    padding: '0 32px', height: 52, borderRadius: 12, border: 'none',
    background: C.accent, color: '#080A0C', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  },

  // Hero
  hero: {
    maxWidth: 1200, margin: '0 auto', padding: '100px 48px 80px',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
  },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: C.accentDim, border: `1px solid rgba(91,214,166,0.3)`,
    borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 600,
    color: C.accent, marginBottom: 28,
  },
  h1: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 'clamp(42px, 5vw, 64px)',
    lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 24,
  },
  heroSub: { fontSize: 18, color: C.muted, lineHeight: 1.6, marginBottom: 40, maxWidth: 460 },
  addressRow: { display: 'flex', gap: 12, marginBottom: 28 },
  addressInput: {
    flex: 1, height: 52, borderRadius: 12, border: `1px solid ${C.border}`,
    background: C.surface, color: C.text, fontSize: 15, padding: '0 16px',
    outline: 'none', fontFamily: 'inherit',
  },
  avatarRow: { display: 'flex', alignItems: 'center', gap: 12 },
  avatarStack: { display: 'flex' },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', border: `2px solid ${C.bg}`,
    marginLeft: -10, background: C.surface, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.accent,
  },
  ratingText: { color: C.muted, fontSize: 14 },
  ratingNum: { color: C.text, fontWeight: 700 },

  // Hero card
  heroCard: {
    borderRadius: 24, overflow: 'hidden', position: 'relative',
    background: `linear-gradient(135deg, ${C.surface} 0%, #181C20 100%)`,
    border: `1px solid ${C.border}`, minHeight: 420,
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
  },
  heroCardInner: {
    padding: 32,
    background: 'linear-gradient(to top, rgba(8,10,12,0.9) 0%, transparent 100%)',
  },
  floatingCard: {
    position: 'absolute', top: 24, right: 24, borderRadius: 16,
    background: 'rgba(16,19,22,0.92)', backdropFilter: 'blur(12px)',
    border: `1px solid ${C.border}`, padding: '14px 18px',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  bigStar: { fontSize: 28, lineHeight: 1 },
  floatNum: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 26, color: C.text, lineHeight: 1,
  },
  floatSub: { fontSize: 12, color: C.muted },

  // Trust band
  trust: {
    maxWidth: 1200, margin: '0 auto 80px', padding: '0 48px',
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
  },
  trustCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: '28px 32px',
    display: 'flex', alignItems: 'flex-start', gap: 16,
    transition: 'transform 0.2s',
  },
  trustIcon: {
    width: 44, height: 44, borderRadius: 12, background: C.accentDim,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, flexShrink: 0,
  },

  // Section
  section: { maxWidth: 1200, margin: '0 auto 100px', padding: '0 48px' },
  sectionLabel: {
    fontSize: 12, fontWeight: 700, letterSpacing: '2px', color: C.accent,
    textTransform: 'uppercase', marginBottom: 16,
  },
  h2: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 'clamp(30px, 4vw, 48px)',
    letterSpacing: '-1.5px', marginBottom: 56,
  },

  // How it works cards
  howGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 },
  howCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: '36px 28px',
    transition: 'transform 0.25s, box-shadow 0.25s', cursor: 'default',
  },
  howNum: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 48, color: C.accentDim,
    lineHeight: 1, marginBottom: 20,
  },
  howTitle: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 22, marginBottom: 12,
  },
  howDesc: { color: C.muted, lineHeight: 1.6, fontSize: 15 },

  // Pricing dark card
  pricingCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 24, padding: '64px 48px',
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48,
    alignItems: 'center',
  },
  pricingH2: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 36, letterSpacing: '-1px', marginBottom: 24,
  },
  checkList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 },
  checkItem: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: C.muted },

  // Cleaners
  cleanerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' },
  cleanerFeatures: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 48 },
  cleanerFeature: { display: 'flex', flexDirection: 'column', gap: 10 },
  cleanerCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 24, padding: '48px 40px',
    display: 'flex', flexDirection: 'column', gap: 24,
  },

  // Footer
  footer: {
    borderTop: `1px solid ${C.border}`, padding: '60px 48px 40px',
    maxWidth: 1200, margin: '0 auto',
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: 40,
  },
  footerLogo: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 12,
  },
  footerTagline: { color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 },
  footerCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  footerHeading: { fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 4 },
  footerLink: { color: C.muted, fontSize: 14, textDecoration: 'none' },
  emailInput: {
    width: '100%', height: 42, borderRadius: 10, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontSize: 14, padding: '0 14px',
    outline: 'none', fontFamily: 'inherit', marginBottom: 10,
  },
  btnSmGreen: {
    width: '100%', height: 42, borderRadius: 10, border: 'none',
    background: C.accent, color: '#080A0C', fontSize: 14, fontWeight: 700,
    cursor: 'pointer',
  },
};

// ─── Sparkle SVG logo ─────────────────────────────────────────────
function SparkleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L15.8 10.2L24 12L15.8 13.8L14 22L12.2 13.8L4 12L12.2 10.2L14 2Z"
        fill="#5BD6A6" />
      <path d="M22 18L22.9 21.1L26 22L22.9 22.9L22 26L21.1 22.9L18 22L21.1 21.1L22 18Z"
        fill="#5BD6A6" opacity="0.6" />
    </svg>
  );
}

// ─── House SVG (pricing center) ───────────────────────────────────
function HouseSVG() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: -40,
        background: 'radial-gradient(circle, rgba(91,214,166,0.18) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <svg width="180" height="160" viewBox="0 0 180 160" fill="none" style={{ position: 'relative' }}>
        <path d="M90 20L160 80H20L90 20Z" fill="rgba(91,214,166,0.2)" stroke="#5BD6A6" strokeWidth="2" />
        <rect x="40" y="80" width="100" height="70" fill="rgba(91,214,166,0.08)" stroke="#5BD6A6" strokeWidth="1.5" />
        <rect x="70" y="110" width="40" height="40" fill="rgba(91,214,166,0.15)" stroke="#5BD6A6" strokeWidth="1.5" />
        <rect x="55" y="93" width="25" height="20" rx="3" fill="rgba(91,214,166,0.2)" stroke="#5BD6A6" strokeWidth="1.5" />
        <rect x="100" y="93" width="25" height="20" rx="3" fill="rgba(91,214,166,0.2)" stroke="#5BD6A6" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [navHover, setNavHover] = useState(null);
  const [cardHover, setCardHover] = useState(null);
  const [btnHover, setBtnHover] = useState(false);

  function goToBook() {
    if (address.trim()) {
      router.push(`/book?address=${encodeURIComponent(address.trim())}`);
    } else {
      router.push('/book');
    }
  }

  const trustItems = [
    { icon: '🛡️', title: 'Background-checked cleaners', desc: 'Every cleaner passes a thorough background check before their first job.' },
    { icon: '🔄', title: 'Recurring or one-off', desc: 'Book once or set up a weekly, bi-weekly, or monthly recurring plan.' },
    { icon: '🔒', title: 'Secure & easy booking', desc: "Your payment info is protected. You're only charged when a cleaner accepts." },
  ];

  const howItems = [
    { num: '01', title: 'Enter your address', desc: 'We look up your property details automatically — no forms to fill out.' },
    { num: '02', title: 'Pick a time', desc: 'Choose a date and time that works for you. Same-day slots often available.' },
    { num: '03', title: 'We match a pro', desc: 'A background-checked cleaner nearby accepts your job and shows up ready.' },
  ];

  const checks = ['Instant pricing', 'Online booking', 'Background-checked pros', 'Satisfaction guaranteed'];

  const cleanerFeatures = [
    { icon: '📈', title: 'Get more clients', desc: 'Access a steady stream of vetted jobs in your zip codes.' },
    { icon: '🗓️', title: 'Set your schedule', desc: 'Accept only the jobs that fit your availability.' },
    { icon: '💸', title: 'Get paid securely', desc: 'Automatic payouts after each completed job — no chasing invoices.' },
  ];

  const footerCols = [
    { heading: 'Sweepr', links: ['How it works', 'Pricing', 'About us', 'Careers'] },
    { heading: 'Support', links: ['FAQ', 'Contact us', 'Privacy policy', 'Terms of service'] },
    { heading: 'For cleaners', links: ['Apply now', 'Cleaner portal', 'Pay structure', 'Background check'] },
  ];

  return (
    <div style={styles.page}>
      {/* ── Nav ── */}
      <nav style={styles.nav}>
        <a href="/" style={styles.navLogo}>
          <SparkleIcon />
          <span style={styles.navLogoText}>Sweepr</span>
        </a>
        <ul style={styles.navLinks}>
          {['How it works', 'Pricing', 'For cleaners', 'About us', 'FAQ'].map(link => (
            <li key={link}>
              <a
                href="#"
                style={{ ...styles.navLink, color: navHover === link ? C.text : C.muted }}
                onMouseEnter={() => setNavHover(link)}
                onMouseLeave={() => setNavHover(null)}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
        <div style={styles.navCta}>
          <button style={styles.btnGhost} onClick={() => router.push('/login')}>Log in</button>
          <button
            style={{
              ...styles.btnGreen,
              boxShadow: btnHover ? `0 0 24px ${C.accentGlow}` : 'none',
              transform: btnHover ? 'translateY(-2px)' : 'none',
            }}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            onClick={() => router.push('/book')}
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        <div>
          <div style={styles.pill}>
            <span style={{ fontSize: 16 }}>✦</span>
            Now serving the Denver metro
          </div>
          <h1 style={styles.h1}>
            A spotless home,<br />
            booked in{' '}
            <span style={{ color: C.accent }}>6 seconds.</span>
          </h1>
          <p style={styles.heroSub}>
            Enter your address and get an instant flat-rate price.
            Every cleaner is background-checked and rated by real customers.
          </p>
          <div style={styles.addressRow}>
            <input
              style={styles.addressInput}
              placeholder="Enter your home address…"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && goToBook()}
            />
            <button
              style={{
                ...styles.btnGreenLg,
                boxShadow: '0 0 0 rgba(91,214,166,0)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
              onClick={goToBook}
            >
              Get my price →
            </button>
          </div>
          <div style={styles.avatarRow}>
            <div style={styles.avatarStack}>
              {['AJ', 'KL', 'MR', 'SP'].map((init, i) => (
                <div key={init} style={{ ...styles.avatar, zIndex: 4 - i }}>
                  {init}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                {'★★★★★'.split('').map((s, i) => (
                  <span key={i} style={{ color: C.accent, fontSize: 13 }}>{s}</span>
                ))}
              </div>
              <p style={styles.ratingText}>
                <span style={styles.ratingNum}>4.9</span> avg rating from 2,000+ homes
              </p>
            </div>
          </div>
        </div>

        {/* Hero photo card */}
        <div style={styles.heroCard}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, rgba(91,214,166,0.08) 0%, rgba(16,19,22,0) 60%)`,
          }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" opacity="0.15">
              <circle cx="70" cy="70" r="68" stroke="#5BD6A6" strokeWidth="1.5" />
              <path d="M70 20L110 60H30L70 20Z" fill="#5BD6A6" />
              <rect x="30" y="60" width="80" height="60" fill="#5BD6A6" />
            </svg>
          </div>
          <div style={styles.floatingCard}>
            <span style={styles.bigStar}>⭐</span>
            <div>
              <div style={styles.floatNum}>4.9</div>
              <div style={styles.floatSub}>Avg cleaner rating</div>
            </div>
          </div>
          <div style={styles.heroCardInner}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
              Just cleaned: 123 Maple St
            </div>
            <div style={{ color: C.muted, fontSize: 14 }}>3 bed · 2 bath · Matched in 4 min</div>
          </div>
        </div>
      </section>

      {/* ── Trust band ── */}
      <div style={styles.trust}>
        {trustItems.map(item => (
          <div
            key={item.title}
            style={{
              ...styles.trustCard,
              transform: cardHover === item.title ? 'translateY(-3px)' : 'none',
            }}
            onMouseEnter={() => setCardHover(item.title)}
            onMouseLeave={() => setCardHover(null)}
          >
            <div style={styles.trustIcon}>{item.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{item.title}</div>
              <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <section style={styles.section}>
        <div style={styles.sectionLabel}>How it works</div>
        <h2 style={styles.h2}>Clean homes. Simple process.</h2>
        <div style={styles.howGrid}>
          {howItems.map(item => (
            <div
              key={item.num}
              style={{
                ...styles.howCard,
                transform: cardHover === item.num ? 'translateY(-4px)' : 'none',
                boxShadow: cardHover === item.num ? `0 12px 40px rgba(0,0,0,0.4)` : 'none',
              }}
              onMouseEnter={() => setCardHover(item.num)}
              onMouseLeave={() => setCardHover(null)}
            >
              <div style={styles.howNum}>{item.num}</div>
              <div style={styles.howTitle}>{item.title}</div>
              <div style={styles.howDesc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Flat-rate pricing ── */}
      <section style={{ ...styles.section, marginBottom: 100 }}>
        <div style={styles.sectionLabel}>Pricing</div>
        <div style={styles.pricingCard}>
          <div>
            <h2 style={styles.pricingH2}>100% Flat Rate<br />Pricing.</h2>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
              No surprises. Know your exact price before we book a cleaner.
              Starts at $89 for a standard clean.
            </p>
            <button
              style={styles.btnGreenLg}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
              onClick={() => router.push('/book')}
            >
              Get my price →
            </button>
          </div>
          <HouseSVG />
          <div>
            <ul style={styles.checkList}>
              {checks.map(c => (
                <li key={c} style={styles.checkItem}>
                  <span style={{ color: C.accent, fontWeight: 700, fontSize: 18 }}>✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── For cleaners ── */}
      <section style={styles.section}>
        <div style={styles.cleanerGrid}>
          <div>
            <div style={styles.sectionLabel}>For cleaners</div>
            <h2 style={{ ...styles.h2, marginBottom: 16 }}>More jobs.<br />Less hassle.</h2>
            <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7 }}>
              Join Denver's fastest-growing cleaning platform. We handle the bookings,
              payments, and customer support — you just show up and clean.
            </p>
            <div style={styles.cleanerFeatures}>
              {cleanerFeatures.map(f => (
                <div key={f.title} style={styles.cleanerFeature}>
                  <div style={{ fontSize: 28 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
                  <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.cleanerCard}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Ready to get started?</div>
              <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>
                Apply in minutes. Background check takes 2–3 business days.
                Start getting jobs as soon as you're cleared.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.muted, fontSize: 14 }}>
                <span style={{ color: C.accent }}>✓</span> Avg $28–$35/hr in Denver
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.muted, fontSize: 14 }}>
                <span style={{ color: C.accent }}>✓</span> Weekly direct deposit
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.muted, fontSize: 14 }}>
                <span style={{ color: C.accent }}>✓</span> No minimum hours
              </div>
            </div>
            <button
              style={styles.btnGreenLg}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
              onClick={() => router.push('/cleaner')}
            >
              Apply now →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, marginTop: 40 }}>
        <div style={styles.footer}>
          <div>
            <div style={styles.footerLogo}>✦ Sweepr</div>
            <p style={styles.footerTagline}>
              On-demand home cleaning for the Denver metro.
              Transparent pricing, vetted pros.
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              {['𝕏', 'in', 'ig'].map(s => (
                <a key={s} href="#" style={{
                  width: 36, height: 36, borderRadius: 8, background: C.surface,
                  border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: C.muted, textDecoration: 'none', fontSize: 13,
                }}>{s}</a>
              ))}
            </div>
          </div>
          {footerCols.map(col => (
            <div key={col.heading} style={styles.footerCol}>
              <div style={styles.footerHeading}>{col.heading}</div>
              {col.links.map(l => (
                <a key={l} href="#" style={styles.footerLink}>{l}</a>
              ))}
            </div>
          ))}
          <div>
            <div style={styles.footerHeading}>Newsletter</div>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
              Cleaning tips & Denver local deals.
            </p>
            <input style={styles.emailInput} placeholder="your@email.com" type="email" />
            <button style={styles.btnSmGreen}>Subscribe</button>
          </div>
        </div>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '20px 48px',
          borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 13,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>© 2026 Sweepr Inc. All rights reserved.</span>
          <span>Denver, CO</span>
        </div>
      </footer>
    </div>
  );
}
