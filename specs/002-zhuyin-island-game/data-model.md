# 資料模型：注音島

**Feature**: [spec.md](./spec.md) ・ **Plan**: [plan.md](./plan.md) ・ **Date**: 2026-11-06

資料分成三類：

1. **靜態內容**：寶可夢、區域、學習項目、發音清單。建置時產生的 JSON，前端唯讀，伺服器不保存。
2. **伺服器資料**：帳號、session、小朋友檔案、事件。存在 Postgres。
3. **衍生狀態**：熟練度、收服紀錄、夥伴、徽章、區域開放狀態。由事件即時計算，不儲存。

---

## 1. 靜態內容（`pokedex-for-kids-web/public/data/`）

### Pokemon（`gen1.json`）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 圖鑑編號 1～151 |
| `name` | string | 中文名稱，例如「皮卡丘」 |
| `en` | string | 英文名稱 |
| `syllables` | `Syllable[]` | 每個字一個，來自 `pokemon-zhuyin.json` |
| `zone` | `ZoneId` | 所屬區域 |
| `rare` | boolean | 是否稀有 |
| `evolvesTo` | number \| null | 只有夥伴路線用得到（1→2→3、4→5→6、7→8→9） |
| `sticker` | string | 貼紙圖片路徑 |
| `audio` | `{ zh: string; en: string }` | 名稱音檔路徑 |

`Syllable`：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `char` | string | 漢字 |
| `isHan` | boolean | 非漢字（符號）為 false，不可挖空 |
| `zhuyin` | string | 完整音節，例如 `ㄎㄚˇ`、`˙ㄉㄜ` |
| `initial` | `Symbol \| null` | 聲母 |
| `medial` | `Symbol \| null` | 介音 |
| `final` | `Symbol \| null` | 韻母 |
| `tone` | `1 \| 2 \| 3 \| 4 \| 5` | 5 表示輕聲 |

**驗證規則**（產生腳本執行，失敗就中止建置）：
- 151 隻都存在，`syllables` 拼回來等於已校對的注音。
- 每個 `zhuyin` 都能拆成合法的聲母、介音、韻母、聲調組合。
- 每個 `zone` 的名稱集合，至少能涵蓋該區所有練習項目各 1 次；涵蓋不到的項目會列出警告，見 research R3。

### Zone（`zones.json`）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | `'meadow' \| 'beach' \| 'forest' \| 'hill'` | 新手草原、泡泡海灘、拼音森林、文字山丘 |
| `name` | string | 中文名稱 |
| `stage` | `'learn' \| 'spell' \| 'read'` | 學注音、拼注音、認字 |
| `order` | number | 1～4，決定開放順序 |
| `items` | `ItemId[]` | 本區的練習項目 |
| `questionTypes` | `QuestionType[]` | 本區可以出的題型 |

### LearningItem 與 ItemId

學習項目用字串 ID 表示，前綴代表種類：

| 種類 | ID 格式 | 範例 | 數量 |
|---|---|---|---|
| 注音符號 | `sym:<符號>` | `sym:ㄆ` | 37 |
| 聲調 | `tone:<1-5>` | `tone:3` | 5 |
| 音節 | `syl:<注音>` | `syl:ㄎㄚˇ` | 第一世代名稱中不重複的音節 |
| 字 | `char:<字>` | `char:卡` | 第一世代名稱中不重複的漢字 |

符號分類（決定顏色，FR-015）：
- 聲母 21 個：ㄅ～ㄙ
- 介音 3 個：ㄧㄨㄩ
- 韻母 13 個：ㄚ～ㄦ
- 聲調 5 種

### AudioManifest（`audio.json`）

把「要唸的東西」對應到音檔路徑。題目播放時只查這張表，不直接組路徑。

| 鍵 | 範例 | 對應檔案 |
|---|---|---|
| `sym:<符號>` | `sym:ㄅ` | `/audio/sym/b.mp3` |
| `tone:<n>` | `tone:3` | `/audio/tone/3.mp3`（ㄇㄚˇ） |
| `syl:<注音>` | `syl:ㄎㄚˇ` | `/audio/syl/ka3.mp3` |
| `name:zh:<id>` | `name:zh:25` | `/audio/name/zh/025.mp3` |
| `name:en:<id>` | `name:en:25` | `/audio/name/en/025.mp3` |
| `prompt:<key>` | `prompt:first-sound` | `/audio/prompt/first-sound.mp3`（「的第一個音是哪一個？」） |

---

## 2. 伺服器資料（Postgres）

### accounts

| 欄位 | 型別 | 限制 |
|---|---|---|
| `id` | uuid | PK，伺服器產生 |
| `username` | text | 3～20 字元，`^[A-Za-z0-9_]+$` |
| `username_lower` | text | UNIQUE，用來做不分大小寫的比對 |
| `password_hash` | text | argon2id 編碼字串 |
| `rescue_code_hash` | text | argon2id 編碼字串 |
| `failed_logins` | int | 預設 0 |
| `locked_until` | timestamptz | NULL 表示未鎖定 |
| `next_seq` | bigint | 預設 1，同步游標的計數器 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**狀態轉換**：
- 登入失敗：`failed_logins += 1`。達到 5 次時，設定 `locked_until = now() + 15 分鐘`。
- 登入成功：`failed_logins = 0`，`locked_until = NULL`。
- 用救援碼重設密碼：更新 `password_hash` 和 `rescue_code_hash`，刪除該帳號的所有 session，同時清除鎖定。

### sessions

| 欄位 | 型別 | 限制 |
|---|---|---|
| `token_hash` | bytea | PK，SHA-256(token) |
| `account_id` | uuid | FK → accounts，ON DELETE CASCADE |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | 每次使用延長為 now() + 30 天 |
| `user_agent` | text | 只用於除錯 |

### children

| 欄位 | 型別 | 限制 |
|---|---|---|
| `id` | uuid | PK，用戶端產生，以便離線建立 |
| `account_id` | uuid | FK → accounts，ON DELETE CASCADE |
| `nickname` | text | 1～10 字元 |
| `avatar` | text | 預設頭像的代號，例如 `avatar-03`，必須在允許清單內 |
| `stage` | text | `learn` \| `spell` \| `read`，起始階段 |
| `all_zones_unlocked` | boolean | 預設 false，家長「開放全部區域」 |
| `play_minutes` | int | 10～30，預設 20 |
| `updated_at` | timestamptz | 用戶端提供，last-write-wins |
| `deleted_at` | timestamptz | 軟刪除標記，讓其他裝置在同步時知道要移除；30 天後由排程硬刪除 |
| `created_at` | timestamptz | |

**規則**：
- 一個帳號最多 8 個小朋友檔案。
- 用戶端送來的 `updated_at` 比資料庫裡的舊時，忽略這次更新。
- 刪除時同時刪除該檔案的所有事件（FR-059）。

### events

| 欄位 | 型別 | 限制 |
|---|---|---|
| `id` | uuid | PK，用戶端產生的 UUIDv7，用來去重 |
| `account_id` | uuid | FK → accounts，ON DELETE CASCADE |
| `child_id` | uuid | FK → children，ON DELETE CASCADE |
| `seq` | bigint | 伺服器寫入時從 `accounts.next_seq` 取號，(account_id, seq) UNIQUE |
| `type` | text | 見下方事件類型 |
| `payload` | jsonb | 依類型驗證，上限 4 KB |
| `occurred_at` | timestamptz | 用戶端時間，用於排序與熟練度計算 |
| `device_id` | uuid | 產生事件的裝置 |
| `received_at` | timestamptz | 伺服器時間 |

**索引**：
- `(account_id, seq)`：同步時取游標之後的事件。
- `(child_id, occurred_at)`：重新計算單一小朋友的狀態。

### 事件類型

所有事件都有共同欄位 `id`、`childId`、`type`、`occurredAt`、`deviceId`、`payload`。

| type | payload | 說明 |
|---|---|---|
| `partner_chosen` | `{ pokemonId: 1 \| 4 \| 7 }` | 選擇夥伴。同一個小朋友有多筆時，以 `occurredAt` 最早的為準 |
| `encounter_started` | `{ encounterId, pokemonId, zone, gym: false }` | 遭遇開始。遭遇序號就是這個事件依時間排序的順序 |
| `answer` | `{ encounterId, questionType, itemIds: ItemId[], options: string[], wrongCount: 0\|1\|2, correct: true, durationMs }` | 一道題的最終結果。每題一筆，在答對（或第二次錯後點選正確答案）時寫入 |
| `encounter_completed` | `{ encounterId, pokemonId, stars: 1\|2\|3 }` | 收服完成 |
| `gym_completed` | `{ zone, correctCount: 0..10, passed: boolean }` | 道館挑戰結束 |
| `rest_reminder_shown` | `{ playedMinutes }` | 只用於除錯和日後的家長報告，不影響狀態 |

**驗證規則**（伺服器與用戶端共用同一份 OpenAPI schema）：
- `itemIds` 每個都必須符合 ItemId 格式。
- `stars` 必須和該遭遇所有 `answer` 的 `wrongCount` 一致：
  - 總答錯 0 次是 3 顆。
  - 總答錯 1 次是 2 顆。
  - 總答錯 2 次以上是 1 顆。
  - 這條由前端遊戲邏輯保證、測試覆蓋。伺服器只檢查範圍，不重算。
- `occurredAt` 不得晚於伺服器時間 + 5 分鐘，避免裝置時鐘錯亂造成的未來事件。

---

## 3. 衍生狀態（前端 `src/game/`，純函式）

都由 `deriveChildState(events, staticContent, now) → ChildState` 計算。

| 狀態 | 計算方式 |
|---|---|
| `mastery: Map<ItemId, { level: 0..5; dueAtEncounter?: number; dueAt?: Date; lastSeenAt: Date }>` | 依 research R2 的 Leitner 規則，按 `occurredAt` 依序處理 `answer` 事件 |
| `caught: Map<pokemonId, { bestStars; firstCaughtAt }>` | `encounter_completed` 取聯集、星星取最高 |
| `partner: { baseId; currentId; xp }` | `partner_chosen` 最早的一筆。`xp` = `answer` 事件數。`currentId` 依 50 / 150 的里程碑沿 `evolvesTo` 前進 |
| `badges: Map<ZoneId, earnedAt>` | `gym_completed` 中 `passed = true` 的最早一筆 |
| `unlockedZones: Set<ZoneId>` | 第一區永遠開放；下一區在前一區的 `items` 中 ≥ 80% 達到 level ≥ 3 時開放；`all_zones_unlocked` 為 true 時全部開放 |
| `correctStreak: number` | 從最後一筆 `answer` 往回數，連續 `wrongCount = 0` 的題數 |
| `encounterCount: number` | `encounter_started` 的數量 |

**效能**：一個小朋友一年的事件量估計在 2 萬筆以內。
- 啟動時完整重算一次。
- 之後每個新事件只做增量更新，用同一個 reducer。
- 單元測試保證「增量結果 = 完整重算結果」。

---

## 4. 本機儲存（IndexedDB `zhuyin-island`）

| Object store | 鍵 | 內容 |
|---|---|---|
| `events` | `id` | 事件本體加上 `synced: boolean`，索引 `childId`、`synced` |
| `children` | `id` | 小朋友檔案快取。試玩檔案的 `accountId` 為 null |
| `meta` | 字串 | `deviceId`、`syncCursor`、`accountSnapshot`、`activeChildId` |

- 登出時清除 `children` 中屬於該帳號的資料、已同步的事件和 `syncCursor`，保留 `deviceId`。
- 未同步的事件會先提示家長，確認後才清除。
