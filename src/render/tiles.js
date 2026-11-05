// 道路、水面、动物和庭园地块绘制。

import { game } from "../core/state.js";
import { animals } from "../data/catalog.js";
import {
  blossom,
  gardenStone,
  pine,
  resortLantern,
  shrineGate,
} from "./landscape.js";
import { diamond, poly, rect } from "./primitives.js";

function wetRoad(x, y, seed) {
  if (game.state.weather !== "rain") return;
  diamond(x + 4, y + 3, 7, 2, "#c4d9d04d");
  diamond(x - 8, y - 3, 4, 1, "#d4e4d75c");
  const ripple = (Math.floor(game.sceneryTime / 160) + seed) % 5;
  if (ripple < 4) {
    rect(x - 5 - ripple, y + 4, 3 + ripple * 2, 1, "#dce9dc80");
    rect(x + 8, y - 3 + (ripple % 2), 2, 1, "#d6e6df80");
  }
}

function drawRoad(x, y, type, seed = 0) {
  const at = (u, v) => [x + u - v, y - 13 + (u + v) * 0.54];
  const patch = (u, v, w, d, color) =>
    poly([at(u, v), at(u + w, v), at(u + w, v + d), at(u, v + d)], color);
  if (type === "boardwalk") {
    diamond(x, y, 24, 13, "#835d4c");
    for (let v = 0; v < 24; v += 3) {
      patch(1, v, 22, 2.6, (v / 3 + seed) % 3 ? "#bc9165" : "#d1a779");
      patch(2, v + 0.25, 20, 0.45, "#e1b787");
      const [px, py] = at(5 + ((v * 7 + seed) % 10), v + 1);
      rect(px, py, 3, 1, "#9e7354");
      for (const u of [2, 21]) {
        const [nailX, nailY] = at(u, v + 1);
        rect(nailX, nailY, 1, 1, "#725748");
      }
    }
    wetRoad(x, y, seed);
    return;
  }
  if (type === "cobble") {
    diamond(x, y, 24, 13, "#969b8b");
    const stones = ["#c2c2ae", "#aeb8aa", "#ddd0b7", "#bdc2b3"];
    for (let u = 2; u < 23; u += 4)
      for (let v = 2; v < 23; v += 4) {
        const [px, py] = at(u, v);
        const color = stones[((u + v / 4 + seed) % stones.length) | 0];
        rect(px - 2, py, 5, 2, "#888e82");
        rect(px - 2, py - 1, 4, 2, color);
        rect(px - 1, py - 2, 2, 1, "#e1d8c2");
      }
    wetRoad(x, y, seed);
    return;
  }
  diamond(x, y, 24, 13, "#c4c1a5");
  for (let u = 0; u < 24; u += 6)
    for (let v = 0; v < 24; v += 6) {
      patch(
        u + 0.25,
        v + 0.25,
        5.5,
        5.5,
        (u / 6 + v / 6 + seed) % 2 ? "#e2ddc2" : "#eee6cb",
      );
      if ((u + v + seed) % 5 === 0) {
        const [px, py] = at(u + 3, v + 3);
        rect(px, py, 2, 1, "#d5cbb0");
      }
    }
  wetRoad(x, y, seed);
}

function drawWater(x, y, edges = []) {
  diamond(x, y + 2, 25, 14, "#668f81");
  diamond(x, y, 25, 14, "#589d98");
  diamond(x, y, 20, 10, "#70b7ab");
  diamond(x - 1, y - 1, 14, 6, "#7bbfb2");
  const corners = [
    [x, y - 13],
    [x + 24, y],
    [x, y + 13],
    [x - 24, y],
  ];
  for (const edge of edges) {
    const [a, b] = corners[edge],
      [c, d] = corners[(edge + 1) % 4];
    for (let i = 1; i < 6; i++) {
      const px = a + ((c - a) * i) / 6,
        py = b + ((d - b) * i) / 6;
      rect(px - 2, py, 5, 2, "#728c78");
      rect(px - 1, py - 1, 3, 1, i % 2 ? "#c7c0a2" : "#b0b49b");
    }
  }
  for (let i = 0; i < 4; i++) {
    const drift = (Math.floor(game.sceneryTime / 210) + i * 4) % 12;
    rect(
      x - 14 + drift + i * 4,
      y - 4 + (i % 3) * 4,
      4 + (i % 2),
      1,
      "#b0daca",
    );
  }
}

function drawAnimal(x, y, id, host, level) {
  const animal = animals[id];
  if (!animal) return;
  const phase = game.sceneryTime / 650;
  if (animal.hosts.includes("water")) {
    const px = x + Math.sin(phase + x) * 10,
      py = y - 2 + Math.cos(phase + x) * 4;
    const dir = Math.cos(phase + x) >= 0 ? 1 : -1;
    rect(px - 2, py + 2, 7, 2, "#396f704d");
    rect(px - 3, py, 7, 3, animal.color);
    rect(px - 5 * dir, py + 1, 3, 2, animal.color);
    rect(px + dir, py, 2, 2, animal.accent);
    rect(px - 2 * dir, py + 1, 2, 1, animal.accent);
    rect(px + 3 * dir, py + 1, 1, 1, "#61534d");
    rect(px - 6 * dir, py + 3, 3, 1, "#a8d8c5");
    return;
  }
  const hop = Math.floor(phase) % 7 === 0 ? 2 : 0;
  const px = x + Math.sin(phase / 2 + x) * 3 + 4,
    py = y - (host === "pine" ? 22 + level * 2 : 17 + level * 2) - hop;
  rect(px - 3, py - 1, 6, 4, animal.color);
  rect(px + 1, py - 3, 4, 4, animal.color);
  rect(px + 2, py - 2, 2, 1, animal.accent);
  rect(px + 3, py - 2, 1, 1, "#51463c");
  rect(px + 5, py, 2, 1, "#e5b26b");
  rect(px - 5, py + 1, 3, 1, animal.color);
}

function drawGarden(x, y, type, level) {
  const gold = "#f5cf77";
  if (type === "moonGarden") {
    diamond(x, y + 2, 24, 13, "#9a9d80");
    diamond(x, y, 21, 10, "#4d8884");
    diamond(x, y - 1, 17, 7, "#78b3a8");
    const moon = "#f4d994";
    for (let i = 0; i < 5; i++)
      rect(
        x - 8 + i * 4,
        y - 2 + (i % 2),
        2 + (Math.floor(game.sceneryTime / 230 + i) % 3),
        1,
        "#bbd8b1",
      );
    gardenStone(x - 17, y + 5, 0.45);
    if (level >= 2) gardenStone(x + 16, y + 5, 0.5);
    if (level >= 3) {
      resortLantern(x - 17, y + 5);
      resortLantern(x + 17, y + 5);
    }
    if (level >= 4) {
      rect(x - 9, y - 20, 3, 18, "#805949");
      rect(x + 7, y - 20, 3, 18, "#805949");
      rect(x - 7, y - 24, 15, 4, level === 6 ? moon : "#637c6f");
      rect(x - 10, y - 22, 3, 4, "#ac8259");
      rect(x + 7, y - 22, 3, 4, "#ac8259");
    }
    if (level >= 5) blossom(x + 14, y + 3, 0.38);
    return;
  }
  if (type === "pavilion") {
    const roof = level === 6 ? "#d9ae65" : level >= 2 ? "#577e72" : "#966e56";
    diamond(x, y + 4, 19, 8, "#859d78");
    diamond(x, y + 3, 16, 6, "#d4b890");
    rect(x - 8, y - 3, 14, 3, "#a87851");
    for (const [dx, dy] of [
      [-12, 0],
      [9, 4],
    ]) {
      rect(x + dx, y + dy - 15, 3, 16, "#88604b");
      rect(x + dx, y + dy - 14, 1, 13, "#c59872");
    }
    poly(
      [
        [x - 16, y - 13],
        [x - 5, y - 22],
        [x + 17, y - 16],
        [x + 8, y - 9],
      ],
      roof,
    );
    poly(
      [
        [x - 16, y - 13],
        [x + 8, y - 9],
        [x + 8, y - 7],
        [x - 16, y - 11],
      ],
      "#555b4f",
    );
    rect(x - 7, y - 20, 11, 1, "#ebcc98");
    if (level >= 3) resortLantern(x + 15, y + 5);
    if (level >= 4) diamond(x, y - 21, 10, 4, roof);
    if (level >= 5) blossom(x - 15, y + 5, 0.44);
    if (level === 6) rect(x - 2, y - 25, 5, 2, "#ffe3a2");
    return;
  }
  if (type === "cherry") {
    if (level >= 3) for (const dx of [-9, 9]) gardenStone(x + dx, y + 7, 0.32);
    blossom(x, y + 4, 0.56 + level * 0.08);
    if (level >= 4) blossom(x + 10, y + 6, 0.52);
    if (level >= 5) resortLantern(x - 13, y + 5);
    if (level === 6) rect(x - 5, y - 5, 11, 2, gold);
    return;
  }
  if (type === "torii") {
    shrineGate(x, y + 5, 0.49 + level * 0.07);
    if (level >= 3) rect(x - 7, y - 9 - level, 15, 2, "#efce92");
    if (level >= 4) {
      resortLantern(x - 15, y + 6);
      resortLantern(x + 15, y + 6);
    }
    if (level >= 5) rect(x - 16, y - 18 - level, 33, 2, "#71493e");
    if (level === 6) rect(x - 3, y - 20, 7, 5, gold);
    return;
  }
  if (type === "pagoda") {
    diamond(x, y + 4, 12, 6, "#778b77");
    diamond(x, y + 2, 10, 4, "#b1b298");
    for (let i = 0; i < Math.min(level, 5); i++) {
      const w = 8 - i,
        height = i * 5;
      rect(x - 2, y - 5 - height, 5, 6, "#888c7c");
      diamond(x, y - 5 - height, w, 3, i % 2 ? "#aab2a0" : "#8b9c91");
      rect(x - w + 2, y - 7 - height, w, 1, "#d7d5ba");
    }
    if (level === 6) {
      rect(x - 1, y - 32, 3, 7, gold);
      rect(x - 2, y - 30, 5, 1, "#f8e5aa");
    }
    return;
  }
  if (type === "pine") {
    if (level >= 3) {
      for (const [dx, dy] of [
        [-11, 4],
        [8, 4],
        [-6, 8],
        [5, 9],
      ])
        gardenStone(x + dx, y + dy, 0.32);
    }
    pine(x, y + 5, 0.7 + level * 0.09);
    if (level >= 4) pine(x + 8, y + 4, 0.58);
    if (level >= 5) diamond(x, y + 9, 8, 3, "#a79168");
    if (level === 6) {
      rect(x - 7, y - 4, 15, 2, gold);
      rect(x - 4, y - 2, 1, 4, "#fff0b1");
      rect(x + 4, y - 2, 1, 4, "#fff0b1");
    }
    return;
  }
  if (type === "lamp") {
    const height = (level - 1) * 2;
    diamond(x, y + 3, 6 + level, 4, level >= 5 ? "#927462" : "#758371");
    rect(
      x - 2,
      y - 8 - height,
      5,
      12 + height,
      level >= 5 ? "#ad6657" : "#829184",
    );
    rect(x - 5, y - 14 - height, 11, 7, "#a89462");
    rect(x - 3, y - 13 - height, 7, 4, "#ffdc83");
    rect(
      x - 6,
      y - 16 - height,
      13,
      3,
      level === 6 ? gold : level >= 2 ? "#557c75" : "#586f63",
    );
    if (level >= 3)
      rect(x - 4, y - 18 - height, 9, 2, level === 6 ? "#ffe6a0" : "#8fab9c");
    if (level >= 4) {
      rect(x - 4, y - 6, 9, 2, "#c7b88f");
      rect(x - 5, y + 2, 11, 2, "#b8aa83");
    }
    if (level >= 5)
      rect(x - 2, y - 21 - height, 5, 3, level === 6 ? gold : "#b77160");
    return;
  }
  diamond(x, y + 3, 21, 11, "#6d8b77");
  diamond(x, y + 1, 20, 10, "#b1b298");
  diamond(x, y, 17, 8, "#559e99");
  diamond(x, y - 1, 13, 5, "#7ec0aa");
  for (const [dx, dy] of [
    [-16, -1],
    [-10, 6],
    [1, 9],
    [13, 5],
    [17, 0],
  ]) {
    gardenStone(x + dx, y + dy, 0.26);
  }
  const drift = Math.sin(game.sceneryTime / 900) * 2;
  rect(x - 10 + drift, y - 2, 4, 1, "#c1dec1");
  for (const [dx, dy] of [
    [-11, -3],
    [8, -4],
  ]) {
    rect(x + dx, y + dy - 3, 1, 4, "#638d65");
    rect(x + dx - 1, y + dy - 4, 3, 1, "#8dad72");
  }
  for (let i = 0; i < (level >= 4 ? 3 : Math.min(2, level)); i++) {
    const wave = Math.round(Math.sin(game.sceneryTime / 850 + i * 2) * 7);
    rect(x + wave, y - 3 + i * 2, 4, 2, i === 1 ? "#f6e3ba" : "#edaa79");
    rect(x + wave - 1, y - 2 + i * 2, 1, 1, "#cc805e");
  }
  if (level >= 3) {
    rect(x + 7, y - 5, 5, 2, "#668f55");
    rect(x + 9, y - 6, 2, 2, "#b6c57b");
    if (level >= 4) {
      rect(x - 8, y + 2, 5, 2, "#659561");
      rect(x - 7, y, 3, 2, "#f4b6b8");
    }
  }
  if (level >= 5) {
    const bridge = level === 6 ? gold : "#b56958";
    poly(
      [
        [x - 9, y - 7],
        [x - 6, y - 9],
        [x + 10, y + 1],
        [x + 8, y + 3],
      ],
      bridge,
    );
    rect(x - 9, y - 10, 2, 5, bridge);
    rect(x + 7, y - 1, 2, 5, bridge);
  }
}

export { drawAnimal, drawGarden, drawRoad, drawWater };
