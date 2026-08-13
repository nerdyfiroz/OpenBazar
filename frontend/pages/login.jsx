import { useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';
import SEO from '../components/SEO';
import { getApiBase } from '../utils/apiBase';
import PremiumPasswordInput from '../components/PremiumPasswordInput';
import GoogleSignInButton from '../components/GoogleSignInButton';
import MobileVerificationModal from '../components/MobileVerificationModal';

const API_BASE = getApiBase();

/* ─── Auth-page input (blue focus ring, matches panel aesthetic) ─────────── */
function AuthInput({ type = 'text', placeholder, value, onChange, required, autoComplete, id }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      autoComplete={autoComplete}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: 'block',
        width: '100%',
        height: 46,
        padding: '0 14px',
        border: `1.5px solid ${focused ? '#6366f1' : 'rgba(99,102,241,0.22)'}`,
        borderRadius: 11,
        background: focused ? '#fff' : '#f8f9ff',
        fontSize: 14,
        color: '#1e1b4b',
        outline: 'none',
        boxSizing: 'border-box',
        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
        transition: 'border-color 200ms ease, box-shadow 200ms ease, background 200ms ease',
      }}
    />
  );
}

/* ─── Auth-page select ───────────────────────────────────────────────────── */
function AuthSelect({ value, onChange, children, required, id }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: 'block',
        width: '100%',
        height: 46,
        padding: '0 36px 0 14px',
        border: `1.5px solid ${focused ? '#6366f1' : 'rgba(99,102,241,0.22)'}`,
        borderRadius: 11,
        background: focused ? '#fff' : '#f8f9ff',
        fontSize: 14,
        color: '#1e1b4b',
        outline: 'none',
        boxSizing: 'border-box',
        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '15px',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
      }}
    >
      {children}
    </select>
  );
}

/* ─── Field label ────────────────────────────────────────────────────────── */
function FieldLabel({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: 11.5,
        fontWeight: 700,
        color: '#6366f1',
        marginBottom: 6,
        letterSpacing: '0.4px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </label>
  );
}

/* ─── Blue panel ghost button ────────────────────────────────────────────── */
function PanelButton({ onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        marginTop: 8,
        padding: '11px 36px',
        borderRadius: 50,
        border: '2px solid rgba(255,255,255,0.72)',
        background: hov ? 'rgba(255,255,255,0.18)' : 'transparent',
        color: '#fff',
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.6px',
        cursor: 'pointer',
        transition: 'background 200ms ease',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Login() {
  const router = useRouter();
  const { login } = useStore();

  // Read ?redirect= from URL to restore location after login
  const redirectTo = (typeof window !== 'undefined' && router.query?.redirect)
    ? String(router.query.redirect)
    : '/';

  // mode: 'login' | 'register'
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [msgIsError, setMsgIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'user',
  });
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneSetupData, setPhoneSetupData] = useState({ token: '', phone: '', email: '' });

  /* ── Existing auth logic — UNCHANGED ─────────────────────────────────── */
  const formatAuthMessage = (message) => {
    if (!message) return 'Authentication failed';
    if (message.toLowerCase().includes('too many')) {
      return "You've tried this a few times. Please wait a bit and try again — the system needs a quick coffee break.";
    }
    return message;
  };

  const readResponse = async (res) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return res.json();
    const text = await res.text();
    return { message: text || 'Authentication failed' };
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      if (data.needsPhone && data.setupToken) {
        setPhoneSetupData({
          token: data.setupToken,
          phone: form.phone || data.user?.phone || '',
          email: form.email || data.user?.email || '',
        });
        setShowPhoneModal(true);
        setLoading(false);
        return;
      }

      if (isLogin) {
        login({ nextUser: data.user, nextToken: data.token });
        setMsgIsError(false);
        setMessage(`Welcome back, ${data.user.name}! Redirecting...`);
        setTimeout(() => {
          if (redirectTo && redirectTo !== '/') router.push(redirectTo);
          else if (data.user.role === 'admin') router.push('/admin/dashboard');
          else if (data.user.role === 'seller') router.push('/seller/dashboard');
          else router.push('/user/dashboard');
        }, 900);
      } else {
        setMsgIsError(false);
        setMessage(data.message || 'Registration successful. Redirecting to verification...');
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
        }, 700);
      }
    } catch (error) {
      setMsgIsError(true);
      setMessage(formatAuthMessage(error.message));
    } finally {
      setLoading(false);
    }
  };
  /* ── End existing logic ────────────────────────────────────────────────── */

  const switchMode = (toLogin) => {
    setMessage('');
    setIsLogin(toLogin);
  };

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  /* ── Shared status message ── */
  const msgEl = message ? (
    <p
      role="alert"
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        background: msgIsError ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.09)',
        color: msgIsError ? '#dc2626' : '#15803d',
        marginBottom: 14,
        animation: 'label-fade-in 0.3s ease forwards',
        border: msgIsError ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(34,197,94,0.2)',
      }}
    >
      {message}
    </p>
  ) : null;

  /* ── Submit button ── */
  const SubmitBtn = ({ label, loadingLabel }) => {
    const [hov, setHov] = useState(false);
    return (
      <button
        type="submit"
        disabled={loading}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '100%',
          height: 46,
          border: 'none',
          borderRadius: 11,
          background: loading
            ? 'rgba(99,102,241,0.55)'
            : hov
            ? 'linear-gradient(135deg,#2563eb,#4f46e5)'
            : 'linear-gradient(135deg,#3b82f6,#6366f1)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: '0.5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.32)',
          transition: 'background 200ms ease, box-shadow 200ms ease, transform 150ms ease',
          transform: hov && !loading ? 'translateY(-1px)' : 'none',
        }}
      >
        {loading ? loadingLabel : label}
      </button>
    );
  };

  return (
    <MarketplaceLayout>
      <SEO title="Login" description="Login or create an OpenBazar account." canonical="/login" noindex />

      {/* ── Screen-reader live region ── */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {loading && (isLogin ? 'Signing in…' : 'Creating account…')}
        {!loading && message}
      </span>

      {/* ── Page background ── */}
      <main
        style={{
          minHeight: '88vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          background:
            'radial-gradient(ellipse at 15% 35%, rgba(99,102,241,0.16) 0%, transparent 50%),' +
            'radial-gradient(ellipse at 85% 65%, rgba(59,130,246,0.14) 0%, transparent 50%),' +
            'radial-gradient(ellipse at 50% 10%, rgba(139,92,246,0.10) 0%, transparent 40%),' +
            '#eef0f8',
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            AUTH CARD
        ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="auth-card"
          data-mode={isLogin ? 'login' : 'register'}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: 900,
            minHeight: 540,
            borderRadius: 28,
            background: '#ffffff',
            boxShadow:
              '0 24px 64px rgba(99,102,241,0.16),' +
              '0 8px 24px rgba(0,0,0,0.07)',
            display: 'flex',
            overflow: 'hidden',
          }}
        >

          {/* ─────────────────────────────────────────────────────────────────
              LEFT SLOT — Register form
              Covered by blue panel in LOGIN mode → inert so no tab access
          ───────────────────────────────────────────────────────────────── */}
          <div
            className="auth-slot auth-slot-left"
            inert={isLogin ? '' : undefined}
            style={{
              width: '50%',
              padding: '52px 44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                opacity: isLogin ? 0 : 1,
                transform: isLogin ? 'translateX(-16px)' : 'translateX(0)',
                transition: 'opacity 380ms ease, transform 380ms ease',
                transitionDelay: isLogin ? '0ms' : '280ms',
              }}
            >
              <h2 style={{ fontSize: 27, fontWeight: 850, color: '#1e1b4b', marginBottom: 6, letterSpacing: '-0.3px' }}>
                Create Account
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
                Join OpenBazar as a buyer or seller
              </p>

              {msgEl}

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <FieldLabel htmlFor="reg-name">Full Name</FieldLabel>
                  <AuthInput id="reg-name" placeholder="Your full name" value={form.name} onChange={set('name')} required autoComplete="name" />
                </div>
                <div>
                  <FieldLabel htmlFor="reg-phone">Phone Number</FieldLabel>
                  <AuthInput id="reg-phone" placeholder="01XXXXXXXXX" value={form.phone} onChange={set('phone')} required autoComplete="tel" />
                </div>
                <div>
                  <FieldLabel htmlFor="reg-role">Join As</FieldLabel>
                  <AuthSelect id="reg-role" value={form.role} onChange={set('role')} required>
                    <option value="user">Buyer</option>
                    <option value="seller">Seller</option>
                  </AuthSelect>
                </div>
                <div>
                  <FieldLabel htmlFor="reg-email">Email Address</FieldLabel>
                  <AuthInput id="reg-email" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required autoComplete="email" />
                </div>
                <div>
                  <FieldLabel htmlFor="register-password">Password</FieldLabel>
                  <PremiumPasswordInput
                    id="register-password"
                    label="Create Password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    showStrength={true}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div style={{ marginTop: 4 }}>
                  <SubmitBtn label="Create Account" loadingLabel="Creating account…" />
                </div>
              </form>

              {/* Google Sign-Up divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 4px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(99,102,241,0.15)' }} />
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(99,102,241,0.15)' }} />
              </div>
              <GoogleSignInButton redirectTo={redirectTo || '/user/dashboard'} label="Sign up with Google" />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT SLOT — Login form
              Covered by blue panel in REGISTER mode → inert so no tab access
          ───────────────────────────────────────────────────────────────── */}
          <div
            className="auth-slot auth-slot-right"
            inert={!isLogin ? '' : undefined}
            style={{
              width: '50%',
              padding: '52px 44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                opacity: !isLogin ? 0 : 1,
                transform: !isLogin ? 'translateX(16px)' : 'translateX(0)',
                transition: 'opacity 380ms ease, transform 380ms ease',
                transitionDelay: !isLogin ? '0ms' : '280ms',
              }}
            >
              <h2 style={{ fontSize: 27, fontWeight: 850, color: '#1e1b4b', marginBottom: 6, letterSpacing: '-0.3px' }}>
                Login
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
                Welcome back, smart shopper!
              </p>

              {msgEl}

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <FieldLabel htmlFor="login-email">Email Address</FieldLabel>
                  <AuthInput id="login-email" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required autoComplete="email" />
                </div>
                <div>
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <PremiumPasswordInput
                    id="login-password"
                    label="Password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    showStrength={false}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {/* Forgot password */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/forgot-password${form.email ? `?email=${encodeURIComponent(form.email)}` : ''}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6366f1',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                      textUnderlineOffset: 2,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div style={{ marginTop: 4 }}>
                  <SubmitBtn label="Sign In" loadingLabel="Signing in…" />
                </div>
              </form>

              {/* Google Sign-In divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 4px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(99,102,241,0.15)' }} />
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(99,102,241,0.15)' }} />
              </div>
              <GoogleSignInButton redirectTo={redirectTo || '/user/dashboard'} label="Sign in with Google" />
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              BLUE SLIDING PANEL
              Login  mode: left = 0    (covers left slot)
              Register mode: left = 50% (covers right slot)
          ═════════════════════════════════════════════════════════════════ */}
          <div
            className="auth-blue-panel"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: isLogin ? 0 : '50%',
              width: '50%',
              height: '100%',
              zIndex: 10,
              transition: 'left 700ms cubic-bezier(.68,-0.1,.265,1.1)',
              background: 'linear-gradient(145deg, #3b82f6 0%, #6366f1 55%, #7c3aed 100%)',
              borderRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 36px',
              textAlign: 'center',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(99,102,241,0.38)',
            }}
          >
            {/* Decorative background circles */}
            <div style={{
              position: 'absolute', top: -72, right: -72, width: 240, height: 240,
              borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -80, left: -64, width: 260, height: 260,
              borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: '40%', left: '50%', width: 180, height: 180,
              borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
              transform: 'translate(-50%,-50%)',
            }} />

            {/* ── Content: LOGIN mode (blue is on LEFT) ── */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 32px',
              opacity: isLogin ? 1 : 0,
              transform: isLogin ? 'translateY(0) scale(1)' : 'translateY(-14px) scale(0.97)',
              transition: 'opacity 300ms ease, transform 300ms ease',
              transitionDelay: isLogin ? '350ms' : '0ms',
              pointerEvents: isLogin ? 'auto' : 'none',
              gap: 0,
            }}>
              {/* Brand mark */}
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, marginBottom: 22,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}>
                🛒
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 850, color: '#fff', letterSpacing: '-0.3px', marginBottom: 10, lineHeight: 1.2 }}>
                Hello, Welcome!
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.76)', lineHeight: 1.65, marginBottom: 28, maxWidth: 200 }}>
                Enter your details to use all of OpenBazar&apos;s features
              </p>
              <PanelButton onClick={() => switchMode(false)}>
                Register
              </PanelButton>
            </div>

            {/* ── Content: REGISTER mode (blue is on RIGHT) ── */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 32px',
              opacity: !isLogin ? 1 : 0,
              transform: !isLogin ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
              transition: 'opacity 300ms ease, transform 300ms ease',
              transitionDelay: !isLogin ? '350ms' : '0ms',
              pointerEvents: !isLogin ? 'auto' : 'none',
            }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, marginBottom: 22,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}>
                👋
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 850, color: '#fff', letterSpacing: '-0.3px', marginBottom: 10, lineHeight: 1.2 }}>
                Welcome Back!
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.76)', lineHeight: 1.65, marginBottom: 28, maxWidth: 200 }}>
                Already have an account? Log in to continue
              </p>
              <PanelButton onClick={() => switchMode(true)}>
                Login
              </PanelButton>
            </div>
          </div>

        </div>{/* end auth-card */}

        {/* ── Responsive CSS ── */}
        <style>{`
          /* Mobile: stack vertically */
          @media (max-width: 640px) {
            .auth-card {
              flex-direction: column !important;
              min-height: auto !important;
              width: 96% !important;
              border-radius: 22px !important;
            }
            .auth-slot-left,
            .auth-slot-right {
              width: 100% !important;
              padding: 32px 24px !important;
            }
            /* On mobile hide the slot that isn't current mode */
            .auth-card[data-mode="login"] .auth-slot-left  { display: none !important; }
            .auth-card[data-mode="register"] .auth-slot-right { display: none !important; }
            /* Blue panel: relative (in flow), always on top, no sliding */
            .auth-blue-panel {
              position: relative !important;
              left: 0 !important;
              width: 100% !important;
              min-height: 200px !important;
              height: auto !important;
              border-radius: 18px !important;
              order: -1;
              transition: none !important;
            }
          }
          /* Tablet: slightly more padding */
          @media (min-width: 641px) and (max-width: 900px) {
            .auth-slot-left,
            .auth-slot-right {
              padding: 40px 28px !important;
            }
            .auth-blue-panel > div {
              padding: 32px 20px !important;
            }
          }
          /* Hover lift on submit buttons */
          .auth-card button[type="submit"]:not(:disabled):hover {
            transform: translateY(-1px);
          }
          /* Focus ring for keyboard nav */
          .auth-card button:focus-visible {
            outline: 2px solid #6366f1;
            outline-offset: 2px;
          }
        `}</style>

        {showPhoneModal && (
          <MobileVerificationModal
            isOpen={showPhoneModal}
            onClose={() => setShowPhoneModal(false)}
            setupToken={phoneSetupData.token}
            initialPhone={phoneSetupData.phone}
            userEmail={phoneSetupData.email}
            onSuccess={(data) => {
              if (data.token && data.user) {
                login({ nextUser: data.user, nextToken: data.token });
                router.push(redirectTo || '/user/dashboard');
              }
            }}
          />
        )}

      </main>
    </MarketplaceLayout>
  );
}
