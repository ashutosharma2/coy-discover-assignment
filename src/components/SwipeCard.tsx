"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import { useImperativeHandle, useMemo, useRef, type Ref } from "react";
import { swipeFromDrag } from "@/lib/client/deck";
import type { PublicProfile, SwipeAction } from "@/lib/types";
import { Postmark, postmarkDate } from "./Postmark";
import { StampAvatar } from "./StampAvatar";

export interface SwipeCardHandle {
  /** Sends the card off screen. Resolves when it has gone. */
  fly: (action: SwipeAction) => Promise<void>;
  /** Brings the card back to the middle after a swipe that couldn't be confirmed. */
  comeBack: () => void;
}

interface SwipeCardProps {
  profile: PublicProfile;
  isTop: boolean;
  locked: boolean;
  onSwipe: (action: SwipeAction) => void;
  dragProgress: MotionValue<number>;
  ref?: Ref<SwipeCardHandle>;
}

const SPRING_BACK = { type: "spring", stiffness: 420, damping: 32 } as const;
const inkFor = (distance: number) => Math.min(Math.max((distance - 24) / 90, 0), 1);
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SwipeCard({ profile, isTop, locked, onSwipe, dragProgress, ref }: SwipeCardProps) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);

  // Motion values update the card directly, without redrawing React on every pointer move.
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 320], reduceMotion ? [0, 0] : [-14, 14]);
  const opacity = useMotionValue(1);
  const likeInk = useMotionValue(0);
  const passInk = useMotionValue(0);

  useMotionValueEvent(x, "change", (value) => {
    likeInk.set(inkFor(value));
    passInk.set(inkFor(-value));
    if (isTop) dragProgress.set(Math.max(-1, Math.min(1, value / 320)));
  });

  useImperativeHandle(
    ref,
    () => ({
      async fly(action) {
        const direction = action === "like" ? 1 : -1;
        if (reduceMotion) {
          (action === "like" ? likeInk : passInk).set(1);
          await pause(250);
          await animate(opacity, 0, { duration: 0.2 });
          return;
        }
        // A button press has no drag, so show the postmark before the card leaves.
        if (Math.abs(x.get()) < 120) {
          await animate(x, direction * 130, { duration: 0.16, ease: "easeOut" });
          await pause(140);
        }
        await animate(x, direction * (window.innerWidth + 420), { duration: 0.32, ease: "easeIn" });
      },
      comeBack() {
        opacity.set(1);
        likeInk.set(0);
        passInk.set(0);
        void animate(x, 0, reduceMotion ? { duration: 0 } : SPRING_BACK);
      },
    }),
    [likeInk, opacity, passInk, reduceMotion, x],
  );

  function handleDragEnd(_event: unknown, info: PanInfo) {
    const width = cardRef.current?.offsetWidth ?? 320;
    const action = swipeFromDrag(info.offset.x, info.velocity.x, width);
    if (action) onSwipe(action);
    else void animate(x, 0, SPRING_BACK);
  }

  const today = useMemo(() => postmarkDate(new Date()), []);

  return (
    <motion.div
      className="deck-slot"
      initial={reduceMotion ? false : { scale: 0.92, y: 22, opacity: 0 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 14, opacity: 1 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 }}
      aria-hidden={!isTop}
      inert={!isTop}
    >
      <motion.article
        ref={cardRef}
        className="letter"
        style={{ x, rotate, opacity }}
        drag={isTop && !locked ? "x" : false}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        aria-label={`${profile.name}, ${profile.age}`}
      >
        <div className="letter-stamp">
          <StampAvatar src={profile.avatarUrl} name={profile.name} />
        </div>
        <div>
          <p className="letter-to">To,</p>
          <h2 className="letter-name">
            {profile.name}
            <span className="letter-age">{profile.age}</span>
          </h2>
          <p className="letter-place">
            {profile.college && <span className="letter-college">{profile.college}</span>}
            <span>{profile.city}</span>
          </p>
        </div>
        <p className="letter-bio">{profile.bio}</p>
        <ul className="letter-interests">
          {profile.interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>

        <motion.div className="letter-mark letter-mark-like" style={{ opacity: likeInk }}>
          <Postmark label="LIKE" city={profile.city} date={today} />
        </motion.div>
        <motion.div className="letter-mark letter-mark-pass" style={{ opacity: passInk }}>
          <Postmark label="PASS" city={profile.city} date={today} />
        </motion.div>
      </motion.article>
    </motion.div>
  );
}
