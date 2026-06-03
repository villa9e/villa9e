'use client';

export type EnergyType = 'high' | 'focused' | 'creative' | 'energize' | 'calm';

export interface SpacesEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  energy_type: EnergyType;
  trigger_min: number;
  trigger_enabled: boolean;
  affirmation?: string;
  trigger_playlist?: string;
}

export const ENERGY_COLORS: Record<EnergyType, string> = {
  high:     '#7C3AED',
  focused:  '#2952E8',
  creative: '#D97706',
  energize: '#059669',
  calm:     '#475569',
};

export const ENERGY_LABELS: Record<EnergyType, string> = {
  high:     'High Performance',
  focused:  'Focused',
  creative: 'Creative',
  energize: 'Energize',
  calm:     'Calm',
};

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function isTomorrow(iso: string) {
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return new Date(iso).toDateString() === tom.toDateString();
}

export function EnergyPill({ type }: { type: EnergyType }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
      background: `${ENERGY_COLORS[type]}20`, color: ENERGY_COLORS[type],
      border: `1px solid ${ENERGY_COLORS[type]}40`, letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {ENERGY_LABELS[type].toUpperCase()}
    </span>
  );
}
