// Heads and faces. Everything is drawn on an 800 x 1000 canvas around a head at x = 400.
import { INK, brush, clipped, dot, fill, mix, outline, shape } from "./ink.mjs";

export const HX = 400;

const SKIN = {
  light: "#dcab7e",
  wheat: "#d09766",
  olive: "#c48f5f",
  medium: "#b97d50",
  tan: "#a76c42",
  dark: "#8c5534",
  deep: "#744329",
};

export function palette(tone) {
  const base = SKIN[tone];
  return {
    base,
    shade: mix(base, "#5b2418", 0.3),
    deep: mix(base, "#3a130f", 0.5),
    light: mix(base, "#ffe6c4", 0.32),
    blush: mix(base, "#c8423a", 0.32),
    lip: mix(base, "#8e2a33", 0.62),
  };
}

/** The outline of a head. Turning the face narrows the far side. */
export function headShape({ w = 150, jaw = 118, chin = 52, len = 655, turn = 0 }) {
  const k = (side) => 1 - side * turn * 0.08;
  const half = (s) => [
    [HX + s * 0.72 * w * k(s), 258],
    [HX + s * 0.97 * w * k(s), 345],
    [HX + s * w * k(s), 445],
    [HX + s * (jaw + (w - jaw) * 0.42) * k(s), 535],
    [HX + s * jaw * k(s), 592],
    [HX + turn * 12 + s * (chin + (jaw - chin) * 0.42) * k(s), len - 26],
  ];
  return [[HX, 232], ...half(1), [HX + turn * 16 + chin * 0.4, len], [HX + turn * 16 - chin * 0.4, len], ...half(-1).reverse()];
}

export function neck(skin, turn) {
  const x = HX + turn * 8;
  const pts = [[x - 66, 570], [x - 70, 700], [HX - 118, 800], [HX + 118, 800], [x + 70, 700], [x + 66, 570]];
  const shadow = [[x - 80, 590], [x + 80, 590], [x + 78, 690], [x + 20, 722], [x - 50, 700]];
  return (
    fill(pts, skin.base) +
    clipped(pts, fill(shadow, skin.shade)) +
    brush([[x - 67, 620], [x - 72, 700], [HX - 104, 770]], { w: 7 }) +
    brush([[x + 67, 620], [x + 72, 700], [HX + 104, 770]], { w: 8 })
  );
}

function ear(side, face, skin) {
  const k = 1 - side * (face.turn ?? 0) * 0.08;
  const x = HX + side * (face.w ?? 150) * k - side * 8;
  const pts = [[x, 408], [x + side * 26, 402], [x + side * 40, 438], [x + side * 28, 482], [x + side * 8, 500], [x - side * 6, 470]];
  return shape(pts, skin.base, { w: 6 }) + brush([[x + side * 24, 420], [x + side * 26, 450], [x + side * 12, 470]], { w: 4, color: skin.deep });
}

export function ears(face, skin) {
  const turn = face.turn ?? 0;
  return (turn < 0.55 ? ear(-1, face, skin) : "") + (turn > -0.55 ? ear(1, face, skin) : "");
}

export function earPosition(side, face) {
  const k = 1 - side * (face.turn ?? 0) * 0.08;
  return [HX + side * (face.w ?? 150) * k + side * 12, 502];
}

/** Where the two eyes sit, shared with the glasses. */
export function eyeLayout(p) {
  const turn = p.face?.turn ?? 0;
  const fx = HX + turn * 30;
  const spread = p.spread ?? 72;
  return { fx, y: p.eyeY ?? 448, lx: fx - spread * (1 + turn * 0.13), rx: fx + spread * (1 - turn * 0.13), ls: 1 + turn * 0.1, rs: 1 - turn * 0.1 };
}

function eye(x, y, out, scale, opts, skin, female) {
  const a = 36 * scale * (opts.size ?? 1);
  const b = 17 * (opts.open ?? 1);
  const kind = opts.kind ?? "open";
  const P = (px, py) => [x + px * out, y + py];
  if (kind === "happy") return brush([P(-a, 5), P(-a * 0.2, -14), P(a * 0.5, -12), P(a * 1.05, 6)], { w: 10, start: 0.3, end: 0.3 });
  if (kind === "shut") {
    return (
      brush([P(-a, -4), P(-a * 0.2, 9), P(a * 0.5, 8), P(a * 1.05, -6)], { w: 9, start: 0.3, end: 0.3 }) +
      brush([P(a * 0.8, 3), P(a * 1.12, 10)], { w: 4 }) +
      brush([P(a * 0.45, 8), P(a * 0.72, 18)], { w: 4 })
    );
  }
  const upper = [P(-a, 4), P(-a * 0.5, -b * 0.9), P(a * 0.28, -b * 1.08), P(a, 0)];
  const lower = [P(a * 0.45, b * 0.72), P(-a * 0.42, b * 0.68)];
  const almond = [...upper, ...lower];
  const gx = (opts.gx ?? 0) * 11;
  const gy = (opts.gy ?? 0) * 7;
  const iris =
    dot(x + gx, y + gy - 1, 17.5, "#2c1a12") +
    dot(x + gx, y + gy - 1, 9.5, "#0d0806") +
    dot(x + gx - 5, y + gy - 7, 5, "#fff8ee") +
    dot(x + gx + 6, y + gy + 5, 2.4, "#c9a27d");
  const lid = fill([P(-a * 1.2, -b * 1.5), P(a * 1.2, -b * 1.5), P(a * 1.2, -b * 0.55), P(-a * 1.2, -b * 0.45)], "#9f8f83", 0.45);
  return (
    fill(almond, "#f6ecdf") +
    clipped(almond, iris + lid) +
    brush([P(-a * 1.02, 5), P(-a * 0.5, -b * 0.95), P(a * 0.28, -b * 1.12), P(a * 1.05, 0), ...(female ? [P(a * 1.34, -8)] : [])], { w: female ? 11 : 9, start: 0.3, end: 0.22 }) +
    brush([P(a * 0.92, 3), lower[0], P(-a * 0.2, b * 0.82), P(-a * 0.82, 7)], { w: opts.kohl ? 6 : 3, color: opts.kohl ? INK : skin.deep }) +
    brush([P(-a * 0.62, -b * 1.5), P(a * 0.2, -b * 1.85), P(a * 0.88, -b * 1.1)], { w: 3.5, color: skin.deep })
  );
}

function brow(x, y, out, scale, opts, color) {
  const a = 42 * scale;
  const arch = opts.arch ?? 9;
  const P = (px, py) => [x + px * out, y + py];
  return brush([P(-a * 0.92, 6), P(-a * 0.2, -arch * 0.7), P(a * 0.45, -arch), P(a * 1.12, 8)], { w: opts.thick ?? 12, color, start: 0.85, end: 0.08 });
}

function nose(fx, turn, size, skin) {
  const d = turn >= 0 ? 1 : -1;
  const tip = fx + d * (10 + Math.abs(turn) * 24) * size;
  return (
    fill([[fx + d * 10, 470], [tip + d * 8, 520], [tip, 548], [fx - d * 8, 548], [fx + d * 4, 505]], skin.shade, 0.55) +
    dot(fx - d * 4, 526, 8, skin.light, { opacity: 0.8 }) +
    brush([[fx + d * 16, 478], [tip + d * 6, 520], [tip + d * 2, 546], [fx + d * 2, 554], [fx - d * 14 * size, 544]], { w: 6.5, start: 0.15, end: 0.4 }) +
    brush([[fx - d * 28 * size, 526], [fx - d * 34 * size, 540], [fx - d * 22 * size, 547]], { w: 4.5 })
  );
}

function mouth(x, y, kind, skin, female, gap) {
  const lips = (m, lift) =>
    female ? fill([[x - m, y - lift], [x - m * 0.4, y - 7], [x, y - 3], [x + m * 0.4, y - 7], [x + m, y - lift], [x + m * 0.45, y + 18], [x - m * 0.45, y + 18]], skin.lip) : "";
  if (kind === "grin" || kind === "laugh" || kind === "sing") {
    const m = kind === "sing" ? 34 : kind === "laugh" ? 66 : 58;
    const deep = kind === "laugh" ? 68 : kind === "sing" ? 62 : 42;
    const top = kind === "sing" ? -8 : -14;
    const open = [[x - m, y + top], [x - m * 0.45, y + top + 8], [x + m * 0.45, y + top + 8], [x + m, y + top], [x + m * 0.72, y + deep * 0.72], [x, y + deep], [x - m * 0.72, y + deep * 0.72]];
    const teeth = [[x - m * 1.1, y + top - 6], [x + m * 1.1, y + top - 6], [x + m * 0.9, y + top + 25], [x, y + top + 31], [x - m * 0.9, y + top + 25]];
    return (
      fill(open, "#431518") +
      clipped(open, fill(teeth, "#fbf3e6") + dot(x, y + deep + 4, m * 0.62, "#b5504e") + (gap ? fill([[x - 3.5, y + top], [x + 3.5, y + top], [x + 3, y + top + 30], [x - 3, y + top + 30]], "#431518") : "")) +
      outline(open, { w: 6 }) +
      brush([[x - m * 0.5, y + deep + 16], [x, y + deep + 22], [x + m * 0.5, y + deep + 16]], { w: 4.5, color: skin.deep })
    );
  }
  if (kind === "smirk") {
    return (
      lips(36, 2) +
      brush([[x - 44, y + 4], [x - 8, y + 10], [x + 30, y + 2], [x + 62, y - 20]], { w: 7, start: 0.35 }) +
      brush([[x + 56, y - 28], [x + 66, y - 16], [x + 62, y - 4]], { w: 4 }) +
      brush([[x - 20, y + 30], [x + 8, y + 33], [x + 26, y + 28]], { w: 4, color: skin.deep })
    );
  }
  if (kind === "calm" || kind === "shy") {
    const m = kind === "shy" ? 30 : 42;
    return lips(m * 0.9, 1) + brush([[x - m, y - 2], [x - m * 0.3, y + 7], [x + m * 0.3, y + 7], [x + m, y - 3]], { w: 6.5, start: 0.3, end: 0.3 }) + brush([[x - 16, y + 26], [x, y + 29], [x + 16, y + 26]], { w: 4, color: skin.deep });
  }
  return (
    lips(46, 5) +
    brush([[x - 58, y - 12], [x - 28, y + 8], [x + 28, y + 8], [x + 58, y - 12]], { w: 7, start: 0.3, end: 0.3 }) +
    brush([[x - 62, y - 20], [x - 66, y - 8], [x - 56, y]], { w: 3.5 }) +
    brush([[x + 62, y - 20], [x + 66, y - 8], [x + 56, y]], { w: 3.5 }) +
    brush([[x - 22, y + 30], [x, y + 34], [x + 22, y + 30]], { w: 4, color: skin.deep })
  );
}

function facialHair(kind, face, fx, skin, color) {
  if (!kind) return "";
  const w = face.w ?? 150;
  const jaw = face.jaw ?? 118;
  const len = face.len ?? 655;
  const area = (inset) => [
    [HX - w - 8, 462], [HX - jaw - 30, 590], [HX - 60, len + 18], [HX + 60, len + 18], [HX + jaw + 30, 590], [HX + w + 8, 462],
    [HX + w - inset, 470], [HX + jaw - inset * 0.5, 545], [fx + 78, 572], [fx + 66, 622], [fx, 632], [fx - 66, 622], [fx - 78, 572], [HX - jaw + inset * 0.5, 545], [HX - w + inset, 470],
  ];
  const tache = (h, wide) => fill([[fx - wide, 584], [fx - wide * 0.45, 562 - h * 0.3], [fx, 566], [fx + wide * 0.45, 562 - h * 0.3], [fx + wide, 584], [fx + wide * 0.45, 572 + h * 0.4], [fx, 574 + h * 0.2], [fx - wide * 0.45, 572 + h * 0.4]], color);
  const soul = fill([[fx - 15, 626], [fx, 620], [fx + 15, 626], [fx + 6, 646], [fx - 6, 646]], color);
  const chin = (wide) => fill([[fx - wide, 618], [fx - wide * 0.5, 634], [fx + wide * 0.5, 634], [fx + wide, 618], [fx + wide * 0.75, len + 12], [fx - wide * 0.75, len + 12]], color);
  const parts = {
    full: fill(area(30), color) + tache(22, 66) + soul,
    boxed: fill(area(18), color) + tache(16, 58) + soul,
    stubble: fill(area(34), skin.deep, 0.42) + fill([[fx - 58, 580], [fx, 562], [fx + 58, 580], [fx + 40, 592], [fx - 40, 592]], skin.deep, 0.45),
    scruff: fill(area(26), color, 0.5) + tache(12, 54),
    goatee: tache(13, 54) + chin(46) + soul,
    moustache: tache(30, 72),
    faint: fill([[fx - 50, 582], [fx, 568], [fx + 50, 582], [fx + 30, 586], [fx - 30, 586]], color, 0.55),
  };
  return clipped(headShape(face), parts[kind]);
}

/** Draws the skin of the head and every facial feature. */
export function faceDrawing(p, skin, hairColor, hairShadow) {
  const face = p.face ?? {};
  const turn = face.turn ?? 0;
  const head = headShape(face);
  const { fx, y, lx, rx, ls, rs } = eyeLayout(p);
  const browOpts = p.brow ?? {};
  const browY = y - 55 - (browOpts.raise ?? 0);
  const side = [[HX + 190, 250], [HX + 190, 700], [HX + 20, 700], [HX + 92, 610], [HX + 122, 500], [HX + 112, 370], [HX + 130, 250]];
  const shading =
    fill(side, skin.shade, 0.62) +
    (hairShadow ?? "") +
    dot(lx - 18, y + 72, 40, skin.blush, { opacity: 0.32 }) +
    dot(rx + 18, y + 72, 36, skin.blush, { opacity: 0.32 }) +
    fill([[fx - 42, 640], [fx, 628], [fx + 42, 640], [fx + 30, 662], [fx - 30, 662]], skin.shade, 0.55);
  const marks =
    (p.freckles ? [[-92, 505], [-74, 520], [-108, 522], [-58, 500], [82, 505], [100, 520], [66, 520], [118, 500]].map(([dx, dy]) => dot(fx + dx, dy, 3.2, skin.deep)).join("") : "") +
    (p.mark ? dot(fx - 88, 535, 5, INK) : "") +
    (p.paint ? fill([[fx + 62, 515], [fx + 118, 498], [fx + 126, 530], [fx + 76, 548]], "#2f62c9") : "");
  return (
    fill(head, skin.base) +
    clipped(head, shading) +
    facialHair(p.facial, face, fx, skin, hairColor) +
    outline(head, { w: 8 }) +
    marks +
    eye(lx, y, -1, ls, { ...p.eye, ...p.leftEye }, skin, p.female) +
    eye(rx, y, 1, rs, { ...p.eye, ...p.rightEye }, skin, p.female) +
    brow(lx, browY, -1, ls, browOpts, hairColor) +
    brow(rx, browY - (browOpts.lift ?? 0), 1, rs, browOpts, hairColor) +
    nose(fx, turn, p.nose ?? 1, skin) +
    mouth(fx + turn * 6, 592, p.mouth ?? "smile", skin, p.female, p.gap) +
    (p.bindi ? dot(fx, y - 62, 9, "#b3202b", { w: 2 }) : "") +
    (p.nosePin ? dot(fx + (turn >= 0 ? -30 : 30), 532, 5, "#f1d27a", { w: 2 }) : "") +
    (p.noseRing ? brush([[fx - 30, 536], [fx - 38, 552], [fx - 24, 558]], { w: 4, color: "#d8dde2" }) : "")
  );
}
