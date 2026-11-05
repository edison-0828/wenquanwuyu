// 镜头缩放、地图投影、视口尺寸和区域定位。

import { mainlandHeight, nextLand } from "../core/map.js";
import { game } from "../core/state.js";
import { bankLeft, bankOffset, bankStart, entrance } from "../data/catalog.js";
import { $, canvas } from "../dom.js";
import { landMarker } from "./scene.js";
import { closeMapMenu } from "../ui/build-menu.js";
import { renderPanel } from "../ui/panels.js";

function updateCamera() {
  const area = nextLand();
  const visibleWidth = game.W + (area && !area.existing && !area.rows ? 2 : 0);
  const visibleHeight =
    mainlandHeight() + (area?.rows && !area.columns ? 2 : 0);
  const across = game.state.acrossRiver || area?.columns;
  const streetLast = Math.max(game.H - 1, area?.columns ? area.start : 0);
  const streetLeft = 239 + (bankLeft - streetLast) * 25 + bankOffset[0] - 30;
  const left = across
    ? Math.min(-170, streetLeft)
    : 239 - (visibleHeight - 1) * 25 - 25;
  const right = 239 + (visibleWidth - 1) * 25 + 25;
  const bottom = across
    ? Math.max(600, 65 + (streetLast + 19) * 14 + bankOffset[1] + 18)
    : 65 + (visibleWidth + visibleHeight - 2) * 14 + 14;
  game.mapScale = game.closeView
    ? 1.78
    : Math.min(1.13, 430 / (right - left), 340 / (bottom - 45));
  const centerX = game.closeView ? 222 : (left + right) / 2;
  const centerY = game.closeView ? 150 : (45 + bottom) / 2;
  game.mapOffsetX = 240 - centerX * game.mapScale + game.panX;
  game.mapOffsetY = 215 - centerY * game.mapScale + game.panY;
}

function showRidge() {
  game.tab = "";
  game.closeView = false;
  game.panX = game.panY = 0;
  updateCamera();
  $("camera-toggle").textContent = "近景";
  renderPanel();
}

function sizeMap() {
  const r = canvas.getBoundingClientRect(),
    scale = Math.min(r.width / 480, r.height / 430);
  if (!scale) return;
  canvas.width = Math.round(r.width / scale);
  canvas.height = Math.round(r.height / scale);
  game.viewX = (canvas.width - 480) / 2;
  game.viewY = (canvas.height - 430) / 2;
}

const rawPos = (x, y) => [239 + (x - y) * 25, 65 + (x + y) * 14];

function pos(x, y) {
  const [px, py] = rawPos(x, y);
  return y >= bankStart ? [px + bankOffset[0], py + bankOffset[1]] : [px, py];
}

export { pos, rawPos, showRidge, updateCamera };

export function initRenderCamera() {
  updateCamera();
  $("street-camera").onclick = () => {
    const area = nextLand();
    const [x, y] = area?.columns
      ? pos(...landMarker(area))
      : pos(entrance[0] + 2, Math.max(bankStart, game.H - 2));
    closeMapMenu();
    game.tab = "";
    game.closeView = true;
    updateCamera();
    game.panX = (222 - x) * game.mapScale;
    game.panY = (150 - y) * game.mapScale;
    updateCamera();
    $("camera-toggle").textContent = "全景";
    renderPanel();
  };
  $("camera-toggle").onclick = () => {
    game.closeView = !game.closeView;
    game.panX = game.panY = 0;
    updateCamera();
    if (game.kind !== "extend-room") closeMapMenu();
    $("camera-toggle").textContent = game.closeView ? "全景" : "近景";
  };
  new ResizeObserver(sizeMap).observe(canvas);
  sizeMap();
}
