// npm run avatars: draws one illustrated avatar per seeded profile into public/avatars/.
// It only needs running when the seeded names change. The SVGs are committed, so the app
// never generates or downloads an avatar at runtime.
// Artwork: Lorelei by Lisa Wischofsky, CC0 1.0, through DiceBear.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createAvatar } from "@dicebear/core";
import * as lorelei from "@dicebear/lorelei";

const source = readFileSync(path.join("src", "lib", "server", "seed-profiles.ts"), "utf8");
const names = [...source.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]);

const outDir = path.join("public", "avatars");
mkdirSync(outDir, { recursive: true });

for (const name of names) {
  const svg = createAvatar(lorelei, {
    seed: name,
    skinColor: ["e0ac69", "d29a5f", "c68642", "b5763d", "a0672f", "8d5524"],
    hairColor: ["120c0a", "1c1310", "2a1a12", "38231a"],
    backgroundColor: ["f2c14e", "f4a259", "e9a6a6", "9cc5a1", "8fb8de", "c9b6e4"],
    backgroundType: ["solid"],
    beardProbability: 0,
  }).toString();
  writeFileSync(path.join(outDir, `${name.toLowerCase()}.svg`), svg);
}

console.log(`Wrote ${names.length} avatars to ${outDir}.`);
