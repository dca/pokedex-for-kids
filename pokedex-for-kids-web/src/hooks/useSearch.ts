/**
 * useSearch Hook
 * 管理搜尋邏輯
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Pokemon } from '@/types';
import { quickSearchPokemon } from '@/utils/search';
import { debounce } from '@/utils/performance';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  filteredPokemon: Pokemon[];
  isSearching: boolean;
  clearSearch: () => void;
}

export function useSearch(allPokemon: Pokemon[]): UseSearchReturn {
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 防抖搜尋
  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery) => {
        setDebouncedQuery(searchQuery as string);
        setIsSearching(false);
      }, 300),
    []
  );

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);
      setIsSearching(true);
      debouncedSearch(newQuery);
    },
    [debouncedSearch]
  );

  const filteredPokemon = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return allPokemon;
    }
    return quickSearchPokemon(allPokemon, debouncedQuery);
  }, [allPokemon, debouncedQuery]);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, []);

  return {
    query,
    setQuery,
    filteredPokemon,
    isSearching,
    clearSearch,
  };
}
