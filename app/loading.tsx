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
        {/* Animated village icon */}
        <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'v9-pulse 1.8s ease-in-out infinite' }}>
          ⛺
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 4px' }}>
          villa9e
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '0 0 28px' }}>
          It takes a village.
        </p>

        {/* Dot loader */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#1877F2',
                animation: `v9-bounce 0.8s ease-in-out infinite`,
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes v9-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes v9-bounce {
          0%, 100% { transform: translateY(0);   opacity: 0.4; }
          50%       { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
