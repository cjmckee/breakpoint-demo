/**
 * Economy check — do rewards actually pay what they promise?
 *
 * The XP economy runs two counters that are easy to confuse:
 *   totalExperienceEarned — lifetime XP, monotonic, drives level
 *   experience            — spendable balance, drawn down by the shop
 *
 * Deriving level from the spendable balance made shop purchases demote the
 * player and re-grant specialization points on the way back up. These checks
 * pin the intended behavior so that can't silently return.
 *
 * Also asserts the effects contract: every key an item or ability writes into
 * modifiers.additional must be a real EffectKey. Four items used to declare
 * keys (training_stat_multiplier, ability_chance_bonus, training_tier_bonus)
 * that no system read — they rendered in the UI as live bonuses and did nothing.
 *
 * Exits non-zero on the first failure, so it can gate a release.
 *
 * Run: npx tsx src/test/economyCheck.ts
 */

import { PlayerManager } from '../game/PlayerManager';
import { ChallengeManager } from '../game/ChallengeManager';
import { ALL_ITEMS } from '../data/items';
import { ABILITY_DEFINITIONS } from '../data/abilities';
import { EffectKey } from '../types/game';
import type { Player } from '../types/game';
import type { Challenge } from '../types/challenges';

let failures = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

function freshPlayer(): Player {
  return PlayerManager.createPlayer('Economy Test', 'balanced');
}

/** Mirrors a shop purchase: spend from the balance, leave lifetime XP alone. */
function spend(player: Player, cost: number): Player {
  return { ...player, experience: player.experience - cost };
}

function xpChallenge(experience: number): Challenge {
  return {
    id: 'test_xp_challenge',
    name: 'XP Challenge',
    description: 'Grants XP on completion.',
    requirements: [],
    reward: { experience },
    status: 'completed',
    progress: { requirementProgress: [], isComplete: true, completionPercentage: 100 },
    assignedAt: new Date().toISOString(),
  };
}

function main(): void {
  console.log('\n╔══ ECONOMY CHECK — rewards pay what they promise ══╗\n');

  console.log('── level is derived from lifetime XP, not the spendable balance ──');
  {
    // 400 lifetime XP is exactly level 3 on the sqrt curve.
    const earned = PlayerManager.addExperience(freshPlayer(), 400).player;
    check('earning 400 XP reaches level 3', earned.level === 3, `got level ${earned.level}`);
    check('both counters hold 400 before spending',
      earned.experience === 400 && earned.totalExperienceEarned === 400,
      `experience=${earned.experience} totalEarned=${earned.totalExperienceEarned}`);

    // Spend most of the balance in the shop, then earn a single point.
    const afterShop = spend(earned, 300);
    const afterNextGain = PlayerManager.addExperience(afterShop, 1).player;
    check('spending 300 XP then earning again does not demote the player',
      afterNextGain.level >= 3, `dropped to level ${afterNextGain.level}`);
    check('spending does not rewind lifetime XP',
      afterNextGain.totalExperienceEarned === 401,
      `totalEarned=${afterNextGain.totalExperienceEarned}`);
    check('the spendable balance still reflects the purchase',
      afterNextGain.experience === 101, `experience=${afterNextGain.experience}`);
  }

  console.log('\n── specialization points are granted once per level ──');
  {
    const base = freshPlayer();
    const startingPoints = base.archetypeProfile.specializationPoints;

    // Straight climb to level 3.
    const straight = PlayerManager.addExperience(base, 400).player;
    const straightPoints = straight.archetypeProfile.specializationPoints;
    check('climbing to level 3 grants 2 points',
      straightPoints - startingPoints === 2,
      `granted ${straightPoints - startingPoints}`);

    // The double-grant sequence: spend, take any small gain (which is what used
    // to write the demoted level back onto the player), then climb past the same
    // threshold again — the level-3 point got handed out twice.
    const tick = PlayerManager.addExperience(spend(straight, 300), 1).player;
    const reclimbed = PlayerManager.addExperience(tick, 300).player;
    check('crossing the same level threshold twice grants no extra points',
      reclimbed.archetypeProfile.specializationPoints === straightPoints,
      `${straightPoints} -> ${reclimbed.archetypeProfile.specializationPoints}`);
  }

  console.log('\n── challenge XP levels the player up, like match XP ──');
  {
    const base = freshPlayer();
    const rewarded = ChallengeManager.applyRewards(xpChallenge(400), base);

    check('challenge XP raises level', rewarded.level === 3, `got level ${rewarded.level}`);
    check('challenge XP grants specialization points',
      rewarded.archetypeProfile.specializationPoints
        - base.archetypeProfile.specializationPoints === 2,
      `granted ${rewarded.archetypeProfile.specializationPoints - base.archetypeProfile.specializationPoints}`);
    check('challenge XP credits both counters',
      rewarded.experience === 400 && rewarded.totalExperienceEarned === 400,
      `experience=${rewarded.experience} totalEarned=${rewarded.totalExperienceEarned}`);
  }

  console.log('\n── every declared effect key is one the game reads ──');
  {
    const liveKeys = new Set<string>(Object.values(EffectKey));

    const orphans: string[] = [];
    for (const item of ALL_ITEMS) {
      // Equipment/lucky items carry passive effects; consumables carry the same
      // shape under nextActivityBuffs. Both feed EffectAggregator, so both count.
      const sources: [string, Record<string, number> | undefined][] = [
        ['passive', item.modifiers?.additional],
        ['next-activity buff', item.consumableEffect?.nextActivityBuffs?.additional],
      ];
      for (const [where, additional] of sources) {
        for (const key of Object.keys(additional ?? {})) {
          if (!liveKeys.has(key)) orphans.push(`item "${item.name}" (${where}) -> ${key}`);
        }
      }
    }
    for (const ability of Object.values(ABILITY_DEFINITIONS)) {
      for (const key of Object.keys(ability.modifiers.additional ?? {})) {
        if (!liveKeys.has(key)) orphans.push(`ability "${ability.name}" -> ${key}`);
      }
    }

    check('no item or ability declares an effect key outside EffectKey',
      orphans.length === 0, orphans.join('\n          '));
  }

  console.log(failures === 0
    ? '\n✅ all checks passed\n'
    : `\n❌ ${failures} check${failures === 1 ? '' : 's'} failed\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
