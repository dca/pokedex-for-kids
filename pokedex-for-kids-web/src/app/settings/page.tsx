/**
 * 設定頁面
 * 語言偏好設定 - 使用 Naive UI 設計
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePreferences } from '@/hooks/usePreferences';
import LanguageSelector from '@/components/LanguageSelector';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { LanguageMode } from '@/types';

export default function SettingsPage() {
  const { preference, setPreference, loading } = usePreferences();

  const handleModeChange = (mode: LanguageMode) => {
    const updated = {
      ...preference,
      mode,
      playbackOrder:
        mode === 'both'
          ? {
              first: 'en' as const,
              delay: 800,
            }
          : undefined,
    };
    setPreference(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <LoadingSpinner message="載入設定中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 標題列 */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">設定</h1>
                <p className="text-sm text-white/80">自訂您的語音圖鑑體驗</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 設定內容 */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* 語言設定卡片 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
            <LanguageSelector
              value={preference.mode}
              onChange={handleModeChange}
            />
          </div>

          {/* 音量控制卡片 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">音量控制</h3>
                <p className="text-sm text-gray-600">調整語音播放音量</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 音量滑桿 */}
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preference.volume * 100}
                  onChange={(e) =>
                    setPreference({
                      ...preference,
                      volume: parseInt(e.target.value) / 100,
                    })
                  }
                  className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-500"
                  style={{
                    background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${preference.volume * 100}%, rgb(229, 231, 235) ${preference.volume * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
              </div>

              {/* 音量顯示 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    preference.volume === 0 ? 'bg-gray-200' :
                    preference.volume < 0.5 ? 'bg-yellow-100' :
                    'bg-green-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      preference.volume === 0 ? 'text-gray-500' :
                      preference.volume < 0.5 ? 'text-yellow-600' :
                      'text-green-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {preference.volume === 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      ) : preference.volume < 0.5 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m-9.95-1.536H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      )}
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {preference.volume === 0 ? '靜音' :
                     preference.volume < 0.5 ? '低音量' :
                     '高音量'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {Math.round(preference.volume * 100)}
                    <span className="text-lg text-gray-600 ml-1">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 使用說明卡片 */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-lg p-8 border-2 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-blue-900">使用說明</h4>
            </div>
            <ul className="space-y-3">
              {[
                { icon: '👆', text: '點擊任何寶可夢卡片即可播放名稱' },
                { icon: '🌍', text: '選擇「中英文」模式會先播放英文，間隔 800 毫秒後播放中文' },
                { icon: '🔍', text: '使用搜尋列可以快速找到特定寶可夢' },
                { icon: '📱', text: '支援響應式設計，手機和平板都能完美體驗' },
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-blue-800">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <span className="text-sm font-medium pt-1">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
