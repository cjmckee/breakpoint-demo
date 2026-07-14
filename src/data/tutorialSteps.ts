import { TutorialStep } from '../hooks/useTutorialSpotlight';

export type LiveMatchTarget = 'court' | 'log' | 'your-stats';
export type KmTarget = 'header' | 'options-matchup' | 'options-effects';
export type KmResultTarget = 'outcome' | 'tactic' | 'effects';

// Court is shown LAST so the player is looking at it when they click "Let's Play!"
export const LIVE_MATCH_TUTORIAL_STEPS: TutorialStep<LiveMatchTarget>[] = [
  {
    target: 'log',
    title: 'Commentary',
    body: 'A running, plain-language call of every point — aces, winners, errors, and long rallies. It is a compact ticker; the newest line sits at the bottom.',
  },
  {
    target: 'your-stats',
    title: 'Live Stats',
    body: 'Both players\' stats side by side, with the leader on each row highlighted. When a stat changes the row flashes — green when it is good for you, red when it is not.',
  },
  {
    target: 'court',
    title: 'The Cockpit',
    body: 'The big number is the live point score, with a dot on whoever is serving. Below it: the momentum tug-of-war (green = your favour, red = theirs) and a stamina tank for each player. Watch the court and the pop-up toasts for the big moments. Good luck!',
  },
];

export const KM_TUTORIAL_STEPS: TutorialStep<KmTarget>[] = [
  {
    target: 'header',
    title: 'The Situation',
    body: 'The type of key moment, your opponent\'s archetype, and a "how this moment tilts" strip — momentum, pressure and energy that nudge your odds this point. Consider their archetype and attack the weakness!',
  },
  {
    target: 'options-matchup',
    title: 'The Advantage Chip',
    body: 'Each tactic shows an advantage chip: green if your stats favour it, yellow for even, red if theirs do — deeper colour means a bigger gap. Hover a tactic (we\'ve opened the first one) to see the full matchup: what it beats, what beats it, and the exact ratings with the priority stat that drives them.',
  },
  {
    target: 'options-effects',
    title: 'Secondary Effects',
    body: 'Each tactic also carries effects that apply win or loss — momentum, energy, mood, pressure. Green helps you, red hurts (a drop in pressure is good, so it shows green). Pick the tactic that best counters their style — nothing is guaranteed!',
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
    title: 'Your Tactic',
    body: 'Your chosen tactic is shown here along with whether it countered their style (🎯) or played into their strengths (⚠️). Countering their playstyles improves your odds, but stats can still greatly impact your chances of success.',
  },
  {
    target: 'effects',
    title: 'Effects Applied',
    body: 'Win or lose, your tactic\'s secondary effects still apply — momentum swings, energy changes, mood and pressure shifts carry into the rest of the match. Critical success and critical failure double the effects!',
  },
];
