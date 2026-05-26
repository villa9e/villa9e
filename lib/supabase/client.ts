import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://zjhsggnmwvwlhiocmfrn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaHNnZ25td3Z3bGhpb2NtZnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODIxMTIsImV4cCI6MjA5NTI1ODExMn0.35uAnisFiflQ5PN1k1tIU_qS6zlOMWf24AdMGAyINmw';

// Untyped client — all table queries return any, no Database generic needed
// This avoids TypeScript errors from tables added via migrations that aren't
// in the auto-generated types
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
