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
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⛺</div>
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
