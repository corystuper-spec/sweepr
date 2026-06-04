'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const C = {
  bg: '#080A0C', surface: '#101316', surfaceUp: '#181C20',
  accent: '#5BD6A6', accentDim: 'rgba(91,214,166,0.12)', accentGlow: 'rgba(91,214,166,0.25)',
  border: 'rgba(255,255,255,0.07)', text: '#F3F4F2', muted: '#8A8F96',
};

function SparkleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L15.8 10.2L24 12L15.8 13.8L14 22L12.2 13.8L4 12L12.2 10.2L14 2Z" fill="#5BD6A6" />
      <path d="M22 18L22.9 21.1L26 22L22.9 22.9L22 26L21.1 22.9L18 22L21.1 21.1L22 18Z" fill="#5BD6A6" opacity="0.6" />
    </svg>
  );
}

function HouseSVG() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', padding: '20px 0' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(91,214,166,0.18) 0%, transparent 70%)', borderRadius: '50%' }} />
      <svg width="160" height="140" viewBox="0 0 180 160" fill="none" style={{ position: 'relative' }}>
        <path d="M90 20L160 80H20L90 20Z" fill="rgba(91,214,166,0.2)" stroke="#5BD6A6" strokeWidth="2" />
        <rect x="40" y="80" width="100" height="70" fill="rgba(91,214,166,0.08)" stroke="#5BD6A6" strokeWidth="1.5" />
        <rect x="70" y="110" width="40" height="40" fill="rgba(91,214,166,0.15)" stroke="#5BD6A6" strokeWidth="1.5" />
        <rect x="55" y="93" width="25" height="20" rx="3" fill="rgba(91,214,166,0.2)" stroke="#5BD6A6" strokeWidth="1.5" />
        <rect x="100" y="93" width="25" height="20" rx="3" fill="rgba(91,214,166,0.2)" stroke="#5BD6A6" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const router  = useRouter();
  const mobile  = useIsMobile();
  const [address, setAddress]     = useState('');
  const [menuOpen, setMenuOpen]   = useState(false);
  const [cardHover, setCardHover] = useState(null);

  const px = mobile ? '20px' : '48px';

  function goToBook() {
    router.push(address.trim() ? `/book?address=${encodeURIComponent(address.trim())}` : '/book');
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

  const footerCols = [
    { heading: 'Sweepr', links: ['How it works', 'Pricing', 'About us', 'Careers'] },
    { heading: 'Support', links: ['FAQ', 'Contact us', 'Privacy policy', 'Terms of service'] },
    { heading: 'Join our team', links: ['Apply now', 'How it works', 'Pay structure', 'FAQ for cleaners'] },
  ];

  const navLinks = [
    { label: 'How it works', href: '#how' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Join our team', href: '/join' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${px}`, height: 64,
        background: 'rgba(8,10,12,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <SparkleIcon />
          <span style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 20, color: C.text }}>Sweepr</span>
        </a>

        {/* Desktop links */}
        {!mobile && (
          <ul style={{ display: 'flex', gap: 28, listStyle: 'none' }}>
            {navLinks.map(l => (
              <li key={l.label}><a href={l.href} style={{ color: C.muted, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{l.label}</a></li>
            ))}
          </ul>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!mobile && (
            <button onClick={() => router.push('/login')} style={{ height: 40, padding: '0 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 14, cursor: 'pointer' }}>
              Log in
            </button>
          )}
          <button
            onClick={() => router.push('/book')}
            style={{ height: 40, padding: '0 20px', borderRadius: 10, border: 'none', background: C.accent, color: '#080A0C', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            {mobile ? 'Book now' : 'Get started'}
          </button>
          {mobile && (
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', color: C.text, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobile && menuOpen && (
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navLinks.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} style={{ color: C.muted, textDecoration: 'none', fontSize: 16, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
              {l.label}
            </a>
          ))}
          <a href="/login" onClick={() => setMenuOpen(false)} style={{ color: C.muted, textDecoration: 'none', fontSize: 16, padding: '12px 0' }}>Log in</a>
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: mobile ? '60px 20px 48px' : '90px 48px 72px', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 40 : 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.accentDim, border: '1px solid rgba(91,214,166,0.3)', borderRadius: 100, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 24 }}>
            <span>✦</span> Now serving the Denver metro
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: mobile ? 38 : 60, lineHeight: 1.08, letterSpacing: mobile ? '-1px' : '-2px', marginBottom: 20 }}>
            A spotless home,<br />booked in{' '}
            <span style={{ color: C.accent }}>6 seconds.</span>
          </h1>
          <p style={{ fontSize: mobile ? 16 : 18, color: C.muted, lineHeight: 1.65, marginBottom: 32, maxWidth: 460 }}>
            Enter your address and get an instant flat-rate price. Every cleaner is background-checked and rated by real customers.
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexDirection: mobile ? 'column' : 'row' }}>
            <input
              style={{ flex: 1, height: 52, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 15, padding: '0 16px', outline: 'none', fontFamily: 'inherit' }}
              placeholder="Enter your home address…"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && goToBook()}
            />
            <button
              onClick={goToBook}
              style={{ height: 52, borderRadius: 12, border: 'none', background: C.accent, color: '#080A0C', fontSize: 15, fontWeight: 700, cursor: 'pointer', padding: '0 28px', whiteSpace: 'nowrap' }}
            >
              Get my price →
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {['AJ','KL','MR','SP'].map((init, i) => (
                <div key={init} style={{ width: 34, height: 34, borderRadius: '50%', border: `2px solid ${C.bg}`, marginLeft: i ? -10 : 0, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: C.accent, zIndex: 4 - i }}>
                  {init}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>{'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: C.accent, fontSize: 12 }}>{s}</span>)}</div>
              <p style={{ color: C.muted, fontSize: 13 }}><strong style={{ color: C.text }}>4.9</strong> avg rating from 2,000+ homes</p>
            </div>
          </div>
        </div>

        {/* Hero card — hidden on mobile */}
        {!mobile && (
          <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', background: `linear-gradient(135deg, ${C.surface} 0%, #181C20 100%)`, border: `1px solid ${C.border}`, minHeight: 380, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(91,214,166,0.07) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 20, right: 20, borderRadius: 14, background: 'rgba(16,19,22,0.92)', backdropFilter: 'blur(12px)', border: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>⭐</span>
              <div><div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 22, color: C.text }}>4.9</div><div style={{ fontSize: 11, color: C.muted }}>Avg cleaner rating</div></div>
            </div>
            <div style={{ padding: 28, background: 'linear-gradient(to top, rgba(8,10,12,0.9) 0%, transparent 100%)' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Just cleaned: 123 Maple St</div>
              <div style={{ color: C.muted, fontSize: 13 }}>3 bed · 2 bath · Matched in 4 min</div>
            </div>
          </div>
        )}
      </section>

      {/* ── Trust band ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto 64px', padding: `0 ${px}`, display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
        {trustItems.map(item => (
          <div key={item.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{item.title}</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: `0 ${px}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: C.accent, textTransform: 'uppercase', marginBottom: 14 }}>How it works</div>
        <h2 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: mobile ? 28 : 44, letterSpacing: '-1px', marginBottom: 40 }}>Clean homes. Simple process.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {howItems.map(item => (
            <div key={item.num}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '28px 24px', transition: 'transform 0.25s', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 40, color: C.accentDim, lineHeight: 1, marginBottom: 16 }}>{item.num}</div>
              <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10 }}>{item.title}</div>
              <div style={{ color: C.muted, lineHeight: 1.6, fontSize: 14 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Flat-rate pricing ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: `0 ${px}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: C.accent, textTransform: 'uppercase', marginBottom: 14 }}>Pricing</div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: mobile ? '36px 24px' : '56px 48px', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: mobile ? 32 : 48, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: mobile ? 28 : 36, letterSpacing: '-1px', marginBottom: 16 }}>100% Flat Rate Pricing.</h2>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>No surprises. Know your exact price before we book a cleaner. Starts at $89.</p>
            <button onClick={() => router.push('/book')} style={{ height: 50, padding: '0 28px', borderRadius: 12, border: 'none', background: C.accent, color: '#080A0C', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Get my price →
            </button>
          </div>
          {!mobile && <HouseSVG />}
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {checks.map(c => (
              <li key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: C.muted }}>
                <span style={{ color: C.accent, fontWeight: 700, fontSize: 17 }}>✓</span>{c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Join our team banner ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto 80px', padding: `0 ${px}` }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(91,214,166,0.08) 0%, rgba(91,214,166,0.03) 100%)', border: '1px solid rgba(91,214,166,0.2)', borderRadius: 24, padding: mobile ? '40px 24px' : '56px 56px', display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: C.accent, textTransform: 'uppercase', marginBottom: 14 }}>Careers</div>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: mobile ? 24 : 36, letterSpacing: '-1px', marginBottom: 12 }}>
              Are you a professional cleaner in the Denver area?
            </h2>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, maxWidth: 480 }}>
              Flexible hours, steady income, no chasing clients.
            </p>
          </div>
          <button
            onClick={() => router.push('/join')}
            style={{ height: 54, padding: '0 32px', borderRadius: 12, border: 'none', background: C.accent, color: '#080A0C', fontSize: 16, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, width: mobile ? '100%' : 'auto' }}
          >
            Join our team →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: mobile ? '40px 20px' : '56px 48px', display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr 1.5fr', gap: mobile ? 32 : 40 }}>
          <div style={{ gridColumn: mobile ? '1 / -1' : 'auto' }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 10 }}>✦ Sweepr</div>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>On-demand home cleaning for the Denver metro. Transparent pricing, vetted pros.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              {['𝕏', 'in', 'ig'].map(s => (
                <a key={s} href="#" style={{ width: 34, height: 34, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, textDecoration: 'none', fontSize: 12 }}>{s}</a>
              ))}
            </div>
          </div>
          {footerCols.map(col => (
            <div key={col.heading} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: C.text, marginBottom: 2 }}>{col.heading}</div>
              {col.links.map(l => <a key={l} href="#" style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>{l}</a>)}
            </div>
          ))}
          {!mobile && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: C.text, marginBottom: 10 }}>Newsletter</div>
              <input style={{ width: '100%', height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceUp, color: C.text, fontSize: 13, padding: '0 12px', outline: 'none', fontFamily: 'inherit', marginBottom: 8, boxSizing: 'border-box' }} placeholder="your@email.com" type="email" />
              <button style={{ width: '100%', height: 40, borderRadius: 10, border: 'none', background: C.accent, color: '#080A0C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Subscribe</button>
            </div>
          )}
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: `16px ${px}`, borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>© 2026 Sweepr Inc. All rights reserved.</span>
          <span>Denver, CO</span>
        </div>
      </footer>
    </div>
  );
}
