/**
 * Resolve a product image path to a full URL.
 *
 * - Already absolute (http/https) → use as-is
 * - Relative path (/uploads/...) → prepend backend origin
 *   so <img> and next/image both load from the correct server
 */
const BACKEND_ORIGIN =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001/api').replace(/\/api\/?$/, '')
    : (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';

export function resolveImageSrc(src) {
  if (!src) return FALLBACK_IMAGE;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  // Relative path like /uploads/products/file.jpg
  const path = src.startsWith('/') ? src : `/${src}`;
  return `${BACKEND_ORIGIN}${path}`;
}
