'use client';
// Auto face/object tracking — runs MediaPipe Tasks Vision client-side
// (open-source, no API key) to sample a video and produce zoom/pan
// keyframes that keep the detected subject centered in frame.
import { FilesetResolver, FaceDetector, ObjectDetector } from '@mediapipe/tasks-vision';
import type { TextKeyframe } from './store';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const OBJECT_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite';

const SAMPLE_INTERVAL = 0.5; // seconds between tracked frames

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise(resolve => {
    const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}

// Converts a normalized subject center (0-1) into pan x/y (percent offset
// from frame center) at the given zoom level, so the subject stays in view.
function centerToKeyframe(time: number, cx: number, cy: number, zoom: number): TextKeyframe {
  const x = (0.5 - cx) * 100 * (zoom - 1);
  const y = (0.5 - cy) * 100 * (zoom - 1);
  const clamp = (v: number) => Math.max(-50, Math.min(50, v));
  return { time, x: clamp(x), y: clamp(y), scale: zoom, opacity: 1 };
}

export async function trackFaceZoom(
  video: HTMLVideoElement,
  duration: number,
  zoom: number,
  onProgress?: (pct: number) => void
): Promise<TextKeyframe[]> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const detector = await FaceDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: FACE_MODEL_URL },
    runningMode: 'IMAGE',
  });

  const wasPlaying = !video.paused;
  video.pause();
  const originalTime = video.currentTime;

  const keyframes: TextKeyframe[] = [];
  const steps = Math.max(2, Math.ceil(duration / SAMPLE_INTERVAL));
  let lastCenter: { cx: number; cy: number } | null = null;

  try {
    for (let i = 0; i <= steps; i++) {
      const t = Math.min(duration, i * SAMPLE_INTERVAL);
      await seekTo(video, t);
      const result = detector.detect(video);
      const face = result.detections[0];
      let center: { cx: number; cy: number } = lastCenter ?? { cx: 0.5, cy: 0.5 };
      if (face?.boundingBox) {
        const bb = face.boundingBox;
        center = {
          cx: (bb.originX + bb.width / 2) / video.videoWidth,
          cy: (bb.originY + bb.height / 2) / video.videoHeight,
        };
        lastCenter = center;
      }
      keyframes.push(centerToKeyframe(t, center.cx, center.cy, zoom));
      onProgress?.(Math.round((i / steps) * 100));
    }
  } finally {
    detector.close();
    video.currentTime = originalTime;
    if (wasPlaying) video.play().catch(() => {});
  }

  return mergeFlatRuns(keyframes);
}

export async function trackObjectZoom(
  video: HTMLVideoElement,
  duration: number,
  zoom: number,
  onProgress?: (pct: number) => void
): Promise<TextKeyframe[]> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const detector = await ObjectDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: OBJECT_MODEL_URL },
    runningMode: 'IMAGE',
    maxResults: 1,
    scoreThreshold: 0.3,
  });

  const wasPlaying = !video.paused;
  video.pause();
  const originalTime = video.currentTime;

  const keyframes: TextKeyframe[] = [];
  const steps = Math.max(2, Math.ceil(duration / SAMPLE_INTERVAL));
  let lastCenter: { cx: number; cy: number } | null = null;

  try {
    for (let i = 0; i <= steps; i++) {
      const t = Math.min(duration, i * SAMPLE_INTERVAL);
      await seekTo(video, t);
      const result = detector.detect(video);
      const obj = result.detections[0];
      let center: { cx: number; cy: number } = lastCenter ?? { cx: 0.5, cy: 0.5 };
      if (obj?.boundingBox) {
        const bb = obj.boundingBox;
        center = {
          cx: (bb.originX + bb.width / 2) / video.videoWidth,
          cy: (bb.originY + bb.height / 2) / video.videoHeight,
        };
        lastCenter = center;
      }
      keyframes.push(centerToKeyframe(t, center.cx, center.cy, zoom));
      onProgress?.(Math.round((i / steps) * 100));
    }
  } finally {
    detector.close();
    video.currentTime = originalTime;
    if (wasPlaying) video.play().catch(() => {});
  }

  return mergeFlatRuns(keyframes);
}

// Collapse consecutive identical pan/scale values down to their endpoints —
// keeps the keyframe list small when the subject holds still.
function mergeFlatRuns(keyframes: TextKeyframe[]): TextKeyframe[] {
  if (keyframes.length <= 2) return keyframes;
  const out: TextKeyframe[] = [keyframes[0]];
  for (let i = 1; i < keyframes.length - 1; i++) {
    const prev = out[out.length - 1];
    const cur = keyframes[i];
    const next = keyframes[i + 1];
    const sameAsPrev = Math.abs(cur.x - prev.x) < 0.5 && Math.abs(cur.y - prev.y) < 0.5;
    const sameAsNext = Math.abs(cur.x - next.x) < 0.5 && Math.abs(cur.y - next.y) < 0.5;
    if (sameAsPrev && sameAsNext) continue;
    out.push(cur);
  }
  out.push(keyframes[keyframes.length - 1]);
  return out;
}
