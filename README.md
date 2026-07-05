# 廈門 0708 小三通行程 PWA

2026/7/8–7/15 金門＋廈門小三通行程 PWA — 防迷路行程工具。

- 🏠 **總覽** — 8 天行程快速總覽 + 倒數出發時間
- 📍 **每日行程** — 可展開的每日時間線與任務，支援自訂行程
- ✈️ **交通** — 飛機與船班資訊，含倒數提醒與地圖導航
- 📱 **辦卡** — 手機卡與網路策略，含中國聯通詢問話術與必問清單
- ✅ **清單** — 可互動 checklist，支援自訂項目、拖曳排序、項次編號
- 💰 **預算** — 記帳、分類預算、分帳結算（嘉豪／翊婷／一起），CNY/TWD 分開計算
- 🗺️ **地圖** — 多日點位地圖，內建交通+住宿點位，支援自訂新增
- 🆘 **緊急** — 緊急聯絡資訊、SOP、常用話術一鍵複製（PIN 保護）
- 🏨 **住宿** — 每晚獨立住宿卡片，支援待訂狀態與自訂飯店名稱
- 🏛️ **景點** — 廈門景點推薦
- 💆 **按摩** — 手佳健康會所規劃 + 預約前必問清單
- 🏦 **銀行** — 銀行辦事資訊與開戶建議

## 技術棧

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) — 自訂設計系統（米白、深藍、霧金、海藍）
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — PWA 支援，可安裝到手機主畫面
- [Leaflet](https://leafletjs.com/) + OpenStreetMap — 互動式地圖
- **Cloudflare Pages Functions** — 後端 API
- **Cloudflare KV** — 跨裝置資料同步（景點、消費紀錄、行程設定）
- **Cloudflare R2** — 收據與文件照片儲存
- **IndexedDB** — 離線快取（消費紀錄本機備份）
- **PIN 保護** — `TRIP_PIN` 環境變數，前端 `sessionStorage`

## 本機開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

開啟 http://localhost:5173

## Build

```bash
npm run build
```

輸出到 `dist/` 目錄。

## 預覽 Build

```bash
npm run preview
```

## Cloudflare Pages 部署

1. 將專案推到 GitHub
2. 在 Cloudflare Dashboard → Pages → Create a project
3. 選擇 GitHub repo：`xiamen-0708-trip-pwa`
4. 設定：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Deploy

## PWA 安裝

### iOS Safari
1. 用 Safari 開啟網址
2. 點擊分享按鈕
3. 選擇「加入主畫面」

### Android Chrome
1. 用 Chrome 開啟網址
2. 點擊選單 → 「安裝應用程式」或「加到主畫面」

### Desktop Chrome
1. 網址列右側會出現安裝圖示
2. 點擊安裝

## 專案結構

```
xiamen-0708-trip-pwa/
├── public/
│   └── icon.svg              # PWA icon (SVG)
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx      # 底部導航
│   │   ├── Checklist.tsx      # 可互動 checklist (localStorage)
│   │   ├── MassagePlan.tsx    # 按摩計畫卡片
│   │   ├── PlaceCard.tsx      # 景點卡片
│   │   ├── Section.tsx        # 通用區塊包裝
│   │   ├── StayCard.tsx       # 住宿卡片
│   │   ├── TaskCard.tsx       # SIM/網路任務卡片
│   │   ├── Timeline.tsx       # 時間線元件
│   │   └── TransportCard.tsx  # 交通卡片
│   ├── data/
│   │   └── trip.ts            # 所有行程資料（TypeScript 型別 + 資料）
│   ├── App.tsx                # 主應用程式
│   ├── main.tsx               # React 進入點
│   └── index.css              # Tailwind + 自訂樣式
├── index.html                 # HTML 進入點
├── package.json
├── tsconfig.json
├── vite.config.ts             # Vite + PWA 設定
├── tailwind.config.js         # 自訂設計 token
└── postcss.config.js
```

## 如何更新 trip.ts 行程資料

所有行程資料集中在 `src/data/trip.ts`：

- **transportLegs** — 飛機與船班
- **stays** — 住宿
- **itinerary** — 每日行程與時間線
- **checklists** — 互動 checklist 分類
- **places** — 景點推薦
- **massagePlan** — 按摩規劃
- **simTasks** — SIM/網路任務

直接編輯 TypeScript 型別安全的資料結構，hot reload 即時預覽。

## 雲端同步架構 (v0.1+)

### Cloudflare 環境設定

需要在 Cloudflare Pages Dashboard 設定以下 bindings（Production 與 Preview 皆需）：

| Binding | 類型 | 值 |
|---------|------|----|
| `SPOTS_KV` | KV namespace | `SPOTS_KV` |
| `TRIP_FILES` | R2 bucket | `xiamen-trip-files` |
| `TRIP_PIN` | Environment variable (secret) | 自訂 PIN |

### API 端點

| 路徑 | 用途 |
|------|------|
| `GET /api/expenses` | 讀取所有消費記錄 |
| `POST /api/expenses` | 寫入消費記錄（`mode: merge/replace`） |
| `POST /api/upload-receipt` | 上傳收據照片至 R2 |
| `GET /api/receipt?key=` | 從 R2 讀取照片（需 `x-trip-pin`） |
| `GET /api/debug-env` | 環境診斷（不輸出敏感值） |

### 同步機制

- 消費紀錄：IndexedDB（本機快取）↔ KV（跨裝置同步）
- 新增：`POST /api/expenses` mode=merge
- 刪除：`POST /api/expenses` mode=replace（完整覆蓋）
- 切換分頁/視窗時自動拉取（`visibilitychange`）
- 收據照片：前端壓縮 → R2 → photoKey 存入 expense

## 歷史版本

### v0.1-cloud-sync-stable (2026-07-06)

- ✅ KV 跨裝置同步完成（新增、編輯、刪除）
- ✅ R2 收據照片上傳與讀取
- ✅ PIN 環境變數化，前端 sessionStorage
- ✅ 分帳系統（paidBy + expenseFor + paymentMethod）
- ✅ CNY/TWD 分開結算
- ✅ 刪除 sync 支援 replace mode
- ✅ 緊急資訊 tab（話術卡、SOP、聯絡資訊）
- ✅ 清單自訂項目 + 拖曳排序
- ✅ 地圖多日期支援 (7/8–7/15)
- ✅ `/api/debug-env` 環境診斷

**已知限制**：
- 分類預算天花板為本機靜態設定，不跨裝置同步
- 匯率為本機 localStorage 設定
- 需手動輸入 PIN（尚無 OAuth/SSO）
- 刪除全部後 KV 為空陣列 `[]`

**Preview URL**：https://feature-r2-upload-split-bill.xiamen-0708-trip-pwa.pages.dev

## 隱私說明

- 消費紀錄與收據照片儲存於 Cloudflare KV / R2
- 個人資料（電話號碼、飯店資訊）為使用者自填，可透過 PIN 保護
- Checklist 狀態存 localStorage
- 不含真實取票號碼、證件號碼、訂單號

## License

Private — 個人旅遊工具
