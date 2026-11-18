"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { PublicProfile } from "@/lib/types";
import { InterestChips, ProfilePlace } from "./ProfileBits";

interface PostcardSheetProps {
  profile: PublicProfile | null;
  /** A short handwritten line, such as when a match happened. */
  note?: string;
  onClose: () => void;
}

/** The whole postcard: everything a small card has to leave out. */
export function PostcardSheet({ profile, note, onClose }: PostcardSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = profile !== null;

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

  return (
    <dialog
      ref={dialog}
      className="filter-sheet"
      aria-labelledby="postcard-name"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      {profile && (
        <div className="filter-panel postcard-panel" tabIndex={-1}>
          <button type="button" className="round-control round-control-paper postcard-close" aria-label="Close postcard" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

          <div className="postcard-portrait">
            <div className="stamp">
              <div className="stamp-photo">
                <Image src={profile.avatarUrl} alt={`Illustrated portrait of ${profile.name}`} width={640} height={800} draggable={false} />
              </div>
            </div>
          </div>

          <h2 id="postcard-name" className="postcard-name">
            {profile.name}
            <span className="letter-age">{profile.age}</span>
          </h2>
          {note && <p className="postcard-note">{note}</p>}
          <ProfilePlace city={profile.city} college={profile.college} />
          <p className="postcard-bio">{profile.bio}</p>
          <InterestChips interests={profile.interests} />
        </div>
      )}
    </dialog>
  );
}
