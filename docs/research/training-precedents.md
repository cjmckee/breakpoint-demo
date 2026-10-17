# How other games handle training

Research behind `proposals/training-revamp.md`, October 2026. Three questions: how MLB Power
Pros' Success mode (the game Breakpoint is closest to) handles training, how other sports and
raising sims do, and what our own training looks like by the numbers. Facts from fetched sources
carry their links; impressions are marked as such. Several English Power Pros sources sit behind
bot checks, so its numbers come mostly from Japanese guides to Pawapuro 2018-2022 and the app,
and vary by entry.

## Power Pros / Pawapuro, Success mode

**Points.** Five experience currencies: muscle, agility, technique, breaking ball (pitchers),
mind. Every stat costs a fixed mix of two or three, flat within a band of ten and steeper band
by band (app Contact: 1/4/3 muscle/technique/mind per +1 at 10-19, 5/20/15 at 90-99, 15/60/45
past 100). That is our model: four currencies, recipes, price steps.
([cost table](https://www.arimurasaji.xyz/entry/2017/11/18/115510),
[2022 budgets](https://note.com/yuki_kashi/n/ndc0ec5ae573f))

**The practice menu is fixed, and pays one main currency plus minors.** Pawapuro 2018:

| practice | stamina | pays (muscle / agility / technique / mind) |
| -------- | ------- | ------------------------------------------ |
| Batting  | −25     | 10 / – / 16 / 6                            |
| Strength | −30     | 26 / – / – / 10                            |
| Running  | −25     | 6 / 20 / – / –                             |
| Arm      | −25     | 6 / 10 / 10 / –                            |
| Defense  | −23     | – / 10 / 16 / 10                           |
| Mental   | **+10** | – / – / 6 / 26                             |

The Mental practice recovers stamina instead of costing it: a soft rest that still pays.
Practices level up with use (+10% a level in 2018), at a rising stamina cost in some entries.
([game8](https://game8.jp/pawapuro2018/213155))

**Variety comes from who turns up, not from the menu.** Teammates appear on practices each
turn; training with them pays a bonus ("tag practice"), more at a high bond, and a "!" teammate
teaches a hint that discounts an ability (to 50% at hint level 2, 20% at 5). Motivation scales
gains ±10-20%. The screen shows an injury % that rises as stamina falls; guides say rest at
double digits. Each scenario reinvents the loop (camps, fever gauges, captain slots).
([Famitsu](https://www.famitsu.com/news/202204/21258779.html),
[app formula](https://gamerch.com/pawapuroapuri/531243))

**Practice is a menu pick, not a skill test.** MLB Power Pros 2008 resolves a practice with a
five-card flip (all OK: level up; all XX: injury), tilted by stamina. Skill lives in the
matches, which pay more for winning and on harder difficulty.
([MLBPP wiki](https://www.mlbppworld.com/wiki/index.php?title=Practice_2008))

**Budget.** One estimate for a strong Pawapuro 2022 player: about half the points from practice,
the rest from matches, events and gambles. Our split is similar: 60% training.

**What players say** (impressions): short replayable runs, choices that radically alter the
build, the juggle of practice, rest and relationships. Complaints: layered randomness and
injury save-scumming.

## Umamusume: Pretty Derby

Pawapuro's descendant. Five trainings each turn (Speed, Stamina, Power, Guts, Wit), each paying
a main stat plus secondaries; Wit costs no energy and restores a little. **Every support card
in the deck lands on one training at random each turn** (or sits out), shown before you pick, so
the same five buttons pose a new "which stack is best today?" question. A card with a full bond
on its own training makes it a rainbow "friendship training". Each option shows a failure %;
mood scales gains ±20%. Praised as a deep decision loop; the complaint is randomness piling up.
([uma.guide](https://uma.guide/guides/support-cards),
[career mode](https://umamusu.wiki/Game:Career_Mode))

## Tennis and sports games

- **Mario Tennis: Power Tour (GBA).** Training minigames sit in a menu: EXP games (Wall Practice,
  Tennis Machine, four levels each) and Power Shot games tied to categories (Muscle, Speed,
  Spin...), each with fixed-payout levels and a score-based challenge level, unlocked by beating
  named opponents. Critics liked the games but found the mode "bland between matches".
  ([MarioWiki](https://www.mariowiki.com/Mario_Tennis:_Power_Tour))
- **Mario Tennis (GBC).** XP from drills and matches into four abilities; neglected abilities
  decay. Praised pacing, "extremely repetitive" once solved.
  ([MarioWiki](<https://www.mariowiki.com/Mario_Tennis_(Game_Boy_Color)>))
- **Virtua Tennis 3.** Each week: a training game, a match or a tournament. Training games are
  wacky skill games (bowling, darts, curling) that list the attributes they train, with
  difficulty levels 1-6. A stamina bar, and injury if it runs out.
  ([Pocket Gamer](https://www.pocketgamer.com/virtua-tennis-3/review/))
- **Virtua Tennis 4.** World Tour became a card-driven board game. Complaints: card luck makes
  you miss training, and minigames are boring "after about ten plays".
  ([SEGAbits](https://segabits.com/blog/2011/07/22/review-virtua-tennis-4-ps3/))
- **Top Spin 4 / TopSpin 2K25.** Coaches (bronze/silver/gold) set objectives that unlock boosts;
  2K25 offers one training minigame a month, fatigue and long injuries. Complaints: slow XP, no
  reward for quality play. ([Shacknews](https://www.shacknews.com/article/139582/topspin-2k25-review-top-spin))
- **Golf Story / Sports Story.** Points from quests, not training. Sports Story's reviewers
  couldn't "get any feel for how much" level-ups helped.
  ([Game Informer](https://www.gameinformer.com/review/sports-story/a-series-of-unforced-errors))
- **Punch Club.** Gym machines over a day of hours; low mood halves gains. Daily stat decay is
  its most criticised feature. ([wiki](https://punchclub.wiki.gg/wiki/Training))

## Raising sims

- **Princess Maker 2.** Three blocks a month from ~10 classes and jobs; classes rank up with
  repetition, some lower another stat; stress makes her ill.
  ([walkthrough](https://www.arrpeegeez.com/2023/12/princess-maker-2-walkthrough-school.html))
- **Tokimeki Memorial.** One of 12 commands a week, each day rolling success or failure.
- **Persona 5.** Day modifiers (rain, weekdays) change the best place to raise a social stat.
- **Stardew Valley.** Daily luck is rolled at dawn and announced on TV before you choose.

## Our own training, measured

From an audit of the code and `careerSim LEDGER=1 RUNS=20 DAYS=40` (four identities):

- **Training is 69% of all slots** (2.08 sessions a day) and 60% of income. A day earns about
  32 units; a session averages 9.3 (3 units, plus 3 per clean rep: Quick Sim 6, perfect 12).
- **The same five cards every day.** The baseliner plays Rally Rhythm on 54% of sessions; the
  net rusher never trains forehand or backhand.
- **Quickness is hard to steer.** Only Return pays it as the main currency. Yet builds that
  don't want Quickness or Mind end Club with 13-23% of them unspent, because matches and story
  pay every currency.
- **The screen still says a shot trains a stat**: the pentagon and each card show core stats
  that training no longer moves, and "Train Net" pays Technique and Mind while the net stat costs
  Quickness and Technique.
- **Six minigames exist.** Five are training's (one a placeholder reused for net); fishing is
  story-only.

## What the precedents agree on

1. A small, stable menu (about five options) where each pays one main currency plus a little
   of others, so any currency can be steered.
2. Daily variety from an overlay (who shows up, day modifiers), shown before you choose, not
   from reshuffling what's on the menu.
3. Rest is a real option, and one option recovers while it pays.
4. Risk and gains are shown as numbers before committing; hidden chance draws complaints.
5. Skill belongs where the stakes are. Training minigames are best as a guaranteed base with a
   capped skill bonus, and wear out after about ten plays unless they rotate.
6. No stat decay.
