/**
 * 把寶可夢中文名稱轉成注音
 *
 * 執行：npm run zhuyin
 *
 * 輸入：
 *   ../crawlers/assets/base-pokedex.json  寶可夢編號、英文名、中文名
 *   data/zhuyin-overrides.json            人工校正表（chars：單字讀音；names：整個名稱的讀音）
 * 輸出：
 *   public/data/pokemon-zhuyin.json       遊戲使用的注音資料
 *   data/zhuyin-review.md                 尚待人工校對的名稱清單
 */

import fs from 'node:fs';
import path from 'node:path';
import { nameToZhuyin, type ZhuyinName, type ZhuyinOverrides } from '../src/lib/zhuyin/nameToZhuyin';

const ROOT = path.resolve(__dirname, '..');
const INPUT_FILE = path.resolve(ROOT, '../crawlers/assets/base-pokedex.json');
const OVERRIDES_FILE = path.join(ROOT, 'data/zhuyin-overrides.json');
const OUTPUT_FILE = path.join(ROOT, 'public/data/pokemon-zhuyin.json');
const REVIEW_FILE = path.join(ROOT, 'data/zhuyin-review.md');

interface BasePokemon {
  index: string;
  'name-en': string;
  'name-tw': string;
}

interface PokemonZhuyin extends ZhuyinName {
  /** 全國圖鑑編號；原始資料沒有編號時為 null */
  id: number | null;
  en: string;
}

function readJson<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function parseId(index: string): number | null {
  const n = Number(index.replace('#', ''));
  return Number.isInteger(n) && n > 0 ? n : null;
}

function reviewReport(items: PokemonZhuyin[]): string {
  const pending = items.filter((p) => p.needsReview);
  const lines = [
    '# 注音待校對清單',
    '',
    '> 由 `npm run zhuyin` 自動產生，請勿手動編輯。',
    '> 校對方式：把正確讀音加進 `data/zhuyin-overrides.json`，再重新執行。',
    '',
    `共 ${items.length} 隻，已校對 ${items.filter((p) => p.reviewed).length} 隻，待校對 ${pending.length} 隻。`,
    '',
    '| 編號 | 名稱 | 自動判斷 | 未確認的多音字（所有讀音） |',
    '|---|---|---|---|',
  ];

  for (const p of pending) {
    const polyphonic = p.chars
      .filter((c) => (c.polyphonic && !c.confirmed) || (c.isHan && c.zhuyin === null))
      .map((c) => `${c.char}：${c.readings.join(' / ') || '（無法轉換）'}`)
      .join('<br>');
    lines.push(`| ${p.id ?? '—'} | ${p.name} | ${p.zhuyin} | ${polyphonic} |`);
  }

  return lines.join('\n') + '\n';
}

function main() {
  const base = readJson<BasePokemon[]>(INPUT_FILE, []);
  if (base.length === 0) throw new Error(`找不到資料：${INPUT_FILE}`);

  const overrides = readJson<ZhuyinOverrides>(OVERRIDES_FILE, {});
  const names = new Set(base.map((p) => p['name-tw']));
  const unusedOverrides = Object.keys(overrides.names ?? {}).filter((name) => !names.has(name));

  const items: PokemonZhuyin[] = base.map((p) => ({
    id: parseId(p.index),
    en: p['name-en'],
    ...nameToZhuyin(p['name-tw'], overrides),
  }));

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(items, null, 2) + '\n');
  fs.mkdirSync(path.dirname(REVIEW_FILE), { recursive: true });
  fs.writeFileSync(REVIEW_FILE, reviewReport(items));

  const pending = items.filter((p) => p.needsReview).length;
  console.log(`✅ 轉換 ${items.length} 隻寶可夢`);
  console.log(`   已校對 ${items.filter((p) => p.reviewed).length}、待校對 ${pending}`);
  console.log(`   輸出：${path.relative(ROOT, OUTPUT_FILE)}`);
  console.log(`   校對清單：${path.relative(ROOT, REVIEW_FILE)}`);
  if (unusedOverrides.length > 0) {
    console.warn(`⚠️  校正表中有找不到的名稱：${unusedOverrides.join('、')}`);
  }
}

main();
