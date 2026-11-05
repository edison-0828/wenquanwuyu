// 像素绘图基础图元；画布上下文从 game.ctx 获取。

import { game } from "../core/state.js";

function rect(x, y, w, h, color) {
  game.ctx.fillStyle = color;
  game.ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function poly(points, color) {
  game.ctx.fillStyle = color;
  game.ctx.beginPath();
  points.forEach(([x, y], i) =>
    i ? game.ctx.lineTo(x, y) : game.ctx.moveTo(x, y),
  );
  game.ctx.closePath();
  game.ctx.fill();
}

function diamond(x, y, w, h, color) {
  poly(
    [
      [x, y - h],
      [x + w, y],
      [x, y + h],
      [x - w, y],
    ],
    color,
  );
}

export { diamond, poly, rect };
