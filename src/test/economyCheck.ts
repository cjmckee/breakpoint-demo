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
import { MatchRewardSystem } from '../game/MatchRewardSystem';
import {
  buildAnchorStatBoosts,
  buildAnchorTrainingResult,
  NO_TRAINING_BONUSES,
} from '../game/AnchorTrainingSystem';
import { MatchStatistics } from '../core/MatchStatistics';
import { PlayerProfile } from '../core/PlayerProfile';
import { EffectAggregator } from '../core/EffectAggregator';
import { ItemManager } from '../game/ItemManager';
import { ALL_ITEMS, ALL_LUCKY_ITEMS, LUCKY_PENNY, FOUR_LEAF_CLOVER, VISOR } from '../data/items';
import { SLOT_ITEM_TYPE } from '../types/items';
import { ABILITY_DEFINITIONS } from '../data/abilities';
import { EffectKey } from '../types/game';
import type { Player, StatBoosts } from '../types/game';
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

  console.log('\n── training effects change the session payout ──');
  {
    const supports: ('strength' | 'placement')[] = ['strength', 'placement'];

    const upgraded = buildAnchorStatBoosts('serve', supports, 1);
    check('a certain upgrade makes every granted stat worth +2',
      upgraded.serve === 2 && upgraded.strength === 2 && upgraded.placement === 2,
      JSON.stringify(upgraded));

    const plain = buildAnchorStatBoosts('serve', supports, 0);
    check('no upgrade chance leaves every grant at +1',
      plain.serve === 1 && plain.strength === 1 && plain.placement === 1,
      JSON.stringify(plain));

    const countSupports = (boosts: StatBoosts): number =>
      Object.keys(boosts).filter((stat) => stat !== 'serve').length;

    const certainBonus = { statUpgradeChance: 0, bonusSupportChance: 1 };
    const withBonus = buildAnchorTrainingResult('serve', 2, [], certainBonus);
    const withoutBonus = buildAnchorTrainingResult('serve', 2, [], NO_TRAINING_BONUSES);

    check('two reps draw two supports on their own',
      countSupports(withoutBonus.statBoosts) === 2,
      `${countSupports(withoutBonus.statBoosts)} supports`);
    check('a certain bonus rep adds one support beyond the reps earned',
      countSupports(withBonus.statBoosts) === 3,
      `${countSupports(withBonus.statBoosts)} supports`);

    // The session message reads off reps landed, not supports handed out.
    const bonusMessage = withBonus.message ?? '';
    check('a bonus rep does not let a two-rep session claim three for three',
      bonusMessage.length > 0 && !bonusMessage.includes('three for three'), bonusMessage);

    const whiffed = buildAnchorTrainingResult('serve', 0, [], certainBonus);
    check('a bonus rep never rescues a session that landed nothing',
      countSupports(whiffed.statBoosts) === 0,
      `${countSupports(whiffed.statBoosts)} supports: ${whiffed.message}`);
  }

  console.log('\n── the ability drop bonus reaches the post-match roll ──');
  {
    const emptyStats = new MatchStatistics(
      new PlayerProfile('p', 'Player'),
      new PlayerProfile('o', 'Opponent')
    ).getStatistics();

    // Rather than assume where the drop threshold sits, sweep the roll across the
    // low end and count how often each configuration drops. A bonus that reaches
    // the roll must widen the band of rolls that succeed.
    const originalRandom = Math.random;
    const originalLog = console.log;
    let dropsWithout = 0;
    let dropsWith = 0;
    try {
      console.log = (): void => {};
      for (let roll = 0; roll < 0.12; roll += 0.001) {
        Math.random = (): number => roll;
        if ((MatchRewardSystem.calculateRewards(emptyStats, 1, true, 0).abilitiesGained ?? []).length > 0) {
          dropsWithout++;
        }
        if ((MatchRewardSystem.calculateRewards(emptyStats, 1, true, 0.15).abilitiesGained ?? []).length > 0) {
          dropsWith++;
        }
      }
    } finally {
      Math.random = originalRandom;
      console.log = originalLog;
    }

    check('a drop bonus widens the band of rolls that yield an ability',
      dropsWith > dropsWithout, `with=${dropsWith} without=${dropsWithout}`);
    check('the baseline still drops abilities at all (sweep covers the threshold)',
      dropsWithout > 0, `without=${dropsWithout}`);
  }

  console.log('\n── one charm at a time ──');
  {
    const mismatched = ALL_LUCKY_ITEMS.filter((item) => item.equipmentSlot !== 'charm');
    check('every lucky item declares the charm slot',
      mismatched.length === 0, mismatched.map((i) => i.name).join(', '));

    const wrongType = ALL_ITEMS.filter(
      (item) => item.equipmentSlot && item.type !== SLOT_ITEM_TYPE[item.equipmentSlot]
    );
    check('no item declares a slot that rejects its own type',
      wrongType.length === 0,
      wrongType.map((i) => `${i.name} (${i.type} -> ${i.equipmentSlot})`).join(', '));

    // With only one slot, a charm whose whole identity is a stat pile makes the
    // choice arithmetic rather than a decision.
    const effectless = ALL_LUCKY_ITEMS.filter(
      (item) => Object.keys(item.modifiers?.additional ?? {}).length === 0
    );
    check('every charm carries an effect, not just stats',
      effectless.length === 0, effectless.map((i) => i.name).join(', '));

    const originalWarn = console.warn;
    try {
      console.warn = (): void => {};

      const held = ItemManager.addItem(freshPlayer(), LUCKY_PENNY);
      const heldEffects = EffectAggregator.getActiveEffects(held);
      check('a charm sitting in inventory grants nothing',
        EffectAggregator.getEffect(heldEffects.effects, EffectKey.ABILITY_DROP_BONUS) === 0 &&
          Object.keys(heldEffects.statBoosts).length === 0,
        JSON.stringify(heldEffects));

      const wearing = ItemManager.equipItem(held, LUCKY_PENNY.id, 'charm');
      const wornEffects = EffectAggregator.getActiveEffects(wearing);
      check('equipping the charm turns its effect on',
        EffectAggregator.getEffect(wornEffects.effects, EffectKey.ABILITY_DROP_BONUS) === 0.15,
        JSON.stringify(wornEffects.effects));

      // The whole point of the slot: a second charm displaces the first.
      const bothHeld = ItemManager.addItem(wearing, FOUR_LEAF_CLOVER);
      const swapped = ItemManager.equipItem(bothHeld, FOUR_LEAF_CLOVER.id, 'charm');
      const swappedEffects = EffectAggregator.getActiveEffects(swapped);
      check('equipping a second charm displaces the first',
        swapped.equippedItems.charm?.id === FOUR_LEAF_CLOVER.id &&
          swapped.inventory.some((i) => i.id === LUCKY_PENNY.id),
        `charm=${swapped.equippedItems.charm?.id}`);
      check('the displaced charm stops contributing',
        EffectAggregator.getEffect(swappedEffects.effects, EffectKey.ABILITY_DROP_BONUS) === 0,
        JSON.stringify(swappedEffects.effects));

      // Slots stay type-exclusive in both directions.
      const charmIntoHat = ItemManager.equipItem(held, LUCKY_PENNY.id, 'hat');
      check('a charm cannot be equipped into a gear slot',
        charmIntoHat.equippedItems.hat === null);

      const gearHeld = ItemManager.addItem(freshPlayer(), VISOR);
      const gearIntoCharm = ItemManager.equipItem(gearHeld, VISOR.id, 'charm');
      check('gear cannot be equipped into the charm slot',
        gearIntoCharm.equippedItems.charm === null);
    } finally {
      console.warn = originalWarn;
    }
  }

  console.log(failures === 0
    ? '\n✅ all checks passed\n'
    : `\n❌ ${failures} check${failures === 1 ? '' : 's'} failed\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
