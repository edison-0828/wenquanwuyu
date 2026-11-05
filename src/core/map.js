// 地块坐标、道路连通、设施容量与环境评分规则。

import { game } from "./state.js";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  animals,
  bankDistricts,
  bankLeft,
  bankStart,
  capacityByType,
  entrance,
  isLodging,
  isRoad,
  items,
  landSales,
  lodgingRates,
  rareEnvironment,
  roomExpansion,
  sceneryCombos,
  sceneryPoints,
  tierNames,
  upgradeRates,
} from "../data/catalog.js";

const bankDistrictAt = (y) =>
  bankDistricts.find((area) => y >= area.start && y < area.start + area.rows);

const mainlandHeight = () => Math.min(game.H, bankStart);

const bankColumns = (y) =>
  game.state.riverEast && y < 28 ? 19 : bankDistrictAt(y)?.columns || 0;

const landSize = (area) =>
  area.infill
    ? bankDistricts
        .filter((district) => district.start < area.start)
        .reduce(
          (sum, district) =>
            sum + district.rows * (area.columns - district.columns),
          0,
        )
    : area.rows
      ? area.rows * (area.columns || game.W)
      : area.width * game.H;

const nextLand = () => landSales.find((area) => !game.state[area.id]);

const bridgeConnected = (area) =>
  roadRoutes().has(key(entrance[0], area.start - 1));

const canBuyLand = (area, score) =>
  game.mode === "ready" &&
  game.state.cash >= area.cost &&
  score >= (area.environment || 0) &&
  (!area.columns || bridgeConnected(area));

const locked = (x) => x >= 6 && !game.state.eastOpen;

const inside = (x, y) =>
  x >= 0 &&
  x < game.W &&
  y >= 0 &&
  y < game.H &&
  (y < bankStart || (x >= bankLeft && x < bankLeft + bankColumns(y)));

const bridgeRoad = (x, y) =>
  game.state.acrossRiver &&
  x === entrance[0] &&
  (y === bankStart - 1 || y === bankStart);

const neighbors = (x, y) =>
  [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ].filter(
    ([a, b]) =>
      inside(a, b) &&
      (b < bankStart === y < bankStart ||
        (a === entrance[0] && x === entrance[0])),
  );

// 保留最初版本的地块编号，扩宽地图后旧升级和双格客房存档仍能对应。
const key = (x, y) =>
  y >= BASE_HEIGHT
    ? 1000 + y * 32 + x
    : x < BASE_WIDTH
      ? y * BASE_WIDTH + x
      : BASE_WIDTH * BASE_HEIGHT + (x - BASE_WIDTH) * BASE_HEIGHT + y;

const sceneryScore = (type, level) => sceneryPoints[type] * level;

const canUpgrade = (type) =>
  Boolean(capacityByType[type] || sceneryPoints[type]);

const facilityLevel = (x, y) => {
  const saved = game.state.upgrades[key(x, y)];
  return saved === true
    ? 2
    : Number.isInteger(saved)
      ? Math.max(1, Math.min(tierNames.length, saved))
      : 1;
};

const upgradeCost = (type, level) =>
  Math.ceil((items[type].cost * upgradeRates[level - 1]) / 100);

const extraMaintenance = (type, level) =>
  Math.ceil(items[type].keep * 0.4) * (level - 1);

const coords = (index) =>
  index >= 1000
    ? [(index - 1000) % 32, Math.floor((index - 1000) / 32)]
    : index < BASE_WIDTH * BASE_HEIGHT
      ? [index % BASE_WIDTH, Math.floor(index / BASE_WIDTH)]
      : [Math.floor(index / BASE_HEIGHT), index % BASE_HEIGHT];

const extensionAt = (x, y) =>
  Object.keys(game.state.roomExtensions).find(
    (index) => game.state.roomExtensions[index] === key(x, y),
  );

const canExtendTo = (x, y) =>
  !locked(x) &&
  !game.state.grid[y][x] &&
  game.state.roomExtensions[key(x, y)] === undefined;

const capacityAt = (type, x, y) =>
  capacityByType[type][facilityLevel(x, y) - 1] +
  (isLodging(type) && extensionAt(x, y) !== undefined
    ? roomExpansion.capacity
    : 0);

function roadRoutes(start = entrance) {
  const routes = new Map([[key(...start), [start]]]);
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [a, b] of neighbors(x, y)) {
      if (!isRoad(game.state.grid[b][a]) || routes.has(key(a, b))) continue;
      routes.set(key(a, b), [...routes.get(key(x, y)), [a, b]]);
      queue.push([a, b]);
    }
  }
  return routes;
}

function facilities(routes = roadRoutes()) {
  const found = Object.fromEntries(
    Object.keys(capacityByType)
      .filter((type) => type === "room" || !isLodging(type))
      .map((type) => [type, []]),
  );
  for (let y = 0; y < game.H; y++)
    for (let x = 0; x < game.W; x++) {
      const type = game.state.grid[y][x];
      const family = isLodging(type) ? "room" : type;
      if (!(family in found)) continue;
      const extension = isLodging(type) ? extensionAt(x, y) : undefined;
      const near = neighbors(x, y);
      if (extension !== undefined)
        near.push(...neighbors(...coords(extension)));
      const access = near
        .map(([a, b]) => routes.get(key(a, b)))
        .filter(Boolean)
        .sort((a, b) => a.length - b.length)[0];
      if (!access) continue;
      const bonusType = { room: "lamp", bath: "pine", food: "pond" }[family];
      found[family].push({
        x,
        y,
        type,
        route: access,
        capacity: capacityAt(type, x, y),
        bonus: near.some(([a, b]) => game.state.grid[b][a] === bonusType),
      });
    }
  return found;
}

function environment(f) {
  const plants = game.state.grid.reduce(
    (sum, row, y) =>
      sum +
      row.reduce(
        (subtotal, type, x) =>
          subtotal +
          (type === "water"
            ? 2
            : sceneryPoints[type]
              ? sceneryScore(type, facilityLevel(x, y))
              : 0),
        0,
      ),
    0,
  );
  const combos = Object.entries(sceneryCombos).reduce(
    (sum, [type, points]) =>
      sum + f[type].filter((facility) => facility.bonus).length * points,
    0,
  );
  const animalScore = Object.entries(game.state.animals).reduce(
    (sum, [index, id]) => {
      const [x, y] = coords(index);
      const animal = animals[id];
      return (
        sum +
        (animal?.hosts.includes(game.state.grid[y]?.[x]) ? animal.score : 0)
      );
    },
    0,
  );
  const score = plants + combos + animalScore;
  return {
    plants,
    combos,
    animalScore,
    score,
    extraVisitors: Math.floor(score / 25),
    rareChance: score < rareEnvironment ? 0 : 2 + (98 * score) / (250 + score),
  };
}

const innCapacity = (available) =>
  available.room.reduce((sum, room) => sum + room.capacity, 0);

const lodgingFee = (type, level) => lodgingRates[type] + 25 * (level - 1);

export {
  bankColumns,
  bankDistrictAt,
  bridgeConnected,
  bridgeRoad,
  canBuyLand,
  canExtendTo,
  canUpgrade,
  capacityAt,
  coords,
  environment,
  extensionAt,
  extraMaintenance,
  facilities,
  facilityLevel,
  innCapacity,
  inside,
  key,
  landSize,
  locked,
  lodgingFee,
  mainlandHeight,
  neighbors,
  nextLand,
  roadRoutes,
  sceneryScore,
  upgradeCost,
};
