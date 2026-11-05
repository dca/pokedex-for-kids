/**
 * LanguageSelector 元件
 * 語言模式選擇器 - 使用 Naive UI 設計
 */

'use client';

import React from 'react';
import type { LanguageMode } from '@/types';
import { LANGUAGE_MODE_LABELS, LANGUAGE_MODE_DESCRIPTIONS } from '@/constants/languages';

interface LanguageSelectorProps {
  value: LanguageMode;
  onChange: (mode: LanguageMode) => void;
  className?: string;
}

export default function LanguageSelector({
  value,
  onChange,
  className = '',
}: LanguageSelectorProps) {
  const modes: Array<{ value: LanguageMode; icon: string }> = [
    { value: 'zh-only', icon: '🇹🇼' },
    { value: 'en-only', icon: '🇺🇸' },
    { value: 'both', icon: '🌍' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">語言播放模式</h3>
          <p className="text-sm text-gray-600">選擇您偏好的語音播放方式</p>
        </div>
      </div>

      <div className="grid gap-4">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={`
              group relative overflow-hidden
              flex items-start p-5 rounded-2xl
              border-2 transition-all duration-200
              ${value === mode.value
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg ring-4 ring-blue-100'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }
            `}
          >
            {/* 選中指示器 */}
            <div className={`
              w-6 h-6 rounded-full mr-4 flex-shrink-0 flex items-center justify-center
              border-2 transition-all duration-200
              ${value === mode.value
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300 bg-white group-hover:border-blue-300'
              }
            `}>
              {value === mode.value && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* 內容 */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{mode.icon}</span>
                <span className={`font-bold text-lg ${
                  value === mode.value ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {LANGUAGE_MODE_LABELS[mode.value]}
                </span>
              </div>
              <p className={`text-sm ${
                value === mode.value ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {LANGUAGE_MODE_DESCRIPTIONS[mode.value]}
              </p>
            </div>

            {/* 選中徽章 */}
            {value === mode.value && (
              <div className="absolute top-3 right-3">
                <div className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                  已選擇
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
