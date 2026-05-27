'use client';
import { motion } from 'framer-motion';

// Shared full-screen background for login + signup pages
export function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base gradient */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #06080E 0%, #08101E 50%, #060810 100%)' }} />

      {/* Radial glow — brand blue */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(24,119,242,0.12) 0%, transparent 70%)'
      }} />

      {/* Animated ambient orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(24,119,242,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 30, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }}
      />
      <motion.div
        animate={{ x: [0, 15, 0], y: [0, 25, 0], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,107,43,0.08) 0%, transparent 70%)', filter: 'blur(45px)' }}
      />

      {/* Halftone dot texture — Spider-Verse signature */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Tribal Adinkra pattern — top corners */}
      <svg className="absolute top-0 left-0 w-48 h-48 opacity-[0.04]" viewBox="0 0 200 200">
        {[0, 1, 2, 3].map(i => (
          <g key={i} transform={`translate(${30 + i*45}, 30)`}>
            <circle cx="20" cy="20" r="14" fill="none" stroke="#fff" strokeWidth="2"/>
            <line x1="6" y1="20" x2="34" y2="20" stroke="#fff" strokeWidth="2"/>
            <line x1="20" y1="6" x2="20" y2="34" stroke="#fff" strokeWidth="2"/>
          </g>
        ))}
      </svg>
      <svg className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.04] rotate-180" viewBox="0 0 200 200">
        {[0, 1, 2, 3].map(i => (
          <g key={i} transform={`translate(${30 + i*45}, 30)`}>
            <circle cx="20" cy="20" r="14" fill="none" stroke="#fff" strokeWidth="2"/>
            <line x1="6" y1="20" x2="34" y2="20" stroke="#fff" strokeWidth="2"/>
            <line x1="20" y1="6" x2="20" y2="34" stroke="#fff" strokeWidth="2"/>
          </g>
        ))}
      </svg>

      {/* Subtle Kente stripe band at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #1877F2, #7C3AED, #FF6B2B, #FFD700, #22C55E, #1877F2)', opacity: 0.35 }} />
    </div>
  );
}

// Google SVG logo
export function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
