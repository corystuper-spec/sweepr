'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
};

const s = {
  page: { background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif" },
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: 72,
    background: 'rgba(8,10,12,0.85)', backdropFilter: 'blur(16px)',
    borderBottom: `1px solid ${C.border}`,
  },
  logo: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 22, color: C.text, textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  btnGreen: {
    padding: '0 24px', height: 44, borderRadius: 12, border: 'none',
    background: C.accent, color: '#080A0C', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  },
  btnGreenLg: {
    padding: '0 36px', height: 56, borderRadius: 12, border: 'none',
    background: C.accent, color: '#080A0C', fontSize: 17, fontWeight: 700,
    cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
    display: 'inline-flex', alignItems: 'center', gap: 8,
  },
  btnGhost: {
    padding: '0 20px', height: 44, borderRadius: 12,
    border: `1px solid ${C.border}`, background: 'transparent',
    color: C.text, fontSize: 15, cursor: 'pointer',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  },
  section: { maxWidth: 1100, margin: '0 auto', padding: '0 48px' },
  sectionLabel: {
    fontSize: 12, fontWeight: 700, letterSpacing: '2px', color: C.accent,
    textTransform: 'uppercase', marginBottom: 16,
  },
  h1: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 'clamp(44px, 5.5vw, 72px)',
    lineHeight: 1.05, letterSpacing: '-2.5px',
  },
  h2: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 44px)',
    letterSpacing: '-1.5px',
  },
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 18, padding: '32px 28px',
  },
};

function hov(e, on) {
  e.currentTarget.style.boxShadow = on ? `0 8px 32px ${C.accentGlow}` : 'none';
  e.currentTarget.style.transform = on ? 'translateY(-2px)' : 'none';
}

function cardHov(e, on) {
  e.currentTarget.style.transform = on ? 'translateY(-4px)' : 'none';
  e.currentTarget.style.boxShadow = on ? '0 16px 48px rgba(0,0,0,0.4)' : 'none';
}

export default function JoinPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(null);

  const perks = [
    { icon: '💵', title: '$28–$38 / hour', desc: 'Among the highest rates for independent cleaners in Denver. Your earnings grow with your rating.' },
    { icon: '📅', title: 'You set your schedule', desc: "Accept only the jobs that fit your life. No minimums, no mandated hours, no boss breathing down your neck." },
    { icon: '⚡', title: 'Same-week payouts', desc: 'Get paid automatically every week via direct deposit. No invoicing, no waiting 30 days.' },
    { icon: '📍', title: 'Jobs near you', desc: 'Tell us your zip codes and we send you jobs in your area. No long commutes.' },
    { icon: '🛡️', title: "We handle the hard stuff", desc: 'Customer support, scheduling, payment disputes — all on us. You just focus on doing great work.' },
    { icon: '📈', title: 'Build your reputation', desc: 'Earn 5-star reviews, build a client base, and unlock access to higher-value recurring jobs.' },
  ];

  const steps = [
    { num: '01', title: 'Create your account', desc: 'Sign up in 2 minutes. Tell us your name, service areas, and a bit about your experience.' },
    { num: '02', title: 'Pass a background check', desc: 'We run a standard background check through a trusted provider. Most results come back within 2–3 business days. It\'s free for you.' },
    { num: '03', title: 'Get approved & go live', desc: 'Once you\'re cleared, your profile goes active and job offers start coming in immediately.' },
    { num: '04', title: 'Accept jobs on your terms', desc: 'Review each job — address, size, date, and your payout — before accepting. No surprises.' },
  ];

  const faqs = [
    {
      q: 'How much can I realistically earn per week?',
      a: 'Most full-time Sweepr cleaners in Denver earn $800–$1,400/week depending on how many jobs they take. Part-time cleaners doing 2–3 jobs/week typically earn $300–$500. Your rate is based on the job size — a standard 3-bed/2-bath home pays around $97 to you after the platform fee.',
    },
    {
      q: 'What does Sweepr take from each job?',
      a: 'Sweepr takes a 25% platform fee. You keep 75% of the total job price. That fee covers customer acquisition, payment processing, insurance, and support — so you never have to worry about any of that.',
    },
    {
      q: 'Do I need to bring my own supplies?',
      a: 'Most customers prefer you to use your own supplies so you can guarantee quality. Some customers will have supplies on hand. You can note your preference in your profile and we\'ll match accordingly.',
    },
    {
      q: 'What if a customer cancels last minute?',
      a: 'If a customer cancels within 24 hours of the scheduled job, you receive a $25 cancellation fee automatically. We protect your time.',
    },
    {
      q: 'Is there a minimum number of jobs I have to take?',
      a: 'Zero. Sweepr is completely flexible. Take as many or as few jobs as you want each week. Your account stays active as long as you accept at least one job every 90 days.',
    },
    {
      q: 'What if something goes wrong on a job?',
      a: 'Contact our cleaner support line and we\'ll handle it. We have a resolution process for customer complaints and we always hear both sides before making any decisions.',
    },
  ];

  const earnings = [
    { type: 'Studio / 1 bed', total: '$89–$115', payout: '$67–$86' },
    { type: '2 bed / 2 bath', total: '$115–$145', payout: '$86–$109' },
    { type: '3 bed / 2 bath', total: '$145–$185', payout: '$109–$139' },
    { type: '4+ bed home', total: '$185–$260', payout: '$139–$195' },
    { type: 'Deep clean add-on', total: '+$60', payout: '+$45' },
    { type: 'Recurring booking', total: '−10–15%', payout: 'Offset by volume' },
  ];

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <a href="/" style={s.logo}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L15.8 10.2L24 12L15.8 13.8L14 22L12.2 13.8L4 12L12.2 10.2L14 2Z" fill="#5BD6A6" />
            <path d="M22 18L22.9 21.1L26 22L22.9 22.9L22 26L21.1 22.9L18 22L21.1 21.1L22 18Z" fill="#5BD6A6" opacity="0.6" />
          </svg>
          Sweepr
        </a>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={s.btnGhost} onClick={() => router.push('/')}>← Back to home</button>
          <button
            style={s.btnGreen}
            onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}
            onClick={() => router.push('/login?role=cleaner')}
          >
            Apply now
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ ...s.section, paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 760 }}>
          <div style={s.sectionLabel}>Join the Sweepr team</div>
          <h1 style={{ ...s.h1, marginBottom: 28 }}>
            Turn your cleaning skills into{' '}
            <span style={{ color: C.accent }}>real income.</span>
          </h1>
          <p style={{ fontSize: 20, color: C.muted, lineHeight: 1.7, marginBottom: 48, maxWidth: 580 }}>
            Join Denver's fastest-growing home cleaning network. We bring you the clients,
            handle the payments, and let you focus on what you do best.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              style={s.btnGreenLg}
              onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}
              onClick={() => router.push('/login?role=cleaner')}
            >
              Apply now — it's free →
            </button>
            <span style={{ color: C.muted, fontSize: 14 }}>Takes 2 minutes · No experience minimum</span>
          </div>
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 20, marginTop: 64, flexWrap: 'wrap' }}>
          {[
            { num: '$28–$38', label: 'Per hour average' },
            { num: '2–3 days', label: 'Background check' },
            { num: '75%', label: 'You keep per job' },
            { num: 'Weekly', label: 'Direct deposit' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: '20px 28px',
            }}>
              <div style={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                fontWeight: 800, fontSize: 28, color: C.accent, lineHeight: 1, marginBottom: 4,
              }}>{stat.num}</div>
              <div style={{ color: C.muted, fontSize: 13 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section style={{ ...s.section, paddingBottom: 100 }}>
        <div style={s.sectionLabel}>Why Sweepr</div>
        <h2 style={{ ...s.h2, marginBottom: 48 }}>Everything working for you,<br />not against you.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {perks.map(p => (
            <div
              key={p.title}
              style={{ ...s.card, transition: 'transform 0.25s, box-shadow 0.25s', cursor: 'default' }}
              onMouseEnter={e => cardHov(e, true)}
              onMouseLeave={e => cardHov(e, false)}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>{p.icon}</div>
              <div style={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                fontWeight: 700, fontSize: 18, marginBottom: 10,
              }}>{p.title}</div>
              <div style={{ color: C.muted, fontSize: 15, lineHeight: 1.65 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings table */}
      <section style={{ ...s.section, paddingBottom: 100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <div style={s.sectionLabel}>Your earnings</div>
            <h2 style={{ ...s.h2, marginBottom: 16 }}>Know exactly what you'll make.</h2>
            <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              Every job shows your payout before you accept — no surprises.
              Sweepr takes 25% to cover platform costs. You keep 75%.
            </p>
            <button
              style={s.btnGreenLg}
              onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}
              onClick={() => router.push('/login?role=cleaner')}
            >
              Start earning →
            </button>
          </div>
          <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 24px', borderBottom: `1px solid ${C.border}`,
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px',
            }}>
              <span>Job type</span><span>Job total</span><span style={{ color: C.accent }}>Your payout</span>
            </div>
            {earnings.map((row, i) => (
              <div key={row.type} style={{
                padding: '16px 24px',
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                borderBottom: i < earnings.length - 1 ? `1px solid ${C.border}` : 'none',
                fontSize: 14,
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
              }}>
                <span style={{ color: C.muted }}>{row.type}</span>
                <span>{row.total}</span>
                <span style={{ color: C.accent, fontWeight: 600 }}>{row.payout}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to join */}
      <section style={{ ...s.section, paddingBottom: 100 }}>
        <div style={s.sectionLabel}>How to apply</div>
        <h2 style={{ ...s.h2, marginBottom: 56 }}>Up and running in under a week.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {steps.map((step, i) => (
            <div key={step.num} style={{ position: 'relative' }}>
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', top: 22, left: 'calc(100% - 10px)',
                  width: 'calc(100% - 28px)', height: 1,
                  background: `linear-gradient(to right, ${C.accent}40, ${C.border})`,
                  zIndex: 0,
                }} />
              )}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: C.accentDim, border: `1.5px solid rgba(91,214,166,0.4)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                  fontWeight: 800, fontSize: 14, color: C.accent, marginBottom: 20,
                }}>{step.num}</div>
                <div style={{
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                  fontWeight: 700, fontSize: 17, marginBottom: 10,
                }}>{step.title}</div>
                <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ ...s.section, paddingBottom: 100 }}>
        <div style={s.sectionLabel}>FAQ</div>
        <h2 style={{ ...s.h2, marginBottom: 40 }}>Questions we get a lot.</h2>
        <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: openFaq === i ? C.surface : 'transparent',
                border: `1px solid ${openFaq === i ? C.border : 'transparent'}`,
                borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s',
              }}
            >
              <button
                style={{
                  width: '100%', padding: '20px 24px', background: 'none', border: 'none',
                  color: C.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
                  fontSize: 16, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  borderBottom: openFaq === i ? `1px solid ${C.border}` : 'none',
                }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {faq.q}
                <span style={{
                  color: C.accent, fontSize: 22, lineHeight: 1, flexShrink: 0,
                  transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
                }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '20px 24px', color: C.muted, fontSize: 15, lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ ...s.section, paddingBottom: 120 }}>
        <div style={{
          background: `linear-gradient(135deg, rgba(91,214,166,0.1) 0%, rgba(91,214,166,0.04) 100%)`,
          border: `1px solid rgba(91,214,166,0.25)`,
          borderRadius: 24, padding: '72px 64px', textAlign: 'center',
        }}>
          <div style={s.sectionLabel}>Ready?</div>
          <h2 style={{ ...s.h2, marginBottom: 16 }}>
            Start earning with Sweepr today.
          </h2>
          <p style={{ color: C.muted, fontSize: 17, lineHeight: 1.7, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
            Applications take 2 minutes. Background checks are free.
            Most cleaners get their first job within a week of being approved.
          </p>
          <button
            style={{ ...s.btnGreenLg, fontSize: 18, padding: '0 48px', height: 60 }}
            onMouseEnter={e => hov(e, true)} onMouseLeave={e => hov(e, false)}
            onClick={() => router.push('/login?role=cleaner')}
          >
            Apply now — it's free →
          </button>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 20 }}>
            No fees to join · Background check included · Start within days
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${C.border}`, padding: '32px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        maxWidth: 1100, margin: '0 auto', flexWrap: 'wrap', gap: 16,
      }}>
        <span style={{ color: C.muted, fontSize: 14 }}>© 2026 Sweepr Inc. · Denver, CO</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>Home</a>
          <a href="/login" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>Sign in</a>
          <a href="#" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ color: C.muted, fontSize: 14, textDecoration: 'none' }}>Terms</a>
        </div>
      </footer>
    </div>
  );
}
