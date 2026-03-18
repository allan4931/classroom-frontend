/**
 * ClassroomHQ – custom brand logo
 * Used in the sidebar header and browser tab favicon (inline SVG).
 */

type LogoProps = {
  size?: number;
  className?: string;
};

/** Full lockup: icon + wordmark side by side */
export function LogoFull({ size = 28, className = "" }: LogoProps) {
  return (
    <span className={`flex items-center gap-2 select-none ${className}`}>
      <LogoMark size={size} />
      <span className="font-extrabold tracking-tight text-foreground" style={{ fontSize: size * 0.57 }}>
        Classroom<span className="text-primary">HQ</span>
      </span>
    </span>
  );
}

/** Icon-only version (used when sidebar is collapsed) */
export function LogoMark({ size = 28, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ClassroomHQ"
    >
      {/* Rounded square background */}
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-primary" />

      {/* Mortarboard top (flat board) */}
      <path
        d="M7 13.5L16 9L25 13.5L16 18L7 13.5Z"
        fill="white"
        fillOpacity="0.95"
      />

      {/* Tassel string */}
      <line x1="25" y1="13.5" x2="25" y2="20" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="25" cy="21" r="1.5" fill="white" fillOpacity="0.8" />

      {/* Cap body (below board) */}
      <path
        d="M11.5 15.8V20.5C11.5 22.2 13.5 23.5 16 23.5C18.5 23.5 20.5 22.2 20.5 20.5V15.8"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
