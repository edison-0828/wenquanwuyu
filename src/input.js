// 地图拖动、点击和键盘输入。

import { inside, key } from "./core/map.js";
import { game } from "./core/state.js";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  bankOffset,
  bankStart,
  entrance,
} from "./data/catalog.js";
import { canvas } from "./dom.js";
import { updateCamera } from "./render/camera.js";
import { closeMapMenu, place, select } from "./ui/build-menu.js";
import { renderPanel } from "./ui/panels.js";

function endDrag(e) {
  if (!game.drag || game.drag.id !== e.pointerId) return;
  game.suppressClick = game.drag.moved;
  game.drag = null;
  canvas.classList.remove("dragging");
}

export function initInput() {
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    game.drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      panX: game.panX,
      panY: game.panY,
      moved: false,
    };
    game.suppressClick = false;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!game.drag || game.drag.id !== e.pointerId) return;
    const dx = e.clientX - game.drag.x,
      dy = e.clientY - game.drag.y;
    if (!game.drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!game.drag.moved) {
      game.drag.moved = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("dragging");
      if (game.kind !== "extend-room") closeMapMenu();
    }
    const r = canvas.getBoundingClientRect();
    const horizontalReach =
      320 + Math.max(0, game.W - BASE_WIDTH) * 25 * game.mapScale;
    game.panX = Math.max(
      -horizontalReach,
      Math.min(
        320 +
          ((game.H - BASE_HEIGHT) * 30 + (game.state.acrossRiver ? 65 : 0)) *
            game.mapScale,
        game.drag.panX + (dx * canvas.width) / r.width,
      ),
    );
    game.panY = Math.max(
      -235 -
        (Math.max(0, game.W - BASE_WIDTH + game.H - BASE_HEIGHT) * 14 +
          (game.state.acrossRiver ? 155 : 0)) *
          game.mapScale,
      Math.min(235, game.drag.panY + (dy * canvas.height) / r.height),
    );
    updateCamera();
  });
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("click", (e) => {
    if (game.suppressClick) {
      game.suppressClick = false;
      return;
    }
    const r = canvas.getBoundingClientRect(),
      a =
        ((((e.clientX - r.left) * canvas.width) / r.width -
          game.viewX -
          game.mapOffsetX) /
          game.mapScale -
          239) /
        25,
      b =
        ((((e.clientY - r.top) * canvas.height) / r.height -
          game.viewY -
          game.mapOffsetY) /
          game.mapScale -
          65) /
        14;
    const x = a * 25 + 239,
      y = b * 14 + 65;
    if (game.state.acrossRiver) {
      const da = (x - bankOffset[0] - 239) / 25,
        db = (y - bankOffset[1] - 65) / 14;
      const bx = Math.round((db + da) / 2),
        by = Math.round((db - da) / 2);
      if (by >= bankStart && inside(bx, by)) {
        select(bx, by);
        return;
      }
    }
    const tx = Math.round((b + a) / 2),
      ty = Math.round((b - a) / 2);
    if (ty < bankStart || game.kind === "extend-room") select(tx, ty);
    else closeMapMenu();
  });
  canvas.addEventListener("keydown", (e) => {
    const d = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[e.key];
    if (d) {
      e.preventDefault();
      const [x, y] = game.cursor || entrance;
      const [dx, dy] = d,
        nx = x + dx,
        ny = y + dy;
      const sameRoom =
        inside(nx, ny) && game.state.roomExtensions[key(nx, ny)] === key(x, y);
      select(sameRoom ? nx + dx : nx, sameRoom ? ny + dy : ny);
    } else if (e.key === "Enter") {
      e.preventDefault();
      place();
    } else if (e.key === "Escape") {
      closeMapMenu();
      game.tab = "";
      renderPanel();
    }
  });
}
