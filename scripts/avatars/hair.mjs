// Hair. Each person's hair is described by a few choices; this file turns them into shapes.
import { INK, brush, cloud, clipped, dot, fill, inside, mix, outline, sample, shape } from "./ink.mjs";
import { HX, headShape } from "./face.mjs";

const at = (points) => points.map(([x, y]) => [HX + x, y]);

const HAIRLINES = {
  side: (W, p) => [[W - 8, 410], [W - 30, 350], [p + 74, 306], [p, 284], [p - 62, 314], [-(W - 30), 352], [-(W - 8), 410]],
  swept: (W) => [[W - 6, 400], [W - 26, 340], [70, 298], [-30, 322], [-(W - 34), 352], [-(W - 8), 405]],
  blunt: (W) => [[W + 2, 420], [W - 18, 362], [70, 358], [-70, 358], [-(W - 18), 362], [-(W + 2), 420]],
  curtain: (W) => [[W, 480], [W - 26, 408], [78, 326], [0, 270], [-78, 326], [-(W - 26), 408], [-W, 480]],
  high: (W) => [[W - 6, 395], [W - 26, 326], [56, 292], [-56, 292], [-(W - 26), 326], [-(W - 6), 395]],
  fringe: (W) => [[W - 4, 410], [W - 22, 352], [84, 342], [20, 312], [-64, 346], [-(W - 22), 356], [-(W - 4), 410]],
};

function crown(W, top, spikes, rand) {
  if (!spikes) return [[-W, 330], [-W * 0.76, top + 42], [-W * 0.36, top + 6], [0, top], [W * 0.36, top + 6], [W * 0.76, top + 42], [W, 330]];
  const out = [[-W, 330]];
  for (let i = 0; i <= spikes; i++) {
    const t = i / spikes;
    const x = -W * 0.9 + 1.8 * W * t;
    const arc = top + 54 * Math.pow(2 * t - 1, 2);
    out.push([x - 18, arc + 44], [x + (rand() - 0.5) * 12, arc - 30 - rand() * 18]);
  }
  out.push([W * 0.92, top + 92], [W, 330]);
  return out;
}

function strands(points, sheen, rand, count, curly) {
  const poly = sample(points, true, 4);
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let out = "";
  for (let i = 0, made = 0; i < 300 && made < count; i++) {
    const x = x0 + rand() * (x1 - x0);
    const y = y0 + rand() * (y1 - y0);
    if (!inside([x, y], poly)) continue;
    made += 1;
    const lean = (x - HX) * 0.14;
    out += curly
      ? brush([[x - 15, y + 8], [x - 5, y - 13], [x + 13, y - 8], [x + 13, y + 9]], { w: 5.5, color: sheen })
      : brush([[x - lean, y - 34], [x + lean * 0.3, y], [x + lean, y + 34 + rand() * 20]], { w: 5.5, color: sheen });
  }
  return out;
}

function braid(x, y, end, lean, color, sheen) {
  let out = "";
  const steps = Math.round((end - y) / 44);
  for (let i = 0; i < steps; i++) {
    const cy = y + i * 44;
    const cx = x + lean * i + (i % 2 ? 7 : -7);
    const size = 38 - i * 1.3;
    out += shape([[cx - size, cy], [cx, cy - 31], [cx + size, cy], [cx, cy + 34]], color, { w: 6 });
    out += brush([[cx - size * 0.45, cy - 8], [cx + size * 0.25, cy + 12]], { w: 5, color: sheen });
  }
  return out;
}

/** Returns the parts drawn behind the body, in front of the face, and on top of everything. */
export function hairDrawing(p, rand) {
  const h = p.hair;
  const color = h.color ?? "#1a1311";
  const sheen = h.sheen ?? mix(color, "#8d7a78", 0.42);
  const W = 150 + (h.volume ?? 14);
  const top = h.top ?? 178;
  const curly = h.curls;
  const length = h.length ?? 0;
  const hairline = HAIRLINES[h.line ?? "side"](W, h.part ?? -36);
  const raw = at([...crown(W, top, h.spikes, rand), ...hairline]);
  const front = curly ? cloud(raw, curly, rand) : raw;
  const hairShadow = fill(front.map(([x, y]) => [x + 4, y + 18]), "#3a1a14", 0.3);

  let back = "";
  let over = "";

  if (length) {
    const spread = h.spread ?? 26;
    const outlinePts = at([[-W - 8, 300], [-W * 0.7, top + 30], [0, top - 6], [W * 0.7, top + 30], [W + 8, 300], [W + spread, 500], [W + spread - 6, length], [W * 0.5, length + 24], [-W * 0.5, length + 24], [-W - spread + 6, length], [-W - spread, 500]]);
    const pts = curly ? cloud(outlinePts, curly * 1.1, rand) : outlinePts;
    back += shape(pts, color, { w: 7 }) + strands(pts, sheen, rand, curly ? 26 : 12, Boolean(curly));
    if (h.locks !== false) {
      for (const s of [-1, 1]) {
        if (h.tucked === s) continue;
        const lock = at([[s * (W - 26), 330], [s * (W + 12), 460], [s * (W + 18), length - 30], [s * (W - 30), length], [s * (W - 42), 560], [s * (W - 28), 450]]);
        const shaped = curly ? cloud(lock, curly * 0.8, rand) : lock;
        over += shape(shaped, color, { w: 6 }) + strands(shaped, sheen, rand, curly ? 12 : 4, Boolean(curly));
      }
    }
  }
  if (h.fade) {
    over += clipped(headShape(p.face ?? {}), fill(at([[-W, 330], [-W + 34, 340], [-W + 26, 440], [-W, 460]]), color, 0.55) + fill(at([[W, 330], [W - 34, 340], [W - 26, 440], [W, 460]]), color, 0.55));
  }
  if (h.ponytail) {
    const tail = cloud(at([[-30, 190], [-80, 100], [-30, 40], [70, 34], [120, 100], [76, 190]]), 26, rand);
    back += shape(tail, color, { w: 7 }) + strands(tail, sheen, rand, 12, true);
  }
  if (h.bun === "low") {
    const bun = at([[-30, 610], [-168, 560], [-214, 640], [-168, 720], [-60, 716]]);
    back += shape(bun, color, { w: 7 }) + strands(bun, sheen, rand, 8, false);
  }
  if (h.bun === "top" || h.bun === "messy") {
    const blob = at([[-74, 196], [-92, 116], [-30, 62], [48, 66], [94, 122], [70, 198]]);
    const bun = h.bun === "messy" ? cloud(blob, 20, rand) : blob;
    back += shape(bun, color, { w: 7 }) + brush(at([[-50, 112], [0, 84], [48, 112]]), { w: 6, color: sheen }) + brush(at([[-48, 150], [0, 128], [46, 150]]), { w: 6, color: sheen });
  }
  if (h.braid === "back") over += braid(HX - 166, 610, 960, -2, color, sheen);
  if (h.braid === "side") over += braid(HX + 166, 590, 960, 3, color, sheen);

  let art = shape(front, color, { w: 7 }) + strands(front, sheen, rand, curly ? 34 : (h.strands ?? 9), Boolean(curly));
  if (h.streak) art += brush(at([[28, top + 28], [86, 280], [122, 372]]), { w: 34, color: h.streak, start: 0.5, end: 0.5 }) + brush(at([[52, top + 32], [106, 280], [134, 356]]), { w: 6, color: mix(h.streak, "#ffffff", 0.3) });

  if (h.jasmine) {
    for (let i = 0; i < 6; i++) {
      const [x, y] = [HX - 150 + Math.sin(i) * 10, 500 + i * 30];
      for (let k = 0; k < 5; k++) over += dot(x + Math.cos((k * 6.28) / 5) * 10, y + Math.sin((k * 6.28) / 5) * 10, 8, "#fff6e2", { w: 2 });
      over += dot(x, y, 5, "#e8b84a", { w: 1.5 });
    }
  }
  if (h.pencil) {
    over += brush(at([[-126, 150], [40, 214]]), { w: 18, start: 1, end: 1 }) + brush(at([[-122, 152], [36, 212]]), { w: 11, color: "#e4a92e", start: 1, end: 1 }) + brush(at([[36, 212], [66, 226]]), { w: 12, color: "#e9c9a0", start: 1, end: 0.1 });
  }
  if (h.brushIn) {
    const tip = at([[-58, 26], [-14, 56], [-30, 82], [-66, 56]]);
    over += brush(at([[-20, 70], [120, 200]]), { w: 18, color: INK, start: 1, end: 1 }) + brush(at([[-16, 74], [116, 196]]), { w: 11, color: "#c98a3c", start: 1, end: 1 }) + fill(tip, "#c8322f") + outline(tip, { w: 5 });
  }
  if (h.tassel) {
    over += ["#d62f45", "#efb22e", "#2c9b8a"].map((c, i) => brush([[HX + 160 + i * 8, 930], [HX + 150 + i * 18, 1000]], { w: 15, color: c, start: 0.9, end: 0.5 })).join("");
  }
  return { back, front: art, over, hairShadow, color };
}
