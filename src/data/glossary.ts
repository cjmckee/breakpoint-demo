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
    title: 'Scoring',
    entries: [
      { term: 'Love', definition: 'Zero points. "15-Love" means the server has 15 points and the receiver has 0.' },
      { term: 'Deuce', definition: 'When both players have 40 points. You must win by two clear points from deuce.' },
      { term: 'Advantage', definition: 'When you win the next point after deuce, you have the advantage. If you lose the next point, it goes back to deuce.' },
      { term: 'Game', definition: 'A series of points won by scoring 4 points (with a 2-point lead). Games make up sets.' },
      { term: 'Set', definition: 'A collection of games. Usually won by the first player to win 6 games (with a 2-game lead).' },
      { term: 'Match', definition: 'The full contest, consisting of one or more sets.' },
      { term: 'Tiebreak', definition: 'When a set reaches 6-6, a special scoring system decides the set. First to 7 points (with 2-point lead) wins the tiebreak and the set.' },
    ],
  },
  {
    title: 'Shot Types',
    entries: [
      { term: 'Forehand', definition: 'A shot hit with the palm facing forward, usually from the right side of the court for right-handed players.' },
      { term: 'Backhand', definition: 'A shot hit with the back of the hand facing forward. Can be one-handed or two-handed.' },
      { term: 'Serve', definition: "The shot that starts each point. The server tosses the ball and hits it into the opponent's service box." },
      { term: 'Volley', definition: 'A shot hit before the ball bounces, usually near the net.' },
      { term: 'Lob', definition: 'A high, arcing shot aimed over the opponent\'s head, useful for passing net players.' },
      { term: 'Drop Shot', definition: 'A soft, short shot that just clears the net and lands near it, forcing opponents to rush forward.' },
      { term: 'Slice', definition: 'A shot hit with backspin, causing the ball to stay low and skid after bouncing.' },
      { term: 'Topspin', definition: 'Forward spin on the ball that makes it dip down faster and bounce higher.' },
      { term: 'Overhead Smash', definition: 'A powerful volley hit overhead, typically when the ball is high in the air.' },
      { term: 'Return', definition: 'The shot hit by the receiver in response to the serve.' },
    ],
  },
  {
    title: 'Court & Positions',
    entries: [
      { term: 'Baseline', definition: 'The line at each end of the court. Most baseline play happens behind these lines.' },
      { term: 'Net', definition: "The barrier in the middle of the court. Players score by hitting shots the opponent cannot return." },
      { term: 'Service Box', definition: 'The area where the serve must land. There are two service boxes on each side.' },
      { term: 'Court Surface', definition: 'The material the court is made of. Different surfaces (hard, clay, grass) affect ball bounce and speed.' },
    ],
  },
  {
    title: 'Special Terms',
    entries: [
      { term: 'Ace', definition: "A serve that the opponent cannot touch, resulting in a direct point." },
      { term: 'Double Fault', definition: 'Two consecutive failed serves, resulting in the loss of the point.' },
      { term: 'Break Point', definition: 'When the receiver can win the game with the next point (server is at 30-40 or advantage receiver).' },
      { term: 'Break of Serve', definition: 'When the receiver wins a game while the opponent was serving.' },
      { term: 'Rally', definition: 'An exchange of shots between players, starting after the serve and ending when one player wins the point.' },
      { term: 'Unforced Error', definition: 'A mistake made without pressure from the opponent.' },
      { term: 'Forced Error', definition: 'A mistake caused by good play from the opponent.' },
      { term: 'Winner', definition: 'A shot that the opponent cannot reach or return.' },
    ],
  },
];

export const STATS_GUIDE: GlossarySection[] = [
  {
    title: 'Core Stats',
    entries: [
      { term: 'Serve', definition: 'Your ability to hit powerful, accurate serves. Higher serve means more aces and easier holds.' },
      { term: 'Forehand', definition: 'Power and control on your forehand side. The foundation of most players\' games.' },
      { term: 'Backhand', definition: 'Power and control on your backhand side. Essential for returning shots on the opposite side.' },
      { term: 'Return', definition: 'Your ability to return serves effectively. Affects how well you break opponent serves.' },
      { term: 'Slice', definition: 'Your ability to hit slice shots with backspin. Useful for keeping points low and changing rhythm.' },
    ],
  },
  {
    title: 'Technical Stats',
    entries: [
      { term: 'Volley', definition: 'Skill at hitting volleys near the net. Important for serve-and-volley and net play styles.' },
      { term: 'Overhead', definition: 'Ability to execute overhead smashes. Critical for converting high balls into points.' },
      { term: 'Drop Shot', definition: 'Skill at hitting effective drop shots. Useful for passing aggressive net players.' },
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
      { term: 'Agility', definition: 'How well you change direction and move efficiently. Affects court coverage and recovery.' },
      { term: 'Recovery', definition: 'How quickly you recover between points. Higher recovery means consistent play throughout.' },
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
    ],
  },
];
