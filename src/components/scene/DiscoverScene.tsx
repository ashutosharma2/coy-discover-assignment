"use client";

import { useMotionValueEvent, useReducedMotion, type MotionValue } from "motion/react";
import { memo, useEffect, useRef } from "react";
import type { SavedSwipe } from "@/lib/client/deck";
import { reactionFor } from "@/lib/client/mascot";
import { ChartArt } from "./ChartArt";
import { DeskArt } from "./DeskArt";
import { MascotDirector } from "./director";

interface DiscoverSceneProps {
  active: boolean;
  /** True while a swipe is being saved. */
  saving: boolean;
  lastSaved: SavedSwipe | null;
  matchOpen: boolean;
  dragProgress: MotionValue<number>;
}

/**
 * The illustrated world behind the deck. It receives only the user's own swipe results,
 * never a profile, so nothing here can depend on who has liked the user.
 */
export const DiscoverScene = memo(function DiscoverScene({ active, saving, lastSaved, matchOpen, dragProgress }: DiscoverSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const director = useRef<MascotDirector | null>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const handledSeq = useRef(0);
  const matchWasOpen = useRef(false);

  useEffect(() => {
    if (!root.current) return;
    const scene = new MascotDirector(root.current, reducedMotion);
    director.current = scene;
    return () => scene.stop();
  }, [reducedMotion]);

  useEffect(() => {
    const scene = director.current;
    if (!scene) return;
    const sync = () => scene.setActive(active && !document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [active, reducedMotion]);

  useEffect(() => {
    const scene = director.current;
    if (!scene || !active) return;
    if (saving) {
      scene.wait();
    } else if (lastSaved && lastSaved.seq !== handledSeq.current) {
      handledSeq.current = lastSaved.seq;
      void scene.react(reactionFor(lastSaved.action, lastSaved.matched));
    } else {
      scene.resume();
    }
  }, [active, saving, lastSaved]);

  useEffect(() => {
    if (matchWasOpen.current && !matchOpen) void director.current?.react("celebrate");
    matchWasOpen.current = matchOpen;
  }, [matchOpen]);

  useMotionValueEvent(dragProgress, "change", (value) => {
    root.current?.style.setProperty("--drag", value.toFixed(3));
  });

  return (
    <div ref={root} className={active ? "scene" : "scene scene-off"} data-pose="idle" aria-hidden="true">
      <div className="scene-stars scene-stars-far" />
      <div className="scene-stars scene-stars-near" />
      <ChartArt />
      <DeskArt />
      <div data-flyer="" className="scene-flyer" />
    </div>
  );
});
