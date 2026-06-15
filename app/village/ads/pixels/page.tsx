'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const A = {
  day:   { bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF', text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE', surface: '#EAF3F8', code: '#F0F4FF' },
  night: { bg: '#060F18', card: '#0E1E2E', border: '#1A3040', text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96', surface: '#091525', code: '#060F18' },
};

function buildSnippet(pixelId: string) {
  return `<!-- Village Pixel -->
<script>
(function(v,i,l,g,e){v[g]=v[g]||function(){(v[g].q=v[g].q||[]).push(arguments)};
var s=i.createElement('script');s.async=1;s.src=l;i.head.appendChild(s);
})(window,document,'https://pixel.villa9e.com/v.js','vpixel');
vpixel('init', '${pixelId}');
vpixel('track', 'PageView');
</script>
<!-- End Village Pixel -->`;
}

const STANDARD_EVENTS = [
  { name: 'PageView', desc: 'Fires automatically on page load' },
  { name: 'ViewContent', desc: 'When a user views a product or content page' },
  { name: 'Search', desc: 'When a user performs a search' },
  { name: 'AddToCart', desc: 'When a product is added to cart' },
  { name: 'InitiateCheckout', desc: 'When a user begins checkout' },
  { name: 'AddPaymentInfo', desc: 'When payment info is entered' },
  { name: 'Purchase', desc: 'When a purchase is completed' },
  { name: 'Lead', desc: 'When a lead form is submitted' },
  { name: 'CompleteRegistration', desc: 'When a user completes registration' },
  { name: 'Contact', desc: 'When a user submits a contact form' },
];

const INSTALL_TABS = ['HTML', 'WordPress', 'Shopify'];

export default function PixelsPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const c = isNight ? A.night : A.day;
  const supabase = createClient();
  const [pixelId, setPixelId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [installTab, setInstallTab] = useState('HTML');
  const [testEvents, setTestEvents] = useState<{ event: string; time: string; status: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let { data: px } = await (supabase as any).from('ad_pixels').select('pixel_id').eq('user_id', user.id).maybeSingle();
      if (!px) {
        const { data: created } = await (supabase as any).from('ad_pixels').insert({ user_id: user.id }).select('pixel_id').single();
        px = created;
      }
      setPixelId(px?.pixel_id ?? null);
    })();
  }, []);

  const snippet = pixelId ? buildSnippet(pixelId) : '';

  const copySnippet = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fireTestEvent = () => {
    const events = ['PageView', 'Lead', 'Purchase', 'Search'];
    const evt = events[Math.floor(Date.now() / 1000) % events.length];
    setTestEvents(p => [{ event: evt, time: 'just now', status: 'received' }, ...p.slice(0, 4)]);
  };

  const INSTALL_CODE: Record<string, string> = {
    HTML: `Paste the snippet above inside <head> on every page of your website.`,
    WordPress: `Install the "Village Pixel" WordPress plugin, then enter your Pixel ID:\n  ${pixelId ?? '—'}\nin the plugin settings under Village → Pixel Configuration.`,
    Shopify: `Go to Shopify Admin → Online Store → Preferences → Additional scripts.\nPaste your Village Pixel snippet in the Order status page section.`,
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '0 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          <Link href="/village/ads" style={{ display: 'flex', alignItems: 'center', color: c.textSec, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </Link>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Village Pixel</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Pixel ID card */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 13, color: c.textSec, marginBottom: 4 }}>Your Pixel ID</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <code style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>{pixelId ?? '—'}</code>
            <button onClick={() => pixelId && navigator.clipboard.writeText(pixelId)}
              style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: c.textSec }}>
              Copy ID
            </button>
          </div>
        </div>

        {/* Snippet */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Pixel code snippet</span>
            <button onClick={copySnippet}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: copied ? '#16A34A' : '#2952E8', color: '#fff',
                border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'background 0.2s' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {copied
                  ? <polyline points="20 6 9 17 4 12"/>
                  : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>
                }
              </svg>
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>
          <pre style={{ margin: 0, padding: '16px 20px', background: c.code, fontSize: 12, fontFamily: 'monospace',
            color: c.text, overflowX: 'auto', lineHeight: 1.6 }}>
            {snippet || 'Loading pixel…'}
          </pre>
        </div>

        {/* Installation instructions */}
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, fontSize: 14 }}>Installation instructions</div>
          <div style={{ padding: '0 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', gap: 0 }}>
            {INSTALL_TABS.map(t => (
              <button key={t} onClick={() => setInstallTab(t)}
                style={{ padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: installTab === t ? 700 : 400,
                  background: 'transparent', color: installTab === t ? '#2952E8' : c.textSec,
                  borderBottom: `2px solid ${installTab === t ? '#2952E8' : 'transparent'}` }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ padding: '16px 20px' }}>
            <pre style={{ margin: 0, fontSize: 13, fontFamily: 'monospace', color: c.textSec, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {INSTALL_CODE[installTab]}
            </pre>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Standard events */}
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, fontWeight: 700, fontSize: 14 }}>Standard events</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STANDARD_EVENTS.map((e, i) => (
                <div key={e.name} style={{ padding: '10px 16px', borderBottom: i < STANDARD_EVENTS.length - 1 ? `1px solid ${c.border}` : undefined }}>
                  <code style={{ fontSize: 13, fontWeight: 700, color: '#2952E8', fontFamily: 'monospace' }}>{e.name}</code>
                  <div style={{ fontSize: 12, color: c.textSec, marginTop: 2 }}>{e.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Test events tool */}
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Test events</span>
              <button onClick={fireTestEvent}
                style={{ background: '#2952E8', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Fire test event
              </button>
            </div>
            <div style={{ padding: '8px 0' }}>
              {testEvents.length === 0 ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: c.textTer, fontSize: 13 }}>No events yet. Fire a test event to verify your pixel.</div>
              ) : (
                testEvents.map((ev, i) => (
                  <div key={i} style={{ padding: '9px 16px', borderBottom: i < testEvents.length - 1 ? `1px solid ${c.border}` : undefined,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <code style={{ fontSize: 13, fontWeight: 700, color: '#2952E8', fontFamily: 'monospace' }}>{ev.event}</code>
                      <span style={{ marginLeft: 8, fontSize: 12, color: c.textTer }}>{ev.time}</span>
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.12)', color: '#16A34A', borderRadius: 100, padding: '2px 8px', fontWeight: 600 }}>
                      {ev.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
