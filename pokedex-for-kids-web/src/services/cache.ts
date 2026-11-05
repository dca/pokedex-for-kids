/**
 * IndexedDB 快取服務
 * 提供 Pokemon 資料的本地持久化儲存
 */

import type { Pokemon, AppCache, CacheStatus } from '@/types';

// ============================================================================
// 常數設定
// ============================================================================

const DB_NAME = 'PokemonAudioPokedex';
const DB_VERSION = 1;
const POKEMON_STORE = 'pokemon';
const CACHE_META_STORE = 'cache_meta';
const CACHE_VERSION = '1.0.0';
const CACHE_TTL_DAYS = 7; // 快取有效期：7 天

// ============================================================================
// 型別定義
// ============================================================================

interface CacheMeta {
  version: string;
  createdAt: string;
  expiresAt: string;
  status: CacheStatus;
  lastUpdated: string;
}

// ============================================================================
// IndexedDB 初始化
// ============================================================================

/**
 * 開啟 IndexedDB 資料庫
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`無法開啟資料庫: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 建立 Pokemon 物件儲存區
      if (!db.objectStoreNames.contains(POKEMON_STORE)) {
        const pokemonStore = db.createObjectStore(POKEMON_STORE, {
          keyPath: 'id',
        });
        pokemonStore.createIndex('dexNumber', 'dexNumber', { unique: true });
        pokemonStore.createIndex('name.en', 'name.en', { unique: false });
        pokemonStore.createIndex('name.zh', 'name.zh', { unique: false });
      }

      // 建立快取中繼資料儲存區
      if (!db.objectStoreNames.contains(CACHE_META_STORE)) {
        db.createObjectStore(CACHE_META_STORE);
      }
    };
  });
}

// ============================================================================
// 快取中繼資料管理
// ============================================================================

/**
 * 獲取快取中繼資料
 */
async function getCacheMeta(): Promise<CacheMeta | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHE_META_STORE, 'readonly');
    const store = transaction.objectStore(CACHE_META_STORE);
    const request = store.get('meta');

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error('讀取快取中繼資料失敗'));
    };
  });
}

/**
 * 更新快取中繼資料
 */
async function updateCacheMeta(meta: CacheMeta): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHE_META_STORE, 'readwrite');
    const store = transaction.objectStore(CACHE_META_STORE);
    const request = store.put(meta, 'meta');

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('更新快取中繼資料失敗'));
    };
  });
}

/**
 * 計算快取狀態
 */
function calculateCacheStatus(meta: CacheMeta): CacheStatus {
  const now = new Date().getTime();
  const expiresAt = new Date(meta.expiresAt).getTime();
  const createdAt = new Date(meta.createdAt).getTime();

  // 已過期
  if (now > expiresAt) {
    return 'expired';
  }

  // 快取新鮮（建立後 24 小時內）
  const oneDayInMs = 24 * 60 * 60 * 1000;
  if (now - createdAt < oneDayInMs) {
    return 'fresh';
  }

  // 快取陳舊（但未過期）
  return 'stale';
}

/**
 * 建立新的快取中繼資料
 */
function createCacheMeta(): CacheMeta {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

  return {
    version: CACHE_VERSION,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'fresh',
    lastUpdated: now.toISOString(),
  };
}

// ============================================================================
// Pokemon 資料操作
// ============================================================================

/**
 * 儲存單一 Pokemon
 */
export async function savePokemon(pokemon: Pokemon): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(POKEMON_STORE, 'readwrite');
    const store = transaction.objectStore(POKEMON_STORE);
    const request = store.put(pokemon);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`儲存 Pokemon ${pokemon.id} 失敗`));
    };
  });
}

/**
 * 批次儲存 Pokemon
 */
export async function savePokemonBatch(
  pokemonList: Pokemon[],
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(POKEMON_STORE, 'readwrite');
    const store = transaction.objectStore(POKEMON_STORE);

    let completed = 0;
    const total = pokemonList.length;

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(new Error('批次儲存 Pokemon 失敗'));
    };

    for (const pokemon of pokemonList) {
      const request = store.put(pokemon);
      request.onsuccess = () => {
        completed++;
        onProgress?.(completed, total);
      };
    }
  });
}

/**
 * 獲取單一 Pokemon
 */
export async function getPokemon(id: number): Promise<Pokemon | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(POKEMON_STORE, 'readonly');
    const store = transaction.objectStore(POKEMON_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error(`讀取 Pokemon ${id} 失敗`));
    };
  });
}

/**
 * 獲取所有 Pokemon
 */
export async function getAllPokemon(): Promise<Pokemon[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(POKEMON_STORE, 'readonly');
    const store = transaction.objectStore(POKEMON_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(new Error('讀取所有 Pokemon 失敗'));
    };
  });
}

/**
 * 獲取 Pokemon 數量
 */
export async function getPokemonCount(): Promise<number> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(POKEMON_STORE, 'readonly');
    const store = transaction.objectStore(POKEMON_STORE);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('計算 Pokemon 數量失敗'));
    };
  });
}

/**
 * 清除所有 Pokemon 資料
 */
export async function clearPokemon(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(POKEMON_STORE, 'readwrite');
    const store = transaction.objectStore(POKEMON_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('清除 Pokemon 資料失敗'));
    };
  });
}

// ============================================================================
// 快取管理
// ============================================================================

/**
 * 檢查快取是否存在且有效
 */
export async function isCacheValid(): Promise<boolean> {
  try {
    const meta = await getCacheMeta();
    if (!meta) {
      return false;
    }

    const status = calculateCacheStatus(meta);
    return status !== 'expired';
  } catch (error) {
    console.error('檢查快取有效性時發生錯誤:', error);
    return false;
  }
}

/**
 * 獲取快取狀態
 */
export async function getCacheStatus(): Promise<CacheStatus> {
  try {
    const meta = await getCacheMeta();
    if (!meta) {
      return 'expired';
    }

    return calculateCacheStatus(meta);
  } catch (error) {
    console.error('獲取快取狀態時發生錯誤:', error);
    return 'expired';
  }
}

/**
 * 初始化快取
 */
export async function initializeCache(pokemonList: Pokemon[]): Promise<void> {
  try {
    // 清除舊資料
    await clearPokemon();

    // 儲存新資料
    await savePokemonBatch(pokemonList);

    // 更新中繼資料
    const meta = createCacheMeta();
    await updateCacheMeta(meta);

    console.log(`快取已初始化，共 ${pokemonList.length} 隻 Pokemon`);
  } catch (error) {
    throw new Error(`初始化快取失敗: ${(error as Error).message}`);
  }
}

/**
 * 更新快取
 */
export async function updateCache(pokemonList: Pokemon[]): Promise<void> {
  try {
    await savePokemonBatch(pokemonList);

    // 更新最後更新時間
    const meta = await getCacheMeta();
    if (meta) {
      meta.lastUpdated = new Date().toISOString();
      meta.status = calculateCacheStatus(meta);
      await updateCacheMeta(meta);
    }

    console.log(`快取已更新，共 ${pokemonList.length} 隻 Pokemon`);
  } catch (error) {
    throw new Error(`更新快取失敗: ${(error as Error).message}`);
  }
}

/**
 * 獲取完整的快取資訊
 */
export async function getCache(): Promise<AppCache | null> {
  try {
    const meta = await getCacheMeta();
    if (!meta) {
      return null;
    }

    const pokemonList = await getAllPokemon();
    const pokemon: Record<number, Pokemon> = {};

    for (const p of pokemonList) {
      pokemon[p.id] = p;
    }

    return {
      version: meta.version,
      pokemon,
      createdAt: meta.createdAt,
      expiresAt: meta.expiresAt,
      status: calculateCacheStatus(meta),
    };
  } catch (error) {
    console.error('獲取快取時發生錯誤:', error);
    return null;
  }
}

/**
 * 清除整個快取（包括中繼資料）
 */
export async function clearCache(): Promise<void> {
  try {
    await clearPokemon();

    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CACHE_META_STORE, 'readwrite');
      const store = transaction.objectStore(CACHE_META_STORE);
      const request = store.delete('meta');

      request.onsuccess = () => {
        console.log('快取已清除');
        resolve();
      };

      request.onerror = () => {
        reject(new Error('清除快取中繼資料失敗'));
      };
    });
  } catch (error) {
    throw new Error(`清除快取失敗: ${(error as Error).message}`);
  }
}

/**
 * 檢查 IndexedDB 支援性
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}
