import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Haversine formula — returns distance in kilometers
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { searchParams } = new URL(req.url);

  const latParam      = searchParams.get('lat');
  const lngParam      = searchParams.get('lng');
  const radiusParam   = searchParams.get('radius');
  const category      = searchParams.get('category');
  const verifiedOnly  = searchParams.get('verifiedOnly') === 'true';

  const userLat    = latParam    ? parseFloat(latParam)    : null;
  const userLng    = lngParam    ? parseFloat(lngParam)    : null;
  const radiusKm   = radiusParam ? parseFloat(radiusParam) : 50;

  // Build query — only active merchants with a physical location
  let query = supabase
    .from('merchant_accounts')
    .select('id, store_name, category, latitude, longitude, is_verified, business_hours, address, merchant_handle')
    .eq('is_active', true)
    .eq('has_physical_location', true);

  if (category) {
    query = query.eq('category', category);
  }

  if (verifiedOnly) {
    query = query.eq('is_verified', true);
  }

  const { data: merchants, error } = await query;

  if (error) {
    console.error('Merchant map error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let result: any[] = merchants ?? [];

  // Filter by distance if lat/lng provided
  if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
    result = result
      .filter((m: any) => {
        if (m.latitude == null || m.longitude == null) return false;
        const dist = haversineKm(userLat, userLng, m.latitude, m.longitude);
        m._distanceKm = parseFloat(dist.toFixed(2));
        return dist <= radiusKm;
      })
      .sort((a: any, b: any) => (a._distanceKm ?? 0) - (b._distanceKm ?? 0));
  }

  return NextResponse.json({
    merchants: result.map((m: any) => ({
      id:             m.id,
      store_name:     m.store_name,
      category:       m.category,
      latitude:       m.latitude,
      longitude:      m.longitude,
      is_verified:    m.is_verified,
      business_hours: m.business_hours,
      address:        m.address,
      merchant_handle: m.merchant_handle,
      distance_km:    m._distanceKm ?? null,
    })),
  });
}
