const HEART: [number, number][] = [
  [160, 286], [84, 226], [28, 156], [24, 88], [72, 34], [128, 44], [160, 92], [192, 44], [248, 34], [296, 88], [292, 156], [236, 226],
];

function star(x: number, y: number, r: number) {
  const k = r * 0.28;
  return `M${x} ${y - r}L${x + k} ${y - k}L${x + r} ${y}L${x + k} ${y + k}L${x} ${y + r}L${x - k} ${y + k}L${x - r} ${y}L${x - k} ${y - k}Z`;
}

/** Shown only once the server has confirmed a mutual match: two postcards meet and the stars align. */
export function MatchConstellation() {
  const line = `${HEART.map(([x, y]) => `${x},${y}`).join(" ")} ${HEART[0].join(",")}`;
  return (
    <svg className="match-sky" viewBox="0 0 320 320" aria-hidden="true">
      <polyline className="match-sky-line" points={line} />
      {HEART.map(([x, y], i) => (
        <path key={`${x}-${y}`} className="match-sky-star" style={{ animationDelay: `${0.45 + i * 0.07}s` }} d={star(x, y, 11)} />
      ))}
      <g className="match-card match-card-left">
        <rect x="-30" y="-20" width="60" height="40" rx="3" />
        <path d="M-20 -8h24M-20 2h24M-20 12h14" />
      </g>
      <g className="match-card match-card-right">
        <rect x="-30" y="-20" width="60" height="40" rx="3" />
        <path d="M-20 -8h24M-20 2h24M-20 12h14" />
      </g>
    </svg>
  );
}
