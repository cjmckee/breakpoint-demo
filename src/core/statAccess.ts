/**
 * Typed access to the stat groups.
 *
 * `PlayerStats` is four interfaces of numbers and `StatName` is the union of their
 * keys, so reaching a stat by name means proving which group owns it. These two
 * helpers do that proof once, which is what the `as any` writes scattered through
 * PlayerProfile and PlayerManager were avoiding — at the cost of also dropping the
 * check that the value being written is a number at all.
 */

/**
 * `key in obj` as a narrowing guard, so the branch that follows can index `obj`
 * directly instead of casting the key.
 */
export function ownsKey<T extends object>(obj: T, key: PropertyKey): key is keyof T {
  return key in obj;
}

/**
 * Add `amount` to every stat in one group. Typing the parameter as
 * `Record<K, number>` is what makes the write safe: K is inferred from the group
 * passed in, so only a group whose values are all numbers is accepted.
 */
export function addToEachStat<K extends string>(group: Record<K, number>, amount: number): void {
  for (const key of Object.keys(group) as K[]) {
    group[key] += amount;
  }
}
