/**
 * SearchBar 元件
 * 搜尋列 - 全新活潑設計
 */

'use client';

import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = '🔍 搜尋寶可夢（中文或英文）...',
  className = '',
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* 輸入框 */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            w-full px-6 py-5
            text-lg font-bold
            bg-white
            border-4 border-gray-900
            rounded-3xl
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            focus:outline-none
            focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
            focus:translate-x-[-2px]
            focus:translate-y-[-2px]
            transition-all duration-200
            placeholder:text-gray-400
            placeholder:font-bold
          "
          aria-label="搜尋寶可夢"
        />

        {/* 清除按鈕 */}
        {value && (
          <button
            onClick={onClear}
            className="
              absolute right-3 top-1/2 transform -translate-y-1/2
              w-12 h-12
              flex items-center justify-center
              text-white
              bg-gradient-to-br from-red-500 to-pink-600
              hover:from-red-600 hover:to-pink-700
              rounded-full
              border-3 border-gray-900
              shadow-lg
              transition-all duration-200
              hover:scale-110
              font-black text-xl
            "
            aria-label="清除搜尋"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
