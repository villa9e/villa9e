'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function TrashIcon() { return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>; }
function SendIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>; }
function EyeIcon() { return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>; }
function DownloadIcon() { return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>; }

interface LineItem { id: number; description: string; qty: string; unitPrice: string; }

const todayStr = new Date().toISOString().split('T')[0];
const in14 = (() => { const d = new Date(); d.setDate(d.getDate()+14); return d.toISOString().split('T')[0]; })();

export default function MerchantInvoicesPage() {
  const isNight = useVillageTheme(s => s.theme) === 'night';
  const supabase = createClient();
  const [merchantAccount, setMerchantAccount] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tab, setTab] = useState<'unpaid' | 'paid' | 'all'>('unpaid');
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  // Form state
  const [customer, setCustomer] = useState('');
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(in14);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, description: '', qty: '1', unitPrice: '' },
  ]);
  const [taxRate, setTaxRate] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState<'VICO' | 'USD'>('VICO');

  const pageBg      = isNight ? '#1A1400' : '#FFFBF2';
  const heroBg      = '#412402';
  const cardBg      = isNight ? '#221A00' : '#FFFFFF';
  const cardBorder  = isNight ? '1px solid #3A2800' : '1px solid #F0D9B0';
  const textPrimary = isNight ? '#F5E6C8' : '#2D1A00';
  const textMuted   = isNight ? '#9B7A3A' : '#8B6230';
  const accent      = '#EF9F27';
  const btnBg       = '#BA7517';
  const inputStyle  = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: isNight ? '1px solid #3A2800' : '1px solid #F0D9B0',
    background: isNight ? '#2C1E00' : '#FFFDF5',
    color: textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: acct } = await (supabase as any).from('merchant_accounts').select('*').eq('user_id', user.id).maybeSingle();
      if (!acct) return;
      setMerchantAccount(acct);
      const { data: rows } = await (supabase as any)
        .from('merchant_invoices').select('*').eq('merchant_id', acct.id).order('created_at', { ascending: false });
      setInvoices((rows ?? []).map((r: any) => ({
        dbId: r.id,
        id: r.invoice_number,
        customer: r.customer_handle || r.customer_email || 'Unknown',
        amount: Number(r.total),
        currency: r.currency,
        issued: r.issued_at?.slice(0, 10),
        due: r.due_at?.slice(0, 10),
        status: r.status,
      })));
    })();
  }, []);

  async function sendInvoice() {
    if (!merchantAccount || !customer.trim() || total <= 0) return;
    setSending(true);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const { data: row } = await (supabase as any).from('merchant_invoices').insert({
      merchant_id: merchantAccount.id,
      invoice_number: invoiceNumber,
      customer_handle: customer.startsWith('@') ? customer : null,
      customer_email: !customer.startsWith('@') ? customer : null,
      subtotal, tax_rate: parseFloat(taxRate)||0, tax_amount: tax, total,
      currency, line_items: lineItems,
      issued_at: new Date(issueDate).toISOString(),
      due_at: new Date(dueDate).toISOString(),
      notes: notes || null, status: 'unpaid',
    }).select().single();
    if (row) {
      setInvoices(prev => [{ dbId: row.id, id: row.invoice_number, customer, amount: total, currency, issued: issueDate, due: dueDate, status: 'unpaid' }, ...prev]);
      setShowForm(false); setCustomer(''); setNotes(''); setTaxRate('');
      setLineItems([{ id: 1, description: '', qty: '1', unitPrice: '' }]);
    }
    setSending(false);
  }

  function addLineItem() {
    setLineItems(prev => [...prev, { id: Date.now(), description: '', qty: '1', unitPrice: '' }]);
  }
  function removeLineItem(id: number) {
    setLineItems(prev => prev.filter(li => li.id !== id));
  }
  function updateLineItem(id: number, field: keyof LineItem, value: string) {
    setLineItems(prev => prev.map(li => li.id === id ? { ...li, [field]: value } : li));
  }

  const subtotal = lineItems.reduce((sum, li) => {
    return sum + (parseFloat(li.qty) || 0) * (parseFloat(li.unitPrice) || 0);
  }, 0);
  const tax = subtotal * ((parseFloat(taxRate) || 0) / 100);
  const total = subtotal + tax;

  const filteredInvoices = tab === 'all' ? invoices :
    invoices.filter(inv => tab === 'unpaid' ? inv.status !== 'paid' : inv.status === 'paid');

  const statusColor = (s: string) => {
    if (s === 'paid') return { bg: '#1D9E7522', color: '#1D9E75' };
    if (s === 'overdue') return { bg: '#E0505022', color: '#E05050' };
    return { bg: `${accent}22`, color: accent };
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: heroBg, padding: '52px 20px 20px', position: 'relative' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>Invoices</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>Create and manage client invoices</div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
            background: accent, borderRadius: 10, border: 'none', cursor: 'pointer',
            color: '#412402', fontWeight: 700, fontSize: 13,
          }}>
            <PlusIcon /> New
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* Create invoice form */}
        {showForm && (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: '18px', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, marginBottom: 16 }}>New Invoice</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Invoice #</label>
                <input style={{ ...inputStyle, background: isNight ? '#1A1400' : '#F5EDD8', color: textMuted }} value={`INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3,'0')}`} readOnly />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Currency</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={currency} onChange={e => setCurrency(e.target.value as 'VICO' | 'USD')}>
                  <option value="VICO">$VICO</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Customer (@handle or email)</label>
              <input style={inputStyle} placeholder="@username or email@example.com" value={customer} onChange={e => setCustomer(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Issue Date</label>
                <input type="date" style={inputStyle} value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Due Date</label>
                <input type="date" style={inputStyle} value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>

            {/* Line items */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>Line Items</label>
                <button onClick={addLineItem} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                  borderRadius: 6, border: cardBorder, background: 'transparent',
                  color: accent, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>
                  <PlusIcon /> Add row
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6 }}>
                  {['Description','Qty','Unit Price',''].map(h => (
                    <div key={h} style={{ fontSize: 10, color: textMuted, fontWeight: 600, padding: '0 4px' }}>{h}</div>
                  ))}
                </div>
                {lineItems.map((li) => (
                  <div key={li.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
                    <input style={inputStyle} placeholder="Item description" value={li.description}
                      onChange={e => updateLineItem(li.id, 'description', e.target.value)} />
                    <input style={inputStyle} type="number" value={li.qty}
                      onChange={e => updateLineItem(li.id, 'qty', e.target.value)} />
                    <input style={inputStyle} type="number" placeholder="0.00" value={li.unitPrice}
                      onChange={e => updateLineItem(li.id, 'unitPrice', e.target.value)} />
                    <button onClick={() => removeLineItem(li.id)} style={{
                      width: 32, height: 32, borderRadius: 7, border: cardBorder,
                      background: 'transparent', color: '#E05050', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax + totals */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Tax Rate (%)</label>
                <input style={inputStyle} type="number" placeholder="0" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
              </div>
              <div style={{ background: isNight ? '#2C1E00' : '#FFF8ED', borderRadius: 10, padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textMuted, marginBottom: 4 }}>
                  <span>Subtotal</span><span>{subtotal.toFixed(2)} {currency}</span>
                </div>
                {taxRate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textMuted, marginBottom: 4 }}>
                    <span>Tax ({taxRate}%)</span><span>{tax.toFixed(2)} {currency}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: textPrimary, borderTop: cardBorder, paddingTop: 6, marginTop: 4 }}>
                  <span>Total</span><span style={{ color: accent }}>{total.toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 4 }}>Notes (optional)</label>
              <textarea style={{ ...inputStyle, height: 70, resize: 'none' as const }} placeholder="Payment instructions, thank you note..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{
                flex: 1, padding: '12px', borderRadius: 10, border: cardBorder, background: 'transparent',
                color: textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <EyeIcon /> Preview
              </button>
              <button onClick={sendInvoice} disabled={sending || !customer.trim() || total <= 0} style={{
                flex: 2, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: btnBg, color: 'white', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: (sending || !customer.trim() || total <= 0) ? 0.5 : 1,
              }}>
                <SendIcon /> {sending ? 'Sending…' : 'Send Invoice'}
              </button>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: isNight ? '#2C1E00' : '#F5EDD8', borderRadius: 10, padding: 4 }}>
          {([['unpaid','Unpaid'],['paid','Paid'],['all','All']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: tab === key ? (isNight ? '#412402' : '#FFFFFF') : 'transparent',
              color: tab === key ? textPrimary : textMuted,
              fontWeight: tab === key ? 700 : 500, fontSize: 13,
              boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Invoice list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredInvoices.map(inv => (
            <div key={inv.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: textMuted, fontFamily: 'monospace' }}>{inv.id}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginTop: 2 }}>{inv.customer}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: textPrimary }}>{inv.amount} <span style={{ fontSize: 11, color: accent }}>{inv.currency}</span></div>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, marginTop: 4,
                    background: statusColor(inv.status).bg,
                    color: statusColor(inv.status).color,
                  }}>
                    {inv.status}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: textMuted, marginBottom: 10 }}>
                Issued {inv.issued} · Due {inv.due}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { icon: <EyeIcon />, label: 'Preview' },
                  { icon: <DownloadIcon />, label: 'Download' },
                  ...(inv.status !== 'paid' ? [{ icon: <SendIcon />, label: 'Remind' }] : []),
                ].map(a => (
                  <button key={a.label} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                    borderRadius: 7, border: cardBorder, background: cardBg, cursor: 'pointer',
                    color: textMuted, fontSize: 11, fontWeight: 600,
                  }}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredInvoices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: textMuted, fontSize: 14 }}>
              No {tab} invoices
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
