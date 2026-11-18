// npm run avatars: draws one illustrated portrait per seeded profile into public/avatars/.
// It only needs running when a portrait changes. The SVGs are committed, so the app never
// generates or downloads an avatar at runtime.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dot, mix, resetClips, seeded } from "./avatars/ink.mjs";
import { earPosition, ears, eyeLayout, faceDrawing, neck, palette } from "./avatars/face.mjs";
import { hairDrawing } from "./avatars/hair.mjs";
import { outfitDrawing } from "./avatars/outfit.mjs";
import { HEADWEAR, PROPS, earring, glasses } from "./avatars/props.mjs";
import { SCENES } from "./avatars/scenes.mjs";
import { PEOPLE } from "./avatars/people.mjs";

function portrait(p) {
  resetClips();
  const rand = seeded(p.name);
  const skin = palette(p.skin);
  const face = p.face ?? {};
  const hair = hairDrawing(p, rand);
  const clothes = outfitDrawing(p.outfit, skin);
  const sceneColor = p.sceneColor ?? mix(p.bg, "#fff6e4", 0.38);

  let grain = "";
  for (let i = 0; i < 90; i++) grain += dot(rand() * 800, rand() * 1000, 1 + rand() * 2.4, i % 2 ? "#ffffff" : "#000000", { opacity: 0.09 });

  const jewellery = p.earring ? [-1, 1].map((s) => earring(p.earring, ...earPosition(s, face))).join("") : "";

  const parts = [
    `<rect width="800" height="1000" fill="${p.bg}"/>`,
    SCENES[p.scene](sceneColor),
    hair.back,
    clothes.behind,
    neck(skin, face.turn ?? 0),
    clothes.body,
    ears(face, skin),
    jewellery,
    faceDrawing(p, skin, hair.color, hair.hairShadow),
    hair.front,
    hair.over,
    p.hat ? HEADWEAR[p.hat]() : "",
    p.glasses ? glasses(p.glasses, eyeLayout(p)) : "",
    p.prop ? PROPS[p.prop](skin) : "",
    grain,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img"><title>Illustrated portrait of ${p.name}</title>${parts.join("")}</svg>\n`;
}

const outDir = process.argv[2] ?? path.join("public", "avatars");
mkdirSync(outDir, { recursive: true });

const source = readFileSync(path.join("src", "lib", "server", "seed-profiles.ts"), "utf8");
const seededNames = [...source.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]);
const drawnNames = PEOPLE.map((p) => p.name);
const missing = seededNames.filter((name) => !drawnNames.includes(name));
if (missing.length > 0) throw new Error(`No portrait for: ${missing.join(", ")}`);

let bytes = 0;
for (const person of PEOPLE) {
  const svg = portrait(person);
  bytes += svg.length;
  writeFileSync(path.join(outDir, `${person.name.toLowerCase()}.svg`), svg);
}

console.log(`Wrote ${PEOPLE.length} portraits to ${outDir} (${Math.round(bytes / 1024)} KB).`);
