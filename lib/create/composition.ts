// Multi-track timeline math: turns the primary clip (session media +
// trimStart/trimEnd) plus any additional `clips` into an ordered list of
// playable segments, and resolves a global composition time to the active
// segment + its local time within the source media.
import type { Clip, TextKeyframe } from './store';

export interface Segment {
  id:                 string;
  mediaURL:           string;
  mediaType:          'video' | 'photo';
  inPoint:            number;
  outPoint:           number;
  duration:           number;
  transitionIn:       Clip['transitionIn'];
  transitionDuration: number;
}

export function buildSegments(
  primary: { mediaURL: string; mediaType: 'video' | 'photo'; trimStart: number; trimEnd: number | null; sourceDuration: number },
  clips: Clip[]
): Segment[] {
  const segments: Segment[] = [];
  const primaryOut = primary.trimEnd ?? primary.sourceDuration;
  segments.push({
    id: 'primary',
    mediaURL: primary.mediaURL,
    mediaType: primary.mediaType,
    inPoint: primary.trimStart,
    outPoint: primaryOut,
    duration: Math.max(0, primaryOut - primary.trimStart),
    transitionIn: 'none',
    transitionDuration: 0.5,
  });
  for (const c of clips) {
    segments.push({
      id: c.id,
      mediaURL: c.mediaURL,
      mediaType: c.mediaType,
      inPoint: c.inPoint,
      outPoint: c.outPoint,
      duration: Math.max(0, c.outPoint - c.inPoint),
      transitionIn: c.transitionIn,
      transitionDuration: c.transitionDuration,
    });
  }
  return segments;
}

export function getTotalDuration(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + s.duration, 0);
}

export interface ActiveSegment {
  segment:  Segment;
  index:    number;
  segStart: number;   // global composition time this segment begins at
  localTime: number;  // time within the segment's source media
}

export function getActiveSegment(segments: Segment[], compTime: number): ActiveSegment | null {
  if (segments.length === 0) return null;
  let segStart = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segEnd = segStart + seg.duration;
    if (compTime < segEnd || i === segments.length - 1) {
      const offset = Math.max(0, Math.min(compTime - segStart, seg.duration));
      return { segment: seg, index: i, segStart, localTime: seg.inPoint + offset };
    }
    segStart = segEnd;
  }
  return null;
}

// Linear interpolation of overlay transform/opacity at `time` (seconds on
// the primary clip's timeline). Returns null if fewer than 2 keyframes
// exist — caller should fall back to the overlay's static x/y.
export function interpolateKeyframes(keyframes: TextKeyframe[] | undefined, time: number): { x: number; y: number; scale: number; opacity: number } | null {
  if (!keyframes || keyframes.length < 2) return null;
  if (time <= keyframes[0].time) return { x: keyframes[0].x, y: keyframes[0].y, scale: keyframes[0].scale, opacity: keyframes[0].opacity };
  const last = keyframes[keyframes.length - 1];
  if (time >= last.time) return { x: last.x, y: last.y, scale: last.scale, opacity: last.opacity };
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i], b = keyframes[i + 1];
    if (time >= a.time && time <= b.time) {
      const t = (b.time - a.time) === 0 ? 0 : (time - a.time) / (b.time - a.time);
      return {
        x:       a.x + (b.x - a.x) * t,
        y:       a.y + (b.y - a.y) * t,
        scale:   a.scale + (b.scale - a.scale) * t,
        opacity: a.opacity + (b.opacity - a.opacity) * t,
      };
    }
  }
  return null;
}
