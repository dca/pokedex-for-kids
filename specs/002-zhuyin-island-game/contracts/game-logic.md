# 合約：遊戲邏輯模組（`pokedex-for-kids-web/src/game/`）

**Feature**: [spec.md](../spec.md) ・ **Plan**: [plan.md](../plan.md)

遊戲邏輯是純 TypeScript，不依賴 React、three.js、瀏覽器 API 或時鐘。時間與隨機數都由參數傳入，所以每個函式都能用固定輸入做單元測試。以下介面是 3D 場景、2D 介面、同步模組與測試之間的合約，修改前要先改測試。

## 共用型別（`src/game/types.ts`）

```ts
export type ZoneId = 'meadow' | 'beach' | 'forest' | 'hill';
export type Stage = 'learn' | 'spell' | 'read';
export type Tone = 1 | 2 | 3 | 4 | 5;               // 5 = 輕聲
export type SymbolCategory = 'initial' | 'medial' | 'final' | 'tone';
export type ItemId = `sym:${string}` | `tone:${Tone}` | `syl:${string}` | `char:${string}`;

export type QuestionType =
  | 'listen_symbol' | 'first_sound' | 'listen_tone'          // 學注音
  | 'fill_symbol' | 'fill_tone' | 'build_syllable'          // 拼注音
  | 'listen_name' | 'zhuyin_to_char' | 'fill_char';         // 認字

/** 隨機數來源，測試時傳入固定序列 */
export type Rng = () => number;                             // [0, 1)
```

`GameEvent` 型別由 `contracts/openapi.yaml` 經 openapi-typescript 產生，不手寫。

## 注音解析（`src/game/zhuyin.ts`）

```ts
export interface ParsedSyllable {
  initial: string | null;
  medial: string | null;
  final: string | null;
  tone: Tone;
}
export function parseSyllable(zhuyin: string): ParsedSyllable;    // 不合法時 throw
export function formatSyllable(p: ParsedSyllable): string;        // parse 的反函數
export function categoryOf(symbol: string): SymbolCategory;       // FR-015 上色用
export function syllableSize(p: ParsedSyllable): 1 | 2 | 3;       // 一拼／二拼／三拼（不含聲調）
```

**測試重點**：
- 37 個符號的分類正確。
- 輕聲 `˙ㄉㄜ` 解析為 tone 5。
- 一聲沒有標記。
- 只有韻母的音節，例如 `ㄚ`、`ㄦˊ`。
- 只有聲母的音節，例如 `ㄓ`、`ㄙ`。
- 每一個合法音節都滿足 `formatSyllable(parseSyllable(x)) === x`。

## 出題（`src/game/questions.ts`）

```ts
export interface Option {
  id: string;            // 符號、聲調數字、字或名稱
  label: string;         // 顯示文字
  audioKey: string;      // AudioManifest 的鍵
  category?: SymbolCategory;
}

export interface Question {
  type: QuestionType;
  itemIds: ItemId[];             // 這題練到的項目（寫進 answer 事件）
  prompt: PromptPart[];          // 要依序播放與顯示的片段
  display: DisplayModel;         // 題目畫面：名稱、挖空位置、直排注音等
  options: Option[];             // 已洗牌
  answer: string | string[];     // build_syllable 是有順序的陣列
}

export type PromptPart =
  | { kind: 'audio'; audioKey: string }
  | { kind: 'text'; text: string };

export function buildQuestion(input: {
  type: QuestionType;
  pokemon: Pokemon;
  target: ItemId;               // 要練的項目
  optionCount: 2 | 3 | 4;
  content: StaticContent;
  rng: Rng;
}): Question;

/** 判斷某選項是否也能讓題目成立（R4），干擾項必須全部回傳 false */
export function isAlsoCorrect(q: Question, optionId: string, content: StaticContent): boolean;
```

**測試重點**：
- **不洩漏答案（FR-016）**：`first_sound` 的 `display` 不含該字的注音；`fill_*` 挖空的位置不含答案。
- **干擾項不能也是答案（FR-037）**：所有干擾項的 `isAlsoCorrect` 都是 false。
  - 同音字不會出現在 `zhuyin_to_char` 的干擾項裡。
- **不挖空非漢字**：`isHan === false` 的字元不會被挖空。
- **選項數量**：`options.length === optionCount`，而且選項裡包含正確答案。
- **可重現**：同樣的 `rng` 序列產生同樣的題目。

## 作答流程（`src/game/challenge.ts`）

狀態機，3D 與 2D 介面只讀它的狀態、送事件給它。

```ts
export type ChallengeState =
  | { phase: 'asking'; question: Question; wrongCount: 0 | 1; disabled: string[] }
  | { phase: 'reveal'; question: Question; wrongCount: 2; correctId: string }   // 第二次錯：標示正解，等小朋友點
  | { phase: 'correct'; question: Question; wrongCount: 0 | 1 | 2 }
  | { phase: 'done' };

export type ChallengeInput = { kind: 'select'; optionId: string } | { kind: 'next' };

export function startChallenge(questions: Question[]): ChallengeState;
export function stepChallenge(s: ChallengeState, input: ChallengeInput): {
  state: ChallengeState;
  effects: ChallengeEffect[];   // 'replay_prompt' | 'play_correct' | 'emit_answer' ...
};
export function starsFor(totalWrong: number): 1 | 2 | 3;           // 0→3、1→2、≥2→1
```

**測試重點**（對應 US1 的驗收條件 4～6、Edge Case「快速連續點擊」）：
- 第一次錯：選項加入 `disabled`，並產生 `replay_prompt`。
- 第二次錯：進入 `reveal`。這個階段點其他選項沒有作用，點正解才前進。
- 點 `disabled` 的選項，或在 `correct` 階段點選項，都不改變狀態。
- 每題剛好產生 1 個 `emit_answer` 效果，帶有正確的 `wrongCount`。
- `starsFor` 是三段邊界值。

## 熟練度與排程（`src/game/mastery.ts`）

```ts
export interface MasteryEntry {
  level: 0 | 1 | 2 | 3 | 4 | 5;
  dueAtEncounter: number | null;   // 以遭遇序號排程
  dueAt: string | null;            // ISO 時間，以天排程
  lastSeenAt: string;
}
export type MasteryState = ReadonlyMap<ItemId, MasteryEntry>;

export function applyAnswer(
  m: MasteryState,
  a: { itemIds: ItemId[]; wrongCount: 0 | 1 | 2; occurredAt: string; encounterIndex: number },
): MasteryState;

export function optionCountFor(level: number): 2 | 3 | 4;        // L0-1→2、L2-3→3、L4-5→4
export function isFamiliar(e: MasteryEntry | undefined): boolean; // level ≥ 3

/** 依 research R2 的優先順序排出要練的項目 */
export function pickTargets(input: {
  mastery: MasteryState;
  candidates: ItemId[];             // 本區的練習項目
  encounterIndex: number;
  now: string;
  count: number;
}): ItemId[];
```

**測試重點**：
- **R2 表格的每一列**都要有測試，包括等級上下限 0 和 5。
- **US3 驗收 1**：答錯的項目在之後 5 次遭遇內一定會被 `pickTargets` 選到。
  - 這條用性質測試：任意熟練度狀態下都成立。
- **US3 驗收 2**：連續答對時，複習間隔嚴格遞增。

## 遭遇挑選（`src/game/encounter.ts`）

```ts
export function pickPokemon(input: {
  zone: ZoneId;
  target: ItemId;
  caught: ReadonlyMap<number, { bestStars: 1 | 2 | 3 }>;
  correctStreak: number;
  content: StaticContent;
  rng: Rng;
}): Pokemon;

export function rareWeight(correctStreak: number): number;       // 0.1 + 0.1×streak，上限 0.6
export function questionsPerEncounter(stage: Stage, rng: Rng): 1 | 2 | 3;
```

**測試重點**：
- 回傳的寶可夢一定屬於該區，而且能出練到 `target` 的題目；沒有候選時才退回隨機。
- 未收服的被抽中的機率比較高，用固定 rng 做統計測試。
- `rareWeight` 的邊界值。

## 狀態衍生（`src/game/derive.ts`）

```ts
export interface ChildState {
  mastery: MasteryState;
  caught: ReadonlyMap<number, { bestStars: 1 | 2 | 3; firstCaughtAt: string }>;
  partner: { baseId: 1 | 4 | 7; currentId: number; xp: number } | null;
  badges: ReadonlyMap<ZoneId, string>;
  unlockedZones: ReadonlySet<ZoneId>;
  correctStreak: number;
  encounterCount: number;
}

export function deriveChildState(
  events: readonly GameEvent[],
  settings: { allZonesUnlocked: boolean },
  content: StaticContent,
): ChildState;

export function reduceEvent(s: ChildState, e: GameEvent, content: StaticContent): ChildState;

/** 合併兩台裝置的事件：以 id 去重後依 occurredAt、id 排序 */
export function mergeEvents(a: readonly GameEvent[], b: readonly GameEvent[]): GameEvent[];
```

**測試重點**（對應 Edge Case「兩台裝置同時離線」與 SC-007）：
- `deriveChildState(mergeEvents(a, b))` 滿足：
  - 收服紀錄 = 兩邊的聯集，星星取最高。
  - 作答數量 = 兩邊的總和（扣除重複的 id）。
- 事件順序打亂後，結果相同。
- 對同一組事件，逐筆 `reduceEvent` 的結果等於 `deriveChildState`。
- **夥伴**：
  - 有兩筆 `partner_chosen` 時取最早的一筆。
  - 經驗值 49 → 50 時第一次進化，150 時第二次進化。
- **區域開放**：
  - 本區項目 79% 熟悉時下一區不開放，80% 時開放。
  - `allZonesUnlocked` 會覆蓋這個條件。

## 遊戲時間提醒（`src/game/playtime.ts`）

```ts
export function nextReminderAt(input: {
  sessionStartedAt: number; playMinutes: number; remindersShown: number;
}): number;   // 第一次在 playMinutes 分鐘，之後每 5 分鐘（FR-072）
export function shouldRemindNow(input: { now: number; nextAt: number; inEncounter: boolean }): boolean;
```

**測試重點**：遭遇進行中不提醒，等遭遇結束後才提醒。

## 家長門檻（`src/game/parentGate.ts`）

```ts
export function makeGateQuestion(rng: Rng): { a: number; b: number; answer: number };  // 兩位數 × 一位數，答案 ≥ 50
```
