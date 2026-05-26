// Villa9e Video Template System
// Templates are Framer Motion compositions rendered in-browser
// Export options: JSON2Video (MP4) or Canvas MediaRecorder (WebM)

export type TemplateId =
  | 'goal_recap'
  | 'progress_reel'
  | 'tribe_spotlight'
  | 'oowop_celebration'
  | 'sprint_complete'
  | 'village_intro';

export interface VideoTemplate {
  id:          TemplateId;
  name:        string;
  emoji:       string;
  description: string;
  duration:    number;   // seconds
  aspectRatio: '9:16' | '1:1' | '16:9';
  accentColor: string;
  fields:      TemplateField[];
  json2video:  (data: Record<string, any>) => object;  // JSON2Video payload builder
}

export interface TemplateField {
  key:         string;
  label:       string;
  type:        'text' | 'number' | 'color' | 'image' | 'select';
  placeholder?: string;
  options?:    string[];
  required:    boolean;
}

// ─── Build JSON2Video payload from template data ──────────────────────────────
function buildGoalRecapPayload(data: Record<string, any>) {
  return {
    comment:    'villa9e Goal Recap Video',
    width:      1080,
    height:     1920,
    fps:        30,
    duration:   15,
    scenes: [
      {
        comment:  'Intro — village branding',
        duration: 3,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0A0B12' },
          { type: 'text', text: '⛺ villa9e', x: 'center', y: 200, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 72, color: '#1877F2' } },
          { type: 'text', text: 'GOAL ACHIEVED', x: 'center', y: 320, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 48, color: '#FFD700' } },
        ],
      },
      {
        comment:  'Goal reveal',
        duration: 5,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0A0B12' },
          { type: 'text', text: data.goal_title ?? 'My Goal', x: 'center', y: 400, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 64, color: '#FFFFFF', textAlign: 'center', maxWidth: 900 } },
          { type: 'text', text: `${data.probability ?? 0}% GPS Score`, x: 'center', y: 600, style: { fontFamily: 'Arial', fontSize: 48, color: '#4ADE80' } },
          { type: 'text', text: `${data.steps_completed ?? 0} steps completed`, x: 'center', y: 700, style: { fontFamily: 'Arial', fontSize: 40, color: '#94A3B8' } },
        ],
      },
      {
        comment:  'Stats montage',
        duration: 4,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0D0020' },
          { type: 'text', text: `${data.weeks_taken ?? 0} weeks`, x: 'center', y: 500, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 96, color: '#7C3AED' } },
          { type: 'text', text: 'to achieve this', x: 'center', y: 650, style: { fontFamily: 'Arial', fontSize: 40, color: '#C4B5FD' } },
          { type: 'text', text: `+${data.vlg_earned ?? 0} $VLG earned`, x: 'center', y: 780, style: { fontFamily: 'Arial', fontWeight: 700, fontSize: 40, color: '#FFD700' } },
        ],
      },
      {
        comment:  'CTA',
        duration: 3,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0A0B12' },
          { type: 'text', text: `It takes a village.`, x: 'center', y: 700, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 56, color: '#FFFFFF' } },
          { type: 'text', text: 'villa9e.app', x: 'center', y: 820, style: { fontFamily: 'Arial', fontSize: 40, color: '#1877F2' } },
        ],
      },
    ],
  };
}

function buildProgressReelPayload(data: Record<string, any>) {
  return {
    comment: 'villa9e Progress Reel',
    width: 1080, height: 1920, fps: 30, duration: 10,
    scenes: [
      {
        duration: 2,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0A0B12' },
          { type: 'text', text: '📡 GPS Update', x: 'center', y: 300, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 80, color: '#E8770A' } },
        ],
      },
      {
        duration: 5,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0D0020' },
          { type: 'text', text: data.step_title ?? 'Step Completed', x: 'center', y: 450, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 60, color: '#FFFFFF', textAlign: 'center', maxWidth: 900 } },
          { type: 'text', text: `${data.progress ?? 0}% complete`, x: 'center', y: 620, style: { fontFamily: 'Arial', fontWeight: 700, fontSize: 72, color: '#4ADE80' } },
          { type: 'text', text: data.goal_title ?? '', x: 'center', y: 750, style: { fontFamily: 'Arial', fontSize: 36, color: '#94A3B8', textAlign: 'center', maxWidth: 900 } },
        ],
      },
      {
        duration: 3,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0A0B12' },
          { type: 'text', text: '✊ OoWop me in!', x: 'center', y: 700, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 64, color: '#FFD700' } },
          { type: 'text', text: 'villa9e.app', x: 'center', y: 820, style: { fontFamily: 'Arial', fontSize: 40, color: '#1877F2' } },
        ],
      },
    ],
  };
}

// ─── Template Definitions ─────────────────────────────────────────────────────
export const VIDEO_TEMPLATES: Record<TemplateId, VideoTemplate> = {
  goal_recap: {
    id: 'goal_recap', name: 'Goal Recap', emoji: '🏆',
    description: 'Cinematic recap when you complete a goal. Shows your journey, stats, and GPS score.',
    duration: 15, aspectRatio: '9:16', accentColor: '#FFD700',
    fields: [
      { key: 'goal_title',       label: 'Goal Title',             type: 'text',   required: true,  placeholder: 'e.g. Released my first EP' },
      { key: 'probability',      label: 'GPS Score (%)',           type: 'number', required: false, placeholder: '72' },
      { key: 'steps_completed',  label: 'Steps Completed',        type: 'number', required: false, placeholder: '8' },
      { key: 'weeks_taken',      label: 'Weeks It Took',          type: 'number', required: false, placeholder: '12' },
      { key: 'vlg_earned',       label: '$VLG Earned',            type: 'number', required: false, placeholder: '200' },
    ],
    json2video: buildGoalRecapPayload,
  },
  progress_reel: {
    id: 'progress_reel', name: 'Progress Reel', emoji: '📍',
    description: 'Quick update reel for a step you just completed. Perfect for the Dream Line.',
    duration: 10, aspectRatio: '9:16', accentColor: '#E8770A',
    fields: [
      { key: 'step_title',  label: 'Step You Completed', type: 'text',   required: true,  placeholder: 'e.g. Recorded all tracks' },
      { key: 'goal_title',  label: 'Your Goal',          type: 'text',   required: true,  placeholder: 'e.g. Release my first EP' },
      { key: 'progress',    label: 'Progress (%)',        type: 'number', required: false, placeholder: '65' },
    ],
    json2video: buildProgressReelPayload,
  },
  tribe_spotlight: {
    id: 'tribe_spotlight', name: 'Tribe Spotlight', emoji: '👥',
    description: 'Introduce your tribe to the village. Recruit members with a compelling reel.',
    duration: 12, aspectRatio: '9:16', accentColor: '#BE185D',
    fields: [
      { key: 'tribe_name',    label: 'Tribe Name',      type: 'text',   required: true,  placeholder: 'e.g. The EP Squad' },
      { key: 'tribe_mission', label: 'Mission',         type: 'text',   required: true,  placeholder: 'e.g. We release music together' },
      { key: 'member_count',  label: 'Members',         type: 'number', required: false, placeholder: '4' },
    ],
    json2video: (data) => ({
      comment: 'Tribe Spotlight', width: 1080, height: 1920, fps: 30, duration: 12,
      scenes: [{
        duration: 12,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0A0B12' },
          { type: 'text', text: '👥 ' + (data.tribe_name ?? 'Our Tribe'), x: 'center', y: 400, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 72, color: '#BE185D', textAlign: 'center', maxWidth: 900 } },
          { type: 'text', text: data.tribe_mission ?? '', x: 'center', y: 580, style: { fontFamily: 'Arial', fontSize: 44, color: '#F0EBE0', textAlign: 'center', maxWidth: 900 } },
          { type: 'text', text: `${data.member_count ?? 1} members strong`, x: 'center', y: 740, style: { fontFamily: 'Arial', fontSize: 40, color: '#FFD700' } },
          { type: 'text', text: 'Join us on villa9e.app', x: 'center', y: 880, style: { fontFamily: 'Arial', fontWeight: 700, fontSize: 36, color: '#1877F2' } },
        ],
      }],
    }),
  },
  oowop_celebration: {
    id: 'oowop_celebration', name: 'OoWop Celebration', emoji: '✊',
    description: 'Celebrate reaching 3 OoWops — your step just got validated by the village.',
    duration: 8, aspectRatio: '9:16', accentColor: '#FFD700',
    fields: [
      { key: 'step_title', label: 'Validated Step', type: 'text',   required: true,  placeholder: 'e.g. Completed my demo recording' },
      { key: 'oowop_count',label: 'OoWops Received',type: 'number', required: false, placeholder: '3' },
    ],
    json2video: (data) => ({
      comment: 'OoWop Celebration', width: 1080, height: 1920, fps: 30, duration: 8,
      scenes: [{
        duration: 8,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#1A1000' },
          { type: 'text', text: '✊', x: 'center', y: 300, style: { fontFamily: 'Arial', fontSize: 180, textAlign: 'center' } },
          { type: 'text', text: 'VALIDATED', x: 'center', y: 550, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 80, color: '#FFD700' } },
          { type: 'text', text: data.step_title ?? '', x: 'center', y: 680, style: { fontFamily: 'Arial', fontSize: 44, color: '#F0EBE0', textAlign: 'center', maxWidth: 900 } },
          { type: 'text', text: `${data.oowop_count ?? 3} OoWops from the village`, x: 'center', y: 820, style: { fontFamily: 'Arial', fontSize: 36, color: '#94A3B8' } },
        ],
      }],
    }),
  },
  sprint_complete: {
    id: 'sprint_complete', name: 'Sprint Complete', emoji: '⚡',
    description: 'Announce that you\'ve finished a full sprint. Show the village your momentum.',
    duration: 10, aspectRatio: '9:16', accentColor: '#7C3AED',
    fields: [
      { key: 'sprint_name',  label: 'Sprint Name',        type: 'text',   required: true, placeholder: 'e.g. Sprint 1: Foundation' },
      { key: 'milestone',    label: 'Milestone Achieved',  type: 'text',   required: true, placeholder: 'e.g. All tracks recorded' },
      { key: 'next_sprint',  label: 'Next Sprint',         type: 'text',   required: false,placeholder: 'e.g. Sprint 2: Mix & Master' },
    ],
    json2video: (data) => ({
      comment: 'Sprint Complete', width: 1080, height: 1920, fps: 30, duration: 10,
      scenes: [{
        duration: 10,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0D0020' },
          { type: 'text', text: '⚡ SPRINT COMPLETE', x: 'center', y: 250, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 64, color: '#7C3AED' } },
          { type: 'text', text: data.sprint_name ?? '', x: 'center', y: 400, style: { fontFamily: 'Arial', fontWeight: 700, fontSize: 52, color: '#C4B5FD', textAlign: 'center', maxWidth: 900 } },
          { type: 'text', text: '✓ ' + (data.milestone ?? ''), x: 'center', y: 580, style: { fontFamily: 'Arial', fontSize: 44, color: '#4ADE80', textAlign: 'center', maxWidth: 900 } },
          { type: 'text', text: data.next_sprint ? `Next: ${data.next_sprint}` : '', x: 'center', y: 750, style: { fontFamily: 'Arial', fontSize: 36, color: '#94A3B8', textAlign: 'center', maxWidth: 900 } },
        ],
      }],
    }),
  },
  village_intro: {
    id: 'village_intro', name: 'Village Intro', emoji: '🏕️',
    description: 'Introduce yourself to the village. Who you are, what you\'re building, why you\'re here.',
    duration: 12, aspectRatio: '9:16', accentColor: '#1877F2',
    fields: [
      { key: 'name',      label: 'Your Name',         type: 'text', required: true,  placeholder: 'Your name or @username' },
      { key: 'goal',      label: 'What You\'re Building', type: 'text', required: true,  placeholder: 'e.g. Building my music career' },
      { key: 'why',       label: 'Your Why',          type: 'text', required: false, placeholder: 'e.g. For my family' },
      { key: 'archetype', label: 'Your Archetype',    type: 'select', required: false,
        options: ['Architect', 'Spark', 'Anchor', 'Compass', 'Pioneer', 'Sage', 'Weaver', 'Flame'] },
    ],
    json2video: (data) => ({
      comment: 'Village Intro', width: 1080, height: 1920, fps: 30, duration: 12,
      scenes: [{
        duration: 12,
        elements: [
          { type: 'rectangle', width: '100%', height: '100%', color: '#0A0B12' },
          { type: 'text', text: '⛺ villa9e', x: 'center', y: 200, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 60, color: '#1877F2' } },
          { type: 'text', text: data.name ?? 'My Name', x: 'center', y: 380, style: { fontFamily: 'Arial', fontWeight: 900, fontSize: 80, color: '#FFFFFF' } },
          { type: 'text', text: data.archetype ? `The ${data.archetype}` : '', x: 'center', y: 500, style: { fontFamily: 'Arial', fontSize: 44, color: '#7C3AED' } },
          { type: 'text', text: 'I\'m building:', x: 'center', y: 640, style: { fontFamily: 'Arial', fontSize: 36, color: '#94A3B8' } },
          { type: 'text', text: data.goal ?? '', x: 'center', y: 720, style: { fontFamily: 'Arial', fontWeight: 700, fontSize: 52, color: '#F0EBE0', textAlign: 'center', maxWidth: 900 } },
          { type: 'text', text: data.why ? `Why: ${data.why}` : '', x: 'center', y: 870, style: { fontFamily: 'Arial', fontSize: 36, color: '#60A5FA', textAlign: 'center', maxWidth: 900 } },
        ],
      }],
    }),
  },
};
