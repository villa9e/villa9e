import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://zjhsggnmwvwlhiocmfrn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaHNnZ25td3Z3bGhpb2NtZnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODIxMTIsImV4cCI6MjA5NTI1ODExMn0.35uAnisFiflQ5PN1k1tIU_qS6zlOMWf24AdMGAyINmw';

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
