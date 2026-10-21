/**
 * The story a career actually meets, played through the game's own story code.
 *
 * careerSim used to pay story and challenges as a flat trickle of stat points a
 * day. The game is far busier than that: every daytime slot without a scheduled
 * event rolls the story trigger (40%), the draw picks a category and then an
 * event the player qualifies for, outcomes chain follow-ups onto the calendar,
 * team matches end in a win or loss event, and milestones fire after matches.
 * This replays that stream with StoryEventManager and PrerequisiteChecker, so a
 * new event, a new chain or a bigger payout reaches the harness on its own.
 *
 * What it leaves out: hangouts (the player chooses those), mood (held at 0, the
 * neutral misc draw), items and abilities from outcomes, and challenge progress.
 * A challenge's reward is paid when it is assigned, with chance `challengeRate`.
 */

import type { StatBoosts } from '../../types/game';
import type { CurrencyAmounts, GameCalendar, Player, ScheduledEvent } from '../../types/game';
import type { StoryEvent, StoryEventOutcome } from '../../types/storyEvents';
import { TimeSlot } from '../../types/game';
import { StoryEventManager } from '../../game/StoryEventManager';
import { PrerequisiteChecker } from '../../game/PrerequisiteChecker';
import { ScheduledEventManager } from '../../game/ScheduledEventManager';
import { SeasonManager } from '../../game/SeasonManager';
import { TimeManager } from '../../game/TimeManager';
import { CLUB_SEASON } from '../../data/seasons/club';
import { CURRENCIES } from '../../config/economy';
import { storyPay } from '../../game/CurrencyIncome';

export type StoryPick = 'random' | 'best';

export interface StoryStreamOptions {
  /** How the player chooses among an event's options: at random, or the best-paying. */
  pick: StoryPick;
  /** Percent chance a free daytime slot rolls a random event (the game's storyEventTriggerChance). */
  triggerChance: number;
  /** Chance an assigned challenge is completed and pays its reward. */
  challengeRate: number;
  /** Chance a story minigame is passed (the option's outcome), else its fail outcome. */
  minigamePass: number;
}

/** One event played: what it took and what it paid. */
export interface PlayedEvent {
  eventId: string;
  /** Slots it takes from the day, starting with the one it fired in. */
  slots: number;
  currency: CurrencyAmounts;
  statChanges: StatBoosts;
  energyChange: number;
}

const units = (c: CurrencyAmounts | undefined): number =>
  CURRENCIES.reduce((sum, k) => sum + (c?.[k] ?? 0), 0);

function quietly<T>(fn: () => T): T {
  const log = console.log;
  console.log = (): void => {};
  try {
    return fn();
  } finally {
    console.log = log;
  }
}

/** The event a new career opens on, before any slot is played. */
const OPENING_EVENT = 'welcome_to_tennis_rpg';

export class StoryStream {
  private completed: string[] = [];
  private choices: Record<string, string> = {};
  private relationships: Record<string, number> = {};
  private calendar: GameCalendar;

  constructor(private readonly opts: StoryStreamOptions) {
    this.calendar = {
      ...TimeManager.createCalendar(),
      scheduledEvents: SeasonManager.scheduleSeason(CLUB_SEASON, 1),
    };
  }

  private context(): {
    completedStoryEvents: string[];
    completedStoryEventChoices: Record<string, string>;
    relationships: Record<string, number>;
    calendar: GameCalendar;
    mood: number;
  } {
    return {
      completedStoryEvents: this.completed,
      completedStoryEventChoices: this.choices,
      relationships: this.relationships,
      calendar: this.calendar,
      mood: 0,
    };
  }

  private at(day: number, slot: TimeSlot): void {
    this.calendar = { ...this.calendar, currentDay: day, currentTimeSlot: slot };
  }

  /**
   * The start of a daytime slot: the story event scheduled for it if there is one,
   * otherwise the random roll (unless `roll` is off: the slot is already taken, but a
   * beat scheduled in it still runs, as arriving in a slot runs it in the game). Null
   * when nothing fires.
   */
  slotStart(player: Player, day: number, slot: TimeSlot, roll = true): PlayedEvent | null {
    this.at(day, slot);
    // The game opens on the welcome event when the player is created (createPlayer);
    // the tutorial chain hangs off it, and random rolls wait for the tutorial to end.
    if (!this.completed.includes(OPENING_EVENT)) return this.fire(player, OPENING_EVENT, day, slot);
    const due = ScheduledEventManager.getScheduledEvent(
      this.calendar.scheduledEvents,
      this.calendar,
    );
    if (due) {
      this.calendar = {
        ...this.calendar,
        scheduledEvents: ScheduledEventManager.clearScheduledEvent(
          this.calendar.scheduledEvents,
          day,
          slot,
        ),
      };
      const meta = (due.metadata ?? {}) as Record<string, unknown>;
      if (due.eventType === 'story' && typeof meta.storyEventId === 'string') {
        return this.fire(player, meta.storyEventId, day, slot);
      }
      // A story match's pre-match event: it pays and unlocks the result events, and the
      // caller plays the match itself in this slot.
      if (due.eventType === 'story_match' && typeof meta.prematchEventId === 'string') {
        const played = this.fire(player, meta.prematchEventId, day, slot);
        return played && { ...played, slots: 0 };
      }
      return null;
    }
    if (!roll || Math.random() * 100 >= this.opts.triggerChance) return null;
    const event = quietly(() =>
      StoryEventManager.selectRandomEvent(
        StoryEventManager.getAllEligibleEvents(player, this.context()),
        0,
      ),
    );
    return event ? this.play(player, event) : null;
  }

  /** An event by id (a team match's result, a scheduled beat), if the player qualifies. */
  fire(player: Player, eventId: string, day: number, slot: TimeSlot): PlayedEvent | null {
    this.at(day, slot);
    const event = quietly(() =>
      StoryEventManager.getEligibleEventById(eventId, player, this.context()),
    );
    return event ? this.play(player, event) : null;
  }

  /** Every milestone the player now qualifies for, played in turn (after a match). */
  milestones(player: Player, day: number, slot: TimeSlot): PlayedEvent[] {
    this.at(day, slot);
    const due = quietly(() =>
      StoryEventManager.getEligibleEventsByTag('milestone', player, this.context()),
    );
    return due.map((event) => this.play(player, event));
  }

  private outcomeOf(player: Player, event: StoryEvent): StoryEventOutcome | undefined {
    if (event.options.length === 0) return event.defaultOutcome;
    const options = quietly(() =>
      PrerequisiteChecker.getAvailableOptions(event, player, this.context()),
    );
    if (options.length === 0) return undefined;
    const resolved = options.map((option) => {
      const passed = !option.minigame || Math.random() < this.opts.minigamePass;
      return { option, outcome: passed ? option.outcome : option.minigame!.failOutcome };
    });
    const chosen =
      this.opts.pick === 'best'
        ? resolved.reduce((a, b) =>
            units(b.outcome.effects.currency) > units(a.outcome.effects.currency) ? b : a,
          )
        : resolved[Math.floor(Math.random() * resolved.length)];
    this.choices = { ...this.choices, [event.id]: chosen.option.id };
    return chosen.outcome;
  }

  private play(player: Player, event: StoryEvent): PlayedEvent {
    const outcome = this.outcomeOf(player, event);
    this.completed = [...this.completed, event.id];
    // Paid as the game pays it (storyPay), challenge rewards on completion.
    const currency: CurrencyAmounts = storyPay(outcome?.effects.currency ?? {});
    for (const challenge of outcome?.challengesAssigned ?? []) {
      if (Math.random() >= this.opts.challengeRate) continue;
      const reward = storyPay(challenge.reward.currency ?? {});
      for (const c of CURRENCIES) {
        if (reward[c]) currency[c] = (currency[c] ?? 0) + (reward[c] ?? 0);
      }
    }
    for (const [who, change] of Object.entries(outcome?.effects.relationshipChanges ?? {})) {
      this.relationships = {
        ...this.relationships,
        [who]: (this.relationships[who] ?? 0) + change,
      };
    }
    let scheduled: ScheduledEvent[] = this.calendar.scheduledEvents;
    for (const template of outcome?.effects.scheduledEvents ?? []) {
      scheduled = ScheduledEventManager.scheduleEventWithConflictResolution(
        scheduled,
        template.eventType,
        this.calendar.currentDay + template.relativeDays,
        template.scheduledTimeSlot,
        template.metadata,
      ).updatedEvents;
    }
    this.calendar = { ...this.calendar, scheduledEvents: scheduled };
    return {
      eventId: event.id,
      slots: event.timeSlotsRequired,
      currency,
      statChanges: outcome?.effects.statChanges ?? {},
      energyChange: outcome?.effects.energyChange ?? 0,
    };
  }
}
