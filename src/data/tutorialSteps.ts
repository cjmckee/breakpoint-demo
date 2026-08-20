import { TutorialStep } from '../hooks/useTutorialSpotlight';

export type LiveMatchTarget = 'court' | 'log' | 'your-stats';
export type KmTarget = 'header' | 'options-matchup' | 'options-effects';
export type KmResultTarget = 'outcome' | 'tactic' | 'effects';
export type MainMenuTarget = 'status' | 'stats' | 'actions' | 'challenges';

// Runs once on day 1. Week one has no matches and no shop, so the daily loop is
// all the player has — these steps say what a slot is worth, why Rest is not a
// substitute for Training, and where the week-one goal lives.
export const MAIN_MENU_TUTORIAL_STEPS: TutorialStep<MainMenuTarget>[] = [
  {
    target: 'status',
    title: 'Your Day',
    body: 'Each day has four timeslots: morning, afternoon, evening, and night. Each action, such as training or playing a match, takes up a timeslot. Story and relationship events may also take up timeslots. At night, the only action you can take is resting for 50 energy.',
  },
  {
    target: 'stats',
    title: 'Your stats',
    body: 'Your stats are broken down into 14 ratings ranging from 20 (beginner) to 100 (ATP pro). Every stat plays into your match play, but you should try to focus on improving your core stats. I mean, look at all those F ratings.'
  },
  {
    target: 'actions',
    title: 'Where to start',
    body: 'Training is a surefire way to improve your stats. As one of the newest members of the Academy, your stats are quite weak to begin with, so you\'ll need to focus most of your early timeslots on developing your skills. Resting during the morning, afternoon, or evening uses a timeslot and only recovers 20 energy, so try to only Rest in a pinch!',
  },
  {
    target: 'challenges',
    title: 'Challenges',
    body: 'Your goals live here — first up: six training sessions to help prepare yourself for the road ahead. Tap to track progress and claim rewards.',
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
