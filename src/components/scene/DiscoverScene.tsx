"use client";

import { useMotionValueEvent, useReducedMotion, type MotionValue } from "motion/react";
import { memo, useEffect, useRef } from "react";
import type { SavedSwipe } from "@/lib/client/deck";
import { reactionFor } from "@/lib/client/mascot";
import { BoardArt } from "./BoardArt";
import { DeskBack, DeskFront } from "./DeskArt";
import { MascotDirector } from "./director";
import { OwlBody, OwlHands } from "./OwlArt";
import { RoomArt } from "./RoomArt";

interface DiscoverSceneProps {
  active: boolean;
  /** True while a swipe is being saved. */
  saving: boolean;
  lastSaved: SavedSwipe | null;
  /** Counts the swipes that couldn't be confirmed. */
  returned: number;
  /** Counts how many times the user has started over. */
  resets: number;
  matchOpen: boolean;
  dragProgress: MotionValue<number>;
}

/**
 * The illustrated world behind the deck. It receives only the user's own swipe results,
 * never a profile, so nothing here can depend on who has liked the user.
 */
export const DiscoverScene = memo(function DiscoverScene({ active, saving, lastSaved, returned, resets, matchOpen, dragProgress }: DiscoverSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const director = useRef<MascotDirector | null>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const handledSeq = useRef(0);
  const handledReturn = useRef(0);
  const handledReset = useRef(0);
  const wasSaving = useRef(false);
  const matchWasOpen = useRef(false);

  useEffect(() => {
    if (!root.current) return;
    const scene = new MascotDirector(root.current, reducedMotion);
    director.current = scene;
    const observer = new ResizeObserver(() => scene.layout());
    observer.observe(root.current);
    return () => {
      observer.disconnect();
      scene.stop();
    };
  }, [reducedMotion]);

  useEffect(() => {
    const scene = director.current;
    if (!scene) return;
    const sync = () => {
      scene.setActive(active && !document.hidden);
      scene.layout();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [active, reducedMotion]);

  // This runs before the effect below, so counters that restart at zero don't look like new events.
  useEffect(() => {
    if (resets === handledReset.current) return;
    handledReset.current = resets;
    handledSeq.current = 0;
    handledReturn.current = 0;
    director.current?.clearBoard();
  }, [resets]);

  useEffect(() => {
    const scene = director.current;
    if (!scene || !active) return;
    const finishedSaving = wasSaving.current && !saving;
    wasSaving.current = saving;

    if (saving) {
      scene.wait();
    } else if (lastSaved && lastSaved.seq !== handledSeq.current) {
      handledSeq.current = lastSaved.seq;
      void scene.react(reactionFor(lastSaved.action, lastSaved.matched));
    } else if (returned !== handledReturn.current) {
      handledReturn.current = returned;
      void scene.react("putBack");
    } else if (finishedSaving) {
      scene.resume();
    }
  }, [active, saving, lastSaved, returned]);

  useEffect(() => {
    if (matchWasOpen.current && !matchOpen) void director.current?.react("celebrate");
    matchWasOpen.current = matchOpen;
  }, [matchOpen]);

  useMotionValueEvent(dragProgress, "change", (value) => {
    root.current?.style.setProperty("--drag", value.toFixed(3));
    director.current?.setDrag(value);
  });

  return (
    <div ref={root} className={active ? "scene" : "scene scene-off"} aria-hidden="true">
      <RoomArt />
      <svg className="scene-thread">
        <path data-thread="line" className="thread-line" />
        <path data-thread="spark" className="thread-spark" pathLength="1" />
      </svg>
      <BoardArt />
      <div className="scene-bench">
        <div className="scene-desk">
          <DeskBack />
          <OwlBody />
          <div className="scene-shelf" />
          <DeskFront />
          <OwlHands />
        </div>
      </div>
      <div data-arrival="" className="scene-postcard scene-arrival" />
      <div data-flyer="" className="scene-postcard scene-flyer" />
    </div>
  );
});
