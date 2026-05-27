export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060810',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Real villa9e logo SVG — circle variant */}
        <svg
          width="72"
          height="72"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ marginBottom: '16px', display: 'block', margin: '0 auto 16px' }}
        >
          <defs>
            <clipPath id="load-clip">
              <circle cx="50" cy="50" r="50" />
            </clipPath>
          </defs>
          <circle cx="50" cy="50" r="50" fill="#1877F2" />
          <g clipPath="url(#load-clip)">
            <polygon points="50,24 84,76 100,100 28,100 16,76" fill="#1255C4" opacity="0.7" />
          </g>
          <polygon points="50,24 84,76 16,76" fill="white" />
          <polygon points="50,54 62,76 38,76" fill="#1565C0" />
          <line x1="47" y1="24" x2="55" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="53" y1="24" x2="45" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="76" x2="88" y2="76" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>

        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 4px' }}>
          villa9e
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '0 0 28px' }}>
          It takes a village.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#1877F2',
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
