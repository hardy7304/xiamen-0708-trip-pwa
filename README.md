# 廈門 0708 小三通行程 PWA

2026/7/8–7/15 金門＋廈門小三通行程 PWA — 防迷路行程工具。

## 功能

- 🏠 **總覽** — 8 天行程快速總覽
- 📍 **每日行程** — 可展開的每日時間線與任務
- ✈️ **交通** — 飛機與船班資訊（航空公司、班次、時間、票價）
- 📱 **辦卡** — 手機卡與網路策略，含中國聯通詢問話術
- ✅ **清單** — 可互動 checklist（出發前、7/8 晚上、7/9 抵達、7/14 回程），自動儲存到 localStorage
- 🏨 **住宿** — 家之形民宿資訊
- 🏛️ **景點** — 廈門景點推薦
- 💆 **按摩** — 手佳健康會所規劃

## 技術棧

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) — 自訂設計系統（米白、深藍、霧金、海藍）
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — PWA 支援，可安裝到手機主畫面
- localStorage — 無後端、無資料庫
- 零外部 API、零 secret

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

## 隱私說明

- 無後端、無資料庫
- 不蒐集任何個資
- 不包含真實取票號碼、電話、證件號碼、訂單號
- 所有資料為靜態 TypeScript 檔案
- Checklist 狀態僅存在裝置 localStorage

## License

Private — 個人旅遊工具