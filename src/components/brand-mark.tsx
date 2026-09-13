/**
 * Brand lockup: the coral camera mark plus the LENSADIRI wordmark.
 *
 * The mark is inlined rather than loaded from `public/brand/` through `<img>`
 * so it inherits nothing and paints on the first frame. The wordmark stays live
 * text instead of SVG paths, which is what lets it pick up the site font and
 * stay selectable and searchable.
 *
 * `idPrefix` is required because the gradients need `id`s to reference, and the
 * mark renders more than once per page (header and footer). Hardcoding the ids
 * produced duplicate DOM ids, which the accessibility suite fails on.
 */
export function BrandMark({
  className = "h-7 w-7",
  idPrefix,
}: {
  className?: string;
  idPrefix: string;
}) {
  const coralId = `${idPrefix}-coral-sheen`;
  const glossId = `${idPrefix}-lens-gloss`;
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={coralId}
          x1="12"
          y1="12"
          x2="108"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FF9B79" />
          <stop offset="100%" stopColor="#E8724C" />
        </linearGradient>
        <linearGradient id={glossId} x1="36" y1="36" x2="84" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Tactile squircle camera body */}
      <rect x="4" y="4" width="112" height="112" rx="30" fill={`url(#${coralId})`} />
      {/* Soft optical ring */}
      <circle cx="60" cy="60" r="34" fill="#FFF8F5" fillOpacity="0.25" />
      {/* Ceramic aperture cylinder */}
      <circle cx="60" cy="60" r="26" fill="#FFFFFF" />
      {/* Graphite lens core */}
      <circle cx="60" cy="60" r="16" fill="#1C1D20" />
      <circle cx="60" cy="60" r="16" fill={`url(#${glossId})`} />
      {/* Sage iris glint */}
      <circle cx="65" cy="55" r="5.5" fill="#6BBF7A" />
      {/* Specular catchlight */}
      <circle cx="55.5" cy="64.5" r="2.5" fill="#FFFFFF" />
      {/* Viewfinder dot */}
      <circle cx="89" cy="31" r="6" fill="#6BBF7A" stroke="#FFFFFF" strokeWidth="2.5" />
    </svg>
  );
}
