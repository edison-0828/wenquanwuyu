// 旅客形象、设施活动、撑伞和评论气泡。

import { game } from "../core/state.js";
import { travelerStyles } from "../data/catalog.js";
import { $, canvas } from "../dom.js";
import { diamond, poly, rect } from "./primitives.js";

function drawVisitorActivity(x, y, guest, activity, index) {
  const phase = Math.floor(game.sceneryTime / 260 + index) % 4;
  const { skin, hair, coat, trim } = travelerStyles[guest.type];
  if (activity === "teaHouse" || activity === "food") {
    diamond(x, y + 2, 7, 2, "#3c504940");
    rect(x - 4, y - 1, 8, 2, "#a67955");
    rect(x - 3, y - 4, 6, 4, coat);
    rect(x - 3, y, 2, 3, "#695347");
    rect(x + 2, y, 2, 3, "#695347");
    rect(x - 4, y - 13, 8, 8, hair);
    rect(x - 3, y - 10, 7, 5, skin);
    rect(x, y - 9, 1, 1, "#514239");
    rect(x + 3, y - 9, 1, 1, "#514239");
    rect(x - 4, y - 4, 5, 2, trim);
    const sip = phase === 1 || phase === 2 ? 3 : 0;
    rect(
      x + 3,
      y - 3 - sip,
      3,
      2,
      activity === "teaHouse" ? "#9ab479" : "#e8d8ae",
    );
    rect(x + 2, y - 3 - sip, 1, 1, skin);
    return;
  }
  person(x, y, guest.type, 0, 1, false, index);
  if (activity === "dango") {
    const lift = phase === 1 ? 3 : 0;
    rect(x + 6, y - 8 - lift, 1, 7, "#ad8a62");
    for (let i = 0; i < 3; i++)
      rect(x + 5, y - 8 - lift + i * 2, 3, 2, i === 1 ? "#eddab0" : "#cc9a6a");
  } else if (activity === "shop" || activity === "gifts") {
    rect(x + 5, y - 7, 5, 5, activity === "gifts" ? "#bb7a89" : "#ad9568");
    rect(x + 7, y - 7, 1, 5, "#efda9d");
    rect(x + 6, y - 8, 3, 1, "#725440");
  } else if (activity === "stage" || activity === "arcade") {
    const hands = phase % 2 ? 1 : 0;
    rect(x + 3 + hands, y - 10, 2, 2, skin);
    rect(x + 6 - hands, y - 10, 2, 2, skin);
  }
  if (guest.type === "celebrity") diamond(x, y - 29, 4, 3, "#efd48c");
}

function drawBather(x, y, type, index) {
  const bob = Math.floor(game.sceneryTime / 360 + index) % 2;
  const { skin, hair, shine } = travelerStyles[type];
  diamond(x, y + 1, 4, 2, "#549d94");
  rect(x - 3, y - 3 - bob, 7, 4, skin);
  rect(x - 2, y - 8 - bob, 5, 5, hair);
  rect(x - 1, y - 8 - bob, 3, 1, shine);
  rect(x - 2, y - 5 - bob, 5, 3, skin);
  rect(x + 1, y - 4 - bob, 1, 1, "#51403b");
  rect(x - 1, y - 3 - bob, 1, 1, "#d38b7b");
  if (type === "bath") {
    rect(x - 3, y - 9 - bob, 6, 2, "#f7e8c4");
    rect(x - 2, y - 10 - bob, 4, 1, "#fff7da");
  }
  if (type === "food") rect(x - 2, y - 8 - bob, 1, 2, "#d88486");
  rect(x - 4, y, 9, 1, "#8ad0c0");
  const wave = (Math.floor(game.sceneryTime / 210) + index) % 4;
  rect(x - 4 - wave, y + 2, 3 + wave, 1, "#b1dec9");
  rect(x + 3, y + 3, 2 + wave, 1, "#a2d8c7");
  if (type === "garden") rect(x - 2, y - 9 - bob, 5, 1, "#f6d58b");
}

function drawUmbrella(x, y, type, step, variant) {
  const colors = {
    bath: "#6b8fa4",
    food: "#b77479",
    group: "#877ca4",
    garden: "#c59e63",
    celebrity: "#a56061",
    staff: "#668a70",
  };
  const color = colors[type],
    bob = Math.abs([0, 1, 0, -1][step % 4]);
  const cy = y - 28 - bob;
  rect(x + 2, cy, 1, 15, "#80694e");
  poly(
    [
      [x - 11, cy],
      [x - 8, cy - 5],
      [x - 1, cy - 9],
      [x + 6, cy - 7],
      [x + 11, cy - 2],
      [x + 12, cy + 1],
      [x + 5, cy],
      [x - 1, cy + 2],
      [x - 7, cy + 1],
    ],
    "#544955",
  );
  poly(
    [
      [x - 10, cy - 1],
      [x - 7, cy - 5],
      [x - 1, cy - 8],
      [x + 6, cy - 6],
      [x + 10, cy - 2],
      [x + 5, cy - 1],
      [x - 1, cy + 1],
      [x - 7, cy],
    ],
    color,
  );
  poly(
    [
      [x - 1, cy - 8],
      [x - 5, cy],
      [x - 1, cy + 1],
      [x + 1, cy - 2],
    ],
    "#ffffff38",
  );
  rect(x - 1, cy - 10, 2, 2, "#d9c3a0");
  if (variant % 2 === 0) rect(x + 7, cy + 2, 1, 2, "#cbe1d4");
}

function person(x, y, type, step, facing = 1, back = false, variant = 0) {
  const { hair, shine, coat, trim, skin } = travelerStyles[type];
  const swing = [0, 1, 0, -1][step % 4],
    ink = "#393237";
  diamond(x, y + 1, 7, 2, "#34473840");
  game.ctx.save();
  game.ctx.translate(Math.round(x), Math.round(y));
  game.ctx.scale(facing, 1);
  for (const [leg, phase] of [
    [-4, swing],
    [1, -swing],
  ]) {
    rect(leg, -5 + phase, 3, 5, ink);
    rect(leg, -4 + phase, 1, 2, "#6b5860");
    rect(leg, -1 + phase, 4, 2, "#5c4541");
    rect(leg, phase, 4, 1, "#997763");
  }
  game.ctx.translate(0, -Math.abs(swing));
  rect(-5, -11, 10, 7, ink);
  rect(-4, -11, 8, 6, coat);
  rect(-4, -10, 2, 4, "#fff2d630");
  rect(-4, -6, 8, 1, "#433944");
  if (back) rect(-3, -10, 6, 1, trim);
  else {
    rect(-2, -11, 4, 1, trim);
    rect(-1, -10, 3, 1, trim);
    rect(0, -9, 2, 1, trim);
  }
  rect(-6, -10 - swing, 3, 4, coat);
  rect(4, -10 + swing, 3, 4, coat);
  rect(-6, -8 - swing, 2, 1, trim);
  rect(5, -8 + swing, 2, 1, trim);
  rect(-6, -7 - swing, 2, 2, skin);
  rect(5, -7 + swing, 2, 2, skin);
  rect(-4, -22, 8, 2, ink);
  rect(-6, -20, 12, 9, ink);
  rect(-4, -11, 8, 1, ink);
  rect(-5, -20, 10, 8, hair);
  rect(-3, -21, 6, 2, shine);
  rect(-5, -19, 4, 2, shine);
  if (!back) {
    rect(-3, -17, 8, 5, skin);
    rect(-2, -12, 6, 1, skin);
    rect(-4, -17, 2, 3, hair);
    rect(-2, -18, 4, 1, hair);
    rect(0, -16, 1, 2, ink);
    rect(4, -16, 1, 2, ink);
    rect(-2, -14, 2, 1, "#d99080");
    rect(3, -13, 1, 1, "#ad6b61");
  } else {
    rect(-4, -16, 2, 3, shine);
    rect(2, -14, 2, 2, "#ffffff18");
  }
  if (type === "bath") {
    rect(-5, -7, 4, 4, "#e8d9ab");
    rect(-4, -7, 3, 1, "#fff3ca");
    rect(-5, -4, 4, 1, "#ac986f");
  }
  if (type === "food") {
    rect(-5, -18, 2, 2, variant % 2 ? "#f4c575" : "#e98792");
    rect(5, -6 + swing, 4, 5, "#a76a4b");
    rect(6, -5 + swing, 3, 3, "#dfad71");
    rect(6, -7 + swing, 2, 1, "#f1cb94");
  }
  if (type === "group") {
    rect(-6, -21, 12, 2, "#574a71");
    rect(-4, -23, 8, 2, "#a894c8");
    rect(-4, -21, 8, 1, "#d8c0dc");
    if (back) {
      rect(-3, -10, 6, 5, "#53475e");
      rect(-2, -9, 4, 3, "#a88c78");
    } else rect(2, -9, 2, 2, "#fff0ab");
  }
  if (type === "garden") {
    rect(-6, -21, 12, 2, "#977243");
    rect(-4, -23, 8, 2, "#dec27b");
    rect(-4, -21, 8, 1, trim);
    rect(5, -7 + swing, 3, 5, "#765341");
    rect(6, -7 + swing, 1, 3, "#f1cc83");
  }
  if (type === "celebrity") {
    rect(-5, -20, 2, 3, "#e2b969");
    rect(-5, -19, 1, 1, "#fff0ba");
    rect(3, -10, 1, 4, "#f6d999");
    rect(4, -8, 1, 2, "#e6b763");
  }
  if (type === "staff") {
    rect(-5, -21, 10, 2, trim);
    rect(-4, -22, 8, 1, "#fff0c2");
    if (!back) rect(-3, -8, 5, 3, "#e6d9ad");
  }
  game.ctx.restore();
  if (
    game.state.weather === "rain" &&
    (variant % 3 !== 1 || type === "celebrity")
  )
    drawUmbrella(x, y, type, step, variant);
}

function showGuestBubble(review) {
  const bubble = $("guest-bubble");
  bubble.hidden = !review;
  if (!review) return;
  const { x, y, guest } = review;
  const text = guest.comment;
  if (bubble.textContent !== text) bubble.textContent = text;
  const screenX = game.viewX + game.mapOffsetX + x * game.mapScale;
  const screenY = game.viewY + game.mapOffsetY + (y - 32) * game.mapScale;
  const width = (bubble.offsetWidth * canvas.width) / canvas.clientWidth;
  const center = Math.max(
    width / 2 + 6,
    Math.min(canvas.width - width / 2 - 6, screenX),
  );
  bubble.hidden =
    screenX < 0 ||
    screenX > canvas.width ||
    screenY < 115 ||
    screenY > canvas.height - 100;
  bubble.style.left = (center / canvas.width) * 100 + "%";
  bubble.style.top = (screenY / canvas.height) * 100 + "%";
  bubble.style.setProperty(
    "--tail",
    Math.max(8, Math.min(92, 50 + ((screenX - center) / width) * 100)) + "%",
  );
}

export { drawBather, drawVisitorActivity, person, showGuestBubble };
