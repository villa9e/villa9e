import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Dynamic OG image generation for villa9e social sharing
// Usage: /api/og?title=My+Goal&type=goal&score=72&username=legaci
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title    = searchParams.get('title')    ?? 'It takes a village.';
  const type     = searchParams.get('type')     ?? 'default';    // default|goal|villager|tribe
  const score    = searchParams.get('score')    ?? '';
  const username = searchParams.get('username') ?? '';
  const tier     = searchParams.get('tier')     ?? 'seedling';

  const tierColors: Record<string, string> = {
    legend:   '#FFD700',
    elder:    '#8B5CF6',
    builder:  '#1877F2',
    grower:   '#22C55E',
    seedling: '#94A3B8',
  };
  const accentColor = tierColors[tier] ?? '#1877F2';

  const typeEmoji: Record<string, string> = {
    goal:     '📍',
    villager: '⛺',
    tribe:    '👥',
    default:  '🌀',
  };
  const emoji = typeEmoji[type] ?? '🌀';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg, #06080E 0%, #08101E 60%, #060810 100%)',
          fontFamily: '"Inter", system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          transform: 'translateX(-50%)',
          display: 'flex',
        }} />

        {/* Kente stripe at top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
          background: 'linear-gradient(90deg, #1877F2, #7C3AED, #FF6B2B, #FFD700, #22C55E, #1877F2)',
          display: 'flex',
        }} />

        {/* Halftone dots pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          display: 'flex',
        }} />

        {/* Content */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          flex: 1, padding: '60px', textAlign: 'center', gap: '24px',
          position: 'relative',
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '48px' }}>⛺</span>
            <span style={{ fontSize: '36px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-1px' }}>
              villa9e
            </span>
          </div>

          {/* Main emoji */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '24px',
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
            border: `2px solid ${accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '52px',
          }}>
            {emoji}
          </div>

          {/* Title */}
          <div style={{
            fontSize: title.length > 50 ? '36px' : title.length > 30 ? '44px' : '54px',
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
            maxWidth: '900px',
            letterSpacing: '-1px',
          }}>
            {title}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {username && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 20px', borderRadius: '100px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <span style={{ color: '#94A3B8', fontSize: '16px' }}>@</span>
                <span style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 700 }}>{username}</span>
              </div>
            )}
            {score && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 20px', borderRadius: '100px',
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}40`,
              }}>
                <span style={{ color: accentColor, fontSize: '18px', fontWeight: 900 }}>{score}%</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>GPS score</span>
              </div>
            )}
            {tier && tier !== 'seedling' && (
              <div style={{
                padding: '6px 16px', borderRadius: '100px',
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}35`,
                color: accentColor, fontSize: '14px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '1px',
                display: 'flex',
              }}>
                {tier}
              </div>
            )}
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: '20px', color: 'rgba(255,255,255,0.4)',
            marginTop: '4px',
          }}>
            It takes a village. · villa9e.app
          </div>
        </div>

        {/* Bottom Kente stripe */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #FFD700, #FF6B2B, #1877F2, #22C55E, #FFD700)',
          display: 'flex',
        }} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
