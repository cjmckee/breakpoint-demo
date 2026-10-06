/**
 * MomentumEngine - shared, event-driven match momentum
 *
 * A single momentum value on a player-positive scale ([-clamp, +clamp], where
 * positive favours the player). Every point nudges momentum toward the point
 * winner and it decays back toward 0 when nothing feeds it. Game- and set-level
 * events can seize or reset it:
 *
 *  - A break of serve pulls momentum a large fraction of the way toward the
 *    breaker (a takeover that can flip the sign outright).
 *  - Winning a set mostly wipes momentum, keeping a small tilt to the set winner.
 *
 * Because every contribution lives on the same scale, an authored key-moment
 * momentum reward (fed via applyDirect) reads on the bar instead of being
 * dwarfed by the incidental swing of simply winning the point.
 *
 * Momentum has a second, slower part: rhythm. Momentum above follows results —
 * winning points pushes it your way, and it fades within a game or so. Rhythm
 * has no cause on court. After every game each player's rhythm takes a random
 * step and drifts back toward zero, so it runs in spells about a set long: a
 * player can get hot or go cold whatever the score. Focus steadies it. Breaks
 * and set boundaries act on momentum only, so a set won does not end a hot
 * spell. Rhythm is per player and in shot-quality points; the engines add it to
 * each player's match-day form (see MOMENTUM.rhythm).
 *
 * Pure logic, no React / store dependencies — used by both the instant
 * MatchSimulator and the interactive MatchOrchestrator so simulated and played
 * matches share one momentum model.
 */

import { PointType } from '../types';
import { MOMENTUM } from '../config/shotThresholds';
import { random } from './random';

export type ClutchLevel = 'breakPoint' | 'setPoint' | 'matchPoint' | null;

export interface MomentumPointEvent {
  /** Who won the point (player-positive model). */
  winner: 'player' | 'opponent';
  /** How the point ended — selects the base bump magnitude. */
  pointType: PointType | string;
  /** Stakes on the point; amplifies the bump. */
  clutch?: ClutchLevel;
  /** True if resolved as an interactive key moment; stacks a further amplifier. */
  isKeyMoment?: boolean;
  /** Set when this point ended a game (drives the break-of-serve takeover). */
  game?: { winner: 'player' | 'opponent'; wasBreak: boolean };
  /** Set when this point ended a set (drives the set-boundary reset). */
  setWonBy?: 'player' | 'opponent';
}

type Side = 'player' | 'opponent';

const clamp = (v: number): number => Math.max(-MOMENTUM.clamp, Math.min(MOMENTUM.clamp, v));

/** Roughly standard normal, from three uniforms (bounded at ±3). */
const normalish = (): number => (random() + random() + random() - 1.5) * 2;

export class MomentumEngine {
  private value = 0;
  private rhythm: Record<Side, number> = { player: 0, opponent: 0 };
  private focus: Record<Side, number> = { player: 0, opponent: 0 };

  /** Current momentum, player-positive, in [-clamp, +clamp]. */
  public get(): number {
    return this.value;
  }

  /** A player's current rhythm, in shot-quality points (0 when rhythm is off). */
  public getRhythm(side: Side): number {
    return this.rhythm[side];
  }

  /**
   * Reset to neutral (start of a match). Each player's focus steadies their
   * rhythm; leave it out and rhythm runs unsteadied.
   */
  public reset(focus: Record<Side, number> = { player: 0, opponent: 0 }): void {
    this.value = 0;
    this.rhythm = { player: 0, opponent: 0 };
    this.focus = { ...focus };
  }

  /**
   * Nudge momentum directly on the player-positive scale.
   * Used for key-moment secondary effects that award/remove momentum outright.
   */
  public applyDirect(delta: number): void {
    this.value = clamp(this.value + delta);
  }

  /**
   * Apply a completed point (and any game/set boundary it triggered).
   */
  public applyPoint(event: MomentumPointEvent): void {
    // 1. Decay toward 0 — momentum fades unless it keeps getting fed.
    this.value *= MOMENTUM.decayPerPoint;

    // 2. Per-point bump toward the winner, scaled by how it ended and the stakes.
    const base = MOMENTUM.bump[event.pointType as string] ?? MOMENTUM.bump.default;
    let multiplier = 1;
    if (event.clutch) {
      multiplier *= MOMENTUM.clutchMultiplier[event.clutch] ?? 1;
    }
    if (event.isKeyMoment) {
      multiplier *= MOMENTUM.clutchMultiplier.keyMoment;
    }
    const direction = event.winner === 'player' ? 1 : -1;
    this.value = clamp(this.value + direction * base * multiplier);

    // 3. Break of serve — a takeover that lerps strongly toward the breaker.
    //    (Holds produce no game event; they simply keep momentum where it is.)
    if (event.game?.wasBreak) {
      const target =
        event.game.winner === 'player'
          ? MOMENTUM.breakOfServe.target
          : -MOMENTUM.breakOfServe.target;
      this.value = clamp(this.value + (target - this.value) * MOMENTUM.breakOfServe.takeover);
    }

    // 4. Set boundary — mostly reset, small tilt to the set winner.
    if (event.setWonBy) {
      const nudge = event.setWonBy === 'player' ? MOMENTUM.setWon.nudge : -MOMENTUM.setWon.nudge;
      this.value = clamp(this.value * MOMENTUM.setWon.damp + nudge);
    }

    // 5. Rhythm takes its step at every game end.
    if (event.game) this.stepRhythm();
  }

  private stepRhythm(): void {
    const { swing, reversion, focusDamping } = MOMENTUM.rhythm;
    if (swing <= 0) return;
    for (const side of ['player', 'opponent'] as const) {
      const steadiness = 1 - focusDamping * (this.focus[side] / 100);
      this.rhythm[side] += -reversion * this.rhythm[side] + swing * steadiness * normalish();
    }
  }
}
