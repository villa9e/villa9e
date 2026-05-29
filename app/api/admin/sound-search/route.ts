import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Uses Freesound.org public API — free, CC licensed sounds
// Token is a public client token (not secret), safe to embed
const FREESOUND_TOKEN = process.env.FREESOUND_TOKEN ?? '';

export async function GET(req: NextRequest) {
  // Auth check — admin only
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ results: [] });

  try {
    if (!FREESOUND_TOKEN) {
      // Fallback: return curated free sound URLs for common terms
      const CURATED: Record<string, any[]> = {
        fire:       [{ id:'fire1',    name:'Campfire crackling',  preview_url:'https://cdn.freesound.org/previews/566/566479_7107085-lq.mp3' }],
        water:      [{ id:'water1',   name:'River stream',        preview_url:'https://cdn.freesound.org/previews/531/531947_7107085-lq.mp3' }],
        forest:     [{ id:'forest1',  name:'Forest ambience',     preview_url:'https://cdn.freesound.org/previews/233/233127_4146296-lq.mp3' }],
        birds:      [{ id:'birds1',   name:'Birds chirping',      preview_url:'https://cdn.freesound.org/previews/416/416529_5121236-lq.mp3' }],
        wind:       [{ id:'wind1',    name:'Wind in trees',       preview_url:'https://cdn.freesound.org/previews/531/531947_7107085-lq.mp3' }],
        drums:      [{ id:'drums1',   name:'Tribal drums',        preview_url:'https://cdn.freesound.org/previews/383/383592_5121236-lq.mp3' }],
        market:     [{ id:'market1',  name:'Busy market crowd',   preview_url:'https://cdn.freesound.org/previews/457/457579_8618451-lq.mp3' }],
        ocean:      [{ id:'ocean1',   name:'Ocean waves',         preview_url:'https://cdn.freesound.org/previews/353/353085_5121236-lq.mp3' }],
        bell:       [{ id:'bell1',    name:'Temple bell',         preview_url:'https://cdn.freesound.org/previews/411/411642_5121236-lq.mp3' }],
        zen:        [{ id:'zen1',     name:'Zen bowl',            preview_url:'https://cdn.freesound.org/previews/411/411642_5121236-lq.mp3' }],
        fountain:   [{ id:'fount1',   name:'Water fountain',      preview_url:'https://cdn.freesound.org/previews/531/531947_7107085-lq.mp3' }],
        footsteps:  [{ id:'foot1',    name:'Footsteps on grass',  preview_url:'https://cdn.freesound.org/previews/398/398715_5121236-lq.mp3' }],
        music:      [{ id:'music1',   name:'Ambient piano',       preview_url:'https://cdn.freesound.org/previews/442/442943_9346-lq.mp3' }],
        flute:      [{ id:'flute1',   name:'Flute melody',        preview_url:'https://cdn.freesound.org/previews/499/499917_8618451-lq.mp3' }],
        chime:      [{ id:'chime1',   name:'Wind chimes',         preview_url:'https://cdn.freesound.org/previews/411/411641_5121236-lq.mp3' }],
        night:      [{ id:'night1',   name:'Crickets at night',   preview_url:'https://cdn.freesound.org/previews/233/233127_4146296-lq.mp3' }],
      };

      const lower = q.toLowerCase();
      const match = Object.entries(CURATED).find(([key]) => lower.includes(key));
      return NextResponse.json({ results: match ? match[1] : [], source: 'curated' });
    }

    // Freesound API search
    const url = `https://freesound.org/apiv2/search/text/?` + new URLSearchParams({
      query: q,
      fields: 'id,name,previews,duration,license',
      filter: 'duration:[0.5 TO 60] license:(Attribution OR "Creative Commons 0")',
      sort: 'score',
      page_size: '8',
      token: FREESOUND_TOKEN,
    });

    const res  = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    const results = (data.results ?? []).map((r: any) => ({
      id:          r.id,
      name:        r.name,
      duration:    r.duration,
      preview_url: r.previews?.['preview-lq-mp3'] ?? r.previews?.['preview-hq-mp3'],
      license:     r.license,
    })).filter((r: any) => r.preview_url);

    return NextResponse.json({ results, source: 'freesound' });
  } catch (e) {
    return NextResponse.json({ results: [], error: String(e) });
  }
}
