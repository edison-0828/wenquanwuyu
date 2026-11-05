// 唯一启动入口：初始化各模块并运行动画和营业时钟。

import { finish } from "./core/business.js";
import { initCoreGuests, showTourOffer } from "./core/guests.js";
import { nextLand } from "./core/map.js";
import { game, initCoreState } from "./core/state.js";
import {
  businessBadge,
  initCoreStorage,
  saveBusiness,
} from "./core/storage.js";
import { businessDuration, landSales } from "./data/catalog.js";
import { $ } from "./dom.js";
import { initInput } from "./input.js";
import { initRenderCamera } from "./render/camera.js";
import { draw } from "./render/scene.js";
import { refreshWalkers } from "./render/walkers.js";
import { initUiBuildMenu } from "./ui/build-menu.js";
import { note } from "./ui/feedback.js";
import { initUiPanels, renderPanel } from "./ui/panels.js";
import { initUiSettings } from "./ui/settings.js";

function advance(ms) {
  game.sceneryTime += ms;
  if (game.mode === "running") {
    game.clock += ms;
    if (game.clock >= businessDuration) finish();
    else {
      if (game.clock - game.badgeTick > 160) {
        $("badge").textContent = businessBadge();
        game.badgeTick = game.clock;
      }
      if (game.clock - (game.state.businessCheckpoint?.clock ?? 0) >= 2000)
        saveBusiness();
    }
  }
  draw();
}

function frame(now) {
  advance(Math.max(0, Math.min(70, now - game.last)));
  game.last = now;
  requestAnimationFrame(frame);
}

function initMain() {
  window.advanceTime = (ms) => advance(Math.max(0, ms));
  window.render_game_to_text = () =>
    JSON.stringify({
      mode: game.mode,
      day: game.state.day,
      cash: game.state.cash,
      eastOpen: game.state.eastOpen,
      ridgeOpen: Boolean(game.state.ridgeOpen),
      districts: landSales
        .slice(2)
        .filter((area) => game.state[area.id])
        .map((area) => area.id),
      roomExtensions: game.state.roomExtensions,
      grid: game.state.grid,
      cursor: game.cursor,
      kind: game.kind,
      lastReport: game.state.history[0] || null,
    });
  note(
    game.mode === "running"
      ? "继续营业中。"
      : game.mode === "closed"
        ? "今日账目已保存。可以查看账簿，再准备下一日。"
        : nextLand()
          ? "拖动看旅馆 · 点售地木牌扩建"
          : "拖动看旅馆 · 点地块操作",
  );
  refreshWalkers();
  renderPanel();
  showTourOffer();
  requestAnimationFrame(frame);
}

// 先恢复存档和运行状态，再注册事件与镜头，最后首次渲染并启动动画。
// 模块顶层只声明函数/配置；浏览器副作用统一由这些 init 函数执行。
initCoreState();
initCoreGuests();
initCoreStorage();
initUiBuildMenu();
initUiPanels();
initUiSettings();
initRenderCamera();
initInput();
initMain();
