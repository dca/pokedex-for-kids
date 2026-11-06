# 合約：遊戲邏輯模組

**Feature**: [spec.md](../spec.md) ・ **Plan**: [plan.md](../plan.md) ・ 2026-11-06（雲端化修訂）

規則分成兩個地方：

- **伺服器（Go，`game-api/internal/game/`）**：所有會影響進度的規則，包括出題、干擾項、熟練度、挑選寶可夢、星星、經驗值、進化、區域開放、道館。
- **前端（TypeScript，`pokedex-for-kids-web/src/game/`）**：只有畫面需要的邏輯，包括注音解析與上色、作答流程的狀態機。

兩邊都是純函式，不碰資料庫、網路、時鐘。時間與亂數由參數傳入，所以可以用固定輸入做單元測試。修改介面前要先改測試。

---

## A. 伺服器：`game-api/internal/game/`

### `content`：靜態內容

```go
package content

type ZoneID string   // "meadow" | "beach" | "forest" | "hill"
type Stage string    // "learn" | "spell" | "read"
type ItemID string   // "sym:ㄆ" | "tone:3" | "syl:ㄎㄚˇ" | "char:卡"

type Syllable struct { Char string; IsHan bool; Zhuyin string; Initial, Medial, Final string; Tone int }
type Pokemon  struct { ID int; Name, En string; Syllables []Syllable; Zone ZoneID; Rare bool; EvolvesTo int }
type Zone     struct { ID ZoneID; Name string; Stage Stage; Order int; Items []ItemID; QuestionTypes []string }

type Content struct {
    Pokemon     map[int]Pokemon
    Zones       []Zone                 // 依 Order 排序
    Confusables Confusables
}

func Load() (*Content, error)          // 從 embed 的 data/*.json 載入並驗證
func TestContent() *Content            // 測試用：10 隻有代表性的寶可夢
```

### `zhuyin`：注音解析

```go
func Parse(s string) (Syllable, error)          // 不合法時回傳 error
func Format(s Syllable) string                   // Parse 的反函數
func Category(symbol string) string              // "initial" | "medial" | "final" | "tone"
func Size(s Syllable) int                        // 1、2、3（一拼／二拼／三拼，不含聲調）
```

**測試重點**：
- 37 個符號的分類正確。
- 輕聲 `˙ㄉㄜ` 解析為 tone 5，一聲沒有標記。
- 只有韻母的音節（`ㄚ`、`ㄦˊ`），以及只有聲母的音節（`ㄓ`、`ㄙ`）。
- 對第一世代所有音節，`Format(Parse(x)) == x`。

### `questions`：出題與干擾項

```go
type Question struct {                 // 對應 openapi 的 Question
    Type    string
    ItemIDs []ItemID
    Prompt  []PromptPart
    Display Display
    Options []Option
    Answer  []string
}

type BuildInput struct {
    Type        string
    Pokemon     content.Pokemon
    Target      ItemID
    OptionCount int            // 2、3、4
    Rand        *rand.Rand
}

func Build(c *content.Content, in BuildInput) (Question, error)
func IsAlsoCorrect(c *content.Content, q Question, optionID string) bool
func Distractors(c *content.Content, target ItemID, kind string, n int, exclude func(string) bool, r *rand.Rand) []string
```

**測試重點**（每種題型一個 table-driven 測試）：
- **不洩漏答案（FR-016）**：
  - `first_sound` 的 `Display` 不含該字的注音。
  - `fill_*` 挖空的位置用「＿」，不含答案。
  - `listen_*` 的 layout 為 `none`。
- **干擾項（FR-037、US3 驗收 5）**：
  - 所有干擾項的 `IsAlsoCorrect` 都是 false。
  - `zhuyin_to_char` 與 `fill_char` 不會出現同音字。
  - 干擾項優先取自混淆表，例如 ㄅ 的干擾項含 ㄆ；不足時補隨機項。
- **非漢字**：`IsHan == false` 的字元不被挖空。
- **選項**：數量等於 `OptionCount` 並且包含答案；`build_syllable` 的 `Answer` 有順序，選項是該音節的符號加上干擾符號。
- **拼注音的順序（FR-012）**：依 `zhuyin.Size` 先二拼、再三拼、最後整個名稱。
- **聽聲調**：選項包含輕聲。
- **可重現**：同一個 seed 產生同一題。

### `mastery`：熟練度與排程

```go
type Entry struct { Level int; DueEncounter *int; DueAt *time.Time; LastSeenAt time.Time }

func Apply(e Entry, wrongCount int, encounterIndex int, now time.Time) Entry   // research R2 的表格
func OptionCount(level int) int                                                // L0-1→2、L2-3→3、L4-5→4
func IsFamiliar(level int) bool                                                // level ≥ 3
func PickTargets(m map[ItemID]Entry, candidates []ItemID, encounterIndex int, now time.Time, n int, r *rand.Rand) []ItemID
```

**測試重點**：
- R2 表格的每一列，包括等級上下限 0 和 5。
- 連續答對時，複習間隔嚴格遞增（US3 驗收 2）。
- **性質測試**（`testing/quick` 或手寫產生器）：任意狀態下，答錯的項目在之後 5 次遭遇內一定會被 `PickTargets` 選到（US3 驗收 1）。

### `encounter`：挑選寶可夢

```go
func PickPokemon(c *content.Content, zone content.ZoneID, target ItemID,
    caught map[int]int, correctStreak int, r *rand.Rand) content.Pokemon
func RareWeight(correctStreak int) float64                 // 0.1 + 0.1×streak，上限 0.6
func QuestionsPerEncounter(stage content.Stage, r *rand.Rand) int   // 1～3
func PlanWild(c *content.Content, s ChildSnapshot, zone content.ZoneID, now time.Time, r *rand.Rand) (pokemonID int, qs []questions.Question, err error)
func PlanGym(c *content.Content, s ChildSnapshot, zone content.ZoneID, r *rand.Rand) (pokemonID int, qs []questions.Question, err error)  // 10 題
```

`ChildSnapshot` 包含 mastery、caught、correctStreak、encounterCount、startStage。

**測試重點**：
- 回傳的寶可夢屬於該區，名稱能練到 `target`；沒有候選時才退回隨機。
- 未收服的被抽中的機率較高（固定 seed 統計）。
- `RareWeight` 的邊界值。
- `PlanGym` 剛好 10 題，涵蓋本區不同的項目。

### `progress`：結算

```go
func Stars(totalWrong int) int                                   // 0→3、1→2、≥2→1
func PartnerForm(c *content.Content, baseID, xp int) (currentID int, nextEvolutionXP *int, title *string)  // 50 / 150
func UnlockedZones(c *content.Content, start content.Stage, mastery map[ItemID]Entry) []content.ZoneID
func ZoneProgress(c *content.Content, mastery map[ItemID]Entry) []ZoneProgress
func GymPassed(correctCount int) bool                            // ≥ 8
func StreakAfter(streak, wrongCount int) int                     // 0 錯就 +1，否則歸零
```

**測試重點**：
- `Stars` 的三段邊界。
- 進化：xp 49 → 50 時第一次進化，150 時第二次進化，最終進化後回傳稱號。
- 區域開放：79% 熟悉時不開放，80% 時開放；起始階段 `spell` 一開始就有三區，`read` 有四區。
- `GymPassed`：7 題不通過，8 題通過。

---

## B. 前端：`pokedex-for-kids-web/src/game/`

前端不包含任何會影響進度的規則，題目、答案、結算結果都來自伺服器。

### `zhuyin.ts`：顯示用

```ts
export function categoryOf(symbol: string): 'initial' | 'medial' | 'final' | 'tone';   // FR-015 上色
export function splitZhuyin(zhuyin: string): string[];   // 「ㄑ＿ㄡ」→ ['ㄑ','＿','ㄡ']，聲調與輕聲點各自成為一個元素
```

**測試重點**：37 個符號的分類、輕聲點的位置、挖空符號「＿」。

### `challenge.ts`：作答狀態機

```ts
import type { Question } from '@/api/types';   // 由 openapi-typescript 產生

export type ChallengeState =
  | { phase: 'asking'; index: number; wrongCount: 0 | 1; disabled: string[]; picked: string[] }
  | { phase: 'reveal'; index: number; wrongCount: 2; correctId: string; picked: string[] }
  | { phase: 'correct'; index: number; wrongCount: 0 | 1 | 2 }
  | { phase: 'done' };

export type ChallengeInput = { kind: 'select'; optionId: string } | { kind: 'next' };

export type ChallengeEffect =
  | { kind: 'replay_prompt' }
  | { kind: 'play_correct' }
  | { kind: 'submit_answer'; index: number; wrongCount: 0 | 1 | 2 }
  | { kind: 'finished' };

export function startChallenge(questions: Question[]): ChallengeState;
export function stepChallenge(questions: Question[], s: ChallengeState, input: ChallengeInput):
  { state: ChallengeState; effects: ChallengeEffect[] };
```

**測試重點**（US1 驗收 4～6、Edge Case「快速連續點擊」）：
- 第一次錯：選項加入 `disabled`，並產生 `replay_prompt`。
- 第二次錯：進入 `reveal`，之後只有點正解才會前進。
- 點 `disabled` 的選項，或在 `correct` 階段點選，都不改變狀態。
- `build_syllable` 依序點選，錯一個就算答錯一次並清空。
- 每題剛好產生 1 個 `submit_answer`，`wrongCount` 正確。
- 最後一題之後產生 `finished`。
