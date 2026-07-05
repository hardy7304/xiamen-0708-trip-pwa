# Release Notes

## Split Bill / Settlement Overview Preview Release

**Branch**: `feature/r2-upload-split-bill`
**Preview URL**: https://feature-r2-upload-split-bill.xiamen-0708-trip-pwa.pages.dev

---

### Added

- 新增「分帳總覽」區塊，取代原本的「結算建議」。
- 支援 CNY / TWD 依幣別分開統計與結算。
- 支援共同消費統計與各成員個人消費統計。
- 支援共同消費及代付個人消費產生結算建議。
- 支援「標記為已結清」，結清後刷新不再顯示該建議。

### Fixed

- 修正「翊婷個人」消費列未顯示的問題。
- 修正 KV merge 同步模式只新增不更新（insert-only），導致 expense edits / settled 狀態被舊 KV snapshot 覆蓋。
- 修正成員列「已付 / 應負擔 / 淨額」語意與數值顯示不一致的問題。
- 改善個人消費與互相結算混在同一區塊造成使用者誤解的 UI 文案。

### Changed

- 卡片標題從「結算建議」改為「分帳總覽」。
- 每個幣別區塊拆分為兩個子區：消費統計、結算建議。
- 新增說明文字：「個人消費會列入旅遊總支出，但不會要求對方分攤；只有共同消費或代付個人消費才會產生結算建議。」
- 結清提示從「CNY 已結清 / TWD 已結清」改為「CNY 目前無需互相結算 / TWD 目前無需互相結算」。

---

## Known Follow-up / Future Improvements

### 1. Settlement history records

目前為雙人分帳 MVP，結清操作直接將 expense 標記為 `settled: true`。後續可新增 settlement history records，記錄 settledAt、from、to、currency、amount、expenseIds、note 等欄位，並在 UI 顯示完整結清歷程。

### 2. Multi-participant split

目前分帳邏輯以雙人（嘉豪 / 翊婷）為主。後續如需支援多人分帳，需重新評估 participants model、splitDetails schema、BudgetOverview rendering、settlement calculation 與 UI labels。

### 3. Custom split ratio

目前共同消費預設以平均分攤為主。後續可支援自訂比例（如 70/30）、指定金額、指定參與分攤成員，以及多人非平均分帳。

### 4. Sync conflict resolution

KV merge 已改為 upsert-by-id，避免編輯後被舊資料還原。但多裝置同時編輯同一筆 expense 時仍為 last-write-wins。後續可評估 updatedAt-based conflict resolution、conflict warning、sync audit log 及 per-device edit tracking。

### 5. Storage / schema migration

未來若新增 settlementRecords、participants 或更複雜的 splitDetails，需規劃 IndexedDB schema migration、KV schema migration、backward compatibility 及 legacy expense migration。