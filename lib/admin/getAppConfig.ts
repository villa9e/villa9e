import { createAdminClient } from '@/lib/supabase/server';

type ConfigMap = Record<string, any>;

/** Fetch app_config values by section or specific keys from the DB.
 *  Falls back to defaults if DB is unavailable. */
export async function getAppConfig(keys?: string[]): Promise<ConfigMap> {
  try {
    const db = createAdminClient() as any;
    let query = db.from('app_config').select('key, value');
    if (keys?.length) query = query.in('key', keys);
    const { data, error } = await query;
    if (error || !data) return {};
    return Object.fromEntries(data.map((r: any) => [r.key, r.value]));
  } catch {
    return {};
  }
}

/** Helper to get a single typed config value with a default. */
export function cfg<T>(map: ConfigMap, key: string, fallback: T): T {
  const v = map[key];
  if (v === undefined || v === null) return fallback;
  return v as T;
}
