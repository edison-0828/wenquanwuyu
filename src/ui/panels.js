// 账簿、排行、图鉴、土地面板和营业按钮。

import { begin } from "../core/business.js";
import {
  dailyWeather,
  guestSatisfaction,
  monthStandings,
  returnChance,
  showTourOffer,
  weatherLabel,
} from "../core/guests.js";
import {
  bankDistrictAt,
  bridgeConnected,
  canBuyLand,
  environment,
  facilities,
  innCapacity,
  key,
  landSize,
  nextLand,
} from "../core/map.js";
import { game } from "../core/state.js";
import { businessBadge, save } from "../core/storage.js";
import {
  bankLeft,
  bankStart,
  celebrityBook,
  entrance,
  guestTypes,
  items,
  monthLength,
} from "../data/catalog.js";
import { $ } from "../dom.js";
import { showRidge } from "../render/camera.js";
import { refreshWalkers } from "../render/walkers.js";
import { closeMapMenu } from "./build-menu.js";
import { note, number } from "./feedback.js";
import { playChime } from "./settings.js";

function celebrityPortrait(id) {
  const colors = {
    scribe: ["#5f8069", "#58483e"],
    painter: ["#8c6f91", "#5a4046"],
    merchant: ["#9e605c", "#493834"],
    performer: ["#577a91", "#343e4b"],
  };
  const [coat, hair] = colors[id];
  return (
    '<svg class="celebrity-portrait" aria-hidden="true" viewBox="0 0 24 24" shape-rendering="crispEdges">' +
    '<path fill="#5a443f" d="M6 16h12v2h2v4H4v-4h2z"/><path fill="' +
    coat +
    '" d="M6 18h12v4H6z"/>' +
    '<path fill="#f5d9a9" d="M10 17h4v2h-1v2h-2v-2h-1z"/><path fill="' +
    hair +
    '" d="M8 4h9v2h2v8h-2v2H7v-2H5V8h2V6h1z"/>' +
    '<path fill="#efbd94" d="M8 9h9v5h-2v2H9v-2H7v-4h1z"/>' +
    '<path fill="' +
    hair +
    '" d="M10 10h1v2h-1zm5 0h1v2h-1z"/><path fill="#b77665" d="M12 14h2v1h-2z"/>' +
    (id === "scribe"
      ? '<path fill="#856a50" d="M8 10h9v1H8z"/>'
      : id === "painter"
        ? '<path fill="#ef9c9e" d="M6 7h3v3H6z"/>'
        : id === "merchant"
          ? '<path fill="#f1ce83" d="M16 6h2v4h-2z"/>'
          : '<path fill="#c66659" d="M6 7h12v2H6z"/>') +
    "</svg>"
  );
}

function renderPanel() {
  $("day").textContent = game.state.day + " 日";
  $("cash").textContent = number(game.state.cash);
  const available = facilities();
  const weather = dailyWeather();
  $("weather-label").textContent = weatherLabel(weather);
  const outlook =
    game.mode === "running" ? game.run.outlook : environment(available);
  $("environment").textContent = number(outlook.score);
  $("street-camera").hidden = !game.state.acrossRiver && !nextLand()?.columns;
  $("capacity").textContent = innCapacity(available) + " 人";
  $("badge").textContent =
    game.mode === "running"
      ? businessBadge()
      : game.mode === "closed"
        ? "今日已收摊"
        : "营业前 · 可施工";
  $("open").disabled = game.mode === "running";
  $("open").textContent =
    game.mode === "running"
      ? "营业中"
      : game.mode === "closed"
        ? "准备下一日"
        : "开始营业";
  document
    .querySelectorAll("[data-tab]")
    .forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.tab === game.tab),
    );
  $("content").hidden = !game.tab;
  const closeSheet =
    '<button class="sheet-close" id="close-sheet">关闭</button>';
  if (game.tab === "celebrities") {
    const visits = game.state.celebrityVisits || {};
    $("content").innerHTML =
      '<div class="report">' +
      closeSheet +
      "<b>地方名人图鉴 · " +
      Object.keys(visits).length +
      "／" +
      celebrityBook.length +
      "</b>" +
      "<p>环境达到 500 分且温泉接通入口后，每天开业有 18% 机会随机来一位名人。接待名人当天营业额 +20%。满意则下一次营业额 +15%，不满意则 −15%。</p>" +
      celebrityBook
        .map((celebrity) => {
          const record = visits[celebrity.id];
          return (
            '<section class="goal celebrity-card' +
            (record ? "" : " locked") +
            '">' +
            celebrityPortrait(celebrity.id) +
            '<div><div class="row"><b>' +
            celebrity.name +
            " · " +
            celebrity.role +
            "</b><strong>" +
            (record ? "已到访 " + record.count + " 次" : "待解锁") +
            "</strong></div><p>偏好 · " +
            celebrity.wish +
            "</p>" +
            (record
              ? "<p>首次到访第 " +
                record.firstDay +
                " 日 · 最近一次" +
                (record.happy ? "满意" : "不满意") +
                "</p>"
              : "") +
            "</div></section>"
          );
        })
        .join("") +
      "</div>";
    return;
  }
  if (game.tab === "ranking") {
    const month = Math.ceil(game.state.day / monthLength);
    const live = monthStandings(month, outlook.score);
    const leader = live.standings[live.place - 2],
      own = live.standings[live.place - 1];
    const settled = game.state.ranking;
    const nextDay =
      (month +
        (game.mode === "closed" && game.state.day % monthLength === 0
          ? 1
          : 0)) *
      monthLength;
    $("content").innerHTML =
      '<div class="report">' +
      closeSheet +
      "<b>温泉度假村排行</b>" +
      "<p>第 " +
      month +
      " 月 · 当前第 " +
      live.place +
      " 名／" +
      live.standings.length +
      " 家 · 已结算 " +
      live.days +
      " 日</p>" +
      (!live.days ? "<p>今天开业结算后，榜单会加入收入和满意度。</p>" : "") +
      "<p>月内日均收入每 500 文计 1 分，平均环境每 5 点计 1 分，平均满意度每 1% 计 2 分。满意度按入住、泡汤和用餐的满足情况计算，游客好评会加分，用餐意外差评会扣分。</p>" +
      live.standings
        .map(
          (inn, i) =>
            '<div class="row' +
            (inn.player ? " ranking-own" : "") +
            '"><span><span class="ranking-name">' +
            (i + 1) +
            "　" +
            inn.name +
            (inn.player ? ' <span class="ranking-you">你</span>' : "") +
            "</span><br>日均 " +
            number(inn.income) +
            " 文 · 环境 " +
            number(inn.environment) +
            " · 满意 " +
            inn.satisfaction +
            "%</span><strong>" +
            number(inn.score) +
            " 分</strong></div>",
        )
        .join("") +
      (leader
        ? "<p>要超过前一名，还差 " +
          (leader.score - own.score + 1) +
          " 个综合分。可对照上方三项数据。</p>"
        : "<p>目前位居榜首。</p>") +
      "<p>" +
      (settled
        ? "上次正式结榜第 " + settled.place + " 名。"
        : "首期正式名次将在月末公布。") +
      " 当前回访率 " +
      Math.round(returnChance() * 100) +
      "%，下一次正式结榜在第 " +
      nextDay +
      " 日。</p></div>";
    return;
  }
  if (game.tab === "land") {
    const area = nextLand();
    if (!area) {
      game.tab = "";
      renderPanel();
      return;
    }
    const conditions = [
      area.environment && outlook.score < area.environment
        ? "需要环境评分 " +
          area.environment +
          " 分（当前 " +
          outlook.score +
          " 分）。"
        : "",
      area.columns && !bridgeConnected(area)
        ? "请先把前一期的主路末端接到旅馆入口。"
        : "",
      game.state.cash < area.cost
        ? "资金还差 " + number(area.cost - game.state.cash) + " 文。"
        : "",
      game.mode !== "ready" ? "准备下一日后可以购地。" : "",
    ].filter(Boolean);
    $("content").innerHTML =
      '<div class="report">' +
      closeSheet +
      "<b>土地出售 · " +
      area.name +
      "</b>" +
      '<section class="goal"><div class="row"><span>可建地</span><strong>' +
      landSize(area) +
      " 格</strong></div>" +
      '<div class="row"><span>购地费用</span><strong>' +
      number(area.cost) +
      " 文</strong></div>" +
      "<p>" +
      (conditions.join(" ") ||
        "确认购入后会开放地块并预铺主路。沿主路施工，或铺支路接通设施。") +
      "</p>" +
      '<button id="buy-map-land" ' +
      (canBuyLand(area, outlook.score) ? "" : "disabled") +
      ">确认购入</button></section></div>";
    return;
  }
  if (game.tab === "environment") {
    $("content").innerHTML =
      '<div class="report">' +
      closeSheet +
      "<b>环境评分 " +
      number(outlook.score) +
      " 分</b>" +
      '<div class="row"><span>庭园设施</span><strong>+' +
      outlook.plants +
      " 分</strong></div>" +
      '<div class="row"><span>鸟类与鱼类</span><strong>+' +
      (outlook.animalScore || 0) +
      " 分</strong></div>" +
      '<div class="row"><span>已通路设施的景观搭配</span><strong>+' +
      outlook.combos +
      " 分</strong></div>" +
      '<div class="row"><span>每日到访加成</span><strong>+' +
      outlook.extraVisitors +
      " 人</strong></div>" +
      '<div class="row"><span>散客成为赏景客的基础概率</span><strong>' +
      Number(outlook.rareChance.toFixed(1)) +
      "%</strong></div>" +
      "<p>环境评分无上限。每级松树 +5、石灯笼 +4、锦鲤池 +6、樱花树 +9、朱红鸟居 +11、庭园石塔 +14、花见休憩亭 +20。石灯邻接客房、松树邻接温泉、锦鲤池邻接餐室时，还会给已通路的设施加分。</p>" +
      "<p>每天有 5 位基础来客，环境每满 25 分多吸引 1 人，评分越高，稀客到访概率越高。环境达到 150 分才会吸引赏景客，每次最多 2 位。名人入住时，有空余床位才会进行 5% 的同场判定，成功则来 1 位赏景客。赏景客消费仍为普通客人的 10 倍。</p></div>";
    return;
  }
  if (game.tab === "report") {
    const last = game.state.history[0];
    const rows = last
      ? [
          ["接待／到访", last.guests + "／" + last.demand + " 人"],
          ["营业收入", number(last.income)],
          ["维护费", number(last.cost - (last.operations || 0))],
          ...(last.operations
            ? [["额外运营成本", number(last.operations)]]
            : []),
          [
            "净收益",
            (last.income >= last.cost ? "+" : "") +
              number(last.income - last.cost),
          ],
        ]
      : [];
    if (last?.weather) rows.push(["当日天气", weatherLabel(last.weather)]);
    if (last?.reviewEvents)
      rows.push(
        ["游客好评", last.reviewEvents.good + " 条"],
        ["用餐意外差评", last.reviewEvents.bad + " 条"],
      );
    if (last && guestSatisfaction(last) !== null)
      rows.push(["客户满意度", guestSatisfaction(last) + "%"]);
    if (last?.celebrity) {
      const celebrity = celebrityBook.find(
        (entry) => entry.id === last.celebrity.id,
      );
      rows.push(
        [
          "名人到访",
          celebrity.name + " · " + (last.celebrity.happy ? "满意" : "不满意"),
        ],
        ["名人到访加成", "+ " + number(last.celebrityBonus) + " 文"],
        ["下一次营业风评", last.celebrity.happy ? "+15%" : "−15%"],
      );
    }
    if (last?.wordOfMouth)
      rows.push([
        "上次名人风评",
        (last.wordOfMouth > 0 ? "+" : "") + number(last.wordOfMouth) + " 文",
      ]);
    if (last?.returning) rows.push(["回头客到访", last.returning + " 人"]);
    if (last?.giftIncome)
      rows.push(["纪念品收入", number(last.giftIncome) + " 文"]);
    if (last?.cinemaIncome)
      rows.push(["影院收入", number(last.cinemaIncome) + " 文"]);
    for (const [id, income] of Object.entries(last?.streetIncome || {})) {
      if (income) rows.push([items[id].name + "收入", number(income) + " 文"]);
    }
    if (last?.tourGuests)
      rows.push(
        ["旅行团接待", last.tourGuests + " 人"],
        ["团客收入", number(last.tourIncome) + " 文"],
      );
    if (last?.rareIncome)
      rows.push(["稀客收入", number(last.rareIncome) + " 文"]);
    if (last?.outlook)
      rows.push(
        ["当日环境", last.outlook.score + " 分"],
        ["环境额外客流", "+" + last.outlook.extraVisitors + " 人"],
        [
          "稀有客接待／到访",
          (last.mix.garden || 0) + "／" + last.rareArrivals + " 人",
        ],
      );
    if (last?.shortage)
      rows.push(
        ["未能入住", last.shortage.room + " 人"],
        ["未能泡汤", last.shortage.bath + " 人"],
        ["未能用餐", last.shortage.food + " 人"],
      );
    if (last?.mix)
      for (const [type, count] of Object.entries(last.mix)) {
        if (
          count &&
          type !== "group" &&
          type !== "celebrity" &&
          (type !== "garden" || !last.outlook)
        )
          rows.push([guestTypes[type].name, count + " 人"]);
      }
    $("content").innerHTML = last
      ? '<div class="report">' +
        closeSheet +
        "<b>第 " +
        last.day +
        " 日营业报告</b>" +
        rows
          .map(
            ([label, value]) =>
              '<div class="row"><span>' +
              label +
              "</span><strong>" +
              value +
              "</strong></div>",
          )
          .join("") +
        "<p>" +
        last.feedback +
        "</p>" +
        (last.reviews?.length
          ? "<b>旅客留言</b>" +
            last.reviews
              .map(
                (review) =>
                  '<div class="row"><span>' +
                  guestTypes[review.type].name +
                  "<br>" +
                  review.comment +
                  "</span></div>",
              )
              .join("")
          : "") +
        "</div>"
      : '<div class="report">' +
        closeSheet +
        "今晚收摊后，账簿会记录客流、收益与评价。</div>";
    return;
  }
  $("content").innerHTML = "";
}

export { renderPanel };

export function initUiPanels() {
  $("content").addEventListener("click", (e) => {
    if (e.target.closest("#close-sheet")) {
      game.tab = "";
      renderPanel();
      return;
    }
    if (e.target.closest("#buy-map-land")) {
      const area = nextLand();
      if (!area || !canBuyLand(area, environment(facilities()).score)) return;
      const plots = landSize(area);
      game.state.cash -= area.cost;
      game.state[area.id] = true;
      if (area.infill) {
        const outer = bankLeft + area.columns - 1;
        for (let y = bankStart; y < area.start; y++) {
          const district = bankDistrictAt(y);
          game.state.grid[y][outer] = "path";
          if (y === district.start + 1) {
            for (let x = bankLeft + district.columns; x < outer; x++)
              game.state.grid[y][x] = "path";
          }
        }
      } else if (area.rows) {
        for (let i = 0; i < area.rows; i++) {
          const row = Array(game.W).fill("");
          row[entrance[0]] = "path";
          if (area.columns >= 19) {
            row[10] = "path";
            row[19] = "path";
          }
          if (i === 1 || (area.rows >= 6 && i === 4)) {
            const from = area.columns ? bankLeft : entrance[0] + 1;
            const end = area.columns ? bankLeft + area.columns - 1 : game.W - 2;
            for (let x = from; x <= end; x++) row[x] = "path";
          }
          game.state.grid.push(row);
        }
        game.H += area.rows;
      } else {
        if (!area.existing) {
          game.W += area.width;
          for (const row of game.state.grid)
            row.push(...Array(area.width).fill(""));
        }
        for (let x = entrance[0]; x < game.W; x++) {
          if (
            !game.state.grid[1][x] &&
            game.state.roomExtensions[key(x, 1)] === undefined
          )
            game.state.grid[1][x] = "path";
        }
      }
      save();
      refreshWalkers();
      showRidge();
      note(area.name + "已购入，开放 " + plots + " 格，主路已预铺。");
    }
  });
  $("land-sign").onclick = () => {
    if (!nextLand()) return;
    closeMapMenu();
    game.tab = game.tab === "land" ? "" : "land";
    renderPanel();
  };
  document.querySelectorAll("[data-tab]").forEach(
    (btn) =>
      (btn.onclick = () => {
        closeMapMenu();
        game.tab = game.tab === btn.dataset.tab ? "" : btn.dataset.tab;
        renderPanel();
      }),
  );
  $("open").onclick = () => {
    closeMapMenu();
    if (game.mode === "ready") {
      begin();
      if (game.mode === "running") playChime();
    } else if (game.mode === "closed") {
      game.state.day++;
      game.mode = "ready";
      game.tab = "";
      game.run = null;
      save();
      renderPanel();
      note("新一天开始。可以调整布局，或直接开门营业。");
      showTourOffer();
    }
  };
}
