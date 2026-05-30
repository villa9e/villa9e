'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export const VILLAGE_SONGS = [
  { id: 'villa9e',        title: 'Villa9e',           file: '/music/Villa9e.m4a' },
  { id: 'villa9e_remix',  title: 'Villa9e (Remix)',   file: '/music/Villa9e (Remix).mp3' },
  { id: 'compassion',     title: 'Compassion',         file: '/music/Compassion.mp3' },
  { id: 'connection',     title: 'Connection',         file: '/music/Connection.m4a' },
  { id: 'electric_flow',  title: 'Electric Flow',      file: '/music/Electric Flow.m4a' },
  { id: 'exhale',         title: 'EXHALE',             file: '/music/EXHALE.m4a' },
  { id: 'forever',        title: 'Forever',            file: '/music/Forever.m4a' },
  { id: 'golden_days',    title: 'Golden Days',        file: '/music/Golden Days.m4a' },
  { id: 'good_to_you',    title: 'Good To You',        file: '/music/Good To You.mp3' },
  { id: 'gratitude',      title: 'Gratitude',          file: '/music/Gratitude.m4a' },
  { id: 'heart_center',   title: 'Heart Center',       file: '/music/Heart Center.m4a' },
  { id: 'magnetic_flow',  title: 'Magnetic Flow',      file: '/music/Magnetic Flow.m4a' },
  { id: 'mami_wata',      title: 'Mami Wata',          file: '/music/Mami Wata.mp3' },
  { id: 'mellow',         title: 'Mellow',             file: '/music/Mellow.mp3' },
  { id: 'nights_paradise',title: 'Nights In Paradise', file: '/music/Nights In Paradise.mp3' },
  { id: 'party',          title: 'Party',              file: '/music/Party.m4a' },
  { id: 'slow_motions',   title: 'Slow Motions',       file: '/music/Slow Motions.m4a' },
  { id: 'wild_run',       title: 'Wild Run',           file: '/music/Wild Run.m4a' },
  { id: 'woohoo',         title: 'WooHoo',             file: '/music/WooHoo.mp3' },
];

const DEFAULT_SONG_IDX = 0; // Villa9e is default

export interface MusicState {
  musicOn:      boolean;
  sfxOn:        boolean;
  spiritOn:     boolean;
  musicVol:     number;  // 0–1
  sfxVol:       number;
  spiritVol:    number;
  shuffle:      boolean;
  currentIdx:   number;
  isPlaying:    boolean;
}

const STORAGE_KEY = 'villa9e_music_prefs';

function loadPrefs(): MusicState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return { ...defaultState(), ...JSON.parse(s) };
  } catch {}
  return defaultState();
}

function defaultState(): MusicState {
  return {
    musicOn: true, sfxOn: true, spiritOn: true,
    musicVol: 0.6, sfxVol: 0.8, spiritVol: 0.9,
    shuffle: false, currentIdx: DEFAULT_SONG_IDX, isPlaying: false,
  };
}

export function useVillageMusic() {
  const [state, setState] = useState<MusicState>(defaultState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initedRef = useRef(false);

  useEffect(() => {
    setState(loadPrefs());
  }, []);

  // Persist on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { isPlaying, ...toSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [state]);

  // Boot audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.preload = 'none';
    }
    const audio = audioRef.current;

    audio.onended = () => {
      if (state.shuffle) {
        let next = Math.floor(Math.random() * VILLAGE_SONGS.length);
        if (next === state.currentIdx) next = (next + 1) % VILLAGE_SONGS.length;
        setState(s => ({ ...s, currentIdx: next }));
      } else {
        setState(s => ({ ...s, currentIdx: (s.currentIdx + 1) % VILLAGE_SONGS.length }));
      }
    };
  }, []);

  // Sync src + volume when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const song = VILLAGE_SONGS[state.currentIdx];
    if (audio.src !== window.location.origin + song.file) {
      audio.src = song.file;
      audio.load();
    }
    audio.volume = state.musicOn ? state.musicVol : 0;
    if (state.musicOn && state.isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [state.currentIdx, state.musicOn, state.isPlaying, state.musicVol]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src || audio.src === window.location.origin + '/') {
      audio.src = VILLAGE_SONGS[state.currentIdx].file;
      audio.load();
    }
    audio.play().then(() => setState(s => ({ ...s, isPlaying: true }))).catch(() => {});
  }, [state.currentIdx]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState(s => ({ ...s, isPlaying: false }));
  }, []);

  const toggleMusic = useCallback(() => {
    setState(s => {
      const on = !s.musicOn;
      if (audioRef.current) audioRef.current.volume = on ? s.musicVol : 0;
      return { ...s, musicOn: on };
    });
  }, []);

  const selectSong = useCallback((idx: number) => {
    setState(s => ({ ...s, currentIdx: idx, isPlaying: true }));
  }, []);

  const setMusicVol = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setState(s => ({ ...s, musicVol: v }));
  }, []);

  const set = useCallback(<K extends keyof MusicState>(key: K, val: MusicState[K]) => {
    setState(s => ({ ...s, [key]: val }));
  }, []);

  return {
    state,
    play,
    pause,
    toggleMusic,
    selectSong,
    setMusicVol,
    set,
    songs: VILLAGE_SONGS,
  };
}
