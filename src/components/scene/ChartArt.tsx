import { memo } from "react";

const INK = "#18120f";

const STARS: [number, number][] = [
  [34, 112], [62, 76], [50, 40], [92, 30], [118, 62], [150, 40], [186, 58], [172, 96], [206, 118], [136, 112], [100, 124],
];
const LINKS: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [7, 9], [9, 10], [10, 0]];

const HEART: [number, number][] = [[120, 124], [88, 94], [76, 66], [94, 46], [120, 60], [146, 46], [164, 66], [152, 94]];
const heartLine = `${HEART.map(([x, y]) => `${x},${y}`).join(" ")} ${HEART[0].join(",")}`;

function star(x: number, y: number, r: number) {
  const k = r * 0.28;
  return `M${x} ${y - r}L${x + k} ${y - k}L${x + r} ${y}L${x + k} ${y + k}L${x} ${y + r}L${x - k} ${y + k}L${x - r} ${y}L${x - k} ${y - k}Z`;
}

/** The star chart pinned up behind the desk. */
export const ChartArt = memo(function ChartArt() {
  return (
    <svg className="scene-chart" viewBox="0 0 240 160" preserveAspectRatio="xMidYMid meet">
      <g className="chart-sheet">
        <path d="M8 12 232 6l3 146L6 150z" fill="#26347f" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M16 19 225 14l2 130L14 142z" fill="none" stroke="#7180c9" strokeWidth="1.3" />
        <g fill="none" stroke="#5463b4" strokeWidth="1.1">
          <circle cx="120" cy="80" r="62" />
          <circle cx="120" cy="80" r="42" strokeDasharray="2 5" />
          <path d="M20 80h200M120 16v128M50 34l140 92M190 34 50 126" opacity="0.55" />
        </g>

        {LINKS.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            data-link=""
            className="chart-link"
            x1={STARS[a][0]}
            y1={STARS[a][1]}
            x2={STARS[b][0]}
            y2={STARS[b][1]}
          />
        ))}

        {STARS.map(([x, y], i) => (
          <g key={`${x}-${y}`} data-star="" className={`chart-star chart-star-${i % 3}`}>
            <circle className="chart-star-glow" cx={x} cy={y} r="11" />
            <path className="chart-star-shape" d={star(x, y, 6.5)} />
          </g>
        ))}

        <g data-heart="" className="chart-heart">
          <polyline points={heartLine} />
          {HEART.map(([x, y]) => (
            <path key={`${x}-${y}`} d={star(x, y, 6)} />
          ))}
        </g>

        <circle cx="16" cy="16" r="5" fill="#d3262f" stroke={INK} strokeWidth="1.8" />
        <circle cx="224" cy="12" r="5" fill="#f0c85a" stroke={INK} strokeWidth="1.8" />
      </g>
    </svg>
  );
});
