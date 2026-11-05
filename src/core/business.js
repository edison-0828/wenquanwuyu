// 游客行程、营业开始、收入计算和收摊结算。

import {
  dailyWeather,
  randomCelebrity,
  returnChance,
  settleRanking,
  showTourOffer,
  tourBooked,
} from "./guests.js";
import {
  canUpgrade,
  environment,
  extraMaintenance,
  facilities,
  facilityLevel,
  innCapacity,
  key,
  lodgingFee,
  mainlandHeight,
  roadRoutes,
} from "./map.js";
import { game } from "./state.js";
import { save } from "./storage.js";
import {
  BASE_HEIGHT,
  bankStart,
  celebrityEnvironment,
  entrance,
  items,
  monthLength,
  overlapChance,
  rareGuestLimit,
  roomExpansion,
  streetServices,
  tour,
  weatherTypes,
} from "../data/catalog.js";
import { closeMapMenu } from "../ui/build-menu.js";
import { note } from "../ui/feedback.js";
import { renderPanel } from "../ui/panels.js";

function approachRoute(routes) {
  const [x, y] = entrance;
  const edge = [x, mainlandHeight() - 1];
  const exit = routes.get(key(...edge));
  if (!exit) return [entrance];
  const distance = game.state.acrossRiver
    ? 0.9
    : game.H === BASE_HEIGHT
      ? 1.8
      : 1.5;
  return [[x, edge[1] + distance], ...exit.slice().reverse()];
}

function guestRoute(stops, approach, bath) {
  const route = [...approach];
  let previous = [entrance],
    soak = null;
  const activities = [];
  for (const stop of stops) {
    const next = stop.route;
    let shared = 0;
    while (
      shared < Math.min(previous.length, next.length) &&
      previous[shared] === next[shared]
    )
      shared++;
    const [px, py] = next.at(-1);
    const doorstep = [(px + stop.x) / 2, (py + stop.y) / 2];
    route.push(
      ...previous.slice(shared - 1, -1).reverse(),
      ...next.slice(shared),
      doorstep,
    );
    if (stop === bath) {
      const start = route.length;
      for (let i = 0; i <= 7; i++) route.push([stop.x, stop.y]);
      soak = { x: stop.x, y: stop.y, start, end: route.length - 1 };
      route.push(doorstep);
    } else if (
      [
        "teaHouse",
        "dango",
        "shop",
        "gifts",
        "stage",
        "arcade",
        "food",
      ].includes(stop.type)
    ) {
      const start = route.length - 1;
      for (let i = 0; i < 5; i++) route.push(doorstep);
      activities.push({ type: stop.type, start, end: route.length - 1 });
    }
    route.push([px, py]);
    previous = next;
  }
  route.push(
    ...previous.slice(0, -1).reverse(),
    ...approach.slice(0, -1).reverse(),
  );
  return { route, soak, activities };
}

const optionalStops = [
  "shop",
  "gifts",
  "cinema",
  ...Object.keys(streetServices),
];

function chooseOptionalStops(slots, used, index) {
  const chosen = {};
  for (
    let offset = 0;
    offset < optionalStops.length && Object.keys(chosen).length < 2;
    offset++
  ) {
    const id = optionalStops[(index + offset) % optionalStops.length],
      next = used[id] || 0;
    if (!slots[id][next]) continue;
    chosen[id] = slots[id][next];
    used[id] = next + 1;
  }
  return chosen;
}

function operatingCosts(income) {
  return Math.round(
    Math.min(Math.max(income - 6000, 0), 12000) * 0.18 +
      Math.min(Math.max(income - 18000, 0), 27000) * 0.35 +
      Math.max(income - 45000, 0) * 0.5,
  );
}

function begin() {
  const routes = roadRoutes();
  const f = facilities(routes);
  const approach = approachRoute(routes);
  if (tourBooked() && innCapacity(f) < tour.size) {
    showTourOffer();
    return;
  }
  if (!f.room.length) {
    note("先准备至少一间连到入口的客房。");
    return;
  }
  const slots = Object.fromEntries(
    Object.entries(f).map(([type, buildings]) => [
      type,
      buildings.flatMap((building) => Array(building.capacity).fill(building)),
    ]),
  );
  const outlook = environment(f);
  const tourActive = tourBooked();
  const yesterday = game.state.history[0];
  const previousGuests =
    yesterday?.day === game.state.day - 1
      ? yesterday.guests -
        (yesterday.tourGuests || 0) -
        (yesterday.celebrity ? 1 : 0)
      : 0;
  let returning = 0;
  for (let i = 0; i < previousGuests; i++)
    if (Math.random() < returnChance()) returning++;
  const weather = dailyWeather();
  const ordinaryDemand = Math.max(
    1,
    5 + outlook.extraVisitors + returning + weatherTypes[weather].visitors,
  );
  const groupSize = tourActive ? tour.size : 0;
  const spareBeds = slots.room.length - groupSize;
  const celebrity =
    outlook.score >= celebrityEnvironment && f.bath.length && spareBeds > 0
      ? randomCelebrity()
      : null;
  const jointVisit =
    celebrity &&
    spareBeds > 1 &&
    outlook.rareChance > 0 &&
    Math.random() < overlapChance;
  let rareCount = 0;
  const arrivals = Array.from({ length: ordinaryDemand }, (_, i) => {
    const rare = celebrity
      ? jointVisit && i === 0
      : rareCount < rareGuestLimit &&
        outlook.rareChance > 0 &&
        Math.random() * 100 < outlook.rareChance;
    if (rare) {
      rareCount++;
      return "garden";
    }
    return i % 2 ? "food" : "bath";
  });
  if (celebrity) arrivals.unshift("celebrity");
  if (tourActive) arrivals.unshift(...Array(groupSize).fill("group"));
  const demand = arrivals.length;
  const rareArrivals = arrivals.filter((type) => type === "garden").length;
  const count = Math.min(demand, slots.room.length);
  const guests = [],
    optionalUsed = {};
  const mix = { bath: 0, food: 0, garden: 0, group: 0, celebrity: 0 };
  for (let i = 0; i < count; i++) {
    const room = slots.room[i];
    const bath = slots.bath[i];
    const food = slots.food[i];
    const type = arrivals[i];
    const preferred =
      type === "celebrity" && celebrity.id === "merchant"
        ? "gifts"
        : type === "celebrity" && celebrity.id === "performer"
          ? "stage"
          : null;
    const extras = chooseOptionalStops(
      slots,
      optionalUsed,
      preferred ? optionalStops.indexOf(preferred) : i,
    );
    const { shop, gifts, cinema } = extras;
    const streetStops = Object.entries(streetServices).filter(
      ([id]) => extras[id],
    );
    mix[type]++;
    const landscape =
      (room.bonus ? 13 : 0) + (bath?.bonus ? 9 : 0) + (food?.bonus ? 6 : 0);
    const upset = Boolean(
      food &&
      Math.random() < (facilityLevel(food.x, food.y) >= 4 ? 0.015 : 0.045),
    );
    const reviewEvent = upset
      ? "bad"
      : bath && food && Math.random() < 0.24
        ? "good"
        : null;
    const celebrityVisit =
      type === "celebrity"
        ? {
            id: celebrity.id,
            happy:
              !upset &&
              celebrity.happy({
                bath,
                food,
                outlook,
                gifts,
                stage: extras.stage,
              }),
          }
        : null;
    const comment = upset
      ? "差评 · 吃完晚饭后肚子不舒服。"
      : celebrityVisit
        ? celebrity.name +
          "：" +
          (celebrityVisit.happy
            ? "这趟来得值，改天还会来。"
            : "这次没能如愿。原本想" + celebrity.wish + "。")
        : reviewEvent === "good"
          ? "好评 · 泡汤舒服，晚饭也好吃。"
          : !bath
            ? "可惜没泡到温泉。"
            : !food
              ? "晚饭卖完了，希望能多备些。"
              : type === "group"
                ? "这趟带团来泡汤，值了。"
                : type === "garden" && landscape
                  ? "庭园真漂亮，还想再来。"
                  : streetStops.length
                    ? streetStops.at(-1)[1].comment
                    : cinema
                      ? "泡完汤再看场电影，刚刚好。"
                      : gifts
                        ? "挑了一份纪念品，带回家送人。"
                        : room.bonus
                          ? "夜里有石灯，走路很安心。"
                          : bath.bonus
                            ? "边泡汤边看松树，真舒服。"
                            : food.bonus
                              ? "吃完饭还能赏鱼，真好。"
                              : "泡汤挺舒服，想再看些庭园景色。";
    const stops = [
      room,
      bath,
      food,
      shop,
      gifts,
      cinema,
      ...streetStops.map(([id]) => extras[id]),
    ].filter(Boolean);
    const visitOrder =
      i % 2 === 0
        ? [
            ...stops.filter((stop) => stop.y >= bankStart),
            ...stops.filter((stop) => stop.y < bankStart),
          ]
        : stops;
    const { route, soak, activities } = guestRoute(visitOrder, approach, bath);
    const baseFee =
      lodgingFee(room.type, facilityLevel(room.x, room.y)) +
      (bath ? 75 : 0) +
      (food ? 55 : 0) +
      (shop ? 35 : 0);
    const multiplier =
      type === "garden" ? 10 : type === "group" ? tour.multiplier : 1;
    const giftIncome = gifts ? 65 * multiplier : 0,
      cinemaIncome = cinema ? 90 * multiplier : 0;
    const streetIncome = Object.fromEntries(
      streetStops.map(([id, service]) => [id, service.fee * multiplier]),
    );
    const extra = Object.values(streetIncome).reduce(
      (sum, fee) => sum + fee,
      0,
    );
    guests.push({
      route,
      soak,
      activities,
      comment,
      reviewEvent,
      celebrity: celebrityVisit,
      fee: baseFee * multiplier + giftIncome + cinemaIncome + extra,
      type,
      giftIncome,
      cinemaIncome,
      streetIncome,
    });
  }
  const cost = game.state.grid.reduce(
    (sum, row, y) =>
      sum +
      row.reduce(
        (subtotal, type, x) =>
          subtotal +
          (items[type]?.keep || 0) +
          (canUpgrade(type) ? extraMaintenance(type, facilityLevel(x, y)) : 0),
        0,
      ),
    25 + Object.keys(game.state.roomExtensions).length * roomExpansion.keep,
  );
  const nextMood =
    yesterday?.day === game.state.day - 1 ? yesterday.celebrity : null;
  const reputationRate = nextMood ? (nextMood.happy ? 0.15 : -0.15) : 0;
  game.run = {
    guests,
    demand,
    mix,
    cost,
    weather,
    reputationRate,
    returning,
    tour: tourActive,
    outlook,
    rareArrivals,
    baths: slots.bath.length,
    meals: slots.food.length,
  };
  game.clock = 0;
  game.badgeTick = 0;
  game.mode = "running";
  game.kind = "";
  game.cursor = null;
  save();
  note(
    mix.celebrity
      ? celebrity.name + "来访 · 今日营业额 +20%"
      : "旅馆营业中，客人正在散步、泡汤和逛店。",
  );
  renderPanel();
}

function finish() {
  const teaTips = game.run.guests.reduce((sum, g) => sum + (g.teaTip || 0), 0);
  const baseIncome = game.run.guests.reduce((sum, g) => sum + g.fee, teaTips);
  const celebrity = game.run.guests.find((guest) => guest.celebrity)?.celebrity;
  const celebrityBonus = celebrity ? Math.round(baseIncome * 0.2) : 0;
  const wordOfMouth = Math.round(baseIncome * (game.run.reputationRate || 0));
  const income = baseIncome + celebrityBonus + wordOfMouth;
  const operations = operatingCosts(income),
    cost = game.run.cost + operations;
  if (celebrity) {
    game.state.celebrityVisits ??= {};
    const prior = game.state.celebrityVisits[celebrity.id];
    game.state.celebrityVisits[celebrity.id] = {
      firstDay: prior?.firstDay ?? game.state.day,
      count: (prior?.count || 0) + 1,
      happy: celebrity.happy,
    };
  }
  const feedback =
    game.run.guests.length > game.run.baths
      ? "有客人没能泡到温泉。可以增加浴池容量。"
      : game.run.guests.length > game.run.meals
        ? "晚饭卖完了，几位客人没吃上。"
        : game.run.guests.length < game.run.demand
          ? "今日满房。还有旅客因客房不足离开。"
          : "客人顺利入住，给庭园和服务留下了评价。";
  const shortage = {
    room: game.run.demand - game.run.guests.length,
    bath: Math.max(0, game.run.guests.length - game.run.baths),
    food: Math.max(0, game.run.guests.length - game.run.meals),
  };
  const incomeByType = (type) =>
    game.run.guests.reduce(
      (sum, guest) => sum + (guest.type === type ? guest.fee : 0),
      0,
    );
  game.state.history.unshift({
    weather: game.run.weather || game.state.weather,
    reviewEvents: {
      good: game.run.guests.filter((guest) => guest.reviewEvent === "good")
        .length,
      bad: game.run.guests.filter((guest) => guest.reviewEvent === "bad")
        .length,
    },
    celebrity,
    celebrityBonus,
    wordOfMouth,
    returning: game.run.returning || 0,
    streetIncome: Object.fromEntries(
      Object.keys(streetServices).map((id) => [
        id,
        game.run.guests.reduce(
          (sum, g) => sum + (g.streetIncome?.[id] || 0),
          0,
        ),
      ]),
    ),
    giftIncome: game.run.guests.reduce(
      (sum, g) => sum + (g.giftIncome || 0),
      0,
    ),
    cinemaIncome: game.run.guests.reduce(
      (sum, g) => sum + (g.cinemaIncome || 0),
      0,
    ),
    tourGuests: game.run.mix.group,
    tourIncome: incomeByType("group"),
    rareIncome: incomeByType("garden"),
    day: game.state.day,
    guests: game.run.guests.length,
    demand: game.run.demand,
    income,
    cost,
    operations,
    feedback,
    mix: game.run.mix,
    shortage,
    outlook: game.run.outlook,
    rareArrivals: game.run.rareArrivals,
    reviews: game.run.guests.map(({ type, comment }) => ({ type, comment })),
  });
  game.state.history = game.state.history.slice(0, 30);
  settleRanking();
  game.state.cash += income - cost;
  game.mode = "closed";
  game.tab = "";
  closeMapMenu();
  save();
  renderPanel();
  note(
    game.state.day % monthLength === 0
      ? "月榜已更新 · 松间温泉第 " + game.state.ranking.place + " 名。"
      : "今日营业结束。下一日开始前可以扩建。",
  );
}

export { begin, finish };
