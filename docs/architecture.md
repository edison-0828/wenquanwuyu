# 代码维护说明

游戏采用浏览器原生 ES Modules。`index.html` 加载 `src/main.js`，由入口统一初始化。无需打包器、框架或运行时第三方库；Playwright 只用于开发测试。

## 模块职责

| 模块                   | 负责内容                                                       |
| ---------------------- | -------------------------------------------------------------- |
| `data/catalog.js`      | 设施、建筑外观、升级数值、地块扩建、动物、旅客、天气和排行配置 |
| `core/state.js`        | `game` 运行状态、初始布局、读档与旧字段迁移                    |
| `core/map.js`          | 地块编号、地图边界、道路寻路、设施容量、环境分数               |
| `core/guests.js`       | 天气抽取、名人、回头客、旅行团预约、月度排行                   |
| `core/business.js`     | 游客路线与消费、营业开始、经营成本、收摊结算                   |
| `core/storage.js`      | 自动保存、营业检查点、离开页面时保存                           |
| `ui/build-menu.js`     | 设施菜单和缩略图、建造、升级、换装、动物、扩房与拆除           |
| `ui/panels.js`         | 账簿、图鉴、排行、环境和购地面板，以及营业按钮                 |
| `ui/settings.js`       | 音效、设置、帮助、导入导出存档                                 |
| `ui/feedback.js`       | 数字显示与操作提示                                             |
| `render/camera.js`     | 地图投影、镜头、缩放和画布自适应                               |
| `render/primitives.js` | 矩形、多边形、菱形基础图元                                     |
| `render/buildings.js`  | 建筑与温泉各等级的外观                                         |
| `render/landscape.js`  | 山林、河流、桥梁与背景景物                                     |
| `render/people.js`     | 人物形象、泡汤用餐动作、雨伞与评论气泡                         |
| `render/walkers.js`    | 游客沿路线移动、行走时间与散步行为                             |
| `render/tiles.js`      | 路面、水面、动物和庭园设施                                     |
| `render/scene.js`      | 地图图层合成、建筑排序、游客、天气与选地效果                   |
| `input.js`             | Pointer 事件、拖拽、地图点击和键盘                             |
| `dom.js`               | 元素查询函数 `$` 与主 Canvas 引用                              |
| `main.js`              | 模块初始化、首次渲染、动画与营业时间推进                       |

## 状态与启动顺序

`game` 是集中维护的可变对象。`game.state` 保存长期进度，包括地图、资金、营业日、升级、动物、建筑外观和历史账目。其他字段保存运行状态，例如 `mode`、`clock`、`run`、`cursor`、镜头、画布上下文和拖拽数据。

只有 `game.state` 会序列化。营业时，存档模块把当前 `clock` 和 `run` 写入 `state.businessCheckpoint`，再次打开时由状态模块恢复。存档仍使用 `pine-onsen-v01`，音量仍使用单独的存储键。

入口先执行 `initCoreState()`，再注册旅行团、存档、建造、面板、设置、镜头和输入事件，最后首次渲染并启动 `requestAnimationFrame`。模块之间使用具名导入。现有业务流程仍会调用界面反馈与刷新函数，因此存在双向依赖；事件注册和读档等副作用放进显式的 `init` 函数，避免在依赖模块尚未初始化时触发业务调用。不要在其他模块导入 `main.js`，也不要在模块顶层调用需要游戏状态的业务函数。

`game.ctx` 在生成设施缩略图时临时切换到离屏 Canvas，随后通过 `finally` 恢复。绘图函数应在调用时读取 `game.ctx`，避免缓存旧的上下文引用。

## 常见修改入口

- 调整设施价格、容量、升级费用或土地价格：先查看 `data/catalog.js`，计算规则在 `core/map.js` 和 `core/business.js`。
- 新增设施：补齐设施配置、分类和容量或环境规则，在 `render/buildings.js` 或 `render/tiles.js` 添加外观。若有额外消费行为，再补齐营业结算和账簿展示。
- 修改经营规则：从 `core/business.js` 的 `begin()`、`finish()` 开始；天气、旅行团和月榜在 `core/guests.js`。
- 改菜单和按钮：编辑对应 `ui` 模块；改布局和视觉样式：编辑 `styles/game.css`。
- 改地图画面：优先编辑对应绘图模块；只有图层顺序和全局效果需要改 `render/scene.js`。
- 增加存档字段：在 `core/state.js` 为旧存档补默认值，并检查 `ui/settings.js` 的导入校验。不要直接更换存档键或地块编号；坐标与编号转换集中在 `core/map.js`。

## 验证与部署

`npm run check` 对源码、脚本和测试执行语法检查；`npm test` 在 Chromium 中验证页面模块加载与主要交互。测试使用独立浏览器、本地临时端口和临时进度，不读取个人浏览器的存档。测试的 `requestAnimationFrame` 被关闭，通过既有 `window.advanceTime(ms)` 确定性推进营业。

保留 `window.advanceTime` 和 `window.render_game_to_text` 两个测试接口。生产运行中的状态与函数通过模块导入访问，无需再增加全局变量。

静态部署需要同时保留 HTML、CSS 与 `src` 的相对路径，并为 `.js` 文件返回 JavaScript MIME 类型。仍可用 Python 的 HTTP 服务试玩；也提供不依赖第三方库的 `npm start` 本地服务，默认只监听 `127.0.0.1:5191`。Node 服务可通过 `PORT` 环境变量改端口。

保持原站点地址即可继续使用旧的浏览器存档。切换域名或端口后，可在设置中导出再导入进度。
