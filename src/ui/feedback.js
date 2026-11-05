// 数字格式与操作提示。

import { $ } from "../dom.js";

const number = (n) => n.toLocaleString("zh-CN");

function note(message) {
  const feedback = $("map-feedback");
  if (feedback && !$("map-menu").hidden) feedback.textContent = message;
  else $("note").textContent = message;
}

export { note, number };
