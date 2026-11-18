import { memo } from "react";
import { PROP_HOMES } from "@/lib/client/mascot";

const INK = "#18120f";
const TAWNY = "#c58745";
const TAWNY_DEEP = "#9d6231";
const CREAM = "#f8ecd6";
const RUST = "#a8502a";
const RED = "#d3262f";
const BRASS = "#dcae47";

const HEAD_SHAPE = "M262 88C318 88 338 128 334 164C330 204 298 220 262 220C226 220 194 204 190 164C186 128 206 88 262 88Z";

function Speckle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 5C-2 3-6 1-6-2C-6-5-2-6 0-3C2-6 6-5 6-2C6 1 2 3 0 5Z"
      fill={RUST}
      opacity="0.72"
    />
  );
}

function Eye({ side, x }: { side: "l" | "r"; x: number }) {
  return (
    <g>
      <circle cx={x} cy="150" r="24" fill="#6b3a1c" opacity="0.2" />
      <circle cx={x} cy="150" r="21.500" fill="#f2a93b" stroke={INK} strokeWidth="2.6" />
      <circle cx={x} cy="150" r="17" fill="#f9c766" />
      <g data-owl={`pupil-${side}`}>
        <circle cx={x} cy="150" r="13.500" fill={INK} />
        <circle cx={x - 4.5} cy="145" r="4.600" fill="#fff" />
        <circle cx={x + 4.5} cy="155" r="2" fill="#fff" opacity="0.8" />
      </g>
      <g clipPath={`url(#owl-eye-${side})`}>
        <circle data-owl={`lid-${side}`} cx={x} cy="150" r="24" fill="#e7c594" stroke={INK} strokeWidth="2.6" />
      </g>
    </g>
  );
}

/** The owl's body and head. The desk is drawn in front of this, so the owl sits behind it. */
export const OwlBody = memo(function OwlBody() {
  return (
    <svg className="scene-layer" viewBox="0 0 560 480">
      <defs>
        <clipPath id="owl-head">
          <path d={HEAD_SHAPE} />
        </clipPath>
        <clipPath id="owl-eye-l">
          <circle cx="231" cy="150" r="21.500" />
        </clipPath>
        <clipPath id="owl-eye-r">
          <circle cx="293" cy="150" r="21.500" />
        </clipPath>
      </defs>

      <g data-owl="body">
        <path d="M200 340C184 268 212 204 262 204C312 204 340 268 324 340Z" fill={TAWNY} stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M222 340C212 284 230 232 262 232C294 232 312 284 302 340Z" fill={CREAM} />
        <Speckle x={246} y={258} />
        <Speckle x={278} y={258} />
        <Speckle x={262} y={276} />
        <Speckle x={236} y={286} s={0.9} />
        <Speckle x={288} y={286} s={0.9} />

        <g data-owl="scarf-tail">
          <path d="M270 222C282 238 288 252 286 270L272 276C268 258 262 240 256 226Z" fill={RED} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M273 268 284 263" stroke={BRASS} strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <path d="M214 204C232 224 292 224 310 204L314 218C292 242 232 242 210 218Z" fill={RED} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M250 226C256 220 268 220 274 226C274 234 268 240 262 240C256 240 250 234 250 226Z" fill="#a81b24" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />

        <g data-owl="head">
          <g data-owl="tuft-l">
            <path d="M206 112C198 96 198 82 204 70C216 76 230 86 236 98Z" fill={TAWNY_DEEP} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          </g>
          <g data-owl="tuft-r">
            <path d="M318 112C326 96 326 82 320 70C308 76 294 86 288 98Z" fill={TAWNY_DEEP} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          </g>

          <path d={HEAD_SHAPE} fill={TAWNY} stroke={INK} strokeWidth="2.8" />
          <g clipPath="url(#owl-head)">
            <g data-owl="face">
              <path d="M240 96c5-3 9-3 13 0M272 96c4-3 8-3 13 0M262 106c3-3 6-3 8 0" fill="none" stroke={TAWNY_DEEP} strokeWidth="2.4" strokeLinecap="round" />
              <path
                d="M262 128C252 104 222 98 206 116C188 136 196 170 222 190C240 203 254 209 262 216C270 209 284 203 302 190C328 170 336 136 318 116C302 98 272 104 262 128Z"
                fill={CREAM}
                stroke={RUST}
                strokeWidth="3.4"
                strokeLinejoin="round"
              />
              <path d="M215 190 208 197M308 190 316 197M232 202 228 210M292 202 296 210" stroke={RUST} strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
              <ellipse cx="205" cy="178" rx="10" ry="6.500" fill="#ef8f86" opacity="0.65" />
              <ellipse cx="319" cy="178" rx="10" ry="6.500" fill="#ef8f86" opacity="0.65" />

              <g data-owl="eyes">
                <Eye side="l" x={231} />
                <Eye side="r" x={293} />
              </g>
              <g data-owl="happy" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" opacity="0">
                <path d="M212 156C220 136 242 136 250 156" />
                <path d="M274 156C282 136 304 136 312 156" />
              </g>

              <g data-owl="brow-l">
                <path d="M212 121C222 114 236 113 247 118" fill="none" stroke={RUST} strokeWidth="4" strokeLinecap="round" />
              </g>
              <g data-owl="brow-r">
                <path d="M312 121C302 114 288 113 277 118" fill="none" stroke={RUST} strokeWidth="4" strokeLinecap="round" />
              </g>

              <g fill="none" stroke={BRASS} strokeWidth="3.2">
                <circle cx="231" cy="150" r="26" />
                <circle cx="293" cy="150" r="26" />
                <path d="M257 146C259 141 265 141 267 146" />
                <path d="M205 146 192 140M319 146 332 140" strokeLinecap="round" />
              </g>
              <path d="M214 136C219 130 226 128 232 128M276 136C281 130 288 128 294 128" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />

              <path d="M250 171C254 164 270 164 274 171C273 183 267 193 262 198C257 193 251 183 250 171Z" fill="#eea236" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M255 172C259 169 265 169 269 172" fill="none" stroke="#fbd488" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
});

function UpperWing({ mirror }: { mirror?: boolean }) {
  return (
    <g transform={mirror ? "scale(-1 1)" : undefined}>
      <path d="M-17-9C-27 14-22 42-8 58L12 56C24 38 22 8 15-11C6-18-9-17-17-9Z" fill="#ad6f38" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M-11 12c5 4 12 4 18 0M-11 28c5 4 12 4 18 0M-7 43c4 3 9 3 13 0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
    </g>
  );
}

function ForeWing({ mirror }: { mirror?: boolean }) {
  return (
    <g transform={mirror ? "scale(-1 1)" : undefined}>
      <path
        d="M-14-7C-21 18-18 44-12 60C-9 69-3 66-2 58C-1 70 6 71 8 61C11 67 17 64 16 54C21 32 20 8 14-7C6-13-7-13-14-7Z"
        fill="#bd7f41"
        stroke={INK}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M-15 40C-6 46 8 46 18 40C18 46 17 50 16 54C11 64 11 67 8 61C6 71-1 70-2 58C-3 66-9 69-12 60C-13 54-14 47-15 40Z" fill={CREAM} />
      <path d="M-2 58C-3 50-3 46-3 42M8 61C9 54 9 50 9 44" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-14 40C-6 46 8 46 18 40" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-14-7C-21 18-18 44-12 60C-9 69-3 66-2 58C-1 70 6 71 8 61C11 67 17 64 16 54C21 32 20 8 14-7C6-13-7-13-14-7Z" fill="none" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
    </g>
  );
}

function Wing({ side }: { side: "l" | "r" }) {
  const mirror = side === "r";
  return (
    <g data-owl={`wing-${side}`}>
      <g data-owl={`fore-${side}`}>
        <ForeWing mirror={mirror} />
      </g>
      <UpperWing mirror={mirror} />
    </g>
  );
}

function HeldCard({ name, withMark }: { name: string; withMark?: boolean }) {
  return (
    <g data-owl={name} display="none">
      <g data-owl={`${name}-front`}>
        <rect data-owl={`${name}-paper`} x="-33" y="-22" width="66" height="44" rx="2.500" fill="#f2c14e" stroke={INK} strokeWidth="2.4" />
        <rect x="-27" y="-16" width="26" height="32" rx="1" fill="#fbfaf4" stroke={INK} strokeWidth="1.5" />
        <circle cx="-14" cy="-5" r="6.500" fill="#b97d50" stroke={INK} strokeWidth="1.5" />
        <path d="M-24 15C-22 5-6 5-4 15Z" fill="#3f7c82" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M4-11H26M4-3H26M4 5H19" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      </g>
      <g data-owl={`${name}-back`} display="none">
        <rect x="-33" y="-22" width="66" height="44" rx="2.500" fill="#fbf5e6" stroke={INK} strokeWidth="2.4" />
        <path d="M0-17V17" stroke={INK} strokeWidth="1.4" opacity="0.4" />
        <path d="M-27-10H-6M-27-2H-6M-27 6H-11" stroke="#1f2c8f" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
        <rect x="14" y="-17" width="14" height="17" fill="#e9a6a6" stroke={INK} strokeWidth="1.4" />
        <path d="M5 8H28M5 15H24" stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
        {withMark && (
          <g data-owl="card-mark" display="none" fill="none" stroke={RED} strokeWidth="2">
            <circle cx="9" cy="-6" r="10" />
            <circle cx="9" cy="-6" r="6" />
            <path d="M15-14 32-12M17-9 34-7M17-3 34-1" strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
}

/** The parts drawn in front of the desk: wings, whatever the owl is holding, the cup and the stamp. */
export const OwlHands = memo(function OwlHands() {
  const { cup, stamp } = PROP_HOMES;
  return (
    <svg className="scene-layer scene-layer-hands" viewBox="0 0 560 480">
      <g data-owl="stamp" transform={`translate(${stamp.x} ${stamp.y})`}>
        <path d="M-11 12H11L13 18H-13Z" fill={RED} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M-5 12 -3-2H3L5 12Z" fill="#8a5a33" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="0" cy="-9" r="8.500" fill="#a8743f" stroke={INK} strokeWidth="2.2" />
        <path d="M-4-12C-2-14 1-14 3-13" fill="none" stroke="#e2bd85" strokeWidth="2" strokeLinecap="round" />
      </g>

      <g data-owl="cup" transform={`translate(${cup.x} ${cup.y})`}>
        <g className="cup-steam" fill="none" stroke="#f4e3c8" strokeWidth="2" strokeLinecap="round">
          <path d="M-5-22C-9-28-1-32-5-40" />
          <path d="M6-20C2-27 10-31 6-38" />
        </g>
        <path d="M-13-15H13L10 13C9 16-9 16-10 13Z" fill="#cfe3ea" fillOpacity="0.5" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M-12-9H12L10 12C9 14-9 14-10 12Z" fill="#b5692c" />
        <path d="M-12-9C-6-6 6-6 12-9" fill="none" stroke="#e8b878" strokeWidth="2" />
        <path d="M-5-4-4 10M3-5 3 10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
        <path d="M-13-15H13L10 13C9 16-9 16-10 13Z" fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      </g>

      <HeldCard name="card" withMark />
      <HeldCard name="card2" />

      <g data-owl="spark" opacity="0">
        <path d="M262 214 267 232 285 237 267 242 262 260 257 242 239 237 257 232Z" fill="#ffe08c" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </g>

      <Wing side="l" />
      <Wing side="r" />
    </svg>
  );
});
