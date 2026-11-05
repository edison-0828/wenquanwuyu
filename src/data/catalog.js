// 设施、升级、地图扩建、旅客与经营数值配置。

const BASE_WIDTH = 8,
  BASE_HEIGHT = 7,
  entrance = [3, 6],
  SAVE = "pine-onsen-v01";

const items = {
  path: { name: "石板路", cost: 35, keep: 0, detail: "连接入口和设施。" },
  gate: {
    name: "通行牌坊",
    cost: 420,
    keep: 6,
    detail: "跨在路上的日式牌坊。游客可从门下经过，每级增加 15 点环境评分。",
  },
  water: {
    name: "水路",
    cost: 140,
    keep: 2,
    detail:
      "相邻水路会连成池塘，每格环境 +2。建好后可点水面放养鱼类，游客走陆路。",
  },
  cobble: {
    name: "鹅卵石路",
    cost: 45,
    keep: 0,
    detail: "圆石庭园小径，可与其他道路相连。",
  },
  boardwalk: {
    name: "木栈道",
    cost: 55,
    keep: 0,
    detail: "暖色木板步道，可与其他道路相连。",
  },
  room: {
    name: "榻榻米客房",
    cost: 450,
    keep: 35,
    detail: "每日接待 2 位客人，住宿收入 145／人。",
  },
  machiya: {
    name: "暖木町家",
    cost: 820,
    keep: 58,
    detail: "木格窗与长雨檐的町家。一级接待 3 人，住宿 170 文／人。",
  },
  kura: {
    name: "白壁藏宿",
    cost: 1650,
    keep: 95,
    detail: "白墙、石基和黛瓦的藏造客宿。一级接待 4 人，住宿 220 文／人。",
  },
  towerInn: {
    name: "月见楼",
    cost: 3200,
    keep: 175,
    detail: "双层青瓦旅馆。一级接待 6 人，住宿 270 文／人。",
  },
  bath: {
    name: "露天温泉",
    cost: 680,
    keep: 50,
    detail: "每日可供 4 位客人泡汤，收入 75／人。旁边种松更舒适。",
  },
  food: {
    name: "山味餐室",
    cost: 380,
    keep: 30,
    detail: "每日供应 3 份晚饭，收入 55／份。",
  },
  shop: {
    name: "土产铺",
    cost: 310,
    keep: 20,
    detail: "每日可服务 4 位客人，收入 35／人。",
  },
  gifts: {
    name: "纪念品商店",
    cost: 780,
    keep: 35,
    detail: "接通石板路后，客人会来买旅行纪念品。一级每日接待 4 人。",
  },
  cinema: {
    name: "山间小影院",
    cost: 1200,
    keep: 65,
    detail: "接通石板路后，客人可以在泡汤之余看电影。一级每日接待 5 人。",
  },
  dango: {
    name: "炭火团子屋",
    cost: 950,
    keep: 45,
    detail: "烤团子小摊。接通道路后，普通客消费 45 文。",
  },
  teaHouse: {
    name: "抹茶茶寮",
    cost: 1600,
    keep: 70,
    detail: "招待散步游客喝茶。接通道路后，普通客消费 80 文。",
  },
  arcade: {
    name: "祭典游艺馆",
    cost: 2400,
    keep: 110,
    detail: "射靶和套圈摊。接通道路后，普通客消费 115 文。",
  },
  stage: {
    name: "和风戏台",
    cost: 12000,
    keep: 420,
    detail: "游客可沿路来观看演出，普通客消费 220 文。",
  },
  buffet: {
    name: "灯火夜市",
    cost: 8500,
    keep: 300,
    detail: "挂着灯笼的夜间食集，普通客消费 165 文。",
  },
  moonGarden: {
    name: "月映水庭",
    cost: 18000,
    keep: 180,
    detail: "月门与水面组成的庭园地标，每级环境 +55。",
  },
  pavilion: {
    name: "花见休憩亭",
    cost: 1200,
    keep: 16,
    detail: "带长椅的赏花亭，每级增加 20 点环境评分。",
  },
  pine: {
    name: "庭园松",
    cost: 100,
    keep: 3,
    detail: "与温泉上下左右相邻时，提高泡汤体验。",
  },
  lamp: {
    name: "石灯笼",
    cost: 80,
    keep: 2,
    detail: "与客房上下左右相邻时，提高住宿体验。",
  },
  pond: {
    name: "锦鲤池",
    cost: 155,
    keep: 4,
    detail: "与餐室上下左右相邻时，提高用餐体验。",
  },
  cherry: {
    name: "樱花树",
    cost: 240,
    keep: 5,
    detail: "每级增加 9 点环境评分。",
  },
  torii: {
    name: "朱红鸟居",
    cost: 360,
    keep: 6,
    detail: "每级增加 11 点环境评分。",
  },
  pagoda: {
    name: "庭园石塔",
    cost: 520,
    keep: 8,
    detail: "每级增加 14 点环境评分。",
  },
};

const roadTypes = ["path", "cobble", "boardwalk", "gate"];

const isRoad = (type) => roadTypes.includes(type);

const facilityStyles = {
  original: { name: "松间原木" },
  sakura: {
    name: "樱坂朱瓦",
    wall: "#efc6ae",
    shade: "#c09582",
    roof: "#a85f67",
    light: "#d59290",
    cloth: "#994d62",
  },
  moon: {
    name: "月见黛瓦",
    wall: "#e3dcca",
    shade: "#aaa8a3",
    roof: "#4c657e",
    light: "#839bb0",
    cloth: "#475d7b",
  },
};

const facadeCost = 120;

const streetServices = {
  dango: { fee: 45, comment: "刚烤好的团子真香。" },
  teaHouse: { fee: 80, comment: "坐下来喝杯抹茶，歇歇脚。" },
  arcade: { fee: 115, comment: "在游艺馆赢了个小奖品！" },
  buffet: { fee: 165, comment: "夜市灯笼亮起来的时候，真想再逛一圈。" },
  stage: { fee: 220, comment: "今晚戏台的演出很精彩。" },
};

const animals = {
  koi: {
    name: "红白锦鲤",
    cost: 280,
    score: 12,
    color: "#e79a70",
    accent: "#fff2cb",
    hosts: ["water", "pond"],
  },
  goldfish: {
    name: "金鱼",
    cost: 180,
    score: 8,
    color: "#efbe63",
    accent: "#ffdfa0",
    hosts: ["water", "pond"],
  },
  sparrow: {
    name: "山雀",
    cost: 160,
    score: 7,
    color: "#8b7f5e",
    accent: "#f0d7a3",
    hosts: ["pine", "cherry"],
  },
  whiteEye: {
    name: "绣眼鸟",
    cost: 320,
    score: 14,
    color: "#8eaa66",
    accent: "#f9e8b1",
    hosts: ["pine", "cherry"],
  },
};

const lodgingRates = { room: 145, machiya: 170, kura: 220, towerInn: 270 };

const isLodging = (type) => Object.hasOwn(lodgingRates, type);

const buildCategories = [
  { id: "all", name: "全部", items: Object.keys(items) },
  { id: "roads", name: "道路", items: [...roadTypes, "water"] },
  { id: "lodging", name: "住宿", items: Object.keys(lodgingRates) },
  {
    id: "services",
    name: "服务",
    items: ["bath", "food", "shop", "gifts", "cinema"],
  },
  {
    id: "street",
    name: "温泉街",
    items: [...Object.keys(streetServices), "gifts", "cinema", "pavilion"],
  },
  {
    id: "garden",
    name: "庭园",
    items: [
      "pine",
      "lamp",
      "pond",
      "cherry",
      "torii",
      "pagoda",
      "pavilion",
      "moonGarden",
      "gate",
    ],
  },
  { id: "animals", name: "动物", items: [] },
];

const landSales = [
  {
    id: "eastOpen",
    name: "东坡庭园",
    width: 2,
    cost: 900,
    environment: 40,
    existing: true,
  },
  { id: "ridgeOpen", name: "松岭外坡", width: 3, cost: 3000 },
  { id: "sakura", name: "樱坂庭园", width: 4, cost: 10500 },
  { id: "moon", name: "月见高台", width: 5, cost: 21500 },
  { id: "riverside", name: "河畔温泉街", rows: 3, cost: 34000 },
  { id: "southGarden", name: "南谷花见苑", rows: 3, cost: 52000 },
  {
    id: "acrossRiver",
    name: "桥头商街 · 一期",
    start: 13,
    rows: 3,
    columns: 8,
    cost: 78000,
  },
  {
    id: "riverMarket",
    name: "樱灯市集 · 二期",
    start: 16,
    rows: 4,
    columns: 10,
    cost: 105000,
  },
  {
    id: "riverTheater",
    name: "松影广场 · 三期",
    start: 20,
    rows: 4,
    columns: 12,
    cost: 140000,
  },
  {
    id: "riverRetreat",
    name: "月隐长街 · 四期",
    start: 24,
    rows: 4,
    columns: 14,
    cost: 185000,
  },
  {
    id: "riverEast",
    name: "东岸花廊",
    start: 28,
    columns: 19,
    infill: true,
    cost: 235000,
  },
  {
    id: "riverPines",
    name: "松风町",
    start: 28,
    rows: 6,
    columns: 19,
    cost: 305000,
  },
  {
    id: "riverMoon",
    name: "月湾别苑",
    start: 34,
    rows: 6,
    columns: 19,
    cost: 390000,
  },
];

const bankStart = 13,
  bankLeft = 1,
  bankOffset = [-65, 155];

const bankDistricts = landSales.filter((area) => area.columns && area.rows);

const guestTypes = {
  bath: { name: "泡汤客" },
  food: { name: "尝鲜客" },
  garden: { name: "赏景客（稀有）" },
  group: { name: "旅行团客" },
  celebrity: { name: "地方名人" },
};

const capacityByType = {
  room: [2, 3, 4, 5, 6, 8],
  machiya: [3, 4, 5, 6, 8, 10],
  kura: [4, 5, 7, 9, 11, 13],
  towerInn: [6, 8, 10, 12, 15, 18],
  bath: [4, 6, 8, 10, 12, 15],
  food: [3, 5, 7, 9, 11, 14],
  shop: [4, 6, 8, 10, 12, 15],
  gifts: [4, 6, 8, 10, 13, 16],
  cinema: [5, 7, 10, 13, 16, 20],
  dango: [5, 7, 9, 12, 15, 18],
  teaHouse: [4, 6, 8, 11, 14, 18],
  arcade: [5, 8, 11, 14, 18, 22],
  buffet: [12, 16, 20, 24, 30, 36],
  stage: [10, 14, 19, 24, 30, 38],
};

const tierNames = ["初建", "整修", "雅致", "精品", "名物", "地标"];

const tierColors = [
  "#c49d68",
  "#bf905c",
  "#668f83",
  "#7286a5",
  "#a67385",
  "#ca9a53",
];

const sceneryPoints = {
  pine: 5,
  lamp: 4,
  pond: 6,
  cherry: 9,
  torii: 11,
  pagoda: 14,
  pavilion: 20,
  moonGarden: 55,
  gate: 15,
};

const tierDetails = {
  stage: [
    "红帘戏台",
    "挂灯戏台",
    "绯檐剧场",
    "双层戏馆",
    "围廊戏馆",
    "金脊大剧场",
  ],
  buffet: [
    "纸灯夜市",
    "双灯食集",
    "赤瓦食街",
    "双层食楼",
    "围廊夜市",
    "金脊夜市",
  ],
  moonGarden: [
    "映月池",
    "石岸月池",
    "双灯月池",
    "水上月门",
    "花影月庭",
    "金月水庭",
  ],
  machiya: [
    "长檐木屋",
    "格栅町家",
    "红帘町家",
    "双层町家",
    "围廊町家",
    "金脊町家",
  ],
  kura: [
    "石基白藏",
    "双窗白藏",
    "灰檐藏宿",
    "双层藏宿",
    "围廊藏宿",
    "金脊白藏",
  ],
  towerInn: [
    "双层月见楼",
    "灯前月见楼",
    "青瓦双檐楼",
    "三层月见楼",
    "围廊月见楼",
    "金脊月见楼",
  ],
  gate: [
    "朱柱牌坊",
    "青檐牌坊",
    "双檐牌坊",
    "挂灯牌坊",
    "金边牌坊",
    "金额大牌坊",
  ],
  dango: [
    "炭火摊车",
    "布棚摊车",
    "双炉团子摊",
    "招牌团子铺",
    "双棚团子铺",
    "金檐团子亭",
  ],
  teaHouse: [
    "露天茶席",
    "纸伞茶席",
    "竹帘茶亭",
    "围廊茶寮",
    "双席花见寮",
    "金檐茶庭",
  ],
  arcade: [
    "套圈木摊",
    "挂旗游艺摊",
    "奖品游艺摊",
    "双棚游艺摊",
    "花灯游艺馆",
    "金檐祭典摊",
  ],
  pavilion: [
    "木檐赏花亭",
    "青檐赏花亭",
    "灯前花见亭",
    "双檐花见亭",
    "樱前双檐亭",
    "金檐花见亭",
  ],
  gifts: [
    "橱窗纪念品店",
    "招牌礼品店",
    "展台礼品店",
    "挂灯礼品店",
    "双檐礼品馆",
    "金脊纪念品馆",
  ],
  cinema: [
    "山间放映屋",
    "灯牌放映屋",
    "暖灯小影院",
    "双层影院",
    "围廊影院",
    "金脊剧场",
  ],
  cherry: ["初绽樱", "繁花樱", "叠石樱庭", "双樱庭", "灯下双樱", "金绳花见庭"],
  torii: [
    "朱红鸟居",
    "双柱朱门",
    "注连绳鸟居",
    "灯前鸟居",
    "叠檐鸟居",
    "金额大鸟居",
  ],
  pagoda: [
    "一重石塔",
    "二重石塔",
    "三重石塔",
    "四重石塔",
    "五重石塔",
    "金相轮五重塔",
  ],
  pine: [
    "庭园小松",
    "双枝山松",
    "叠石山松",
    "盘枝古松",
    "围石名松",
    "金绳迎客松",
  ],
  lamp: [
    "单盏石灯",
    "青瓦石灯",
    "双层石灯",
    "立柱灯塔",
    "朱漆三层灯",
    "金檐庭园灯",
  ],
  pond: [
    "一尾锦鲤",
    "双鲤石池",
    "荷叶锦池",
    "三鲤莲池",
    "朱桥锦池",
    "金桥锦池",
  ],
  room: [
    "一层木屋",
    "带雨檐的木屋",
    "青瓦格窗旅舍",
    "双层和风旅舍",
    "双层围廊旅舍",
    "三层金脊旅舍",
  ],
  bath: [
    "山石汤池",
    "竹栏围屏",
    "双灯石沿",
    "木亭遮檐",
    "绯红挂帘",
    "金顶汤亭",
  ],
  food: [
    "一层食堂",
    "挂布帘的食堂",
    "赤瓦格窗食堂",
    "双层料理屋",
    "双层围廊料理屋",
    "三层金脊料理楼",
  ],
  shop: [
    "货筐土产铺",
    "带檐土产铺",
    "陈列土产铺",
    "木牌土产铺",
    "双棚土产铺",
    "金脊土产铺",
  ],
};

const upgradeRates = [60, 85, 135, 190, 260];

const roomExpansion = { cost: 320, keep: 18, capacity: 2 };

const sceneryCombos = { room: 5, bath: 6, food: 4 };

const rareEnvironment = 150,
  celebrityEnvironment = 500,
  rareGuestLimit = 2,
  overlapChance = 0.05;

const businessDuration = 30000;

const celebrityBook = [
  {
    id: "scribe",
    name: "青木先生",
    role: "乡里教书先生",
    wish: "泡上温泉并吃到晚饭",
    happy: ({ bath, food }) => Boolean(bath && food),
  },
  {
    id: "painter",
    name: "水野春",
    role: "山水画师",
    wish: "泡上温泉，环境达到 2000 分",
    happy: ({ bath, outlook }) => Boolean(bath && outlook.score >= 2000),
  },
  {
    id: "merchant",
    name: "藤原绫",
    role: "商街会长",
    wish: "泡上温泉并买到纪念品",
    happy: ({ bath, gifts }) => Boolean(bath && gifts),
  },
  {
    id: "performer",
    name: "松本响",
    role: "祭典鼓师",
    wish: "泡上温泉并看一场戏",
    happy: ({ bath, stage }) => Boolean(bath && stage),
  },
];

const celebrityChance = 0.18;

const weatherTypes = {
  sun: { name: "晴天", visitors: 2 },
  rain: { name: "雨天", visitors: -2 },
  mist: { name: "山雾", visitors: -1 },
};

const monthLength = 30;

const rivalInns = [
  ["白石汤屋", 1400, 25, 58],
  ["青枫旅舍", 3000, 45, 63],
  ["竹影客舍", 6500, 80, 68],
  ["桐川温泉馆", 12000, 125, 72],
  ["樱岛御宿", 22000, 195, 77],
  ["流泉山庄", 37000, 280, 81],
  ["月桥汤庭", 58000, 390, 85],
  ["鹤鸣温泉乡", 85000, 530, 89],
  ["雪峰大旅馆", 120000, 700, 93],
].map(([name, income, environment, satisfaction]) => ({
  name,
  income,
  environment,
  satisfaction,
}));

const legacyReturnRates = [0.6, 0.48, 0.36, 0.25, 0.15, 0.05];

const rankingReturnRates = [
  0.6, 0.53, 0.46, 0.39, 0.32, 0.26, 0.2, 0.15, 0.1, 0.05,
];

const guestWalkSpeed = 52;

const tour = { size: 3, multiplier: 2, duration: 20000 };

const travelerStyles = {
  bath: {
    hair: "#352a28",
    shine: "#6b4840",
    coat: "#578dba",
    trim: "#a4d5e4",
    skin: "#f1bf93",
  },
  food: {
    hair: "#563630",
    shine: "#925c44",
    coat: "#c55b64",
    trim: "#ffc3ad",
    skin: "#f4c9a2",
  },
  group: {
    hair: "#392b30",
    shine: "#805449",
    coat: "#806eb0",
    trim: "#f3c6a0",
    skin: "#eec098",
  },
  garden: {
    hair: "#38302f",
    shine: "#745744",
    coat: "#a47a43",
    trim: "#ffe395",
    skin: "#dca57c",
  },
  celebrity: {
    hair: "#423334",
    shine: "#9b705c",
    coat: "#ad6450",
    trim: "#f4d695",
    skin: "#efc8a5",
  },
  staff: {
    hair: "#43362c",
    shine: "#70543f",
    coat: "#5b8b70",
    trim: "#f3e7bd",
    skin: "#ecc198",
  },
};

export {
  BASE_HEIGHT,
  BASE_WIDTH,
  SAVE,
  animals,
  bankDistricts,
  bankLeft,
  bankOffset,
  bankStart,
  buildCategories,
  businessDuration,
  capacityByType,
  celebrityBook,
  celebrityChance,
  celebrityEnvironment,
  entrance,
  facadeCost,
  facilityStyles,
  guestTypes,
  guestWalkSpeed,
  isLodging,
  isRoad,
  items,
  landSales,
  legacyReturnRates,
  lodgingRates,
  monthLength,
  overlapChance,
  rankingReturnRates,
  rareEnvironment,
  rareGuestLimit,
  rivalInns,
  roadTypes,
  roomExpansion,
  sceneryCombos,
  sceneryPoints,
  streetServices,
  tierColors,
  tierDetails,
  tierNames,
  tour,
  travelerStyles,
  upgradeRates,
  weatherTypes,
};
