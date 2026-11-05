// 山谷背景、河流、桥梁和自然景观绘制。

import { inside, mainlandHeight } from "../core/map.js";
import { game } from "../core/state.js";
import {
  BASE_HEIGHT,
  bankStart,
  businessDuration,
  entrance,
} from "../data/catalog.js";
import { canvas } from "../dom.js";
import { building } from "./buildings.js";
import { pos, rawPos } from "./camera.js";
import { diamond, poly, rect } from "./primitives.js";

function pine(x, y, scale = 1) {
  const dot = (dx, dy, w, h, c) =>
    rect(
      x + dx * scale,
      y + dy * scale,
      Math.max(1, Math.round(w * scale)),
      Math.max(1, Math.round(h * scale)),
      c,
    );
  diamond(x + 3, y + 1, 13 * scale, 5 * scale, "#64865b");
  dot(-2, -19, 5, 20, "#68493b");
  dot(-2, -10, 2, 10, "#9e7350");
  const layers = [
    [-35, 6],
    [-28, 9],
    [-20, 13],
    [-12, 16],
  ];
  for (const [dy, r] of layers) {
    for (let row = 0; row < 5; row++) {
      const w = Math.ceil((r * (row + 2)) / 6);
      dot(-w, dy + row * 2, w * 2 + 1, 2, "#285345");
      dot(-w, dy + row * 2, w, 2, row < 2 ? "#649451" : "#42784b");
    }
    dot(-r * 0.45, dy + 4, 5, 2, "#89aa5d");
  }
}

function gardenStone(x, y, size = 1) {
  const shape = (points, color) =>
    poly(
      points.map(([dx, dy]) => [x + dx * size, y + dy * size]),
      color,
    );
  shape(
    [
      [-11, 0],
      [-8, -6],
      [-2, -10],
      [7, -8],
      [12, -2],
      [9, 3],
      [-4, 4],
    ],
    "#667f70",
  );
  shape(
    [
      [-10, -1],
      [-7, -6],
      [-2, -9],
      [6, -7],
      [4, -3],
      [-2, 1],
    ],
    "#aab19a",
  );
  shape(
    [
      [-8, -5],
      [-5, -7],
      [0, -7],
      [-2, -5],
    ],
    "#c6c8a9",
  );
}

function resortLantern(x, y) {
  if (
    game.mode === "closed" ||
    (game.mode === "running" && game.clock >= businessDuration * 0.67)
  ) {
    diamond(x, y + 2, 12, 5, "#e9b76c43");
    diamond(x, y - 11, 11, 8, "#f4bb6a24");
    diamond(x, y - 11, 7, 5, "#f6d18030");
  }
  diamond(x, y + 2, 6, 3, "#7e9870");
  rect(x - 1, y - 12, 3, 14, "#695c4a");
  rect(x - 4, y - 15, 9, 8, "#755748");
  rect(x - 3, y - 14, 7, 5, "#ffdc83");
  rect(x, y - 14, 1, 5, "#bd8651");
  rect(x - 2, y - 13, 2, 3, "#fff0b1");
  rect(x - 5, y - 17, 11, 2, "#546568");
  rect(x - 3, y - 19, 7, 2, "#6c8480");
}

function reedClump(x, y, seed) {
  const sway = Math.round(Math.sin(game.sceneryTime / 420 + seed));
  diamond(x, y + 1, 7, 2, "#778d714d");
  for (const [dx, h, color] of [
    [-4, 6, "#768763"],
    [-1, 9, "#859361"],
    [2, 7, "#9a9d65"],
    [4, 4, "#738960"],
  ]) {
    rect(x + dx, y - h + 2, 1, h, color);
    rect(x + dx + sway, y - h, 1, 3, color);
    if (h >= 7) rect(x + dx + sway, y - h - 1, 2, 2, "#ab8d62");
  }
}

function wildflowers(x, y, seed) {
  const colors = ["#db9c9d", "#f4d9ae", "#c2a7c4"];
  for (let i = 0; i < 5; i++) {
    const dx = ((i * 7 + seed) % 15) - 7,
      dy = (i * 3 + seed) % 5;
    rect(x + dx, y + dy - 2, 1, 4, "#7d916c");
    rect(x + dx - 1, y + dy - 3, 3, 1, colors[(i + seed) % colors.length]);
    rect(x + dx, y + dy - 4, 1, 1, "#f4dfb6");
  }
}

function footbridge(start = [122, 242], end = [94, 281]) {
  const deck = (offset, color) =>
    poly(
      [
        [start[0] - 12, start[1] + offset],
        [start[0] + 7, start[1] + offset + 7],
        [end[0] + 7, end[1] + offset + 7],
        [end[0] - 12, end[1] + offset],
      ],
      color,
    );
  deck(4, "#516a60");
  deck(0, "#9b6848");
  for (let i = 0; i <= 10; i++) {
    const x = start[0] + ((end[0] - start[0]) * i) / 10,
      y = start[1] + ((end[1] - start[1]) * i) / 10;
    poly(
      [
        [x - 12, y],
        [x + 7, y + 7],
        [x + 5, y + 9],
        [x - 14, y + 2],
      ],
      i % 2 ? "#ca9a63" : "#deb17a",
    );
    rect(x - 9, y + 2, 1, 1, "#8f624d");
    rect(x + 4, y + 6, 1, 1, "#8f624d");
  }
  for (const side of [-13, 7]) {
    for (const t of [0, 0.48, 1]) {
      const x = start[0] + (end[0] - start[0]) * t + side;
      const y = start[1] + (end[1] - start[1]) * t + (side > 0 ? 7 : 0);
      rect(x - 1, y - 10, 3, 13, "#844b3d");
      rect(x - 2, y - 11, 5, 2, "#e1a26e");
    }
    poly(
      [
        [start[0] + side, start[1] - 9 + (side > 0 ? 7 : 0)],
        [end[0] + side, end[1] - 9 + (side > 0 ? 7 : 0)],
        [end[0] + side, end[1] - 6 + (side > 0 ? 7 : 0)],
        [start[0] + side, start[1] - 6 + (side > 0 ? 7 : 0)],
      ],
      "#ae624b",
    );
  }
}

function maple(x, y, scale = 1) {
  const dot = (dx, dy, w, h, color) =>
    rect(
      x + dx * scale,
      y + dy * scale,
      Math.ceil(w * scale),
      Math.ceil(h * scale),
      color,
    );
  diamond(x + 2, y + 1, 11 * scale, 4 * scale, "#77936b");
  dot(-2, -17, 4, 17, "#715445");
  dot(0, -13, 2, 12, "#aa7755");
  dot(-5, -16, 4, 2, "#80543e");
  dot(2, -18, 5, 2, "#8d5d45");
  const crowns = [
    [-14, -20, 13, 8],
    [-10, -26, 15, 9],
    [-3, -31, 13, 10],
    [5, -27, 13, 10],
    [4, -20, 13, 8],
    [-4, -23, 13, 10],
  ];
  for (const [dx, dy, w, h] of crowns) {
    dot(dx + 2, dy, w - 4, h + 2, "#a65d50");
    dot(dx, dy + 2, w, h - 3, "#bf755a");
    dot(dx + 2, dy, w - 4, h - 3, "#d79266");
    dot(dx + 3, dy, w - 7, 2, "#ecad75");
    dot(dx + 2, dy + 3, 3, 1, "#f2ba83");
  }
  dot(-12, -15, 3, 1, "#975745");
  dot(12, -16, 3, 1, "#aa6250");
  dot(-10, 2, 2, 1, "#d59266");
  dot(7, 4, 3, 1, "#eab67b");
}

function ridgeMist(left, top, width) {
  for (let i = 0; i < 6; i++) {
    const y = -26 + i * 24;
    if (y < top - 8) continue;
    const x =
      left +
      (width * ((i * 31 + Math.floor(game.sceneryTime / 720)) % 113)) / 113;
    const size = 32 + (i % 3) * 16;
    rect(x - size * 0.5, y, size, 2, "#edf1d34d");
    rect(x - size * 0.34, y - 2, size * 0.85, 2, "#eef3d85c");
    rect(x - size * 0.2, y + 2, size * 0.78, 1, "#edf1d33d");
  }
}

function blossom(x, y, scale = 1) {
  const dot = (dx, dy, w, h, color) =>
    rect(
      x + dx * scale,
      y + dy * scale,
      Math.ceil(w * scale),
      Math.ceil(h * scale),
      color,
    );
  diamond(x + 2, y + 1, 16 * scale, 5 * scale, "#829779");
  dot(-2, -24, 4, 24, "#76554e");
  dot(-5, -19, 4, 3, "#9a6d5a");
  dot(2, -16, 4, 2, "#9a6d5a");
  for (const [dx, dy, w, h] of [
    [-17, -24, 13, 9],
    [-13, -32, 16, 10],
    [-6, -37, 17, 11],
    [4, -32, 16, 11],
    [7, -23, 14, 8],
    [-5, -26, 17, 11],
  ]) {
    dot(dx + 2, dy, w - 4, h + 2, "#b57984");
    dot(dx, dy + 3, w, h - 4, "#d698a2");
    dot(dx + 2, dy, w - 4, h - 2, "#eeb1b4");
    dot(dx + 3, dy, w - 7, 2, "#ffdbcb");
    dot(dx + 3, dy + 4, 2, 2, "#f8c8c2");
  }
  for (let i = 0; i < 4; i++) {
    const drift = (game.sceneryTime / 145 + i * 9) % 32;
    dot(
      -12 + i * 7 + Math.sin(drift / 5) * 4,
      -29 + drift,
      2,
      1,
      i % 2 ? "#f4c8ba" : "#e2a0a6",
    );
  }
}

function shrineGate(x, y, scale = 1) {
  const dot = (dx, dy, w, h, color) =>
    rect(
      x + dx * scale,
      y + dy * scale,
      Math.ceil(w * scale),
      Math.ceil(h * scale),
      color,
    );
  diamond(x, y + 2, 21 * scale, 5 * scale, "#9b9e7f");
  for (const side of [-1, 1]) {
    dot(side * 13 - 2, -24, 4, 25, "#a44940");
    dot(side * 13 - 1, -23, 1, 22, "#de795c");
    dot(side * 13 - 3, -2, 6, 4, "#57504a");
  }
  dot(-18, -24, 37, 3, "#984338");
  dot(-20, -30, 41, 3, "#bb5b45");
  dot(-22, -32, 45, 3, "#3e5551");
  dot(-21, -34, 6, 2, "#4d685f");
  dot(16, -34, 6, 2, "#4d685f");
  dot(-2, -28, 5, 7, "#764a3d");
  dot(-1, -27, 3, 4, "#e3b47a");
}

function riversideGatePosition() {
  return pos(entrance[0], mainlandHeight() - 0.48);
}

function riversideGate(x, y, level = 1, slope = 0.56) {
  const point = (u, z) => [x + u, y + u * slope - z];
  const beam = (left, right, height, thickness, color) =>
    poly(
      [
        point(left, height),
        point(right, height),
        point(right, height + thickness),
        point(left, height + thickness),
      ],
      color,
    );
  for (const u of [-12, 12]) {
    const [px, py] = point(u, 0);
    diamond(px, py + 1, 4, 2, "#666a57");
    beam(u - 2, u + 2, 1, 22, "#a14e40");
    beam(u - 2, u - 1, 2, 20, "#dd7e60");
  }
  beam(-17, 17, 17, 3, "#9b473d");
  beam(-20, 20, 24, 3, "#c5684d");
  beam(-21, 21, 27, 2, level >= 2 ? "#537d72" : "#3f5b54");
  if (level >= 3) beam(-18, 18, 30, 2, level >= 5 ? "#e6b66b" : "#375e55");
  if (level >= 4) {
    beam(-15, -11, 13, 4, "#eac576");
    beam(11, 15, 13, 4, "#eac576");
  }
  if (level >= 5) beam(-19, 19, 24, 1, "#e5ba72");
  if (level === 6) beam(-4, 4, 21, 5, "#f5d78d");
  beam(-21, -15, 29, 1, "#688178");
  beam(15, 21, 29, 1, "#688178");
  beam(-3, 3, 19, 6, "#775044");
  beam(-2, 2, 20, 3, "#e7ba7e");
}

function outsidePlots(x, y) {
  const sum = (y - 65) / 14,
    diff = (x - 239) / 25;
  return !inside(Math.round((sum + diff) / 2), Math.round((sum - diff) / 2));
}

function bridgePath() {
  const head = rawPos(entrance[0], mainlandHeight() - 1);
  const start = [head[0] - 49, 221 + (mainlandHeight() - BASE_HEIGHT) * 28];
  return [
    head,
    start,
    [start[0] - 25, start[1] + 38],
    pos(entrance[0], bankStart),
  ];
}

function paveConnector(from, to) {
  const [x, y] = from,
    [a, b] = to,
    dx = a - x,
    dy = b - y;
  const length = Math.hypot(dx, dy),
    nx = (dy / length) * 7,
    ny = (-dx / length) * 7;
  poly(
    [
      [x - nx, y - ny],
      [a - nx, b - ny],
      [a + nx, b + ny],
      [x + nx, y + ny],
    ],
    "#b5ad8e",
  );
  const steps = Math.ceil(length / 6);
  for (let i = 0; i < steps; i++) {
    const t = i / steps,
      end = (i + 0.84) / steps;
    poly(
      [
        [x + dx * t - nx, y + dy * t - ny],
        [x + dx * end - nx, y + dy * end - ny],
        [x + dx * end + nx, y + dy * end + ny],
        [x + dx * t + nx, y + dy * t + ny],
      ],
      i % 2 ? "#e6dbc0" : "#d9d0b3",
    );
  }
}

function valleyMeadows() {
  // Fixed world-space shapes keep landscape colors stable while the camera moves.
  const bands = [
    {
      color: "#d3bc8f",
      points: [
        [-960, 224],
        [-225, 193],
        [12, 214],
        [89, 267],
        [242, 282],
        [364, 305],
        [489, 277],
        [615, 298],
        [1110, 398],
        [1110, 508],
        [523, 450],
        [345, 391],
        [173, 362],
        [-25, 325],
        [-210, 307],
        [-960, 359],
      ],
    },
    {
      color: "#b5b88d",
      points: [
        [-960, 388],
        [-345, 339],
        [-188, 367],
        [-54, 397],
        [87, 395],
        [176, 431],
        [268, 445],
        [351, 417],
        [513, 448],
        [690, 497],
        [1110, 524],
        [1110, 656],
        [677, 627],
        [455, 562],
        [275, 568],
        [149, 526],
        [-83, 491],
        [-255, 455],
        [-960, 510],
      ],
    },
    {
      color: "#d4c298",
      points: [
        [-960, 544],
        [-370, 529],
        [-280, 553],
        [-110, 559],
        [38, 604],
        [194, 610],
        [339, 650],
        [519, 612],
        [711, 656],
        [1110, 692],
        [1110, 835],
        [731, 787],
        [512, 752],
        [332, 777],
        [151, 711],
        [-35, 694],
        [-236, 650],
        [-960, 662],
      ],
    },
    {
      color: "#abae8a",
      points: [
        [-960, 760],
        [-415, 716],
        [-273, 746],
        [-166, 775],
        [2, 783],
        [135, 821],
        [295, 795],
        [446, 840],
        [607, 816],
        [1110, 895],
        [1110, 1160],
        [-960, 1160],
      ],
    },
  ];
  for (const band of bands) poly(band.points, band.color);
  for (const [x, y, size] of [
    [-285, 349, 0.9],
    [-193, 310, 1.2],
    [-108, 342, 0.8],
    [-36, 350, 0.9],
    [218, 357, 0.8],
    [248, 382, 1],
    [536, 368, 1.35],
    [571, 398, 0.9],
    [622, 421, 0.8],
    [728, 466, 1.25],
    [-232, 534, 1.2],
    [-119, 584, 0.85],
    [42, 629, 0.94],
    [112, 603, 0.78],
    [363, 658, 1.2],
    [487, 634, 1.2],
  ]) {
    if (!outsidePlots(x, y)) continue;
    diamond(x, y + 1, 19 * size, 6 * size, "#b2a385");
    gardenStone(x - 6 * size, y, size);
    gardenStone(x + 7 * size, y + 4 * size, size * 0.62);
  }
}

function ground() {
  const left = (-game.viewX - game.mapOffsetX) / game.mapScale;
  const top = (-game.viewY - game.mapOffsetY) / game.mapScale;
  const width = canvas.width / game.mapScale;
  const height = canvas.height / game.mapScale;
  rect(left, top, width + 2, height + 2, "#c4c39a");
  const skyBands = [
    [-110, "#bdcbd0"],
    [-52, "#cad5d3"],
    [4, "#d8ded0"],
    [57, "#e5e4cc"],
    [135, "#ece5cb"],
  ];
  let skyTop = top;
  for (const [end, color] of skyBands) {
    if (end <= skyTop) continue;
    rect(left, skyTop, width + 2, end - skyTop + 1, color);
    skyTop = end;
  }
  poly(
    [
      [-500, 90],
      [-80, 23],
      [25, -44],
      [86, -16],
      [140, -59],
      [206, -15],
      [258, -38],
      [318, -2],
      [387, -43],
      [480, -12],
      [950, 70],
      [950, 140],
      [-500, 140],
    ],
    "#aabcb5",
  );
  poly(
    [
      [-500, 112],
      [-36, 77],
      [30, 16],
      [65, 38],
      [120, 4],
      [170, 31],
      [225, -1],
      [277, 43],
      [341, 9],
      [402, 52],
      [456, 15],
      [950, 108],
      [950, 150],
      [-500, 150],
    ],
    "#8ca7a2",
  );
  poly(
    [
      [153, 73],
      [214, 20],
      [265, -40],
      [285, -62],
      [310, -59],
      [342, -20],
      [412, 66],
      [412, 81],
      [153, 81],
    ],
    "#99afb0",
  );
  poly(
    [
      [234, -5],
      [265, -40],
      [285, -62],
      [310, -59],
      [342, -20],
      [355, -4],
      [328, -14],
      [318, -7],
      [297, -25],
      [282, -10],
      [274, -20],
      [251, -4],
    ],
    "#f3edda",
  );
  poly(
    [
      [-500, 153],
      [-19, 110],
      [47, 59],
      [94, 85],
      [149, 57],
      [202, 99],
      [257, 75],
      [319, 98],
      [374, 59],
      [431, 86],
      [486, 61],
      [950, 145],
      [950, 199],
      [-500, 199],
    ],
    "#778f89",
  );
  poly(
    [
      [-500, 174],
      [-35, 147],
      [28, 122],
      [82, 143],
      [136, 119],
      [215, 112],
      [278, 124],
      [341, 125],
      [402, 141],
      [470, 123],
      [950, 173],
      [950, 205],
      [-500, 205],
    ],
    "#c4c39a",
  );
  valleyMeadows();
  ridgeMist(left, top, width);
  for (const [x, y, z] of [
    [172, 93, 0.46],
    [184, 100, 0.48],
    [194, 91, 0.46],
    [321, 100, 0.5],
    [334, 96, 0.46],
    [351, 106, 0.52],
    [389, 110, 0.56],
  ]) {
    if (outsidePlots(x, y)) pine(x, y, z);
  }
  for (let i = 0; i < 30; i++) {
    const x = (i * 47 + 5) % 480,
      y = 105 + ((i * 31) % 30);
    if (x > 113 && x < 384) continue;
    pine(x, y, 0.32 + (i % 4) * 0.07);
  }
  for (
    let row = Math.floor(top / 24);
    row <= Math.ceil((top + height) / 24);
    row++
  ) {
    for (
      let col = Math.floor(left / 32);
      col <= Math.ceil((left + width) / 32);
      col++
    ) {
      const x = col * 32 + ((((row * 11) % 19) + 19) % 19),
        y = row * 24 + ((((col * 9) % 13) + 13) % 13);
      if (y < 145) continue;
      rect(x, y, 3, 1, "#a6a57c");
      rect(x + 4, y - 2, 2, 2, "#d7c9a1");
      if ((row + col) % 4 === 0) {
        rect(x - 2, y + 3, 2, 2, "#dca78b");
        rect(x + 1, y + 4, 2, 2, "#f0d49f");
      }
    }
  }
  for (const [i, [x, y]] of [
    [48, 208],
    [79, 218],
    [156, 254],
    [190, 284],
    [232, 367],
    [319, 395],
    [417, 388],
    [496, 463],
    [549, 518],
    [-95, 439],
    [-171, 519],
    [77, 622],
    [226, 673],
  ].entries()) {
    if (outsidePlots(x, y)) wildflowers(x, y, i);
  }
  const riverOffset = (mainlandHeight() - BASE_HEIGHT) * 28;
  const river = [
    [-380, 202],
    [0, 236],
    [55, 243],
    [99, 255],
    [150, 282],
    [227, 291],
    [333, 323],
    [417, 352],
    [510, 407],
    [590, 452],
    [690, 494],
    [790, 513],
    [1050, 535],
  ].map(([x, y]) => [x, y + riverOffset]);
  const ribbon = (upper, lower, color) =>
    poly(
      [
        ...river.map(([x, y]) => [x, y + upper]),
        ...river
          .slice()
          .reverse()
          .map(([x, y]) => [x, y + lower]),
      ],
      color,
    );
  ribbon(-18, 19, "#a99d80");
  ribbon(-14, 16, "#d4c39d");
  ribbon(-11, 13, "#477f7d");
  ribbon(-7, 9, "#69a9a2");
  ribbon(-2, 5, "#75b3aa");
  for (let i = 0; i < river.length - 1; i++) {
    const [x, y] = river[i],
      [nx, ny] = river[i + 1];
    for (let j = 0; j < 5; j++) {
      const t =
        ((j * 19 + i * 7 + Math.floor(game.sceneryTime / 220)) % 100) / 100;
      rect(
        x + (nx - x) * t,
        y + (ny - y) * t + (j % 3) * 3 - 3,
        4 + (j % 4),
        1,
        j % 2 ? "#a3cab0" : "#bde1c4",
      );
    }
  }
  const bridgeX = game.H === BASE_HEIGHT ? 108 : bridgePath()[1][0];
  for (let i = 0; i < river.length - 1; i++) {
    const [x, y] = river[i],
      [a, b] = river[i + 1];
    for (const t of [0.2, 0.58, 0.84]) {
      const px = x + (a - x) * t,
        py = y + (b - y) * t;
      if (Math.abs(px - bridgeX) < 34) continue;
      const edge = py + (i % 2 ? 14 : -13);
      if (outsidePlots(px, edge)) reedClump(px, edge, i);
      const foam = (Math.floor(game.sceneryTime / 240) + i) % 5;
      rect(px - foam, py + (i % 2 ? 8 : -8), 4 + foam, 1, "#d7e2c580");
    }
  }
  if (
    game.mode === "closed" ||
    (game.mode === "running" && game.clock >= businessDuration * 0.67)
  ) {
    const segment = river.findIndex(([x]) => x > bridgeX);
    const [ax, ay] = river[segment - 1],
      [bx, by] = river[segment];
    const waterY = ay + ((by - ay) * (bridgeX - ax)) / (bx - ax);
    for (let i = 0; i < 5; i++) {
      const glint = (Math.floor(game.sceneryTime / 280) + i) % 4;
      rect(
        bridgeX - 17 + i * 4,
        waterY + (i % 2) * 2,
        3 + glint,
        1,
        "#efd89a66",
      );
    }
  }
  if (game.H === BASE_HEIGHT) {
    poly(
      [
        [31, 358],
        [46, 343],
        [58, 321],
        [68, 300],
        [81, 279],
        [102, 277],
        [85, 305],
        [75, 328],
        [63, 350],
        [52, 365],
      ],
      "#c7bf97",
    );
    poly(
      [
        [107, 248],
        [117, 229],
        [132, 213],
        [153, 188],
        [174, 192],
        [150, 218],
        [132, 236],
        [123, 249],
      ],
      "#d7c7a0",
    );
    for (const [x, y] of [
      [53, 343],
      [62, 329],
      [70, 315],
      [79, 301],
      [87, 287],
      [118, 237],
      [127, 224],
      [139, 213],
      [151, 200],
    ]) {
      diamond(x, y, 8, 4, "#a5aa92");
      diamond(x, y - 1, 7, 3, "#e3d9b9");
    }
    footbridge();
    shrineGate(68, 316, 0.88);
    shrineGate(151, 208, 0.72);
  } else {
    const [head, bridgeEntry, bridgeExit, landing] = bridgePath();
    const [x, y] = head,
      [endX, endY] = bridgeEntry;
    paveConnector(head, bridgeEntry);
    resortLantern(x + 6, y + 15);
    resortLantern(x - 26, y + 33);
    if (game.state.acrossRiver) {
      const [lx, ly] = landing;
      paveConnector(bridgeExit, landing);
      for (const [dx, dy] of [
        [-28, 43],
        [-34, 49],
      ])
        diamond(endX + dx, endY + dy, 6, 3, "#e3d7b6");
      shrineGate(lx - 12, ly + 3, 0.62);
      for (const [bx, by] of [
        [-190, 448],
        [-159, 482],
        [-122, 513],
        [-64, 532],
        [-17, 526],
        [44, 533],
        [103, 539],
        [175, 565],
      ]) {
        blossom(bx, by, 0.68);
        gardenStone(bx + 11, by + 5, 0.47);
      }
    }
    footbridge(bridgeEntry, bridgeExit);
    blossom(endX + 12, endY + 4, 0.83);
  }
  for (const [x, y, z] of [
    [63, 202, 0.86],
    [188, 254, 0.87],
    [149, 302, 0.83],
    [206, 320, 1.04],
    [299, 366, 1.04],
    [328, 376, 0.86],
    [483, 389, 1],
    [519, 403, 1.02],
    [555, 427, 0.9],
    [680, 474, 1.1],
  ]) {
    if (outsidePlots(x, y)) blossom(x, y, z);
  }
  for (const [x, y] of [
    [210, 274],
    [249, 319],
    [364, 364],
    [489, 369],
    [551, 407],
    [639, 450],
    [757, 475],
  ]) {
    if (outsidePlots(x, y)) {
      gardenStone(x - 10, y, 0.85);
      resortLantern(x + 7, y + 4);
    }
  }
  diamond(321, 454, 51, 24, "#899f7d");
  diamond(321, 451, 45, 20, "#578981");
  diamond(320, 450, 40, 17, "#75aca0");
  for (const [x, y] of [
    [290, 448],
    [307, 438],
    [340, 446],
    [325, 460],
    [349, 457],
  ]) {
    rect(x - 3, y, 7, 2, "#668f69");
    rect(x - 1, y - 2, 3, 3, "#e7adab");
    rect(x - 1, y - 2, 2, 1, "#f9d6b9");
  }
  for (const [x, y, z] of [
    [281, 466, 0.75],
    [340, 472, 0.98],
    [374, 450, 0.85],
    [460, 469, 0.85],
    [581, 513, 0.8],
  ]) {
    blossom(x, y, z);
    gardenStone(x - 12, y + 7, 0.6);
  }
  diamond(367, 378, 29, 15, "#94a38b");
  diamond(367, 377, 26, 12, "#c4b395");
  building(367, 374, "room", 24, 24, 6);
  blossom(391, 379, 0.87);
  shrineGate(414, 407, 0.8);
  for (const [x, y] of [
    [401, 397],
    [389, 391],
    [376, 387],
    [427, 414],
    [441, 422],
  ]) {
    diamond(x, y, 7, 3, "#8e9e86");
    diamond(x, y - 1, 6, 2, "#ded0ae");
  }
  for (const [x, y, size] of [
    [28, 230, 1],
    [66, 227, 0.7],
    [149, 265, 0.85],
    [180, 276, 0.7],
    [230, 273, 0.9],
    [284, 291, 0.7],
    [356, 307, 1],
    [405, 306, 0.8],
    [448, 296, 1],
    [466, 253, 1.35],
    [443, 241, 1.1],
    [452, 228, 1.5],
    [468, 211, 1.7],
  ]) {
    gardenStone(x, y, size);
  }
  diamond(450, 263, 22, 9, "#819b81");
  diamond(450, 261, 17, 6, "#71a9a0");
  for (let i = 0; i < 3; i++) {
    const rise = (game.sceneryTime / 155 + i * 8) % 21;
    rect(440 + i * 8, 258 - rise, 4 + i, 2, "#d0e4c4");
  }
  for (const [x, y, z] of [
    [24, 168, 1],
    [41, 153, 0.75],
    [54, 181, 0.9],
    [70, 171, 0.6],
    [28, 207, 0.95],
    [55, 217, 0.55],
    [402, 151, 0.8],
    [430, 166, 1],
    [445, 146, 1.15],
    [467, 173, 0.9],
    [476, 210, 1.1],
    [428, 222, 0.8],
    [39, 299, 1],
    [51, 314, 0.72],
    [115, 298, 0.9],
    [125, 314, 1.1],
    [153, 329, 0.8],
    [185, 338, 0.7],
    [428, 358, 1],
    [458, 344, 0.8],
  ]) {
    pine(x, y, z);
  }
  for (const [x, y, scale] of [
    [72, 172, 0.83],
    [113, 212, 0.8],
    [173, 247, 0.8],
    [119, 296, 0.94],
    [208, 332, 0.75],
    [391, 354, 0.92],
  ]) {
    maple(x, y, scale);
  }
  for (const [x, y] of [
    [107, 232],
    [131, 244],
    [76, 283],
    [111, 285],
    [137, 214],
    [172, 202],
  ])
    if (outsidePlots(x, y)) resortLantern(x, y);
  for (const [x, y, size] of [
    [16, 356, 1],
    [33, 378, 1.15],
    [73, 385, 0.85],
    [94, 369, 0.6],
    [133, 398, 1.05],
    [279, 364, 0.8],
    [300, 378, 1.05],
    [321, 395, 0.75],
    [343, 384, 0.55],
    [388, 407, 1.1],
  ]) {
    pine(x, y, size);
  }
  for (const [x, y] of [
    [45, 368],
    [66, 364],
    [87, 358],
    [152, 361],
    [236, 324],
    [281, 335],
    [299, 352],
  ]) {
    diamond(x, y, 7, 3, "#96ad7c");
    rect(x - 5, y - 4, 9, 4, "#668e60");
    rect(x - 3, y - 7, 6, 4, "#86a76a");
    rect(x - 4, y - 5, 2, 2, "#e9b797");
    rect(x + 1, y - 6, 2, 2, "#f2cca1");
  }
  rect(63, 351, 3, 15, "#795a43");
  rect(71, 351, 3, 15, "#795a43");
  rect(58, 341, 22, 13, "#79533f");
  rect(59, 342, 20, 10, "#dfb983");
  rect(60, 340, 18, 2, "#567573");
  for (const x of [65, 69, 73]) {
    rect(x, 344, 1, 5, "#8a5840");
    rect(x + 1, 343, 1, 2, "#8a5840");
  }
}

export {
  blossom,
  bridgePath,
  gardenStone,
  ground,
  pine,
  resortLantern,
  riversideGate,
  riversideGatePosition,
  shrineGate,
};
