/**
 * LoadingSpinner 元件
 * 顯示載入動畫 - 使用 Naive UI 設計
 */

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  message = '載入中...',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* 精靈球動畫 */}
      <div className="relative w-24 h-24 mb-6">
        {/* 外圈旋轉 */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 border-r-red-500 animate-spin" />

        {/* 中圈旋轉 */}
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-blue-500 border-l-blue-500 animate-spin-slow" />

        {/* 內圈脈動 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-blue-500 animate-pulse shadow-lg" />
        </div>

        {/* 光暈效果 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-200/30 to-blue-200/30 blur-xl animate-pulse" />
      </div>

      {/* 載入文字 */}
      {message && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-bold text-gray-800 animate-pulse">
            {message}
          </p>

          {/* 點點點動畫 */}
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}
