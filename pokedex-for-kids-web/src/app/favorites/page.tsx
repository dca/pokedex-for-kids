'use client';
import React from 'react';
import Link from 'next/link';

export default function FavoritesPage() {
  return (
    <div
      style={{
        fontFamily: "'Arial', sans-serif",
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF6B6B 50%, #4ECDC4 75%, #45B7D1 100%)',
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
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), linear-gradient(45deg, #FFD700, #FFA500, #FF6B6B, #4ECDC4)',
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
          ⭐
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
          我的收藏
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
          收藏你最喜歡的寶可夢
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
          建立你的個人寶可夢收藏清單，隨時回顧你最愛的夥伴
        </p>
      </div>

      {/* Empty State */}
      <div
        style={{
          textAlign: 'center' as const,
          padding: '60px 40px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          borderRadius: '30px',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            fontSize: '120px',
            marginBottom: '24px',
            opacity: 0.7
          }}
        >
          💫
        </div>
        
        <h2
          style={{
            fontSize: '32px',
            margin: '0 0 16px 0',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        >
          還沒有收藏的寶可夢
        </h2>
        
        <p
          style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 32px 0',
            lineHeight: '1.6'
          }}
        >
          快去圖鑑中找到你喜歡的寶可夢，
          <br />
          點擊愛心按鈕將它們加入收藏吧！
        </p>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap' as const
          }}
        >
          <Link
            href="/pokedex-kids"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '25px',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(255, 215, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateY(-3px) scale(1.05)';
              target.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateY(0) scale(1)';
              target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.3)';
            }}
          >
            🔍 開始探索寶可夢
          </Link>
          
          <Link
            href="/games"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
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
              target.style.transform = 'translateY(-3px) scale(1.05)';
              target.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2))';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateY(0) scale(1)';
              target.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))';
            }}
          >
            🎮 先玩遊戲
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          maxWidth: '1000px',
          margin: '40px auto 0'
        }}
      >
        {[
          {
            icon: '❤️',
            title: '收藏功能',
            description: '在圖鑑中點擊愛心按鈕，將喜歡的寶可夢加入收藏清單',
            color: { primary: '#FF6B6B', background: '#FFEBEE' }
          },
          {
            icon: '📋',
            title: '個人清單',
            description: '建立屬於你的寶可夢收藏清單，隨時查看和管理',
            color: { primary: '#4ECDC4', background: '#E0F7FA' }
          },
          {
            icon: '🎯',
            title: '學習重點',
            description: '專注學習你最感興趣的寶可夢，提升學習效率',
            color: { primary: '#FFD700', background: '#FFFBF0' }
          }
        ].map((info, index) => (
          <div
            key={index}
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${info.color.background} 0%, ${info.color.background}F0 100%)`,
              border: `2px solid ${info.color.primary}30`,
              boxShadow: `0 8px 25px ${info.color.primary}20`,
              textAlign: 'center' as const
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}
            >
              {info.icon}
            </div>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                margin: '0 0 12px 0'
              }}
            >
              {info.title}
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.5',
                margin: 0
              }}
            >
              {info.description}
            </p>
          </div>
        ))}
      </div>

      {/* Coming Soon Badge */}
      <div
        style={{
          textAlign: 'center' as const,
          marginTop: '40px'
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 6px 20px rgba(255, 107, 107, 0.3)',
            animation: 'pulse 2s infinite'
          }}
        >
          🌟 收藏功能即將推出
        </div>
      </div>
    </div>
  );
}