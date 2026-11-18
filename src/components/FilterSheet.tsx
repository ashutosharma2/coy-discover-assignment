"use client";

import { useEffect, useRef } from "react";
import { NO_FILTERS, countFilters, filterChoices, filterProfiles, type DeckFilters } from "@/lib/client/filters";
import type { PublicProfile } from "@/lib/types";

interface FilterSheetProps {
  open: boolean;
  profiles: PublicProfile[];
  filters: DeckFilters;
  onChange: (filters: DeckFilters) => void;
  onClose: () => void;
}

const postcards = (count: number) => `${count} ${count === 1 ? "postcard" : "postcards"}`;

export function FilterSheet({ open, profiles, filters, onChange, onClose }: FilterSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // Start on the sheet itself, so nothing looks selected until the user moves.
      element.querySelector<HTMLElement>(".filter-panel")?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  const choices = filterChoices(profiles, filters);
  const showing = filterProfiles(profiles, filters).length;

  function toggleInterest(interest: string) {
    const interests = filters.interests.includes(interest)
      ? filters.interests.filter((item) => item !== interest)
      : [...filters.interests, interest];
    onChange({ ...filters, interests });
  }

  return (
    <dialog
      ref={dialog}
      className="filter-sheet"
      aria-labelledby="filter-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="filter-panel" tabIndex={-1}>
        <div className="filter-top">
          <h2 id="filter-title" className="filter-title">
            Narrow it down
          </h2>
          <button type="button" className="round-control round-control-paper" aria-label="Close filters" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <label className="filter-field">
          <span className="filter-label">Location</span>
          <select value={filters.city ?? ""} onChange={(event) => onChange({ ...filters, city: event.target.value || null })}>
            <option value="">Anywhere</option>
            {choices.cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span className="filter-label">Campus</span>
          <select value={filters.campus ?? ""} onChange={(event) => onChange({ ...filters, campus: event.target.value || null })}>
            <option value="">Any campus</option>
            {choices.campuses.map((campus) => (
              <option key={campus}>{campus}</option>
            ))}
          </select>
        </label>

        <fieldset className="filter-field">
          <legend className="filter-label">Interests</legend>
          <div className="filter-chips">
            {choices.interests.map((interest) => (
              <button
                key={interest}
                type="button"
                className="filter-chip"
                aria-pressed={filters.interests.includes(interest)}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="filter-actions">
          <button type="button" className="button button-quiet" disabled={countFilters(filters) === 0} onClick={() => onChange(NO_FILTERS)}>
            Clear
          </button>
          <button type="button" className="button button-ink" onClick={onClose}>
            Show {postcards(showing)}
          </button>
        </div>
      </div>
    </dialog>
  );
}
