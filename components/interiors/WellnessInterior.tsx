'use client';
import { motion } from 'framer-motion';

// ─── Coral reef silhouette ────────────────────────────────────────────────────
function CoralReef({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right';
  return (
    <svg width="120" height="400" viewBox="0 0 120 400"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <path d="M0,380 Q60,360 120,380 L120,400 L0,400 Z" fill="#1A3A2A" opacity="0.5" />
      {/* Branching coral */}
      <g transform="translate(20,320)" opacity="0.55">
        <path d="M0,60 L0,20 M-10,35 L0,20 L10,35" stroke="#E8526A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M-10,35 L-18,15 M-10,35 L-4,18" stroke="#E8526A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M10,35 L18,16 M10,35 L4,18" stroke="#E8526A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[-18,-4,4,18].map((x, i) => <circle key={i} cx={x} cy={15} r="3.5" fill="#FF7088" />)}
        <circle cx="0" cy="20" r="3" fill="#FF5570" />
      </g>
      {/* Fan coral */}
      <g transform="translate(72,300)" opacity="0.45">
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 6) * 180 - 90;
          const rad = a * Math.PI / 180;
          return <line key={i} x1="0" y1="80" x2={Math.sin(rad) * 55} y2={80 - Math.cos(rad) * 55}
            stroke="#FF8C42" strokeWidth={1.5} opacity="0.6" />;
        })}
      </g>
      {/* Seaweed */}
      {[48].map((x, j) => (
        <path key={j} d={`M${x},380 Q${x + 8},340 ${x},300 Q${x - 8},260 ${x},220`}
          fill="none" stroke="#2A8A4A" strokeWidth="4" opacity="0.35" />
      ))}
      <path d="M60,180 L48,174 L60,168 Z" fill="#60B8E8" opacity="0.3" />
      <ellipse cx="64" cy="174" rx="12" ry="7" fill="#60B8E8" opacity="0.25" />
    </svg>
  );
}

function Bubbles() {
  return (
    <>
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none rounded-full"
          style={{
            width:  3 + (i % 5), height: 3 + (i % 5),
            left:   `${(i * 29 + 5) % 92}%`,
            border: `1px solid rgba(120,200,255,${0.2 + (i % 4) * 0.08})`,
            background: 'rgba(120,200,255,0.06)',
            zIndex: 2,
          }}
          animate={{ y: ['90vh', '-5vh'], opacity: [0, 0.5, 0] }}
          transition={{ duration: 8 + (i % 4) * 2, repeat: Infinity, delay: i * 0.55, ease: 'linear' }}
        />
      ))}
    </>
  );
}

export function WellnessInterior({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(180deg, #040E18 0%, #061420 40%, #040C14 100%)' }}>

      <div className="fixed inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, rgba(20,80,140,0.25) 0%, transparent 55%),
          radial-gradient(ellipse at 20% 80%, rgba(30,120,100,0.12) 0%, transparent 45%)`,
        zIndex: 0,
      }} />

      {/* Ocean surface shimmer */}
      <div className="fixed top-0 left-0 right-0 h-20 pointer-events-none" style={{ zIndex: 1 }}>
        <motion.div
          style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(40,120,200,0.12) 0%, transparent 100%)' }}
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="fixed left-0 bottom-0 pointer-events-none" style={{ zIndex: 1 }}>
        <CoralReef side="left" />
      </div>
      <div className="fixed right-0 bottom-0 pointer-events-none" style={{ zIndex: 1 }}>
        <CoralReef side="right" />
      </div>

      <Bubbles />

      {/* Healing glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 1 }}>
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.06, 0.15, 0.06] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 320, height: 320,
            background: 'radial-gradient(circle, rgba(100,200,255,1) 0%, transparent 70%)',
            filter: 'blur(40px)' }}
        />
      </div>

      {/* Caustic light ripples */}
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div key={i}
          className="fixed pointer-events-none rounded-full"
          style={{
            width: 40 + i * 15, height: 15 + i * 5,
            left: `${10 + (i * 14) % 75}%`, top: `${20 + (i * 17) % 50}%`,
            border: '1px solid rgba(80,180,255,0.1)', filter: 'blur(2px)', zIndex: 1,
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
