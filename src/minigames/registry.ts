/**
 * The id -> component map every consumer launches a minigame through.
 *
 * This lived inline in AnchorTraining.tsx, which made the training screen the
 * owner of what a minigame is. Anything that wants to run one — a training
 * session, a story event — looks it up here.
 */

import type React from 'react';
import type { MinigameId, MinigameProps } from './types';
import { ServeMinigame } from './games/ServeMinigame';
import { RallyRhythmMinigame } from './games/RallyRhythmMinigame';
import { CornerPainterMinigame } from './games/CornerPainterMinigame';
import { ReadReturnMinigame } from './games/ReadReturnMinigame';
import { TouchSliceMinigame } from './games/TouchSliceMinigame';
import { FishingCastMinigame } from './games/FishingCastMinigame';

export const MINIGAMES: Record<MinigameId, React.FC<MinigameProps>> = {
  toss_and_strike: ServeMinigame,
  rally_rhythm: RallyRhythmMinigame,
  corner_paint: CornerPainterMinigame,
  read_return: ReadReturnMinigame,
  touch_slice: TouchSliceMinigame,
  fishing_cast: FishingCastMinigame,
};
