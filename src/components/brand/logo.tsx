/**
 * NetClass brand logo
 * LogoMark: compact icon (used in collapsed sidebar, tabs)
 * LogoFull: icon + wordmark (expanded sidebar, auth pages)
 */

type LogoProps = { size?: number; className?: string };

export function LogoMark({ size = 28, className = "" }: LogoProps) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NetClass"
    >
      <defs>
        <linearGradient id="nc-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>

      {/* Rounded background */}
      <rect width="40" height="40" rx="10" fill="url(#nc-grad)" />

      {/* Open book pages */}
      <path d="M8 14 C8 14 14 12 20 14 L20 28 C14 26 8 28 8 28 Z" fill="white" fillOpacity="0.9" />
      <path d="M32 14 C32 14 26 12 20 14 L20 28 C26 26 32 28 32 28 Z" fill="white" fillOpacity="0.75" />

      {/* Spine of the book */}
      <line x1="20" y1="14" x2="20" y2="28" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />

      {/* Mortarboard */}
      <path d="M20 6 L28 10 L20 14 L12 10 Z" fill="white" />
      <path d="M26.5 11.8 L26.5 17 C26.5 19.5 23.5 21 20 21 C16.5 21 13.5 19.5 13.5 17 L13.5 11.8" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <line x1="28" y1="10" x2="28" y2="15.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="28" cy="16.5" r="1.2" fill="white" fillOpacity="0.85" />
    </svg>
  );
}

export function LogoFull({ size = 28, className = "" }: LogoProps) {
  return (
    <span className={`flex items-center gap-2 select-none ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize: size * 0.6, lineHeight: 1 }}
      >
        <span style={{ color: "var(--color-foreground)" }}>Net</span>
        <span style={{ color: "var(--color-primary)" }}>Class</span>
      </span>
    </span>
  );
}
