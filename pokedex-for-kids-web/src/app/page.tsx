/**
 * 首頁
 * 顯示寶可夢列表 - 全新活潑設計
 */

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePokemonList } from '@/hooks/usePokemonList';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useSearch } from '@/hooks/useSearch';
import { usePreferences } from '@/hooks/usePreferences';
import PokemonList from '@/components/PokemonList';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { initializeSpeechAPI } from '@/services/speech';

export default function Home() {
  const { pokemon, loading, error, progress } = usePokemonList();
  const { preference, loading: prefLoading } = usePreferences();
  const { query, setQuery, filteredPokemon, clearSearch } = useSearch(pokemon);
  const { playbackState, play, isSpeechSupported } = useAudioPlayer(preference);

  // 初始化 Speech API
  useEffect(() => {
    initializeSpeechAPI();
  }, []);

  const handlePokemonClick = async (pokemonId: number) => {
    const targetPokemon = pokemon.find((p) => p.id === pokemonId);
    if (targetPokemon) {
      await play(targetPokemon);
    }
  };

  if (loading || prefLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-300 via-red-300 to-pink-400">
        <LoadingSpinner message={`載入中... ${progress}%`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-400 to-orange-500">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-4 border-red-500">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 border-4 border-red-500">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-red-800 mb-3 text-center">載入失敗</h2>
          <p className="text-red-600 mb-6 text-center font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-lg rounded-2xl hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🔄 重新載入
          </button>
        </div>
      </div>
    );
  }

  if (!isSpeechSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-300 to-orange-400">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-4 border-yellow-500">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-100 border-4 border-yellow-500">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-yellow-800 mb-3 text-center">
            瀏覽器不支援
          </h2>
          <p className="text-yellow-700 text-center font-bold">
            您的瀏覽器不支援語音播放功能。請使用 Chrome、Edge 或 Safari 瀏覽器。
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-300 via-red-300 to-pink-400">
        {/* 超級標題列 */}
        <header className="relative bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 text-white shadow-2xl overflow-hidden">
          {/* 裝飾性波浪 */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="container mx-auto px-4 py-6 relative z-10">
            <div className="flex items-center justify-between">
              {/* Logo 和標題 */}
              <div className="flex items-center gap-4">
                {/* 精靈球 Logo */}
                <div className="relative w-16 h-16 bg-white rounded-full shadow-xl border-4 border-gray-900 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-1/2 h-1.5 bg-gray-900 transform -translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-white rounded-full border-3 border-gray-900 transform -translate-x-1/2 -translate-y-1/2 shadow-inner" />
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-lg">
                    🎮 寶可夢圖鑑 🎮
                  </h1>
                  <p className="text-sm md:text-base font-bold text-yellow-100 drop-shadow">
                    ✨ 點擊寶可夢聽發音！✨
                  </p>
                </div>
              </div>

              {/* 設定按鈕 */}
              <Link
                href="/settings"
                className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-2xl transition-all duration-200 font-black hover:scale-110 shadow-lg border-2 border-white/50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline text-lg">設定</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 搜尋列區域 */}
        <div className="bg-white/90 backdrop-blur-md border-b-4 border-yellow-400 shadow-xl sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4">
            <SearchBar
              value={query}
              onChange={setQuery}
              onClear={clearSearch}
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
                  <span className="text-white font-black text-lg">
                    🎯 {filteredPokemon.length} 隻
                  </span>
                </div>
                {query && (
                  <div className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full shadow-lg animate-pulse">
                    <span className="text-white font-bold text-sm">
                      🔍 搜尋中...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 寶可夢列表 */}
        <main className="flex-1 overflow-hidden">
          <PokemonList
            pokemon={filteredPokemon}
            onPokemonClick={handlePokemonClick}
            playingPokemonId={playbackState.currentPokemonId}
            className="h-full"
          />
        </main>

        {/* 錯誤提示浮動通知 */}
        {playbackState.error && (
          <div className="fixed bottom-6 right-6 max-w-sm bg-white rounded-2xl shadow-2xl p-5 border-4 border-red-500 animate-bounce z-50">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">{playbackState.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 底部裝飾波浪 */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" />
      </div>
    </ErrorBoundary>
  );
}
