// 共享的可变运行状态，以及旧存档加载和兼容处理。

import { BASE_HEIGHT, BASE_WIDTH, SAVE } from "../data/catalog.js";
import { canvas } from "../dom.js";

// state 是会写入存档的数据；其余字段只用于本次页面的运行状态。
// 所有模块通过此对象更新状态，避免跨模块改写导入绑定或依赖 window 全局变量。
export const game = {};

function fresh() {
  const grid = Array.from({ length: BASE_HEIGHT }, () =>
    Array(BASE_WIDTH).fill(""),
  );
  for (let y = 1; y < BASE_HEIGHT; y++) grid[y][3] = "path";
  for (const [x, y, k] of [
    [2, 4, "room"],
    [4, 4, "room"],
    [4, 2, "bath"],
    [2, 2, "food"],
    [5, 2, "pine"],
    [1, 2, "pond"],
    [2, 5, "lamp"],
  ])
    grid[y][x] = k;
  return { grid, cash: 1250, day: 1, history: [], eastOpen: false };
}

export function initCoreState() {
  game.state = undefined;
  try {
    game.state = JSON.parse(localStorage.getItem(SAVE));
  } catch {}
  if (
    !game.state ||
    !Array.isArray(game.state.grid) ||
    game.state.grid.length < BASE_HEIGHT
  )
    game.state = fresh();
  game.state.eastOpen ??= game.state.grid.some((row) =>
    row.slice(6).some(Boolean),
  );
  game.state.upgrades ??= {};
  game.state.animals ??= {};
  game.state.facilityStyles ??= game.state.roomStyles ?? {};
  delete game.state.roomStyles;
  game.state.roomExtensions ??= {};
  game.W = game.state.grid[0].length;
  game.H = game.state.grid.length;
  game.mode =
    game.state.history[0]?.day === game.state.day ? "closed" : "ready";
  const checkpoint = game.state.businessCheckpoint;
  const resumable =
    game.mode === "ready" &&
    checkpoint?.day === game.state.day &&
    Number.isFinite(checkpoint.clock) &&
    checkpoint.clock >= 0 &&
    checkpoint.run?.guests?.length > 0;
  // 面板与建造状态。
  game.tab = "";
  game.kind = "";
  game.cursor = null;
  game.buildCategory = "all";
  game.clock = resumable ? checkpoint.clock : 0;
  game.run = resumable ? checkpoint.run : null;
  if (resumable) game.mode = "running";
  // 绘图上下文、存档保护与音效。
  game.ctx = canvas.getContext("2d");
  game.replacingSave = false;
  game.buildPreview = null;
  game.volume = 50;
  game.audioContext = undefined;
  // 镜头与画布坐标。
  game.mapScale = 1.78;
  game.mapOffsetX = 0;
  game.mapOffsetY = 0;
  game.closeView = true;
  game.panX = 0;
  game.panY = 0;
  game.viewX = 0;
  game.viewY = 0;
  // 动画、游客和输入状态。
  game.sceneryTime = 0;
  game.last = performance.now();
  game.badgeTick = game.clock;
  game.strolls = [];
  game.drag = null;
  game.suppressClick = false;
}
