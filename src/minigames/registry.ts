/**
 * The id -> component map every consumer launches a minigame through.
 *
 * This lived inline in AnchorTraining.tsx, which made the training screen the
 * owner of what a minigame is. Anything that wants to run one — a training
 * session, a story event — looks it up here.
 */

import type React from 'react';
import type { MinigameId, MinigameProps } from './types';
import { ServeMinigame } from '../components/training/ServeMinigame';
import { RallyRhythmMinigame } from '../components/training/RallyRhythmMinigame';
import { CornerPainterMinigame } from '../components/training/CornerPainterMinigame';
import { ReadReturnMinigame } from '../components/training/ReadReturnMinigame';
import { TouchSliceMinigame } from '../components/training/TouchSliceMinigame';

export const MINIGAMES: Record<MinigameId, React.FC<MinigameProps>> = {
  toss_and_strike: ServeMinigame,
  rally_rhythm: RallyRhythmMinigame,
  corner_paint: CornerPainterMinigame,
  read_return: ReadReturnMinigame,
  touch_slice: TouchSliceMinigame,
};
