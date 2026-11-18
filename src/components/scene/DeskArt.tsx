import { memo } from "react";

const INK = "#18120f";

function Postcard({ x, y, r = 0, color }: { x: number; y: number; r?: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect x="-23" y="-15" width="46" height="30" rx="2" fill={color} stroke={INK} strokeWidth="2" />
      <rect x="9" y="-10" width="9" height="11" fill="#fbfaf4" stroke={INK} strokeWidth="1.2" />
      <path d="M-17 -5h18M-17 2h18M-17 9h12" stroke={INK} strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
    </g>
  );
}

/** The pigeon at its sorting desk. Parts are named so the stylesheet can move them. */
export const DeskArt = memo(function DeskArt() {
  return (
    <svg className="scene-desk" viewBox="0 0 280 170" preserveAspectRatio="xMidYMax meet">
      <defs>
        <radialGradient id="lamp-glow">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#ffc56b" stopOpacity="0.15" />
          <stop offset="1" stopColor="#ffc56b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="205" cy="100" rx="170" ry="120" fill="url(#lamp-glow)" />

      <g fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
        <path d="M250 142V96L226 62" stroke="#c9a15a" strokeWidth="5" />
        <path d="M250 142V96L226 62" strokeWidth="1.2" opacity="0.5" />
      </g>
      <path d="M204 66 226 44l22 20-8 10-28 2z" fill="#d3262f" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <ellipse cx="220" cy="76" rx="11" ry="4" fill="#ffe9b0" />

      <g className="m-body">
        <path d="M107 116c-16 8-26 20-28 34l30-10z" fill="#6f8099" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <ellipse cx="140" cy="118" rx="39" ry="41" fill="#93a4ba" stroke={INK} strokeWidth="2.6" />
        <ellipse cx="140" cy="127" rx="25" ry="29" fill="#dbe2ea" />
        <path d="M112 90c17 11 39 11 56 0" fill="none" stroke="#3f9c94" strokeWidth="7" strokeLinecap="round" />
        <path d="M114 97c16 9 36 9 52 0" fill="none" stroke="#7a5bb0" strokeWidth="5" strokeLinecap="round" />
        <path d="M118 91 165 142" stroke="#8a4b2a" strokeWidth="5" strokeLinecap="round" />

        <g className="m-wing m-wing-l">
          <path d="M108 100c-15 9-22 27-16 43 13-3 25-14 28-33z" fill="#7f92ab" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M101 124c4-3 8-7 10-12M97 133c5-3 10-7 13-12" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </g>

        <g className="m-head">
          <circle cx="140" cy="62" r="29" fill="#a9b7c9" stroke={INK} strokeWidth="2.6" />
          <ellipse cx="118" cy="73" rx="7" ry="4.5" fill="#e88f8f" opacity="0.75" />
          <ellipse cx="162" cy="73" rx="7" ry="4.5" fill="#e88f8f" opacity="0.75" />

          <g className="m-eyes">
            {[127, 153].map((x) => (
              <g key={x}>
                <circle cx={x} cy="59" r="9" fill="#f0a23c" stroke={INK} strokeWidth="2.2" />
                <circle cx={x} cy="59" r="6.4" fill="#fff6e2" />
                <g className="m-gaze">
                  <g className="m-follow">
                    <circle cx={x} cy="59" r="4.2" fill={INK} />
                    <circle cx={x - 1.4} cy="57.4" r="1.4" fill="#fff" />
                  </g>
                </g>
                <rect className="m-lid" x={x - 10} y="49" width="20" height="20" rx="9" fill="#a9b7c9" stroke={INK} strokeWidth="2" />
              </g>
            ))}
          </g>
          <g className="m-happy" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round">
            <path d="M119 61c3-7 13-7 16 0" />
            <path d="M145 61c3-7 13-7 16 0" />
          </g>

          <path d="M133 69c2-3 12-3 14 0l-7 11z" fill="#eea236" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M134 69c2-4 10-4 12 0" fill="#f7efe2" stroke={INK} strokeWidth="1.6" />

          <path d="M113 45c1-18 13-27 28-27 16 0 27 10 27 27-17-6-38-6-55 0z" fill="#1f2c6f" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M112 45c18-7 38-7 57 0l1 7c-20-7-40-7-59 0z" fill="#d3262f" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="133" y="27" width="15" height="11" rx="1.5" fill="#f0c85a" stroke={INK} strokeWidth="1.6" />
          <path d="m133.500 28 7 5 7-5" fill="none" stroke={INK} strokeWidth="1.3" />
        </g>

        <g className="m-held">
          <g className="m-held-card">
            <rect x="118" y="106" width="44" height="29" rx="2" fill="#f2c14e" stroke={INK} strokeWidth="2.2" />
            <rect className="m-held-back" x="118" y="106" width="44" height="29" rx="2" fill="#f7efe2" stroke={INK} strokeWidth="2.2" />
            <circle className="m-held-face" cx="133" cy="118" r="6" fill="#b97d50" stroke={INK} strokeWidth="1.5" />
            <path className="m-held-face" d="M124 131c2-6 16-6 18 0" fill="#3f7c82" stroke={INK} strokeWidth="1.5" />
            <path className="m-held-note" d="M124 113h20M124 120h26M124 127h15" stroke={INK} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          </g>
          <circle data-hand="" cx="140" cy="120" r="1" fill="none" />
        </g>

        <g className="m-wing m-wing-r">
          <path d="M172 100c15 9 22 27 16 43-13-3-25-14-28-33z" fill="#7f92ab" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M179 124c-4-3-8-7-10-12M183 133c-5-3-10-7-13-12" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </g>
      </g>

      <g className="m-hearts" fill="#ff8d8d" stroke={INK} strokeWidth="1.4">
        <path d="M96 42c-5-7-14 0-8 7l8 8 8-8c6-7-3-14-8-7z" />
        <path d="M186 28c-4-6-12 0-7 6l7 7 7-7c5-6-3-12-7-6z" />
        <path d="M204 56c-3-4-9 0-5 5l5 5 5-5c4-5-2-9-5-5z" />
      </g>

      <rect x="2" y="146" width="276" height="26" rx="3" fill="#6f4426" stroke={INK} strokeWidth="2.6" />
      <rect x="4" y="148" width="272" height="4" fill="#94613a" />
      <path d="M22 160h44M120 163h60M214 158h38" stroke="#4a2c18" strokeWidth="2" strokeLinecap="round" />

      <g className="m-pile m-pile-aside">
        <Postcard x={24} y={136} r={-7} color="#c9b6e4" />
        <Postcard x={28} y={128} r={9} color="#8d98ad" />
      </g>
      <g className="m-pile m-pile-in">
        <Postcard x={72} y={137} r={2} color="#8fb8de" />
        <Postcard x={70} y={130} r={-4} color="#e9a6a6" />
        <Postcard x={73} y={123} r={3} color="#9cc5a1" />
        <Postcard x={70} y={116} r={-2} color="#f4efe2" />
      </g>
      <g className="m-pile m-pile-out">
        <Postcard x={212} y={137} r={-3} color="#f2c14e" />
        <Postcard x={215} y={130} r={4} color="#f4a259" />
        <Postcard x={212} y={123} r={-5} color="#e9a6a6" />
      </g>
    </svg>
  );
});
