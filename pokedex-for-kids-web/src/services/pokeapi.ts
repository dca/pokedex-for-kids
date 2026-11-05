/**
 * PokéAPI 客戶端服務
 * 提供 Pokemon 資料獲取、批次處理、錯誤處理與重試邏輯
 */

import type {
  Pokemon,
  PokeApiPokemon,
  PokeApiSpecies,
  ApiError,
} from '@/types';

// ============================================================================
// 常數設定
// ============================================================================

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;
const CONCURRENCY_LIMIT = 10;

// 第一代到第八代的寶可夢總數
const TOTAL_POKEMON_COUNT = 898;

// ============================================================================
// 中文名稱對照表（簡化版 - 實際應用可從外部載入完整表）
// ============================================================================

const chineseNames: Record<string, string> = {
  'bulbasaur': '妙蛙種子',
  'ivysaur': '妙蛙草',
  'venusaur': '妙蛙花',
  'charmander': '小火龍',
  'charmeleon': '火恐龍',
  'charizard': '噴火龍',
  'squirtle': '傑尼龜',
  'wartortle': '卡咪龜',
  'blastoise': '水箭龜',
  'pikachu': '皮卡丘',
  'raichu': '雷丘',
  'eevee': '伊布',
  // ... 更多對照可在實際應用中補充
};

// ============================================================================
// 錯誤處理
// ============================================================================

class PokeApiError extends Error implements ApiError {
  code?: string;
  statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'PokeApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============================================================================
// 工具函式
// ============================================================================

/**
 * 延遲執行
 */
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * 帶超時的 fetch
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new PokeApiError('請求超時', 'TIMEOUT');
    }
    throw error;
  }
}

/**
 * 帶重試機制的 fetch
 */
async function fetchWithRetry<T>(
  url: string,
  maxRetries: number = MAX_RETRY_ATTEMPTS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        throw new PokeApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      // 如果不是最後一次嘗試，則等待後重試
      if (attempt < maxRetries) {
        await delay(RETRY_DELAY_MS * (attempt + 1)); // 指數退避
        continue;
      }
    }
  }

  throw lastError || new PokeApiError('未知錯誤', 'UNKNOWN');
}

/**
 * 格式化圖鑑編號（如 1 -> "001", 25 -> "025"）
 */
function formatDexNumber(id: number): string {
  return id.toString().padStart(3, '0');
}

/**
 * 從 API 名稱獲取中文名稱
 */
function getChineseName(englishName: string, speciesData?: PokeApiSpecies): string {
  // 優先使用 API 提供的中文名稱
  if (speciesData) {
    const chineseName = speciesData.names.find(
      n => n.language.name === 'zh-Hant' || n.language.name === 'zh-Hans'
    );
    if (chineseName) {
      return chineseName.name;
    }
  }

  // 次選使用內建對照表
  const localName = chineseNames[englishName.toLowerCase()];
  if (localName) {
    return localName;
  }

  // 最後使用英文名稱作為降級方案
  return englishName;
}

/**
 * 從世代名稱提取世代編號（如 "generation-i" -> 1）
 */
function getGenerationNumber(generationName: string): number {
  const match = generationName.match(/generation-([ivx]+)/i);
  if (!match) return 1;

  const romanToNumber: Record<string, number> = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9,
  };

  return romanToNumber[match[1].toLowerCase()] || 1;
}

// ============================================================================
// Pokemon 資料轉換
// ============================================================================

/**
 * 轉換 PokéAPI 資料為應用程式格式
 */
async function transformPokemonData(
  pokemonData: PokeApiPokemon
): Promise<Pokemon> {
  // 獲取物種資料以取得中文名稱和世代資訊
  const speciesData = await fetchWithRetry<PokeApiSpecies>(
    pokemonData.species.url
  );

  const englishName = pokemonData.name.charAt(0).toUpperCase() +
                       pokemonData.name.slice(1);
  const chineseName = getChineseName(pokemonData.name, speciesData);

  return {
    id: pokemonData.id,
    name: {
      en: englishName,
      zh: chineseName,
    },
    dexNumber: formatDexNumber(pokemonData.id),
    sprites: {
      official: pokemonData.sprites.other?.['official-artwork']?.front_default ||
                pokemonData.sprites.front_default ||
                '',
      icon: pokemonData.sprites.front_default || '',
    },
    metadata: {
      generation: getGenerationNumber(speciesData.generation.name),
      isSpecialForm: pokemonData.name.includes('-'),
    },
  };
}

// ============================================================================
// 公開 API
// ============================================================================

/**
 * 獲取單一 Pokemon 資料
 */
export async function fetchPokemon(idOrName: number | string): Promise<Pokemon> {
  try {
    const url = `${POKEAPI_BASE_URL}/pokemon/${idOrName}`;
    const pokemonData = await fetchWithRetry<PokeApiPokemon>(url);
    return await transformPokemonData(pokemonData);
  } catch (error) {
    if (error instanceof PokeApiError) {
      throw error;
    }
    throw new PokeApiError(
      `獲取 Pokemon ${idOrName} 失敗: ${(error as Error).message}`,
      'FETCH_FAILED'
    );
  }
}

/**
 * 批次獲取 Pokemon 資料（帶並發控制）
 */
export async function fetchPokemonBatch(
  ids: number[],
  concurrency: number = CONCURRENCY_LIMIT,
  onProgress?: (completed: number, total: number) => void
): Promise<Pokemon[]> {
  const results: Pokemon[] = [];
  const chunks: number[][] = [];

  // 將 ID 陣列分成多個批次
  for (let i = 0; i < ids.length; i += concurrency) {
    chunks.push(ids.slice(i, i + concurrency));
  }

  // 逐批次處理
  let completed = 0;
  for (const chunk of chunks) {
    const promises = chunk.map(id => fetchPokemon(id));
    const batchResults = await Promise.allSettled(promises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('Failed to fetch Pokemon:', result.reason);
      }
      completed++;
      onProgress?.(completed, ids.length);
    }
  }

  // 按 ID 排序
  return results.sort((a, b) => a.id - b.id);
}

/**
 * 獲取所有 Pokemon 資料（第一代到第八代）
 */
export async function fetchAllPokemon(
  onProgress?: (completed: number, total: number) => void
): Promise<Pokemon[]> {
  const ids = Array.from({ length: TOTAL_POKEMON_COUNT }, (_, i) => i + 1);
  return fetchPokemonBatch(ids, CONCURRENCY_LIMIT, onProgress);
}

/**
 * 獲取指定世代的 Pokemon
 */
export async function fetchPokemonByGeneration(
  generation: number,
  onProgress?: (completed: number, total: number) => void
): Promise<Pokemon[]> {
  // 各世代的 ID 範圍
  const generationRanges: Record<number, [number, number]> = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 898],
  };

  const range = generationRanges[generation];
  if (!range) {
    throw new PokeApiError(`無效的世代編號: ${generation}`, 'INVALID_GENERATION');
  }

  const [start, end] = range;
  const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return fetchPokemonBatch(ids, CONCURRENCY_LIMIT, onProgress);
}

/**
 * 搜尋 Pokemon（本地搜尋，需要先載入資料）
 */
export function searchPokemon(
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
 * 驗證 Pokemon 資料完整性
 */
export function validatePokemon(pokemon: Pokemon): boolean {
  return Boolean(
    pokemon.id > 0 &&
    pokemon.name.en &&
    pokemon.name.zh &&
    pokemon.dexNumber &&
    pokemon.sprites.official &&
    pokemon.metadata.generation >= 1 &&
    pokemon.metadata.generation <= 9
  );
}
