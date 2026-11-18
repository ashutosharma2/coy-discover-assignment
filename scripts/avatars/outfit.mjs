// Clothes, drawn over the shoulders.
import { INK, box, brush, clipped, dot, fill, mix, shape } from "./ink.mjs";

const TORSO = [[40, 1050], [76, 900], [170, 814], [300, 770], [400, 790], [500, 770], [630, 814], [724, 900], [760, 1050]];

function crew(skin, trim) {
  return (
    fill([[328, 750], [362, 806], [438, 806], [472, 750], [440, 712], [360, 712]], skin.base) +
    fill([[340, 738], [460, 738], [440, 716], [360, 716]], skin.shade, 0.7) +
    brush([[322, 744], [358, 812], [442, 812], [478, 744]], { w: 22, start: 0.8, end: 0.8 }) +
    brush([[324, 746], [359, 809], [441, 809], [476, 746]], { w: 13, color: trim, start: 0.9, end: 0.9 })
  );
}

function vee(skin, depth, edge) {
  return (
    fill([[334, 742], [400, depth], [466, 742], [440, 706], [360, 706]], skin.base) +
    fill([[345, 735], [455, 735], [440, 712], [360, 712]], skin.shade, 0.7) +
    brush([[330, 738], [400, depth + 4]], { w: edge ? 18 : 8, color: edge ?? INK, start: 0.8, end: 0.5 }) +
    brush([[470, 738], [400, depth + 4]], { w: edge ? 18 : 8, color: edge ?? INK, start: 0.8, end: 0.5 })
  );
}

const collar = (color) =>
  shape([[338, 720], [282, 786], [338, 846], [396, 796]], color, { w: 6 }) + shape([[462, 720], [518, 786], [462, 846], [404, 796]], color, { w: 6 });

const buttons = (color, from = 850, count = 3) => Array.from({ length: count }, (_, i) => dot(400, from + i * 56, 7, color, { w: 3 })).join("");

function openFront(skin, o, c) {
  const inner = o.inner ?? "#f0e8da";
  const lapel = o.lapel ?? mix(c, "#0d0a14", 0.2);
  return (
    fill([[292, 770], [340, 1050], [460, 1050], [508, 770], [400, 800]], inner) +
    crew(skin, mix(inner, "#000000", 0.14)) +
    shape([[322, 746], [240, 866], [292, 940], [342, 1050], [370, 1050], [350, 866]], lapel, { w: 6 }) +
    shape([[478, 746], [560, 866], [508, 940], [458, 1050], [430, 1050], [450, 866]], lapel, { w: 6 })
  );
}

function pattern(o, c) {
  let out = "";
  if (o.stripes) for (let y = 830; y < 1040; y += 42) out += fill([[0, y], [800, y], [800, y + 18], [0, y + 18]], o.stripes);
  if (o.stitches) out += brush([[150, 900], [190, 1040]], { w: 4, color: o.stitches }) + brush([[650, 900], [610, 1040]], { w: 4, color: o.stitches });
  if (o.shoulder) out += brush([[120, 880], [200, 815], [300, 785]], { w: 26, color: o.shoulder, start: 1, end: 1 }) + brush([[680, 880], [600, 815], [500, 785]], { w: 26, color: o.shoulder, start: 1, end: 1 });
  if (o.splats) {
    [[210, 900, 15, "#d9412f"], [260, 980, 10, "#2f62c9"], [560, 910, 17, "#efb22e"], [610, 985, 11, "#2c9b6f"], [330, 960, 8, "#efb22e"], [490, 985, 9, "#d9412f"]].forEach(([x, y, r, col]) => {
      out += dot(x, y, r, col);
    });
  }
  if (o.ink) [[452, 930, 11], [500, 880, 7], [330, 970, 9]].forEach(([x, y, r]) => (out += dot(x, y, r, "#26305c")));
  out += fill([[560, 780], [790, 880], [790, 1050], [600, 1050], [640, 900]], mix(c, "#0d0a14", 0.5), 0.26);
  out += brush([[230, 1040], [250, 950], [232, 880]], { w: 5, color: mix(c, "#0d0a14", 0.5) });
  return out;
}

/** Returns what sits behind the neck and what sits over the shoulders. */
export function outfitDrawing(o, skin) {
  const c = o.color;
  const dark = mix(c, "#0d0a14", 0.24);
  let behind = "";
  const baseColor = o.type === "dungarees" || o.type === "nehru" ? (o.inner ?? "#f3ece0") : c;
  let body = shape(TORSO, baseColor, { w: 8 }) + clipped(TORSO, pattern(o, baseColor));

  switch (o.type) {
    case "tee":
      body += crew(skin, dark);
      break;
    case "shirt":
      body += vee(skin, 852) + collar(mix(c, "#ffffff", 0.14)) + brush([[400, 860], [400, 1040]], { w: 5, color: dark }) + buttons("#f6efe2");
      break;
    case "polo":
      body += vee(skin, 830) + collar(mix(c, "#ffffff", 0.3)) + buttons(dark, 850, 1);
      break;
    case "kurta":
      body += vee(skin, 878, o.trim) + brush([[400, 884], [400, 1040]], { w: 16, color: o.trim, start: 0.7, end: 1 });
      if (o.chikan) for (let i = 0; i < 16; i++) body += dot(250 + (i % 4) * 34 + (i % 2) * 14, 860 + Math.floor(i / 4) * 44, 6, "#d9cdbb") + dot(550 - (i % 4) * 34 - (i % 2) * 14, 860 + Math.floor(i / 4) * 44, 6, "#d9cdbb");
      break;
    case "hoodie":
      behind += shape([[226, 806], [262, 700], [340, 672], [460, 672], [538, 700], [574, 806], [400, 860]], dark, { w: 7 });
      body += crew(skin, dark) + brush([[368, 815], [362, 930]], { w: 7, color: "#efe7d8", start: 1, end: 0.6 }) + brush([[432, 815], [438, 910]], { w: 7, color: "#efe7d8", start: 1, end: 0.6 });
      break;
    case "jacket":
      body += openFront(skin, o, c);
      break;
    case "cardigan":
      body += openFront(skin, { ...o, lapel: mix(c, "#ffffff", 0.1) }, c) + dot(352, 920, 8, "#d8c49a", { w: 3 }) + dot(362, 1000, 8, "#d8c49a", { w: 3 });
      break;
    case "sweater":
      body += crew(skin, dark);
      for (let x = 200; x < 640; x += 58) body += brush([[x, 880], [x + 6, 1030]], { w: 4, color: dark });
      break;
    case "zip":
      body += vee(skin, 820, dark) + brush([[400, 824], [400, 1050]], { w: 11, color: o.zip ?? "#e8e4da", start: 1, end: 1 }) + brush([[400, 824], [400, 1050]], { w: 3 });
      break;
    case "dungarees":
      body += crew(skin, mix(baseColor, "#000000", 0.14));
      body += shape([[286, 910], [514, 910], [540, 1060], [260, 1060]], c, { w: 7 });
      body += shape([[300, 784], [336, 776], [334, 920], [298, 920]], c, { w: 6 }) + shape([[500, 784], [464, 776], [466, 920], [502, 920]], c, { w: 6 });
      body += dot(316, 900, 11, "#d9b23f", { w: 4 }) + dot(484, 900, 11, "#d9b23f", { w: 4 });
      break;
    case "apron":
      body += vee(skin, 840) + collar(mix(c, "#ffffff", 0.2));
      body += box([[310, 868], [490, 868], [548, 1060], [252, 1060]], o.apron, { w: 7 });
      body += box([[352, 924], [448, 924], [448, 990], [352, 990]], mix(o.apron, "#ffffff", 0.12), { w: 5 });
      body += brush([[322, 872], [352, 800]], { w: 14, start: 1, end: 1 }) + brush([[322, 872], [352, 800]], { w: 8, color: o.apron, start: 1, end: 1 }) + brush([[478, 872], [448, 800]], { w: 14, start: 1, end: 1 }) + brush([[478, 872], [448, 800]], { w: 8, color: o.apron, start: 1, end: 1 });
      break;
    case "jersey":
      body += vee(skin, 838, o.trim);
      break;
    case "nehru":
      body += vee(skin, 800);
      body += shape([[330, 760], [214, 830], [230, 1060], [386, 1060], [392, 830]], c, { w: 7 }) + shape([[470, 760], [586, 830], [570, 1060], [414, 1060], [408, 830]], c, { w: 7 });
      body += buttons("#c9a44a", 870, 3);
      break;
    default:
      throw new Error(`Unknown outfit: ${o.type}`);
  }

  if (o.scarf) {
    body += shape([[292, 762], [400, 836], [508, 762], [548, 806], [474, 900], [492, 1060], [396, 1060], [418, 884], [270, 812]], o.scarf, { w: 7 });
    if (o.scarfTrim) body += brush([[492, 910], [508, 1050]], { w: 16, color: o.scarfTrim, start: 1, end: 1 }) + brush([[286, 800], [400, 868], [500, 800]], { w: 12, color: o.scarfTrim, start: 1, end: 1 });
    if (o.flowers) [[440, 930], [468, 990], [430, 1030], [500, 780], [310, 790]].forEach(([x, y]) => (body += dot(x, y, 13, "#efb22e", { w: 3 }) + dot(x, y, 5, "#c7222f")));
  }
  if (o.towel) {
    body += shape([[300, 742], [352, 812], [336, 1060], [246, 1060], [236, 830]], "#f4f0e6", { w: 7 });
    body += shape([[500, 742], [448, 812], [464, 1060], [554, 1060], [564, 830]], "#f4f0e6", { w: 7 });
    for (const y of [930, 962]) body += brush([[246, y], [338, y]], { w: 11, color: "#3a78b5", start: 1, end: 1 }) + brush([[462, y], [554, y]], { w: 11, color: "#3a78b5", start: 1, end: 1 });
  }
  if (o.mirrors) {
    [[256, 880], [300, 950], [250, 1000], [544, 880], [500, 950], [550, 1000]].forEach(([x, y]) => (body += dot(x, y, 13, "#dfe9ec", { w: 5, ink: "#c2382f" })));
  }
  if (o.bagStrap) body += brush([[250, 800], [420, 930], [610, 1060]], { w: 34, color: o.bagStrap, start: 1, end: 1 }) + brush([[250, 786], [430, 918], [622, 1046]], { w: 5 });
  if (o.headphones) {
    body += brush([[286, 800], [400, 868], [514, 800]], { w: 20, start: 1, end: 1 }) + brush([[288, 800], [400, 864], [512, 800]], { w: 10, color: "#d8dde2", start: 1, end: 1 });
    body += shape([[252, 770], [304, 762], [322, 816], [296, 858], [250, 846]], "#26262c") + shape([[548, 770], [496, 762], [478, 816], [504, 858], [550, 846]], "#26262c");
    body += dot(284, 810, 18, "#c94a3a") + dot(516, 810, 18, "#c94a3a");
  }
  if (o.patches) body += dot(238, 920, 26, "#d9412f", { w: 5 }) + dot(566, 900, 22, "#efb22e", { w: 5 }) + dot(586, 980, 15, "#3ab0a2", { w: 4 });
  return { behind, body };
}
