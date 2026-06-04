'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
    background: C.bg, minHeight: '100vh', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif", padding: '24px',
  },
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 24, padding: '48px 40px', width: '100%', maxWidth: 440,
  },
  logo: {
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
    fontWeight: 800, fontSize: 22, color: C.text, textDecoration: 'none',
    display: 'block', marginBottom: 32, textAlign: 'center',
  },
  tabs: {
    display: 'flex', background: C.surfaceUp, borderRadius: 12,
    padding: 4, marginBottom: 32,
  },
  tab: (active) => ({
    flex: 1, height: 40, borderRadius: 10, border: 'none',
    background: active ? C.surface : 'transparent',
    color: active ? C.text : C.muted, fontWeight: active ? 600 : 400,
    fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
    boxShadow: active ? `0 1px 4px rgba(0,0,0,0.3)` : 'none',
  }),
  label: { fontSize: 13, color: C.muted, marginBottom: 6, display: 'block' },
  input: {
    width: '100%', height: 48, borderRadius: 12, border: `1px solid ${C.border}`,
    background: C.surfaceUp, color: C.text, fontSize: 15, padding: '0 14px',
    outline: 'none', fontFamily: 'inherit', marginBottom: 16,
    transition: 'border-color 0.2s',
  },
  roleRow: { display: 'flex', gap: 10, marginBottom: 16 },
  rolePill: (active) => ({
    flex: 1, height: 44, borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500,
    background: active ? C.accentDim : C.surfaceUp,
    border: `1px solid ${active ? 'rgba(91,214,166,0.5)' : C.border}`,
    color: active ? C.accent : C.muted, transition: 'all 0.15s',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  }),
  btnGreen: {
    width: '100%', height: 52, borderRadius: 12, border: 'none',
    background: C.accent, color: '#080A0C', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', marginTop: 8, transition: 'box-shadow 0.2s, transform 0.2s',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  },
  error: { color: C.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  divider: {
    textAlign: 'center', color: C.muted, fontSize: 13, margin: '20px 0',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  line: { flex: 1, height: 1, background: C.border },
  forgot: {
    display: 'block', textAlign: 'center', color: C.muted, fontSize: 13,
    marginTop: 16, cursor: 'pointer', background: 'none', border: 'none',
    fontFamily: 'inherit',
  },
};

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [supabase] = useState(() => typeof window !== 'undefined' ? createClient() : null);
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSignIn(e) {
    e.preventDefault();
    setError(''); setMessage('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(redirect);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError(''); setMessage('');
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setMessage('Check your email to confirm your account, then sign in.');
    setLoading(false);
    setTab('signin');
  }

  async function handleForgot() {
    if (!email) { setError('Enter your email above first.'); return; }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setMessage('Password reset link sent — check your email.');
    setLoading(false);
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <a href="/" style={s.logo}>✦ Sweepr</a>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(tab === 'signin')} onClick={() => { setTab('signin'); setError(''); }}>Sign in</button>
          <button style={s.tab(tab === 'signup')} onClick={() => { setTab('signup'); setError(''); }}>Create account</button>
        </div>

        {error && <div style={s.error}>{error}</div>}
        {message && <div style={{ ...s.error, color: C.accent }}>{message}</div>}

        {/* Sign in */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              style={s.btnGreen}
              disabled={loading}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" style={s.forgot} onClick={handleForgot}>
              Forgot password?
            </button>
          </form>
        )}

        {/* Sign up */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp}>
            <label style={s.label}>Full name</label>
            <input
              style={s.input}
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoFocus
            />
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <label style={s.label}>I am a…</label>
            <div style={s.roleRow}>
              <button type="button" style={s.rolePill(role === 'customer')} onClick={() => setRole('customer')}>
                🏠 Homeowner
              </button>
              <button type="button" style={s.rolePill(role === 'cleaner')} onClick={() => setRole('cleaner')}>
                🧹 Cleaner
              </button>
            </div>
            <button
              type="submit"
              style={s.btnGreen}
              disabled={loading}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>

      <p style={{ color: C.muted, fontSize: 13, marginTop: 24 }}>
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#080A0C', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8F96' }}>
        Loading…
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
