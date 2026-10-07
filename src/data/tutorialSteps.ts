import { TutorialStep } from '../hooks/useTutorialSpotlight';

export type LiveMatchTarget = 'court' | 'log' | 'your-stats';
export type KmTarget =
  'header' | 'options-posture' | 'options-stats' | 'options-matchup' | 'options-effects';
export type KmResultTarget = 'outcome' | 'tactic' | 'effects';
export type MainMenuTarget = 'status' | 'stats' | 'actions' | 'develop' | 'challenges';

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
    body: 'Your stats are broken down into 14 ratings ranging from 20 (beginner) to 100 (ATP pro). Every stat plays into your match play, but you should try to focus on improving your core stats. I mean, look at all those F ratings.',
  },
  {
    target: 'actions',
    title: 'Where to start',
    body: "Training is how you get better. Each session pays training currency — Power, Quickness, Technique and Mind — and each shot pays its own mix. As one of the newest members of the Academy, your stats are quite weak to begin with, so you'll need to focus most of your early timeslots on training. Resting during the morning, afternoon, or evening uses a timeslot and only recovers 20 energy, so try to only Rest in a pinch!",
  },
  {
    target: 'develop',
    title: 'Spend it here',
    body: 'Develop is where currency becomes stats. Every stat has a recipe — a serve point costs mostly Power, a focus point costs Mind — and points get pricier as a stat climbs past 40, 60 and 80. Will you focus on only a few stats, or will you spread out your skills and become well-rounded?',
  },
  {
    target: 'challenges',
    title: 'Challenges',
    body: 'Your goals live here — first up: eight training sessions to help prepare yourself for the road ahead. Tap to track progress and claim rewards.',
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
    body: "Both players' stats side by side, with the leader on each row highlighted. When a stat changes the row flashes — green when it is good for you, red when it is not.",
  },
  {
    target: 'log',
    title: 'Commentary',
    body: 'A running, plain-language call of every point — aces, winners, errors, and long rallies. It is a compact ticker; the newest line sits at the bottom.',
  },
];

export const KM_TUTORIAL_STEPS: TutorialStep<KmTarget>[] = [
  // Opens on the header, which is already showing the banner ("Break Point For You
  // - 30-40") this step is naming. Nothing else in the game teaches tennis scoring,
  // and the whole key moment layer assumes you know which points are worth stopping
  // for — so name the three you will actually see before asking anyone to play one.
  {
    target: 'header',
    title: 'What Is a Key Moment?',
    body: "Most points play themselves — the match only stops for the ones that can swing a game. A key rally or a break point (winning the game on the opponent's serve) will bring up a special set of options for the player.",
  },
  {
    target: 'header',
    title: 'The Situation',
    body: "What is on the line, and who you are facing. Every opponent plays to an archetype — some thrive on offense, some play the net, and some love to extend rallies. You'll want to keep this in mind mid-match. Below that, the conditions affecting this point: momentum, energy, mood, and the pressure of the moment tested against your focus.",
  },
  {
    target: 'options-posture',
    title: 'Postures',
    body: "Every tactic is one of six postures — Power, Net, Neutralize, Deception, Attrition, Variety — each with its own colour. Selecting a posture that matches up well against your opponent's archetype will boost your chances of success. The diamonds beside it are risk: Safe, Balanced or Bold. Risk is how big the swing is, not how likely you are to win — a Bold tactic does not succeed more often, it succeeds and fails harder.",
  },
  {
    target: 'options-stats',
    title: 'The Numbers',
    body: 'Your stats also play into selecting the best option! See how well your stats suit that tactic, in green, against how well theirs defend against it, in red. The ★ stat is the one that counts most, and the smaller chips support it. Better stats help your odds, but anything can happen!',
  },
  {
    target: 'options-matchup',
    title: 'Reading the Matchup',
    body: 'Each posture says who it beats and who beats it, in plain words rather than by naming an archetype — "retrievers who sit back", "players who feed off your pace". Match those against the opponent in the header yourself. Pick the option that fits best against your opponent!',
  },
  {
    target: 'options-effects',
    title: 'Secondary Effects',
    body: 'Each tactic also carries effects that land win or lose — momentum, energy, mood, pressure. Green helps you, red hurts (a drop in pressure is good, so it shows green). Bolder tactics cost more energy and swing momentum harder in both directions.',
  },
];

export const KM_RESULT_STEPS: TutorialStep<KmResultTarget>[] = [
  {
    target: 'outcome',
    title: 'The Result',
    body: "Whether you won the point. A critical (🌟 / 💥) says the point ended emphatically — how often that happens is set by your tactic's risk, so a Bold play criticals far more often in both directions than a Safe one. You can pick the right option and still lose. That's tennis, baby.",
  },
  {
    target: 'tactic',
    title: 'Your Read',
    body: "What you played, and how that posture matches up against this archetype. Remember the color for each posture and how it matches up against your opponent's archetype. You may not see this exact option again, but you may want to select one of the same color later on!",
  },
  {
    target: 'effects',
    title: 'Effects Applied',
    body: "Win or lose, your tactic's secondary effects still apply — momentum swings, energy changes, mood and pressure shifts carry into the rest of the match. A critical result scales the outcomes based on the risk level. Also, you can view this tutorial any time in the settings menu by clicking 'Replay Match Tutorial'. Good luck!",
  },
];
