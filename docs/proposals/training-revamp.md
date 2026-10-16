# Training revamp: drills that pay currency, not shots that train stats

**Status:** in design. The decisions below replace §3, §5 and §7 where they differ. Prototype, on real
game numbers: https://claude.ai/artifact/SMELHgGvkDiXZ7FLdToRaX
**Why now:** training was built when a session raised the stat of the shot it practised. Since the
currency rework a session pays currency and stats are bought in Development, so the five shot
cards, the pentagon and the "Serve Training" framing describe a link that no longer exists. Silver
and gold are being built on top of that screen, so this is the moment to rethink it.
**Research:** `docs/research/training-precedents.md` (Power Pros, Umamusume, Mario Tennis, Virtua
Tennis, Top Spin and raising sims, plus our own numbers).

## Decisions

| question                     | decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu shape                   | **Roll 3 of the 6 drills each time slot.** The roll is the decision: train what's offered, or rest or play a match instead. Not four fixed stations                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| How many drills              | **Six.** Today's five games plus **one new minigame**. Fishing stays a story game. Wary of more than six                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| The new drill                | **Split-Step Sprint** (Power + Quickness): an arrow flashes a direction, the player reacts to it, then mashes the button it named. Three reps, like the others                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| What a drill pays            | **One pair of currencies.** Four currencies make exactly six pairs; today's five games already pay five of them, so the new game is the missing **Power + Quickness** pair. Each currency is in three drills, so a roll of 3 offers every currency except about 1 slot in 20                                                                                                                                                                                                                                                                                                                       |
| Mind                         | **A normal currency.** Fix its pile-up at the source (the Mind-heavy base on match pay), with no special station or energy rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Training cards               | **The 3 rolled drills, shown large, and nothing else**: each drill's own **pixel icon**, its name, what it pays in **full currency names** ("8 Power, 4 Technique"). Energy shows as a before→after on the status bar, not on the card. Rest and matches stay on the main menu. An ability or item may later add a fourth option. Every card has the same fixed rows, so a long name or pay line never changes a card's height. **On phones** the cards stack as compact rows: icon beside the name and theme, pay on two short lines under them (about 106px a card, against 268px stacked whole) |
| Development                  | **The five areas as a strip across the top, with before→after bars** (the pre-match card's language), pinned with the wallet while you scroll: press + on a stat and the bars show what it buys, often across several areas. Under it the stats fill **two columns** (Core and Technical, then Physical and Mental), one line each where the width allows. The pentagon goes. Stats sit in their **four sections**, in a **fixed order**. Buying stays as today: what you can afford, no saved plan                                                                                                |
| Area names                   | **Serving, Returning, Baseline, Netplay, Coverage**, the same everywhere: Development, the main menu and the pre-match card                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Sections                     | **Each section gets a custom pixel icon and a colour** (Core blue, Technical pink, Physical peach, Mental slate), on Development and the main menu. Measured: no four colours stay fully clear of the four currency colours and the reserved greens and red, so the icon and name carry the meaning and the colour is a cue                                                                                                                                                                                                                                                                        |
| Partners (later, not silver) | **A teammate is rolled onto one of the slot's options** (Jen, Keith...), shown as just their face in the card's corner; hover or tap shows a small card with their name and the effect. The boost is to be designed within flat pay; the offer data carries an optional partner from the start                                                                                                                                                                                                                                                                                                     |
| Main menu                    | **The hero shows the five area ratings as letter grades only** (A, B, C...), where the five core grades were: no number and no bar, since no single stat stands behind an area. On phones they sit two to a row. The Player Stats card keeps every section, core included, with its icon and colour                                                                                                                                                                                                                                                                                                |

---

## 1. What training is today, measured

`careerSim LEDGER=1 RUNS=20 DAYS=40`, four identities, Club season:

| measure                    | value                                                          |
| -------------------------- | -------------------------------------------------------------- |
| share of all slots         | **69%** (2.08 sessions a day; one match, a rest, story)        |
| share of income            | **60%** (matches 23%, story and challenges 17%)                |
| a day's income             | about 32 units                                                 |
| a session                  | 3 units + 3 per clean rep: Quick Sim 6, perfect 12, mean 9.3   |
| a practice match, per slot | 21.7 units, but 50 energy, so about one a day                  |
| repetition                 | the baseliner plays one game (Rally Rhythm) on 54% of sessions |
| unspent at the end of Club | 13-23% of Quickness or Mind for builds that don't want them    |

Three problems, in order:

1. **Every day offers the same five cards, and the same five games.** Tiers change only the
   drill speed. A build settles on one or two cards for the whole career.
2. **The screen describes stats, not currency.** The pentagon and each card's number are core
   stats a session no longer moves. "Train Net" pays Technique and Mind, while the net stat costs
   Quickness and Technique.
3. **Currency is hard to steer.** Quickness is the main pay of one card (Return), so a Quickness
   build lives on one game. Meanwhile matches and story pay every currency, so builds that don't
   want Quickness or Mind pile them up.

## 2. What the precedents say

From the research, the six lessons that apply here:

1. **A small, stable menu where each option pays one main currency plus a little of others**
   (Power Pros' practices, Umamusume's five trainings). Players learn it once and can always
   steer toward what they need.
2. **Daily variety comes from an overlay, not from reshuffling the menu**: who turns up at a
   practice (Power Pros' teammates, Umamusume's support cards), the day's weather or modifier.
   Shown before choosing.
3. **One option recovers while it pays** (Power Pros' Mental practice, Umamusume's Wit), so a
   tired third slot is a choice, not a forced rest.
4. **Skill gives a capped bonus over a guaranteed base**, and minigames wear out "after about ten
   plays" (Virtua Tennis 4) unless they rotate.
5. **Show gains and risk as numbers before committing.** Hidden chance draws the complaints.
6. **No stat decay.** It's the most-criticised feature of the games that tried it.

Our economy already matches Power Pros closely (four currencies, recipes, price steps). What we
lack is its menu shape and its overlay.

## 3. The proposal: four stations, rotating drills

### 3.1 The day's menu

The training screen offers **one drill per currency each day**, four stations, plus the drills
being games rather than shots:

| station   | pays                                       | today's drill (rotates daily from its pool)         |
| --------- | ------------------------------------------ | --------------------------------------------------- |
| Power     | 2 Power + 1 of another                     | e.g. Toss & Strike, or a new power drill            |
| Quickness | 2 Quickness + 1 of another                 | e.g. Read & Return, or a new footwork drill         |
| Technique | 2 Technique + 1 of another                 | e.g. Corner Painter, Rally Rhythm, or Touch & Slice |
| Mind      | 2 Mind + 1 of another, **half the energy** | e.g. a pattern drill, or Cast & Reel                |

- **Every currency can be steered every day.** That fixes the Quickness problem and gives each
  build a reason to visit more than one station.
- **The drill at each station changes each morning**, drawn from that station's pool without
  repeating yesterday's. Same choice shape, different games: variety without losing the plan.
- **Each drill's secondary currency is its flavour.** A footwork drill might pay Quickness and
  Power; a reaction drill Quickness and Mind. Silver's focus swaps the secondary, as today.
- **The Mind station costs half the energy and pays half the reps' worth**, so pay per energy is
  unchanged. It's the tired-slot option Power Pros and Umamusume both have.
- **Pay stays flat**: the same 3 units a session plus 3 per clean rep, the same 20 energy. Only
  which currency and which game change.

### 3.2 Drills, not shots

Drills get names of their own and need not depict a shot. Today's five games keep working,
renamed by what they test rather than which shot they were (Toss & Strike stays; Rally Rhythm
can be "Rhythm Rally"; Touch & Slice can stop pretending to be the net drill).

**Do we need more minigames? Yes, about four.** Four stations with two or three drills each is
8-12. We have six (five training games and fishing):

| station   | have                                        | add                                                                                 |
| --------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| Power     | Toss & Strike                               | **one**: a timing/power-meter drill (e.g. medicine-ball throw, can smash)           |
| Quickness | Read & Return                               | **one**: a footwork or reaction drill (ladder, cone sprint, ball drop)              |
| Technique | Corner Painter, Rally Rhythm, Touch & Slice | none                                                                                |
| Mind      | Cast & Reel (promote from story)            | **two**: a memory/pattern drill (Simon-style shot sequences), a read-the-play drill |

Minigames take real work each, so the order matters: the Mind station first (it has the fewest
and carries the new energy rule), then Quickness, then Power.

### 3.3 The training screen

- **Lead with the four stations as currency cards**, each showing today's drill, what it pays
  ("up to 8 Quickness · 4 Power", in `CurrencyAmounts`), and its energy cost.
- **Point at what to buy next, not at stats.** A "next buy" marker on the station paying the
  currency the player's next purchase needs most (the Development screen already knows prices).
  No sentence: a chip, like Umamusume's icons or Top Spin's coach goals.
- **The pentagon moves to Development and the player card**, where stats live. It's a good
  picture of a build; it just isn't what training changes any more.
- Quick Sim stays: a guaranteed 1-rep result for players who don't want the game today.

### 3.4 Tiers, rethought on this footing

The earlier plan made silver a focus and gold a partner. On the new footing:

- **New drills open each season.** Club has one per station, Regional adds the second, the Tour
  the third. Players notice new games far more than a 5% faster ramp (Mario Tennis: Power Tour
  unlocks its games the same way). This replaces "silver is a faster drill" as the visible change.
- **Silver's focus** stays as is.
- **Gold's partners become the overlay** (§4), which is exactly what Power Pros and Umamusume
  use partners for.

## 4. Later: who turns up (the overlay)

Not for silver (decided), but this is the shape partners should take at gold. Each morning, the
characters you're close to are placed on stations at random (Umamusume's support cards), shown on
the card. Training where a friend is:

- moves the relationship, which is what makes hangouts matter for training;
- gives a small, bounded edge that keeps pay flat on average: a bonus rep, or a friendly
  secondary currency;
- at a high bond, a "friendship" version of the drill (Umamusume's rainbow training).

It turns "which station?" into "which station today?" without randomising what a station pays.

## 5. Currency: are there enough ways to earn it?

**Enough in total, not enough steering.** Pay is calibrated (§2.1 of `mid-late-progression.md`)
and the stations fix most of the steering. Two smaller options:

- **Match pay already follows how you played** (a pool split by area). Its base pays Mind 5-6
  against 2-3 of the rest; trimming that toward even would cut the Mind pile-up for builds that
  don't want it.
- **A release valve**: the coach swaps currency at a loss (3 of one for 2 of another). Cheap to
  build, and it ends the "13-23% unspent" problem, but it softens the choice of what to train.
  Measure the stations first; add this only if piles remain.

## 6. How we'd measure it

- **careerSim** models training by picking the shot that pays what it is short of. Switch it to
  stations: same pay, the drill irrelevant. Then report:
  - unspent currency per identity at each season's end (target under 10%);
  - sessions per station, so no station is dead;
  - par and OVR against today (target unchanged, since pay is flat).
- **Per-drill pay check** in `currencyCheck`: every drill pays the session total, at its
  station's main currency, and the Mind station pays the same per energy.
- **e2e**: the screen offers four stations, a drill changes overnight, a station's card pays
  what it previews.

## 7. Decisions for you

1. **Menu shape.** Four currency stations with rotating drills (recommended), or a random 3-4
   drills from one pool each day (more surprise, but some days can't fund what you need), or the
   five current cards with only names changed.
2. **The Mind station as the low-energy option**, at half energy for half pay.
3. **New minigames:** about four (one Power, one Quickness, two Mind), Mind first. Themes are
   yours.
4. **The pentagon** moves to Development and the player card; training shows currency.
5. **Season tiers become new drills**, with silver's focus kept and gold's partners as the
   overlay (§4).
6. **Mind base on match pay** trimmed toward even, and the currency swap held back until the
   stations are measured.
