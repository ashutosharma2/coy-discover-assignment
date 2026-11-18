"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import type { PublicProfile } from "@/lib/types";
import { Postmark, postmarkDate } from "./Postmark";
import { StampAvatar } from "./StampAvatar";

interface MatchScreenProps {
  profile: PublicProfile;
  onKeepSwiping: () => void;
  onSeeMatches: () => void;
}

export function MatchScreen({ profile, onKeepSwiping, onSeeMatches }: MatchScreenProps) {
  const reduceMotion = useReducedMotion();
  const keepSwiping = useRef<HTMLButtonElement>(null);
  const today = useMemo(() => postmarkDate(new Date()), []);

  useEffect(() => {
    keepSwiping.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onKeepSwiping();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeepSwiping]);

  return (
    <motion.div
      className="match"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="match-stamp">
        <StampAvatar src={profile.avatarUrl} name={profile.name} />
        <motion.div
          className="match-mark"
          initial={reduceMotion ? false : { scale: 2.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.18, ease: "easeIn" }}
        >
          <Postmark label="MATCH" city={profile.city} date={today} />
        </motion.div>
      </div>

      <h2 id="match-title" className="match-title">
        It&apos;s a match!
      </h2>
      <p className="match-text">You and {profile.name} liked each other.</p>

      <div className="match-actions">
        <button ref={keepSwiping} type="button" className="button button-paper" onClick={onKeepSwiping}>
          Keep swiping
        </button>
        <button type="button" className="button button-outline" onClick={onSeeMatches}>
          See matches
        </button>
      </div>
    </motion.div>
  );
}
