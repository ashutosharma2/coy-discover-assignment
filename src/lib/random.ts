/** Returns a number in [0, 1), like Math.random. Tests pass a seeded one. */
export type Rng = () => number;

/**
 * Fisher–Yates shuffle: every order is equally likely when rng is uniform.
 * The common `sort(() => Math.random() - 0.5)` is not, so it isn't used.
 */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
