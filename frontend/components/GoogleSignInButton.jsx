import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from './StoreProvider';
import { getApiBase } from '../utils/apiBase';

const API_BASE = getApiBase();

/* ─── Phone input with focus styling ───────────────────────────────────────── */
function PhoneInput({ value, onChange, id }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 18, pointerEvents: 'none', zIndex: 1,
      }}>📞</span>
      <input
        id={id}
        type="tel"
        placeholder="01XXXXXXXXX"
        value={value}
        onChange={onChange}
        maxLength={11}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: 'block', width: '100%', boxSizing: 'border-box',
          height: 52, padding: '0 14px 0 46px',
          border: `2px solid ${focused ? '#6366f1' : 'rgba(148,163,184,0.35)'}`,
          borderRadius: 14,
          background: focused ? '#fff' : '#f8faff',
          fontSize: 16, fontWeight: 600, color: '#1e1b4b',
          outline: 'none', fontFamily: 'inherit', letterSpacing: '0.5px',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.14)' : 'none',
          transition: 'all 200ms ease',
        }}
      />
    </div>
  );
}

/* ─── Phone number modal overlay ────────────────────────────────────────────── */
function PhoneModal({ userName, userEmail, setupToken, onDone, onCancel }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hov, setHov] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const clean = phone.replace(/\s+/g, '').trim();
    if (!/^01[3-9]\d{8}$/.test(clean)) {
      setError('Enter a valid Bangladeshi number — 01XXXXXXXXX (11 digits).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/google/phone`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupToken, phone: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save phone.');
      onDone(data); // pass { token, user } back
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,20,40,0.55)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      animation: 'gsi-backdrop-in 250ms ease forwards',
    }}>
      <div style={{
        background: '#fff', borderRadius: 28, padding: '44px 40px 40px',
        maxWidth: 420, width: '100%',
        boxShadow: '0 32px 80px rgba(99,102,241,0.22), 0 8px 24px rgba(0,0,0,0.10)',
        animation: 'gsi-modal-in 280ms cubic-bezier(.34,1.3,.64,1) forwards',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          type="button" onClick={onCancel}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: '#f1f5f9', cursor: 'pointer', fontSize: 14, color: '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 150ms',
          }}
          title="Cancel"
        >✕</button>

        {/* Google brand icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #4285F4, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(66,133,244,0.35)',
        }}>
          <GoogleIcon size={28} color="#fff" />
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 850, color: '#1e1b4b', textAlign: 'center', letterSpacing: '-0.3px' }}>
          One Last Step!
        </h2>
        <p style={{ margin: '0 0 6px', fontSize: 13.5, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
          Hi <strong style={{ color: '#1e1b4b' }}>{userName}</strong>!<br />
          Add your phone number to complete your account.
        </p>
        <p style={{ margin: '0 0 24px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
          Signed in as {userEmail}
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="gsi-phone" style={{
              display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6366f1',
              marginBottom: 8, letterSpacing: '0.4px', textTransform: 'uppercase',
            }}>
              Phone Number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <PhoneInput id="gsi-phone" value={phone} onChange={(e) => { setPhone(e.target.value); setError(''); }} />
            <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#94a3b8' }}>
              Bangladesh number — starts with 013–019, 11 digits total
            </p>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: 'rgba(239,68,68,0.08)', color: '#dc2626',
              border: '1px solid rgba(239,68,68,0.2)',
              animation: 'gsi-shake 400ms ease',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
              height: 52, borderRadius: 14, border: 'none',
              background: loading || !phone
                ? 'rgba(99,102,241,0.45)'
                : hov
                  ? 'linear-gradient(135deg,#2563eb,#4f46e5)'
                  : 'linear-gradient(135deg,#3b82f6,#6366f1)',
              color: '#fff', fontSize: 15, fontWeight: 800,
              cursor: loading || !phone ? 'not-allowed' : 'pointer',
              boxShadow: loading || !phone ? 'none' : '0 4px 18px rgba(99,102,241,0.35)',
              transform: hov && !loading && phone ? 'translateY(-1px)' : 'none',
              transition: 'all 200ms ease', letterSpacing: '0.3px',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{
                  width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'gsi-spin 700ms linear infinite', display: 'inline-block',
                }} />
                Saving…
              </span>
            ) : 'Complete Sign Up →'}
          </button>

          <button type="button" onClick={onCancel} style={{
            background: 'none', border: 'none', color: '#94a3b8', fontSize: 12.5,
            cursor: 'pointer', textAlign: 'center', padding: '4px 0', fontWeight: 600,
          }}>
            Cancel and use a different sign-in method
          </button>
        </form>
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes gsi-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gsi-modal-in { from { opacity: 0; transform: scale(0.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes gsi-spin { to { transform: rotate(360deg); } }
        @keyframes gsi-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-5px); }
          40%      { transform: translateX(5px); }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}

/* ─── Main exported component ───────────────────────────────────────────────── */
/**
 * GoogleSignInButton
 *
 * Props:
 *   redirectTo  — path to push after successful auth (default '/')
 *   onSuccess   — optional callback({ token, user }) after login
 *   label       — button label (default 'Continue with Google')
 */
export default function GoogleSignInButton({ redirectTo = '/', onSuccess, label = 'Continue with Google' }) {
  const { login } = useStore();
  const router = useRouter();
  const btnRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Phone modal state — populated when backend returns needsPhone:true
  const [phoneSetup, setPhoneSetup] = useState(null); // { setupToken, user: { name, email } }

  const finishLogin = (data) => {
    login({ nextUser: data.user, nextToken: data.token });
    if (onSuccess) onSuccess(data);
    else router.push(redirectTo);
  };

  const handleCredential = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google sign-in failed');

      if (data.needsPhone) {
        // Show phone-number collection modal
        setPhoneSetup({ setupToken: data.setupToken, user: data.user });
      } else {
        finishLogin(data);
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          width: btnRef.current.offsetWidth || 340,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      const t = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(t); initGoogle(); }
      }, 100);
      return () => clearInterval(t);
    }
  }, []);

  const clientId = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID : null;

  // Not configured — show placeholder
  if (!clientId) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          height: 44, borderRadius: 10, border: '1.5px solid #e2e8f0',
          background: '#f8fafc', color: '#94a3b8', fontSize: 13, fontWeight: 600,
          cursor: 'not-allowed', userSelect: 'none',
        }}>
          <GoogleIcon size={18} />
          {label} (not configured)
        </div>
        <p style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
          Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Phone collection modal — rendered outside the button flow */}
      {phoneSetup && (
        <PhoneModal
          userName={phoneSetup.user.name}
          userEmail={phoneSetup.user.email}
          setupToken={phoneSetup.setupToken}
          onDone={(data) => {
            setPhoneSetup(null);
            finishLogin(data);
          }}
          onCancel={() => {
            setPhoneSetup(null);
            setError('Phone number is required to complete sign-up. Please try again.');
          }}
        />
      )}

      <div>
        {/* Google renders its button into this div */}
        <div
          ref={btnRef}
          style={{
            minHeight: 44, borderRadius: 10, overflow: 'hidden',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 200ms',
          }}
        />
        {loading && (
          <p style={{ marginTop: 8, fontSize: 12, color: '#6366f1', textAlign: 'center', fontWeight: 600 }}>
            Signing in with Google…
          </p>
        )}
        {error && (
          <p style={{
            marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12,
            background: 'rgba(239,68,68,0.08)', color: '#dc2626',
            border: '1px solid rgba(239,68,68,0.2)', fontWeight: 600,
          }}>
            {error}
          </p>
        )}
      </div>
    </>
  );
}

/* ─── Google colour icon ────────────────────────────────────────────────────── */
function GoogleIcon({ size = 18, color }) {
  if (color) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill={color}/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={color}/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={color}/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={color}/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
