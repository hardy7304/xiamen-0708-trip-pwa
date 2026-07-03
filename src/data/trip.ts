export interface MapLinks {
  amap?: string;
  google?: string;
}

export function geoGoogle(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
export function geoAmap(query: string): string {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}`;
}

export interface TransportLeg {
  type: 'flight' | 'ferry';
  date: string;
  dateTime: string; // ISO datetime for countdown calc
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
  status: 'booked' | 'pending' | 'confirmed-by-user';
  notes: string[];
  location: 'kinmen' | 'xiamen';
  suggestion?: string; // suggested area/hotel when pending
  mapLinks?: MapLinks;
}

export interface TimelineItem {
  time: string;
  label: string;
  detail?: string;
  highlight?: boolean;
  mapLinks?: MapLinks;
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
  mapLinks?: MapLinks;
}

export interface MassagePlan {
  name: string;
  location: string;
  budget: string;
  duration: string;
  options: string[];
  tips: string[];
  beforeBooking: string[];
  mapLinks?: MapLinks;
}

export interface SimTask {
  id: string;
  title: string;
  description: string;
  script?: string;
  steps?: string[];
  tips?: string[];
}

export interface CustomItineraryItem {
  id: string;
  date: string; // '7/8 (三)' etc.
  time: string;
  title: string;
  note?: string;
  place?: string;
  mapLinks?: MapLinks;
}

// ----- TRANSPORT -----
export const transportLegs: TransportLeg[] = [
  {
    type: 'flight',
    date: '2026-07-08',
    dateTime: '2026-07-08T17:25:00+08:00',
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
    dateTime: '2026-07-09T09:00:00+08:00',
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
    dateTime: '2026-07-14T17:00:00+08:00',
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
    dateTime: '2026-07-15T11:30:00+08:00',
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
    status: 'booked',
    location: 'kinmen',
    notes: ['不可退訂', '房費現場付', '詢問民宿是否可協助叫車去水頭碼頭'],
    mapLinks: { google: geoGoogle('金門縣金城鎮和平新村80號') },
  },
  {
    name: '7/9 廈門住宿（待訂）',
    address: '建議：五通/五緣灣區域',
    checkIn: '2026-07-09',
    checkOut: '2026-07-10',
    roomType: '雙人房',
    status: 'pending',
    location: 'xiamen',
    suggestion: '佰翔五通酒店、五緣灣凱悅酒店',
    notes: ['抵達廈門第一晚，建議靠近五通碼頭'],
    mapLinks: { amap: geoAmap('佰翔五通酒店') },
  },
  {
    name: '7/10 廈門住宿（待訂）',
    address: '建議：五通/五緣灣區域',
    checkIn: '2026-07-10',
    checkOut: '2026-07-11',
    roomType: '雙人房',
    status: 'pending',
    location: 'xiamen',
    suggestion: '五緣灣周邊民宿或飯店',
    notes: ['輕鬆逛街日：五緣灣/SM/萬象城'],
    mapLinks: { amap: geoAmap('五缘湾酒店') },
  },
  {
    name: '7/11 廈門住宿（待訂）',
    address: '建議：思明區（近景點）',
    checkIn: '2026-07-11',
    checkOut: '2026-07-12',
    roomType: '雙人房',
    status: 'pending',
    location: 'xiamen',
    suggestion: '思明區飯店，近南普陀/沙坡尾/中山路',
    notes: ['經典景點日：南普陀/沙坡尾/中山路'],
    mapLinks: { amap: geoAmap('厦门思明区酒店') },
  },
  {
    name: '7/12 廈門住宿（待訂）',
    address: '建議：環島路/曾厝垵區域',
    checkIn: '2026-07-12',
    checkOut: '2026-07-13',
    roomType: '雙人房',
    status: 'pending',
    location: 'xiamen',
    suggestion: '環島路海景民宿或曾厝垵民宿',
    notes: ['海邊放鬆日：環島路/黃厝沙灘'],
    mapLinks: { amap: geoAmap('厦门环岛路民宿') },
  },
  {
    name: '7/13 廈門住宿（待訂）',
    address: '建議：松柏區域（近按摩）',
    checkIn: '2026-07-13',
    checkOut: '2026-07-14',
    roomType: '雙人房',
    status: 'pending',
    location: 'xiamen',
    suggestion: '松柏區域飯店，近手佳按摩',
    notes: ['伴手禮+按摩日'],
    mapLinks: { amap: geoAmap('厦门松柏酒店') },
  },
  {
    name: '7/14 金門住宿（待訂）',
    address: '建議：金城鎮或金湖鎮',
    checkIn: '2026-07-14',
    checkOut: '2026-07-15',
    roomType: '雙人房',
    status: 'pending',
    location: 'kinmen',
    suggestion: '金城鎮民宿或金湖大飯店',
    notes: ['靠近機場方便 7/15 搭機', '金城鎮有夜市可逛'],
    mapLinks: { google: geoGoogle('金門金城鎮住宿') },
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
          { time: '16:00', label: '抵達小港機場', highlight: true, mapLinks: { google: geoGoogle('高雄小港機場') } },
          { time: '17:25', label: '立榮 B7-8927 起飛' },
          { time: '18:30', label: '抵達金門尚義機場', mapLinks: { google: geoGoogle('金門尚義機場') } },
          { time: '19:00', label: '前往家之形民宿辦理入住', mapLinks: { google: geoGoogle('金門縣金城鎮和平新村80號') } },
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
    subtitle: '小三通入境 + 辦卡 + 安頓',
    sections: [
      {
        heading: '上午時間線',
        timeline: [
          { time: '06:50', label: '起床', highlight: true },
          { time: '07:10–07:30', label: '整理行李、確認證件' },
          { time: '07:30–07:45', label: '退房' },
          { time: '07:45', label: '從家之形民宿出發', highlight: true, mapLinks: { google: geoGoogle('金門縣金城鎮和平新村80號') } },
          { time: '08:10–08:20', label: '抵達水頭碼頭', mapLinks: { google: geoGoogle('金門水頭碼頭') } },
          { time: '08:20–08:45', label: '取票、報到、出境' },
          { time: '09:00', label: '金門 → 五通開船' },
          { time: '09:30', label: '抵達廈門五通', highlight: true, mapLinks: { amap: geoAmap('厦门五通客运码头') } },
        ],
      },
      {
        heading: '抵達廈門後',
        timeline: [
          { time: '09:30–10:15', label: '入境、出碼頭' },
          { time: '10:15–11:30', label: '辦中國聯通手機卡', highlight: true },
          { time: '11:30–12:30', label: '午餐' },
          { time: '12:30–14:00', label: '設定支付寶、微信、高德、滴滴' },
          { time: '14:00–15:00', label: '前往飯店寄放行李或入住' },
          { time: '晚上', label: '五緣灣/湖里區吃飯、買日用品', mapLinks: { amap: geoAmap('五缘湾') } },
        ],
      },
      {
        heading: '📱 手機卡辦理提醒',
        items: [
          '台胞證實名',
          '可長期保留的大陸手機號',
          '可收銀行、支付寶、微信驗證碼',
          '不需要高流量',
          '優先最低月租 / 保號套餐',
        ],
        timeline: [
          { time: '優先 1', label: '中國聯通營業廳', detail: '高德搜尋：中国联通营业厅 五缘湾 / 湖里', highlight: true },
          { time: '優先 2', label: '中國移動營業廳', detail: '高德搜尋：中国移动营业厅 五缘湾 / 湖里' },
          { time: '備選 3', label: '中國電信營業廳', detail: '高德搜尋：中国电信营业厅 湖里' },
        ],
      },
      {
        heading: '💬 櫃台話術',
        alert: '「您好，我是台湾居民，持台胞证。我想办理一张可以长期使用和保留的大陆手机号码，主要用途是接收银行短信、支付宝、微信验证码，以及偶尔上网。我不需要很多流量，请问最低月租是多少？有没有保号套餐、低消套餐，或者之后可以改成最低资费的套餐？」',
      },
      {
        heading: '❓ 必問清單',
        items: [
          '台胞證可否實名辦理？',
          '最低月租多少？',
          '有沒有保號套餐？',
          '可否收銀行、支付寶、微信簡訊？',
          '若先辦高資費，多久後可降套餐？',
          '回台後如何繳費？',
          '欠費多久會停機或銷號？',
        ],
      },
      {
        heading: '重要任務',
        items: [
          '綁定支付寶與微信',
          '測試收簡訊',
          '下載高德地圖、滴滴、大眾點評',
          '銀行辦理移到明天（7/10）',
        ],
      },
    ],
  },
  {
    date: '7/10 (五)',
    title: '銀行辦事 + 湖里商圈',
    subtitle: '帳戶恢復 / 新戶開戶 / SM / 萬象城',
    sections: [
      {
        heading: '上午：銀行辦事 09:00–11:00',
        timeline: [
          { time: '09:00–11:00', label: '銀行辦理：帳戶恢復、新戶開戶', highlight: true },
          { time: '', label: '支付寶/微信綁卡驗證' },
          { time: '', label: '開通手機銀行，ATM 小額提款測試' },
        ],
      },
      {
        heading: '下午：補件 + 逛街',
        timeline: [
          { time: '14:00–16:00', label: '銀行補件或第二間銀行' },
          { time: '15:00 後', label: 'SM 城市廣場逛街美食', mapLinks: { amap: geoAmap('SM城市广场') } },
          { time: '15:00 後', label: '萬象城逛街', mapLinks: { amap: geoAmap('厦门万象城') } },
          { time: '15:00 後', label: '誠品書店', mapLinks: { amap: geoAmap('厦门诚品书店') } },
        ],
      },
      {
        heading: '銀行任務',
        items: [
          '你：恢復原開戶銀行帳戶',
          '妹妹：辦理新戶開戶',
          '開通手機銀行，ATM 查詢餘額或小額提款',
          '測試支付寶/微信支付',
        ],
      },
      {
        alert: '⚠️ 避開 11:30–14:00 與 16:30 後辦複雜銀行業務',
      },
    ],
  },
  {
    date: '7/11 (六)',
    title: '思明經典老城線',
    subtitle: '南普陀 / 廈大 / 沙坡尾 / 中山路',
    sections: [
      {
        timeline: [
          { time: '07:30–09:00', label: '南普陀寺參拜、拍照', mapLinks: { amap: geoAmap('南普陀寺') }, detail: '早上人少清涼' },
          { time: '09:00–10:30', label: '廈門大學（需提前微信預約）', mapLinks: { amap: geoAmap('厦门大学') }, detail: '中國最美校園，芙蓉湖倒影必拍' },
          { time: '10:30–12:30', label: '沙坡尾文創區、咖啡廳', mapLinks: { amap: geoAmap('沙坡尾艺术西区') } },
          { time: '15:00–16:30', label: '廈門老城區騎樓散步', mapLinks: { amap: geoAmap('厦门老城区骑楼') } },
          { time: '16:30–18:30', label: '中山路步行街、伴手禮逛逛', mapLinks: { amap: geoAmap('中山路步行街') } },
          { time: '18:00–19:30', label: '大輪碼頭夜市', mapLinks: { amap: geoAmap('大轮码头夜市') } },
        ],
        alert: '⚠️ 週六中山路 19:00–21:00 人潮最多，盡量避開 · 備選：鷺江夜遊（¥80/人）',
      },
    ],
  },
  {
    date: '7/12 (日)',
    title: '環島路海邊線',
    subtitle: '胡里山炮台 / 環島路 / 曾厝垵 / 黃厝沙灘',
    sections: [
      {
        timeline: [
          { time: '08:30–10:00', label: '胡里山炮台（世界最大古炮）', mapLinks: { amap: geoAmap('胡里山炮台') } },
          { time: '10:00–11:30', label: '環島路騎行或散步', mapLinks: { amap: geoAmap('环岛路') } },
          { time: '11:00 前 / 14:00–16:00', label: '曾厝垵文創漁村、小吃午餐', mapLinks: { amap: geoAmap('曾厝垵文创渔村') }, detail: '11:00 前去或午後去，避開中午人潮' },
          { time: '14:00–16:00', label: '文曾路咖啡街休息', mapLinks: { amap: geoAmap('文曾路咖啡街') } },
          { time: '16:30–18:30', label: '黃厝沙灘看夕陽、拍照', mapLinks: { amap: geoAmap('黄厝海滨浴场') }, detail: '週日海邊人多，傍晚去最舒適' },
        ],
        alert: '⚠️ 7月注意防曬與水母，週日海邊人多，不建議游泳，以拍照為主',
      },
    ],
  },
  {
    date: '7/13 (一)',
    title: '八市 + 採購 + 補件 + 按摩',
    subtitle: '第八市場 / 火車站商圈 / 銀行補件 / 手佳按摩',
    sections: [
      {
        heading: '上午：市場採購',
        timeline: [
          { time: '07:30–09:30', label: '第八市場（八市）→ 海鮮乾貨茶葉', mapLinks: { amap: geoAmap('厦门第八市场') }, detail: '早上越早去越新鮮，中午後攤位收攤' },
          { time: '09:30–11:00', label: '老城伴手禮採購', mapLinks: { amap: geoAmap('中山路步行街') } },
        ],
      },
      {
        heading: '下午：補件 + 商圈',
        timeline: [
          { time: '09:00–11:00 / 14:00–16:00', label: '銀行補件（若 7/10 未完成）' },
          { time: '14:00–16:30', label: '火車站商圈或特產店', mapLinks: { amap: geoAmap('厦门火车站商圈') }, detail: '地下商場超便宜，買衣服鞋子首選' },
        ],
      },
      {
        heading: '晚上：按摩放鬆',
        timeline: [
          { time: '17:30–21:00', label: '手佳健康會所按摩、吃飯、休息', mapLinks: { amap: geoAmap('手佳按摩 松柏') } },
          { time: '21:00–22:00', label: '回飯店休息', highlight: true },
        ],
      },
      {
        heading: '手佳按摩',
        items: [
          '手佳健康會所・松柏港龍店',
          '預算：每人 RMB 300–450',
          '套餐：80–100 分鐘全身/香薰/油壓按摩',
          '含洗澡、餐飲/自助餐',
          '按摩吃飯後回飯店，不作為正式住宿',
        ],
        alert: '建議提前電話預約，務必確認預約前必問清單',
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
        timeline: [
          { time: '10:00–12:00', label: '輕鬆買伴手禮' },
          { time: '13:00–14:00', label: '回飯店拿行李' },
          { time: '14:30', label: '從飯店出發去五通碼頭', highlight: true, mapLinks: { amap: geoAmap('厦门五通客运码头') } },
          { time: '15:30', label: '前抵達五通碼頭', highlight: true },
          { time: '16:00', label: '取票/出境/候船' },
          { time: '17:00', label: '開船' },
          { time: '17:30', label: '抵達金門水頭碼頭', mapLinks: { google: geoGoogle('金門水頭碼頭') } },
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
          { time: '10:00', label: '抵達金門尚義機場', mapLinks: { google: geoGoogle('金門尚義機場') } },
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
  { name: '南普陀寺', category: '景點', description: '廈門著名佛教寺廟，免費入場', tips: '上午去人少，穿著得體', mapLinks: { amap: geoAmap('南普陀寺') } },
  { name: '沙坡尾', category: '文創', description: '文創藝術區，咖啡廳與小店林立', tips: '適合拍照、下午茶', mapLinks: { amap: geoAmap('沙坡尾艺术西区') } },
  { name: '中山路步行街', category: '購物', description: '廈門最熱鬧的商業街', tips: '伴手禮、小吃多，注意人流', mapLinks: { amap: geoAmap('中山路步行街') } },
  { name: '環島路', category: '景點', description: '沿海景觀道路，適合騎行', tips: '租共享單車或散步', mapLinks: { amap: geoAmap('环岛路') } },
  { name: '黃厝沙灘', category: '海灘', description: '廈門知名沙灘，沙質細軟', tips: '帶防曬、拖鞋、毛巾', mapLinks: { amap: geoAmap('黄厝海滨浴场') } },
  { name: '五緣灣', category: '景點', description: '新興海灣區，適合散步', tips: '傍晚景色佳', mapLinks: { amap: geoAmap('五缘湾') } },
  { name: 'SM 城市廣場', category: '購物', description: '大型購物中心', tips: '冷氣足，可躲中午熱', mapLinks: { amap: geoAmap('SM城市广场') } },
  { name: '萬象城', category: '購物', description: '高端購物中心，美食選擇多', tips: '餐飲選擇豐富', mapLinks: { amap: geoAmap('厦门万象城') } },
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
    '按摩 → 洗澡 → 吃飯 → 休息，不作為正式住宿',
    '證件、現金、3C、伴手禮放飯店較安全',
    '女生同行建議回飯店睡，睡眠品質比省一晚住宿更重要',
    '隔天要搭船，建議 22:00 前回飯店',
  ],
  beforeBooking: [
    '確認可用台灣手機號預約',
    '確認套餐價格與時長（是否含自助餐）',
    '確認是否需要自備衣物',
    '確認支付方式（現金/微信/支付寶）',
    '確認營業時間（通常到凌晨）',
    '隔天前往五通碼頭需預留 40–60 分鐘',
  ],
  mapLinks: { amap: geoAmap('手佳按摩 松柏') },
};

// ----- BANK INFO -----
export interface BankInfo {
  name: string;
  purpose: string;
  tips: string;
  warning?: string;
  mapLinks?: MapLinks;
}

export const bankProcedure = {
  steps: [
    '1. 先辦中國手機門號',
    '2. 再辦銀行',
    '3. 現場開通手機銀行',
    '4. 綁定支付寶與微信',
    '5. 測試小額支付、ATM 查詢、簡訊驗證',
  ],
  requireDocs: [
    '台胞證',
    '台灣身分證',
    '護照（備用）',
    '中國手機號',
    '入境紀錄或船票',
    '飯店地址',
    '台灣地址',
    '開戶用途說明',
  ],
  usageGuide: [
    '你恢復帳戶：優先找原開戶銀行，其次廈門銀行或中國建設銀行',
    '妹妹新戶：廈門銀行或中國建設銀行優先',
    '匯款回台灣：中國銀行優先詢問',
    '台資溝通與跨境諮詢：富邦華一銀行作為備選',
  ],
};

export const banks: BankInfo[] = [
  {
    name: '廈門銀行',
    purpose: '台胞服務、新戶開戶、恢復帳戶、支付綁定',
    tips: '可能較熟悉小三通台胞需求',
    mapLinks: { amap: geoAmap('厦门银行') },
  },
  {
    name: '中國建設銀行',
    purpose: '日常支付、手機銀行、ATM、支付寶微信綁定',
    tips: '生活便利性高，新戶開戶需清楚說明用途',
    mapLinks: { amap: geoAmap('中国建设银行厦门') },
  },
  {
    name: '中國銀行',
    purpose: '跨境匯款、外匯、匯回台灣諮詢',
    tips: '審核可能較嚴，建議詢問限額與手續費',
    warning: '可能需要較多文件，預留時間',
    mapLinks: { amap: geoAmap('中国银行厦门') },
  },
  {
    name: '富邦華一銀行',
    purpose: '台資背景、跨境金融諮詢、台灣人溝通',
    tips: '分行少，生活便利性可能不如大型陸銀',
    warning: '營業時間較短，需提前確認',
    mapLinks: { amap: geoAmap('富邦华一银行厦门') },
  },
];

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

// Get Asia/Taipei date string
export function getTaipeiToday(): string {
  const now = new Date();
  const taipei = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  return `${taipei.getFullYear()}-${String(taipei.getMonth() + 1).padStart(2, '0')}-${String(taipei.getDate()).padStart(2, '0')}`;
}

export function getTripStatus(): 'before' | 'during' | 'after' {
  const today = getTaipeiToday();
  if (today < tripDates.start) return 'before';
  if (today > tripDates.end) return 'after';
  return 'during';
}

export function getDaysUntilTrip(): number {
  const today = getTaipeiToday();
  const start = new Date(tripDates.start + 'T00:00:00+08:00');
  const now = new Date(today + 'T00:00:00+08:00');
  return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ----- NAV SECTIONS -----
export const navSections = [
  { id: 'overview', label: '總覽', icon: '🏠' },
  { id: 'today', label: '今日', icon: '📍' },
  { id: 'transport', label: '交通', icon: '✈️' },
  { id: 'sim', label: '辦卡', icon: '📱' },
  { id: 'checklist', label: '清單', icon: '✅' },
  { id: 'map', label: '地圖', icon: '🗺️' },
];
