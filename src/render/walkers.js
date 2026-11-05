// 路径插值、行走速度和非营业时的散步游客。

import { key, roadRoutes } from "../core/map.js";
import { game } from "../core/state.js";
import { bankStart, guestWalkSpeed } from "../data/catalog.js";
import { pos } from "./camera.js";
import { bridgePath } from "./landscape.js";

function routeSegment(fromTile, toTile) {
  const from = pos(...fromTile),
    to = pos(...toTile);
  if (fromTile[1] < bankStart === toTile[1] < bankStart) return [from, to];
  const [, entry, exit] = bridgePath();
  return fromTile[1] < toTile[1]
    ? [from, entry, exit, to]
    : [from, exit, entry, to];
}

function walkingPoint(route, phase, direction = 1) {
  const t = Math.max(0, Math.min(1, phase)) * (route.length - 1);
  const index = Math.min(Math.floor(t), route.length - 2);
  if (index < 0) return [...pos(...route[0]), 1, false];
  const points = routeSegment(route[index], route[index + 1]);
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let distance = (t - index) * lengths.reduce((sum, length) => sum + length, 0);
  let segment = 0;
  while (segment < lengths.length - 1 && distance > lengths[segment])
    distance -= lengths[segment++];
  const [x, y] = points[segment],
    [a, b] = points[segment + 1];
  const progress = lengths[segment] ? distance / lengths[segment] : 0;
  return [
    x + (a - x) * progress,
    y + (b - y) * progress,
    (a - x) * direction < 0 ? -1 : 1,
    (b - y) * direction < 0,
  ];
}

const routeTimings = new WeakMap();

function walkingPhase(route, elapsed) {
  let times = routeTimings.get(route);
  if (!times) {
    times = [0];
    for (let i = 1; i < route.length; i++) {
      const points = routeSegment(route[i - 1], route[i]);
      const length = points
        .slice(1)
        .reduce(
          (sum, [x, y], j) =>
            sum + Math.hypot(x - points[j][0], y - points[j][1]),
          0,
        );
      times.push(
        times[i - 1] + (length ? (length * 1000) / guestWalkSpeed : 260),
      );
    }
    routeTimings.set(route, times);
  }
  if (elapsed < 0 || elapsed > times.at(-1)) return null;
  let lo = 0,
    hi = times.length - 1;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (times[mid] <= elapsed) lo = mid;
    else hi = mid;
  }
  return (
    (lo + (elapsed - times[lo]) / (times[hi] - times[lo])) / (times.length - 1)
  );
}

function nextStroll(from, previous) {
  const choices = [...roadRoutes(from).values()].filter(
    (route) => route.length > 1,
  );
  const notPrevious = choices.filter(
    (route) => key(...route.at(-1)) !== previous,
  );
  const available = notPrevious.length ? notPrevious : choices;
  const interesting = available.filter(
    (route) => route.length >= 5 && route.length <= 18,
  );
  const options = interesting.length ? interesting : available;
  return options[Math.floor(Math.random() * options.length)];
}

function refreshWalkers() {
  const routes = roadRoutes();
  const points = [...routes.values()]
    .filter((route) => route.length > 1)
    .map((route) => route.at(-1));
  game.strolls = [];
  const count = Math.min(8, Math.ceil(points.length / 4));
  for (let i = 0; i < count; i++) {
    const from = points[Math.floor(((i + 0.5) * points.length) / count)];
    const route = nextStroll(from);
    if (route)
      game.strolls.push({
        route,
        start: game.sceneryTime - i * 510,
        pause: 550 + i * 120,
      });
  }
}

function strollPose(stroll) {
  const elapsed = game.sceneryTime - stroll.start;
  const phase = walkingPhase(stroll.route, elapsed);
  if (phase !== null)
    return { point: walkingPoint(stroll.route, phase), moving: true };
  const duration = routeTimings.get(stroll.route).at(-1);
  if (elapsed >= duration + stroll.pause) {
    const route = nextStroll(stroll.route.at(-1), key(...stroll.route[0]));
    if (route) {
      stroll.route = route;
      stroll.start = game.sceneryTime;
    }
  }
  return {
    point: walkingPoint(
      stroll.route,
      stroll.start === game.sceneryTime ? 0 : 1,
    ),
    moving: false,
  };
}

export { refreshWalkers, strollPose, walkingPhase, walkingPoint };
