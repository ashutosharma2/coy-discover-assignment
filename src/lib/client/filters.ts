import type { PublicProfile } from "../types";

/** Filters use only fields already shown on the card, so they can't reveal who liked whom. */
export interface DeckFilters {
  city: string | null;
  campus: string | null;
  interests: string[];
}

export const NO_FILTERS: DeckFilters = { city: null, campus: null, interests: [] };

/** How many interests the filter sheet offers at once. */
const INTEREST_CHOICES = 12;

export function filterProfiles(profiles: PublicProfile[], filters: DeckFilters): PublicProfile[] {
  return profiles.filter(
    (profile) =>
      (filters.city === null || profile.city === filters.city) &&
      (filters.campus === null || profile.college === filters.campus) &&
      (filters.interests.length === 0 || filters.interests.some((interest) => profile.interests.includes(interest))),
  );
}

export function countFilters(filters: DeckFilters): number {
  return (filters.city ? 1 : 0) + (filters.campus ? 1 : 0) + filters.interests.length;
}

const alphabetical = (a: string, b: string) => a.localeCompare(b, "en");

/** The choices worth offering: what is left in the deck, plus anything already selected. */
export function filterChoices(profiles: PublicProfile[], filters: DeckFilters) {
  const cities = new Set(profiles.map((profile) => profile.city));
  const campuses = new Set(profiles.flatMap((profile) => (profile.college ? [profile.college] : [])));
  if (filters.city) cities.add(filters.city);
  if (filters.campus) campuses.add(filters.campus);

  const counts = new Map<string, number>();
  for (const profile of profiles) {
    for (const interest of profile.interests) counts.set(interest, (counts.get(interest) ?? 0) + 1);
  }
  const popular = [...counts.keys()]
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || alphabetical(a, b))
    .slice(0, INTEREST_CHOICES);

  return {
    cities: [...cities].sort(alphabetical),
    campuses: [...campuses].sort(alphabetical),
    interests: [...new Set([...filters.interests, ...popular])],
  };
}
