export interface TransportLeg {
  type: 'flight' | 'ferry';
  date: string;
  company: string;
  flightNo: string;
  departure: string;
  departureTime: string;
  arrival: string;
  arrivalTime: string;
  price?: string;
  status: 'booked' | 'not-picked-up';
  tips?: string[];
}

export interface Stay {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  status: string;
  notes: string[];
  location: 'kinmen' | 'xiamen';
}

export interface TimelineItem {
  time: string;
  label: string;
  detail?: string;
  highlight?: boolean;
}

export interface DayPlan {
  date: string;
  title: string;
  subtitle: string;
  sections: {
    heading?: string;
    items?: string[];
    timeline?: TimelineItem[];
    tips?: string[];
    alert?: string;
  }[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
}

export interface ChecklistCategory {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Place {
  name: string;
  category: string;
  description: string;
  tips: string;
}

export interface MassagePlan {
  name: string;
  location: string;
  budget: string;
  duration: string;
  options: string[];
  tips: string[];
}

export interface SimTask {
  id: string;
  title: string;
  description: string;
  script?: string;
  steps?: string[];
  tips?: string[];
}

// ----- TRANSPORT -----
export const transportLegs: TransportLeg[] = [
  {
    type: 'flight',
    date: '2026-07-08',
    company: '立榮航空',
    flightNo: 'B7-8927',
    departure: '高雄小港機場',
    departureTime: '17:25',
    arrival: '金門尚義機場',
    arrivalTime: '18:30',
    status: 'booked',
    tips: ['建議 16:00 前抵達小港機場', '國內線報到 + 安檢約 30 分鐘'],
  },
  {
    type: 'ferry',
    date: '2026-07-09',
    company: '新東方',
    flightNo: 'BR4007',
    departure: '金門水頭碼頭',
    departureTime: '09:00',
    arrival: '廈門五通碼頭',
    arrivalTime: '09:30',
    price: 'NT$810',
    status: 'not-picked-up',
    tips: ['08:20 前抵達水頭碼頭', '07:45 從家之形民宿出發', '攜帶台胞證與船票取票資訊'],
  },
  {
    type: 'ferry',
    date: '2026-07-14',
    company: '新東方',
    flightNo: 'AR4007A',
    departure: '廈門五通碼頭',
    departureTime: '17:00',
    arrival: '金門水頭碼頭',
    arrivalTime: '17:30',
    price: 'NT$780',
    status: 'not-picked-up',
    tips: ['15:30 前抵達五通碼頭', '14:30 從廈門飯店市區出發', '攜帶台胞證與船票取票資訊'],
  },
  {
    type: 'flight',
    date: '2026-07-15',
    company: '立榮航空',
    flightNo: 'B7-8982',
    departure: '金門尚義機場',
    departureTime: '11:30',
    arrival: '台南機場',
    arrivalTime: '12:25',
    status: 'booked',
    tips: ['建議 10:00 前抵達金門尚義機場', '國內線報到 + 安檢約 30 分鐘'],
  },
];

// ----- STAYS -----
export const stays: Stay[] = [
  {
    name: '家之形民宿',
    address: '金門縣金城鎮和平新村80號',
    checkIn: '2026-07-08',
    checkOut: '2026-07-09',
    roomType: '雙人房，共用衛浴',
    status: '已訂',
    location: 'kinmen',
    notes: ['不可退訂', '房費現場付', '詢問民宿是否可協助叫車去水頭碼頭'],
  },
];

// ----- DAILY ITINERARY -----
export const itinerary: DayPlan[] = [
  {
    date: '7/8 (三)',
    title: '高雄 → 金門',
    subtitle: '入住家之形民宿',
    sections: [
      {
        timeline: [
          { time: '16:00', label: '抵達小港機場', highlight: true },
          { time: '17:25', label: '立榮 B7-8927 起飛' },
          { time: '18:30', label: '抵達金門尚義機場' },
          { time: '19:00', label: '前往家之形民宿辦理入住' },
        ],
      },
      {
        heading: '提醒',
        items: [
          '不排太遠金門景點',
          '晚上整理證件與船票',
          '設鬧鐘 06:50、07:10',
          '早點休息',
        ],
      },
    ],
  },
  {
    date: '7/9 (四)',
    title: '金門 → 廈門',
    subtitle: '小三通 + 辦卡 + 銀行',
    sections: [
      {
        heading: '上午時間線',
        timeline: [
          { time: '06:50', label: '起床', highlight: true },
          { time: '07:10–07:30', label: '整理行李、確認證件' },
          { time: '07:30–07:45', label: '退房' },
          { time: '07:45', label: '從家之形民宿出發', highlight: true },
          { time: '08:10–08:20', label: '抵達水頭碼頭' },
          { time: '08:20–08:45', label: '取票、報到、出境' },
          { time: '09:00', label: '金門 → 五通開船' },
          { time: '09:30', label: '抵達廈門五通', highlight: true },
        ],
      },
      {
        heading: '抵達廈門後',
        timeline: [
          { time: '09:30–10:15', label: '入境、出碼頭' },
          { time: '10:15–11:30', label: '辦手機卡或確認網路' },
          { time: '11:30–12:30', label: '午餐' },
          { time: '12:30–14:00', label: '補辦銀行/支付寶/微信' },
          { time: '14:00–15:00', label: '前往飯店寄放行李或入住' },
          { time: '晚上', label: '五緣灣/湖里區吃飯、買日用品' },
        ],
      },
      {
        heading: '重要任務',
        items: [
          '辦中國聯通手機卡',
          '詢問低月租保號套餐',
          '綁定支付寶與微信',
          '測試收簡訊',
          '下載高德地圖、滴滴、大眾點評',
        ],
      },
    ],
  },
  {
    date: '7/10 (五)',
    title: '輕鬆逛街日',
    subtitle: '五緣灣 / SM / 萬象城',
    sections: [
      {
        items: [
          '五緣灣散步、拍照',
          'SM 城市廣場逛街',
          '萬象城美食',
          '不排太趕，輕鬆為主',
        ],
      },
    ],
  },
  {
    date: '7/11 (六)',
    title: '廈門經典景點',
    subtitle: '南普陀 / 沙坡尾 / 中山路',
    sections: [
      {
        items: [
          '上午：南普陀寺參拜、拍照',
          '中午：沙坡尾文創區、咖啡廳',
          '下午：中山路步行街、伴手禮逛逛',
        ],
      },
    ],
  },
  {
    date: '7/12 (日)',
    title: '海邊放鬆日',
    subtitle: '環島路 / 黃厝沙灘 / 海邊咖啡',
    sections: [
      {
        items: [
          '環島路騎行或散步',
          '黃厝沙灘曬太陽、玩水',
          '海邊咖啡廳放鬆',
          '拍照收集素材',
        ],
      },
    ],
  },
  {
    date: '7/13 (一)',
    title: '伴手禮 + 按摩',
    subtitle: '採購 + 手佳健康會所',
    sections: [
      {
        heading: '伴手禮採購',
        items: [
          '上午逛市場或特產店',
          '買茶葉、糕餅、乾貨等',
        ],
      },
      {
        heading: '手佳按摩',
        items: [
          '手佳健康會所・松柏港龍店',
          '預算：每人 RMB 300–450',
          '套餐：80–100 分鐘全身/香薰/油壓按摩',
          '含洗澡、餐飲/自助餐、休息區',
          '按摩完回飯店睡，不要直接當住宿',
        ],
        alert: '建議提前預約',
      },
    ],
  },
  {
    date: '7/14 (二)',
    title: '廈門 → 金門',
    subtitle: '回程搭船',
    sections: [
      {
        heading: '上午',
        items: [
          '不排鼓浪嶼',
          '不排遠景點',
          '10:00–12:00 輕鬆買伴手禮',
        ],
      },
      {
        heading: '下午時間線',
        timeline: [
          { time: '13:00–14:00', label: '回飯店拿行李' },
          { time: '14:30', label: '從飯店出發去五通碼頭', highlight: true },
          { time: '15:30', label: '前抵達五通碼頭', highlight: true },
          { time: '16:00', label: '取票/出境/候船' },
          { time: '17:00', label: '開船' },
          { time: '17:30', label: '抵達金門水頭碼頭' },
        ],
      },
      {
        alert: '注意：15:30 前務必抵達五通碼頭！',
      },
    ],
  },
  {
    date: '7/15 (三)',
    title: '金門 → 台南',
    subtitle: '回家',
    sections: [
      {
        timeline: [
          { time: '10:00', label: '抵達金門尚義機場' },
          { time: '11:30', label: '立榮 B7-8982 起飛' },
          { time: '12:25', label: '抵達台南機場' },
        ],
      },
    ],
  },
];

// ----- CHECKLISTS -----
export const checklists: ChecklistCategory[] = [
  {
    id: 'pre-trip',
    title: '出發前準備',
    items: [
      { id: 'pre-1', label: '台胞證', detail: '確認有效期，隨身攜帶' },
      { id: 'pre-2', label: '船票截圖', detail: '存手機相簿與離線截圖' },
      { id: 'pre-3', label: '機票截圖', detail: '高雄→金門、金門→台南' },
      { id: 'pre-4', label: '家之形民宿訂房截圖' },
      { id: 'pre-5', label: '台灣門號開通國際漫遊', detail: '僅收簡訊用' },
      { id: 'pre-6', label: '購買中國大陸 eSIM/流量卡', detail: '7–10 天，支援 LINE/Google/熱點' },
      { id: 'pre-7', label: '行動電源', detail: '充滿電 + 充電線' },
      { id: 'pre-8', label: '充電器 + 轉接頭' },
      { id: 'pre-9', label: '現金', detail: '人民幣 + 台幣' },
      { id: 'pre-10', label: '支付工具', detail: '信用卡、金融卡' },
      { id: 'pre-11', label: '雨具', detail: '折疊傘或輕便雨衣' },
      { id: 'pre-12', label: '輕便衣物', detail: '7–8 天份，含防曬' },
    ],
  },
  {
    id: 'evening-0708',
    title: '7/8 晚上確認',
    items: [
      { id: 'eve-1', label: '確認隔天去水頭碼頭交通' },
      { id: 'eve-2', label: '問民宿是否可協助叫車' },
      { id: 'eve-3', label: '設鬧鐘 06:50、07:10' },
      { id: 'eve-4', label: '台胞證放隨身包' },
      { id: 'eve-5', label: '船票取票資訊截圖存相簿' },
      { id: 'eve-6', label: '行李整理好' },
      { id: 'eve-7', label: '行動電源充滿' },
      { id: 'eve-8', label: '早點睡' },
    ],
  },
  {
    id: 'arrival-0709',
    title: '7/9 抵達廈門',
    items: [
      { id: 'arr-1', label: '入境完成' },
      { id: 'arr-2', label: '確認網路可用' },
      { id: 'arr-3', label: '辦中國聯通手機卡' },
      { id: 'arr-4', label: '詢問低月租保號套餐' },
      { id: 'arr-5', label: '測試收簡訊' },
      { id: 'arr-6', label: '測試支付寶/微信支付' },
      { id: 'arr-7', label: '下載/確認高德地圖可用' },
      { id: 'arr-8', label: '下載/確認滴滴可用' },
      { id: 'arr-9', label: '下載/確認大眾點評可用' },
    ],
  },
  {
    id: 'return-0714',
    title: '7/14 回金門',
    items: [
      { id: 'ret-1', label: '不排遠景點' },
      { id: 'ret-2', label: '飯店退房' },
      { id: 'ret-3', label: '拿行李' },
      { id: 'ret-4', label: '14:30 前後出發去五通碼頭' },
      { id: 'ret-5', label: '15:30 前抵達五通碼頭' },
      { id: 'ret-6', label: '取票/出境' },
      { id: 'ret-7', label: '17:00 搭船' },
    ],
  },
];

// ----- PLACES -----
export const places: Place[] = [
  { name: '南普陀寺', category: '景點', description: '廈門著名佛教寺廟，免費入場', tips: '上午去人少，穿著得體' },
  { name: '沙坡尾', category: '文創', description: '文創藝術區，咖啡廳與小店林立', tips: '適合拍照、下午茶' },
  { name: '中山路步行街', category: '購物', description: '廈門最熱鬧的商業街', tips: '伴手禮、小吃多，注意人流' },
  { name: '環島路', category: '景點', description: '沿海景觀道路，適合騎行', tips: '租共享單車或散步' },
  { name: '黃厝沙灘', category: '海灘', description: '廈門知名沙灘，沙質細軟', tips: '帶防曬、拖鞋、毛巾' },
  { name: '五緣灣', category: '景點', description: '新興海灣區，適合散步', tips: '傍晚景色佳' },
  { name: 'SM 城市廣場', category: '購物', description: '大型購物中心', tips: '冷氣足，可躲中午熱' },
  { name: '萬象城', category: '購物', description: '高端購物中心，美食選擇多', tips: '餐飲選擇豐富' },
];

// ----- MASSAGE -----
export const massagePlan: MassagePlan = {
  name: '手佳健康會所・松柏港龍店',
  location: '廈門市松柏',
  budget: '每人 RMB 300–450',
  duration: '80–100 分鐘',
  options: ['全身按摩', '香薰按摩', '油壓按摩'],
  tips: [
    '建議提前一天電話預約',
    '含洗澡設施',
    '含餐飲/自助餐',
    '按摩完可休息，但不要過夜',
    '按摩完回飯店睡',
  ],
};

// ----- SIM & PAYMENT -----
export const simTasks: SimTask[] = [
  {
    id: 'sim-strategy',
    title: '核心策略',
    description: '台灣原門號開國際漫遊，只用來收簡訊，上網用中國大陸 eSIM/流量卡。',
  },
  {
    id: 'taiwan-sim',
    title: '台灣門號',
    description: '出發前開通國際漫遊（僅收簡訊）',
    tips: [
      '用途：台灣銀行 OTP、信用卡驗證、Google/Apple/LINE、Booking/Agoda、緊急電話',
      '不拿來上網，避免高額漫遊費',
    ],
  },
  {
    id: 'esim',
    title: '上網方案',
    description: '出發前購買中國大陸 7–10 天旅遊 eSIM 或流量卡',
    tips: [
      '需支援 LINE / Google / 熱點分享',
      '到廈門後可依需求再辦中國聯通本地門號',
    ],
  },
  {
    id: 'china-unicom',
    title: '中國聯通本地門號',
    description: '目標：低月租保號套餐 RMB 8–19/月',
    script: '你好，我是台灣居民，想辦一張長期保留的大陸手機號，主要用來收銀行、支付寶、微信驗證碼。請問有沒有最低月租的保號套餐？不用太多流量，重點是能長期保號、能在台灣收簡訊。請幫我確認港澳台/國際漫遊功能可以開通，回台灣能收簡訊。',
    tips: [
      '不綁高資費',
      '不綁長約',
      '可回台收簡訊',
      '可開港澳台漫遊',
      '可用支付寶/微信線上充值',
    ],
  },
];

// ----- TRIP DATES -----
export const tripDates = {
  start: '2026-07-08',
  end: '2026-07-15',
  duration: '8 天 7 夜',
};

// ----- NAV SECTIONS -----
export const navSections = [
  { id: 'overview', label: '總覽', icon: '🏠' },
  { id: 'today', label: '今日', icon: '📍' },
  { id: 'transport', label: '交通', icon: '✈️' },
  { id: 'sim', label: '辦卡', icon: '📱' },
  { id: 'checklist', label: '清單', icon: '✅' },
];