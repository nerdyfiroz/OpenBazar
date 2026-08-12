import { useState, useId } from 'react';

/* ─── Password requirement rules ─────────────────────────────────────────── */
const REQUIREMENTS = [
  { id: 'len',   label: 'At least 8 characters',          test: (v) => v.length >= 8 },
  { id: 'upper', label: 'At least one uppercase (A–Z)',    test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'At least one lowercase (a–z)',    test: (v) => /[a-z]/.test(v) },
  { id: 'num',   label: 'At least one number (0–9)',       test: (v) => /[0-9]/.test(v) },
  { id: 'spec',  label: 'At least one special char (@#$%^&*!?)', test: (v) => /[@#$%^&*!?]/.test(v) },
];

/* ─── Strength config ────────────────────────────────────────────────────── */
const STRENGTH = [
  { label: 'Weak',   barW: '25%',  barColor: '#ef4444' },  // red-500
  { label: 'Weak',   barW: '25%',  barColor: '#ef4444' },  // red-500
  { label: 'Fair',   barW: '50%',  barColor: '#f97316' },  // orange-500
  { label: 'Good',   barW: '75%',  barColor: '#eab308' },  // yellow-500
  { label: 'Strong', barW: '100%', barColor: '#22c55e' },  // green-500
];

function calcStrength(value) {
  if (!value) return null;
  const met = REQUIREMENTS.filter((r) => r.test(value)).length;
  return STRENGTH[met] ?? STRENGTH[0];
}

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ width: 18, height: 18 }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ width: 18, height: 18 }}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
/**
 * PremiumPasswordInput — a premium password field for OpenBazar.
 *
 * Props:
 *   id           {string}   - input id (required for label association)
 *   value        {string}   - controlled value
 *   onChange     {function} - change handler  (e) => void
 *   label        {string}   - floating label text          [default: "Password"]
 *   showStrength {boolean}  - show strength bar + checklist [default: false]
 *   required     {boolean}  - html required attribute       [default: false]
 *   autoComplete {string}   - autocomplete hint             [default: "current-password"]
 *   name         {string}   - input name attribute
 */
export default function PremiumPasswordInput({
  id: propId,
  value = '',
  onChange,
  label = 'Password',
  showStrength = false,
  required = false,
  autoComplete = 'current-password',
  name,
}) {
  const generatedId = useId();
  const inputId = propId || generatedId;

  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const isFloating = focused || value.length > 0;
  const strength = showStrength ? calcStrength(value) : null;
  const metCount = showStrength
    ? REQUIREMENTS.filter((r) => r.test(value)).length
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* ── Input wrapper ── */}
      <div
        style={{
          position: 'relative',
          borderRadius: '0.75rem',           /* rounded-xl */
          border: `1.5px solid ${focused ? '#f97316' : '#e2e8f0'}`,  /* orange-500 / slate-200 */
          background: '#fff',
          boxShadow: focused
            ? '0 0 0 3px rgba(249,115,22,0.15)'  /* orange focus ring */
            : '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
        }}
      >
        {/* Floating label */}
        <label
          htmlFor={inputId}
          style={{
            position: 'absolute',
            left: '0.875rem',
            top: isFloating ? '0.35rem' : '50%',
            transform: isFloating ? 'translateY(0) scale(0.78)' : 'translateY(-50%) scale(1)',
            transformOrigin: 'left center',
            pointerEvents: 'none',
            color: focused ? '#f97316' : '#94a3b8',   /* orange-500 / slate-400 */
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1,
            transition: 'top 180ms ease, transform 180ms ease, color 180ms ease',
            zIndex: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>

        {/* Actual input */}
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          autoComplete={autoComplete}
          style={{
            display: 'block',
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            paddingTop: isFloating ? '1.5rem' : '0.75rem',
            paddingBottom: '0.5rem',
            paddingLeft: '0.875rem',
            paddingRight: '2.75rem',
            fontSize: '0.875rem',
            color: '#1e293b',           /* slate-800 */
            boxSizing: 'border-box',
            transition: 'padding-top 180ms ease',
            lineHeight: '1.4',
            minHeight: '3rem',
          }}
          aria-describedby={showStrength ? `${inputId}-strength` : undefined}
        />

        {/* Show / Hide toggle */}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            color: focused ? '#f97316' : '#94a3b8',
            transition: 'color 180ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.375rem',
            lineHeight: 0,
          }}
          onFocus={(e) => { e.currentTarget.style.outline = '2px solid #f97316'; e.currentTarget.style.outlineOffset = '2px'; }}
          onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
        >
          <span
            style={{
              display: 'inline-block',
              transition: 'opacity 150ms ease, transform 150ms ease',
              opacity: visible ? 0 : 1,
              transform: visible ? 'scale(0.7)' : 'scale(1)',
              position: 'absolute',
            }}
          >
            <EyeIcon />
          </span>
          <span
            style={{
              display: 'inline-block',
              transition: 'opacity 150ms ease, transform 150ms ease',
              opacity: visible ? 1 : 0,
              transform: visible ? 'scale(1)' : 'scale(0.7)',
            }}
          >
            <EyeOffIcon />
          </span>
        </button>
      </div>

      {/* ── Strength section (only when showStrength=true and value is non-empty) ── */}
      {showStrength && value.length > 0 && (
        <div id={`${inputId}-strength`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Bar + label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Bar track */}
            <div
              style={{
                flex: 1,
                height: 5,
                borderRadius: 9999,
                background: '#f1f5f9',   /* slate-100 */
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: strength?.barW ?? '0%',
                  background: strength?.barColor ?? '#ef4444',
                  borderRadius: 9999,
                  transition: 'width 350ms cubic-bezier(0.4,0,0.2,1), background-color 300ms ease',
                }}
              />
            </div>
            {/* Strength label */}
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: strength?.barColor ?? '#ef4444',
                minWidth: 42,
                textAlign: 'right',
                transition: 'color 300ms ease',
              }}
            >
              {strength?.label}
            </span>
          </div>

          {/* Requirements checklist */}
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '3px 12px',
            }}
            aria-label="Password requirements"
          >
            {REQUIREMENTS.map((req) => {
              const satisfied = req.test(value);
              return (
                <li
                  key={req.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.7rem',
                    color: satisfied ? '#16a34a' : '#94a3b8',  /* green-600 / slate-400 */
                    fontWeight: satisfied ? 600 : 400,
                    transition: 'color 200ms ease',
                  }}
                  aria-label={`${req.label}: ${satisfied ? 'satisfied' : 'not satisfied'}`}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: satisfied ? '#dcfce7' : '#f1f5f9',  /* green-100 / slate-100 */
                      color: satisfied ? '#16a34a' : '#94a3b8',
                      fontWeight: 700,
                      fontSize: '0.6rem',
                      flexShrink: 0,
                      transition: 'background 200ms ease, color 200ms ease',
                    }}
                    aria-hidden="true"
                  >
                    {satisfied ? '✓' : '×'}
                  </span>
                  {req.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
