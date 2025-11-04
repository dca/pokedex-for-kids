'use client';
import React from 'react';
import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: {
    primary: string;
    secondary: string;
    background: string;
  };
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, href, color }) => {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '24px',
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${color.background} 0%, ${color.background}F0 100%)`,
        border: `2px solid ${color.primary}30`,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: `0 8px 25px ${color.primary}20`,
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = 'translateY(-8px) scale(1.02)';
        target.style.boxShadow = `0 12px 35px ${color.primary}30`;
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLElement;
        target.style.transform = 'translateY(0) scale(1)';
        target.style.boxShadow = `0 8px 25px ${color.primary}20`;
      }}
    >
      <div
        style={{
          fontSize: '48px',
          textAlign: 'center',
          marginBottom: '16px',
          filter: `drop-shadow(0 0 10px ${color.primary}40)`
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px',
          textAlign: 'center'
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.5',
          textAlign: 'center',
          margin: 0
        }}
      >
        {description}
      </p>
    </Link>
  );
};

const features = [
  {
    title: '寶可夢圖鑑',
    description: '探索神奇寶貝的世界，聆聽牠們的名字發音',
    icon: '📱',
    href: '/pokedex-kids',
    color: {
      primary: '#4ECDC4',
      secondary: '#45B7D1',
      background: '#E3F9F6'
    }
  },
  {
    title: '趣味遊戲',
    description: '透過遊戲學習，提升記憶力和反應力',
    icon: '🎮',
    href: '/games',
    color: {
      primary: '#FF6B6B',
      secondary: '#FF8E53',
      background: '#FFEBEE'
    }
  },
  {
    title: '學習中心',
    description: '按屬性和世代學習，追蹤學習進度',
    icon: '📚',
    href: '/learning',
    color: {
      primary: '#4CAF50',
      secondary: '#81C784',
      background: '#E8F5E8'
    }
  },
  {
    title: '我的收藏',
    description: '收藏你最喜歡的寶可夢',
    icon: '⭐',
    href: '/favorites',
    color: {
      primary: '#FFD700',
      secondary: '#FFA500',
      background: '#FFFBF0'
    }
  }
];

export default function HomePage() {
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
      {/* Hero Section */}
      <div
        style={{
          textAlign: 'center',
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
          🌟
        </div>
        <h1
          style={{
            fontSize: '48px',
            margin: '0 0 16px 0',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
            backgroundSize: '400% 400%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradientShift 3s ease-in-out infinite',
            letterSpacing: '2px'
          }}
        >
          歡迎來到 Pokédx
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
          專為孩子設計的寶可夢學習樂園
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
          透過互動遊戲、音頻學習和視覺探索，讓孩子在玩樂中學習寶可夢知識
        </p>
      </div>

      {/* Features Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>

      {/* Quick Start Section */}
      <div
        style={{
          textAlign: 'center',
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
          🚀 開始你的寶可夢冒險
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}
        >
          點擊底部導航欄開始探索，或直接前往圖鑑開始學習！
        </p>
        <Link
          href="/pokedex-kids"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '25px',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(78, 205, 196, 0.3)'
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(-2px)';
            target.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.4)';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
          }}
        >
          立即開始 →
        </Link>
      </div>
    </div>
  );
}
