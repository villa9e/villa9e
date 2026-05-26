'use client';
import { useState } from 'react';

interface PlaidConnectProps {
  onSuccess?: (institution: string) => void;
}

export function PlaidConnect({ onSuccess }: PlaidConnectProps) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [institution, setInstitution] = useState('');

  async function openPlaid() {
    setLoading(true);
    try {
      // Get link token
      const tokenRes = await fetch('/api/plaid/link-token', { method: 'POST' });
      if (!tokenRes.ok) {
        alert('Bank connection not available yet. Check back soon.');
        setLoading(false);
        return;
      }
      const { link_token } = await tokenRes.json();

      // Load Plaid Link SDK
      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      document.head.appendChild(script);

      script.onload = () => {
        const handler = (window as any).Plaid.create({
          token: link_token,
          onSuccess: async (public_token: string) => {
            const res = await fetch('/api/plaid/exchange-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ public_token }),
            });
            const data = await res.json();
            setConnected(true);
            setInstitution(data.institution ?? 'Bank Account');
            onSuccess?.(data.institution);
            setLoading(false);
          },
          onExit: () => setLoading(false),
        });
        handler.open();
      };
      script.onerror = () => setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <span>🏦</span>
        <span className="font-medium">{institution} connected ✓</span>
      </div>
    );
  }

  return (
    <button onClick={openPlaid} disabled={loading}
      className="flex items-center gap-2 bg-village-blue text-white rounded-full px-5 py-2.5 text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
      <span>🔒</span>
      {loading ? 'Connecting…' : 'Connect Your Bank'}
    </button>
  );
}
