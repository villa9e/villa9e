'use client';
import { create } from 'zustand';

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
}

export interface Adjustments {
  brightness:  number;   // -100 to 100, default 0
  contrast:    number;
  saturation:  number;
  warmth:      number;
  sharpness:   number;
  vignette:    number;   // 0-100
  fade:        number;   // 0-100
  grain:       number;   // 0-100
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0, contrast: 0, saturation: 0, warmth: 0,
  sharpness: 0, vignette: 0, fade: 0, grain: 0,
};

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
  trimStart:       number;
  trimEnd:         number | null;
  playbackSpeed:   number;  // 0.5 = slow, 1 = normal, 2 = fast

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
  setTrim:            (start: number, end: number | null) => void;
  setPlaybackSpeed:   (s: number) => void;
  setSound:           (title: string, url: string, source: string, startSec?: number) => void;
  clearSound:         () => void;
  setDetails:         (patch: Partial<PostDetails>) => void;
  resetAll:           () => void;
}

export const useCreateStore = create<CreateStore>((set) => ({
  selectedFilter:  'normal',
  adjustments:     { ...DEFAULT_ADJUSTMENTS },
  textOverlays:    [],
  trimStart:       0,
  trimEnd:         null,
  playbackSpeed:   1,
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
  setTrim:           (start, end) => set({ trimStart: start, trimEnd: end }),
  setPlaybackSpeed:  (s) => set({ playbackSpeed: s }),
  setSound:          (title, url, source, startSec = 0) => set({ soundTitle: title, soundURL: url, soundSource: source, soundStartSec: startSec }),
  clearSound:        () => set({ soundTitle: '', soundURL: '', soundSource: '', soundStartSec: 0 }),
  setDetails:        (patch) => set(s => ({ details: { ...s.details, ...patch } })),
  resetAll:          () => set({
    selectedFilter: 'normal', adjustments: { ...DEFAULT_ADJUSTMENTS },
    textOverlays: [], trimStart: 0, trimEnd: null, playbackSpeed: 1,
    soundTitle: '', soundURL: '', soundSource: '', soundStartSec: 0,
    details: { ...DEFAULT_POST_DETAILS },
  }),
}));

// CSS filter string from adjustments (applied to <video> or <img>)
export function buildCSSFilter(adj: Adjustments, baseFilter = ''): string {
  const b = 1 + adj.brightness / 100;
  const c = 1 + adj.contrast / 100;
  const s = 1 + adj.saturation / 100;
  const h = adj.warmth * 0.3;   // hue-rotate for warmth
  const sharp = adj.sharpness > 0 ? `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='s'><feConvolveMatrix order='3' kernelMatrix='0 -${adj.sharpness/200} 0 -${adj.sharpness/200} ${1 + adj.sharpness/50} -${adj.sharpness/200} 0 -${adj.sharpness/200} 0'/></filter></svg>#s")` : '';
  return `brightness(${b}) contrast(${c}) saturate(${s}) hue-rotate(${h}deg) ${baseFilter} ${sharp}`.trim();
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
