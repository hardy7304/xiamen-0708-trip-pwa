export interface EmergencyContact {
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  isPhone?: boolean;
  isAddress?: boolean;
}

export interface EmergencyStep {
  id: string;
  title: string;
  description: string;
  steps: string[];
}

export interface PhraseCard {
  category: string;
  phrases: string[];
}

// ===== 緊急聯絡資訊 =====
export const emergencyContacts: EmergencyContact[] = [
  // 台灣/兩岸協助
  { name: '海基會緊急服務專線', phone: '+886-2-2533-9995', note: '24小時', isPhone: true },
  { name: '旅外國人急難救助（24h）', phone: '+886-800-085-095', note: '外交部', isPhone: true },
  { name: '陸委會服務窗口', phone: '待確認', note: '可洽海基會轉介', isPhone: true },
  { name: '台灣家人緊急聯絡人', phone: '待填', isPhone: true },
  { name: '旅伴聯絡人', phone: '待填', isPhone: true },
  // 大陸當地
  { name: '報警 (Public Security)', phone: '110', isPhone: true },
  { name: '急救 (Ambulance)', phone: '120', isPhone: true },
  { name: '消防 (Fire)', phone: '119', isPhone: true },
  { name: '交通事故', phone: '122', isPhone: true },
  // 住宿相關
  { name: '金門家之形民宿', address: '金門縣金城鎮和平新村80號', note: '7/8 入住', isAddress: true },
  { name: '廈門住宿（待訂）', note: '飯店名稱待確認，地址待確認，電話待確認' },
  // 交通
  { name: '✈️ 立榮 B7-8927', note: '高雄小港 → 金門尚義，2026-07-08 17:25' },
  { name: '🚢 新東方 BR4007', note: '金門水頭 → 廈門五通，2026-07-09 09:00' },
  { name: '🚢 新東方 AR4007A', note: '廈門五通 → 金門水頭，2026-07-14 17:00' },
  { name: '✈️ 立榮 B7-8982', note: '金門尚義 → 台南，2026-07-15 11:30' },
];

// ===== 常見狀況 SOP =====
export const emergencySteps: EmergencyStep[] = [
  {
    id: 'lost-passport',
    title: '台胞證遺失',
    description: '出遊最重要證件',
    steps: [
      '1. 先確認是否在飯店、包包、口袋、行李夾層',
      '2. 立即拍照記錄遺失時間、地點、可能經過地點',
      '3. 聯絡旅伴與住宿櫃台，請求協助確認',
      '4. 視情況至當地公安機關報案並取得相關證明',
      '5. 聯絡海基會或相關兩岸協助窗口',
      '6. 保留護照、身分證影本、台胞證照片、訂房與交通紀錄',
      '7. 不要等到回程當天才處理',
    ],
  },
  {
    id: 'lost-phone',
    title: '手機遺失',
    description: '支付、導航、通訊全部受影響',
    steps: [
      '1. 立刻用旅伴手機撥打自己的手機',
      '2. 使用 Apple 尋找 / Google 尋找我的裝置定位',
      '3. 立即凍結支付寶、微信支付、網銀或信用卡',
      '4. 通知電信商暫停 SIM 卡',
      '5. 若內有重要資料，視情況遠端鎖定或清除',
      '6. 保留報案紀錄與定位截圖',
    ],
  },
  {
    id: 'lost-wallet',
    title: '錢包 / 信用卡遺失',
    description: '緊急停卡為優先',
    steps: [
      '1. 立刻停用信用卡與金融卡',
      '2. 檢查身上是否仍有台胞證、護照、手機',
      '3. 通知旅伴協助處理付款與交通',
      '4. 若有被盜刷疑慮，立即聯繫發卡銀行',
      '5. 保留消費明細與停卡紀錄',
    ],
  },
  {
    id: 'payment-fail',
    title: '支付寶 / 微信支付不能用',
    description: '最常見的旅行支付障礙',
    steps: [
      '1. 先確認網路是否正常',
      '2. 確認手機門號是否可收簡訊',
      '3. 改用現金人民幣或信用卡',
      '4. 請旅伴先代付並記錄在預算 tab',
      '5. 到飯店或銀行時再確認實名認證/綁卡狀態',
    ],
  },
  {
    id: 'hotel-payment',
    title: '入住付款卡關',
    description: '到店付時的常見狀況',
    steps: [
      '1. 出示訂房紀錄與護照/台胞證',
      '2. 說明訂單是「到店付」',
      '3. 詢問可否使用信用卡、現金、支付寶或微信',
      '4. 若支付失敗，請櫃台暫時保留訂單，改用其他方式',
      '5. 請索取收據或付款證明',
    ],
  },
];

// ===== 常用話術卡 =====
export const phraseCards: PhraseCard[] = [
  {
    category: '飯店入住',
    phrases: [
      '你好，我有預訂房間，訂單是到店付款。請問可以用信用卡、現金、支付寶或微信付款嗎？',
      '這是我的訂房紀錄，麻煩幫我查詢一下。',
      '請問需要押金嗎？可以用什麼方式支付？',
      '請問可以幫我開立收據或付款證明嗎？',
    ],
  },
  {
    category: '辦手機卡',
    phrases: [
      '你好，我想辦一張中國聯通手機卡。',
      '我需要可以收簡訊、綁定支付寶和微信。',
      '請問有沒有低月租、可以長期保號的套餐？',
      '我是台灣旅客，這是我的台胞證。',
    ],
  },
  {
    category: '銀行/支付',
    phrases: [
      '你好，我想確認這張卡能不能綁定支付寶和微信支付。',
      '我是台灣旅客，請問需要提供哪些證件？',
      '我想確認手機號碼是否已經可以正常收簡訊。',
    ],
  },
  {
    category: '問路/交通',
    phrases: [
      '請問這裡可以叫滴滴嗎？',
      '請問到五通碼頭大約多久？',
      '請問這個地址要從哪裡搭車比較方便？',
      '麻煩幫我看一下這個導航位置對不對。',
    ],
  },
  {
    category: '緊急求助',
    phrases: [
      '我的證件不見了，請問最近的公安機關在哪裡？',
      '我的手機遺失了，請問可以幫我撥打這個電話嗎？',
      '我需要聯絡飯店或家人，請問可以借我打電話嗎？',
      '我需要協助報案，謝謝。',
    ],
  },
];