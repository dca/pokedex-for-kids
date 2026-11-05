/**
 * PokemonCard 元件
 * 顯示單一寶可夢卡片 - 全新設計
 */

'use client';

import React from 'react';
import Image from 'next/image';
import type { Pokemon } from '@/types';

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick: (pokemonId: number) => void;
  isPlaying?: boolean;
  className?: string;
}

export default function PokemonCard({
  pokemon,
  onClick,
  isPlaying = false,
  className = '',
}: PokemonCardProps) {
  const handleClick = () => {
    onClick(pokemon.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(pokemon.id);
    }
  };

  return (
    <button
      className={`
        group relative overflow-hidden
        bg-white rounded-3xl
        shadow-lg hover:shadow-2xl
        transition-all duration-300 ease-out
        transform hover:scale-105 hover:-rotate-1
        border-4 ${isPlaying ? 'border-yellow-400' : 'border-white'}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${pokemon.name.zh} ${pokemon.name.en}`}
      role="button"
      tabIndex={0}
    >
      {/* 背景裝飾波浪 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
      </div>

      {/* 圖鑑編號徽章 */}
      <div className="absolute top-3 left-3 z-10">
        <div className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg">
          <span className="text-white text-xs font-black tracking-wider">
            #{pokemon.dexNumber}
          </span>
        </div>
      </div>

      {/* 播放動畫指示器 */}
      {isPlaying && (
        <div className="absolute top-3 right-3 z-10">
          <div className="relative">
            {/* 脈動圓環 */}
            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping" />
            {/* 音樂圖示 */}
            <div className="relative w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* 主要內容區 */}
      <div className="relative px-4 pt-16 pb-4">
        {/* 寶可夢圖片 */}
        <div className="relative mb-4">
          {/* 圖片底部陰影效果 */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-gradient-to-b from-gray-300/50 to-transparent rounded-full blur-xl" />

          {/* 圖片容器 */}
          <div className="relative flex items-center justify-center h-40 group-hover:scale-110 transition-transform duration-300">
            <Image
              src={pokemon.sprites.official || pokemon.sprites.icon}
              alt={pokemon.name.en}
              width={160}
              height={160}
              className="object-contain drop-shadow-2xl"
              loading="lazy"
            />
          </div>
        </div>

        {/* 名稱標籤 */}
        <div className="space-y-2">
          {/* 英文名稱 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl py-2 px-4 shadow-md">
            <p className="text-white text-lg font-black text-center tracking-wide">
              {pokemon.name.en}
            </p>
          </div>

          {/* 中文名稱 */}
          <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl py-2 px-4 shadow-md">
            <p className="text-white text-base font-bold text-center">
              {pokemon.name.zh}
            </p>
          </div>
        </div>
      </div>

      {/* 點擊波紋效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-orange-500/0 group-hover:from-yellow-400/20 group-hover:to-orange-500/20 transition-all duration-300 rounded-3xl" />
    </button>
  );
}
