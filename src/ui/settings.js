// 设置、音效、存档导入导出和帮助弹窗。

import { game } from "../core/state.js";
import { save } from "../core/storage.js";
import { BASE_HEIGHT, SAVE, items } from "../data/catalog.js";
import { $ } from "../dom.js";

const volumeKey = SAVE + "-volume";

function playChime() {
  if (game.volume === 0) return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    game.audioContext ??= new Audio();
    game.audioContext.resume().catch(() => {});
    const now = game.audioContext.currentTime;
    for (const [i, hz] of [523.25, 659.25, 783.99].entries()) {
      const start = now + i * 0.055,
        oscillator = game.audioContext.createOscillator(),
        gain = game.audioContext.createGain();
      oscillator.frequency.value = hz;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        (0.12 * game.volume) / 100,
        start + 0.022,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
      oscillator.connect(gain).connect(game.audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.26);
    }
  } catch {}
}

function showVolume() {
  $("volume").value = game.volume;
  $("volume-value").textContent = game.volume + "%";
}

export { playChime };

export function initUiSettings() {
  try {
    const stored = localStorage.getItem(volumeKey);
    if (stored !== null && Number.isFinite(Number(stored)))
      game.volume = Math.max(0, Math.min(100, Number(stored)));
  } catch {}
  $("settings-open").onclick = () => {
    showVolume();
    $("settings-status").textContent = "";
    $("settings").showModal();
  };
  $("settings-close").onclick = () => $("settings").close();
  $("volume").oninput = () => {
    game.volume = Number($("volume").value);
    showVolume();
    try {
      localStorage.setItem(volumeKey, String(game.volume));
    } catch {}
  };
  $("volume").onchange = playChime;
  $("preview-sound").onclick = playChime;
  $("save-now").onclick = () => {
    const saved = save();
    $("settings-status").textContent = saved
      ? "当前进度已保存。"
      : "保存失败，可以先导出备份。";
    if (saved) playChime();
  };
  $("export-save").onclick = () => {
    save();
    const file = new Blob(
      [JSON.stringify({ format: SAVE, state: game.state }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(file),
      link = document.createElement("a");
    link.href = url;
    link.download = "松间温泉-第" + game.state.day + "日.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("settings-status").textContent = "已生成存档备份。";
  };
  $("import-save").onclick = () => $("save-file").click();
  $("save-file").onchange = async (event) => {
    const input = event.currentTarget,
      file = input.files[0];
    input.value = "";
    if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error();
      const backup = JSON.parse(await file.text()),
        data = backup.state;
      const grid = data?.grid;
      if (
        backup.format !== SAVE ||
        !Array.isArray(grid) ||
        grid.length < BASE_HEIGHT ||
        grid.length > 40 ||
        ![8, 11, 15, 20].includes(grid[0]?.length) ||
        !grid.every(
          (row) =>
            Array.isArray(row) &&
            row.length === grid[0].length &&
            row.every((type) => type === "" || Object.hasOwn(items, type)),
        ) ||
        !Number.isInteger(data.day) ||
        data.day < 1 ||
        !Number.isFinite(data.cash) ||
        !Array.isArray(data.history) ||
        JSON.stringify(data).includes("<")
      )
        throw new Error();
      if (
        !window.confirm(
          "导入第 " + data.day + " 日的存档会覆盖当前进度。确定导入？",
        )
      )
        return;
      localStorage.setItem(SAVE, JSON.stringify(data));
      game.replacingSave = true;
      location.reload();
    } catch {
      $("settings-status").textContent = "导入失败，请选择有效的松间温泉存档。";
    }
  };
  $("help").onclick = () => {
    $("settings").close();
    $("manual").showModal();
  };
  $("close-help").onclick = () => {
    $("manual").close();
    $("settings").showModal();
  };
}
