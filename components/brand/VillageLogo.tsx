interface VillageLogoProps {
  size?: number;
  variant?: 'circle' | 'flat';
  className?: string;
}

/**
 * villa9e teepee logo — two crossing poles, dark door, flat long shadow.
 * variant="circle" — white tent on brand-blue circle (app icon style)
 * variant="flat"   — blue tent on white with gray shadow (standalone)
 */
export function VillageLogo({ size = 48, variant = 'circle', className }: VillageLogoProps) {
  if (variant === 'flat') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Flat long shadow — light gray, offset right+down */}
        <polygon
          points="50,18 86,74 100,90 60,90 14,74"
          fill="#C8D0DC"
          opacity="0.55"
        />
        {/* Base ground line shadow */}
        <rect x="14" y="74" width="80" height="4" rx="2" fill="#C8D0DC" opacity="0.45" />

        {/* Tent body */}
        <polygon points="50,18 86,74 14,74" fill="#1877F2" />

        {/* Door triangle (darker blue) */}
        <polygon points="50,50 63,74 37,74" fill="#1255C4" />

        {/* Left pole — goes up-right from apex */}
        <line x1="47" y1="18" x2="55" y2="4"  stroke="#1877F2" strokeWidth="4" strokeLinecap="round" />
        {/* Right pole — goes up-left from apex, crossing the left one */}
        <line x1="53" y1="18" x2="45" y2="4"  stroke="#1877F2" strokeWidth="4" strokeLinecap="round" />

        {/* Base horizontal bar */}
        <line x1="10" y1="74" x2="90" y2="74" stroke="#1877F2" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  // variant === 'circle' — white tent on brand-blue circle
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id="v9-circle-clip">
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>

      {/* Blue circle background */}
      <circle cx="50" cy="50" r="50" fill="#1877F2" />

      {/* Long flat shadow inside circle — darker blue */}
      <g clipPath="url(#v9-circle-clip)">
        <polygon
          points="50,24 84,76 100,100 28,100 16,76"
          fill="#1255C4"
          opacity="0.7"
        />
      </g>

      {/* Tent body — white */}
      <polygon points="50,24 84,76 16,76" fill="white" />

      {/* Door triangle — medium blue */}
      <polygon points="50,54 62,76 38,76" fill="#1565C0" />

      {/* Left pole */}
      <line x1="47" y1="24" x2="55" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      {/* Right pole */}
      <line x1="53" y1="24" x2="45" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />

      {/* Base bar */}
      <line x1="12" y1="76" x2="88" y2="76" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
