/**
 * AudioManager
 * Singleton that handles all music and SFX playback.
 * Uses HTML Audio elements — no AudioContext needed.
 *
 * Music tracks crossfade between one another.
 * SFX are loaded on first play and reused via a pool.
 */

import { SfxKey, MusicTrack, SFX_PATHS, MUSIC_POOLS, resolveAudioPath } from './sounds';

const CROSSFADE_DURATION = 1500; // ms
const CROSSFADE_STEPS = 30;

class AudioManager {
  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private muteMusic = false;
  private muteSfx = false;

  // Two audio elements for crossfading
  private musicA: HTMLAudioElement | null = null;
  private musicB: HTMLAudioElement | null = null;
  private activeMusicEl: 'A' | 'B' = 'A';
  private currentTrack: MusicTrack | null = null;
  private currentTrackGain = 1.0;
  private crossfadeTimer: ReturnType<typeof setInterval> | null = null;

  // SFX pool: key → array of audio elements
  private sfxPool: Partial<Record<SfxKey, HTMLAudioElement[]>> = {};
  private sfxPoolIndex: Partial<Record<SfxKey, number>> = {};
  private readonly SFX_POOL_SIZE = 3;

  constructor() {
    if (typeof window !== 'undefined') {
      this.musicA = new Audio();
      this.musicB = new Audio();
      this.musicA.loop = true;
      this.musicB.loop = true;
      this.musicA.volume = 0;
      this.musicB.volume = 0;
    }
  }

  // ─── Volume Controls ───────────────────────────────────────────────────────

  setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    const active = this.getActiveMusicEl();
    if (active && !this.muteMusic) {
      active.volume = this.musicVolume * this.currentTrackGain;
    }
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }

  setMuteMusic(mute: boolean) {
    this.muteMusic = mute;
    const active = this.getActiveMusicEl();
    if (active) {
      active.volume = mute ? 0 : this.musicVolume * this.currentTrackGain;
    }
  }

  setMuteSfx(mute: boolean) {
    this.muteSfx = mute;
  }

  getMusicVolume() { return this.musicVolume; }
  getSfxVolume()   { return this.sfxVolume; }
  isMusicMuted()   { return this.muteMusic; }
  isSfxMuted()     { return this.muteSfx; }

  // ─── Music ────────────────────────────────────────────────────────────────

  playMusic(track: MusicTrack) {
    if (typeof window === 'undefined') return;
    if (this.currentTrack === track) return;

    // Cancel any in-flight crossfade so we don't have two running
    if (this.crossfadeTimer !== null) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
      // Force-stop the element that was fading out
      const stale = this.getInactiveMusicEl();
      if (stale) {
        stale.pause();
        stale.src = '';
      }
    }

    const incoming = this.getInactiveMusicEl();
    const outgoing = this.getActiveMusicEl();
    if (!incoming || !outgoing) return;

    // Pick a random entry from the track's pool
    const pool = MUSIC_POOLS[track];
    const entry = pool[Math.floor(Math.random() * pool.length)];

    this.currentTrackGain = entry.gain;
    incoming.src = resolveAudioPath(entry.path);
    incoming.volume = 0;
    console.log(`[Audio] Now playing: ${entry.title}`);
    incoming.currentTime = 0;
    incoming.play().catch(() => {/* autoplay blocked — user hasn't interacted yet */});

    this.currentTrack = track;
    this.activeMusicEl = this.activeMusicEl === 'A' ? 'B' : 'A';

    this.crossfade(outgoing, incoming);
  }

  stopMusic() {
    const active = this.getActiveMusicEl();
    if (active) {
      this.fadeTo(active, 0, CROSSFADE_DURATION).then(() => active.pause());
    }
    this.currentTrack = null;
  }

  // ─── SFX ──────────────────────────────────────────────────────────────────

  playSfx(key: SfxKey) {
    if (typeof window === 'undefined') return;
    if (this.muteSfx) return;

    const pool = this.getOrCreatePool(key);
    const idx = (this.sfxPoolIndex[key] ?? 0) % this.SFX_POOL_SIZE;
    this.sfxPoolIndex[key] = idx + 1;

    const el = pool[idx];
    el.volume = this.sfxVolume;
    el.currentTime = 0;
    el.play().catch(() => {/* ignored */});
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private getActiveMusicEl(): HTMLAudioElement | null {
    return this.activeMusicEl === 'A' ? this.musicA : this.musicB;
  }

  private getInactiveMusicEl(): HTMLAudioElement | null {
    return this.activeMusicEl === 'A' ? this.musicB : this.musicA;
  }

  private crossfade(outgoing: HTMLAudioElement, incoming: HTMLAudioElement) {
    const targetVol = this.muteMusic ? 0 : this.musicVolume * this.currentTrackGain;
    const stepMs = CROSSFADE_DURATION / CROSSFADE_STEPS;
    let step = 0;

    this.crossfadeTimer = setInterval(() => {
      step++;
      const t = step / CROSSFADE_STEPS;
      incoming.volume = Math.min(targetVol, targetVol * t);
      outgoing.volume = Math.max(0, targetVol * (1 - t));

      if (step >= CROSSFADE_STEPS) {
        clearInterval(this.crossfadeTimer!);
        this.crossfadeTimer = null;
        outgoing.pause();
        outgoing.src = '';
      }
    }, stepMs);
  }

  private fadeTo(el: HTMLAudioElement, target: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const steps = CROSSFADE_STEPS;
      const stepMs = duration / steps;
      const start = el.volume;
      let step = 0;

      const tick = setInterval(() => {
        step++;
        el.volume = start + (target - start) * (step / steps);
        if (step >= steps) {
          clearInterval(tick);
          resolve();
        }
      }, stepMs);
    });
  }

  private getOrCreatePool(key: SfxKey): HTMLAudioElement[] {
    if (!this.sfxPool[key]) {
      const pool: HTMLAudioElement[] = [];
      const src = resolveAudioPath(SFX_PATHS[key]);
      for (let i = 0; i < this.SFX_POOL_SIZE; i++) {
        const el = new Audio(src);
        el.preload = 'auto';
        pool.push(el);
      }
      this.sfxPool[key] = pool;
    }
    return this.sfxPool[key]!;
  }
}

// Export singleton
export const audioManager = new AudioManager();
