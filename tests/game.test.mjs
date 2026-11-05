import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright";
import { createGameServer } from "../scripts/serve.mjs";

const saveKey = "pine-onsen-v01";
const readState = (page) =>
  page.evaluate(() => JSON.parse(window.render_game_to_text()));

test("模块化后的页面、施工、营业和存档回归", async (t) => {
  const server = createGameServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  // Explicitly advance game time instead of relying on machine-dependent frame rates.
  await page.addInitScript(() => {
    window.requestAnimationFrame = () => 0;
  });
  const url = `http://127.0.0.1:${server.address().port}/`;
  await page.goto(url);
  await page.waitForFunction(
    () => typeof window.render_game_to_text === "function",
  );
  await page.evaluate(() => window.advanceTime(0));
  assert.equal((await readState(page)).mode, "ready");
  assert.equal((await readState(page)).cash, 1250);

  await t.test("信息面板、镜头和设置", async () => {
    for (const tab of ["report", "ranking", "celebrities", "environment"]) {
      await page.locator(`[data-tab="${tab}"]`).click();
      assert.equal(await page.locator("#content").isVisible(), true);
      await page.locator("#close-sheet").click();
    }
    await page.locator("#camera-toggle").click();
    assert.equal(await page.locator("#camera-toggle").textContent(), "近景");
    await page.locator("#camera-toggle").click();
    await page.locator("#settings-open").click();
    await page.locator("#volume").fill("0");
    await page.locator("#save-now").click();
    assert.match(
      await page.locator("#settings-status").textContent(),
      /已保存/,
    );
    await page.locator("#help").click();
    assert.equal(await page.locator("#manual").isVisible(), true);
    await page.locator("#close-help").click();
    await page.locator("#settings-close").click();
  });

  await t.test("键盘选地、建造、升级和拆除", async () => {
    await page.locator("#map").focus();
    await page.keyboard.press("ArrowLeft");
    assert.deepEqual((await readState(page)).cursor, [2, 6]);
    await page.locator('[data-kind="room"]').click();
    await page.locator("#map-place").click();
    assert.equal((await readState(page)).grid[6][2], "room");
    assert.equal((await readState(page)).cash, 800);
    await page.locator("#map").focus();
    await page.keyboard.press("ArrowLeft");
    await page.locator("#map-upgrade").click();
    assert.equal((await readState(page)).cash, 530);
    assert.match(await page.locator("#map-menu").textContent(), /2 级/);
    await page.locator("#map-remove").click();
    assert.equal((await readState(page)).grid[6][2], "");
  });

  await t.test("营业检查点刷新续玩、收摊和次日旅行团", async () => {
    await page.locator("#open").click();
    assert.equal((await readState(page)).mode, "running");
    await page.evaluate(() => window.advanceTime(4000));
    const before = JSON.parse(
      await page.evaluate((key) => localStorage.getItem(key), saveKey),
    );
    assert.equal(before.businessCheckpoint.clock, 4000);
    await page.reload();
    await page.waitForFunction(() => typeof window.advanceTime === "function");
    assert.equal((await readState(page)).mode, "running");
    await page.evaluate(() => window.advanceTime(26000));
    const closed = await readState(page);
    assert.equal(closed.mode, "closed");
    assert.equal(closed.lastReport.day, 1);
    assert.ok(closed.lastReport.income > 0);
    await page.locator("#open").click();
    assert.equal((await readState(page)).day, 2);
    assert.equal(await page.locator("#tour-offer").isVisible(), true);
    await page.locator("#accept-tour").click();
    await page.locator("#open").click();
    await page.evaluate(() => window.advanceTime(30000));
    assert.equal((await readState(page)).lastReport.tourGuests, 3);
  });

  await t.test("存档导出、导入和旧字段兼容", async () => {
    await page.locator("#settings-open").click();
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#export-save").click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /第2日\.json$/);
    const data = JSON.parse(
      await page.evaluate((key) => localStorage.getItem(key), saveKey),
    );
    delete data.facilityStyles;
    data.roomStyles = { 34: "sakura" };
    const buffer = Buffer.from(
      JSON.stringify({ format: saveKey, state: data }),
    );
    page.once("dialog", (dialog) => dialog.accept());
    await Promise.all([
      page.waitForEvent("load"),
      page.locator("#save-file").setInputFiles({
        name: "legacy.json",
        mimeType: "application/json",
        buffer,
      }),
    ]);
    await page.waitForFunction(
      () => typeof window.render_game_to_text === "function",
    );
    const migrated = await page.evaluate(async () => {
      const { game } = await import("/src/core/state.js");
      return game.state;
    });
    assert.equal(migrated.facilityStyles[34], "sakura");
    assert.equal(Object.hasOwn(migrated, "roomStyles"), false);
    assert.equal((await readState(page)).day, 2);
  });

  await t.test("手机视口与画布", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForCanvasSize(page);
    await page.evaluate(() => window.advanceTime(0));
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      canvas: document.querySelector("canvas").getBoundingClientRect().width,
    }));
    assert.equal(layout.document, layout.viewport);
    assert.equal(layout.canvas, layout.viewport);
    await mkdir("output/tests", { recursive: true });
    await page.screenshot({ path: "output/tests/mobile.png" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForCanvasSize(page);
    await page.evaluate(() => window.advanceTime(0));
    await page.screenshot({ path: "output/tests/desktop.png" });
  });

  assert.deepEqual(errors, []);
});

async function waitForCanvasSize(page) {
  // ResizeObserver clears the canvas when it changes the backing dimensions.
  // With requestAnimationFrame disabled, draw only after that resize has completed.
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(bounds.width / 480, bounds.height / 430);
    return (
      canvas.width === Math.round(bounds.width / scale) &&
      canvas.height === Math.round(bounds.height / scale)
    );
  });
}
