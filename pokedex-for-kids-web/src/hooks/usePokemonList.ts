/**
 * usePokemonList Hook
 * 管理寶可夢列表資料
 */

'use client';

import { useState, useEffect } from 'react';
import type { Pokemon } from '@/types';
import { fetchAllPokemon } from '@/services/pokeapi';
import {
  getAllPokemon,
  initializeCache,
  isCacheValid,
} from '@/services/cache';

interface UsePokemonListReturn {
  pokemon: Pokemon[];
  loading: boolean;
  error: string | null;
  progress: number;
  refetch: () => Promise<void>;
}

export function usePokemonList(): UsePokemonListReturn {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const loadPokemon = async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // 檢查快取
      const cacheValid = await isCacheValid();

      if (cacheValid) {
        // 從快取載入（離線模式）
        const cachedPokemon = await getAllPokemon();
        setPokemon(cachedPokemon);
        setProgress(100);
      } else {
        // 從預先抓取的 JSON 檔案載入（快速啟動）
        setProgress(50);
        const response = await fetch('/pokedex-for-kids/data/pokemon.json');

        if (!response.ok) {
          throw new Error(`無法載入寶可夢資料: HTTP ${response.status}`);
        }

        const pokemonData: Pokemon[] = await response.json();
        setPokemon(pokemonData);
        setProgress(75);

        // 儲存到快取以支援離線存取
        await initializeCache(pokemonData);
        setProgress(100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPokemon();
  }, []);

  return {
    pokemon,
    loading,
    error,
    progress,
    refetch: loadPokemon,
  };
}
