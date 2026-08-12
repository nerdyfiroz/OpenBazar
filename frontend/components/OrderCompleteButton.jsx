import { useEffect, useRef } from 'react';

/* ─── Particle data: offset-x per particle ─────────────────────────────── */
const PARTICLES = [
  { id: 1, px: '-8px',  delay: '0s',    dur: '0.55s' },
  { id: 2, px: '0px',   delay: '0.15s', dur: '0.6s'  },
  { id: 3, px: '9px',   delay: '0.08s', dur: '0.5s'  },
  { id: 4, px: '-4px',  delay: '0.25s', dur: '0.65s' },
];

/* ─── Package SVG (small box icon) ─────────────────────────────────────── */
function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 20, height: 20 }}
    >
      <path d="M16.5 9.4l-9-5.19" />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

/* ─── Animated checkmark SVG ────────────────────────────────────────────── */
function CheckmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        width: 18,
        height: 18,
        display: 'inline-block',
        verticalAlign: 'middle',
        marginLeft: 6,
      }}
    >
      <path
        d="M5 13l4 4L19 7"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: 0,
          animation: 'checkmark-draw 0.45s cubic-bezier(0.4,0,0.2,1) forwards',
        }}
      />
    </svg>
  );
}

/* ─── Trailing line ─────────────────────────────────────────────────────── */
function TrailingLine({ active }) {
  if (!active) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '12%',
        right: '14%',
        top: '50%',
        height: 2,
        borderRadius: 9999,
        background:
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.38) 80%, transparent 100%)',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
/**
 * OrderCompleteButton
 *
 * Props:
 *   status   {'idle'|'processing'|'success'|'error'}
 *   disabled  boolean  — extra guard (e.g. cart empty)
 */
export default function OrderCompleteButton({ status = 'idle', disabled = false }) {
  const isIdle       = status === 'idle';
  const isProcessing = status === 'processing';
  const isSuccess    = status === 'success';
  const isError      = status === 'error';
  const isLocked     = isProcessing || isSuccess;

  /* ── Button background colour ── */
  const bgColor = isSuccess
    ? '#16a34a'          /* green-600 */
    : isError
    ? '#ef4444'          /* red-500   */
    : '#f97316';         /* orange-500 */

  const hoverBg = isSuccess ? '#15803d' : '#ea6b0f';

  /* ── Pill style ── */
  const pillStyle = {
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '3rem',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    border: 'none',
    borderRadius: '0.75rem',
    background: bgColor,
    color: '#fff',
    fontSize: '0.9375rem',
    fontWeight: 700,
    letterSpacing: '0.01em',
    cursor: isLocked || disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    transition: 'background 400ms ease, box-shadow 300ms ease, transform 200ms ease',
    boxShadow: isProcessing
      ? '0 0 0 3px rgba(249,115,22,0.25), 0 4px 14px rgba(249,115,22,0.35)'
      : isSuccess
      ? '0 0 0 3px rgba(22,163,74,0.25), 0 4px 14px rgba(22,163,74,0.3)'
      : '0 2px 8px rgba(249,115,22,0.25)',
    animation: isSuccess
      ? 'btn-success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'
      : isError
      ? 'btn-error-shake 0.45s ease forwards'
      : 'none',
    outline: 'none',
  };

  return (
    <>
      {/* ── Accessibility live region ── */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
        }}
      >
        {isProcessing && 'Placing order…'}
        {isSuccess    && 'Order placed successfully.'}
        {isError      && 'Order placement failed. Please try again.'}
      </span>

      <button
        type={isIdle ? 'submit' : 'button'}
        disabled={isLocked || disabled}
        aria-disabled={isLocked || disabled}
        aria-label={
          isProcessing ? 'Placing order…'
          : isSuccess  ? 'Order placed successfully'
          : isError    ? 'Order failed, please try again'
          : 'Complete Order'
        }
        style={pillStyle}
        onMouseEnter={(e) => {
          if (!isLocked && !disabled) e.currentTarget.style.background = hoverBg;
        }}
        onMouseLeave={(e) => {
          if (!isLocked && !disabled) e.currentTarget.style.background = bgColor;
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px rgba(249,115,22,0.4), 0 2px 8px rgba(249,115,22,0.25)`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = pillStyle.boxShadow;
        }}
      >
        {/* ── IDLE label ── */}
        {isIdle && (
          <span style={{ animation: 'label-fade-in 0.2s ease forwards' }}>
            Complete Order
          </span>
        )}

        {/* ── PROCESSING animation ── */}
        {isProcessing && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Trailing line */}
            <TrailingLine active />

            {/* Traveling package */}
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                animation: 'pkg-travel 1.7s cubic-bezier(0.4,0,0.2,1) infinite',
                filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.6))',
              }}
            >
              <PackageIcon />

              {/* Particles */}
              {PARTICLES.map((p) => (
                <span
                  key={p.id}
                  style={{
                    '--px': p.px,
                    position: 'absolute',
                    bottom: '65%',
                    left: '50%',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.85)',
                    animation: `pkg-particle ${p.dur} ${p.delay} ease-out infinite`,
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </span>
          </span>
        )}

        {/* ── SUCCESS state ── */}
        {isSuccess && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              animation: 'label-fade-in 0.3s 0.1s ease both',
            }}
          >
            Order Placed
            <CheckmarkIcon />
          </span>
        )}

        {/* ── ERROR state ── */}
        {isError && (
          <span style={{ animation: 'label-fade-in 0.2s ease forwards' }}>
            Try Again
          </span>
        )}
      </button>
    </>
  );
}
