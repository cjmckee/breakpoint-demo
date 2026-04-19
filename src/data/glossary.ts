/**
 * Glossary Data
 * Tennis terminology and stat explanations for the in-game help system
 */

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface GlossarySection {
  title: string;
  entries: GlossaryEntry[];
}

export const TENNIS_TERMS: GlossarySection[] = [
  {
    title: 'Shot Types',
    entries: [
      { term: 'Forehand', definition: 'A shot hit with the dominant arm. This is typically a player\'s best shot. Hits balls on the right side of the court for right-handed players.' },
      { term: 'Backhand', definition: 'A shot hit with the non-dominant arm, usually utilizing more leg power. Can be one-handed or two-handed. Hits balls on the left side of the court for right-handed players.' },
      { term: 'Serve', definition: "Every point begins with a serve. The server will stand behind the baseline, toss the ball, and hit it into the service box cross-court from them. A player gets two serves each point, so typically one is more focused on offense and one is more focused on consistency." },
      { term: 'Return', definition: 'The shot hit when returning a serve. On first serve returns, typically players block a fast serve and try to neutralize the advantage. On second serve returns, players have a bit more freedom to attack and get on offense.' },
      { term: 'Volley', definition: 'A shot hit out of the air, typically at the net. Getting closer to the net improves your angles and simplifies the shots, typically resulting in higher success when players get to the net successfully.' },
      { term: 'Lob', definition: 'A high, arcing shot aimed over the opponent\'s head, useful for passing net players. This is typically a defensive shot, but many players struggle to return it well, and it can quickly turn into an offensive opportunity.' },
      { term: 'Drop Shot', definition: 'A soft, short shot that barely clears the net, usually with a lot of spin. It forces the opponent to rush forward, and if you catch them out of position, it can be an offensive weapon for defenders.' },
      { term: 'Slice', definition: 'A shot hit with backspin, and is usually considered a defensive shot. However, it usually provides increased control, so players with good placement can utilize slices as a weapon.' },
      { term: 'Topspin', definition: 'A typical "tennis shot." This is the basic type of shot. Forward spin on the ball that makes it dip down faster and bounce higher.' },
      { term: 'Overhead Smash', definition: 'A powerful overhead swing, used to put away shots in the air. They can be difficult to master, but closing out net points is much easier with strong overheads.' },
    ],
  },
  {
    title: 'Court & Positions',
    entries: [
      { term: 'Cross-court', definition: 'Hitting from one side of the lengthwise center line to the other. From the player\'s perspective, the player will start on the right side of the court, and my opponent will start on the left.'},
      { term: 'Baseline', definition: 'The line at each end of the court. Most regular play happens at or behind these lines. This is referred to as "baseline play."' },
      { term: 'Net', definition: "In between the two sides of the court. Volleys are typically hit close to the net to get better angles." },
      { term: 'Service Box', definition: 'The boxes just beyond the net. A serve must land in the box cross-court from the server.' },
      { term: 'Court Surface', definition: 'The material the court is made of. Different surfaces (hard, clay, grass) affect ball bounce and speed.' },
    ],
  },
  {
    title: 'Special Terms',
    entries: [
      { term: 'Ace', definition: "A serve that lands in and the opponent fails to touch. This requires the server to hit with speed and precision." },
      { term: 'Double Fault', definition: 'A missed serve is called a \'fault\'. Players get two serves on each point. Failing both serves results in losing the point.' },
      { term: 'Break Point', definition: 'When the player is not serving, but has the chance to win the game. As players improve and serves become stronger, this becomes harder and harder to do. Break points usually decide matches.' },
      { term: 'Hold of Serve', definition: 'When a player wins the game they were serving. The server has the advantage when the point begins, so having a strong serve is always helpful.'},
      { term: 'Break of Serve', definition: 'When the receiver wins a game while the opponent was serving. Since players at the top level almost always hold serve, a match score is sometimes measured in this, referring to being "up a break" or "up two breaks."' },
      { term: 'Rally', definition: 'An exchange of shots between players, starting after the serve and ending when one player wins the point. Many people confuse this with "volley," which is to hit the ball out of the air.' },
      { term: 'Unforced Error', definition: 'A mistake made without pressure from the opponent. Sometimes going for an offensive shot can end in a mistake. Sometimes you just miss. Happens to the pros, too.' },
      { term: 'Forced Error', definition: 'A mistake caused by good play from the opponent. Someone hitting a strong ball where the player needs to stretch and hit a defensive shot would qualify. The player was forced into a more difficult position and that caused them to miss.' },
      { term: 'Winner', definition: 'A shot that the opponent cannot reach or return. Like aces, this usually requires a combination of power and precision. However, clever players can take advantage of angles or court positioning to hit winners, as well.' },
    ],
  },
];

export const STATS_GUIDE: GlossarySection[] = [
  {
    title: 'Core Stats - Most Important',
    entries: [
      { term: 'Serve', definition: 'Your ability to hit powerful, accurate serves. Higher serve means more aces and easier holds.' },
      { term: 'Forehand', definition: 'Power and control on your forehand side. The foundation of most players\' games. Offensive players are typically defined by a strong forehand.' },
      { term: 'Backhand', definition: 'Power and control on your backhand side. Essential for continuing rallies, and some players even prefer it to their forehand.' },
      { term: 'Return', definition: 'Your ability to return serves effectively. Affects how well you break opponent serves.' },
      { term: 'Slice', definition: 'Your ability to hit slice shots with backspin. Useful for defense and extending rallies to force mistakes from opponents. A pusher\'s best weapon.' },
    ],
  },
  {
    title: 'Technical Stats',
    entries: [
      { term: 'Volley', definition: 'Skill at hitting volleys near the net. Important for serve-and-volley and net play styles.' },
      { term: 'Overhead', definition: 'Ability to execute overhead smashes. Critical for converting high balls into points.' },
      { term: 'Drop Shot', definition: 'Skill at hitting effective drop shots. Used to punish poor positioning or slow opponents, it causes them to rush forward to keep up.' },
      { term: 'Spin', definition: 'Your ability to generate and control spin. More spin means better control and trickier shots.' },
      { term: 'Placement', definition: 'Your ability to hit shots to specific targets. Better placement creates angles and winners.' },
    ],
  },
  {
    title: 'Physical Stats',
    entries: [
      { term: 'Speed', definition: 'How quickly you move around the court. Affects your ability to reach shots and get into position.' },
      { term: 'Stamina', definition: 'Your endurance during long matches. Higher stamina means you play better in the later stages.' },
      { term: 'Strength', definition: 'Raw power in your shots. Contributes to serve speed and shot pace.' },
      { term: 'Agility', definition: 'How well you change direction and move efficiently. Affects court coverage and positioning.' },
      { term: 'Recovery', definition: 'How quickly you recover between points. Higher recovery means recovering from fatigue more quickly in a match.' },
    ],
  },
  {
    title: 'Mental Stats',
    entries: [
      { term: 'Focus', definition: 'Your concentration during crucial moments. Higher focus improves clutch performance.' },
      { term: 'Anticipation', definition: 'Your ability to read opponents and predict shots. Helps with positioning and reactions.' },
      { term: 'Shot Variety', definition: 'Your ability to mix up shots effectively. Keeps opponents off-balance.' },
      { term: 'Offensive', definition: 'Your aggressive play ability. Higher offensive rating improves your ability to attack and finish points.' },
      { term: 'Defensive', definition: 'Your defensive skills. Higher defensive rating helps you retrieve shots and extend rallies.' },
    ],
  },
];

export const SURFACE_GUIDE: GlossarySection[] = [
  {
    title: 'Court Surfaces',
    entries: [
      { term: 'Hard Court', definition: 'Fast, consistent bounce. Balance of power and control. Most common professional surface.' },
      { term: 'Clay Court', definition: 'Slower surface with higher bounce. Rewards endurance and defensive play. European/South American favorite.' },
      { term: 'Grass Court', definition: 'Fastest surface with low bounce. Traditional Wimbledon surface. Rewards serve-and-volley.' },
      { term: 'Carpet', definition: 'Bounces are less consistent in favor of flexibility of putting up these courts in non-traditional venues. Players treat it similar to grass.'}
    ],
  },
];

export const KEY_SHORTCUTS_GUIDE: GlossarySection[] = [
  {
    title: 'Navigation',
    entries: [
      { term: 'Enter / Space', definition: 'Dismiss match results, story event results, and training result overlays.' },
      { term: 'T', definition: 'Open / close the Training screen. Press T on the hub to go to training, press T again to return.' },
      { term: 'M', definition: 'Open / close the Match Setup screen. Only available once matches are unlocked.' },
      { term: 'I', definition: 'Open / close your Inventory.' },
      { term: 'R', definition: 'Open / close the Relationships screen.' },
      { term: 'S', definition: 'Open / close the Shop. Only available once the shop is unlocked.' },
      { term: 'C', definition: 'Open / close the Calendar.' },
      { term: 'Escape', definition: 'Open / close the Main Menu.' },
    ],
  },
];

export const SCORING_GUIDE: GlossarySection[] = [
  {
    title: 'Game Scoring',
    entries: [
      { term: 'Love', definition: 'Zero points. "Love all" means 0-0. "15-Love" means the server has 15 points and the receiver has 0.' },
      { term: 'Basic Scoring', definition: 'The score goes: Love-15-30-40. Don\'t ask me why. You win the game by winning when you have 40 points.' },
      { term: 'Deuce', definition: 'When the score reaches 40-40, or "40 all." You must win by two points from deuce. Winning at deuce puts you at advantage.' },
      { term: 'Advantage', definition: 'Always from the server\'s perspective, the winner of deuce has "Ad-in," and the loser has "Ad-out." If you serve and win at deuce, the score is "Ad-in" for you.' },
    ],
  },
  {
    title: 'Set & Match Scoring',
    entries: [
      { term: 'Games', definition: 'Each game is worth 1 point toward the set. See above for individual game scoring.' },
      { term: 'Sets', definition: 'A set is won by being the first to 6 games, win by 2. Sets can continue until 6-5, after which the set either ends at 7-5 or the set moves to 6-6, and a 7-point tiebreak is played to determine the winner.' },
      { term: 'Tiebreaks', definition: 'If a set is tied at 6-6, a 7-point tiebreak is played. A player must reach 7 points, win by 2. The tiebreak continues until one player wins by 2 points, and often can end with scores of 12-10 or more.'},
      { term: 'Match Score', definition: 'A full potential match score: 6-3, 4-6, 7-6 (5) - indicates the player won the first set 6-3, lost the second set 4-6, and won the third set in a tiebreak (set score of 6-6) with a tiebreak score of 7-5. Yes, it\'s annoying.' },
    ],
  },
  {
    title: 'Tiebreaks',
    entries: [
      { term: 'When', definition: 'A tiebreak is played when the set score reaches 6-6.' },
      { term: 'How', definition: 'First to 7 points (with a 2-point lead) wins the tiebreak and the set at 7-6. The loser\'s score is indicated in parentheses, so winning 7-4 would give a set score of 7-6 (4).' },
      { term: 'Scoring', definition: 'Tiebreak points are counted as 1, 2, 3, etc. (not 15, 30, 40).' },
      { term: 'Serving', definition: 'In a tiebreak, one player serves first, and then players alternate every two serves for the rest of the tiebreak.' },
    ],
  },
  {
    title: 'Match Format',
    entries: [
      { term: 'Best of 1', definition: 'First to win one set wins the match. Used in some tournaments and our practice matches.' },
      { term: 'Best of 3', definition: 'First to win two sets wins the match. If tied 1-1, a third set is played.' },
    ],
  },
];
