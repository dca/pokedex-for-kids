'use client';
import React from 'react';
import Link from 'next/link';

export default function ReactionPage() {
  return (
    <div
      style={{
        fontFamily: "'Arial', sans-serif",
        background: 'linear-gradient(135deg, #E91E63 0%, #F06292 25%, #F48FB1 50%, #F8BBD9 75%, #FCE4EC 100%)',
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
          maxWidth: '600px',
          width: '100%'
        }}
      >
        <div
          style={{
            fontSize: '120px',
            marginBottom: '24px',
            animation: 'shake 1.5s ease-in-out infinite'
          }}
        >
          ⚡
        </div>
        
        <h1
          style={{
            fontSize: '42px',
            margin: '0 0 16px 0',
            fontWeight: '800',
            background: 'linear-gradient(45deg, #E91E63, #EC407A, #F06292, #FF4081)',
            backgroundSize: '400% 400%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradientShift 3s ease-in-out infinite',
            letterSpacing: '1px'
          }}
        >
          反應速度遊戲
        </h1>
        
        <div
          style={{
            display: 'inline-block',
            background: 'linear-gradient(45deg, #E91E63, #F06292)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '24px',
            boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)'
          }}
        >
          🌟 即將推出
        </div>
        
        <p
          style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 16px 0',
            fontWeight: '600',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            lineHeight: '1.4'
          }}
        >
          快速點擊指定寶可夢
        </p>
        
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 32px 0',
            lineHeight: '1.6'
          }}
        >
          通過反應速度訓練提升注意力和反應能力，
          <br />
          在快節奏遊戲中挑戰自己的極限！
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
            href="/games"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(45deg, #E91E63, #F06292)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '25px',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 6px 20px rgba(233, 30, 99, 0.4)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 15px rgba(233, 30, 99, 0.3)';
            }}
          >
            ← 返回遊戲選單
          </Link>
          
          <Link
            href="/pokedex-kids"
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
            前往圖鑑 →
          </Link>
        </div>
      </div>
    </div>
  );
}