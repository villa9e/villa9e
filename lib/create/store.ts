'use client';
import { create } from 'zustand';

// A keyframe captures the overlay's position/scale/opacity at a point on
// the primary clip's timeline (seconds). With 2+ keyframes the overlay
// animates by linear interpolation between them during playback.
export interface TextKeyframe {
  time:    number;   // seconds
  x:       number;   // percent
  y:       number;   // percent
  scale:   number;   // 1 = normal
  opacity: number;   // 0-1
}

export interface TextOverlay {
  id:       string;
  text:     string;
  font:     string;
  size:     number;
  color:    string;
  bg:       string;
  bold:     boolean;
  italic:   boolean;
  x:        number;
  y:        number;
  keyframes?: TextKeyframe[];
}

export interface CaptionSegment {
  id:    string;
  start: number;   // seconds
  end:   number;   // seconds
  text:  string;
}

export interface Adjustments {
  brightness:  number;   // -100 to 100, default 0
  contrast:    number;
  saturation:  number;
  brilliance:  number;   // -100 to 100, brightness+contrast lift
  warmth:      number;   // temp: blue <-> yellow, via hue-rotate
  tint:        number;   // -100 to 100, magenta <-> green overlay
  hue:         number;   // -180 to 180, direct hue rotation
  sharpness:   number;
  shadow:      number;   // -100 to 100, lift/crush shadows
  vignette:    number;   // 0-100
  fade:        number;   // 0-100
  grain:       number;   // 0-100
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0, contrast: 0, saturation: 0, brilliance: 0, warmth: 0,
  tint: 0, hue: 0, sharpness: 0, shadow: 0, vignette: 0, fade: 0, grain: 0,
};

// Cut/transition between sequential clips in the multi-track timeline.
export type TransitionType = 'none' | 'crossfade' | 'fade-to-black' | 'wipe';

// An additional clip appended after the primary captured media. The
// primary clip itself is represented by session media + trimStart/trimEnd;
// `clips` holds everything that plays after it, in order.
export interface Clip {
  id:                 string;
  mediaURL:           string;
  mediaType:          'video' | 'photo';
  sourceDuration:     number;   // full duration of the source media (seconds)
  inPoint:            number;   // trim start within source (seconds)
  outPoint:           number;   // trim end within source (seconds)
  transitionIn:       TransitionType;  // transition used entering this clip
  transitionDuration: number;   // seconds
}

export interface PostDetails {
  caption:          string;
  hashtags:         string[];
  mentions:         string[];
  location:         string;
  postLabel:        string;  // 'goal_recap' | 'action_how_to' | 'sprint_update' | 'general' | 'help_request' | 'product_review'
  goalId:           string | null;
  sprintId:         string | null;
  actionRef:        string;
  isWorkshop:       boolean;
  hasAffiliate:     boolean;
  affiliateURL:     string;
  affiliateProduct: string;
  visibility:       string;  // 'everyone' | 'tribe' | 'only_me'
  is18Plus:         boolean;
  allowComments:    boolean;
  allowRemixes:     boolean;
  isTemplate:       boolean;
  isAiGenerated:    boolean;
  saveToDevice:     boolean;
  saveWithWatermark: boolean;
  allowVisualSearch: boolean;
  isAd:                     boolean;
  adOnly:                   boolean;
  ctaText:                  string;
  ctaURL:                   string;
  autoCheckCopyright:       boolean;
  identifySimilarProducts:  boolean;
  allowHighQualityUploads:  boolean;
  videoLanguage:            string;
}

const DEFAULT_POST_DETAILS: PostDetails = {
  caption: '', hashtags: [], mentions: [], location: '',
  postLabel: 'general', goalId: null, sprintId: null, actionRef: '',
  isWorkshop: false, hasAffiliate: false, affiliateURL: '', affiliateProduct: '',
  visibility: 'everyone', is18Plus: false,
  allowComments: true, allowRemixes: true, isTemplate: false,
  isAiGenerated: false, saveToDevice: true, saveWithWatermark: false,
  allowVisualSearch: true, isAd: false, adOnly: false, ctaText: '', ctaURL: '',
  autoCheckCopyright: true, identifySimilarProducts: false,
  allowHighQualityUploads: true, videoLanguage: 'English',
};

interface CreateStore {
  // Edit state
  selectedFilter:  string;
  adjustments:     Adjustments;
  textOverlays:    TextOverlay[];
  captions:        CaptionSegment[];
  trimStart:       number;
  trimEnd:         number | null;
  playbackSpeed:   number;  // 0.5 = slow, 1 = normal, 2 = fast

  // Multi-track timeline: clips that play after the primary clip
  clips:           Clip[];

  // Sound
  soundTitle:      string;
  soundURL:        string;
  soundSource:     string;
  soundStartSec:   number;

  // Post details
  details: PostDetails;

  // Actions
  setFilter:          (f: string) => void;
  setAdjustment:      (key: keyof Adjustments, val: number) => void;
  resetAdjustments:   () => void;
  addTextOverlay:     (o: TextOverlay) => void;
  updateTextOverlay:  (id: string, patch: Partial<TextOverlay>) => void;
  removeTextOverlay:  (id: string) => void;
  addOverlayKeyframe: (id: string, kf: TextKeyframe) => void;
  removeOverlayKeyframe: (id: string, time: number) => void;
  clearOverlayKeyframes: (id: string) => void;
  addCaption:         (c: CaptionSegment) => void;
  updateCaption:      (id: string, patch: Partial<CaptionSegment>) => void;
  removeCaption:      (id: string) => void;
  setTrim:            (start: number, end: number | null) => void;
  setPlaybackSpeed:   (s: number) => void;

  addClip:            (c: Clip) => void;
  updateClip:         (id: string, patch: Partial<Clip>) => void;
  removeClip:         (id: string) => void;
  insertClip:         (index: number, c: Clip) => void;
  reorderClip:        (id: string, direction: -1 | 1) => void;
  setSound:           (title: string, url: string, source: string, startSec?: number) => void;
  clearSound:         () => void;
  setDetails:         (patch: Partial<PostDetails>) => void;
  resetAll:           () => void;
}

export const useCreateStore = create<CreateStore>((set) => ({
  selectedFilter:  'normal',
  adjustments:     { ...DEFAULT_ADJUSTMENTS },
  textOverlays:    [],
  captions:        [],
  trimStart:       0,
  trimEnd:         null,
  playbackSpeed:   1,
  clips:           [],
  soundTitle:      '',
  soundURL:        '',
  soundSource:     '',
  soundStartSec:   0,
  details:         { ...DEFAULT_POST_DETAILS },

  setFilter:         (f) => set({ selectedFilter: f }),
  setAdjustment:     (key, val) => set(s => ({ adjustments: { ...s.adjustments, [key]: val } })),
  resetAdjustments:  () => set({ adjustments: { ...DEFAULT_ADJUSTMENTS } }),
  addTextOverlay:    (o) => set(s => ({ textOverlays: [...s.textOverlays, o] })),
  updateTextOverlay: (id, patch) => set(s => ({ textOverlays: s.textOverlays.map(t => t.id === id ? { ...t, ...patch } : t) })),
  removeTextOverlay: (id) => set(s => ({ textOverlays: s.textOverlays.filter(t => t.id !== id) })),
  addOverlayKeyframe: (id, kf) => set(s => ({ textOverlays: s.textOverlays.map(t => t.id === id
    ? { ...t, keyframes: [...(t.keyframes ?? []).filter(k => k.time !== kf.time), kf].sort((a, b) => a.time - b.time) }
    : t) })),
  removeOverlayKeyframe: (id, time) => set(s => ({ textOverlays: s.textOverlays.map(t => t.id === id
    ? { ...t, keyframes: (t.keyframes ?? []).filter(k => k.time !== time) }
    : t) })),
  clearOverlayKeyframes: (id) => set(s => ({ textOverlays: s.textOverlays.map(t => t.id === id ? { ...t, keyframes: [] } : t) })),
  addCaption:        (c) => set(s => ({ captions: [...s.captions, c].sort((a, b) => a.start - b.start) })),
  updateCaption:     (id, patch) => set(s => ({ captions: s.captions.map(c => c.id === id ? { ...c, ...patch } : c) })),
  removeCaption:     (id) => set(s => ({ captions: s.captions.filter(c => c.id !== id) })),
  setTrim:           (start, end) => set({ trimStart: start, trimEnd: end }),
  setPlaybackSpeed:  (s) => set({ playbackSpeed: s }),

  addClip:           (c) => set(s => ({ clips: [...s.clips, c] })),
  updateClip:        (id, patch) => set(s => ({ clips: s.clips.map(c => c.id === id ? { ...c, ...patch } : c) })),
  removeClip:        (id) => set(s => ({ clips: s.clips.filter(c => c.id !== id) })),
  insertClip:        (index, c) => set(s => {
    const clips = [...s.clips];
    clips.splice(Math.max(0, Math.min(index, clips.length)), 0, c);
    return { clips };
  }),
  reorderClip:       (id, direction) => set(s => {
    const idx = s.clips.findIndex(c => c.id === id);
    const target = idx + direction;
    if (idx === -1 || target < 0 || target >= s.clips.length) return {};
    const clips = [...s.clips];
    [clips[idx], clips[target]] = [clips[target], clips[idx]];
    return { clips };
  }),
  setSound:          (title, url, source, startSec = 0) => set({ soundTitle: title, soundURL: url, soundSource: source, soundStartSec: startSec }),
  clearSound:        () => set({ soundTitle: '', soundURL: '', soundSource: '', soundStartSec: 0 }),
  setDetails:        (patch) => set(s => ({ details: { ...s.details, ...patch } })),
  resetAll:          () => set({
    selectedFilter: 'normal', adjustments: { ...DEFAULT_ADJUSTMENTS },
    textOverlays: [], captions: [], trimStart: 0, trimEnd: null, playbackSpeed: 1,
    clips: [],
    soundTitle: '', soundURL: '', soundSource: '', soundStartSec: 0,
    details: { ...DEFAULT_POST_DETAILS },
  }),
}));

// CSS filter string from adjustments (applied to <video> or <img>)
export function buildCSSFilter(adj: Adjustments, baseFilter = ''): string {
  // Brilliance lifts brightness+contrast together; shadow lift trades contrast for brightness.
  const b = 1 + (adj.brightness + adj.brilliance * 0.5 + adj.shadow * 0.25) / 100;
  const c = 1 + (adj.contrast + adj.brilliance * 0.3 - adj.shadow * 0.3) / 100;
  const s = 1 + adj.saturation / 100;
  const h = adj.warmth * 0.3 + adj.hue;   // hue-rotate for warmth (temp) + direct hue control
  const sharp = adj.sharpness > 0 ? `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='s'><feConvolveMatrix order='3' kernelMatrix='0 -${adj.sharpness/200} 0 -${adj.sharpness/200} ${1 + adj.sharpness/50} -${adj.sharpness/200} 0 -${adj.sharpness/200} 0'/></filter></svg>#s")` : '';
  return `brightness(${b}) contrast(${c}) saturate(${s}) hue-rotate(${h}deg) ${baseFilter} ${sharp}`.trim();
}

// Tint overlay color (magenta <-> green) — applied as a low-opacity color
// wash since CSS filter has no separate tint axis.
export function tintOverlay(adj: Adjustments): { color: string; opacity: number } | null {
  if (adj.tint === 0) return null;
  const opacity = Math.min(Math.abs(adj.tint) / 400, 0.25);
  return { color: adj.tint > 0 ? '#22C55E' : '#D946EF', opacity };
}

export const CSS_FILTERS: Record<string, string> = {
  normal:  '',
  vivid:   'saturate(1.4) contrast(1.15)',
  fade:    'saturate(0.8) brightness(1.1) contrast(0.85)',
  drama:   'contrast(1.3) saturate(0.5)',
  warm:    'sepia(0.25) saturate(1.2) brightness(1.05)',
  cool:    'saturate(0.9) hue-rotate(15deg) brightness(1.05)',
  noir:    'grayscale(1) contrast(1.2)',
  golden:  'sepia(0.4) saturate(1.3) brightness(1.1)',
  matte:   'saturate(0.7) contrast(0.9) brightness(1.1)',
  vivid2:  'saturate(1.6) contrast(1.2) brightness(1.05)',
};
