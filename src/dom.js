// 页面元素入口；模块加载时页面结构已经就绪。

const $ = (id) => document.getElementById(id);

const canvas = $("map");

export { $, canvas };
