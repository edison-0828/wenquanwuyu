// 建造菜单、建筑预览、升级、扩建和拆除操作。

import {
  bridgeRoad,
  canExtendTo,
  canUpgrade,
  capacityAt,
  coords,
  extensionAt,
  extraMaintenance,
  facilities,
  facilityLevel,
  inside,
  key,
  locked,
  lodgingFee,
  neighbors,
  roadRoutes,
  sceneryScore,
  upgradeCost,
} from "../core/map.js";
import { game } from "../core/state.js";
import { save } from "../core/storage.js";
import {
  animals,
  buildCategories,
  capacityByType,
  entrance,
  facadeCost,
  facilityStyles,
  isLodging,
  isRoad,
  items,
  roadTypes,
  roomExpansion,
  sceneryPoints,
  tierDetails,
  tierNames,
} from "../data/catalog.js";
import { $ } from "../dom.js";
import { building } from "../render/buildings.js";
import { pos } from "../render/camera.js";
import { riversideGate } from "../render/landscape.js";
import { diamond } from "../render/primitives.js";
import { drawGarden, drawRoad, drawWater } from "../render/tiles.js";
import { refreshWalkers } from "../render/walkers.js";
import { note, number } from "./feedback.js";
import { renderPanel } from "./panels.js";

function upgradePlan(type, level, limit) {
  let cost = 0,
    target = level;
  while (target < limit) {
    const nextCost = upgradeCost(type, target);
    if (cost + nextCost > game.state.cash) break;
    cost += nextCost;
    target++;
  }
  return { cost, target };
}

const buildIcons = new Map();

function buildIcon(
  type,
  level = 1,
  facade = "original",
  extension = null,
  detail = false,
) {
  const cacheKey = [
    type,
    level,
    facade,
    extension?.[0] || 0,
    extension?.[1] || 0,
    detail,
  ].join("-");
  if (buildIcons.has(cacheKey)) return buildIcons.get(cacheKey);
  const icon = document.createElement("canvas");
  icon.width = detail ? 110 : 58;
  icon.height = detail ? 88 : 48;
  const x = detail ? 55 : 29,
    y = detail ? 62 : 33;
  const sceneContext = game.ctx;
  game.ctx = icon.getContext("2d");
  try {
    diamond(x, y, detail ? 34 : 25, detail ? 15 : 11, "#9eb184");
    if (isRoad(type)) {
      drawRoad(x, y, type);
      if (type === "gate") riversideGate(x, y, level);
    } else if (type === "water") drawWater(x, y, [0, 1, 2, 3]);
    else if (sceneryPoints[type]) drawGarden(x, y, type, level);
    else
      building(
        x,
        y - (extension ? 8 : 0),
        type,
        extension?.[0] || 24,
        extension?.[1] || 24,
        level,
        facade,
      );
  } finally {
    game.ctx = sceneContext;
  }
  const image = icon.toDataURL("image/png");
  buildIcons.set(cacheKey, image);
  return image;
}

function renderMapMenu() {
  game.buildPreview = null;
  const menu = $("map-menu");
  menu.hidden = !game.cursor;
  const picking = Boolean(game.cursor && game.kind === "extend-room");
  menu.classList.toggle("pick-tile", picking);
  if (!game.cursor) return;
  if (picking) {
    menu.innerHTML =
      '<div class="map-head"><b>扩房 · ' +
      roomExpansion.cost +
      ' 文</b><button id="map-room-expand">取消选地</button></div>' +
      '<p id="map-feedback" aria-live="polite">点高亮空地即可施工。可拖动地图查看。</p>';
    return;
  }
  const [x, y] = game.cursor,
    type = game.state.grid[y][x];
  const extended = isLodging(type) && extensionAt(x, y) !== undefined;
  const entryTile = x === entrance[0] && y === entrance[1];
  const entry = entryTile && !game.state.entranceGateHidden;
  const title = locked(x)
    ? "东坡地块"
    : entry
      ? "旅馆入口"
      : items[type]?.name || "选择要建的设施";
  const facility =
    type &&
    facilities()[isLodging(type) ? "room" : type]?.find(
      (f) => f.x === x && f.y === y,
    );
  const status = facility?.bonus
    ? " · 庭园搭配生效"
    : capacityByType[type] && !facility
      ? " · 未接通入口"
      : "";
  const capacities = capacityByType[type];
  const level = facilityLevel(x, y);
  const scenery = sceneryPoints[type];
  const detail = locked(x)
    ? "开放东坡后可以在这里建造。"
    : entry
      ? "连接旅馆和山道。"
      : capacities
        ? level +
          " 级 · " +
          tierNames[level - 1] +
          (extended ? " · 双格客房" : "") +
          " · 每日容量 " +
          capacityAt(type, x, y) +
          " 人" +
          status +
          (isLodging(type)
            ? " · 住宿 " + lodgingFee(type, level) + " 文／人"
            : "") +
          " · 每日维护 " +
          (items[type].keep +
            extraMaintenance(type, level) +
            (extended ? roomExpansion.keep : 0)) +
          " 文"
        : scenery
          ? level +
            " 级 · 环境 +" +
            sceneryScore(type, level) +
            " 分 · 每日维护 " +
            (items[type].keep + extraMaintenance(type, level)) +
            " 文"
          : type
            ? items[type].detail
            : "";
  const batch = canUpgrade(type)
    ? upgradePlan(type, level, tierNames.length)
    : null;
  const upgradeButton =
    game.mode === "ready" && canUpgrade(type) && level < tierNames.length
      ? '<button class="map-confirm" id="map-upgrade" ' +
        (game.state.cash < upgradeCost(type, level) ? "disabled" : "") +
        " >升级至 " +
        (level + 1) +
        " 级 · " +
        number(upgradeCost(type, level)) +
        " 文</button>" +
        "<p>外观换为「" +
        tierDetails[type][level] +
        "」 · " +
        (scenery
          ? "环境 +" +
            sceneryScore(type, level) +
            " → +" +
            sceneryScore(type, level + 1) +
            " 分"
          : "容量 " +
            capacityAt(type, x, y) +
            " → " +
            (capacityAt(type, x, y) +
              capacities[level] -
              capacities[level - 1]) +
            " 人") +
        (isLodging(type)
          ? " · 住宿 " + lodgingFee(type, level + 1) + " 文／人"
          : "") +
        " · 每日维护 +" +
        extraMaintenance(type, 2) +
        " 文</p>" +
        (level < tierNames.length - 1
          ? '<button class="map-confirm" id="map-upgrade-all" ' +
            (batch.target === level ? "disabled" : "") +
            ">一键满级" +
            (batch.target > level
              ? " · 升至 " +
                batch.target +
                " 级 · " +
                number(batch.cost) +
                " 文"
              : "") +
            "</button>"
          : "")
      : "";
  const expandRoom =
    game.mode === "ready" &&
    isLodging(type) &&
    !extended &&
    neighbors(x, y).some(([a, b]) => canExtendTo(a, b))
      ? '<button class="map-confirm" id="map-room-expand" ' +
        (game.state.cash < roomExpansion.cost ? "disabled" : "") +
        ">" +
        ("扩房 · " + roomExpansion.cost + " 文") +
        "</button>" +
        "<p>" +
        ("容量 +" +
          roomExpansion.capacity +
          " 人 · 每日维护 +" +
          roomExpansion.keep +
          " 文") +
        "</p>"
      : "";
  menu.classList.toggle("top", pos(x, y)[1] > 145);
  const buildable = game.mode === "ready" && !locked(x) && !entry && !type;
  const kinds = buildable
    ? buildCategories.find((category) => category.id === game.buildCategory)
        .items
    : [];
  let previewStatus = "";
  if (kinds.includes(game.kind)) {
    const needsRoad = Boolean(capacityByType[game.kind] || isRoad(game.kind));
    const routes = needsRoad ? roadRoutes() : null;
    const access = needsRoad
      ? neighbors(x, y).find(([a, b]) => routes.has(key(a, b)))
      : null;
    const affordable = game.state.cash >= items[game.kind].cost;
    game.buildPreview = {
      x,
      y,
      type: game.kind,
      access,
      warning: !affordable || (needsRoad && !access),
    };
    const label = !affordable
      ? "资金不足 · 还差 " +
        number(items[game.kind].cost - game.state.cash) +
        " 文"
      : needsRoad
        ? access
          ? "已接通入口"
          : "未接通入口 · 可施工，铺路后启用"
        : "可直接摆放";
    previewStatus =
      '<p><span class="placement-status' +
      (game.buildPreview.warning ? " warning" : "") +
      '">' +
      label +
      "</span></p>";
  }
  const occupants = Object.entries(animals).filter(([, animal]) =>
    animal.hosts.includes(type),
  );
  const resident = animals[game.state.animals[key(x, y)]];
  const animalChoices = occupants.length
    ? "<p>动物 · " +
      (resident
        ? resident.name + " · 环境 +" + resident.score + " 分"
        : "目前空着") +
      "</p>" +
      (game.mode === "ready" && !resident
        ? '<div class="build-categories">' +
          occupants
            .map(
              ([id, animal]) =>
                '<button data-animal="' +
                id +
                '" ' +
                (game.state.cash < animal.cost ? "disabled" : "") +
                ">" +
                animal.name +
                " · " +
                animal.cost +
                " 文 · +" +
                animal.score +
                " 分</button>",
            )
            .join("") +
          "</div>"
        : "")
    : "";
  const animalGuide =
    buildable && game.buildCategory === "animals"
      ? "<p>点击水路或锦鲤池买鱼，点击松树或樱花树买鸟。每格可以养一种。</p>" +
        Object.values(animals)
          .map(
            (animal) =>
              '<div class="row"><span>' +
              animal.name +
              "</span><strong>" +
              animal.cost +
              " 文 · +" +
              animal.score +
              " 分</strong></div>",
          )
          .join("")
      : "";
  const roadChoices =
    game.mode === "ready" && !entry && isRoad(type)
      ? '<p>更换路面</p><div class="build-categories">' +
        roadTypes
          .filter((road) => road !== type)
          .map(
            (road) =>
              '<button data-road-style="' +
              road +
              '" ' +
              (game.state.cash < items[road].cost ? "disabled" : "") +
              ">" +
              items[road].name +
              " · " +
              items[road].cost +
              " 文</button>",
          )
          .join("") +
        "</div>"
      : "";
  const currentFacade = game.state.facilityStyles[key(x, y)] || "original";
  const facadeChoices =
    game.mode === "ready" && capacities
      ? "<p>建筑外观 · " +
        (currentFacade === "original" && type !== "room"
          ? "原有外观"
          : facilityStyles[currentFacade].name) +
        " · 换装 " +
        facadeCost +
        ' 文</p><div class="build-categories">' +
        Object.entries(facilityStyles)
          .map(
            ([id, style]) =>
              '<button data-facade="' +
              id +
              '" aria-pressed="' +
              (id === currentFacade) +
              '" ' +
              (id === currentFacade || game.state.cash < facadeCost
                ? "disabled"
                : "") +
              ">" +
              (id === "original" && type !== "room" ? "原有外观" : style.name) +
              "</button>",
          )
          .join("") +
        "</div>"
      : "";
  let appearance = "";
  if (canUpgrade(type) && !entry) {
    const facade = game.state.facilityStyles[key(x, y)] || "original";
    let footprint = null;
    if (extended) {
      const [tx, ty] = coords(extensionAt(x, y));
      footprint = [x === tx ? 24 : 49, y === ty ? 24 : 49];
    }
    const next = Math.min(tierNames.length, level + 1);
    appearance =
      '<div class="upgrade-art"><figure><img alt="' +
      items[type].name +
      '当前外观" src="' +
      buildIcon(type, level, facade, footprint, true) +
      '">' +
      "<figcaption>当前 · " +
      level +
      " 级</figcaption></figure>" +
      (next > level
        ? '<span class="upgrade-arrow" aria-hidden="true">→</span><figure><img alt="' +
          items[type].name +
          '下一级外观" src="' +
          buildIcon(type, next, facade, footprint, true) +
          '"><figcaption>改造后 · ' +
          next +
          " 级</figcaption></figure>"
        : '<div class="upgrade-complete">满级建筑<br><small>' +
          tierDetails[type][level - 1] +
          "</small></div>") +
      "</div>";
  }
  const categoryTabs = buildable
    ? '<div class="build-categories" aria-label="建筑分类">' +
      buildCategories
        .map(
          (category) =>
            '<button data-category="' +
            category.id +
            '" aria-pressed="' +
            (category.id === game.buildCategory) +
            '">' +
            category.name +
            "</button>",
        )
        .join("") +
      "</div>"
    : "";
  menu.innerHTML =
    '<div class="map-head"><b>' +
    title +
    '</b><button id="map-close" aria-label="关闭地块菜单">关闭</button></div>' +
    appearance +
    (detail ? "<p>" + detail + "</p>" : "") +
    (canUpgrade(type)
      ? "<p>外观 · " +
        tierDetails[type][level - 1] +
        (level === tierNames.length ? " · 已满级" : "") +
        "</p>"
      : "") +
    upgradeButton +
    expandRoom +
    roadChoices +
    facadeChoices +
    animalChoices +
    categoryTabs +
    animalGuide +
    previewStatus +
    (kinds.length
      ? '<div class="items">' +
        kinds
          .map(
            (k) =>
              '<button class="item ' +
              (game.kind === k ? "selected " : "") +
              (game.state.cash < items[k].cost ? "unaffordable" : "") +
              '" data-kind="' +
              k +
              '">' +
              '<img alt="" src="' +
              buildIcon(k) +
              '"><span class="item-name">' +
              items[k].name +
              '</span><span class="item-price">' +
              number(items[k].cost) +
              " 文</span></button>",
          )
          .join("") +
        "</div>"
      : "") +
    (entry && game.mode === "ready"
      ? '<button class="map-confirm" id="map-entry-gate">移除入口门楼并保留道路</button>'
      : locked(x)
        ? '<button class="map-confirm" id="map-expand">查看扩建</button>'
        : game.mode === "ready" &&
            !entry &&
            type &&
            (type === "gate" || (!entryTile && !bridgeRoad(x, y)))
          ? '<button class="map-confirm" id="map-remove">' +
            (type === "gate" ? "拆除牌坊并保留石板路" : "拆除") +
            " · 返还 " +
            Math.floor(items[type].cost * 0.25) +
            " 文</button>"
          : game.buildPreview
            ? '<button class="map-confirm" id="map-place" ' +
              (game.state.cash < items[game.kind].cost ? "disabled" : "") +
              ">建造 " +
              items[game.kind].name +
              " · " +
              number(items[game.kind].cost) +
              " 文</button>"
            : !type && game.mode !== "ready"
              ? "<p>" +
                (game.mode === "closed"
                  ? "准备下一日后即可施工。"
                  : "今日营业结束后即可施工。") +
                "</p>"
              : "") +
    '<p id="map-feedback" aria-live="polite">' +
    (kinds.length && game.kind ? items[game.kind].detail : "") +
    "</p>";
}

function closeMapMenu() {
  game.cursor = null;
  game.kind = "";
  renderMapMenu();
}

function upgradeFacility(all) {
  if (game.mode !== "ready" || !game.cursor) return;
  const [x, y] = game.cursor,
    type = game.state.grid[y][x];
  const level = facilityLevel(x, y);
  if (!canUpgrade(type) || level >= tierNames.length || locked(x)) return;
  const { cost, target } = upgradePlan(
    type,
    level,
    all ? tierNames.length : level + 1,
  );
  if (target === level) return;
  game.state.cash -= cost;
  game.state.upgrades[key(x, y)] = target;
  save();
  renderPanel();
  renderMapMenu();
  note(
    "已升至 " +
      target +
      " 级，换上" +
      tierDetails[type][target - 1] +
      "。共花费 " +
      number(cost) +
      " 文。",
  );
}

function select(x, y) {
  if (game.kind === "extend-room" && game.cursor && game.mode === "ready") {
    const [a, b] = game.cursor;
    if (
      !neighbors(a, b).some(([tx, ty]) => tx === x && ty === y) ||
      !canExtendTo(x, y)
    ) {
      note("请选择亮起的相邻空地。");
      return;
    }
    if (
      !isLodging(game.state.grid[b][a]) ||
      extensionAt(a, b) !== undefined ||
      game.state.cash < roomExpansion.cost
    )
      return;
    game.state.roomExtensions[key(x, y)] = key(a, b);
    game.state.cash -= roomExpansion.cost;
    closeMapMenu();
    save();
    refreshWalkers();
    renderPanel();
    note(
      "双格客房已建成，下一次营业可多接待 " + roomExpansion.capacity + " 人。",
    );
    return;
  }
  if (!inside(x, y)) {
    closeMapMenu();
    return;
  }
  const anchor = game.state.roomExtensions[key(x, y)];
  game.cursor = anchor === undefined ? [x, y] : coords(anchor);
  if (game.tab) {
    game.tab = "";
    renderPanel();
  }
  game.kind = "";
  renderMapMenu();
}

function place() {
  if (game.mode !== "ready" || !game.cursor || !game.kind) return;
  const [x, y] = game.cursor,
    old = game.state.grid[y][x];
  if (locked(x)) {
    note("请先在扩建面板开放东坡。");
    return;
  }
  const entryTile = x === entrance[0] && y === entrance[1];
  if (
    entryTile &&
    (!game.state.entranceGateHidden ||
      (game.kind !== "remove" && !isRoad(game.kind)))
  ) {
    note("入口需保留道路。");
    return;
  }
  if (game.kind === "remove") {
    if (old !== "gate" && (entryTile || bridgeRoad(x, y))) {
      note("桥头道路需保留通行。");
      return;
    }
    if (!old) {
      note("这里是空地。");
      return;
    }
    const refund = Math.floor(items[old].cost * 0.25);
    delete game.state.upgrades[key(x, y)];
    delete game.state.facilityStyles[key(x, y)];
    delete game.state.animals[key(x, y)];
    const extension = extensionAt(x, y);
    if (extension !== undefined) delete game.state.roomExtensions[extension];
    game.state.grid[y][x] = old === "gate" ? "path" : "";
    game.state.cash += refund;
    note(
      "已拆除 " +
        items[old].name +
        "，返还 " +
        refund +
        " 文。" +
        (old === "gate" ? "原地保留石板路。" : ""),
    );
  } else {
    if (!items[game.kind]) return;
    if (old && (!isRoad(old) || !isRoad(game.kind) || old === game.kind)) {
      note("这块地已有设施，请先选择空地。");
      return;
    }
    const item = items[game.kind];
    if (game.state.cash < item.cost) {
      note("资金还差 " + (item.cost - game.state.cash) + " 文。");
      return;
    }
    if (old === "gate") delete game.state.upgrades[key(x, y)];
    game.state.grid[y][x] = game.kind;
    game.state.cash -= item.cost;
  }
  closeMapMenu();
  save();
  refreshWalkers();
  renderPanel();
}

export { closeMapMenu, place, select };

export function initUiBuildMenu() {
  $("map-menu").addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;
    if (button.id === "map-close") closeMapMenu();
    if (button.id === "map-expand") {
      closeMapMenu();
      game.tab = "land";
      renderPanel();
    }
    if (button.dataset.category) {
      game.buildCategory = button.dataset.category;
      game.kind = "";
      renderMapMenu();
    }
    if (button.dataset.animal && game.cursor && game.mode === "ready") {
      const [x, y] = game.cursor,
        index = key(x, y),
        id = button.dataset.animal;
      const animal = animals[id];
      if (
        !animal?.hosts.includes(game.state.grid[y][x]) ||
        game.state.animals[index] ||
        game.state.cash < animal.cost
      )
        return;
      game.state.animals[index] = id;
      game.state.cash -= animal.cost;
      save();
      renderPanel();
      renderMapMenu();
      note(animal.name + "已安家，环境 +" + animal.score + " 分。");
    }
    if (button.dataset.roadStyle) {
      game.kind = button.dataset.roadStyle;
      place();
    }
    if (button.dataset.facade && game.mode === "ready" && game.cursor) {
      const [x, y] = game.cursor,
        id = button.dataset.facade,
        tileId = key(x, y);
      if (
        !capacityByType[game.state.grid[y][x]] ||
        !Object.hasOwn(facilityStyles, id) ||
        (game.state.facilityStyles[tileId] || "original") === id ||
        game.state.cash < facadeCost
      )
        return;
      game.state.facilityStyles[tileId] = id;
      game.state.cash -= facadeCost;
      save();
      renderPanel();
      renderMapMenu();
      note("已更换" + items[game.state.grid[y][x]].name + "的外观。");
    }
    if (button.dataset.kind) {
      const scroll = button.parentElement.scrollTop;
      game.kind = button.dataset.kind;
      renderMapMenu();
      $("map-menu").querySelector(".items").scrollTop = scroll;
    }
    if (button.id === "map-place") place();
    if (
      button.id === "map-entry-gate" &&
      !game.state.entranceGateHidden &&
      game.mode === "ready" &&
      game.cursor?.[0] === entrance[0] &&
      game.cursor[1] === entrance[1]
    ) {
      game.state.entranceGateHidden = true;
      game.state.grid[entrance[1]][entrance[0]] = "path";
      save();
      renderMapMenu();
      note("入口门楼已移除，原地已恢复为石板路。");
    }
    if (button.id === "map-remove") {
      game.kind = "remove";
      place();
    }
    if (button.id === "map-upgrade") upgradeFacility(false);
    if (button.id === "map-upgrade-all") upgradeFacility(true);
    if (button.id === "map-room-expand") {
      game.kind = game.kind === "extend-room" ? "" : "extend-room";
      renderMapMenu();
    }
  });
}
