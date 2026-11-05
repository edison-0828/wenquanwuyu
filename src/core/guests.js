// 天气、旅客、旅行团预约和月度排行。

import { facilities, innCapacity } from "./map.js";
import { game } from "./state.js";
import { save } from "./storage.js";
import {
  celebrityBook,
  celebrityChance,
  legacyReturnRates,
  monthLength,
  rankingReturnRates,
  rivalInns,
  tour,
  weatherTypes,
} from "../data/catalog.js";
import { $ } from "../dom.js";
import { note } from "../ui/feedback.js";

const randomCelebrity = () =>
  Math.random() < celebrityChance
    ? celebrityBook[Math.floor(Math.random() * celebrityBook.length)]
    : null;

function dailyWeather() {
  if (
    game.state.weatherDay !== game.state.day ||
    !Object.hasOwn(weatherTypes, game.state.weather)
  ) {
    const roll = Math.random();
    game.state.weatherDay = game.state.day;
    game.state.weather = roll < 0.6 ? "sun" : roll < 0.88 ? "rain" : "mist";
    save();
  }
  return game.state.weather;
}

function weatherLabel(id) {
  const { name, visitors } = weatherTypes[id];
  return name + " · 客流 " + (visitors > 0 ? "+" : "") + visitors;
}

const returnChance = () =>
  game.state.ranking?.returnRate ??
  legacyReturnRates[game.state.ranking?.place - 1] ??
  0.15;

function guestSatisfaction(report) {
  if (!report.shortage || !report.guests || !report.demand) return null;
  const { room, bath, food } = report.shortage;
  const reviews = report.reviewEvents || {};
  const score =
    100 -
    (30 * room) / report.demand -
    (40 * bath) / report.guests -
    (30 * food) / report.guests +
    (12 * (reviews.good || 0) - 30 * (reviews.bad || 0)) / report.guests;
  return Math.round(Math.max(0, Math.min(100, score)));
}

const rankingPoints = (inn) =>
  Math.round(inn.income / 500 + inn.environment / 5 + inn.satisfaction * 2);

function monthStandings(month, environmentNow) {
  const reports = game.state.history.filter(
    (report) => Math.ceil(report.day / monthLength) === month,
  );
  const average = (values) =>
    values.length
      ? Math.round(
          values.reduce((sum, value) => sum + value, 0) / values.length,
        )
      : 0;
  const player = {
    name: "松间温泉",
    player: true,
    income: average(reports.map((report) => report.income || 0)),
    environment: reports.length
      ? average(reports.map((report) => report.outlook?.score || 0))
      : environmentNow,
    satisfaction: average(
      reports.map(guestSatisfaction).filter((value) => value !== null),
    ),
  };
  const standings = [...rivalInns, player]
    .map((inn) => ({ ...inn, score: rankingPoints(inn) }))
    .sort((a, b) => b.score - a.score);
  const place = standings.findIndex((inn) => inn.player) + 1;
  return {
    month,
    place,
    standings,
    days: reports.length,
    returnRate: rankingReturnRates[place - 1],
  };
}

function settleRanking() {
  if (game.state.day % monthLength === 0)
    game.state.ranking = monthStandings(game.state.day / monthLength, 0);
}

const hasTourOffer = () =>
  game.state.day === 2 || (game.state.day > 2 && game.state.day % 4 === 0);

const tourBooked = () => game.state.tourDay === game.state.day;

function showTourOffer() {
  if (game.mode !== "ready" || !hasTourOffer()) return;
  const booked = tourBooked();
  if (!booked && game.state.tourSeenDay === game.state.day) return;
  const enough = innCapacity(facilities()) >= tour.size;
  if (booked && enough) return;
  const dialog = $("tour-offer");
  if (dialog.open) return;
  $("tour-offer-detail").textContent = booked
    ? "已接下预约，但目前床位不足。可以取消预约，或关闭弹窗后补足床位。"
    : "有 " +
      tour.size +
      " 位旅客想预订客房。接单后团客优先入住，前 20 秒为团客时段，全日营业约 30 秒，消费按普通客人的 " +
      tour.multiplier +
      " 倍结算。" +
      (enough ? "" : "目前缺少已通路的客房床位。");
  $("skip-tour").textContent = booked ? "取消预约" : "略过";
  $("accept-tour").textContent = booked ? "继续扩建" : "接下预约";
  $("accept-tour").disabled = !booked && !enough;
  dialog.showModal();
}

function resolveTourOffer(accept) {
  if (!$("tour-offer").open) return;
  if (accept && tourBooked()) {
    $("tour-offer").close();
    return;
  }
  if (accept && innCapacity(facilities()) < tour.size) return;
  game.state.tourSeenDay = game.state.day;
  if (accept) game.state.tourDay = game.state.day;
  else delete game.state.tourDay;
  save();
  $("tour-offer").close();
  note(
    accept
      ? "已为旅行团预留 " + tour.size + " 个床位，开门后到店。"
      : "本次旅行团预约已略过。",
  );
}

export {
  dailyWeather,
  guestSatisfaction,
  monthStandings,
  randomCelebrity,
  returnChance,
  settleRanking,
  showTourOffer,
  tourBooked,
  weatherLabel,
};

export function initCoreGuests() {
  $("skip-tour").onclick = () => resolveTourOffer(false);
  $("accept-tour").onclick = () => resolveTourOffer(true);
  $("tour-offer").addEventListener("cancel", (event) => {
    if (tourBooked()) return;
    event.preventDefault();
    resolveTourOffer(false);
  });
}
