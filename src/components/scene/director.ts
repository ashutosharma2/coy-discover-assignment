import {
  BODIES,
  CARD_SPOTS,
  LOOKS,
  MOODS,
  OPENING,
  PILES,
  PUT_DOWN,
  QUICK_PICK,
  REACTIONS,
  WAITING,
  createRoutine,
  pileTop,
  type Beat,
  type CardSpot,
  type Reaction,
  type SceneEffect,
} from "@/lib/client/mascot";
import { OwlPuppet } from "./owl-puppet";

const CARD_COLORS = ["#f2c14e", "#e9a6a6", "#8fb8de", "#9cc5a1", "#c9b6e4", "#f4a259"];

/** How long the heart stays on the board after the match screen closes. */
const HEART_LINGER_MS = 9000;
const THREAD_DROOP = 46;

/** Effects that leave something behind, so they still count when motion is turned off. */
const LASTING: SceneEffect[] = ["fly", "align", "settle"];

/**
 * Runs the owl's day: it plays beats one after another and looks after the postcards, the
 * board and the thread. It knows about swipes only through the reactions it is given.
 */
export class MascotDirector {
  private readonly puppet: OwlPuppet;
  private readonly nextRoutine = createRoutine();
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private run = 0;
  private active = false;
  private holding = false;
  private inbox = 5;
  private outbox = 5;
  private tray = 3;
  private pinned = 0;
  private lit = 0;
  private colorTurn = 0;
  private heartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly reducedMotion: boolean,
  ) {
    this.puppet = new OwlPuppet(root);
    this.drawPiles();
    this.layout();
  }

  /** Goes back to sorting postcards. */
  resume() {
    const run = this.interrupt();
    if (this.active && !this.reducedMotion) void this.work(run, []);
  }

  setActive(active: boolean) {
    if (active === this.active) return;
    this.active = active;
    const run = this.interrupt();
    if (active && !this.reducedMotion) {
      this.puppet.start();
      void this.work(run, OPENING);
    } else {
      this.puppet.stop();
    }
  }

  /** Holds a postcard and studies the board while a swipe is being saved. */
  wait() {
    const run = this.interrupt();
    void this.play(this.holding ? WAITING : [...QUICK_PICK, ...WAITING], run);
  }

  async react(reaction: Reaction) {
    const run = this.interrupt();
    const needsCard = !this.holding && reaction !== "celebrate";
    const beats = needsCard ? [...QUICK_PICK, ...REACTIONS[reaction]] : REACTIONS[reaction];
    if (await this.play(beats, run)) this.resume();
  }

  /** The owl's eyes and head follow the card while the user drags it. */
  setDrag(progress: number) {
    if (!this.reducedMotion) this.puppet.rig.aim({ dragTurn: progress });
  }

  /** Runs the red thread from the spool on the desk to the pin on the board. */
  layout() {
    const spool = this.root.querySelector("[data-anchor='spool']");
    const pin = this.root.querySelector("[data-anchor='pin']");
    const threads = this.root.querySelectorAll<SVGPathElement>("[data-thread]");
    if (!spool || !pin) return;

    const box = this.root.getBoundingClientRect();
    const a = spool.getBoundingClientRect();
    const b = pin.getBoundingClientRect();
    if (a.width === 0 || b.width === 0) return;

    const [x0, y0] = [a.left + a.width / 2 - box.left, a.top - box.top];
    const [x1, y1] = [b.left + b.width / 2 - box.left, b.top + b.height / 2 - box.top];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2 + THREAD_DROOP;
    const path = `M${x0.toFixed(1)} ${y0.toFixed(1)}Q${midX.toFixed(1)} ${midY.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    for (const thread of threads) thread.setAttribute("d", path);
  }

  /** Takes down the pinned postcards, lit stars and heart when the user starts over. */
  clearBoard() {
    this.pinned = 0;
    this.lit = 0;
    if (this.heartTimer) clearTimeout(this.heartTimer);
    this.root.querySelector("[data-board]")?.classList.remove("is-aligned");
    for (const pin of this.root.querySelectorAll("[data-pin]")) pin.classList.remove("is-on");
    for (const star of this.root.querySelectorAll("[data-star]")) star.classList.remove("is-lit");
  }

  stop() {
    this.run += 1;
    this.active = false;
    this.puppet.stop();
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    if (this.heartTimer) clearTimeout(this.heartTimer);
  }

  private interrupt() {
    this.puppet.release();
    this.run += 1;
    return this.run;
  }

  private async work(run: number, first: Beat[]) {
    const opening = this.holding ? [...PUT_DOWN, ...first] : first;
    if (!(await this.play(opening, run))) return;
    while (run === this.run) {
      if (!(await this.play(this.nextRoutine(), run))) return;
    }
  }

  private async play(beats: Beat[], run: number): Promise<boolean> {
    for (const beat of beats) {
      if (run !== this.run) return false;
      if (this.reducedMotion) {
        if (beat.effect && LASTING.includes(beat.effect)) this.apply(beat.effect);
        continue;
      }
      this.perform(beat);
      await new Promise((resolve) => setTimeout(resolve, beat.ms));
    }
    return run === this.run;
  }

  private perform(beat: Beat) {
    const { puppet } = this;
    if (beat.effect) this.apply(beat.effect);
    if (beat.look) puppet.rig.aim(LOOKS[beat.look]);
    if (beat.body) puppet.rig.aim(BODIES[beat.body]);
    if (beat.mood) puppet.rig.aim(MOODS[beat.mood]);
    if (beat.left) puppet.left(beat.left);
    if (beat.right) puppet.right(beat.right);
    if (beat.card) puppet.rig.aim(this.spot(beat.card));
    if (beat.card2) {
      const { cardX, cardY, cardRot, cardFlat } = this.spot(beat.card2);
      puppet.rig.aim({ card2X: cardX, card2Y: cardY, card2Rot: cardRot, card2Flat: cardFlat });
    }
    if (beat.flipped !== undefined) puppet.rig.aim({ cardTurn: beat.flipped ? 1 : 0 });
  }

  /** Where a postcard belongs right now. The piles change height as cards come and go. */
  private spot(name: CardSpot) {
    const { x, y, rot, flat, scale } = CARD_SPOTS[name];
    const piled = name === "inbox" ? pileTop("inbox", this.inbox) : name === "outbox" ? pileTop("outbox", this.outbox) : name === "tray" ? pileTop("tray", this.tray) : y;
    return { cardX: x, cardY: piled, cardRot: rot, cardFlat: flat, cardScale: scale };
  }

  private apply(effect: SceneEffect) {
    const { puppet } = this;
    switch (effect) {
      case "take":
        this.inbox = Math.max(0, this.inbox - 1);
        this.drawPiles();
        puppet.paintCard(CARD_COLORS[this.colorTurn++ % CARD_COLORS.length]);
        puppet.rig.place({ ...this.spot("inbox"), cardTurn: 0 });
        puppet.showCard(true);
        this.holding = true;
        break;
      case "takeSecond":
        puppet.rig.place({
          card2X: PILES.outbox.x,
          card2Y: pileTop("outbox", this.outbox),
          card2Rot: 3,
          card2Flat: 0.5,
        });
        puppet.showSecondCard(true);
        break;
      case "file":
        this.outbox = Math.min(6, this.outbox + 1);
        this.letGo();
        this.scheduleArrival();
        break;
      case "putAside":
        this.tray = Math.min(5, this.tray + 1);
        this.letGo();
        this.scheduleArrival();
        break;
      case "putBack":
        this.inbox += 1;
        this.letGo();
        break;
      case "fly":
        this.flyToBoard();
        this.scheduleArrival();
        break;
      case "glint":
        this.glint();
        break;
      case "spark":
        puppet.part("spark")?.animate(
          [
            { opacity: 0, transform: "scale(0.4)" },
            { opacity: 1, transform: "scale(1.15)", offset: 0.35 },
            { opacity: 0, transform: "scale(1.5)" },
          ],
          { duration: 620, easing: "ease-out" },
        );
        break;
      case "align":
        this.alignStars();
        break;
      case "release":
        puppet.showSecondCard(false);
        this.letGo();
        puppet.rig.aim({ gripR: 0 });
        this.scheduleArrival();
        break;
      case "gripCup":
        puppet.grip("cup");
        break;
      case "gripStamp":
        puppet.grip("stamp");
        break;
      case "dropProp":
        puppet.release();
        break;
      case "postmark":
        puppet.stampCard();
        break;
      case "settle":
        this.fadeHeartLater();
        break;
    }
  }

  private letGo() {
    this.puppet.showCard(false);
    this.puppet.rig.aim({ gripL: 0, gripR: 0 });
    this.holding = false;
    this.drawPiles();
  }

  private drawPiles() {
    const counts: Record<string, number> = { inbox: this.inbox, outbox: this.outbox, tray: this.tray };
    for (const pile of this.root.querySelectorAll<SVGGElement>("[data-pile]")) {
      const shown = counts[pile.dataset.pile ?? ""] ?? 0;
      [...pile.children].forEach((card, i) => card.setAttribute("display", i < shown ? "inline" : "none"));
    }
  }

  private later(ms: number, then: () => void) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      then();
    }, ms);
    this.timers.add(timer);
  }

  /** A new postcard drops through the slot in the wall, so the pile never runs out. */
  private scheduleArrival() {
    if (this.reducedMotion) return;
    this.later(900 + Math.random() * 1600, () => {
      if (this.inbox >= 6) return;
      const flap = this.root.querySelector<SVGElement>("[data-slot-flap]");
      const arriving = this.root.querySelector<HTMLElement>("[data-arrival]");
      const slot = flap?.getBoundingClientRect();
      if (!flap || !arriving || !slot || slot.width === 0) {
        this.inbox += 1;
        this.drawPiles();
        return;
      }
      const box = this.root.getBoundingClientRect();
      const pile = this.root.querySelector("[data-pile='inbox']")?.getBoundingClientRect();
      const x = slot.left + slot.width / 2 - box.left;
      const fromY = slot.bottom - box.top;
      const toY = (pile?.top ?? slot.bottom + 120) - box.top;

      flap.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(0.1)", offset: 0.3 }, { transform: "scaleY(1)" }], { duration: 620 });
      const fall = arriving.animate(
        [
          { transform: `translate(${x}px, ${fromY}px) rotate(-12deg) scaleY(0.2)`, opacity: 1 },
          { transform: `translate(${x - 6}px, ${toY - 24}px) rotate(8deg) scaleY(1)`, opacity: 1, offset: 0.72 },
          { transform: `translate(${x - 8}px, ${toY}px) rotate(-3deg) scaleY(0.55)`, opacity: 1 },
        ],
        { duration: 720, easing: "cubic-bezier(.5,0,.8,.6)" },
      );
      fall.onfinish = () => {
        this.inbox += 1;
        this.drawPiles();
      };
    });
  }

  /** Sends the held postcard across the room to its place on the board. */
  private flyToBoard() {
    const slots = [...this.root.querySelectorAll<SVGGElement>("[data-pin]")];
    const slot = slots[this.pinned % slots.length];
    this.pinned += 1;

    const land = () => {
      slot?.classList.add("is-on");
      this.lightStar();
    };

    const flyer = this.root.querySelector<HTMLElement>("[data-flyer]");
    const card = this.puppet.part("card");
    const a = card?.getBoundingClientRect();
    const b = slot?.getBoundingClientRect();
    // On a small screen the board may be hidden, and then there is nowhere to fly to.
    if (this.reducedMotion || !flyer || !slot || !a?.width || !b?.width) {
      this.puppet.showCard(false);
      this.holding = false;
      return land();
    }

    slot.classList.remove("is-on");
    const box = this.root.getBoundingClientRect();
    const [x0, y0] = [a.left + a.width / 2 - box.left, a.top + a.height / 2 - box.top];
    const [x1, y1] = [b.left + b.width / 2 - box.left, b.top + b.height / 2 - box.top];
    const lift = Math.min(y0, y1) - 30;
    const end = Math.max(0.5, b.width / flyer.offsetWidth);
    this.puppet.showCard(false);
    this.puppet.rig.aim({ gripR: 0 });
    this.holding = false;

    flyer.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) rotate(-14deg) scale(1)`, opacity: 1 },
        { transform: `translate(${(x0 + x1) / 2}px, ${lift}px) rotate(12deg) scale(0.9)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x1}px, ${y1}px) rotate(-4deg) scale(${end})`, opacity: 1 },
      ],
      { duration: 880, easing: "cubic-bezier(.45,.05,.3,1)" },
    ).onfinish = land;
  }

  private lightStar() {
    const stars = this.root.querySelectorAll<SVGGElement>("[data-star]");
    stars[this.lit % stars.length]?.classList.add("is-lit");
    this.lit += 1;
  }

  private glint() {
    const stars = [...this.root.querySelectorAll<SVGGElement>("[data-star]")];
    const star = stars[Math.floor(Math.random() * stars.length)];
    star?.classList.add("is-glinting");
    this.later(1500, () => star?.classList.remove("is-glinting"));
  }

  /** Only a reaction to a confirmed match reaches this. The two halves meet and make a heart. */
  private alignStars() {
    if (this.heartTimer) clearTimeout(this.heartTimer);
    this.root.querySelector("[data-board]")?.classList.add("is-aligned");
    if (this.reducedMotion) return;
    const spark = this.root.querySelector<SVGPathElement>("[data-thread='spark']");
    spark?.animate([{ strokeDashoffset: 0, opacity: 1 }, { strokeDashoffset: -1, opacity: 1, offset: 0.9 }, { strokeDashoffset: -1, opacity: 0 }], {
      duration: 900,
      easing: "ease-in-out",
    });
  }

  private fadeHeartLater() {
    if (this.heartTimer) clearTimeout(this.heartTimer);
    this.heartTimer = setTimeout(() => {
      this.root.querySelector("[data-board]")?.classList.remove("is-aligned");
    }, HEART_LINGER_MS);
  }
}
