// 地图图层合成、地块选择、游客和天气效果。

import {
  bankColumns,
  canExtendTo,
  coords,
  extensionAt,
  facilityLevel,
  inside,
  key,
  locked,
  neighbors,
  nextLand,
} from "../core/map.js";
import { game } from "../core/state.js";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  bankDistricts,
  bankLeft,
  bankStart,
  businessDuration,
  entrance,
  isLodging,
  isRoad,
  landSales,
  sceneryPoints,
  tour,
} from "../data/catalog.js";
import { $, canvas } from "../dom.js";
import { building } from "./buildings.js";
import { pos } from "./camera.js";
import {
  ground,
  resortLantern,
  riversideGate,
  riversideGatePosition,
} from "./landscape.js";
import { drawVisitorActivity, person, showGuestBubble } from "./people.js";
import { diamond, rect } from "./primitives.js";
import { drawAnimal, drawGarden, drawRoad, drawWater } from "./tiles.js";
import { strollPose, walkingPhase, walkingPoint } from "./walkers.js";
import { number } from "../ui/feedback.js";

function landMarker(area) {
  if (area.infill) return [15, 21];
  if (area.rows) return [entrance[0] + (area.columns ? 1 : 2), game.H];
  return [area.existing ? 6.5 : game.W, 3];
}

function drawLandSale() {
  const area = nextLand(),
    sign = $("land-sign");
  if (!area) {
    sign.hidden = true;
    return;
  }
  if (area.infill) {
    for (let y = bankStart; y < area.start; y++) {
      const [x, py] = pos(bankLeft + bankColumns(y), y);
      diamond(x, py, 24, 13, y % 2 ? "#b9b693" : "#c5bea0");
    }
  } else if (!area.existing) {
    const length = area.columns || (area.rows ? game.W : game.H);
    for (let i = 0; i < length; i++) {
      const [x, y] = area.rows
        ? pos(i + (area.columns ? bankLeft : 0), game.H)
        : pos(game.W, i);
      diamond(x, y, 24, 13, i % 2 ? "#b9b693" : "#c5bea0");
      rect(x - 2, y - 2, 4, 3, "#9c9378");
    }
  }
  const [x, y] = pos(...landMarker(area));
  const sx = game.viewX + game.mapOffsetX + x * game.mapScale,
    sy = game.viewY + game.mapOffsetY + (y + 3) * game.mapScale;
  const visible =
    sx > canvas.width * 0.1 &&
    sx < canvas.width * 0.9 &&
    sy > canvas.height * 0.19 &&
    sy < canvas.height * 0.89;
  sign.hidden = !visible || !!game.tab || !!game.cursor;
  if (sign.hidden) return;
  sign.style.left =
    "clamp(70px, " + (sx / canvas.width) * 100 + "%, calc(100% - 70px))";
  sign.style.top =
    area.columns && !area.infill && !game.closeView
      ? "calc(" + (sy / canvas.height) * 100 + "% + 78px)"
      : (sy / canvas.height) * 100 + "%";
  const label = area.name + " · " + number(area.cost) + " 文";
  if ($("land-name").textContent !== label) $("land-name").textContent = label;
}

function draw() {
  rect(0, 0, canvas.width, canvas.height, "#a9c690");
  game.ctx.save();
  game.ctx.translate(
    game.viewX + game.mapOffsetX,
    game.viewY + game.mapOffsetY,
  );
  game.ctx.scale(game.mapScale, game.mapScale);
  ground();
  drawLandSale();
  const layers = [],
    bathersByPool = new Map();
  for (let y = 0; y < game.H; y++)
    for (let x = 0; x < game.W; x++) {
      if (!inside(x, y)) continue;
      const [a, b] = pos(x, y),
        tile = game.state.grid[y][x];
      diamond(a, b + 3, 25, 14, locked(x) ? "#78836b" : "#739769");
      diamond(
        a,
        b,
        25,
        14,
        locked(x)
          ? (x + y) % 2
            ? "#a3a286"
            : "#aca98e"
          : isRoad(tile)
            ? "#d7caa7"
            : (x + y) % 2
              ? "#9ab879"
              : "#a4c082",
      );
      if (
        !tile &&
        !locked(x) &&
        (y >= BASE_HEIGHT || x >= BASE_WIDTH + landSales[1].width)
      ) {
        const tint =
          y >= bankStart
            ? Math.floor((y - bankStart) / 4) % 2 === 0
            : y >= BASE_HEIGHT
              ? y < BASE_HEIGHT + 3
              : x < BASE_WIDTH + landSales[1].width + landSales[2].width;
        diamond(
          a,
          b,
          24,
          13,
          tint
            ? (x + y) % 2
              ? "#afbd89"
              : "#b9c692"
            : (x + y) % 2
              ? "#9fb4a0"
              : "#acc0aa",
        );
        if ((x + 2 * y) % 4 === 0) {
          rect(a - 7, b + 2, 2, 2, tint ? "#e2a5aa" : "#e3d4a1");
          rect(a + 4, b - 3, 2, 1, tint ? "#f3c8b9" : "#d3dfb9");
        }
      }
      if (locked(x)) {
        rect(a - 3, b - 3, 7, 5, "#777c65");
        rect(a - 2, b - 6, 5, 3, "#9b9b80");
        continue;
      }
      if (isRoad(tile)) {
        drawRoad(a, b, tile, x + y);
      } else if (tile === "water") {
        const sides = [
          [x, y - 1],
          [x + 1, y],
          [x, y + 1],
          [x - 1, y],
        ];
        drawWater(
          a,
          b,
          sides.flatMap(([nx, ny], edge) =>
            inside(nx, ny) && game.state.grid[ny][nx] === "water" ? [] : [edge],
          ),
        );
      } else {
        rect(a - 11, b + 4, 3, 2, "#78a066");
        rect(a + 10, b - 3, 3, 1, "#c9d092");
        if ((x * 3 + y) % 5 === 0) {
          rect(a - 5, b - 5, 2, 2, "#f1ce85");
          rect(a - 3, b - 6, 1, 2, "#df9b75");
        }
      }
      const selected =
        game.cursor &&
        (key(...game.cursor) === key(x, y) ||
          game.state.roomExtensions[key(x, y)] === key(...game.cursor));
      const candidate =
        game.kind === "extend-room" &&
        game.cursor &&
        Math.abs(game.cursor[0] - x) + Math.abs(game.cursor[1] - y) === 1 &&
        canExtendTo(x, y);
      if (candidate) diamond(a, b, 24, 13, "#e4ce7b");
      if (selected || candidate) {
        game.ctx.strokeStyle = "#fff2ad";
        game.ctx.lineWidth = 2;
        game.ctx.beginPath();
        game.ctx.moveTo(a, b - 13);
        game.ctx.lineTo(a + 24, b);
        game.ctx.lineTo(a, b + 13);
        game.ctx.lineTo(a - 24, b);
        game.ctx.closePath();
        game.ctx.stroke();
      }
      if (game.buildPreview?.x === x && game.buildPreview.y === y) {
        const preview = game.buildPreview;
        const color = preview.warning ? "#ba8057" : "#5c9b74";
        diamond(a, b, 24, 13, preview.warning ? "#e2bd89" : "#bcd99e");
        if (preview.access && Math.abs(preview.access[1] - y) <= 1) {
          const [px, py] = pos(...preview.access);
          if (Math.hypot(px - a, py - b) < 35) {
            for (let i = 1; i <= 4; i++)
              diamond(
                a + ((px - a) * i) / 5,
                b + ((py - b) * i) / 5,
                2,
                1,
                color,
              );
          }
        }
        layers.push({
          y: b,
          paint: () => {
            game.ctx.save();
            game.ctx.globalAlpha = 0.78;
            if (preview.type === "gate") riversideGate(a, b);
            else if (preview.type === "water") drawWater(a, b, [0, 1, 2, 3]);
            else if (isRoad(preview.type)) drawRoad(a, b, preview.type, x + y);
            else if (sceneryPoints[preview.type])
              drawGarden(a, b, preview.type, 1);
            else building(a, b, preview.type);
            game.ctx.restore();
          },
        });
      }
      if (tile === "gate") {
        const alongX = neighbors(x, y).filter(
          ([nx, ny]) => ny === y && isRoad(game.state.grid[ny][nx]),
        ).length;
        const alongY = neighbors(x, y).filter(
          ([nx, ny]) => nx === x && isRoad(game.state.grid[ny][nx]),
        ).length;
        layers.push({
          y: b,
          paint: () =>
            riversideGate(
              a,
              b,
              facilityLevel(x, y),
              alongX > alongY ? -0.56 : 0.56,
            ),
        });
      }
      if (!tile || isRoad(tile)) continue;
      const extension = isLodging(tile) ? extensionAt(x, y) : undefined;
      const [tx, ty] = extension === undefined ? [x, y] : coords(extension);
      const [ox, oy] = pos(Math.min(x, tx), Math.min(y, ty));
      layers.push({
        y: Math.max(b, pos(tx, ty)[1]),
        paint: () => {
          if (sceneryPoints[tile]) {
            drawGarden(a, b, tile, facilityLevel(x, y));
          } else if (tile !== "water") {
            building(
              ox,
              oy,
              tile,
              x === tx ? 24 : 49,
              y === ty ? 24 : 49,
              facilityLevel(x, y),
              game.state.facilityStyles[key(x, y)],
              bathersByPool.get(key(x, y)),
            );
          }
          drawAnimal(
            a,
            b,
            game.state.animals[key(x, y)],
            tile,
            facilityLevel(x, y),
          );
        },
      });
    }
  if (game.H > BASE_HEIGHT) {
    const [gx, gy] = riversideGatePosition();
    layers.push({ y: gy + 7, paint: () => riversideGate(gx, gy) });
  }
  const [ex, ey] = pos(...entrance);
  if (!game.state.entranceGateHidden)
    layers.push({
      y: ey,
      paint: () => {
        diamond(ex, ey + 3, 21, 7, "#a69b77");
        rect(ex - 16, ey - 24, 5, 27, "#765441");
        rect(ex + 11, ey - 24, 5, 27, "#765441");
        rect(ex - 15, ey - 21, 2, 21, "#bb865b");
        rect(ex + 12, ey - 21, 2, 21, "#bb865b");
        rect(ex - 20, ey - 27, 40, 6, "#ab7651");
        rect(ex - 22, ey - 31, 44, 4, "#405d5b");
        rect(ex - 19, ey - 34, 38, 3, "#587975");
        for (let dx = -18; dx < 18; dx += 5)
          rect(ex + dx, ey - 33, 2, 5, "#77978a");
        rect(ex - 10, ey - 25, 20, 7, "#5a473a");
        rect(ex - 9, ey - 24, 18, 5, "#e4bd82");
        for (const dx of [-10, -3, 4]) {
          rect(ex + dx, ey - 18, 6, 9, "#3c706a");
          rect(ex + dx, ey - 17, 6, 1, "#79a191");
          rect(ex + dx + 2, ey - 14, 2, 2, "#f1d69e");
        }
        rect(ex - 5, ey - 22, 2, 3, "#876249");
        rect(ex - 1, ey - 23, 2, 4, "#876249");
        rect(ex + 3, ey - 22, 2, 3, "#876249");
        for (const side of [-1, 1]) {
          rect(ex + side * 18 - 2, ey - 16, 5, 7, "#9a6345");
          rect(ex + side * 18 - 1, ey - 15, 3, 5, "#ffce76");
        }
      },
    });
  const stride = Math.floor(game.sceneryTime / 175);
  let review = null;
  if (game.mode === "running")
    game.run.guests.forEach((g, i) => {
      const group = g.type === "group";
      const offset = game.run.tour && !group ? tour.duration : 0;
      const duration = group ? tour.duration : businessDuration - offset;
      const index = game.run.tour && !group ? i - tour.size : i;
      const count = group
        ? tour.size
        : game.run.guests.length - (game.run.tour ? tour.size : 0);
      const delay =
        (Math.min(6000, duration * 0.27) * index) / Math.max(1, count - 1);
      const t = walkingPhase(g.route, game.clock - offset - delay);
      if (t === null) return;
      const point = t * (g.route.length - 1);
      if (g.soak && point >= g.soak.start && point <= g.soak.end) {
        const { x: bx, y: by } = g.soak,
          poolId = key(bx, by);
        const [cx, cy] = pos(bx, by);
        const bathers = bathersByPool.get(poolId) || [];
        const seat = i % 12;
        bathers.push({
          x: cx + ((seat % 4) - 1.5) * 7,
          y: cy + Math.floor(seat / 4) * 3 - 4,
          type: g.type,
          index: i,
        });
        bathersByPool.set(poolId, bathers);
        return;
      }
      const [x, y, facing, back] = walkingPoint(g.route, t);
      const activity = g.activities?.find(
        (action) => point >= action.start && point <= action.end,
      );
      if (activity) {
        layers.push({
          y,
          paint: () => drawVisitorActivity(x, y, g, activity.type, i),
        });
        return;
      }
      if (t >= 0.73) review = { x, y, guest: g };
      layers.push({
        y,
        paint: () => {
          if (g.type === "garden") {
            const glow = 0.24 + 0.1 * Math.sin(game.sceneryTime / 230);
            game.ctx.globalAlpha = glow;
            diamond(x, y - 8, 13, 17, "#ffd666");
            diamond(x, y - 9, 9, 15, "#ffed9d");
            game.ctx.globalAlpha = 1;
            for (let i = 0; i < 4; i++) {
              const angle = game.sceneryTime / 460 + (i * Math.PI) / 2;
              rect(
                x + Math.cos(angle) * 12,
                y - 10 + Math.sin(angle) * 11,
                2,
                2,
                i % 2 ? "#fff0ae" : "#f8c553",
              );
            }
          }
          person(x, y, g.type, stride + i, facing, back, i);
          if (g.type === "celebrity") {
            diamond(x, y - 29, 6, 5, "#704747");
            diamond(x, y - 29, 4, 3, "#f4cf87");
            rect(x - 1, y - 31, 2, 4, "#a7654e");
          }
          if (g.type === "garden") {
            rect(x - 1, y - 32, 3, 7, "#e8b34a");
            rect(x - 3, y - 30, 7, 3, "#e8b34a");
            rect(x, y - 29, 1, 1, "#fff5bf");
          }
        },
      });
    });
  game.strolls.forEach((stroll, i) => {
    const {
      point: [x, y, facing, back],
      moving,
    } = strollPose(stroll);
    layers.push({
      y,
      paint: () =>
        person(
          x + (i % 2 ? 2 : -2),
          y,
          i === 0 ? "staff" : i % 2 ? "food" : "bath",
          moving ? stride + i : 0,
          facing,
          back,
        ),
    });
  });
  layers.sort((a, b) => a.y - b.y).forEach((layer) => layer.paint());
  if (
    game.mode === "closed" ||
    (game.mode === "running" && game.clock >= businessDuration * 0.67)
  ) {
    game.ctx.save();
    game.ctx.setTransform(1, 0, 0, 1, 0, 0);
    rect(0, 0, canvas.width, canvas.height, "#393f6620");
    game.ctx.restore();
  }
  if (game.state.acrossRiver) {
    const evening =
      game.mode === "closed" ||
      (game.mode === "running" && game.clock >= 18000);
    for (const area of bankDistricts.filter((area) => game.state[area.id])) {
      for (const [x, y] of [
        [bankLeft, area.start + 1],
        [bankLeft + area.columns - 1, area.start + 1],
      ]) {
        const [px, py] = pos(x, y);
        if (evening) {
          diamond(px + 9, py - 12, 15, 8, "#ffd28640");
          if (area.start === bankStart)
            for (let i = 0; i < 4; i++)
              rect(px + 23 + i * 2, py - 38 + i * 2, 6 - i, 1, "#f8cc855e");
        }
        resortLantern(px + 9, py - 1);
      }
    }
  }
  game.ctx.restore();
  if (game.state.weather === "rain") {
    game.ctx.strokeStyle = "#cfedf0a0";
    game.ctx.lineWidth = 1;
    game.ctx.beginPath();
    for (let i = 0; i < 55; i++) {
      const x = (i * 73 + Math.floor(game.sceneryTime / 34)) % canvas.width;
      const y = (i * 127 + game.sceneryTime * 0.42) % canvas.height;
      game.ctx.moveTo(x, y);
      game.ctx.lineTo(x - 3, y + 8);
    }
    game.ctx.stroke();
  } else if (game.state.weather === "mist") {
    rect(0, 0, canvas.width, canvas.height, "#e6ecdc22");
  }
  showGuestBubble(review);
}

export { draw, landMarker };
