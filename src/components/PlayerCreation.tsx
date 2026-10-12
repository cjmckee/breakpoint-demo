/**
 * Player Creation Component
 * Name the player and build their pixel-art look. Playstyle is not picked here — Coach
 * Gonzalez sets the archetype early in the story.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { Appearance, Handedness, SpritePose } from '../types/appearance';
import {
  DEFAULT_APPEARANCE,
  HAIR_COLOR_KEYS,
  HAIR_STYLE_KEYS,
  KIT_COLOR_KEYS,
  SKIN_TONE_KEYS,
  randomAppearance,
} from '../core/spriteComposer';
import { HAIR_COLORS, KIT_COLORS, SKIN_TONES } from '../data/sprites/palettes';
import { HAIR_STYLES } from '../data/sprites/layers';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { WelcomeOverlay } from './WelcomeOverlay';
import { PixelSprite } from './sprites/PixelSprite';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/** The preview plays these on a loop, so the look is seen moving without a control. */
const PREVIEW_SEQUENCE: readonly { pose: SpritePose; ms: number }[] = [
  { pose: 'idle', ms: 2400 },
  { pose: 'run', ms: 1200 },
  { pose: 'swing', ms: 600 },
];
const HANDEDNESS: readonly Handedness[] = ['right', 'left'];

interface SwatchRowProps<K extends string> {
  label: string;
  options: readonly K[];
  selected: K;
  colorOf: (key: K) => string;
  nameOf: (key: K) => string;
  testIdPrefix: string;
  onSelect: (key: K) => void;
}

function SwatchRow<K extends string>({
  label,
  options,
  selected,
  colorOf,
  nameOf,
  testIdPrefix,
  onSelect,
}: SwatchRowProps<K>): React.ReactElement {
  return (
    <div>
      <div className="text-sm font-bold text-pixel-text mb-2">
        {label}: <span className="text-pixel-text-muted font-normal">{nameOf(selected)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            title={nameOf(key)}
            aria-label={`${label} ${nameOf(key)}`}
            aria-pressed={key === selected}
            data-testid={`${testIdPrefix}-${key}`}
            className={`w-9 h-9 border-4 flex items-center justify-center ${
              key === selected
                ? 'border-pixel-accent'
                : 'border-pixel-border [@media(hover:hover)]:hover:border-pixel-secondary'
            }`}
            style={{ backgroundColor: colorOf(key) }}
          >
            {key === selected && (
              <span className="text-white text-lg leading-none font-black [text-shadow:0_0_2px_#000,0_0_3px_#000]">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ChoiceRowProps<K extends string> {
  label: string;
  options: readonly K[];
  selected: K;
  nameOf: (key: K) => string;
  testIdPrefix: string;
  onSelect: (key: K) => void;
}

function ChoiceRow<K extends string>({
  label,
  options,
  selected,
  nameOf,
  testIdPrefix,
  onSelect,
}: ChoiceRowProps<K>): React.ReactElement {
  return (
    <div>
      <div className="text-sm font-bold text-pixel-text mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={key === selected}
            data-testid={`${testIdPrefix}-${key}`}
            className={`px-3 py-1 border-4 bg-pixel-card text-sm font-bold ${
              key === selected
                ? 'border-pixel-accent text-pixel-text'
                : 'border-pixel-border text-pixel-text-muted [@media(hover:hover)]:hover:border-pixel-secondary'
            }`}
          >
            {key === selected && <span className="text-pixel-accent">✓ </span>}
            {nameOf(key)}
          </button>
        ))}
      </div>
    </div>
  );
}

export const PlayerCreation: React.FC = () => {
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [step, setStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const createPlayer = useGameStore((state) => state.createPlayer);

  const update = useCallback(<K extends keyof Appearance>(key: K, value: Appearance[K]) => {
    setAppearance((current) => ({ ...current, [key]: value }));
  }, []);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (name.trim()) {
      createPlayer(name.trim(), appearance);
    }
  };

  const reducedMotion = usePrefersReducedMotion();
  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setTimeout(
      () => setStep((s) => (s + 1) % PREVIEW_SEQUENCE.length),
      PREVIEW_SEQUENCE[step].ms,
    );
    return () => window.clearTimeout(id);
  }, [step, reducedMotion]);

  const pose = PREVIEW_SEQUENCE[step].pose;

  return (
    <>
      <WelcomeOverlay isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      <div className="min-h-screen bg-pixel-bg flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-pixel-text mb-2">
              Create Your Tennis Player
            </h1>
            <p className="text-pixel-text-muted">
              Begin your journey to becoming a tennis champion
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="player-name" className="block text-lg font-bold text-pixel-text mb-2">
                Player Name
              </label>
              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 bg-pixel-bg border-4 border-pixel-border text-pixel-text text-lg focus:border-pixel-accent focus:outline-none"
                maxLength={20}
                autoComplete="off"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-start">
              {/* Live preview, playing idle → run → swing on a loop */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="bg-pixel-primary border-4 border-pixel-border p-4"
                  data-testid="creator-preview"
                  data-pose={pose}
                >
                  <PixelSprite appearance={appearance} pose={pose} scale={8} />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  testId="creator-randomize"
                  onClick={() => setAppearance(randomAppearance(Math.random))}
                >
                  🎲 Randomize
                </Button>
              </div>

              <div className="space-y-4">
                <ChoiceRow
                  label="Hairstyle"
                  options={HAIR_STYLE_KEYS}
                  selected={appearance.hairStyle}
                  nameOf={(key) => HAIR_STYLES[key].label}
                  testIdPrefix="creator-hair-style"
                  onSelect={(key) => update('hairStyle', key)}
                />
                <SwatchRow
                  label="Hair Color"
                  options={HAIR_COLOR_KEYS}
                  selected={appearance.hairColor}
                  colorOf={(key) => HAIR_COLORS[key].ramp.base}
                  nameOf={(key) => HAIR_COLORS[key].label}
                  testIdPrefix="creator-hair-color"
                  onSelect={(key) => update('hairColor', key)}
                />
                <SwatchRow
                  label="Skin Tone"
                  options={SKIN_TONE_KEYS}
                  selected={appearance.skinTone}
                  colorOf={(key) => SKIN_TONES[key].ramp.base}
                  nameOf={(key) => SKIN_TONES[key].label}
                  testIdPrefix="creator-skin"
                  onSelect={(key) => update('skinTone', key)}
                />
                <SwatchRow
                  label="Kit"
                  options={KIT_COLOR_KEYS}
                  selected={appearance.kitColor}
                  colorOf={(key) => KIT_COLORS[key].ramp.base}
                  nameOf={(key) => KIT_COLORS[key].label}
                  testIdPrefix="creator-kit"
                  onSelect={(key) => update('kitColor', key)}
                />
                <ChoiceRow
                  label="Plays"
                  options={HANDEDNESS}
                  selected={appearance.handedness}
                  nameOf={(key) => (key === 'right' ? 'Right-handed' : 'Left-handed')}
                  testIdPrefix="creator-hand"
                  onSelect={(key) => update('handedness', key)}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!name.trim()}
                testId="creator-submit"
              >
                Create Player
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
};
