import { useState } from 'react';
import { photoUrl, photoSrcSet } from '../data/images';
import { findProduct } from '../data/catalog';

// Real product photography. Every card reserves a square box and the image fills
// it with object-fit: cover, so mixed source aspect ratios can't shift the layout
// while they load. If a photo fails to load we fall back to a neutral tile rather
// than a broken-image icon.
export default function ProductImage({ id, alt = '', className = '', sizes = '(max-width: 640px) 45vw, 300px', eager = false }) {
  const [failed, setFailed] = useState(false);
  const src = photoUrl(id, 600);
  const srcSet = photoSrcSet(id);

  if (!src || failed) {
    const tint = findProduct(id)?.tint ?? '#5b6b8c';
    return (
      <div
        className={`flex items-center justify-center overflow-hidden rounded-lg ${className}`}
        style={{ background: `color-mix(in srgb, ${tint} 12%, var(--bg-sunken))`, aspectRatio: '1 / 1' }}
        role="img"
        aria-label={alt}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={tint} strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="m4 17 5-5 4 4 3-3 4 4" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg ${className}`}
      style={{ background: 'var(--bg-sunken)', aspectRatio: '1 / 1' }}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
        style={{ display: 'block' }}
      />
    </div>
  );
}
