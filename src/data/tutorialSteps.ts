import { TutorialStep } from '../hooks/useTutorialSpotlight';

export type LiveMatchTarget = 'court' | 'log' | 'your-stats';
export type KmTarget = 'header' | 'options-matchup' | 'options-effects';
export type KmResultTarget = 'outcome' | 'tactic' | 'effects';

// Court is shown LAST so the player is looking at it when they click "Let's Play!"
export const LIVE_MATCH_TUTORIAL_STEPS: TutorialStep<LiveMatchTarget>[] = [
  {
    target: 'log',
    title: 'Match Log',
    body: 'Every point is narrated here in real time — aces, winners, errors, and rallies. Scroll up to review earlier points.',
  },
  {
    target: 'your-stats',
    title: 'Your Stats',
    body: 'Aces, winners, double faults, and errors update as the match progresses. Keep an eye on these to gauge how you are playing.',
  },
  {
    target: 'court',
    title: 'The Court',
    body: 'The court shows the live score, who is serving, the momentum bar (green = your favor, red = theirs), and your stamina. The match is about to begin — good luck!',
  },
];

export const KM_TUTORIAL_STEPS: TutorialStep<KmTarget>[] = [
  {
    target: 'header',
    title: 'The Situation',
    body: 'This shows the type of key moment, your opponent\'s playing style, and current conditions like momentum and energy that affect your odds. Always consider your opponent\'s archetype and attack their weakness!',
  },
  {
    target: 'options-matchup',
    title: 'Matchup Indicator',
    body: '"you X > Y them" shows your weighted stats vs. theirs for this tactic — > means you have the edge, < means they do, and more symbols (>>, >>>) mean a bigger gap. Each option uses different stats, so the matchup shifts per choice!',
  },
  {
    target: 'options-effects',
    title: 'Secondary Effects',
    body: 'Each tactic carries bonuses that apply win or loss — momentum swings, energy shifts, mood changes. Pick the tactic that best counters their style, but nothing is guaranteed!',
  },
];

export const KM_RESULT_STEPS: TutorialStep<KmResultTarget>[] = [
  {
    target: 'outcome',
    title: 'The Result',
    body: 'The point result is shown here: win or lose. Critical outcomes (🌟 / 💥) mean your tactic landed perfectly — or backfired spectacularly. You can pick the right option and still lose! That\'s tennis, baby.',
  },
  {
    target: 'tactic',
    title: 'Matchup Indicator',
    body: 'Your chosen tactic is shown here along with whether it countered their style (🎯) or played into their strengths (⚠️). Countering their playstyles improves your odds, but stats can still greatly impact your chances of success.',
  },
  {
    target: 'effects',
    title: 'Effects Applied',
    body: 'Win or lose, your tactic\'s secondary effects still apply — momentum swings, energy changes, mood and pressure shifts carry into the rest of the match. Critical success and critical failure double the effects!',
  },
];
