/**
 * useAudioPlayer Hook
 * 管理音訊播放邏輯
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { Pokemon, LanguagePreference, AudioPlaybackState } from '@/types';
import { speakPokemonName, stopSpeech, isSpeechSynthesisSupported } from '@/services/speech';

interface UseAudioPlayerReturn {
  playbackState: AudioPlaybackState;
  play: (pokemon: Pokemon) => Promise<void>;
  stop: () => void;
  isSpeechSupported: boolean;
}

export function useAudioPlayer(
  languagePreference: LanguagePreference
): UseAudioPlayerReturn {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    status: 'idle',
    currentPokemonId: null,
    currentLanguage: null,
    error: null,
  });

  const currentPlaybackRef = useRef<number | null>(null);

  const play = useCallback(
    async (pokemon: Pokemon) => {
      try {
        // 停止當前播放
        stopSpeech();

        // 更新狀態
        setPlaybackState({
          status: 'loading',
          currentPokemonId: pokemon.id,
          currentLanguage: null,
          error: null,
        });

        currentPlaybackRef.current = pokemon.id;

        // 播放音訊
        setPlaybackState(prev => ({ ...prev, status: 'playing' }));

        await speakPokemonName(
          pokemon.name.en,
          pokemon.name.zh,
          languagePreference
        );

        // 只有當前播放未被中斷時才更新為 idle
        if (currentPlaybackRef.current === pokemon.id) {
          setPlaybackState({
            status: 'idle',
            currentPokemonId: null,
            currentLanguage: null,
            error: null,
          });
        }
      } catch (error) {
        if (currentPlaybackRef.current === pokemon.id) {
          setPlaybackState({
            status: 'error',
            currentPokemonId: pokemon.id,
            currentLanguage: null,
            error: error instanceof Error ? error.message : '播放失敗',
          });
        }
      }
    },
    [languagePreference]
  );

  const stop = useCallback(() => {
    stopSpeech();
    currentPlaybackRef.current = null;
    setPlaybackState({
      status: 'idle',
      currentPokemonId: null,
      currentLanguage: null,
      error: null,
    });
  }, []);

  return {
    playbackState,
    play,
    stop,
    isSpeechSupported: isSpeechSynthesisSupported(),
  };
}
