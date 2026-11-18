import { memo } from "react";

const INK = "#18120f";
const BRASS = "#dcae47";

/** One half of a heart. Apart they read as two separate constellations. */
const LEFT_PATH: [number, number][] = [[220, 134], [200, 104], [160, 92], [122, 118], [122, 166], [160, 216], [220, 264]];
const RIGHT_PATH: [number, number][] = LEFT_PATH.map(([x, y]) => [440 - x, y]);

const LOOSE_STARS: [number, number][] = [
  [92, 72], [150, 62], [292, 66], [352, 80], [386, 150], [64, 176], [84, 256], [150, 284], [296, 288], [360, 252],
];

const PINS: { x: number; y: number; rot: number; color: string }[] = [
  { x: 66, y: 76, rot: -8, color: "#f2c14e" },
  { x: 376, y: 74, rot: 7, color: "#e9a6a6" },
  { x: 64, y: 272, rot: 6, color: "#8fb8de" },
  { x: 378, y: 274, rot: -6, color: "#9cc5a1" },
  { x: 220, y: 66, rot: 3, color: "#f4a259" },
  { x: 220, y: 290, rot: -4, color: "#c9b6e4" },
];

function star(x: number, y: number, r: number) {
  const k = r * 0.28;
  return `M${x} ${y - r}L${x + k} ${y - k}L${x + r} ${y}L${x + k} ${y + k}L${x} ${y + r}L${x - k} ${y + k}L${x - r} ${y}L${x - k} ${y - k}Z`;
}

function Path({ points, side }: { points: [number, number][]; side: "l" | "r" }) {
  return (
    <g className={`board-half board-half-${side}`}>
      <g className={`board-drift board-drift-${side}`}>
        <polyline className="board-line" points={points.map(([x, y]) => `${x},${y}`).join(" ")} />
        {points.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle className="board-halo" cx={x} cy={y} r="13" />
            <path className="board-path-star" d={star(x, y, 8)} />
          </g>
        ))}
      </g>
    </g>
  );
}

/** The constellation board on the wall. The two halves only meet after a confirmed match. */
export const BoardArt = memo(function BoardArt() {
  const heart = [...LEFT_PATH, ...[...RIGHT_PATH].reverse()].map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <svg data-board="" className="scene-board" viewBox="0 0 440 340">
      <defs>
        <linearGradient id="board-felt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#232f7e" />
          <stop offset="1" stopColor="#141b58" />
        </linearGradient>
        <radialGradient id="board-light">
          <stop offset="0" stopColor="#ffdf9f" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="#ffdf9f" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffdf9f" stopOpacity="0" />
        </radialGradient>
        <clipPath id="board-felt-edge">
          <rect x="30" y="44" width="380" height="268" />
        </clipPath>
      </defs>

      <rect x="20" y="34" width="412" height="306" rx="4" fill="#05082b" opacity="0.4" />

      <rect x="8" y="24" width="424" height="308" rx="4" fill="#6f4426" stroke={INK} strokeWidth="3" />
      <path d="M14 30H426" stroke="#a8743f" strokeWidth="3" strokeLinecap="round" />
      <rect x="30" y="44" width="380" height="268" fill="url(#board-felt)" stroke={INK} strokeWidth="2.6" />

      <g fill="none" stroke="#5463b4" strokeWidth="1.2" opacity="0.6">
        <circle cx="220" cy="178" r="116" />
        <circle cx="220" cy="178" r="72" strokeDasharray="2 6" />
        <path d="M38 178H402M220 50V306M92 88 348 268M348 88 92 268" opacity="0.55" />
      </g>

      {LOOSE_STARS.map(([x, y], i) => (
        <g key={`${x}-${y}`} data-star="" className={`board-star board-star-${i % 3}`}>
          <circle className="board-star-glow" cx={x} cy={y} r="12" />
          <path className="board-star-shape" d={star(x, y, 6)} />
        </g>
      ))}

      <polygon className="board-heart-fill" points={heart} />
      <Path points={LEFT_PATH} side="l" />
      <Path points={RIGHT_PATH} side="r" />

      {PINS.map(({ x, y, rot, color }) => (
        <g key={`${x}-${y}`} data-pin="" className="board-pin" transform={`translate(${x} ${y}) rotate(${rot})`}>
          <rect x="-20" y="-14" width="40" height="28" rx="1.500" fill={color} stroke={INK} strokeWidth="2" />
          <path d="M-14-5H4M-14 2H4M-14 8H-3" stroke={INK} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
          <rect x="9" y="-10" width="7" height="9" fill="#fbfaf4" stroke={INK} strokeWidth="1" />
          <circle cy="-14" r="3.600" fill="#d3262f" stroke={INK} strokeWidth="1.5" />
        </g>
      ))}

      <g clipPath="url(#board-felt-edge)">
        <ellipse className="board-lamp-light" cx="220" cy="48" rx="250" ry="210" fill="url(#board-light)" />
      </g>

      <circle data-anchor="pin" cx="30" cy="312" r="5" fill="#d3262f" stroke={INK} strokeWidth="2" />
      {[[16, 32], [424, 32], [16, 324], [424, 324]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.500" fill={BRASS} stroke={INK} strokeWidth="1.5" />
      ))}

      <path d="M220 24V10H174C168 10 164 13 160 18" fill="none" stroke={INK} strokeWidth="6.500" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M220 24V10H174C168 10 164 13 160 18" fill="none" stroke={BRASS} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M220 24V10H266C272 10 276 13 280 18" fill="none" stroke={INK} strokeWidth="6.500" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M220 24V10H266C272 10 276 13 280 18" fill="none" stroke={BRASS} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M138 34C140 22 150 16 160 16H280C290 16 300 22 302 34Z" fill="#2f6f6a" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M144 34H296" stroke="#fff0c2" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
});
