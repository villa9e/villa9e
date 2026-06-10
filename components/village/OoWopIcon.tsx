// Shared OoWop fist icon — single source of truth for the brand asset.
// Source artwork is a white fist on transparent background; pass `invert`
// for use on light surfaces (renders as black).
export function OoWopIcon({ size = 24, invert = false, className, style }: {
  size?: number; invert?: boolean; className?: string; style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/oowop.png"
      alt="OoWop"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'inline-block', filter: invert ? 'invert(1)' : 'none', ...style }}
    />
  );
}
