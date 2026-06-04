'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const C = {
  bg:        '#080A0C',
  surface:   '#101316',
  surfaceUp: '#181C20',
  accent:    '#5BD6A6',
  accentGlow:'rgba(91,214,166,0.25)',
  accentDim: 'rgba(91,214,166,0.12)',
  border:    'rgba(255,255,255,0.07)',
  text:      '#F3F4F2',
  muted:     '#8A8F96',
  error:     '#FF6B6B',
};

function OnboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email  = params.get('email') || '';
  const name   = params.get('name')  || '';

  const [supabase]  = useState(() => typeof window !== 'undefined' ? createClient() : null);
  const isMobile = useIsMobile();
  const [pw, setPw]         = useState('');
  const [pw2, setPw2]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (pw.length < 6)    { setError('Password must be at least 6 characters.'); return; }
    if (pw !== pw2)        { setError("Passwords don't match."); return; }

    setLoading(true);
    const { error: signUpErr } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        data: { full_name: name, role: 'cleaner' },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/cleaner`,
      },
    });

    if (signUpErr) {
      // If account already exists, try signing in instead
      if (signUpErr.message.toLowerCase().includes('already')) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (!signInErr) { router.push('/cleaner'); return; }
      }
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    router.push('/cleaner?welcome=1');
  }

  const inputStyle = {
    width: '100%', height: 52, borderRadius: 12, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontSize: 16, padding: '0 14px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      background: C.bg, minHeight: '100vh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Hanken Grotesk', system-ui, sans-serif", padding: '24px',
    }}>
      {/* Logo */}
      <a href="/" style={{
        fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
        fontWeight: 800, fontSize: 22, color: C.text, textDecoration: 'none',
        marginBottom: 48,
      }}>✦ Sweepr</a>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 24, padding: isMobile ? '32px 20px' : '52px 44px', width: '100%', maxWidth: 460,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 style={{
            fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
            fontWeight: 800, fontSize: 30, letterSpacing: '-0.5px',
            marginBottom: 10, color: C.text,
          }}>
            Almost there{name ? `, ${name}` : ''}!
          </h1>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.65 }}>
            Your application is in. Create your Sweepr account to get notified
            the moment you're approved and start receiving jobs.
          </p>
        </div>

        {/* Progress indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {['Application', 'Create account', 'Get approved', 'Start earning'].map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 4, borderRadius: 4, marginBottom: 6,
                background: i === 0 ? C.accent : i === 1 ? 'rgba(91,214,166,0.4)' : C.surfaceUp,
              }} />
              <div style={{ fontSize: 10, color: i <= 1 ? C.accent : C.muted, fontWeight: 600 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email (read-only) */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: C.muted, marginBottom: 6, display: 'block', fontWeight: 500 }}>
              Email
            </label>
            <input
              style={{ ...inputStyle, color: C.muted, cursor: 'not-allowed' }}
              type="email"
              value={email}
              readOnly
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: C.muted, marginBottom: 6, display: 'block', fontWeight: 500 }}>
              Create a password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                style={inputStyle}
                type={showPw ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={pw}
                onChange={e => setPw(e.target.value)}
                autoFocus
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: C.muted,
                  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                }}
              >{showPw ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, color: C.muted, marginBottom: 6, display: 'block', fontWeight: 500 }}>
              Confirm password
            </label>
            <input
              style={{
                ...inputStyle,
                borderColor: pw2 && pw2 !== pw ? C.error : C.border,
              }}
              type={showPw ? 'text' : 'password'}
              placeholder="Same password again"
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              required
            />
            {pw2 && pw2 !== pw && (
              <div style={{ color: C.error, fontSize: 12, marginTop: 5 }}>Passwords don't match</div>
            )}
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
              borderRadius: 10, padding: '12px 16px', color: C.error,
              fontSize: 13, marginBottom: 20, lineHeight: 1.5,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !pw || pw !== pw2}
            style={{
              width: '100%', height: 52, borderRadius: 12, border: 'none',
              background: pw && pw === pw2 ? C.accent : 'rgba(91,214,166,0.3)',
              color: '#080A0C', fontSize: 16, fontWeight: 700, cursor: loading || !pw || pw !== pw2 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (pw && pw === pw2) { e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            {loading ? 'Creating account…' : 'Create account & finish'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 20, lineHeight: 1.6 }}>
          You'll receive a confirmation email. Your account activates once your
          background check is cleared — usually 2–3 business days.
        </p>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#080A0C', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8F96' }}>
        Loading…
      </div>
    }>
      <OnboardInner />
    </Suspense>
  );
}
