import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FALLBACK_IMAGE } from '../utils/resolveImageSrc';

/**
 * SmartImage
 * - Uses next/image for lazy-loading + optimization
 * - Falls back to a safe placeholder if the image fails to load
 */
export default function SmartImage({
  src,
  alt,
  fallbackSrc = FALLBACK_IMAGE,
  onError,
  ...props
}) {
  const initial = src || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(initial);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(e) => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
        if (typeof onError === 'function') onError(e);
      }}
    />
  );
}
