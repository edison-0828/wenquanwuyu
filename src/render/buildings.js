// 各类建筑、等级外观及温泉的像素绘制。

import { game } from "../core/state.js";
import {
  businessDuration,
  facilityStyles,
  isLodging,
  tierColors,
} from "../data/catalog.js";
import { blossom, gardenStone, resortLantern } from "./landscape.js";
import { drawBather } from "./people.js";
import { diamond, poly, rect } from "./primitives.js";

function building(
  x,
  y,
  k,
  width = 24,
  depth = 24,
  level = 1,
  facade = "original",
  bathers = [],
) {
  if (k === "bath") {
    const custom = facade !== "original" ? facilityStyles[facade] : null;
    const pool = (dy, color) =>
      poly(
        [
          [-22, -2],
          [-15, -8],
          [-3, -13],
          [12, -10],
          [23, -4],
          [23, 3],
          [12, 9],
          [-3, 12],
          [-17, 7],
        ].map(([dx, v]) => [x + dx, y + v + dy]),
        color,
      );
    if (level >= 2) {
      for (let i = 0; i < 8; i++) {
        const bx = x - 22 + i * 3,
          by = y - 13 - i;
        rect(bx, by - 6, 2, 11, i % 2 ? "#8a9a65" : "#aab87b");
        rect(bx, by - 4, 2, 1, "#d3ce9e");
        rect(bx, by + 1, 2, 1, "#627e59");
      }
      poly(
        [
          [x - 23, y - 17],
          [x, y - 25],
          [x, y - 23],
          [x - 23, y - 15],
        ],
        "#806d49",
      );
    }
    diamond(x + 2, y + 5, 25, 12, "#87987b");
    pool(4, "#4f6a60");
    pool(2, custom?.roof || "#647c6d");
    pool(0, custom?.light || "#afb49b");
    diamond(x, y + 1, 20, 9, "#d3ccb0");
    diamond(x, y - 1, 19, 9, "#427e79");
    diamond(x, y - 1, 16, 7, "#70bcb1");
    diamond(x - 1, y - 2, 13, 4, "#82c6b4");
    for (let i = 0; i < 4; i++) {
      const glint = (Math.floor(game.sceneryTime / 260) + i * 3) % 12;
      rect(
        x - 13 + glint + i * 4,
        y - 4 + (i % 3) * 2,
        2 + (i % 2),
        1,
        "#c2e2c6",
      );
    }
    for (const [dx, dy, size] of [
      [-18, -4, 0.39],
      [-11, -8, 0.4],
      [-2, -11, 0.4],
      [9, -9, 0.45],
      [18, -5, 0.4],
      [-20, 3, 0.4],
      [-12, 7, 0.42],
      [-3, 9, 0.39],
      [7, 8, 0.41],
      [15, 5, 0.36],
      [21, 1, 0.34],
    ]) {
      gardenStone(x + dx, y + dy, size);
    }
    rect(x + 13, y - 9, 5, 4, "#627665");
    rect(x + 12, y - 10, 6, 2, "#b3b39a");
    rect(x + 12, y - 6, 3, 3, "#b3ddd1");
    const splash = Math.floor(game.sceneryTime / 160) % 3;
    rect(x + 9 - splash, y - 2, 4 + splash, 1, "#def0cd");
    if (level >= 3) {
      rect(x - 18, y - 3, 5, 2, "#ac8755");
      rect(x - 17, y - 4, 3, 1, "#dec08c");
    }
    for (let i = 0; i < 6; i++) {
      const wave = (Math.floor(game.sceneryTime / 220) + i) % 5;
      rect(
        x - 11 + i * 4,
        y - 4 + (i % 3) * 2,
        2 + wave,
        1,
        i % 2 ? "#a7ded0" : "#e0edc6",
      );
    }
    bathers
      .sort((a, b) => a.y - b.y)
      .forEach((guest) =>
        drawBather(guest.x, guest.y, guest.type, guest.index),
      );
    for (let i = 0; i < 3; i++) {
      const phase = (game.sceneryTime / 100 + i * 9) % 28;
      const px = x - 9 + i * 8 + Math.round(Math.sin(phase / 4) * 2),
        py = y - 6 - phase;
      game.ctx.globalAlpha = (1 - phase / 29) * 0.8;
      rect(px - 2, py, 5, 2, "#f9f5df");
      rect(px - 1, py - 2, 4, 1, "#f9f5df");
      game.ctx.globalAlpha = 1;
    }
    poly(
      [
        [x - 3, y + 9],
        [x + 6, y + 7],
        [x + 12, y + 12],
        [x + 3, y + 14],
      ],
      "#7c604b",
    );
    poly(
      [
        [x - 3, y + 8],
        [x + 6, y + 6],
        [x + 11, y + 11],
        [x + 3, y + 13],
      ],
      "#c89d68",
    );
    rect(x + 1, y + 9, 7, 1, "#e3bf89");
    rect(x + 4, y + 11, 6, 1, "#916d4d");
    for (let i = 0; i < 3; i++) rect(x + i * 3, y + 10 + i, 2, 1, "#e3bc81");
    rect(x - 13, y + 7, 3, 3, "#96714e");
    rect(x - 12, y + 6, 2, 1, "#dfbd86");
    rect(x - 18, y + 4, 6, 2, "#efe3bb");
    rect(x - 17, y + 3, 4, 1, "#fff1d7");
    resortLantern(x - 20, y + 4);
    if (custom) {
      diamond(x + 3, y + 10, 12, 3, custom.cloth);
      rect(x - 6, y + 8, 16, 1, custom.light);
    }
    if (level >= 3) resortLantern(x + 19, y + 5);
    if (level >= 4) {
      rect(x + 10, y - 23, 2, 19, "#73503b");
      rect(x + 21, y - 17, 2, 17, "#73503b");
      poly(
        [
          [x + 4, y - 22],
          [x + 12, y - 29],
          [x + 27, y - 22],
          [x + 21, y - 16],
        ],
        "#404e4f",
      );
      poly(
        [
          [x + 5, y - 23],
          [x + 12, y - 28],
          [x + 26, y - 22],
          [x + 21, y - 19],
        ],
        custom?.roof || tierColors[level - 1],
      );
      rect(x + 12, y - 27, 7, 1, "#f4ce8b");
    }
    if (level >= 5) {
      rect(x + 13, y - 20, 4, 6, "#b76c74");
      rect(x + 18, y - 18, 4, 6, "#a85a64");
      rect(x + 14, y - 18, 1, 2, "#f6d49a");
      rect(x + 19, y - 16, 1, 2, "#f6d49a");
    }
    if (level >= 6) {
      rect(x + 11, y - 31, 4, 3, "#eac57c");
      rect(x + 12, y - 33, 2, 2, "#fff1b8");
      rect(x + 8, y - 23, 6, 1, "#f7da9d");
      rect(x + 19, y - 19, 5, 1, "#f7da9d");
    }
    return;
  }
  if (game.state.weather === "sun") {
    diamond(x + 8, y + 7, (width + depth) / 2, 9, "#40544435");
  }
  const style =
    facade !== "original"
      ? facilityStyles[facade]
      : {
          room: {
            wall: "#f4d9a6",
            shade: "#d0a274",
            roof: "#527e77",
            light: "#83a498",
            cloth: "#427d72",
          },
          machiya: {
            wall: "#d8a67e",
            shade: "#ab7757",
            roof: "#9d6150",
            light: "#c38766",
            cloth: "#ba6a58",
          },
          kura: {
            wall: "#f0ead9",
            shade: "#bebcad",
            roof: "#505964",
            light: "#89929a",
            cloth: "#5c687b",
          },
          towerInn: {
            wall: "#efce9b",
            shade: "#bd9a75",
            roof: "#487777",
            light: "#8fb1a1",
            cloth: "#5e8a7c",
          },
          food: {
            wall: "#f4c6a1",
            shade: "#cc9272",
            roof: "#a75e56",
            light: "#d68d73",
            cloth: "#a3504d",
          },
          shop: {
            wall: "#dedcb3",
            shade: "#aeb491",
            roof: "#577388",
            light: "#8ba4ad",
            cloth: "#506f92",
          },
          gifts: {
            wall: "#f2d2ba",
            shade: "#c39782",
            roof: "#8f596c",
            light: "#c98a94",
            cloth: "#a84f6c",
          },
          dango: {
            wall: "#f4d6ae",
            shade: "#bc9374",
            roof: "#ad6b4a",
            light: "#dca575",
            cloth: "#b85e55",
          },
          teaHouse: {
            wall: "#e1e3bf",
            shade: "#a3ae84",
            roof: "#537865",
            light: "#90ac7c",
            cloth: "#638959",
          },
          arcade: {
            wall: "#f4d1af",
            shade: "#be9486",
            roof: "#855877",
            light: "#c58ea4",
            cloth: "#b36d83",
          },
          buffet: {
            wall: "#f0c797",
            shade: "#c88e65",
            roof: "#99564d",
            light: "#d08768",
            cloth: "#ad5551",
          },
          stage: {
            wall: "#e1c2ab",
            shade: "#b88b81",
            roof: "#554c68",
            light: "#89768f",
            cloth: "#a35263",
          },
          cinema: {
            wall: "#d7d7e7",
            shade: "#a49bb7",
            roof: "#505477",
            light: "#7f81a7",
            cloth: "#806da3",
          },
        }[k];
  const point = (u, v, z = 0) => [
    x + u - v,
    y - 13 + Math.round((u + v) * 0.56) - z,
  ];
  const face = (points, color) =>
    poly(
      points.map((p) => point(...p)),
      color,
    );
  const front = (u, v, z, w, h, color) =>
    face(
      [
        [u, v, z],
        [u + w, v, z],
        [u + w, v, z + h],
        [u, v, z + h],
      ],
      color,
    );
  const side = (u, v, z, d, h, color) =>
    face(
      [
        [u, v, z],
        [u, v + d, z],
        [u, v + d, z + h],
        [u, v, z + h],
      ],
      color,
    );
  const floor = (u, v, w, d, z, color) =>
    face(
      [
        [u, v, z],
        [u + w, v, z],
        [u + w, v + d, z],
        [u, v + d, z],
      ],
      color,
    );
  const wood = "#725044",
    dark = "#493e40";
  const win = (u, v, z, w) => {
    front(u, v, z, w, 6, wood);
    front(u + 1, v, z + 1, w - 2, 4, "#ebcc8e");
    front(u + Math.floor(w / 2), v, z + 1, 1, 4, "#937450");
    front(u + 1, v, z + 3, w - 2, 1, "#b69766");
    front(u + 1, v, z + 4, w - 2, 1, "#f7dfaa");
    front(u - 1, v, z - 1, w + 2, 1, "#9a7254");
  };
  const roof = (u, v, w, d, z, rise) => {
    const over = 2,
      start = u - over,
      end = u + w + over,
      back = v - over,
      edge = v + d + over,
      ridge = v + d / 2;
    const gold = level === 6;
    const rim = gold ? "#e1b368" : dark;
    const color =
      level === 1 && k === "room" && facade === "original"
        ? "#8c6550"
        : style.roof;
    const highlight =
      level === 1 && k === "room" && facade === "original"
        ? "#ae8060"
        : style.light;
    face(
      [
        [start, back, z],
        [end, back, z],
        [end, ridge, z + rise],
        [start, ridge, z + rise],
      ],
      highlight,
    );
    face(
      [
        [end, back, z],
        [end, ridge, z + rise],
        [end, edge, z],
      ],
      style.shade,
    );
    face(
      [
        [start, ridge, z + rise],
        [end, ridge, z + rise],
        [end, edge, z],
        [start, edge, z],
      ],
      color,
    );
    for (let n = 1; n <= 3; n++) {
      const t = n / 4,
        dv = (edge - ridge) * t,
        dz = rise * (1 - t);
      front(start, ridge + dv, z + dz, end - start, 0.65, highlight);
    }
    for (let a = start + 2; a < end; a += 3) {
      face(
        [
          [a, ridge, z + rise],
          [a + 0.55, ridge, z + rise],
          [a + 0.55, edge, z],
          [a, edge, z],
        ],
        "#352f3d25",
      );
    }
    front(start, edge, z - 1, end - start, 2, rim);
    front(start + 1, edge, z + 1, end - start - 2, 0.65, highlight);
    front(start, ridge, z + rise, end - start, 1, gold ? "#ffe0a0" : highlight);
    if (level >= 3) {
      side(end, back, z, edge - back, 1, rim);
      for (let a = start + 2; a < end; a += 4)
        front(a, edge, z, 1, 1, highlight);
    }
  };
  const story = (u, v, w, d, z, h, base) => {
    const edge = v + d;
    side(u + w, v, z, d, h, style.shade);
    front(u, edge, z, w, h, style.wall);
    side(u + w, v, z, d, 2, wood);
    front(u, edge, z, w, 2, wood);
    for (const post of [u, u + w - 1]) front(post, edge, z, 1, h, wood);
    for (const post of [v, v + d - 1]) side(u + w, post, z, 1, h, wood);
    for (let a = u + 3; a + 5 < u + w - 2; a += 8) win(a, edge, z + 4, 5);
    for (let a = v + 3; a + 4 < v + d; a += 8) {
      side(u + w, a, z + 4, 5, 6, wood);
      side(u + w, a + 1, z + 5, 3, 4, "#e3bd80");
      side(u + w, a + 2, z + 5, 1, 4, "#a17c55");
    }
    if (base && k === "machiya") {
      for (let a = u + 2; a < u + w - 2; a += 2)
        front(a, edge, z + 2, 1, h - 3, "#86563e");
      floor(u - 1, edge, w + 2, 4, z + h - 1, style.roof);
    }
    if (base && k === "kura") {
      front(u, edge, z, w, 4, "#71777a");
      side(u + w, v, z, d, 4, "#676b70");
      for (let a = u + 2; a < u + w; a += 4)
        front(a, edge, z + 1, 1, 2, "#aeb0aa");
      front(u, edge, z + h - 2, w, 1, "#aaa49a");
    }
    if (base) {
      const door = u + Math.floor((w - 6) / 2);
      front(door, edge, z, 6, h - 2, wood);
      front(door + 1, edge, z + 1, 4, h - 4, "#a87652");
      front(door + 3, edge, z + 1, 1, h - 4, "#684a3e");
      if (level >= 2) {
        floor(door - 2, edge, 10, 3, z + h - 3, style.roof);
        front(door - 2, edge + 3, z + h - 4, 10, 1, dark);
        for (const dx of [0, 3])
          front(door + dx, edge, z + h - 7, 3, 3, style.cloth);
        if (!isLodging(k)) front(door, edge, z + h - 1, 6, 2, "#f0c882");
      }
    } else if (level >= 5) {
      floor(u - 1, edge, w + 2, 3, z + 1, "#ac805a");
      front(u - 1, edge + 3, z + 4, w + 2, 1, "#774b42");
      for (let a = u - 1; a < u + w + 1; a += 3)
        front(a, edge + 3, z + 1, 1, 4, "#92614e");
    }
  };
  if (["food", "teaHouse", "dango", "arcade", "shop", "gifts"].includes(k)) {
    const box = (u, v, w, d, h, top, frontColor = wood) => {
      front(u, v + d, 0, w, h, frontColor);
      side(u + w, v, 0, d, h, "#805a48");
      floor(u, v, w, d, h, top);
    };
    const post = (u, v, h = 12) => {
      front(u, v, 0, 1, h, wood);
      side(u + 1, v, 0, 1, h, "#ac8058");
    };
    const label = (u, v, z, textColor) => {
      front(u, v, z, 6, 4, "#73513f");
      front(u + 1, v, z + 1, 4, 2, textColor);
    };
    const canopy = (u, v, w, d, z, color) => {
      floor(u, v, w, d, z, color);
      front(u, v + d, z - 2, w, 2, style.cloth);
      front(u, v + d, z, w, 0.7, "#efd1a1");
    };
    floor(1, 1, 22, 22, -2, "#7f896d");
    floor(2, 2, 20, 20, 0, "#d8bd8f");
    if (k === "shop") {
      side(22, 2, 0, 13, 10, style.shade);
      front(3, 14, 0, 18, 10, "#876347");
      front(5, 15, 2, 14, 6, "#4d4c3d");
      for (let u = 6; u < 19; u += 4) {
        front(u, 15, 3, 2, 3, u % 3 ? "#d4b47b" : "#c3956c");
        front(u, 15, 7, 2, 1, "#e4cba1");
      }
      roof(2, 1, 20, 12, 12, 4);
      for (const [u, v] of [
        [3, 17],
        [10, 19],
        [17, 17],
      ]) {
        box(u, v, 5, 3, 3, "#bf9567");
        floor(u + 1, v + 1, 3, 1, 3.2, "#dec799");
        front(u + 2, v + 3, 0, 1, 3, "#81603e");
      }
      if (level >= 2) canopy(2, 15, 20, 6, 9, style.roof);
      if (level >= 3) box(4, 6, 4, 5, 5, "#dabd87");
      if (level >= 4) label(16, 15, 9, "#ebcf93");
      if (level >= 5) {
        post(2, 22, 10);
        post(22, 22, 10);
        canopy(1, 17, 22, 5, 11, style.light);
      }
      if (level === 6) roof(2, 1, 20, 12, 15, 5);
    } else if (k === "gifts") {
      side(22, 2, 0, 17, 15, style.shade);
      front(3, 20, 0, 18, 15, style.wall);
      front(4, 21, 4, 7, 8, "#73504b");
      front(5, 21, 5, 5, 6, "#9bbfb3");
      front(5, 21, 10, 5, 1, "#d1e3cc");
      front(8, 21, 5, 1, 6, "#f1d0a0");
      front(13, 21, 2, 7, 10, "#6b5550");
      front(14, 21, 3, 5, 8, "#aed0c3");
      front(16, 21, 3, 1, 8, "#8d6c57");
      roof(2, 1, 20, 11, 17, 4);
      canopy(2, 17, 20, 5, 14, style.cloth);
      for (const u of [5, 9]) {
        front(u, 21, 5, 2, 2, u === 5 ? "#b76381" : "#e1c187");
        front(u + 1, 21, 5, 1, 2, "#ffe3a7");
      }
      if (level >= 2) label(6, 21, 14, "#f8d5a1");
      if (level >= 3) {
        box(2, 22, 6, 2, 3, "#dcb985");
        front(3, 24, 1, 3, 2, "#ba6c8b");
        front(4, 24, 1, 1, 2, "#efd0a0");
      }
      if (level >= 4)
        for (let u = 4; u < 20; u += 4) front(u, 22, 11, 2, 2, "#f2cd8c");
      if (level >= 5) roof(5, 3, 14, 8, 22, 3);
      if (level === 6) {
        front(3, 20, 14, 18, 1, "#f3cb82");
        const [px, py] = point(12, 7, 27);
        rect(px - 2, py - 3, 5, 3, "#e7b56f");
        rect(px, py - 5, 1, 2, "#fff1b0");
      }
    } else if (k === "dango") {
      for (const u of [6, 17]) {
        const [px, py] = point(u, 16);
        rect(px - 2, py - 1, 4, 4, "#4d4540");
        rect(px - 1, py, 2, 2, "#a98c69");
      }
      box(4, 9, 16, 7, 6, "#be945e");
      floor(5, 10, 9, 5, 6.2, "#4c4c43");
      for (let u = 6; u < 14; u += 2) {
        floor(u, 10, 1, 5, 6.3, "#a38b6c");
        const [px, py] = point(u, 12, 7);
        rect(px - 1, py - 1, 2, 2, "#e5bd79");
        rect(px, py + 1, 2, 1, "#c88a54");
      }
      box(16, 10, 3, 4, 8, "#e8c181");
      if (level >= 2) {
        post(4, 8);
        post(20, 8);
        post(4, 18);
        post(20, 18);
        canopy(3, 7, 19, 12, 13, style.roof);
      }
      if (level >= 3) box(5, 3, 8, 4, 4, "#55534a");
      if (level >= 4) label(15, 18, 9, "#f2cf86");
      if (level >= 5) canopy(1, 3, 10, 4, 8, style.light);
      if (level === 6) roof(3, 7, 17, 10, 14, 3);
      const rise = (game.sceneryTime / 180) % 11,
        [sx, sy] = point(9, 12, 8);
      rect(sx - 2, sy - rise, 3, 1, "#f6ead09c");
    } else if (k === "teaHouse") {
      for (const v of [8, 17]) {
        box(4, v, 10, 2, 3, "#a45951");
        box(7, v - 4, 6, 3, 3, "#b49363");
        floor(9, v - 3, 2, 1, 3.2, "#85a56d");
      }
      if (level >= 2) {
        const [px, py] = point(17, 7);
        rect(px, py - 18, 1, 18, "#8d6546");
        poly(
          [
            [px - 9, py - 14],
            [px - 5, py - 20],
            [px + 1, py - 22],
            [px + 8, py - 17],
            [px + 10, py - 13],
            [px, py - 12],
          ],
          style.cloth,
        );
        rect(px, py - 22, 1, 9, "#efcf9c");
      }
      if (level >= 3) {
        for (const [u, v] of [
          [2, 2],
          [21, 2],
          [2, 21],
          [21, 21],
        ])
          post(u, v, 13);
        roof(3, 2, 17, 8, 14, 4);
        for (let u = 4; u < 19; u += 2) front(u, 4, 5, 1, 7, "#a7ac72");
      }
      if (level >= 4) floor(2, 19, 20, 3, 1, "#bf976a");
      if (level >= 5) {
        const [px, py] = point(19, 19);
        gardenStone(px, py, 0.33);
        blossom(px, py, 0.38);
      }
      if (level === 6) roof(3, 2, 17, 9, 15, 5);
    } else if (k === "arcade") {
      box(3, 4, 18, 3, 11, "#b39468", style.cloth);
      for (let u = 5; u < 20; u += 4) {
        front(
          u,
          7,
          3,
          2,
          3,
          ["#bb7f93", "#91ab8b", "#e1ba6c"][((u - 5) / 4) % 3],
        );
        front(u, 7, 8, 2, 2, "#f1cf94");
      }
      box(4, 15, 16, 5, 4, "#b4845e");
      for (let u = 6; u < 19; u += 4) {
        floor(u, 16, 2, 2, 4.2, "#a0b5a3");
        front(u, 18, 4, 2, 2, "#d4cc93");
      }
      if (level >= 2) {
        for (const u of [3, 21]) post(u, 12, 15);
        canopy(2, 1, 20, 8, 15, style.roof);
      }
      if (level >= 3) label(12, 8, 12, "#f2cf86");
      if (level >= 4) {
        post(3, 21, 12);
        post(21, 21, 12);
        canopy(2, 15, 20, 7, 13, style.light);
      }
      if (level >= 5)
        for (let u = 5; u < 20; u += 4) front(u, 21, 8, 2, 3, "#f0c67c");
      if (level === 6) roof(3, 2, 18, 7, 17, 3);
    } else {
      side(22, 2, 0, 12, 13, style.shade);
      front(3, 12, 0, 18, 12, style.wall);
      roof(2, 1, 20, 11, 14, 5);
      front(5, 13, 2, 14, 7, "#4c4542");
      for (const u of [5, 11, 17]) front(u, 14, 6, 3, 4, style.cloth);
      for (const u of [5, 14]) {
        box(u, 17, 5, 3, 4, "#bd9569");
        floor(u + 1, 18, 2, 1, 4.2, "#f2dfb4");
      }
      const [px, py] = point(19, 5, 15);
      rect(px, py - 7, 4, 9, "#6e6760");
      rect(px - 1, py - 8, 6, 2, "#a49e84");
      const steam = (game.sceneryTime / 160) % 12;
      rect(px + Math.sin(steam / 3), py - 10 - steam, 3, 2, "#f7eadca0");
      if (level >= 2) label(3, 20, 2, "#f3d28e");
      if (level >= 3) box(2, 3, 5, 5, 5, "#777566");
      if (level >= 4) for (let u = 5; u < 20; u += 5) win(u, 12, 4, 4);
      if (level >= 5) canopy(2, 15, 20, 7, 11, style.light);
      if (level === 6) roof(2, 1, 20, 11, 16, 6);
    }
    return;
  }
  if (isLodging(k)) {
    const w = width - 6,
      d = depth - 6,
      edge = depth - 3;
    floor(1, 1, width - 2, depth - 2, -2, "#7f896d");
    floor(2, 2, width - 4, depth - 4, 0, "#d6c49e");
    const balcony = (u, v, w, z) => {
      floor(u, v, w, 3, z, "#b89268");
      front(u, v + 3, z + 3, w, 1, "#72503e");
      for (let post = u; post <= u + w; post += 3)
        front(post, v + 3, z, 1, 3, "#94674a");
    };
    if (k === "machiya") {
      story(3, 3, w, d, 0, 9, true);
      roof(2, 2, w + 2, d, 10, 3);
      const upper = 13;
      story(4, 3, w - 2, d - 2, upper, 7, false);
      for (let u = 5; u < width - 5; u += 2)
        front(u, edge - 2, upper + 1, 1, 6, "#7a4d38");
      roof(3, 2, w, d - 1, upper + 8, 4);
      if (level >= 2) front(5, edge, 5, w - 4, 3, style.cloth);
      if (level >= 3) balcony(3, edge - 2, w, upper);
      if (level >= 4) {
        const [px, py] = point(width - 4, edge, 9);
        rect(px - 1, py - 5, 3, 5, "#f5d28d");
      }
      if (level >= 5) floor(1, edge, width - 2, 3, 8, style.roof);
      if (level === 6) front(4, edge - 2, upper + 8, w - 2, 1, "#edc57f");
    } else if (k === "kura") {
      story(3, 3, w, d, 0, 17, true);
      front(3, edge, 0, w, 6, "#777b79");
      side(width - 3, 3, 0, d, 6, "#646e71");
      for (let u = 4; u < width - 4; u += 4) {
        front(u, edge, 1, 3, 2, "#9da5a0");
        front(u + 1, edge, 4, 3, 1, "#b5b8ad");
      }
      front(5, edge, 8, 5, 6, "#6a6867");
      front(6, edge, 9, 3, 4, "#c8d4c8");
      for (const v of [6, 12]) {
        side(width - 3, v, 9, 4, 5, "#62646a");
        side(width - 3, v + 1, 10, 2, 3, "#b4c1bc");
      }
      roof(2, 2, w + 2, d + 1, 18, 8);
      if (level >= 2) front(3, edge, 16, w, 1, "#b9b7a7");
      if (level >= 3) {
        const [px, py] = point(5, edge, 8);
        rect(px - 1, py - 3, 3, 4, "#f3cc89");
      }
      if (level >= 4) {
        floor(3, 3, w, d, 25, "#e8e0ca");
        roof(5, 4, w - 4, d - 4, 27, 5);
      }
      if (level >= 5) front(width - 6, edge, 7, 2, 7, "#887353");
      if (level === 6) front(4, edge, 17, w - 2, 1, "#e3ba7a");
    } else if (k === "towerInn") {
      const heights = level >= 4 ? [12, 24, 36] : [12, 24];
      story(3, 3, w, d, 0, 12, true);
      roof(2, 2, w + 2, d + 1, 12, 5);
      for (let i = 1; i < heights.length; i++) {
        const u = 3 + i * 2,
          v = 3 + i * 2,
          z = heights[i - 1] + 3;
        story(u, v, w - i * 4, d - i * 4, z, 8, false);
        balcony(u - 1, v + d - i * 4, w - i * 4 + 2, z);
        roof(u - 1, v - 1, w - i * 4 + 2, d - i * 4 + 2, z + 9, 5);
      }
      if (level >= 2) balcony(2, edge, width - 4, 3);
      if (level >= 3) {
        const [px, py] = point(width - 4, edge, 7);
        rect(px - 2, py - 5, 4, 5, "#f4d391");
      }
      if (level >= 5) front(5, edge, 9, w - 4, 2, style.cloth);
      if (level === 6) {
        const [px, py] = point(width / 2, depth / 2, 48);
        rect(px - 2, py - 2, 5, 2, "#e8bb73");
        rect(px, py - 4, 1, 2, "#fff0b2");
      }
    } else {
      story(3, 3, w, d, 0, 10, true);
      roof(2, 2, w + 2, d, 11, 4);
      floor(3, edge, w, 3, 1, "#a6845b");
      for (let u = 4; u < width - 5; u += 6) front(u, edge, 3, 4, 5, "#d8d2b0");
      if (level >= 2) floor(2, edge, width - 4, 3, 8, style.roof);
      if (level >= 3)
        for (let u = 5; u < width - 5; u += 3)
          front(u, edge, 4, 1, 5, "#88754e");
      if (level >= 4) {
        story(7, 4, w - 8, d - 5, 13, 7, false);
        roof(6, 3, w - 6, d - 3, 21, 4);
      }
      if (level >= 5) balcony(4, edge, w - 2, 2);
      if (level === 6) front(4, edge, 10, w - 2, 1, "#eac582");
    }
    return;
  }
  const w = width - 6,
    d = depth - 6;
  floor(1, 1, width - 2, depth - 2, -2, "#7f896d");
  floor(2, 2, width - 4, depth - 4, 0, "#c3b18c");
  const baseHeight =
    k === "buffet"
      ? 8
      : k === "stage"
        ? 15
        : k === "cinema"
          ? 13
          : k === "kura"
            ? 15
            : k === "machiya"
              ? 10
              : level === 1
                ? 11
                : level <= 3
                  ? 13
                  : 12;
  const dusk =
    game.mode === "closed" ||
    (game.mode === "running" && game.clock >= businessDuration * 0.67);
  const entranceEdge = depth - 3;
  if (k === "buffet") {
    const canopy = "#ab5751",
      lit = dusk ? "#ffe2a1" : "#efba7e";
    side(width - 3, 3, 0, d, 8, style.shade);
    for (let u = 3; u < width - 3; u += 6) {
      front(u, entranceEdge, 0, 1, 9, "#725044");
      front(u + 1, entranceEdge, 2, 5, 4, "#654e43");
      front(u + 1, entranceEdge + 1, 3, 5, 2, "#c29a6b");
      front(u + 2, entranceEdge + 1, 5, 2, 1, lit);
      floor(u, entranceEdge - 1, 6, 5, 9, (u - 3) % 12 ? canopy : "#e3c19b");
      front(u, entranceEdge + 4, 7, 6, 2, (u - 3) % 12 ? "#8c4a48" : "#d6a478");
      const [lx, ly] = point(u + 3, entranceEdge + 3, 6);
      if (dusk) diamond(lx, ly, 4, 3, "#ffd68050");
      rect(lx - 1, ly - 1, 3, 3, lit);
      if (game.mode === "running") {
        const [cx, cy] = point(u + 3, entranceEdge + 2, 4);
        const steam = (game.sceneryTime / 170 + u) % 9;
        rect(cx, cy - 3 - steam, 2, 2, "#f4e7c48c");
        rect(cx + 1, cy - 4 - steam, 2, 1, "#fff0cf6b");
        rect(cx - 2, cy - 1, 4, 1, "#edbd7b");
      }
    }
    if (level >= 2) roof(3, 4, w, d - 5, 8, 2 + Math.min(3, level));
  } else if (k === "stage") {
    floor(2, 3, width - 4, depth - 4, 3, "#b88b61");
    front(2, depth - 1, 0, width - 4, 3, "#795440");
    front(4, entranceEdge - 5, 3, w - 2, 11, "#433b4b");
    front(4, entranceEdge - 4, 8, w - 2, 3, "#b4565c");
    front(4, entranceEdge, 3, 4, 10, "#ab4e56");
    front(width - 8, entranceEdge, 3, 4, 10, "#ab4e56");
    for (const u of [5, width - 7]) front(u, entranceEdge, 4, 1, 8, "#db8575");
    front(8, entranceEdge - 3, 3, 8, 2, "#cfaa79");
    const [sx, sy] = point(width / 2, entranceEdge - 4, 6);
    rect(sx - 3, sy - 4, 7, 4, "#a76a4a");
    rect(sx - 2, sy - 5, 5, 2, "#f0cf91");
    if (dusk) {
      diamond(sx, sy + 1, 10, 3, "#eebf6440");
      rect(sx - 3, sy - 5, 7, 1, "#f4dfa0");
    }
    roof(2, 2, w + 2, d + 1, baseHeight, 6);
  } else {
    story(3, 3, w, d, 0, baseHeight, true);
    roof(
      3,
      3,
      w,
      d,
      baseHeight,
      k === "cinema"
        ? 3
        : k === "kura"
          ? 8
          : k === "machiya"
            ? 4
            : level === 1
              ? 4
              : level === 2
                ? 5
                : 7,
    );
  }
  if (level >= 4 || k === "towerInn") {
    const upper = baseHeight + 3;
    story(6, 6, w - 6, d - 6, upper, 9, false);
    roof(6, 6, w - 6, d - 6, upper + 9, level === 4 ? 4 : 5);
  }
  if (level === 6 || (k === "towerInn" && level >= 4)) {
    const top = baseHeight + 15;
    story(8, 8, w - 10, d - 10, top, 7, false);
    roof(8, 8, w - 10, d - 10, top + 7, 5);
    const [px, py] = point(8 + (w - 10) / 2, 8 + (d - 10) / 2, top + 12);
    rect(px - 2, py - 2, 5, 2, "#e8b66a");
    rect(px, py - 4, 1, 2, "#fff1b5");
  }
  if (k === "stage" && game.mode === "running") {
    const [px, py] = point(width / 2, entranceEdge, 4);
    const beat = Math.floor(game.sceneryTime / 250) % 4;
    rect(px - 2, py - 9, 5, 4, "#453737");
    rect(px - 1, py - 7, 4, 3, "#e5b78d");
    rect(px - 2, py - 3, 6, 4, "#a95762");
    rect(px, py - 2, 2, 2, "#f2cf86");
    rect(px - 2, py + 1, 2, 2, "#665145");
    rect(px + 2, py + 1, 2, 2, "#665145");
    const hand = beat % 2 ? 2 : 0;
    rect(px - 4, py - 3 - hand, 2, 2, "#eac49a");
    rect(px + 4, py - 5 + hand, 2, 2, "#eac49a");
    rect(px - 4, py - 5 - hand, 1, 3, "#bd8e61");
    rect(px + 5, py - 7 + hand, 1, 3, "#bd8e61");
    rect(px + 6, py - 1, 5, 4, "#9d6147");
    rect(px + 5, py - 2, 7, 2, "#e9c18a");
    if (beat === 0) {
      rect(px + 9, py - 6, 2, 1, "#f3d6a0");
      rect(px + 11, py - 8, 1, 2, "#f3d6a0");
    }
  }
  if (k === "cinema") {
    const edge = entranceEdge;
    floor(0, edge - 1, width, 6, 10, "#555871");
    front(0, edge + 5, 8, width, 2, "#4a4054");
    for (let u = 2; u < width; u += 4) {
      const lit =
        game.mode === "running" &&
        (Math.floor(game.sceneryTime / 260) + u / 4) % 3 < 2;
      front(
        u,
        edge + 5,
        8,
        1,
        1,
        lit ? "#fff0b3" : dusk ? "#dcb473" : "#cdab73",
      );
    }
    const [sx, sy] = point(width / 2, edge + 4, 12);
    if (dusk) diamond(sx, sy, 14, 6, "#f6c57840");
    rect(sx - 11, sy - 5, 23, 8, "#514455");
    rect(sx - 10, sy - 4, 21, 6, dusk ? "#ffe2a0" : "#edc587");
    for (const dx of [-6, -1, 4]) rect(sx + dx, sy - 3, 3, 4, "#955666");
    rect(sx - 7, sy - 1, 15, 1, "#f2b984");
  }
  if (level >= 3) {
    const [lx, ly] = point(width - 4, depth - 2);
    rect(lx - 1, ly - 4, 3, 4, "#795745");
    rect(lx - 2, ly - 6, 5, 3, "#efc373");
  }
}

export { building };
