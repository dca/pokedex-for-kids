# 資料模型：注音島

**Feature**: [spec.md](./spec.md) ・ **Plan**: [plan.md](./plan.md) ・ **Date**: 2026-11-06（雲端化修訂）

資料分成兩類：

1. **靜態內容**：寶可夢、區域、學習項目、混淆表、發音清單。由建置腳本產生 JSON，同時給前端（顯示、音檔）和 game-api（嵌入執行檔，用於出題）使用。
2. **伺服器資料**：帳號、session、小朋友檔案、遭遇、作答、熟練度、收服、徽章。存在 Postgres，是唯一的資料來源。

瀏覽器不保存任何進度，只有 session cookie。

---

## 1. 靜態內容

建置腳本 `web/scripts/build-content.ts` 輸出到兩個位置，內容相同：
- `pokedex-for-kids-web/public/data/`
- `game-api/internal/content/data/`

### Pokemon（`gen1.json`）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 圖鑑編號 1～151 |
| `name` | string | 中文名稱，例如「皮卡丘」 |
| `en` | string | 英文名稱 |
| `syllables` | `Syllable[]` | 每個字一個，來自 `pokemon-zhuyin.json` |
| `zone` | `ZoneId` | 所屬區域 |
| `rare` | boolean | 是否稀有 |
| `evolvesTo` | number \| null | 夥伴路線用（1→2→3、4→5→6、7→8→9） |

`Syllable`：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `char` | string | 漢字 |
| `isHan` | boolean | 非漢字（符號）為 false，不可挖空 |
| `zhuyin` | string | 完整音節，例如 `ㄎㄚˇ`、`˙ㄉㄜ` |
| `initial` / `medial` / `final` | string \| null | 聲母、介音、韻母 |
| `tone` | `1 \| 2 \| 3 \| 4 \| 5` | 5 = 輕聲 |

貼紙路徑 `/pokemon/NNN.webp` 與音檔鍵 `name:zh:N`、`name:en:N` 依 `id` 推得，不另外存。

**驗證規則**（建置腳本執行，失敗就中止）：
- 151 隻都存在，音節拼回來等於已校對的注音。
- 每個音節都能拆成合法的聲母、介音、韻母、聲調組合。
- 列出每區練習項目在名稱中的出現次數；出現 0 次的項目改用「聽音找符號」練習（research R3）。

### Zone（`zones.json`）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | `'meadow' \| 'beach' \| 'forest' \| 'hill'` | 新手草原、泡泡海灘、拼音森林、文字山丘 |
| `name` | string | 中文名稱 |
| `stage` | `'learn' \| 'spell' \| 'read'` | 學注音、拼注音、認字 |
| `order` | number | 1～4 |
| `items` | `ItemId[]` | 本區的練習項目 |
| `questionTypes` | `QuestionType[]` | 本區可出的題型 |

### ItemId

| 種類 | 格式 | 範例 | 數量 |
|---|---|---|---|
| 注音符號 | `sym:<符號>` | `sym:ㄆ` | 37 |
| 聲調 | `tone:<1-5>` | `tone:3` | 5 |
| 音節 | `syl:<注音>` | `syl:ㄎㄚˇ` | 第一世代名稱中不重複的音節 |
| 字 | `char:<字>` | `char:卡` | 第一世代名稱中不重複的漢字 |

### 其他靜態檔

| 檔案 | 用途 | 使用者 |
|---|---|---|
| `confusables.json` | 易混淆的符號、聲調、字（research R4） | game-api |
| `audio.json` | 音檔鍵 → 路徑，例如 `sym:ㄅ` → `/audio/sym/b.mp3` | 前端 |

---

## 2. 伺服器資料（Postgres）

### accounts

| 欄位 | 型別 | 限制 |
|---|---|---|
| `id` | uuid | PK |
| `is_guest` | boolean | 訪客為 true |
| `username` | text | NULL（訪客）或 3～20 字元 `^[A-Za-z0-9_]+$` |
| `username_lower` | text | UNIQUE（NULL 不受限），用來做不分大小寫的比對 |
| `password_hash` | text | NULL（訪客）或 argon2id |
| `rescue_code_hash` | text | NULL（訪客）或 argon2id |
| `failed_logins` | int | 預設 0 |
| `locked_until` | timestamptz | NULL 表示未鎖定 |
| `last_seen_at` | timestamptz | 用來清理超過 180 天未使用的訪客帳號 |
| `created_at` / `updated_at` | timestamptz | |

**CHECK**：`is_guest OR (username IS NOT NULL AND password_hash IS NOT NULL AND rescue_code_hash IS NOT NULL)`

**狀態轉換**：
- 訪客 → 正式帳號：註冊時補上欄位，並把 `is_guest` 改為 false。
- 登入失敗：`failed_logins += 1`；達到 5 次時鎖定 15 分鐘。成功後歸零。
- 救援碼重設：更新密碼與救援碼的雜湊，刪除該帳號所有 session，清除鎖定。

### sessions

| 欄位 | 型別 | 限制 |
|---|---|---|
| `token_hash` | bytea | PK，SHA-256(token) |
| `account_id` | uuid | FK → accounts，ON DELETE CASCADE |
| `expires_at` | timestamptz | 正式帳號 now() + 30 天、訪客 now() + 365 天，每次使用延長 |
| `created_at` | timestamptz | |

### children

| 欄位 | 型別 | 限制 |
|---|---|---|
| `id` | uuid | PK |
| `account_id` | uuid | FK → accounts，ON DELETE CASCADE |
| `nickname` | text | 1～10 字元 |
| `avatar` | text | `avatar-01`～`avatar-12` |
| `start_stage` | text | `learn` \| `spell` \| `read` |
| `partner_base_id` | int | NULL（尚未選擇）或 1 / 4 / 7；只能設定一次 |
| `xp` | int | 答對題數，預設 0 |
| `correct_streak` | int | 連續第一次就答對的題數 |
| `encounter_count` | int | 已完成的遭遇數，間隔重複用 |
| `created_at` / `updated_at` | timestamptz | |

**規則**：一個帳號最多 8 個小朋友檔案。夥伴目前的樣子（`currentId`）由 `partner_base_id` 和 `xp` 推得，不另外存。

### encounters

| 欄位 | 型別 | 限制 |
|---|---|---|
| `id` | uuid | PK |
| `child_id` | uuid | FK → children，ON DELETE CASCADE |
| `zone` | text | ZoneId |
| `kind` | text | `wild` \| `gym` |
| `pokemon_id` | int | 1～151，道館的話是館主寶可夢 |
| `questions` | jsonb | 伺服器產生的 `Question[]`，含答案 |
| `status` | text | `open` \| `completed` |
| `stars` | int | 完成時由伺服器計算，1～3；道館為 NULL |
| `result` | jsonb | 完成時的結算結果，重送 complete 時原樣回傳 |
| `created_at` / `completed_at` | timestamptz | |

**索引**：`(child_id, status)`。超過 24 小時仍然是 `open` 的遭遇，由每天的清理工作刪除。

### answers

| 欄位 | 型別 | 限制 |
|---|---|---|
| `encounter_id` | uuid | FK → encounters，ON DELETE CASCADE |
| `question_index` | int | 0 起算；PK 為 `(encounter_id, question_index)` |
| `item_ids` | text[] | 從題目複製，方便日後查詢 |
| `wrong_count` | int | 0～2 |
| `duration_ms` | int | |
| `answered_at` | timestamptz | |

PK 讓 `PUT` 重送只寫入一次。重送的內容不同時回 409。

### mastery

| 欄位 | 型別 | 限制 |
|---|---|---|
| `child_id` | uuid | FK → children，ON DELETE CASCADE |
| `item_id` | text | ItemId；PK 為 `(child_id, item_id)` |
| `level` | int | 0～5 |
| `due_encounter` | int | NULL 或遭遇序號 |
| `due_at` | timestamptz | NULL 或時間 |
| `last_seen_at` | timestamptz | |

### caught

| 欄位 | 型別 | 限制 |
|---|---|---|
| `child_id` | uuid | FK → children，ON DELETE CASCADE |
| `pokemon_id` | int | PK 為 `(child_id, pokemon_id)` |
| `best_stars` | int | 1～3，以 `GREATEST` 更新 |
| `first_caught_at` | timestamptz | |

### badges

| 欄位 | 型別 | 限制 |
|---|---|---|
| `child_id` | uuid | FK → children，ON DELETE CASCADE |
| `zone` | text | PK 為 `(child_id, zone)` |
| `earned_at` | timestamptz | |

---

## 3. 交易與一致性

| 動作 | 交易內容 |
|---|---|
| 建立遭遇 | 讀取 children、mastery、caught，執行 `game` 套件出題，INSERT encounters |
| 寫入作答 | `SELECT children … FOR UPDATE`；INSERT answers（衝突時比對內容）；依 `mastery.Apply` UPSERT mastery；更新 `correct_streak`、`xp` |
| 完成遭遇 | `SELECT encounters … FOR UPDATE`。已經完成的話，直接回傳 `result`。否則：檢查所有題目都已作答；計算星星；UPSERT caught（GREATEST）；`encounter_count += 1`；判斷進化、新開放的區域、道館是否通過（INSERT badges ON CONFLICT DO NOTHING）；寫入 `result` |

所有規則都是 `internal/game/` 中的純函式，交易層只負責讀取、呼叫、寫回。

---

## 4. 衍生值（由伺服器計算，透過 `GET /children/{id}/state` 回傳）

| 值 | 計算方式 |
|---|---|
| `partner.currentId` | `partner_base_id` 沿 `evolvesTo` 前進：xp ≥ 50 進化一次，≥ 150 進化兩次 |
| `partner.title` | 最終進化後依 xp 解鎖的稱號 |
| `unlockedZones` | 起始階段開放的區域，加上「前一區的 `items` 有 ≥ 80% 達到 level ≥ 3」的區域 |
| `allCaught` | caught 筆數 = 151 |
| `masterySummary` | 每區「熟悉的項目數 / 總項目數」，用來顯示開放進度 |
