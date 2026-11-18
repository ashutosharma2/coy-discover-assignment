import { LEFT_HANDS, OWL, PROP_HOMES, RIGHT_HANDS, type LeftHand, type Prop, type RightHand } from "@/lib/client/mascot";
import { OwlRig, solveWing, type Point } from "@/lib/client/owl-rig";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const round = (value: number) => Math.round(value * 100) / 100;

/** How a held prop sits against the wing tip. */
const PROP_GRIP: Record<Prop, Point> = {
  cup: { x: 2, y: 12 },
  stamp: { x: 0, y: 14 },
};

/** Draws the rig onto the owl's SVG parts, once per frame, without involving React. */
export class OwlPuppet {
  readonly rig = new OwlRig({
    handLX: LEFT_HANDS.rest.x,
    handLY: LEFT_HANDS.rest.y,
    handRX: RIGHT_HANDS.rest.x,
    handRY: RIGHT_HANDS.rest.y,
    cardFlat: 1,
    cardScale: 1,
    card2Flat: 1,
    lid: 0.08,
  });

  private readonly parts = new Map<string, SVGElement>();
  private frame = 0;
  private lastTime = 0;
  private clock = 0;
  private nextBlink = 2;
  private blinkUntil = 0;
  private nextGlance = 1.5;
  private glanceX = 0;
  private glanceY = 0;
  private rightOnSecond = false;
  private held: Prop | null = null;
  private cardShown = false;
  private card2Shown = false;

  constructor(private readonly root: HTMLElement) {
    for (const element of root.querySelectorAll<SVGElement>("[data-owl]")) {
      this.parts.set(element.dataset.owl ?? "", element);
    }
    this.draw();
  }

  start() {
    if (this.frame) return;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const seconds = (now - this.lastTime) / 1000;
      this.lastTime = now;
      this.clock += Math.min(seconds, 0.05);
      this.rig.advance(seconds);
      this.idle();
      this.draw();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  left(hand: LeftHand) {
    if (hand === "card") return this.rig.aim({ gripL: 1 });
    const { x, y } = LEFT_HANDS[hand];
    this.rig.aim({ gripL: 0, handLX: x, handLY: y });
  }

  right(hand: RightHand) {
    if (hand === "card" || hand === "card2") {
      this.rightOnSecond = hand === "card2";
      return this.rig.aim({ gripR: 1 });
    }
    const { x, y } = RIGHT_HANDS[hand];
    this.rig.aim({ gripR: 0, handRX: x, handRY: y });
  }

  grip(prop: Prop) {
    this.held = prop;
    this.rig.aim({ prop: 1 });
  }

  /** Lets go of a prop, which slides back to its place on the desk. */
  release() {
    this.rig.aim({ prop: 0 });
  }

  showCard(shown: boolean) {
    this.cardShown = shown;
    this.show("card", shown);
    if (shown) this.show("card-mark", false);
  }

  showSecondCard(shown: boolean) {
    this.card2Shown = shown;
    this.show("card2", shown);
  }

  stampCard() {
    this.show("card-mark", true);
  }

  paintCard(color: string) {
    this.parts.get("card-paper")?.setAttribute("fill", color);
  }

  part(name: string) {
    return this.parts.get(name);
  }

  private show(name: string, shown: boolean) {
    const part = this.parts.get(name);
    if (shown) part?.removeAttribute("display");
    else part?.setAttribute("display", "none");
  }

  private set(name: string, transform: string) {
    this.parts.get(name)?.setAttribute("transform", transform);
  }

  /** The small movements that never stop: blinking, glancing about and the tufts catching up. */
  private idle() {
    const { rig, clock } = this;
    if (clock > this.nextBlink) {
      this.blinkUntil = clock + 0.13;
      this.nextBlink = clock + (Math.random() < 0.2 ? 0.28 : 1.8 + Math.random() * 3.8);
    }
    if (clock > this.nextGlance) {
      this.glanceX = (Math.random() - 0.5) * 0.3;
      this.glanceY = (Math.random() - 0.5) * 0.22;
      this.nextGlance = clock + 0.7 + Math.random() * 2.2;
    }
    rig.aim({ tuft: rig.get("tilt"), scarf: rig.get("lean") + rig.get("shift") * 0.4 });
  }

  /** Where a joint on the body has moved to, once the body has leaned and shifted. */
  private onBody(point: Point, lean: number, squash: number): Point {
    const radians = (lean * Math.PI) / 180;
    const x = (point.x - OWL.pivot.x) * (1 + squash);
    const y = (point.y - OWL.pivot.y) * (1 - squash);
    return {
      x: OWL.pivot.x + x * Math.cos(radians) - y * Math.sin(radians) + this.rig.get("shift"),
      y: OWL.pivot.y + x * Math.sin(radians) + y * Math.cos(radians) + this.rig.get("rise"),
    };
  }

  private cardEdge(side: -1 | 1, second: boolean): Point {
    const { rig } = this;
    const x = rig.get(second ? "card2X" : "cardX");
    const y = rig.get(second ? "card2Y" : "cardY");
    const rot = (rig.get(second ? "card2Rot" : "cardRot") * Math.PI) / 180;
    const across = 28 * side * Math.abs(Math.cos(Math.PI * rig.get("cardTurn"))) + side * 4;
    const down = 8 * rig.get(second ? "card2Flat" : "cardFlat");
    return { x: x + across * Math.cos(rot) - down * Math.sin(rot), y: y + across * Math.sin(rot) + down * Math.cos(rot) };
  }

  private draw() {
    const { rig, clock } = this;
    const breath = Math.sin(clock * 1.45);
    const sway = Math.sin(clock * 0.61) * 0.7 + Math.sin(clock * 1.33 + 1) * 0.3;

    const lean = rig.get("lean") + sway * 0.55;
    const squash = rig.get("squash") + breath * 0.007;
    const { x: px, y: py } = OWL.pivot;
    this.set(
      "body",
      `translate(${round(px + rig.get("shift"))} ${round(py + rig.get("rise"))}) rotate(${round(lean)}) scale(${round(1 + squash)} ${round(1 - squash)}) translate(${-px} ${-py})`,
    );

    const drag = rig.get("dragTurn");
    const turn = clamp(rig.get("turn") + drag * 0.6, -1.2, 1.2);
    const nod = rig.get("nod");
    const tilt = rig.get("tilt") + Math.sin(clock * 0.47 + 2) * 1.1 + drag * 4;
    this.set("head", `translate(${round(turn * 3)} ${round(nod * 4.5)}) rotate(${round(tilt)} 262 214)`);
    this.set("face", `translate(${round(turn * 11)} ${round(nod * 7)})`);

    const tuftLag = rig.get("tilt") - rig.get("tuft");
    this.set("tuft-l", `translate(${round(-turn * 3)} ${round(-nod * 2)}) rotate(${round(tuftLag * 0.9)} 220 104)`);
    this.set("tuft-r", `translate(${round(-turn * 3)} ${round(-nod * 2)}) rotate(${round(tuftLag * 0.9)} 304 104)`);
    this.set("scarf-tail", `rotate(${round((rig.get("scarf") - lean) * -2.2 + sway * 1.6)} 266 224)`);

    const gazeX = clamp(rig.get("gazeX") + this.glanceX + drag * 0.8, -1, 1);
    const gazeY = clamp(rig.get("gazeY") + this.glanceY, -1, 1);
    const pupil = `translate(${round(gazeX * 6)} ${round(gazeY * 6)})`;
    this.set("pupil-l", pupil);
    this.set("pupil-r", pupil);

    const lid = clock < this.blinkUntil ? 1 : clamp(rig.get("lid"), 0, 1);
    const lidOffset = `translate(0 ${round(-46 * (1 - lid))})`;
    this.set("lid-l", lidOffset);
    this.set("lid-r", lidOffset);

    const joy = clamp(rig.get("joy"), 0, 1);
    this.parts.get("eyes")?.setAttribute("opacity", String(round(1 - joy)));
    this.parts.get("happy")?.setAttribute("opacity", String(round(joy)));
    const brow = rig.get("brow");
    this.set("brow-l", `translate(0 ${round(-brow * 4)}) rotate(${round(brow * -7)} 230 118)`);
    this.set("brow-r", `translate(0 ${round(-brow * 4)}) rotate(${round(brow * 7)} 294 118)`);

    this.drawCard();
    this.drawWing("l", lean, squash);
    this.drawProps(this.drawWing("r", lean, squash));
  }

  private drawCard() {
    const { rig } = this;
    if (this.cardShown) {
      const turn = Math.cos(Math.PI * clamp(rig.get("cardTurn"), 0, 1));
      const scale = rig.get("cardScale");
      this.set(
        "card",
        `translate(${round(rig.get("cardX"))} ${round(rig.get("cardY"))}) rotate(${round(rig.get("cardRot"))}) scale(${round(scale * (Math.abs(turn) < 0.04 ? 0.04 : Math.abs(turn)))} ${round(scale * rig.get("cardFlat"))})`,
      );
      this.show("card-front", turn >= 0);
      this.show("card-back", turn < 0);
    }
    if (this.card2Shown) {
      this.set(
        "card2",
        `translate(${round(rig.get("card2X"))} ${round(rig.get("card2Y"))}) rotate(${round(rig.get("card2Rot"))}) scale(1 ${round(rig.get("card2Flat"))})`,
      );
    }
  }

  private drawWing(side: "l" | "r", lean: number, squash: number) {
    const { rig } = this;
    const left = side === "l";
    const shoulder = this.onBody(left ? OWL.shoulderLeft : OWL.shoulderRight, lean, squash);
    const free = left ? { x: rig.get("handLX"), y: rig.get("handLY") } : { x: rig.get("handRX"), y: rig.get("handRY") };
    const grip = clamp(rig.get(left ? "gripL" : "gripR"), 0, 1);
    const edge = this.cardEdge(left ? -1 : 1, !left && this.rightOnSecond);
    const target = { x: lerp(free.x, edge.x, grip), y: lerp(free.y, edge.y, grip) };

    const wing = solveWing(shoulder, target, OWL.upperWing, OWL.foreWing, left ? 1 : -1);
    this.set(`wing-${side}`, `translate(${round(shoulder.x)} ${round(shoulder.y)}) rotate(${round(wing.upper)})`);
    this.set(`fore-${side}`, `translate(0 ${OWL.upperWing}) rotate(${round(wing.fore)})`);
    return wing.tip;
  }

  private drawProps(tip: Point) {
    const carried = clamp(this.rig.get("prop"), 0, 1);
    for (const prop of Object.keys(PROP_HOMES) as Prop[]) {
      const home = PROP_HOMES[prop];
      const amount = this.held === prop ? carried : 0;
      const x = lerp(home.x, tip.x + PROP_GRIP[prop].x, amount);
      const y = lerp(home.y, tip.y + PROP_GRIP[prop].y, amount);
      this.set(prop, `translate(${round(x)} ${round(y)})`);
    }
  }
}
