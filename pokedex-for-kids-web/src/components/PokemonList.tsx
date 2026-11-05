/**
 * PokemonList 元件
 * 使用虛擬滾動顯示寶可夢列表
 */

'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Pokemon } from '@/types';
import PokemonCard from './PokemonCard';

interface PokemonListProps {
  pokemon: Pokemon[];
  onPokemonClick: (pokemonId: number) => void;
  playingPokemonId: number | null;
  className?: string;
}

export default function PokemonList({
  pokemon,
  onPokemonClick,
  playingPokemonId,
  className = '',
}: PokemonListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // 計算每行顯示數量（響應式）
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 640) return 2; // mobile
    if (width < 1024) return 3; // tablet
    return 4; // desktop
  };

  const columnCount = getColumnCount();
  const rowCount = Math.ceil(pokemon.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  if (pokemon.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        沒有找到寶可夢
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount;
          const rowPokemon = pokemon.slice(startIndex, startIndex + columnCount);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {rowPokemon.map((p) => (
                  <PokemonCard
                    key={p.id}
                    pokemon={p}
                    onClick={onPokemonClick}
                    isPlaying={playingPokemonId === p.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
