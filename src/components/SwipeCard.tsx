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
import Image from "next/image";
import { useImperativeHandle, useMemo, useRef, type PointerEvent, type Ref } from "react";
import { swipeFromDrag } from "@/lib/client/deck";
import type { PublicProfile, SwipeAction } from "@/lib/types";
import { Postmark, postmarkDate } from "./Postmark";
import { InterestChips, ProfilePlace } from "./ProfileBits";

export interface SwipeCardHandle {
  /** Sends the card off screen. Resolves when it has gone. */
  fly: (action: SwipeAction, speed?: { x: number; y: number }) => Promise<void>;
  /** Brings the card back to the middle after a swipe that couldn't be confirmed. */
  comeBack: () => void;
}

interface SwipeCardProps {
  profile: PublicProfile;
  /** 0 is the active card, 1 and 2 wait behind it. */
  depth: number;
  locked: boolean;
  onSwipe: (action: SwipeAction, speed: { x: number; y: number }) => void;
  /** Opens the whole postcard. */
  onRead: () => void;
  dragProgress: MotionValue<number>;
  ref?: Ref<SwipeCardHandle>;
}

const SPRING_BACK = { type: "spring", stiffness: 380, damping: 28 } as const;
const STACK_SPRING = { type: "spring", stiffness: 300, damping: 28 } as const;
const MAX_TILT = 24;

const inkFor = (distance: number) => Math.min(Math.max((distance - 24) / 90, 0), 1);
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SwipeCard({ profile, depth, locked, onSwipe, onRead, dragProgress, ref }: SwipeCardProps) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const isTop = depth === 0;

  // Motion values update the card directly, without redrawing React on every pointer move.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const grip = useMotionValue(1);
  const opacity = useMotionValue(1);
  const likeInk = useMotionValue(0);
  const passInk = useMotionValue(0);

  // Held near the top a card swings one way, held near the bottom it swings the other.
  const rotate = useTransform([x, grip], ([offset, side]: number[]) => {
    if (reduceMotion) return 0;
    const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, (offset / 320) * 15));
    return tilt * side;
  });
  const likeScale = useTransform(likeInk, [0, 1], [1.5, 1]);
  const passScale = useTransform(passInk, [0, 1], [1.5, 1]);
  const lift = useTransform(dragProgress, [-1, 0, 1], reduceMotion ? [1, 1, 1] : [1.025, 1, 1.025]);

  useMotionValueEvent(x, "change", (value) => {
    likeInk.set(inkFor(value));
    passInk.set(inkFor(-value));
    if (isTop) dragProgress.set(Math.max(-1, Math.min(1, value / 320)));
  });

  useImperativeHandle(
    ref,
    () => ({
      async fly(action, speed = { x: 0, y: 0 }) {
        const direction = action === "like" ? 1 : -1;
        if (reduceMotion) {
          (action === "like" ? likeInk : passInk).set(1);
          await pause(250);
          await animate(opacity, 0, { duration: 0.2 });
          return;
        }
        // A button press has no drag, so show the postmark before the card leaves.
        if (Math.abs(x.get()) < 120) {
          await animate(x, direction * 130, { type: "spring", stiffness: 420, damping: 26 });
          await pause(90);
        }
        const width = cardRef.current?.offsetWidth ?? 360;
        const flight = { duration: 0.36, ease: [0.32, 0, 0.75, 0.55] as const };
        await Promise.all([
          animate(x, direction * (window.innerWidth / 2 + width + 120), flight),
          animate(y, y.get() + Math.max(-140, Math.min(140, speed.y * 0.16)) - 36, flight),
        ]);
      },
      comeBack() {
        opacity.set(1);
        likeInk.set(0);
        passInk.set(0);
        void animate(x, 0, reduceMotion ? { duration: 0 } : SPRING_BACK);
        void animate(y, 0, reduceMotion ? { duration: 0 } : SPRING_BACK);
      },
    }),
    [likeInk, opacity, passInk, reduceMotion, x, y],
  );

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    grip.set(event.clientY < box.top + box.height * 0.6 ? 1 : -1);
  }

  function handleDragEnd(_event: unknown, info: PanInfo) {
    const width = cardRef.current?.offsetWidth ?? 320;
    const action = swipeFromDrag(info.offset.x, info.velocity.x, width);
    if (action) {
      onSwipe(action, info.velocity);
    } else {
      void animate(x, 0, SPRING_BACK);
      void animate(y, 0, SPRING_BACK);
    }
  }

  const today = useMemo(() => postmarkDate(new Date()), []);

  return (
    <motion.div
      className="deck-slot"
      data-depth={depth}
      initial={reduceMotion ? false : { scale: 1 - (depth + 1) * 0.05, y: (depth + 1) * 10, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 10, opacity: 1 }}
      transition={reduceMotion ? { duration: 0 } : STACK_SPRING}
      aria-hidden={!isTop}
      inert={!isTop}
    >
      <motion.div className="deck-lift" style={{ scale: lift }}>
        <motion.article
          ref={cardRef}
          className="letter"
          style={{ x, y, rotate, opacity }}
          drag={isTop && !locked}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.2, bottom: 0.2 }}
          dragMomentum={false}
          onPointerDown={handlePointerDown}
          onDragEnd={handleDragEnd}
          aria-label={`${profile.name}, ${profile.age}`}
        >
          <div className="letter-stamp">
            <div className="stamp">
              <div className="stamp-photo">
                <Image
                  src={profile.avatarUrl}
                  alt={`Illustrated portrait of ${profile.name}`}
                  width={640}
                  height={800}
                  loading="eager"
                  draggable={false}
                />
                <Postmark className="letter-cancel" label={today.slice(0, 2)} city={profile.city} date={today} plain />
                <div className="letter-plate">
                  <h2 className="letter-name">
                    {profile.name}
                    <span className="letter-age">{profile.age}</span>
                  </h2>
                  <button
                    type="button"
                    className="letter-more"
                    aria-label={`Read ${profile.name}'s full postcard`}
                    onClick={() => {
                      // Letting go after a small drag shouldn't open the postcard.
                      if (Math.abs(x.get()) < 6) onRead();
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="5.500" r="2.200" />
                      <path d="M9.500 10h4.200v8.500H16V21H8v-2.500h2.700v-6H9.500Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="letter-body">
            <ProfilePlace city={profile.city} college={profile.college} />
            <p className="letter-bio">{profile.bio}</p>
            <InterestChips interests={profile.interests} />
          </div>

          <motion.div className="letter-wash letter-wash-like" style={{ opacity: likeInk }} />
          <motion.div className="letter-wash letter-wash-pass" style={{ opacity: passInk }} />
          <motion.div className="letter-mark letter-mark-like" style={{ opacity: likeInk, scale: likeScale }}>
            <Postmark label="LIKE" city={profile.city} date={today} />
          </motion.div>
          <motion.div className="letter-mark letter-mark-pass" style={{ opacity: passInk, scale: passScale }}>
            <Postmark label="PASS" city={profile.city} date={today} />
          </motion.div>
        </motion.article>
      </motion.div>
    </motion.div>
  );
}
