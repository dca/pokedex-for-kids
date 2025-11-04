'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import pokedex from '@/app/data/base-pokedex.json';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface PokemonDetailPageProps {}

export default function PokemonDetailPage({}: PokemonDetailPageProps) {
  const params = useParams();
  const pokemonId = params.id as string;
  const { playAudio, isPlaying, isLoading, error } = useAudioPlayer();

  // Find the Pokemon by ID
  const pokemon = pokedex.find(p => p['index'] === `#${pokemonId.padStart(4, '0')}`);

  if (!pokemon) {
    return (
      <div
        style={{
          fontFamily: "'Arial', sans-serif",
          background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 25%, #45B7D1 50%, #96CEB4 75%, #FFEAA7 100%)',
          backgroundSize: '400% 400%',
          animation: 'backgroundShift 8s ease-in-out infinite',
          minHeight: '100vh',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            textAlign: 'center' as const,
            padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
            borderRadius: '30px',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            maxWidth: '500px',
            width: '100%'
          }}
        >
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>❓</div>
          <h1
            style={{
              fontSize: '32px',
              margin: '0 0 16px 0',
              fontWeight: '700',
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            找不到這隻寶可夢
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 32px 0',
              lineHeight: '1.6'
            }}
          >
            編號 #{pokemonId} 的寶可夢不存在，
            <br />
            請檢查編號是否正確。
          </p>
          <Link
            href="/pokedex-kids"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '25px',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(78, 205, 196, 0.3)'
            }}
          >
            ← 返回圖鑑
          </Link>
        </div>
      </div>
    );
  }

  const pokemonName = `${pokemon['index']}-${pokemon['name-en']}`;
  
  // Theme colors based on Pokemon index
  const getThemeColors = () => {
    const index = parseInt(pokemon['index'].replace('#', ''));
    if (index <= 3) return { primary: '#4CAF50', secondary: '#81C784', bg: '#E8F5E8' }; // Grass
    if (index <= 6) return { primary: '#FF5722', secondary: '#FF8A65', bg: '#FFEBEE' }; // Fire
    if (index <= 9) return { primary: '#2196F3', secondary: '#64B5F6', bg: '#E3F2FD' }; // Water
    if (index <= 12) return { primary: '#9C27B0', secondary: '#BA68C8', bg: '#F3E5F5' }; // Psychic
    if (index <= 15) return { primary: '#FF9800', secondary: '#FFB74D', bg: '#FFF3E0' }; // Flying
    if (index <= 18) return { primary: '#795548', secondary: '#A1887F', bg: '#EFEBE9' }; // Ground
    if (index <= 21) return { primary: '#607D8B', secondary: '#90A4AE', bg: '#ECEFF1' }; // Steel
    return { primary: '#E91E63', secondary: '#F06292', bg: '#FCE4EC' }; // Fairy
  };
  
  const themeColors = getThemeColors();

  const handlePlayAudio = async () => {
    try {
      await playAudio(pokemonName);
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Arial', sans-serif",
        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 50%, ${themeColors.bg} 100%)`,
        backgroundSize: '400% 400%',
        animation: 'backgroundShift 8s ease-in-out infinite',
        minHeight: '100vh',
        padding: '20px'
      }}
    >
      {/* Back Button */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          href="/pokedex-kids"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2))';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))';
          }}
        >
          ← 返回圖鑑
        </Link>
      </div>

      {/* Pokemon Detail Card */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
          borderRadius: '30px',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          overflow: 'hidden'
        }}
      >
        {/* Header Section */}
        <div
          style={{
            textAlign: 'center' as const,
            padding: '40px 30px 30px',
            background: `linear-gradient(135deg, ${themeColors.primary}20 0%, ${themeColors.secondary}10 100%)`
          }}
        >
          <div
            style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 40px ${themeColors.primary}40`,
              position: 'relative' as const,
              overflow: 'hidden'
            }}
          >
            <Image 
              style={{
                width: '160px',
                height: '160px',
                objectFit: 'contain'
              }}
              width={160}
              height={160}
              loading="lazy"
              src={`https://assets.pokemon.com/assets/cms2/img/pokedex/full/${pokemon['index'].replace('#0', '#').replace('#', '')}.png`}
              alt={pokemon['name-en']}
            />
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '8px'
            }}
          >
            {pokemon['index']}
          </div>

          <h1
            style={{
              fontSize: '48px',
              margin: '0 0 8px 0',
              fontWeight: '800',
              background: 'linear-gradient(45deg, white, rgba(255, 255, 255, 0.8))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            {pokemon['name-tw']}
          </h1>

          <div
            style={{
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '24px',
              fontWeight: '500'
            }}
          >
            {pokemon['name-en']}
          </div>

          {/* Audio Button */}
          <button
            onClick={handlePlayAudio}
            disabled={isLoading}
            style={{
              padding: '16px 32px',
              background: `linear-gradient(45deg, ${themeColors.primary}, ${themeColors.secondary})`,
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: `0 6px 20px ${themeColors.primary}40`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 auto',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'translateY(-2px)';
                target.style.boxShadow = `0 8px 25px ${themeColors.primary}50`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = `0 6px 20px ${themeColors.primary}40`;
              }
            }}
          >
            {isLoading ? (
              <>🔄 載入中...</>
            ) : isPlaying(pokemonName) ? (
              <>🔊 播放中</>
            ) : (
              <>🎵 聽發音</>
            )}
          </button>

          {error && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(244, 67, 54, 0.2)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div style={{ padding: '30px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}
          >
            {/* Basic Info Card */}
            <div
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '16px',
                  textAlign: 'center' as const
                }}
              >
                📋 基本資訊
              </h3>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.8' }}>
                <div><strong>編號：</strong>{pokemon['index']}</div>
                <div><strong>中文名：</strong>{pokemon['name-tw']}</div>
                <div><strong>英文名：</strong>{pokemon['name-en']}</div>
              </div>
            </div>

            {/* Coming Soon Card */}
            <div
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center' as const
              }}
            >
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '16px'
                }}
              >
                🔮 更多資訊
              </h3>
              <div
                style={{
                  background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '12px'
                }}
              >
                即將推出
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                屬性、身高、體重、<br />
                特性等詳細資訊
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div
        style={{
          maxWidth: '800px',
          margin: '30px auto 0',
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap' as const
        }}
      >
        <Link
          href="/favorites"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '25px',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(-2px)';
            target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
          }}
        >
          ⭐ 加入收藏
        </Link>
        
        <Link
          href="/games"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '25px',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'all 0.3s ease',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(-2px)';
            target.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2))';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(0)';
            target.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))';
          }}
        >
          🎮 玩遊戲
        </Link>
      </div>
    </div>
  );
}