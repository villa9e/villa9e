'use client';
import { motion } from 'framer-motion';

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

        {/* Animated logo — shadow orbits the tent like the sun going around it */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <svg
            width="96"
            height="96"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id="lc">
                <circle cx="50" cy="50" r="50" />
              </clipPath>
            </defs>

            {/* Blue circle background */}
            <circle cx="50" cy="50" r="50" fill="#1877F2" />

            {/*
              Shadow orbit: the shadow polygon pivots around the tent's
              base center (50, 73). We translate to that pivot, rotate,
              draw the shadow pointing "down" from the pivot, then let
              the clipPath clip it to the circle.
            */}
            <g clipPath="url(#lc)">
              <g transform="translate(50, 73)">
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  {/*
                    Shadow shape centred on the pivot (0,0).
                    Points downward — tapers as it extends away from the tent.
                    As the group rotates, the shadow sweeps around the tent.
                  */}
                  <polygon
                    points="-22,0 22,0 38,55 -38,55"
                    fill="#0E3A8C"
                    opacity="0.82"
                  />
                </motion.g>
              </g>
            </g>

            {/* Tent body — white, rendered on top of shadow so it stays sharp */}
            <g clipPath="url(#lc)">
              <polygon points="50,20 86,73 14,73" fill="white" />
              {/* Door triangle */}
              <polygon points="50,51 62,73 38,73" fill="#1565C0" />
            </g>

            {/* Poles — outside clip so they extend above the circle edge */}
            <line x1="47" y1="20" x2="55"  y2="6" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <line x1="53" y1="20" x2="45"  y2="6" stroke="white" strokeWidth="3" strokeLinecap="round" />

            {/* Base bar */}
            <line x1="12" y1="73" x2="88" y2="73" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '26px',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.5px',
          margin: '0 0 4px',
        }}>
          villa9e
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '0 0 24px' }}>
          It takes a village.
        </p>

        {/* Subtle dot trail */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
              style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1877F2' }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
