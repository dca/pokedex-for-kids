'use client';
import React from 'react';
import Image from 'next/image'
import pokedex from '@/app/data/base-pokedex.json';
import { styles } from './styles';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface PokemonCardProps {
  pokemon: {
    'index': string;
    'name-tw': string;
    'name-en': string;
  };
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: (pokemonName: string) => void;
}

const PokemonCard = ({ pokemon, isPlaying, isLoading, onPlay }: PokemonCardProps) => {
  const pokemonName = `${pokemon['index']}-${pokemon['name-en']}`;
  
  // 根據Pokemon編號決定主題色彩
  const getThemeColors = () => {
    const index = parseInt(pokemon['index'].replace('#', ''));
    if (index <= 3) return { primary: '#4CAF50', secondary: '#81C784', bg: '#E8F5E8' }; // 草系 - 綠色
    if (index <= 6) return { primary: '#FF5722', secondary: '#FF8A65', bg: '#FFEBEE' }; // 火系 - 紅色
    if (index <= 9) return { primary: '#2196F3', secondary: '#64B5F6', bg: '#E3F2FD' }; // 水系 - 藍色
    if (index <= 12) return { primary: '#9C27B0', secondary: '#BA68C8', bg: '#F3E5F5' }; // 超能力系 - 紫色
    if (index <= 15) return { primary: '#FF9800', secondary: '#FFB74D', bg: '#FFF3E0' }; // 飛行系 - 橙色
    if (index <= 18) return { primary: '#795548', secondary: '#A1887F', bg: '#EFEBE9' }; // 地面系 - 棕色
    if (index <= 21) return { primary: '#607D8B', secondary: '#90A4AE', bg: '#ECEFF1' }; // 鋼系 - 灰色
    return { primary: '#E91E63', secondary: '#F06292', bg: '#FCE4EC' }; // 妖精系 - 粉色
  };
  
  const themeColors = getThemeColors();
  
  // 根據狀態決定樣式
  const getCardStyle = () => {
    const baseStyle = {
      ...styles.pokemonCard,
      background: `linear-gradient(${themeColors.bg}, ${themeColors.bg}) padding-box, linear-gradient(45deg, ${themeColors.primary}, ${themeColors.secondary}) border-box`
    };
    
    if (isPlaying) {
      return { 
        ...baseStyle, 
        ...styles.pokemonCardPlaying,
        background: `linear-gradient(${themeColors.bg}, ${themeColors.bg}) padding-box, linear-gradient(45deg, ${themeColors.primary}, ${themeColors.secondary}) border-box`,
        boxShadow: `0px 20px 40px ${themeColors.primary}40, 0px 0px 20px ${themeColors.primary}30`
      };
    }
    if (isLoading) {
      return { 
        ...baseStyle, 
        ...styles.pokemonCardLoading,
        background: `linear-gradient(${themeColors.bg}, ${themeColors.bg}) padding-box, linear-gradient(45deg, ${themeColors.primary}, ${themeColors.secondary}) border-box`,
        boxShadow: `0px 15px 35px ${themeColors.primary}40, 0px 0px 15px ${themeColors.primary}20`
      };
    }
    return baseStyle;
  };
  
  // 根據主題決定圖片容器樣式
  const getImageContainerStyle = () => {
    return {
      ...styles.pokemonImageContainer,
      background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 50%, ${themeColors.primary} 100%)`,
      boxShadow: `0 0 20px ${themeColors.primary}30`
    };
  };

  const handleClick = () => {
    onPlay(pokemonName);
  };

  return (
    <div 
      style={getCardStyle()}
      onClick={handleClick}
      onTouchStart={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`播放 ${pokemon['name-tw']} (${pokemon['name-en']}) 的發音`}
    >
      <div style={getImageContainerStyle()}>
        <Image 
          style={styles.pokemonImage}
          width={100}
          height={100}
          loading="lazy"
          src={`https://assets.pokemon.com/assets/cms2/img/pokedex/full/${(pokemon['index'].replace('#0', '#').replace('#', ''))}.png`}
          alt={pokemon['name-en']}
        />
      </div>
      
      <div style={styles.pokemonInfo}>
        <div style={styles.pokemonIndex}>{pokemon['index']}</div>
        <div style={styles.pokemonNameTw}>{pokemon['name-tw']}</div>
        <div style={styles.pokemonNameEn}>{pokemon['name-en']}</div>
        <div style={styles.pokemonStatus}>
          {isLoading && '🔄'}
          {isPlaying && '🔊'}
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  const { playAudio, stopAudio, currentPlaying, isLoading, error, isPlaying } = useAudioPlayer();

  const handlePlayAudio = async (pokemonName: string) => {
    try {
      await playAudio(pokemonName);
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.titleContainer}>
        <div style={styles.titleGlow}>Pokédex for Kids</div>
        <h1 style={styles.title}>Pokédex for Kids</h1>
      </div>
      
      {/* 錯誤訊息顯示 */}
      {error && (
        <div style={styles.errorMessage}>
          {error}
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginLeft: '10px',
              padding: '8px 16px',
              backgroundColor: '#c62828',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            重新載入
          </button>
        </div>
      )}

      {/* 全域控制按鈕 */}
      {currentPlaying && (
        <div style={styles.controlPanel}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            🎵 正在播放: {currentPlaying}
          </div>
          <button 
            onClick={stopAudio}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ⏹️ 停止播放
          </button>
        </div>
      )}

      <div style={styles.pokemonGrid}>
        {pokedex.map((pokemon, index) => {
          const pokemonName = `${pokemon['index']}-${pokemon['name-en']}`;
          return (
            <PokemonCard 
              key={index} 
              pokemon={pokemon} 
              isPlaying={isPlaying(pokemonName)}
              isLoading={isLoading && currentPlaying === pokemonName}
              onPlay={handlePlayAudio}
            />
          );
        })}
      </div>
    </div>
  );
}