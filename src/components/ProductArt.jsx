// Product imagery is drawn rather than fetched. Stock photography for a seeded
// catalogue means either broken hotlinks or random photos that don't match the
// listing; deterministic vector art stays on-brand, works offline, and adds no
// network weight.

const SHAPES = {
  headphones: (
    <>
      <path d="M22 54v-8a24 24 0 0 1 48 0v8" fill="none" strokeWidth="5" />
      <rect x="14" y="52" width="14" height="24" rx="6" />
      <rect x="64" y="52" width="14" height="24" rx="6" />
    </>
  ),
  earbuds: (
    <>
      <circle cx="34" cy="40" r="12" />
      <path d="M34 52v18a8 8 0 0 0 8 8" fill="none" strokeWidth="5" />
      <circle cx="62" cy="40" r="12" />
      <path d="M62 52v18" fill="none" strokeWidth="5" />
    </>
  ),
  laptop: (
    <>
      <rect x="18" y="26" width="56" height="38" rx="4" fill="none" strokeWidth="5" />
      <path d="M10 70h72l-6 8H16z" />
    </>
  ),
  phone: (
    <>
      <rect x="32" y="16" width="30" height="60" rx="6" fill="none" strokeWidth="5" />
      <line x1="42" y1="68" x2="52" y2="68" strokeWidth="4" />
    </>
  ),
  camera: (
    <>
      <path d="M14 34h14l6-8h20l6 8h14a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V38a4 4 0 0 1 4-4z" fill="none" strokeWidth="5" />
      <circle cx="47" cy="52" r="13" fill="none" strokeWidth="5" />
    </>
  ),
  speaker: (
    <>
      <rect x="20" y="16" width="24" height="60" rx="4" fill="none" strokeWidth="4" />
      <circle cx="32" cy="34" r="6" />
      <circle cx="32" cy="58" r="9" fill="none" strokeWidth="4" />
      <rect x="52" y="16" width="24" height="60" rx="4" fill="none" strokeWidth="4" />
      <circle cx="64" cy="34" r="6" />
      <circle cx="64" cy="58" r="9" fill="none" strokeWidth="4" />
    </>
  ),
  keyboard: (
    <>
      <rect x="10" y="32" width="76" height="34" rx="5" fill="none" strokeWidth="5" />
      <line x1="20" y1="44" x2="76" y2="44" strokeWidth="4" />
      <line x1="20" y1="55" x2="60" y2="55" strokeWidth="4" />
    </>
  ),
  monitor: (
    <>
      <rect x="12" y="20" width="72" height="44" rx="4" fill="none" strokeWidth="5" />
      <line x1="48" y1="64" x2="48" y2="74" strokeWidth="5" />
      <line x1="34" y1="76" x2="62" y2="76" strokeWidth="5" />
    </>
  ),
  kettle: (
    <>
      <path d="M28 40h32a6 6 0 0 1 6 6v22a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8V46a6 6 0 0 1 6-6z" fill="none" strokeWidth="5" />
      <path d="M66 46c10 2 14 8 14 16" fill="none" strokeWidth="5" />
      <path d="M34 40c0-8 6-12 12-12" fill="none" strokeWidth="5" />
    </>
  ),
  pot: (
    <>
      <path d="M20 42h56v22a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10z" fill="none" strokeWidth="5" />
      <line x1="14" y1="42" x2="82" y2="42" strokeWidth="5" />
      <line x1="48" y1="30" x2="48" y2="42" strokeWidth="5" />
    </>
  ),
  lamp: (
    <>
      <path d="M30 40l18-22 18 22z" fill="none" strokeWidth="5" />
      <line x1="48" y1="40" x2="48" y2="72" strokeWidth="5" />
      <line x1="32" y1="76" x2="64" y2="76" strokeWidth="6" />
    </>
  ),
  plant: (
    <>
      <path d="M32 48h32l-4 28H36z" fill="none" strokeWidth="5" />
      <path d="M48 48c0-14-6-22-14-24 0 12 6 20 14 24z" fill="none" strokeWidth="4" />
      <path d="M48 48c0-12 6-18 14-20-1 10-6 17-14 20z" fill="none" strokeWidth="4" />
    </>
  ),
  knife: (
    <>
      <path d="M16 54c14-18 30-28 44-30v14L28 60z" fill="none" strokeWidth="5" />
      <rect x="56" y="54" width="28" height="9" rx="4" transform="rotate(12 56 54)" />
    </>
  ),
  blanket: (
    <>
      <path d="M18 30h60v34c0 8-8 12-16 12H34c-10 0-16-6-16-14z" fill="none" strokeWidth="5" />
      <line x1="18" y1="44" x2="78" y2="44" strokeWidth="4" />
      <line x1="18" y1="56" x2="78" y2="56" strokeWidth="4" />
    </>
  ),
  book: (
    <>
      <path d="M24 18h38a8 8 0 0 1 8 8v52H32a8 8 0 0 1-8-8z" fill="none" strokeWidth="5" />
      <line x1="34" y1="34" x2="60" y2="34" strokeWidth="4" />
      <line x1="34" y1="46" x2="60" y2="46" strokeWidth="4" />
      <line x1="34" y1="58" x2="52" y2="58" strokeWidth="4" />
    </>
  ),
  shoe: (
    <>
      <path d="M14 62c0-10 6-14 12-18l10 8 14-10 8 6c12 2 24 6 28 14v6H16z" fill="none" strokeWidth="5" />
      <line x1="16" y1="70" x2="86" y2="70" strokeWidth="4" />
    </>
  ),
  jacket: (
    <>
      <path d="M34 20l14 8 14-8 16 10-6 14 6 34H24l6-34-6-14z" fill="none" strokeWidth="5" />
      <line x1="48" y1="28" x2="48" y2="78" strokeWidth="4" />
    </>
  ),
  watch: (
    <>
      <circle cx="48" cy="48" r="18" fill="none" strokeWidth="5" />
      <path d="M38 31l3-13h14l3 13M38 65l3 13h14l3-13" fill="none" strokeWidth="5" />
      <path d="M48 40v9l6 4" fill="none" strokeWidth="4" />
    </>
  ),
  backpack: (
    <>
      <path d="M26 36h44v40a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6z" fill="none" strokeWidth="5" />
      <path d="M36 36v-6a12 12 0 0 1 24 0v6" fill="none" strokeWidth="5" />
      <rect x="38" y="54" width="20" height="14" rx="3" fill="none" strokeWidth="4" />
    </>
  ),
  bottle: (
    <>
      <path d="M38 30h20v40a10 10 0 0 1-10 10 10 10 0 0 1-10-10z" fill="none" strokeWidth="5" />
      <rect x="41" y="16" width="14" height="14" rx="3" fill="none" strokeWidth="5" />
      <line x1="38" y1="52" x2="58" y2="52" strokeWidth="4" />
    </>
  ),
  mat: (
    <>
      <rect x="14" y="38" width="58" height="28" rx="6" fill="none" strokeWidth="5" />
      <ellipse cx="74" cy="52" rx="10" ry="14" fill="none" strokeWidth="5" />
    </>
  ),
  poles: (
    <>
      <line x1="34" y1="16" x2="30" y2="78" strokeWidth="5" />
      <line x1="62" y1="16" x2="66" y2="78" strokeWidth="5" />
      <rect x="28" y="20" width="12" height="8" rx="3" />
      <rect x="56" y="20" width="12" height="8" rx="3" />
    </>
  ),
  chair: (
    <>
      <path d="M32 18h32v34H32z" fill="none" strokeWidth="5" />
      <path d="M24 56h48v10H24z" fill="none" strokeWidth="5" />
      <line x1="48" y1="66" x2="48" y2="76" strokeWidth="5" />
      <path d="M32 82l16-6 16 6" fill="none" strokeWidth="5" />
    </>
  ),
  desk: (
    <>
      <rect x="12" y="38" width="72" height="8" rx="3" />
      <line x1="24" y1="46" x2="24" y2="80" strokeWidth="5" />
      <line x1="72" y1="46" x2="72" y2="80" strokeWidth="5" />
      <line x1="24" y1="62" x2="72" y2="62" strokeWidth="4" />
    </>
  ),
  notebook: (
    <>
      <rect x="26" y="18" width="44" height="60" rx="4" fill="none" strokeWidth="5" />
      <line x1="38" y1="18" x2="38" y2="78" strokeWidth="4" />
      <line x1="48" y1="36" x2="62" y2="36" strokeWidth="4" />
      <line x1="48" y1="48" x2="62" y2="48" strokeWidth="4" />
    </>
  ),
};

export default function ProductArt({ art, tint = '#4a5568', className = '', alt = '' }) {
  const shape = SHAPES[art] ?? SHAPES.book;
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role={alt ? 'img' : 'presentation'}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : 'true'}
    >
      <rect width="96" height="96" rx="10" fill={tint} opacity="0.12" />
      <g stroke={tint} fill={tint} strokeLinecap="round" strokeLinejoin="round">
        {shape}
      </g>
    </svg>
  );
}
