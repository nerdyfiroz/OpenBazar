/**
 * Resolve a product image path to a full URL.
 *
 * Priority:
 *  1. Already absolute (http/https) → use as-is
 *  2. Relative path (/uploads/...) → prepend BACKEND_ORIGIN from env
 *  3. null / empty → return FALLBACK_IMAGE
 *
 * BACKEND_ORIGIN is derived from NEXT_PUBLIC_API_BASE by stripping "/api".
 * Example:
 *   NEXT_PUBLIC_API_BASE = "http://localhost:5001/api"
 *   BACKEND_ORIGIN       = "http://localhost:5001"
 *   Input  : "/uploads/products/fan.jpg"
 *   Output : "http://localhost:5001/uploads/products/fan.jpg"
 */
export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=800';
// ↑ generic shopping bag — neutral placeholder

function getBackendOrigin() {
  const base =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE) ||
    'http://localhost:5001/api';
  // Strip trailing /api or /api/ to get the bare origin
  return base.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

const BACKEND_ORIGIN = getBackendOrigin();

export function resolveImageSrc(src) {
  if (!src) return FALLBACK_IMAGE;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  // Relative path like /uploads/products/file.jpg
  const path = src.startsWith('/') ? src : `/${src}`;
  return `${BACKEND_ORIGIN}${path}`;
}
