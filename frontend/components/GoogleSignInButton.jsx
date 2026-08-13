import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from './StoreProvider';
import { getApiBase } from '../utils/apiBase';

const API_BASE = getApiBase();

/* ═══════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
═══════════════════════════════════════════════════════════════ */

function FieldLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: 'block', fontSize: 11, fontWeight: 700, color: '#6366f1',
      marginBottom: 7, letterSpacing: '0.5px', textTransform: 'uppercase',
    }}>
      {children}
    </label>
  );
}

function StyledInput({ id, type = 'text', placeholder, value, onChange, maxLength, autoFocus, inputMode, pattern }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id} type={type} placeholder={placeholder}
      value={value} onChange={onChange}
      maxLength={maxLength} autoFocus={autoFocus}
      inputMode={inputMode} pattern={pattern}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        display: 'block', width: '100%', boxSizing: 'border-box',
        height: 52, padding: '0 16px',
        border: `2px solid ${focused ? '#6366f1' : 'rgba(148,163,184,0.3)'}`,
        borderRadius: 14, background: focused ? '#fff' : '#f8faff',
        fontSize: 16, fontWeight: 600, color: '#1e1b4b',
        outline: 'none', fontFamily: 'inherit', letterSpacing: '0.5px',
        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.13)' : 'none',
        transition: 'all 200ms ease',
      }}
    />
  );
}

/* 6 individual OTP digit boxes */
function OtpBoxes({ value, onChange }) {
  const inputs = useRef([]);
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const next = (value + '      ').split('');
    next[i] = char;
    const joined = next.join('').trim().slice(0, 6);
    onChange(joined);
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[0,1,2,3,4,5].map((i) => {
        const filled = !!digits[i]?.trim();
        return (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="tel" inputMode="numeric" maxLength={1}
            value={digits[i]?.trim() || ''}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            autoFocus={i === 0}
            style={{
              width: 46, height: 56, textAlign: 'center',
              fontSize: 22, fontWeight: 800, color: '#1e1b4b',
              border: `2px solid ${filled ? '#6366f1' : 'rgba(148,163,184,0.3)'}`,
              borderRadius: 12,
              background: filled ? 'rgba(99,102,241,0.06)' : '#f8faff',
              outline: 'none', fontFamily: 'inherit',
              boxShadow: filled ? '0 0 0 3px rgba(99,102,241,0.10)' : 'none',
              transition: 'all 180ms ease',
            }}
          />
        );
      })}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16, display: 'inline-block',
      border: '2.5px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'gsi-spin 650ms linear infinite',
    }} />
  );
}

function PrimaryBtn({ onClick, type = 'button', disabled, loading, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', height: 52, borderRadius: 14, border: 'none',
        background: disabled
          ? 'rgba(99,102,241,0.38)'
          : hov ? 'linear-gradient(135deg,#2563eb,#4f46e5)'
                : 'linear-gradient(135deg,#3b82f6,#6366f1)',
        color: '#fff', fontSize: 15, fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 4px 18px rgba(99,102,241,0.32)',
        transform: hov && !disabled ? 'translateY(-1px)' : 'none',
        transition: 'all 200ms ease', letterSpacing: '0.3px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      background: 'rgba(239,68,68,0.08)', color: '#dc2626',
      border: '1px solid rgba(239,68,68,0.2)',
      animation: 'gsi-shake 380ms ease',
      display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <span>⚠️</span><span>{message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHONE OTP MODAL  (two-step: phone entry → OTP entry)
═══════════════════════════════════════════════════════════════ */

function PhoneOtpModal({ userName, userEmail, setupToken, onDone, onCancel }) {
  // step: 'phone' | 'otp'
  const [step, setStep] = useState('phone');

  /* ── Step 1 state ── */
  const [phone, setPhone] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');

  /* ── Step 2 state ── */
  const [otp, setOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  /* ── Resend cooldown ── */
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const startCooldown = () => {
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  /* ── Validate Bangladesh phone ── */
  const isValidPhone = (p) => /^01[3-9]\d{8}$/.test(p.replace(/\s+/g, '').trim());

  /* ── Step 1: Send OTP ── */
  const sendOtp = async (e) => {
    e?.preventDefault();
    const clean = phone.replace(/\s+/g, '').trim();
    if (!isValidPhone(clean)) {
      setSendError('Please enter a valid Bangladesh mobile number (e.g. 01XXXXXXXXX).');
      return;
    }
    setSendLoading(true);
    setSendError('');
    try {
      const res = await fetch(`${API_BASE}/auth/google/phone/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupToken, phone: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send code.');
      setMaskedPhone(data.maskedPhone || `+880••••••${clean.slice(-2)}`);
      setStep('otp');
      startCooldown();
    } catch (err) {
      setSendError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSendLoading(false);
    }
  };

  /* ── Step 2: Verify OTP ── */
  const verifyOtp = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      setVerifyError('Please enter the full 6-digit code.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const clean = phone.replace(/\s+/g, '').trim();
      const res = await fetch(`${API_BASE}/auth/google/phone/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupToken, phone: clean, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed.');
      onDone(data); // { token, user }
    } catch (err) {
      setVerifyError(err.message || 'Verification failed. Please try again.');
      setOtp('');
    } finally {
      setVerifyLoading(false);
    }
  };

  /* ── Auto-submit when all 6 digits entered ── */
  useEffect(() => {
    if (otp.length === 6 && step === 'otp' && !verifyLoading) {
      verifyOtp();
    }
  }, [otp]);

  /* ── Resend ── */
  const resend = async () => {
    if (cooldown > 0) return;
    setOtp('');
    setVerifyError('');
    setStep('phone');
    setSendError('');
  };

  /* ── Step indicator ── */
  const StepDots = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
      {[0, 1].map((i) => (
        <div key={i} style={{
          width: i === (step === 'phone' ? 0 : 1) ? 24 : 8,
          height: 8, borderRadius: 4,
          background: i === (step === 'phone' ? 0 : 1) ? '#6366f1' : 'rgba(99,102,241,0.2)',
          transition: 'all 300ms ease',
        }} />
      ))}
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,20,40,0.60)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      animation: 'gsi-backdrop-in 220ms ease forwards',
    }}>
      <div style={{
        background: '#fff', borderRadius: 28,
        padding: '40px 36px 36px',
        maxWidth: 420, width: '100%',
        boxShadow: '0 32px 80px rgba(99,102,241,0.22), 0 8px 24px rgba(0,0,0,0.10)',
        animation: 'gsi-modal-in 280ms cubic-bezier(.34,1.3,.64,1) forwards',
        position: 'relative',
      }}>

        {/* Close button */}
        <button
          type="button" onClick={onCancel}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: '#f1f5f9', cursor: 'pointer', fontSize: 14, color: '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Cancel"
        >✕</button>

        {/* Header icon */}
        <div style={{
          width: 60, height: 60, borderRadius: '50%', margin: '0 auto 18px',
          background: step === 'phone'
            ? 'linear-gradient(135deg,#4285F4,#6366f1)'
            : 'linear-gradient(135deg,#10b981,#059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          boxShadow: `0 6px 20px ${step === 'phone' ? 'rgba(66,133,244,0.35)' : 'rgba(16,185,129,0.35)'}`,
          transition: 'background 400ms ease',
        }}>
          {step === 'phone' ? '📱' : '🔐'}
        </div>

        <StepDots />

        {/* ── STEP 1: Phone entry ── */}
        {step === 'phone' && (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 850, color: '#1e1b4b', textAlign: 'center', letterSpacing: '-0.3px' }}>
              Verify Your Phone
            </h2>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
              Hi <strong style={{ color: '#1e1b4b' }}>{userName}</strong>! We need your phone number to complete your account.
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 11.5, color: '#94a3b8', textAlign: 'center' }}>
              Signed in as {userEmail}
            </p>

            <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <FieldLabel htmlFor="gsi-phone">Phone Number <span style={{ color: '#ef4444' }}>*</span></FieldLabel>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 17, pointerEvents: 'none', zIndex: 1,
                  }}>📞</span>
                  <StyledInput
                    id="gsi-phone"
                    type="tel" inputMode="numeric" pattern="[0-9]*"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 11)); setSendError(''); }}
                    maxLength={11}
                    autoFocus
                  />
                  <style>{`.gsi-phone-wrap input { padding-left: 46px !important; }`}</style>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#94a3b8' }}>
                  Bangladesh number · starts with 013–019 · 11 digits
                </p>
              </div>

              <ErrorBox message={sendError} />

              <PrimaryBtn type="submit" disabled={phone.length < 11 || sendLoading} loading={sendLoading}>
                {sendLoading ? 'Sending code…' : 'Send Verification Code →'}
              </PrimaryBtn>

              <button type="button" onClick={onCancel} style={{
                background: 'none', border: 'none', color: '#94a3b8',
                fontSize: 12.5, cursor: 'pointer', textAlign: 'center',
                padding: '2px 0', fontWeight: 600,
              }}>
                Cancel — use a different sign-in method
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: OTP entry ── */}
        {step === 'otp' && (
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: 21, fontWeight: 850, color: '#1e1b4b', textAlign: 'center', letterSpacing: '-0.3px' }}>
              Enter Verification Code
            </h2>

            <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <OtpBoxes value={otp} onChange={(v) => { setOtp(v); setVerifyError(''); }} />

              <ErrorBox message={verifyError} />

              <PrimaryBtn type="submit" disabled={otp.length < 6 || verifyLoading} loading={verifyLoading}>
                {verifyLoading ? 'Verifying…' : 'Verify & Continue →'}
              </PrimaryBtn>

              {/* Resend + change number */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                  <span>Didn't receive the code?</span>
                  <button
                    type="button" onClick={resend}
                    disabled={cooldown > 0}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      fontSize: 13, fontWeight: 700,
                      color: cooldown > 0 ? '#94a3b8' : '#6366f1',
                      cursor: cooldown > 0 ? 'default' : 'pointer',
                    }}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
                  </button>
                </div>

                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setVerifyError(''); }} style={{
                  background: 'none', border: 'none', color: '#94a3b8',
                  fontSize: 12, cursor: 'pointer', fontWeight: 600,
                }}>
                  ← Change phone number
                </button>
              </div>
            </form>

            {/* OTP expiry note */}
            <p style={{ margin: '16px 0 0', fontSize: 11, color: '#cbd5e1', textAlign: 'center' }}>
              Code expires in 10 minutes · Max 3 attempts
            </p>
          </>
        )}
      </div>

      {/* All keyframe animations */}
      <style>{`
        @keyframes gsi-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gsi-modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
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

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORTED COMPONENT
═══════════════════════════════════════════════════════════════ */
/**
 * GoogleSignInButton
 *
 * Props:
 *   redirectTo — path to navigate after successful auth  (default '/')
 *   onSuccess  — optional callback({ token, user })
 *   label      — fallback label when clientId not configured
 */
export default function GoogleSignInButton({ redirectTo = '/', onSuccess, label = 'Continue with Google' }) {
  const { login } = useStore();
  const router = useRouter();
  const btnRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Populated when backend returns needsPhone:true
  const [phoneSetup, setPhoneSetup] = useState(null);

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
        // Must verify phone via OTP before getting full JWT
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
      {/* Two-step phone OTP modal */}
      {phoneSetup && (
        <PhoneOtpModal
          userName={phoneSetup.user.name}
          userEmail={phoneSetup.user.email}
          setupToken={phoneSetup.setupToken}
          onDone={(data) => {
            setPhoneSetup(null);
            finishLogin(data);
          }}
          onCancel={() => {
            setPhoneSetup(null);
            setError('Phone verification is required to complete sign-up. Please try again.');
          }}
        />
      )}

      <div>
        {/* Google renders its branded button here */}
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

/* ═══════════════════════════════════════════════════════════════
   GOOGLE COLOUR ICON
═══════════════════════════════════════════════════════════════ */
function GoogleIcon({ size = 18, color }) {
  const fill = color ? { all: color } : {
    blue: '#4285F4', green: '#34A853', yellow: '#FBBC05', red: '#EA4335',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill={fill.all || fill.blue} />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={fill.all || fill.green} />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={fill.all || fill.yellow} />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={fill.all || fill.red} />
    </svg>
  );
}
