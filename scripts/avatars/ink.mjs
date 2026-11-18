// Drawing helpers for the portraits: smooth curves, tapered brush lines and inked shapes.

export const INK = "#18120f";

const fmt = (n) => String(Math.round(n));

/** A small seeded random generator, so every run draws exactly the same portrait. */
export function seeded(text) {
  let state = 2166136261;
  for (const char of text) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function mix(a, b, t) {
  const [ca, cb] = [channels(a), channels(b)];
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** Samples a smooth Catmull-Rom curve through the points. */
export function sample(points, closed = false, steps = 5) {
  const n = points.length;
  const at = (i) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  const out = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const f = (k) =>
        0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t * t * t);
      out.push([f(0), f(1)]);
    }
  }
  if (!closed) out.push(points[n - 1]);
  return out;
}

const pathOf = (pts) => `M${pts.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join("L")}Z`;

function normals(pts, closed) {
  const n = pts.length;
  return pts.map((_, i) => {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  });
}

const ease = (t) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

/** A brush line that swells in the middle and tapers at both ends. */
export function brush(points, { w = 8, color = INK, start = 0.12, end = 0.12, opacity } = {}) {
  const pts = sample(points, false, 5);
  const ns = normals(pts, false);
  const last = pts.length - 1;
  const half = (i) => {
    const t = i / last;
    return (w / 2) * (start + (1 - start) * ease(t / 0.35)) * (end + (1 - end) * ease((1 - t) / 0.35));
  };
  const left = pts.map((p, i) => [p[0] + ns[i][0] * half(i), p[1] + ns[i][1] * half(i)]);
  const right = pts.map((p, i) => [p[0] - ns[i][0] * half(i), p[1] - ns[i][1] * half(i)]).reverse();
  return `<path d="${pathOf([...left, ...right])}" fill="${color}"${opacity ? ` opacity="${opacity}"` : ""}/>`;
}

/** An inked outline around a closed shape, heavier on the side away from the light. */
export function outline(points, { w = 7, color = INK } = {}) {
  const pts = sample(points, true, 5);
  const ns = normals(pts, true);
  let area = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    area += p[0] * q[1] - q[0] * p[1];
  });
  const outward = area > 0 ? -1 : 1;
  const half = ns.map((n) => (w / 2) * (0.72 + 0.55 * Math.max(0, outward * (n[0] * 0.55 + n[1] * 0.83))));
  const outer = pts.map((p, i) => [p[0] + ns[i][0] * half[i], p[1] + ns[i][1] * half[i]]);
  const inner = pts.map((p, i) => [p[0] - ns[i][0] * half[i], p[1] - ns[i][1] * half[i]]);
  return `<path fill-rule="evenodd" d="${pathOf(outer)}${pathOf(inner)}" fill="${color}"/>`;
}

export const fill = (points, color, opacity) =>
  `<path d="${pathOf(sample(points, true, 5))}" fill="${color}"${opacity ? ` opacity="${opacity}"` : ""}/>`;

/** A filled shape with an inked edge. */
export const shape = (points, color, { w = 7, ink = INK } = {}) => fill(points, color) + (w ? outline(points, { w, color: ink }) : "");

/** A straight-edged polygon with an inked edge, for hard objects such as books and cameras. */
export function box(points, color, { w = 6, ink = INK } = {}) {
  const d = `M${points.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join("L")}Z`;
  return `<path d="${d}" fill="${color}"${w ? ` stroke="${ink}" stroke-width="${w}" stroke-linejoin="round"` : ""}/>`;
}

export const rect = (x, y, w, h, color, opts) => box([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color, opts);

export const dot = (x, y, r, color, { w = 0, ink = INK, opacity } = {}) =>
  `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(r)}" fill="${color}"${w ? ` stroke="${ink}" stroke-width="${w}"` : ""}${opacity ? ` opacity="${opacity}"` : ""}/>`;

/** A smooth open line, used for the fine drawings in the backgrounds. */
export const line = (points, color, w = 5) => {
  const pts = points.length > 2 ? sample(points, false, 6) : points;
  return `<path d="M${pts.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join("L")}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
};

/** Straight segments, for drawings that need corners. */
export const lines = (points, color, w = 5) =>
  `<path d="M${points.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join("L")}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

export const ring = (x, y, r, color, w = 5) => `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(r)}" fill="none" stroke="${color}" stroke-width="${w}"/>`;

export const place = (content, { x = 0, y = 0, r = 0, s = 1 } = {}) =>
  `<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(r)}) scale(${s})">${content}</g>`;

let clipCount = 0;

/** Keeps drawing inside a shape, for example shadows inside a face. */
export function clipped(points, content) {
  clipCount += 1;
  const id = `c${clipCount}`;
  return `<clipPath id="${id}"><path d="${pathOf(sample(points, true, 5))}"/></clipPath><g clip-path="url(#${id})">${content}</g>`;
}

export const resetClips = () => {
  clipCount = 0;
};

/** Turns a smooth outline into a bumpy one, for curly hair. */
export function cloud(points, bump, rand) {
  const pts = sample(points, true, 10);
  const [cx, cy] = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  const out = [];
  let walked = 0;
  let next = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    if (walked >= next) {
      const len = Math.hypot(p[0] - cx, p[1] - cy) || 1;
      const push = out.length % 2 ? bump * (0.55 + rand() * 0.6) : -bump * 0.22;
      out.push([p[0] + ((p[0] - cx) / len) * push, p[1] + ((p[1] - cy) / len) * push]);
      next = walked + bump * (0.8 + rand() * 0.5);
    }
    walked += Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  return out;
}

export function inside(point, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [a, b] = [polygon[i], polygon[j]];
    if (a[1] > point[1] !== b[1] > point[1] && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}
