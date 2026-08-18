import { TutorialStep } from '../hooks/useTutorialSpotlight';

export type LiveMatchTarget = 'court' | 'log' | 'your-stats';
export type KmTarget = 'header' | 'options-matchup' | 'options-effects';
export type KmResultTarget = 'outcome' | 'tactic' | 'effects';
export type MainMenuTarget = 'status' | 'actions' | 'challenges';

// Runs once on day 1. Week one has no matches and no shop, so the daily loop is
// all the player has — these steps say what a slot is worth, why Rest is not a
// substitute for Training, and where the week-one goal lives.
export const MAIN_MENU_TUTORIAL_STEPS: TutorialStep<MainMenuTarget>[] = [
  {
    target: 'status',
    title: 'Your Day',
    body: 'A day is four time slots — morning, afternoon, evening, night — and almost everything you do costs one. Energy ⚡ is the second budget: you start each day near full, and a training session spends 20 of it. Tap the 📅 any time to see what is coming up.',
  },
  {
    target: 'actions',
    title: 'Where Your Time Goes',
    body: 'Training is the one that makes you better — every session is a guaranteed +1 to a core stat, plus bonus stats if you play the drill well. Rest only refills energy and still burns a slot, so save it for when you are genuinely low. At night, Sleep is the move: it rolls you into the next day and restores far more.',
  },
  {
    target: 'challenges',
    title: 'Your Goals',
    body: 'Goals live here, and you already have your first: six training sessions before your Day 5 assessment match. Open this strip any time to check your progress and claim rewards — finishing it pays out stats and XP.',
  },
];

// Court is shown LAST so the player is looking at it when they click "Let's Play!"
export const LIVE_MATCH_TUTORIAL_STEPS: TutorialStep<LiveMatchTarget>[] = [
  {
    target: 'court',
    title: 'The Court',
    body: 'This shows the live set and game scores, with a dot on whoever is serving. Below it: the momentum bar (green = your favour, red = theirs) and a stamina tank for each player. Watch the court and the pop-up toasts for the big moments.',
  },
  {
    target: 'your-stats',
    title: 'Live Stats',
    body: 'Both players\' stats side by side, with the leader on each row highlighted. When a stat changes the row flashes — green when it is good for you, red when it is not.',
  },
  {
    target: 'log',
    title: 'Commentary',
    body: 'A running, plain-language call of every point — aces, winners, errors, and long rallies. It is a compact ticker; the newest line sits at the bottom.',
  },
];

export const KM_TUTORIAL_STEPS: TutorialStep<KmTarget>[] = [
  {
    target: 'header',
    title: 'The Situation',
    body: 'The type of key moment, your opponent\'s archetype, and any modifiers — momentum, pressure and energy that nudge your odds this point. Consider their archetype and attack the weakness!',
  },
  {
    target: 'options-matchup',
    title: 'The Advantage Chip',
    body: 'Hover a tactic (we\'ve opened the first one) to see the full matchup: what it beats, what beats it, and the exact ratings with the stats that drive them. They all affect the outcome!',
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
