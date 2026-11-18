import { useId } from "react";

export function postmarkDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    .format(date)
    .toUpperCase();
}

interface PostmarkProps {
  label: string;
  city: string;
  date: string;
  className?: string;
  /** Skips the rough ink edge, for a small mark that sits on every card. */
  plain?: boolean;
}

/** A round rubber-stamp cancellation, drawn in the current text colour. */
export function Postmark({ label, city, date, className, plain }: PostmarkProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const labelSize = label.length > 4 ? 32 : 42;

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <filter id={`${id}ink`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="3" />
        </filter>
        <path id={`${id}top`} d="M 32 100 A 68 68 0 0 1 168 100" />
        <path id={`${id}bottom`} d="M 16 100 A 84 84 0 0 0 184 100" />
      </defs>
      <g filter={plain ? undefined : `url(#${id}ink)`} fontFamily="var(--font-manrope), sans-serif" fontWeight="800">
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="100" cy="100" r="57" fill="none" stroke="currentColor" strokeWidth="3" />
        <text fill="currentColor" fontSize="17" letterSpacing="1.5">
          <textPath href={`#${id}top`} startOffset="50%" textAnchor="middle">
            {city.toUpperCase()}
          </textPath>
        </text>
        <text fill="currentColor" fontSize="17" letterSpacing="1.5">
          <textPath href={`#${id}bottom`} startOffset="50%" textAnchor="middle">
            {date}
          </textPath>
        </text>
        <text x="100" y={100 + labelSize * 0.36} fill="currentColor" fontSize={labelSize} textAnchor="middle">
          {label}
        </text>
      </g>
    </svg>
  );
}
