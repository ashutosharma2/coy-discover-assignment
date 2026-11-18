import { REACTIONS, WAITING_POSE, nextRoutine, type Pose, type Reaction, type SceneEffect, type Step } from "@/lib/client/mascot";

/**
 * Runs the pigeon's routine by changing attributes on the scene. CSS does the movement, so
 * React doesn't redraw anything while the pigeon works.
 */
export class MascotDirector {
  private run = 0;
  private active = false;
  private lit = 0;
  private linked = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly reducedMotion: boolean,
  ) {}

  private pose(pose: Pose) {
    this.root.dataset.pose = pose;
  }

  private async play(steps: Step[], run: number): Promise<boolean> {
    for (const step of steps) {
      if (run !== this.run) return false;
      if (step.effect) this.apply(step.effect);
      if (this.reducedMotion) continue;
      this.pose(step.pose);
      await new Promise((resolve) => setTimeout(resolve, step.ms));
    }
    return run === this.run;
  }

  private async loop(run: number) {
    for (let turn = 0; run === this.run; turn++) {
      if (!(await this.play(nextRoutine(turn), run))) return;
    }
  }

  /** Goes back to sorting postcards. */
  resume() {
    const run = ++this.run;
    this.pose("idle");
    if (this.active && !this.reducedMotion) void this.loop(run);
  }

  setActive(active: boolean) {
    this.active = active;
    this.resume();
  }

  /** Studies the chart while a swipe is being saved. */
  wait() {
    this.run += 1;
    if (!this.reducedMotion) this.pose(WAITING_POSE);
  }

  async react(reaction: Reaction) {
    const run = ++this.run;
    if (await this.play(REACTIONS[reaction], run)) this.resume();
  }

  stop() {
    this.run += 1;
    this.active = false;
  }

  private apply(effect: SceneEffect) {
    if (effect === "fly") this.flyPostcard();
    if (effect === "light") this.lightStar();
    if (effect === "link") this.linkStars();
    if (effect === "heart") this.root.querySelector("[data-heart]")?.classList.add("is-on");
  }

  private stars() {
    return [...this.root.querySelectorAll<SVGGElement>("[data-star]")];
  }

  private lightStar() {
    const stars = this.stars();
    stars[this.lit % stars.length]?.classList.add("is-lit");
    this.lit += 1;
    this.linkStars();
  }

  private linkStars() {
    const links = [...this.root.querySelectorAll<SVGLineElement>("[data-link]")];
    links[this.linked % links.length]?.classList.add("is-on");
    this.linked += 1;
  }

  /** Sends a postcard from the desk to the next star on the chart. */
  private flyPostcard() {
    const flyer = this.root.querySelector<HTMLElement>("[data-flyer]");
    const from = this.root.querySelector("[data-hand]");
    const stars = this.stars();
    const to = stars[this.lit % stars.length];
    if (!flyer || !from || !to || this.reducedMotion) return;

    const box = this.root.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const [x0, y0] = [a.left + a.width / 2 - box.left, a.top + a.height / 2 - box.top];
    const [x1, y1] = [b.left + b.width / 2 - box.left, b.top + b.height / 2 - box.top];
    const lift = Math.min(y0, y1) - 34;

    flyer.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) rotate(-8deg) scale(1)`, opacity: 1, offset: 0 },
        { transform: `translate(${(x0 + x1) / 2}px, ${lift}px) rotate(10deg) scale(0.9)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x1}px, ${y1}px) rotate(0deg) scale(0.25)`, opacity: 0, offset: 1 },
      ],
      { duration: 900, easing: "cubic-bezier(.45,.05,.3,1)" },
    );
  }
}
