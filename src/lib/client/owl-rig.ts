/** The maths behind the owl: one spring per joint, and a solver that places a wing's tip. */

export interface Point {
  x: number;
  y: number;
}

interface Feel {
  stiffness: number;
  damping: number;
}

// Eyes move first, then the head, then the wings, and the heavy body settles last.
// Those different speeds are what make one movement look like it travels through the bird.
const EYES: Feel = { stiffness: 460, damping: 38 };
const FACE: Feel = { stiffness: 240, damping: 24 };
const HEAD: Feel = { stiffness: 125, damping: 16 };
const WING: Feel = { stiffness: 135, damping: 19 };
const GRIP: Feel = { stiffness: 90, damping: 16 };
const CARD: Feel = { stiffness: 150, damping: 21 };
const BODY: Feel = { stiffness: 64, damping: 12 };
const TRAIL: Feel = { stiffness: 34, damping: 5 };

export const JOINTS = {
  lean: BODY,
  shift: BODY,
  rise: { stiffness: 110, damping: 13 },
  squash: { stiffness: 150, damping: 12 },
  tilt: HEAD,
  turn: HEAD,
  nod: HEAD,
  gazeX: EYES,
  gazeY: EYES,
  lid: FACE,
  joy: FACE,
  brow: FACE,
  dragTurn: HEAD,
  tuft: TRAIL,
  scarf: TRAIL,
  handLX: WING,
  handLY: WING,
  handRX: WING,
  handRY: WING,
  gripL: GRIP,
  gripR: GRIP,
  grip2: GRIP,
  prop: GRIP,
  cardX: CARD,
  cardY: CARD,
  cardRot: CARD,
  cardFlat: CARD,
  cardScale: CARD,
  cardTurn: { stiffness: 80, damping: 13 },
  card2X: CARD,
  card2Y: CARD,
  card2Rot: CARD,
  card2Flat: CARD,
} satisfies Record<string, Feel>;

export type Joint = keyof typeof JOINTS;

const STEP_SECONDS = 1 / 120;
const LONGEST_FRAME_SECONDS = 0.05;

/** Every joint chases its own target, so a new pose can interrupt an old one without a jump. */
export class OwlRig {
  private readonly value = new Map<Joint, number>();
  private readonly speed = new Map<Joint, number>();
  private readonly target = new Map<Joint, number>();

  constructor(start: Partial<Record<Joint, number>> = {}) {
    for (const joint of Object.keys(JOINTS) as Joint[]) {
      const value = start[joint] ?? 0;
      this.value.set(joint, value);
      this.speed.set(joint, 0);
      this.target.set(joint, value);
    }
  }

  get(joint: Joint) {
    return this.value.get(joint) ?? 0;
  }

  aim(targets: Partial<Record<Joint, number>>) {
    for (const [joint, target] of Object.entries(targets) as [Joint, number][]) this.target.set(joint, target);
  }

  /** Moves joints straight to a value, for something that appears rather than travels. */
  place(values: Partial<Record<Joint, number>>) {
    for (const [joint, value] of Object.entries(values) as [Joint, number][]) {
      this.value.set(joint, value);
      this.speed.set(joint, 0);
      this.target.set(joint, value);
    }
  }

  advance(seconds: number) {
    let left = Math.min(seconds, LONGEST_FRAME_SECONDS);
    while (left > 0) {
      const dt = Math.min(left, STEP_SECONDS);
      for (const joint of Object.keys(JOINTS) as Joint[]) {
        const { stiffness, damping } = JOINTS[joint];
        const value = this.get(joint);
        const speed = this.speed.get(joint) ?? 0;
        const pull = stiffness * ((this.target.get(joint) ?? 0) - value) - damping * speed;
        const next = speed + pull * dt;
        this.speed.set(joint, next);
        this.value.set(joint, value + next * dt);
      }
      left -= dt;
    }
  }
}

export interface WingAngles {
  /** Rotation of the upper wing, in degrees. Zero means hanging straight down. */
  upper: number;
  /** Rotation of the lower wing relative to the upper wing, in degrees. */
  fore: number;
  /** Where the wing tip ended up. It falls short of the target when the target is out of reach. */
  tip: Point;
}

const degrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * Two-bone inverse kinematics. Given the shoulder and where the tip should go, the law of
 * cosines gives the elbow. `elbow` is 1 or -1 and picks which side the elbow bends towards.
 */
export function solveWing(shoulder: Point, target: Point, upper: number, fore: number, elbow: 1 | -1): WingAngles {
  const dx = target.x - shoulder.x;
  const dy = target.y - shoulder.y;
  const reach = Math.max(Math.abs(upper - fore) + 0.01, Math.min(Math.hypot(dx, dy), upper + fore - 0.01));
  const toTarget = Math.atan2(dy, dx);
  const cosine = (upper * upper + reach * reach - fore * fore) / (2 * upper * reach);
  const upperDirection = toTarget + elbow * Math.acos(Math.max(-1, Math.min(1, cosine)));

  const elbowX = shoulder.x + Math.cos(upperDirection) * upper;
  const elbowY = shoulder.y + Math.sin(upperDirection) * upper;
  const tip = { x: shoulder.x + Math.cos(toTarget) * reach, y: shoulder.y + Math.sin(toTarget) * reach };
  const foreDirection = Math.atan2(tip.y - elbowY, tip.x - elbowX);

  return {
    upper: degrees(upperDirection) - 90,
    fore: degrees(foreDirection - upperDirection),
    tip,
  };
}
