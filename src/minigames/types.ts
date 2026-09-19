/**
 * The minigame contract.
 *
 * A minigame is a self-contained, scorable unit: it runs a small skill game and
 * reports how the player did, in its own units. It does not know why it was
 * played. Training reads the score as a support count; a story event will read it
 * against a pass line. The caller owns the meaning.
 *
 * Pure types, no React — so game logic (AnchorTrainingSystem) can name a minigame
 * without reaching into the component layer.
 */

/** Every minigame the game can launch. */
export type MinigameId =
  | 'toss_and_strike' // serve
  | 'rally_rhythm' // forehand
  | 'corner_paint' // backhand
  | 'read_return' // return
  | 'touch_slice' // net (reuses the touch minigame until a net-specific one exists)
  | 'fishing_cast'; // story-only: five casts at the fish, no tennis involved

/**
 * The shape of a run.
 *
 * Round count and score scale are independent: three pass/fail attempts is one
 * shape, and so is a single round in which the player lands several catches.
 * Each game declares its own natural defaults; a caller can override them.
 */
export interface MinigameConfig {
  /** Attempts the player gets. */
  rounds?: number;
  /** Per-attempt speed multipliers. The last entry repeats if rounds outruns it. */
  speedRamp?: number[];
  /** The scale the score is reported against. Defaults to `rounds`. */
  maxScore?: number;
}

/** What a completed run reports back. */
export interface MinigameScore {
  minigame: MinigameId;
  /** Raw score in this game's own units. */
  score: number;
  /**
   * The scale the score is out of. Today every game is three pass/fail attempts
   * worth a point each, so this is 3 — but it is not derivable from the attempt
   * count in general (a single round can be scored out of 100), which is why the
   * run reports it rather than the caller assuming it.
   */
  maxScore: number;
}

/** How a caller asks for a minigame. */
export interface MinigameRequest {
  minigame: MinigameId;
  /** Overrides the game's own defaults. Omit to play it as the game intends. */
  config?: MinigameConfig;
}

/** The props every minigame component takes. */
export interface MinigameProps {
  /** Called once all attempts resolve. */
  onComplete: (score: MinigameScore) => void;
  /** Fractional widening of the success window from EffectKey.MINIGAME_WINDOW_BONUS (0.10 = +10%). */
  windowBonus?: number;
  /** Called once, the moment the player commits their first attempt. */
  onFirstAttempt?: () => void;
  /** Overrides the game's default shape. */
  config?: MinigameConfig;
}
