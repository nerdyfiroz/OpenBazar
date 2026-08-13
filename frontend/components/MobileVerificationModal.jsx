import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStore } from './StoreProvider';
import { getApiBase } from '../utils/apiBase';

const API_BASE = getApiBase();

function OtpBoxes({ value, onChange, disabled }) {
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
    if (pasted) {
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '18px 0' }}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const filled = !!digits[i]?.trim();
        return (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            value={digits[i]?.trim() || ''}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            autoFocus={i === 0}
            style={{
              width: 44,
              height: 54,
              textAlign: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: '#1e1b4b',
              border: `2px solid ${filled ? '#6366f1' : 'rgba(148,163,184,0.3)'}`,
              borderRadius: 12,
              background: filled ? 'rgba(99,102,241,0.06)' : '#f8faff',
              outline: 'none',
              fontFamily: 'inherit',
              boxShadow: filled ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
              transition: 'all 180ms ease',
            }}
          />
        );
      })}
    </div>
  );
}

export default function MobileVerificationModal({
  isOpen,
  onClose,
  setupToken,
  initialPhone = '',
  userEmail = '',
  onSuccess,
}) {
  const router = useRouter();
  const { login, token } = useStore();

  const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [freeOtpHint, setFreeOtpHint] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone);
  }, [initialPhone]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const validatePhoneFormat = (val) => /^01[3-9]\d{8}$/.test(val.replace(/\s+/g, ''));

  const readResponse = async (res) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return res.json();
    const text = await res.text();
    return { message: text || 'Server returned an invalid response. Please try again.' };
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMsg('');

    const clean = phone.replace(/\s+/g, '').trim();
    if (!validatePhoneFormat(clean)) {
      setError('Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).');
      return;
    }

    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (!setupToken && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/auth/phone/send-otp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ setupToken, phone: clean }),
      });

      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to send code');

      setMaskedPhone(data.maskedPhone || clean);
      if (data.freeOtpHint) setFreeOtpHint(data.freeOtpHint);
      setInfoMsg(data.message || 'Verification code sent!');
      setStep(2);
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (!setupToken && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/auth/phone/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ setupToken, phone: phone.trim(), otp }),
      });

      const data = await readResponse(res);
      if (!res.ok) throw new Error(data.message || 'Verification failed');

      if (data.token && data.user) {
        login({ nextUser: data.user, nextToken: data.token });
      }

      setInfoMsg('Mobile number verified successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess(data);
        if (onClose) onClose();
      }, 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#ffffff',
          borderRadius: 24,
          padding: '32px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#4f46e5',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            ⚡ FREE MOBILE VERIFICATION TOOL
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            {step === 1 ? 'Verify Your Mobile Number' : 'Enter 6-Digit Code'}
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {step === 1
              ? 'Mandatory security step for all OpenBazar accounts. Verified phone numbers unlock all features.'
              : `We sent a code to ${maskedPhone || phone}.`}
          </p>
        </div>

        {/* Free Tool Sandbox Helper Banner */}
        {freeOtpHint && (
          <div
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
              border: '1.5px solid #a5b4fc',
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#3730a3', textTransform: 'uppercase' }}>
                ✨ Free Instant Test Verification Code:
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1e1b4b', letterSpacing: 2 }}>
                {freeOtpHint}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOtp(freeOtpHint)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              }}
            >
              Auto-Fill Code
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {infoMsg && !error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            ✅ {infoMsg}
          </div>
        )}

        {/* STEP 1: Enter Phone */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#4f46e5',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                Bangladeshi Mobile Number
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <span
                  style={{
                    height: 48,
                    padding: '0 12px',
                    borderRadius: 12,
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 700,
                    color: '#334155',
                    fontSize: 14,
                  }}
                >
                  🇧🇩 +88
                </span>
                <input
                  type="tel"
                  placeholder="01712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={11}
                  required
                  autoFocus
                  style={{
                    flex: 1,
                    height: 48,
                    padding: '0 14px',
                    borderRadius: 12,
                    border: '1.5px solid #6366f1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: 16,
                    fontWeight: 700,
                    outline: 'none',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.15)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                height: 48,
                borderRadius: 12,
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                color: '#ffffff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Sending Code...' : '📱 Send 6-Digit OTP Code'}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <OtpBoxes value={otp} onChange={setOtp} disabled={loading} />

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              style={{
                height: 48,
                borderRadius: 12,
                background:
                  loading || otp.length < 6
                    ? '#cbd5e1'
                    : 'linear-gradient(135deg, #16a34a, #059669)',
                color: '#ffffff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading || otp.length < 6 ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Verifying...' : '✅ Verify Mobile & Continue'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}
              >
                ← Change Number
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleSendOtp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: cooldown > 0 ? '#94a3b8' : '#4f46e5',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : '🔄 Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              color: '#64748b',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
