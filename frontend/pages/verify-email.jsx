import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';
import { getApiBase } from '../utils/apiBase';

const API_BASE = getApiBase();

/* ─── Shared card style (neumorphic, matches reference) ─────────────────── */
const cardBase = {
  position: 'relative',
  width: '100%',
  maxWidth: 420,
  margin: '0 auto',
  padding: '34px 30px 30px',
  borderRadius: 27,
  background: 'rgba(238,241,246,0.97)',
  boxShadow: `
    18px 18px 38px rgba(163,170,184,0.42),
    -18px -18px 38px rgba(255,255,255,0.95),
    inset 1px 1px 2px rgba(255,255,255,0.9)
  `,
  overflow: 'hidden',
  isolation: 'isolate',
};

/* ─── Spinning gradient border pseudo-element via a real div ─────────────── */
function SpinningBorder() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: -2,
        borderRadius: 29,
        background:
          'conic-gradient(from 0deg, transparent 0%, #42c9f3 30%, #8f6cff 55%, transparent 80%)',
        animation: 'otp-border-spin 5s linear infinite',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Inner mask to show only the border ring */}
      <div
        style={{
          position: 'absolute',
          inset: 2,
          borderRadius: 27,
          background: 'rgba(238,241,246,0.97)',
        }}
      />
    </div>
  );
}

/* ─── Single OTP digit box ───────────────────────────────────────────────── */
function OtpBox({ inputRef, value, onChange, onKeyDown, onPaste, index, isFocused, isFilled, verifyStatus }) {

  const boxShadow = isFocused
    ? `0 0 0 2px rgba(38,187,232,0.22),
       5px 5px 12px rgba(169,175,187,0.4),
       -5px -5px 12px rgba(255,255,255,0.95),
       inset 2px 2px 5px rgba(174,181,193,0.25)`
    : `inset 5px 5px 10px rgba(174,181,193,0.42),
       inset -5px -5px 10px rgba(255,255,255,0.9)`;

  return (
    <input
      ref={inputRef}
      id={`otp-digit-${index}`}
      type="text"
      inputMode="numeric"
      maxLength={1}
      autoComplete={index === 0 ? 'one-time-code' : 'off'}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      aria-label={`OTP digit ${index + 1} of 6`}
      disabled={verifyStatus === 'success'}
      style={{
        width: 49,
        height: 49,
        border: 'none',
        outline: 'none',
        borderRadius: 12,
        background: '#edf0f5',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 700,
        color: '#252932',
        caretColor: '#28b8e8',
        boxShadow,
        transform: isFocused ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.25s ease',
        animation: isFilled ? 'otp-input-pop 0.22s ease forwards' : 'none',
        flexShrink: 0,
      }}
    />
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function VerifyEmailPage() {
  const router = useRouter();
  const { login } = useStore();

  /* ── State ── */
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [focusedIdx, setFocusedIdx] = useState(null);
  const [justFilledIdx, setJustFilledIdx] = useState(null);

  // 'idle' | 'loading' | 'success' | 'error'
  const [verifyStatus, setVerifyStatus] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' | 'error'

  const [resendSeconds, setResendSeconds] = useState(0);
  const [autoVerifying, setAutoVerifying] = useState(true);
  const [linkChecked, setLinkChecked] = useState(false);
  const [cardSuccess, setCardSuccess] = useState(false);

  const inputRefs = useRef([]);
  const resendTimerRef = useRef(null);

  /* ── Helpers ── */
  const readResponse = async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    const text = await res.text();
    return { message: text || 'Request failed' };
  };

  const redirectByRole = (role) => {
    if (role === 'admin') router.push('/admin/dashboard');
    else if (role === 'seller') router.push('/seller/dashboard');
    else router.push('/user/dashboard');
  };

  const showStatus = (msg, type) => {
    setStatusMsg(msg);
    setStatusType(type);
  };

  const clearStatus = () => {
    setStatusMsg('');
    setStatusType('');
  };

  const getOtp = () => digits.join('');

  /* ── Auto-verify via email link on page load ── */
  useEffect(() => {
    if (!router.isReady) return;

    const queryEmail = typeof router.query.email === 'string' ? router.query.email : '';
    const queryToken = typeof router.query.token === 'string' ? router.query.token : '';

    if (queryEmail) setEmail(queryEmail);

    const verifyByLink = async () => {
      if (!queryEmail || !queryToken) {
        setAutoVerifying(false);
        setLinkChecked(true);
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE}/auth/verify-email-link?email=${encodeURIComponent(queryEmail)}&token=${encodeURIComponent(queryToken)}`
        );
        const data = await readResponse(res);
        if (!res.ok) throw new Error(data.message || 'Verification link failed');

        login({ nextUser: data.user, nextToken: data.token });
        showStatus('Email verified successfully. Redirecting...', 'success');
        setVerifyStatus('success');
        setCardSuccess(true);
        setLinkChecked(true);
        setTimeout(() => redirectByRole(data.user.role), 1200);
      } catch (err) {
        showStatus(err.message || 'Verification link invalid or expired. Please use the OTP below.', 'error');
        setLinkChecked(true);
      } finally {
        setAutoVerifying(false);
      }
    };

    verifyByLink();
  }, [router.isReady, router.query.email, router.query.token]);

  /* ── OTP digit input handlers ── */
  const handleDigitChange = (idx, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const char = raw.slice(-1); // take last char (handles autofill)

    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    clearStatus();

    if (char) {
      setJustFilledIdx(idx);
      setTimeout(() => setJustFilledIdx(null), 250);
      if (idx < 5) {
        inputRefs.current[idx + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        setDigits(next);
        inputRefs.current[idx - 1]?.focus();
      } else if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setDigits(next);
    clearStatus();
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  /* ── Verify OTP (real API) ── */
  const verifyOtp = async () => {
    const otp = getOtp();

    if (otp.length !== 6) {
      showStatus('Please enter all 6 digits.', 'error');
      const firstEmpty = digits.findIndex((d) => !d);
      inputRefs.current[firstEmpty >= 0 ? firstEmpty : 0]?.focus();
      return;
    }

    setVerifyStatus('loading');
    clearStatus();

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');

      login({ nextUser: data.user, nextToken: data.token });
      setVerifyStatus('success');
      setCardSuccess(true);
      showStatus('Email verified successfully. Redirecting...', 'success');
      setTimeout(() => redirectByRole(data.user.role), 1600);
    } catch (err) {
      setVerifyStatus('error');
      showStatus(err.message || 'Invalid OTP. Please try again.', 'error');
      // Clear digits and refocus
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        setVerifyStatus('idle');
        inputRefs.current[0]?.focus();
      }, 600);
    }
  };

  /* ── Resend OTP (real API + 30 s cooldown) ── */
  const resendOtp = async () => {
    if (resendSeconds > 0) return;
    if (!email) { showStatus('Please enter your email first.', 'error'); return; }

    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
      showStatus(data.message || 'A new OTP has been sent to your email.', 'success');
    } catch (err) {
      showStatus(err.message || 'Failed to resend OTP.', 'error');
    }

    // Start 30-second cooldown regardless
    setResendSeconds(30);
    resendTimerRef.current = setInterval(() => {
      setResendSeconds((s) => {
        if (s <= 1) { clearInterval(resendTimerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(resendTimerRef.current), []);

  const isLoading = verifyStatus === 'loading';
  const isSuccess = verifyStatus === 'success';
  const isLocked  = isLoading || isSuccess;

  /* ── Inline styles ── */
  const verifyBtnStyle = {
    width: '100%',
    height: 48,
    marginTop: 21,
    border: 0,
    borderRadius: 14,
    background: isSuccess
      ? 'linear-gradient(135deg,#23a779,#1d8f66)'
      : '#edf0f5',
    color: isSuccess ? '#fff' : '#353a42',
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: '0.7px',
    cursor: isLocked ? 'not-allowed' : 'pointer',
    boxShadow: `
      8px 8px 16px rgba(164,171,183,0.45),
      -8px -8px 16px rgba(255,255,255,0.95)
    `,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease, color 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    animation: cardSuccess ? 'btn-success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
  };

  return (
    <MarketplaceLayout>
      {/* ── Aria live region ── */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {isLoading && 'Verifying OTP, please wait.'}
        {isSuccess && 'Email verified successfully.'}
        {verifyStatus === 'error' && statusMsg}
      </span>

      <main
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          background:
            'radial-gradient(circle at 20% 20%, rgba(110,220,255,0.28) 0%, transparent 32%),' +
            'radial-gradient(circle at 80% 80%, rgba(160,120,255,0.22) 0%, transparent 32%),' +
            '#f0f2f7',
        }}
      >
        {/* ── Card ── */}
        <div
          style={{
            ...cardBase,
            animation: cardSuccess ? 'otp-card-success 0.6s ease' : 'none',
          }}
        >
          <SpinningBorder />

          {/* ── Content (above the border layer) ── */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>

            {/* Lock icon */}
            <div
              aria-hidden="true"
              style={{
                width: 62,
                height: 62,
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                fontSize: 28,
                background: '#edf0f5',
                boxShadow: `
                  8px 8px 18px rgba(167,173,184,0.45),
                  -8px -8px 18px rgba(255,255,255,0.95),
                  inset 2px 2px 5px rgba(255,255,255,0.7)
                `,
                animation: 'otp-lock-float 3s ease-in-out infinite',
              }}
            >
              {isSuccess ? '✅' : '🔐'}
            </div>

            {/* Title */}
            <h1
              style={{
                color: '#252932',
                fontSize: 25,
                fontWeight: 750,
                letterSpacing: '-0.5px',
                marginBottom: 7,
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              {isSuccess ? 'Verified!' : 'Verify Your Email'}
            </h1>

            <p
              style={{
                color: '#707782',
                fontSize: 13,
                lineHeight: 1.6,
                marginBottom: 4,
              }}
            >
              {isSuccess
                ? 'Your email has been confirmed. Redirecting you now…'
                : "We've sent a 6-digit code to"}
            </p>

            {!isSuccess && (
              <span
                style={{
                  display: 'block',
                  color: '#30353d',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                }}
              >
                {email || 'your email'}
              </span>
            )}

            {/* ── Auto-verifying link state ── */}
            {autoVerifying && (
              <p
                style={{
                  marginTop: 20,
                  color: '#707782',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 15,
                    height: 15,
                    border: '2px solid rgba(50,55,65,0.2)',
                    borderTopColor: '#26b8e8',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'otp-spin 0.7s linear infinite',
                  }}
                />
                Checking verification link…
              </p>
            )}

            {/* ── OTP form — only show once link is checked ── */}
            {linkChecked && !isSuccess && (
              <>
                {/* Email input (editable if not pre-filled) */}
                {!router.query.email && (
                  <input
                    className="input"
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ marginTop: 18, textAlign: 'left' }}
                    required
                  />
                )}

                {/* 6-digit OTP boxes */}
                <div
                  role="group"
                  aria-label="Enter 6-digit OTP"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 9,
                    marginTop: 25,
                    flexWrap: 'nowrap',
                  }}
                >
                  {digits.map((d, i) => (
                    <OtpBox
                      key={i}
                      index={i}
                      inputRef={(el) => (inputRefs.current[i] = el)}
                      value={d}
                      isFocused={focusedIdx === i}
                      isFilled={justFilledIdx === i}
                      verifyStatus={verifyStatus}
                      onChange={(e) => handleDigitChange(i, e)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={handlePaste}
                      onFocus={() => setFocusedIdx(i)}
                      onBlur={() => setFocusedIdx(null)}
                    />
                  ))}
                </div>

                {/* Verify button */}
                <button
                  type="button"
                  id="otp-verify-btn"
                  onClick={verifyOtp}
                  disabled={isLocked}
                  aria-disabled={isLocked}
                  style={verifyBtnStyle}
                  onMouseEnter={(e) => {
                    if (!isLocked) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '10px 10px 20px rgba(164,171,183,0.5), -10px -10px 20px rgba(255,255,255,1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLocked) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '8px 8px 16px rgba(164,171,183,0.45), -8px -8px 16px rgba(255,255,255,0.95)';
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!isLocked) {
                      e.currentTarget.style.transform = 'translateY(1px)';
                      e.currentTarget.style.boxShadow = 'inset 5px 5px 10px rgba(164,171,183,0.35), inset -5px -5px 10px rgba(255,255,255,0.9)';
                    }
                  }}
                >
                  {isLoading ? (
                    <span
                      style={{
                        width: 17,
                        height: 17,
                        border: '2px solid rgba(50,55,65,0.2)',
                        borderTopColor: '#26b8e8',
                        borderRadius: '50%',
                        animation: 'otp-spin 0.7s linear infinite',
                      }}
                    />
                  ) : (
                    'VERIFY OTP'
                  )}
                </button>

                {/* Resend button */}
                <button
                  type="button"
                  id="otp-resend-btn"
                  onClick={resendOtp}
                  disabled={resendSeconds > 0 || isLocked}
                  style={{
                    marginTop: 13,
                    border: 0,
                    background: 'transparent',
                    color: resendSeconds > 0 || isLocked ? '#9ca4ad' : '#19a9d7',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: resendSeconds > 0 || isLocked ? 'not-allowed' : 'pointer',
                    transition: '0.2s ease',
                    display: 'block',
                    width: '100%',
                  }}
                >
                  {resendSeconds > 0 ? `RESEND OTP (${resendSeconds}s)` : 'RESEND OTP'}
                </button>
              </>
            )}

            {/* ── Status message ── */}
            {statusMsg && (
              <p
                role="alert"
                style={{
                  minHeight: 20,
                  marginTop: 13,
                  fontSize: 13,
                  fontWeight: 650,
                  color: statusType === 'success' ? '#23a779' : '#e05c6f',
                  animation: 'otp-status-in 0.3s ease forwards',
                }}
              >
                {statusMsg}
              </p>
            )}

            {/* ── Back to login ── */}
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={{
                marginTop: 16,
                border: 0,
                background: 'transparent',
                color: '#f97316',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Back to Login
            </button>

          </div>
        </div>

        {/* ── Mobile responsive styles via a style tag ── */}
        <style>{`
          @media (max-width: 430px) {
            .otp-mobile-card { padding: 30px 18px 25px !important; }
            .otp-mobile-input { width: 43px !important; height: 47px !important; }
            .otp-mobile-gap  { gap: 6px !important; }
          }
          @media (max-width: 350px) {
            .otp-mobile-input { width: 39px !important; height: 44px !important; }
            .otp-mobile-gap  { gap: 5px !important; }
          }
        `}</style>
      </main>
    </MarketplaceLayout>
  );
}
