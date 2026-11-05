// 本地存档、营业检查点和离开页面时的保存。

import { game } from "./state.js";
import { SAVE, businessDuration, tour } from "../data/catalog.js";

function businessBadge() {
  if (game.run.tour && game.clock < tour.duration)
    return (
      "旅行团到店 · " + Math.ceil((tour.duration - game.clock) / 1000) + " 秒"
    );
  return (
    "营业中 · " + Math.ceil((businessDuration - game.clock) / 1000) + " 秒"
  );
}

function save() {
  if (game.mode === "running")
    game.state.businessCheckpoint = {
      day: game.state.day,
      clock: game.clock,
      run: game.run,
    };
  else delete game.state.businessCheckpoint;
  try {
    localStorage.setItem(SAVE, JSON.stringify(game.state));
    return true;
  } catch {
    return false;
  }
}

function saveBusiness() {
  if (game.mode === "running" && !game.replacingSave) save();
}

export { businessBadge, save, saveBusiness };

export function initCoreStorage() {
  window.addEventListener("pagehide", saveBusiness);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveBusiness();
  });
}
