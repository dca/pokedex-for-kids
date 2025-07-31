'use client';
import React from 'react';
import Link from 'next/link';

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  difficulty: 'easy' | 'medium' | 'hard';
  comingSoon?: boolean;
  color: {
    primary: string;
    secondary: string;
    background: string;
  };
}

const GameCard: React.FC<GameCardProps> = ({ 
  title, 
  description, 
  icon, 
  href, 
  difficulty, 
  comingSoon = false,
  color 
}) => {
  const difficultyColors = {
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#F44336'
  };

  const difficultyLabels = {
    easy: '簡單',
    medium: '中等',
    hard: '困難'
  };

  const CardComponent = comingSoon ? 'div' : Link;
  const cardProps = comingSoon 
    ? { 
        style: {
          display: 'block',
          padding: '24px',
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${color.background} 0%, ${color.background}F0 100%)`,
          border: `2px solid ${color.primary}30`,
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 8px 25px ${color.primary}20`,
          position: 'relative' as const,
          overflow: 'hidden',
          opacity: 0.6,
          cursor: 'not-allowed'
        }
      }
    : {
        href,
        style: {
          display: 'block',
          padding: '24px',
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${color.background} 0%, ${color.background}F0 100%)`,
          border: `2px solid ${color.primary}30`,
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 8px 25px ${color.primary}20`,
          position: 'relative' as const,
          overflow: 'hidden'
        },
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          const target = e.currentTarget as HTMLElement;
          target.style.transform = 'translateY(-8px) scale(1.02)';
          target.style.boxShadow = `0 12px 35px ${color.primary}30`;
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          const target = e.currentTarget as HTMLElement;
          target.style.transform = 'translateY(0) scale(1)';
          target.style.boxShadow = `0 8px 25px ${color.primary}20`;
        }
      };

  return (
    <CardComponent {...cardProps}>
      <div
        style={{
          fontSize: '48px',
          textAlign: 'center' as const,
          marginBottom: '16px',
          filter: `drop-shadow(0 0 10px ${color.primary}40)`
        }}
      >
        {icon}
      </div>
      
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}
      >
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            background: difficultyColors[difficulty],
            padding: '4px 8px',
            borderRadius: '12px',
            textTransform: 'uppercase'
          }}
        >
          {difficultyLabels[difficulty]}
        </span>
      </div>
      
      <p
        style={{
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.5',
          margin: '0 0 16px 0'
        }}
      >
        {description}
      </p>

      {comingSoon && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
          }}
        >
          即將推出
        </div>
      )}
    </CardComponent>
  );
};

const games = [
  {
    title: '記憶配對',
    description: '翻牌找出相同的寶可夢，訓練記憶力和專注力',
    icon: '🧠',
    href: '/games/memory',
    difficulty: 'easy' as const,
    comingSoon: true,
    color: {
      primary: '#9C27B0',
      secondary: '#BA68C8',
      background: '#F3E5F5'
    }
  },
  {
    title: '聲音猜謎',
    description: '聽聲音猜寶可夢，加強聽力學習和記憶連結',
    icon: '🔊',
    href: '/games/audio-quiz',
    difficulty: 'medium' as const,
    comingSoon: true,
    color: {
      primary: '#FF5722',
      secondary: '#FF8A65',
      background: '#FFEBEE'
    }
  },
  {
    title: '拼圖遊戲',
    description: '拼出寶可夢圖片，提升觀察力和手眼協調',
    icon: '🧩',
    href: '/games/puzzle',
    difficulty: 'medium' as const,
    comingSoon: true,
    color: {
      primary: '#2196F3',
      secondary: '#64B5F6',
      background: '#E3F2FD'
    }
  },
  {
    title: '知識測驗',
    description: '回答寶可夢相關問題，測試學習成果',
    icon: '❓',
    href: '/games/quiz',
    difficulty: 'hard' as const,
    comingSoon: true,
    color: {
      primary: '#4CAF50',
      secondary: '#81C784',
      background: '#E8F5E8'
    }
  },
  {
    title: '屬性配對',
    description: '學習寶可夢屬性相剋關係，增強策略思考',
    icon: '⚡',
    href: '/games/type-match',
    difficulty: 'hard' as const,
    comingSoon: true,
    color: {
      primary: '#FF9800',
      secondary: '#FFB74D',
      background: '#FFF3E0'
    }
  },
  {
    title: '反應速度',
    description: '快速點擊指定寶可夢，訓練反應力和注意力',
    icon: '⚡',
    href: '/games/reaction',
    difficulty: 'medium' as const,
    comingSoon: true,
    color: {
      primary: '#E91E63',
      secondary: '#F06292',
      background: '#FCE4EC'
    }
  }
];

export default function GamesPage() {
  return (
    <div
      style={{
        fontFamily: "'Arial', sans-serif",
        background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 25%, #45B7D1 50%, #96CEB4 75%, #FFEAA7 100%)',
        backgroundSize: '400% 400%',
        animation: 'backgroundShift 8s ease-in-out infinite',
        minHeight: '100vh',
        padding: '20px'
      }}
    >
      {/* Header Section */}
      <div
        style={{
          textAlign: 'center' as const,
          marginBottom: '40px',
          padding: '40px 20px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
          borderRadius: '25px',
          backdropFilter: 'blur(15px)',
          border: '2px solid transparent',
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'content-box, border-box',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        }}
      >
        <div
          style={{
            fontSize: '64px',
            marginBottom: '16px'
          }}
        >
          🎮
        </div>
        <h1
          style={{
            fontSize: '48px',
            margin: '0 0 16px 0',
            fontWeight: '800',
            background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6B6B, #4ECDC4, #45B7D1)',
            backgroundSize: '400% 400%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradientShift 3s ease-in-out infinite',
            letterSpacing: '2px'
          }}
        >
          趣味遊戲
        </h1>
        <p
          style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 8px 0',
            fontWeight: '600',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        >
          透過遊戲學習寶可夢知識
        </p>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6'
          }}
        >
          選擇適合的遊戲難度，在遊戲中提升記憶力、反應力和學習效果
        </p>
      </div>

      {/* Games Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {games.map((game, index) => (
          <GameCard key={index} {...game} />
        ))}
      </div>

      {/* Info Section */}
      <div
        style={{
          textAlign: 'center' as const,
          marginTop: '40px',
          padding: '30px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <h2
          style={{
            fontSize: '28px',
            color: 'white',
            marginBottom: '16px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}
        >
          🚀 即將推出更多遊戲
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '0',
            lineHeight: '1.6'
          }}
        >
          我們正在努力開發更多有趣的學習遊戲，讓孩子們在玩樂中學習寶可夢知識！
          <br />
          每個遊戲都經過精心設計，適合不同年齡層的孩子們。
        </p>
      </div>
    </div>
  );
}