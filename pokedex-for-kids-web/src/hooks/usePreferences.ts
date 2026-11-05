/**
 * usePreferences Hook
 * 管理使用者語言偏好
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LanguagePreference } from '@/types';
import { DEFAULT_LANGUAGE_PREFERENCE } from '@/types';
import { STORAGE_KEYS } from '@/constants/languages';

export function usePreferences() {
  const [preference, setPreferenceState] = useState<LanguagePreference>(
    DEFAULT_LANGUAGE_PREFERENCE
  );
  const [loading, setLoading] = useState(true);

  // 載入偏好設定
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE_PREFERENCE);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferenceState(parsed);
      }
    } catch (error) {
      console.error('載入語言偏好失敗:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新偏好設定
  const setPreference = useCallback((newPreference: LanguagePreference) => {
    try {
      const updated = {
        ...newPreference,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(
        STORAGE_KEYS.LANGUAGE_PREFERENCE,
        JSON.stringify(updated)
      );
      setPreferenceState(updated);
    } catch (error) {
      console.error('儲存語言偏好失敗:', error);
    }
  }, []);

  return {
    preference,
    setPreference,
    loading,
  };
}
