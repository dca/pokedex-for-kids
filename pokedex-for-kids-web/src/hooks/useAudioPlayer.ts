import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioPlayerState {
  currentPlaying: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AudioPlayerHook extends AudioPlayerState {
  playAudio: (pokemonName: string) => Promise<void>;
  stopAudio: () => void;
  isPlaying: (pokemonName: string) => boolean;
}

export const useAudioPlayer = (): AudioPlayerHook => {
  const [state, setState] = useState<AudioPlayerState>({
    currentPlaying: null,
    isLoading: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioSrc = useRef<string | null>(null);

  // 音頻播放結束處理
  const handleAudioEnded = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPlaying: null,
      isLoading: false,
      error: null,
    }));
  }, []);

  // 音頻錯誤處理
  const handleAudioError = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPlaying: null,
      isLoading: false,
      error: '音頻播放失敗，請稍後再試',
    }));
  }, []);

  // 音頻開始載入
  const handleAudioLoadStart = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
  }, []);

  // 音頻可以播放
  const handleAudioCanPlay = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: null,
    }));
  }, []);

  // 清理音頻資源
  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleAudioEnded);
      audioRef.current.removeEventListener('error', handleAudioError);
      audioRef.current.removeEventListener('loadstart', handleAudioLoadStart);
      audioRef.current.removeEventListener('canplaythrough', handleAudioCanPlay);
      audioRef.current = null;
    }
    currentAudioSrc.current = null;
  }, [handleAudioEnded, handleAudioError, handleAudioLoadStart, handleAudioCanPlay]);

  // 播放音頻
  const playAudio = useCallback(async (pokemonName: string): Promise<void> => {
    try {
      // 如果正在播放相同的音頻，直接返回
      if (state.currentPlaying === pokemonName && audioRef.current && !audioRef.current.paused) {
        return;
      }

      // 構建音頻文件路徑
      const audioSrc = `mp3/${pokemonName.replace('#', '')}.mp3`;

      // 如果是相同的音頻源但已暫停，直接播放
      if (currentAudioSrc.current === audioSrc && audioRef.current) {
        setState(prev => ({ ...prev, currentPlaying: pokemonName, error: null }));
        await audioRef.current.play();
        return;
      }

      // 清理之前的音頻
      cleanupAudio();

      // 創建新的音頻元素
      audioRef.current = new Audio(audioSrc);
      currentAudioSrc.current = audioSrc;

      // 添加事件監聽器
      audioRef.current.addEventListener('ended', handleAudioEnded);
      audioRef.current.addEventListener('error', handleAudioError);
      audioRef.current.addEventListener('loadstart', handleAudioLoadStart);
      audioRef.current.addEventListener('canplaythrough', handleAudioCanPlay);

      // 設置狀態
      setState(prev => ({
        ...prev,
        currentPlaying: pokemonName,
        isLoading: true,
        error: null,
      }));

      // 播放音頻
      await audioRef.current.play();

    } catch (error) {
      console.error('Audio playback failed:', error);
      setState(prev => ({
        ...prev,
        currentPlaying: null,
        isLoading: false,
        error: '音頻播放失敗，請稍後再試',
      }));
    }
  }, [state.currentPlaying, cleanupAudio, handleAudioEnded, handleAudioError, handleAudioLoadStart, handleAudioCanPlay]);

  // 停止音頻
  const stopAudio = useCallback(() => {
    cleanupAudio();
    setState(prev => ({
      ...prev,
      currentPlaying: null,
      isLoading: false,
      error: null,
    }));
  }, [cleanupAudio]);

  // 檢查是否正在播放指定音頻
  const isPlaying = useCallback((pokemonName: string): boolean => {
    return state.currentPlaying === pokemonName && !state.isLoading;
  }, [state.currentPlaying, state.isLoading]);

  // 組件卸載時清理資源
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    ...state,
    playAudio,
    stopAudio,
    isPlaying,
  };
};