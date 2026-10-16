/**
 * A stable stream of rolls in [0, 1) from a string, for anything that must come
 * out the same every time it's asked (a generated opponent's look, a time slot's
 * training offer) and must never draw from the simulation's random stream.
 * FNV-1a hashes the seed; mulberry32 rolls from it.
 */
export function seededRolls(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
