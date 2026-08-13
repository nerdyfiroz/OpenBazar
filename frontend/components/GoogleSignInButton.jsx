import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from './StoreProvider';
import { getApiBase } from '../utils/apiBase';

const API_BASE = getApiBase();

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

export default function GoogleSignInButton({ redirectTo = '/', onSuccess, label = 'Continue with Google' }) {
  const { login } = useStore();
  const router = useRouter();
  const btnRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      finishLogin(data);
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
    <div>
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
  );
}
