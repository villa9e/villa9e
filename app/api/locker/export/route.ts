import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS, dataCategoryToShareKey } from '@/lib/locker/constants';
export const dynamic = 'force-dynamic';

function csvEscape(val: unknown) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map(h => csvEscape(row[h])).join(','));
  return lines.join('\n');
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const format = url.searchParams.get('format') ?? 'json';
  const categoriesParam = url.searchParams.get('categories');
  const selectedShareKeys = categoriesParam ? new Set(categoriesParam.split(',')) : null;

  const [{ data: profile }, { data: prefs }, { data: auditRows }, { data: earningsRows }, { data: deletionRows }] = await Promise.all([
    admin.from('profiles').select('username, display_name, bio, created_at').eq('id', user.id).maybeSingle(),
    admin.from('data_sharing_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    admin.from('data_access_audit').select('accessor_name, accessor_type, data_category, access_purpose, legal_basis, accessed_at').eq('user_id', user.id).order('accessed_at', { ascending: false }),
    admin.from('data_earnings').select('amount_usd, categories_contributed, payout_status, payout_date, description, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    admin.from('data_deletion_requests').select('reference_number, scope, category, status, requested_at, completed_at').eq('user_id', user.id).order('requested_at', { ascending: false }),
  ]);

  let preferences = prefs ?? {};
  let auditLog = auditRows ?? [];
  let earnings = earningsRows ?? [];

  if (selectedShareKeys) {
    preferences = Object.fromEntries(
      Object.entries(preferences).filter(([k]) => !k.startsWith('share_') || selectedShareKeys.has(k))
    );
    auditLog = auditLog.filter((r: any) => selectedShareKeys.has(dataCategoryToShareKey(r.data_category)));
    earnings = earnings
      .map((r: any) => ({ ...r, categories_contributed: (r.categories_contributed ?? []).filter((c: string) => selectedShareKeys.has(c)) }))
      .filter((r: any) => r.categories_contributed.length > 0);
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      email: user.email,
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      bio: profile?.bio ?? null,
      member_since: profile?.created_at ?? null,
    },
    data_sharing_preferences: preferences,
    data_access_audit: auditLog,
    data_earnings: earnings,
    data_deletion_requests: deletionRows ?? [],
  };

  if (format === 'csv') {
    const sections: string[] = [];
    sections.push('SECTION,Account');
    sections.push(rowsToCsv([exportData.account as any]));
    sections.push('');
    sections.push('SECTION,Data Sharing Preferences');
    sections.push(rowsToCsv([preferences as any]));
    sections.push('');
    sections.push('SECTION,Data Access Audit');
    sections.push(rowsToCsv(auditLog));
    sections.push('');
    sections.push('SECTION,Data Earnings');
    sections.push(rowsToCsv(earnings));
    sections.push('');
    sections.push('SECTION,Data Deletion Requests');
    sections.push(rowsToCsv(deletionRows ?? []));

    return new NextResponse(sections.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="villa9e-data-export.csv"',
      },
    });
  }

  if (format === 'html') {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Village Data Export</title>
<style>body{font-family:-apple-system,sans-serif;max-width:680px;margin:40px auto;color:#0A1F14;line-height:1.6}
h1{font-size:22px}h2{font-size:15px;border-bottom:1px solid #ccc;padding-bottom:6px;margin-top:28px}
pre{background:#f5f5f5;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;white-space:pre-wrap}</style>
</head><body>
<h1>Village Data Export</h1>
<p>Generated ${escapeHtml(exportData.exported_at)} for ${escapeHtml(user.email ?? '')}</p>
<h2>Account</h2><pre>${escapeHtml(JSON.stringify(exportData.account, null, 2))}</pre>
<h2>Data Sharing Preferences</h2><pre>${escapeHtml(JSON.stringify(preferences, null, 2))}</pre>
<h2>Data Access Audit (${auditLog.length})</h2><pre>${escapeHtml(JSON.stringify(auditLog, null, 2))}</pre>
<h2>Data Earnings (${earnings.length})</h2><pre>${escapeHtml(JSON.stringify(earnings, null, 2))}</pre>
<h2>Data Deletion Requests (${(deletionRows ?? []).length})</h2><pre>${escapeHtml(JSON.stringify(deletionRows ?? [], null, 2))}</pre>
<p style="margin-top:32px;color:#888;font-size:12px">Use your browser's Print &rarr; Save as PDF to keep a copy of this export.</p>
</body></html>`;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="villa9e-data-export.json"',
    },
  });
}
