# Random story events on busy days

Status: open, to decide. Raised when the Club season was shortened to a three-day team match
cycle (team matches on days 14, 17, 20, 23, 26; the Riverside Open from day 30).

## The rule today

`StoryEventManager.isDayBusy` treats a day as busy if anything is scheduled on it, at any slot, or
a tournament is running. On a busy day the random roll skips every event that takes time
(`timeSlotsRequired > 0`); events that take no slot still fire.

It was a whole-day rule because, when it was written, there was no consistent way to queue an
event: a random event that ran long could eat the slot a match or a story beat was scheduled for,
and the player would miss it.

## Why it matters now

The shorter season leaves far fewer days with nothing scheduled:

| Calendar                    | Free days       | Free days, list                               |
| --------------------------- | --------------- | --------------------------------------------- |
| Before (15–31, ceremony 36) | 12 of days 1–40 | 1, 14, 18, 20, 22, 24, 26, 28, 30, 32, 34, 35 |
| Now (14–26, ceremony 30)    | 6 of days 1–34  | 1, 18, 21, 24, 27, 29                         |

Free days are counted from the season's fixed beats, team matches and tournament days only.
Chains schedule more events at runtime, so the real number of free days is lower still.

careerSim's story stream goes through the same `getAllEligibleEvents`, so it already plays this
rule. Story events per day held up (1.37/day before, 1.43/day now), because most story is
scheduled chains and zero-slot events. The slots a career spends on story fell from 35.6 (to day 35) to 27.8 (to day 30): 1.02 a day before, 0.93 now. Most of that is the shorter season; the
per-day drop of about 9% is the time-consuming random events losing their days. careerSim doesn't
split random from scheduled events, so measure that before choosing.

## Options

1. **Block by slot, not by day.** A random event may fire in a slot when it fits: its
   `timeSlotsRequired` slots, starting now, are all free (`CalendarService.isSlotAvailable`).
   A match afternoon still blocks a two-slot morning event, but the morning of a match day can
   carry a one-slot one. The smallest change, and it keeps the original guarantee.
2. **Defer instead of drop.** A random event rolled where it doesn't fit is queued for the next
   slot it fits in, through the same scheduled-event queue the season beats use. Nothing is lost,
   but the player may meet an event a day after the roll that picked it.
3. **Both.** Fit check first; queue only what doesn't fit.

Recommendation: option 1, measured with careerSim (story slots per career, and how many random
events fire per season) before and after.
