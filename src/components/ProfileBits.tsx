/** Gives an interest the same colour everywhere it appears. */
function chipTone(interest: string) {
  let total = 0;
  for (const letter of interest) total += letter.charCodeAt(0);
  return total % 5;
}

export function ProfilePlace({ city, college }: { city: string; college: string | null }) {
  return (
    <ul className="letter-place">
      <li>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M12 2a7.500 7.500 0 0 0-7.500 7.500C4.500 15 12 22 12 22s7.500-7 7.500-12.500A7.500 7.500 0 0 0 12 2Zm0 10.200a2.700 2.700 0 1 1 0-5.400 2.700 2.700 0 0 1 0 5.400Z" />
        </svg>
        {city}
      </li>
      {college && (
        <li>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M12 3 1.500 8.500 12 14l8.500-4.500V16H22V8.500L12 3ZM5.500 13.200V17c0 1.800 3 3.500 6.500 3.500s6.500-1.700 6.500-3.500v-3.800L12 16.600l-6.500-3.400Z" />
          </svg>
          <span className="letter-college">{college}</span>
        </li>
      )}
    </ul>
  );
}

export function InterestChips({ interests }: { interests: string[] }) {
  return (
    <ul className="letter-interests">
      {interests.map((interest) => (
        <li key={interest} className={`chip-${chipTone(interest)}`}>
          {interest}
        </li>
      ))}
    </ul>
  );
}
