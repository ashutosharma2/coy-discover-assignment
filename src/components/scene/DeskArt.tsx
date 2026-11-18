import { memo, type ReactNode } from "react";
import { PILES, PILE_STEP } from "@/lib/client/mascot";

const INK = "#18120f";
const WOOD_DARK = "#4a2c18";
const WOOD = "#6f4426";
const WOOD_MID = "#8a5a33";
const WOOD_LIGHT = "#a8743f";
const BRASS = "#dcae47";

type Design = "postcard" | "airmail" | "envelope" | "scenic";

function Face({ design, color }: { design: Design; color: string }) {
  const outline = { stroke: INK, vectorEffect: "non-scaling-stroke" as const };
  return (
    <>
      <rect x="-32" y="-21" width="64" height="42" rx="2" fill={color} strokeWidth="2.2" {...outline} />
      {design === "postcard" && (
        <>
          <rect x="15" y="-16" width="12" height="15" fill="#fbfaf4" strokeWidth="1.2" {...outline} />
          <path d="M-25-8H6M-25 1H6M-25 10H-4" fill="none" strokeWidth="1.3" opacity="0.5" {...outline} />
        </>
      )}
      {design === "airmail" && (
        <>
          <path d="M-29-18H29V18H-29Z" fill="none" stroke="#d3262f" strokeWidth="3" strokeDasharray="7 7" vectorEffect="non-scaling-stroke" />
          <path d="M-20-5H8M-20 5H2" fill="none" strokeWidth="1.3" opacity="0.5" {...outline} />
        </>
      )}
      {design === "envelope" && (
        <>
          <path d="M-32-21 0 4 32-21" fill="none" strokeWidth="1.8" {...outline} />
          <circle cy="3" r="6" fill="#d3262f" strokeWidth="1.3" {...outline} />
        </>
      )}
      {design === "scenic" && (
        <>
          <rect x="-28" y="-17" width="56" height="34" fill="#f4a259" />
          <circle cx="8" cy="-3" r="8" fill="#ffe08c" />
          <path d="M-28 17V6L-14-3-2 7 12-1 28 9V17Z" fill="#3f7c82" />
        </>
      )}
    </>
  );
}

const PILE_ART: { design: Design; color: string; x: number; rot: number }[] = [
  { design: "postcard", color: "#8fb8de", x: 2, rot: 2 },
  { design: "envelope", color: "#f4efe2", x: -3, rot: -4 },
  { design: "scenic", color: "#fbfaf4", x: 3, rot: 3 },
  { design: "airmail", color: "#fbfaf4", x: -2, rot: -2 },
  { design: "postcard", color: "#e9a6a6", x: 1, rot: 4 },
  { design: "envelope", color: "#c9b6e4", x: -3, rot: -3 },
  { design: "postcard", color: "#9cc5a1", x: 2, rot: 2 },
];

function Pile({ name, size, offset = 0 }: { name: string; size: number; offset?: number }) {
  const { x, y } = PILES[name as keyof typeof PILES];
  return (
    <g data-pile={name}>
      {Array.from({ length: size }, (_, i) => {
        const art = PILE_ART[(i + offset) % PILE_ART.length];
        return (
          <g key={i} transform={`translate(${x + art.x} ${y - i * PILE_STEP}) rotate(${art.rot}) scale(1 0.5)`}>
            <Face design={art.design} color={art.color} />
          </g>
        );
      })}
    </g>
  );
}

function Cubby({ x, y, children }: { x: number; y: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="50" height="46" fill="#23140b" stroke={INK} strokeWidth="2" />
      <path d="M0 0H50V8H0Z" fill="#120a05" opacity="0.7" />
      {children}
    </g>
  );
}

function Tucked({ color, tilt = 0, x = 7, y = 18 }: { color: string; tilt?: number; x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <path d="M0 0H36V28H0Z" fill={color} stroke={INK} strokeWidth="1.8" />
      <path d="M0 0 18 13 36 0" fill="none" stroke={INK} strokeWidth="1.4" />
    </g>
  );
}

/** The sorting rack and lamp behind the owl. */
export const DeskBack = memo(function DeskBack() {
  return (
    <svg className="scene-layer scene-layer-back" viewBox="0 0 560 480">
      <defs>
        <radialGradient id="desk-glow">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#ffc56b" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffc56b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse className="desk-glow" cx="340" cy="210" rx="330" ry="240" fill="url(#desk-glow)" />

      <g className="desk-slot">
        <rect x="118" y="106" width="64" height="30" rx="4" fill={BRASS} stroke={INK} strokeWidth="2.4" />
        <rect x="127" y="114" width="46" height="14" rx="1.500" fill="#23140b" stroke={INK} strokeWidth="1.8" />
        <rect data-slot-flap="" x="127" y="114" width="46" height="14" rx="1.500" fill="#c99a38" stroke={INK} strokeWidth="1.8" />
        <circle cx="123" cy="121" r="2" fill={INK} />
        <circle cx="177" cy="121" r="2" fill={INK} />
      </g>

      <g className="desk-rack">
        <rect x="356" y="172" width="172" height="136" fill={WOOD} stroke={INK} strokeWidth="2.8" />
        <rect x="350" y="164" width="184" height="12" rx="2" fill={WOOD_MID} stroke={INK} strokeWidth="2.6" />
        <Cubby x={366} y={186}>
          <Tucked color="#f4efe2" tilt={-4} />
        </Cubby>
        <Cubby x={417} y={186}>
          <Tucked color="#8fb8de" tilt={3} x={5} y={20} />
          <Tucked color="#e9a6a6" tilt={-3} x={9} y={26} />
        </Cubby>
        <Cubby x={468} y={186} />
        <Cubby x={366} y={250}>
          <Tucked color="#9cc5a1" tilt={2} />
        </Cubby>
        <Cubby x={417} y={250} />
        <Cubby x={468} y={250}>
          <Tucked color="#f2c14e" tilt={-3} x={8} y={16} />
          <Tucked color="#c9b6e4" tilt={4} x={6} y={24} />
        </Cubby>

        <g transform="translate(58 0)">
          <path d="M388 164V146H412V164Z" fill="#b8613a" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M384 146H416V139H384Z" fill="#cd7448" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <g fill="#4d8a5e" stroke={INK} strokeWidth="2" strokeLinejoin="round">
            <path d="M400 139C392 132 384 128 378 128C380 136 390 141 400 139Z" />
            <path d="M400 139C408 132 416 128 422 128C420 136 410 141 400 139Z" />
            <path d="M400 139C395 128 395 116 400 106C405 116 405 128 400 139Z" />
          </g>
        </g>

        <path d="M486 164H520L516 154H490Z" fill={BRASS} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M503 154C504 110 494 76 458 68C436 64 420 72 410 84" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
        <path d="M503 154C504 110 494 76 458 68C436 64 420 72 410 84" fill="none" stroke={BRASS} strokeWidth="4" strokeLinecap="round" />
        <path d="M376 118C378 92 394 74 418 72L438 98C414 100 394 110 376 118Z" fill="#2f6f6a" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M385 106C391 92 402 83 416 80" fill="none" stroke="#7ec0b4" strokeWidth="2.6" strokeLinecap="round" />
        <path className="desk-bulb" d="M382 117C398 112 416 104 433 100C430 110 398 124 382 117Z" fill="#fff0c2" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      </g>
    </svg>
  );
});

/** The desk itself and the postcards lying on it. */
export const DeskFront = memo(function DeskFront() {
  return (
    <svg className="scene-layer scene-layer-front" viewBox="0 0 560 480">
      <g className="desk-body">
        <ellipse cx="280" cy="473" rx="266" ry="7" fill="#05082b" opacity="0.55" />
        <path d="M70 412V470H96V412ZM464 412V470H490V412Z" fill={WOOD_DARK} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M34 356H62V440C62 446 66 448 66 454L60 474H42L34 454C34 448 38 446 38 440Z" fill={WOOD} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M498 356H526V440C526 446 522 448 522 454L518 474H500L494 454C494 448 498 446 498 440Z" fill={WOOD} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />

        <rect x="36" y="356" width="488" height="58" fill={WOOD} stroke={INK} strokeWidth="2.6" />
        {[52, 214, 376].map((x) => (
          <g key={x}>
            <rect x={x} y="366" width="132" height="38" rx="2" fill={WOOD_MID} stroke={INK} strokeWidth="2.2" />
            <path d={`M${x + 8} 376H${x + 44}M${x + 90} 394H${x + 124}`} stroke={WOOD_DARK} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
            <path d={`M${x + 52} 387C${x + 54} 395 ${x + 78} 395 ${x + 80} 387`} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
            <path d={`M${x + 52} 387C${x + 54} 395 ${x + 78} 395 ${x + 80} 387`} fill="none" stroke={BRASS} strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
      </g>

      <g className="desk-top">
        <path d="M44 306H516L542 342H18Z" fill={WOOD_LIGHT} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M66 316H182M238 327H372M422 314H500M92 333H176M430 332H512" stroke={WOOD} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        <rect x="14" y="340" width="532" height="18" rx="3" fill={WOOD_MID} stroke={INK} strokeWidth="2.8" />
        <path d="M20 345H540" stroke="#c28f55" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      <g>
        <path d="M38 317H114L122 340H28Z" fill={WOOD} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M46 322H106L112 336H40Z" fill={WOOD_DARK} />
      </g>

      <Pile name="tray" size={6} offset={3} />
      <Pile name="inbox" size={6} />
      <Pile name="outbox" size={7} offset={2} />

      <g transform="translate(484 322)">
        <ellipse cy="13" rx="17" ry="5" fill="#2a170c" opacity="0.5" />
        <path data-anchor="spool" d="M-11-12H11V10H-11Z" fill="#d3262f" stroke={INK} strokeWidth="2.2" />
        <path d="M-11-6H11M-11 0H11M-11 5H11" stroke="#8d141b" strokeWidth="1.6" />
        <rect x="-15" y="-17" width="30" height="6" rx="1.500" fill="#d9b98a" stroke={INK} strokeWidth="2.2" />
        <rect x="-15" y="9" width="30" height="6" rx="1.500" fill="#d9b98a" stroke={INK} strokeWidth="2.2" />
      </g>

      <g className="desk-ink" transform="translate(525 318)">
        <path d="M-9-10H9L12 16H-12Z" fill="#1f2c6f" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="-6" y="-18" width="12" height="8" fill="#23140b" stroke={INK} strokeWidth="2" />
        <path d="M2-18C12-40 24-52 34-60C34-44 24-26 6-16Z" fill="#f4efe2" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </g>
    </svg>
  );
});
