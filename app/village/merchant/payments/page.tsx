'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ── Icons ────────────────────────────────────────────────────────────────────
function CopyIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>; }
function DownloadIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>; }
function ShareIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>; }
function LinkIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>; }
function TrashIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>; }
function CheckIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>; }

// ── QR Placeholder ───────────────────────────────────────────────────────────
function QRCode({ name, size = 240 }: { name: string; size?: number }) {
  const cells: JSX.Element[] = [];
  const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 42);
  const GRID = 25;
  const cell = size / GRID;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const corner = (r < 7 && c < 7) || (r < 7 && c >= GRID - 7) || (r >= GRID - 7 && c < 7);
      const innerCorner =
        (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
        (r >= 2 && r <= 4 && c >= GRID - 5 && c <= GRID - 3) ||
        (r >= GRID - 5 && r <= GRID - 3 && c >= 2 && c <= 4);
      const borderCorner = corner && !innerCorner &&
        !(r >= 1 && r <= 5 && c >= 1 && c <= 5) &&
        !(r >= 1 && r <= 5 && c >= GRID - 6 && c <= GRID - 2) &&
        !(r >= GRID - 6 && r <= GRID - 2 && c >= 1 && c <= 5);
      const inLogo = r >= 10 && r <= 14 && c >= 10 && c <= 14;
      if (inLogo) continue;
      const filled = innerCorner ? true :
        corner ? (r === 0 || r === 6 || c === 0 || c === 6 || r === GRID - 1 || r === GRID - 7 || c === GRID - 1 || c === GRID - 7 || borderCorner) :
        ((r * 17 + c * 11 + seed * (r + 1)) % 3 === 0);
      if (filled) {
        cells.push(<rect key={`${r}-${c}`} x={c * cell + 1} y={r * cell + 1} width={cell - 2} height={cell - 2} rx={1.5} fill="#412402" />);
      }
    }
  }
  const logoSize = cell * 5;
  const logoX = 10 * cell;
  const logoY = 10 * cell;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="white" rx={8} />
      {cells}
      <rect x={logoX - 4} y={logoY - 4} width={logoSize + 8} height={logoSize + 8} rx={6} fill="white" />
      <path
        d={`M${logoX + logoSize/2} ${logoY + 2}L${logoX + 2} ${logoY + logoSize - 4}h${logoSize * 0.35}l${logoSize * 0.07} ${-logoSize * 0.18}h${logoSize * 0.22}l${logoSize * 0.07} ${logoSize * 0.18}h${logoSize * 0.35}L${logoX + logoSize/2} ${logoY + 2}z`}
        fill="#EF9F27"
      />
      <rect x={logoX + logoSize * 0.38} y={logoY + logoSize * 0.58} width={logoSize * 0.24} height={logoSize * 0.38} rx={3} fill="rgba(65,36,2,0.4)" />
    </svg>
  );
}

// ── Mock payment links ────────────────────────────────────────────────────────
const MOCK_LINKS = [
  { id: 'lnk001', desc: 'Custom ceramics order', amount: null, currency: 'VICO', created: '2026-05-28', expires: null, uses: 3, active: true },
  { id: 'lnk002', desc: 'Website consultation — 1hr', amount: 120, currency: 'VICO', created: '2026-05-30', expires: '2026-06-30', uses: 1, active: true },
  { id: 'lnk003', desc: 'Workshop ticket', amount: 50, currency: 'VICO', created: '2026-05-20', expires: '2026-05-31', uses: 0, active: false },
];

export default function MerchantPaymentsPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const [tab, setTab] = useState<'qr' | 'embed' | 'links'>('qr');
  // QR tab state
  const [fixedAmount, setFixedAmount] = useState(false);
  const [qrAmount, setQrAmount] = useState('');
  const [currency, setCurrency] = useState<'VICO' | 'USD'>('VICO');
  const [copied, setCopied] = useState(false);
  // Embed tab state
  const [embedStyle, setEmbedStyle] = useState<'standard' | 'dark' | 'outline'>('standard');
  const [embedSize, setEmbedSize] = useState<'small' | 'medium' | 'large'>('medium');
  // Links tab state
  const [linkDesc, setLinkDesc] = useState('');
  const [linkAmount, setLinkAmount] = useState('');
  const [linkCurrency, setLinkCurrency] = useState<'VICO' | 'USD'>('VICO');
  const [linkExpiry, setLinkExpiry] = useState('');
  const [oneTime, setOneTime] = useState(false);
  const [links, setLinks] = useState(MOCK_LINKS);

  const pageBg      = isNight ? '#1A1400' : '#FFFBF2';
  const heroBg      = '#412402';
  const cardBg      = isNight ? '#221A00' : '#FFFFFF';
  const cardBorder  = isNight ? '1px solid #3A2800' : '1px solid #F0D9B0';
  const textPrimary = isNight ? '#F5E6C8' : '#2D1A00';
  const textMuted   = isNight ? '#9B7A3A' : '#8B6230';
  const accent      = '#EF9F27';
  const btnBg       = '#BA7517';
  const inputStyle  = {
    width: '100%', padding: '11px 13px', borderRadius: 9,
    border: isNight ? '1px solid #3A2800' : '1px solid #F0D9B0',
    background: isNight ? '#2C1E00' : '#FFFDF5',
    color: textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  };

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const embedCode = `<script src="https://pay.village.com/vico.js"><\/script>
<button
  class="vico-pay-btn"
  data-merchant="jade_ceramics"
  data-currency="${linkCurrency}"
  data-description="Payment"
  style="background:${embedStyle === 'dark' ? '#2C1800' : embedStyle === 'outline' ? 'transparent' : '#EF9F27'}; color:${embedStyle === 'outline' ? '#EF9F27' : 'white'}; border:${embedStyle === 'outline' ? '2px solid #EF9F27' : 'none'}; padding:${embedSize === 'small' ? '8px 16px' : embedSize === 'large' ? '16px 32px' : '12px 24px'}; border-radius:8px; font-weight:700; cursor:pointer"
>
  Pay with $VICO
</button>`;

  const EMBED_STYLES: { key: 'standard' | 'dark' | 'outline'; label: string; btnBg: string; btnColor: string; btnBorder: string }[] = [
    { key: 'standard', label: 'Standard', btnBg: '#EF9F27', btnColor: 'white', btnBorder: 'none' },
    { key: 'dark',     label: 'Dark',     btnBg: '#2C1800', btnColor: '#EF9F27', btnBorder: 'none' },
    { key: 'outline',  label: 'Outline',  btnBg: 'transparent', btnColor: '#EF9F27', btnBorder: '2px solid #EF9F27' },
  ];
  const SIZE_PADS: Record<string, string> = { small: '8px 16px', medium: '12px 24px', large: '16px 32px' };
  const currentEmbed = EMBED_STYLES.find(s => s.key === embedStyle)!;

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: heroBg, padding: '52px 20px 20px' }}>
        <Link href="/village/merchant" style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Merchant
        </Link>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>Accept Payments</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>QR codes, web buttons, and payment links</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 4 }}>
          {([['qr','QR Code'],['embed','Embed'],['links','Payment Links']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '9px 6px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: tab === key ? accent : 'transparent',
              color: tab === key ? '#412402' : 'rgba(255,255,255,0.65)',
              fontWeight: 700, fontSize: 12,
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── QR Tab ── */}
        {tab === 'qr' && (
          <div>
            {/* QR display */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: '20px', textAlign: 'center' }}>
                <QRCode name={fixedAmount && qrAmount ? `merchant_${qrAmount}` : 'jade_ceramics'} size={200} />
                <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, marginTop: 12 }}>Jade&apos;s Ceramics</div>
                <div style={{ fontSize: 13, color: accent, fontWeight: 600, marginTop: 2 }}>$VICO accepted here</div>
                {fixedAmount && qrAmount && (
                  <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary, marginTop: 8 }}>
                    {qrAmount} {currency}
                  </div>
                )}
              </div>
            </div>

            {/* Currency toggle */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>Currency Display</span>
                <div style={{ display: 'flex', gap: 4, background: isNight ? '#3A2800' : '#F5E6C8', borderRadius: 8, padding: 3 }}>
                  {(['VICO', 'USD'] as const).map(c => (
                    <button key={c} onClick={() => setCurrency(c)} style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: currency === c ? accent : 'transparent',
                      color: currency === c ? '#412402' : textMuted,
                      fontWeight: 700, fontSize: 12,
                    }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed amount toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: fixedAmount ? 12 : 0 }}>
                <span style={{ fontSize: 13, color: textPrimary }}>Fixed Amount</span>
                <button onClick={() => setFixedAmount(!fixedAmount)} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                  background: fixedAmount ? accent : (isNight ? '#3A2800' : '#E0C898'),
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: fixedAmount ? 23 : 3,
                    width: 18, height: 18, borderRadius: 9, background: 'white',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>
              {fixedAmount && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={qrAmount}
                    onChange={e => setQrAmount(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: accent, alignSelf: 'center' }}>{currency}</span>
                </div>
              )}
            </div>

            {/* Download buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button style={{
                padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: btnBg, color: 'white', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <DownloadIcon /> Download QR
              </button>
              <button style={{
                padding: '13px', borderRadius: 10, cursor: 'pointer',
                border: cardBorder, background: cardBg, color: textPrimary, fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <DownloadIcon /> Print kit
              </button>
            </div>
          </div>
        )}

        {/* ── Embed Tab ── */}
        {tab === 'embed' && (
          <div>
            {/* Style selector */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 12 }}>Button Style</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {EMBED_STYLES.map(s => (
                  <button key={s.key} onClick={() => setEmbedStyle(s.key)} style={{
                    flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                    border: embedStyle === s.key ? `2px solid ${accent}` : cardBorder,
                    background: embedStyle === s.key ? (isNight ? '#3A2000' : '#FFF8ED') : cardBg,
                    fontSize: 12, fontWeight: 600, color: embedStyle === s.key ? accent : textMuted,
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Size selector */}
              <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 10 }}>Size</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['small','medium','large'] as const).map(s => (
                  <button key={s} onClick={() => setEmbedSize(s)} style={{
                    flex: 1, padding: '7px', borderRadius: 7, cursor: 'pointer',
                    border: embedSize === s ? `2px solid ${accent}` : cardBorder,
                    background: embedSize === s ? (isNight ? '#3A2000' : '#FFF8ED') : cardBg,
                    fontSize: 12, fontWeight: 600, color: embedSize === s ? accent : textMuted, textTransform: 'capitalize',
                  }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Live preview */}
              <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 10 }}>Preview</div>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px', background: isNight ? '#2C1E00' : '#F5E6C8', borderRadius: 10 }}>
                <button style={{
                  padding: SIZE_PADS[embedSize],
                  background: currentEmbed.btnBg,
                  color: currentEmbed.btnColor,
                  border: currentEmbed.btnBorder,
                  borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}>
                  Pay with $VICO
                </button>
              </div>
            </div>

            {/* Code snippet */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: cardBorder }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>HTML Snippet</span>
                <button onClick={() => handleCopy(embedCode)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 7, border: cardBorder, background: cardBg,
                  color: copied ? '#1D9E75' : textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? 'Copied!' : 'Copy code'}
                </button>
              </div>
              <div style={{ background: '#1A1200', padding: '14px 16px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, fontSize: 11, color: '#F5E6C8', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {embedCode}
                </pre>
              </div>
            </div>

            {/* Integrations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { name: 'Shopify', desc: 'Install plugin', color: '#96BF48' },
                { name: 'WooCommerce', desc: 'Download extension', color: '#7F54B3' },
              ].map(int => (
                <div key={int.name} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: int.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 11 }}>{int.name.slice(0, 2)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{int.name}</div>
                  <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{int.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Links Tab ── */}
        {tab === 'links' && (
          <div>
            {/* Create link form */}
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>Create Payment Link</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Description</label>
                  <input style={inputStyle} placeholder="What is this payment for?" value={linkDesc} onChange={e => setLinkDesc(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Amount (optional)</label>
                    <input style={inputStyle} type="number" placeholder="Customer enters" value={linkAmount} onChange={e => setLinkAmount(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Currency</label>
                    <select style={{ ...inputStyle, width: 80 }} value={linkCurrency} onChange={e => setLinkCurrency(e.target.value as 'VICO' | 'USD')}>
                      <option value="VICO">VICO</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Expiry (optional)</label>
                  <input style={inputStyle} type="date" value={linkExpiry} onChange={e => setLinkExpiry(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: textPrimary }}>One-time use</span>
                  <button onClick={() => setOneTime(!oneTime)} style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                    background: oneTime ? accent : (isNight ? '#3A2800' : '#E0C898'),
                  }}>
                    <div style={{ position: 'absolute', top: 3, left: oneTime ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                  </button>
                </div>
                <button style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: btnBg, color: 'white', fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <LinkIcon /> Generate link
                </button>
                {/* URL format */}
                <div style={{ padding: '10px', background: isNight ? '#2C1E00' : '#FFF8ED', borderRadius: 8, fontSize: 11, color: textMuted, fontFamily: 'monospace' }}>
                  pay.village.com/jade_ceramics/lnk_...
                </div>
              </div>
            </div>

            {/* Active links */}
            <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 10 }}>Active Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map(link => (
                <div key={link.id} style={{ background: cardBg, border: link.active ? cardBorder : (isNight ? '1px solid #2A2000' : '1px solid #F5EDD8'), borderRadius: 12, padding: '14px 16px', opacity: link.active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.desc}</div>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 2, fontFamily: 'monospace' }}>
                        pay.village.com/jade_ceramics/{link.id}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, marginLeft: 10, flexShrink: 0,
                      background: link.active ? '#1D9E7522' : (isNight ? '#3A2800' : '#F5EDD8'),
                      color: link.active ? '#1D9E75' : textMuted,
                    }}>
                      {link.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: textMuted, marginBottom: 10 }}>
                    {link.amount ? <span>{link.amount} {link.currency}</span> : <span>Open amount</span>}
                    <span>·</span>
                    <span>{link.uses} use{link.uses !== 1 ? 's' : ''}</span>
                    {link.expires && <><span>·</span><span>Expires {link.expires}</span></>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { icon: <CopyIcon />, label: 'Copy' },
                      { icon: <ShareIcon />, label: 'Share' },
                      { icon: <TrashIcon />, label: 'Deactivate', danger: true },
                    ].map(a => (
                      <button key={a.label} onClick={() => {
                        if (a.label === 'Copy') handleCopy(`https://pay.village.com/jade_ceramics/${link.id}`);
                        if (a.label === 'Deactivate') setLinks(prev => prev.map(l => l.id === link.id ? { ...l, active: false } : l));
                      }} style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                        borderRadius: 7, border: cardBorder, background: cardBg, cursor: 'pointer',
                        color: a.danger ? '#E05050' : textMuted, fontSize: 11, fontWeight: 600,
                      }}>
                        {a.icon} {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
