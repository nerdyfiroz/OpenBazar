/**
 * Central place to resolve the backend API base URL.
 *
 * Why this exists:
 * - When NEXT_PUBLIC_API_BASE is missing in production, the previous fallback
 *   (`http://localhost:5000/api`) makes the deployed site call the visitor's
 *   own machine (and everything fails).
 * - Also prevents typos / inconsistent defaults across pages.
 */

// Default Render backend (used for preview deployments or as a last resort).
const PRODUCTION_BACKEND_API = 'https://openbazar.onrender.com/api';

export function getApiBase() {
  const envBase = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE)
    ? String(process.env.NEXT_PUBLIC_API_BASE)
    : '';

  if (envBase.trim()) {
    return envBase.replace(/\/+$/, '');
  }

  // Runtime fallback for deployed frontend when env vars are not present.
  if (typeof window !== 'undefined') {
    const host = String(window.location?.hostname || '').toLowerCase();

    // On the real domain, prefer same-origin so we hit the “real” backend/data.
    // (Hardcoding Render here often leads to “missing existing data” because it's a different DB.)
    if (host.endsWith('open-bazar.me')) {
      const origin = String(window.location?.origin || '').replace(/\/+$/, '');
      if (origin) return `${origin}/api`;
    }

    // On preview deployments, use the Render backend by default.
    if (host.endsWith('vercel.app')) {
      return PRODUCTION_BACKEND_API;
    }
  }

  // Local dev default.
  return 'http://localhost:5000/api';
}

export function getBackendOrigin() {
  return getApiBase().replace(/\/api\/?$/, '');
}
