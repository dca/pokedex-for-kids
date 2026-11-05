/**
 * 搜尋工具函式
 * 提供名稱匹配、模糊搜尋、中英文支援
 */

import type { Pokemon } from '@/types';

// ============================================================================
// 名稱正規化
// ============================================================================

/**
 * 正規化英文名稱（移除特殊字元，轉小寫）
 */
export function normalizeEnglishName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // 移除非字母數字字元
}

/**
 * 正規化中文名稱（移除空格）
 */
export function normalizeChineseName(name: string): string {
  return name.replace(/\s+/g, ''); // 移除所有空格
}

// ============================================================================
// 模糊匹配
// ============================================================================

/**
 * 計算 Levenshtein 距離（編輯距離）
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // 初始化矩陣
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 計算編輯距離
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // 刪除
        matrix[i][j - 1] + 1,      // 插入
        matrix[i - 1][j - 1] + cost // 替換
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 部分匹配評分（0-1，越高越匹配）
 */
function partialMatchScore(query: string, target: string): number {
  if (target.includes(query)) {
    // 完全包含，評分基於匹配位置
    const position = target.indexOf(query);
    const positionScore = 1 - (position / target.length);
    const lengthScore = query.length / target.length;
    return (positionScore * 0.3 + lengthScore * 0.7);
  }

  // 使用編輯距離計算相似度
  const distance = levenshteinDistance(query, target);
  const maxLength = Math.max(query.length, target.length);
  return Math.max(0, 1 - (distance / maxLength));
}

/**
 * 模糊匹配評分
 */
export function fuzzyMatchScore(query: string, target: string): number {
  const normalizedQuery = query.toLowerCase();
  const normalizedTarget = target.toLowerCase();

  // 完全匹配
  if (normalizedQuery === normalizedTarget) {
    return 1.0;
  }

  // 部分匹配
  return partialMatchScore(normalizedQuery, normalizedTarget);
}

// ============================================================================
// Pokemon 搜尋
// ============================================================================

interface SearchResult {
  pokemon: Pokemon;
  score: number;
}

/**
 * 搜尋 Pokemon（支援中英文、部分匹配、模糊匹配）
 */
export function searchPokemon(
  allPokemon: Pokemon[],
  query: string,
  options: {
    fuzzy?: boolean;
    minScore?: number;
    maxResults?: number;
  } = {}
): Pokemon[] {
  const {
    fuzzy = true,
    minScore = 0.3,
    maxResults = 100,
  } = options;

  // 空查詢返回所有 Pokemon
  if (!query.trim()) {
    return allPokemon;
  }

  const normalizedQuery = query.trim();
  const results: SearchResult[] = [];

  for (const pokemon of allPokemon) {
    let score = 0;

    // 圖鑑編號精確匹配
    if (pokemon.dexNumber === normalizedQuery || pokemon.id.toString() === normalizedQuery) {
      score = 1.0;
    }
    // 英文名稱匹配
    else if (fuzzy) {
      const enScore = fuzzyMatchScore(normalizedQuery, pokemon.name.en);
      const zhScore = fuzzyMatchScore(normalizedQuery, pokemon.name.zh);
      score = Math.max(enScore, zhScore);
    }
    // 簡單部分匹配
    else {
      const enMatch = pokemon.name.en.toLowerCase().includes(normalizedQuery.toLowerCase());
      const zhMatch = pokemon.name.zh.includes(normalizedQuery);
      score = (enMatch || zhMatch) ? 1.0 : 0;
    }

    // 只保留分數足夠的結果
    if (score >= minScore) {
      results.push({ pokemon, score });
    }
  }

  // 按分數排序（高到低）
  results.sort((a, b) => b.score - a.score);

  // 限制結果數量
  return results.slice(0, maxResults).map(r => r.pokemon);
}

/**
 * 快速名稱匹配（不使用模糊匹配，效能較好）
 */
export function quickSearchPokemon(
  allPokemon: Pokemon[],
  query: string
): Pokemon[] {
  if (!query.trim()) {
    return allPokemon;
  }

  const lowerQuery = query.toLowerCase();

  return allPokemon.filter(pokemon => {
    return (
      pokemon.name.en.toLowerCase().includes(lowerQuery) ||
      pokemon.name.zh.includes(query) ||
      pokemon.dexNumber.includes(query) ||
      pokemon.id.toString() === query
    );
  });
}

/**
 * 按首字母過濾 Pokemon（英文名稱）
 */
export function filterByInitial(
  allPokemon: Pokemon[],
  initial: string
): Pokemon[] {
  const upperInitial = initial.toUpperCase();

  return allPokemon.filter(pokemon =>
    pokemon.name.en.toUpperCase().startsWith(upperInitial)
  );
}

/**
 * 按世代過濾 Pokemon
 */
export function filterByGeneration(
  allPokemon: Pokemon[],
  generation: number
): Pokemon[] {
  return allPokemon.filter(pokemon =>
    pokemon.metadata.generation === generation
  );
}

/**
 * 高亮匹配的文字
 */
export function highlightMatch(text: string, query: string): string {
  if (!query) {
    return text;
  }

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
