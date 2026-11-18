import { memo } from "react";

const INK = "#18120f";

/** An arched window onto the night outside. */
const RoomWindow = memo(function RoomWindow() {
  const arch = "M22 292V112C22 54 62 16 110 16C158 16 198 54 198 112V292Z";
  return (
    <svg className="scene-window" viewBox="0 0 220 320">
      <defs>
        <linearGradient id="window-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101a63" />
          <stop offset="0.7" stopColor="#2c3a9c" />
          <stop offset="1" stopColor="#6a59a8" />
        </linearGradient>
        <linearGradient id="window-day-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fa8ea" />
          <stop offset="0.75" stopColor="#a9d8f5" />
          <stop offset="1" stopColor="#fbe7bd" />
        </linearGradient>
        <clipPath id="window-glass">
          <path d={arch} />
        </clipPath>
      </defs>

      <path d="M10 300V110C10 44 56 4 110 4C164 4 210 44 210 110V300Z" fill="#4a2c18" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={arch} fill="url(#window-sky)" stroke={INK} strokeWidth="2.6" />

      <g clipPath="url(#window-glass)">
        <g className="window-night">
          <circle cx="136" cy="84" r="46" fill="#ffe9b0" opacity="0.1" />
          <path d="M148 56A32 32 0 1 0 148 112A25 25 0 1 1 148 56Z" fill="#ffe9b0" />
          <g fill="#f4e6b8">
            <circle cx="58" cy="82" r="1.800" />
            <circle cx="84" cy="48" r="1.400" />
            <circle cx="172" cy="150" r="1.600" />
            <circle cx="50" cy="146" r="1.300" />
            <circle cx="104" cy="128" r="1.500" />
          </g>
          <g className="window-cloud" fill="#3b49ab" opacity="0.85">
            <path d="M-20 196C-16 184 2 182 10 190C20 180 40 182 44 194C54 194 60 200 60 204H-30C-30 200-26 196-20 196Z" />
            <path d="M120 174C124 164 140 162 146 170C154 162 172 164 176 174C184 174 190 178 190 182H112C112 178 116 174 120 174Z" />
          </g>
          <path d="M0 300V256H30V240C30 226 44 216 54 212C64 216 78 226 78 240V256H100V236H130V222H160V244H182V232H230V300Z" fill="#0b1149" />
          <g fill="#f2c14e">
            <rect x="108" y="246" width="5" height="7" />
            <rect x="140" y="234" width="5" height="7" />
            <rect x="196" y="244" width="5" height="7" />
          </g>
        </g>

        <g className="window-day">
          <rect x="0" y="0" width="220" height="300" fill="url(#window-day-sky)" />
          <circle cx="142" cy="82" r="44" fill="#fff3bf" opacity="0.5" />
          <circle cx="142" cy="82" r="25" fill="#ffd65c" stroke="#f2a93b" strokeWidth="3" />
          <g className="window-cloud" fill="#ffffff">
            <path d="M-20 196C-16 184 2 182 10 190C20 180 40 182 44 194C54 194 60 200 60 204H-30C-30 200-26 196-20 196Z" />
            <path d="M120 174C124 164 140 162 146 170C154 162 172 164 176 174C184 174 190 178 190 182H112C112 178 116 174 120 174Z" />
          </g>
          <path d="M0 300V256H30V240C30 226 44 216 54 212C64 216 78 226 78 240V256H100V236H130V222H160V244H182V232H230V300Z" fill="#5f7fb8" />
          <g fill="#dbe7fb">
            <rect x="108" y="246" width="5" height="7" />
            <rect x="140" y="234" width="5" height="7" />
            <rect x="196" y="244" width="5" height="7" />
          </g>
        </g>
      </g>

      <g fill="none" stroke="#4a2c18" strokeWidth="6">
        <path d="M110 16V292M22 172H198" />
      </g>
      <g fill="none" stroke={INK} strokeWidth="1.4" opacity="0.7">
        <path d="M107 18V290M113 18V290M24 169H196M24 175H196" />
      </g>
      <rect x="0" y="298" width="220" height="16" rx="3" fill="#6f4426" stroke={INK} strokeWidth="2.8" />
      <path d="M6 303H214" stroke="#a8743f" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
});

/** A red pillar box standing on the floor under the board. */
const PostBox = memo(function PostBox() {
  return (
    <svg className="scene-postbox" viewBox="0 0 120 224">
      <ellipse cx="60" cy="218" rx="54" ry="5" fill="#05082b" opacity="0.55" />
      <rect x="20" y="192" width="80" height="24" rx="2" fill="#23140b" stroke={INK} strokeWidth="2.6" />
      <path d="M24 64H96V194H24Z" fill="#b5212a" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M24 64H42V194H24Z" fill="#8d141b" />
      <path d="M84 64H96V194H84Z" fill="#d3383f" opacity="0.7" />
      <path d="M16 64C16 28 34 8 60 8C86 8 104 28 104 64Z" fill="#c1242d" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M30 42C36 28 46 20 60 18" fill="none" stroke="#ef7b7f" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="12" y="62" width="96" height="12" rx="2" fill="#a81b24" stroke={INK} strokeWidth="2.6" />
      <rect x="36" y="88" width="48" height="11" rx="2" fill="#23140b" stroke={INK} strokeWidth="2.2" />
      <path d="M32 86H88" stroke="#7c0f16" strokeWidth="5" strokeLinecap="round" />
      <rect x="38" y="118" width="44" height="58" rx="3" fill="none" stroke="#7c0f16" strokeWidth="3" />
      <circle cx="74" cy="148" r="3.500" fill="#dcae47" stroke={INK} strokeWidth="1.5" />
    </svg>
  );
});

/** The room itself: the wall, the window, the panelling and the floor. */
export const RoomArt = memo(function RoomArt() {
  return (
    <>
      <div className="scene-wall" />
      <RoomWindow />
      <div className="scene-panelling" />
      <div className="scene-floor" />
      <PostBox />
    </>
  );
});
