'use client';
import React from 'react';
import Link from 'next/link';

interface LearningCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  comingSoon?: boolean;
  stats?: {
    total: number;
    learned: number;
  };
  color: {
    primary: string;
    secondary: string;
    background: string;
  };
}

const LearningCard: React.FC<LearningCardProps> = ({ 
  title, 
  description, 
  icon, 
  href, 
  comingSoon = false,
  stats,
  color 
}) => {
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
      
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 12px 0',
          textAlign: 'center' as const
        }}
      >
        {title}
      </h3>
      
      <p
        style={{
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.5',
          margin: '0 0 16px 0',
          textAlign: 'center' as const
        }}
      >
        {description}
      </p>

      {stats && !comingSoon && (
        <div
          style={{
            background: `linear-gradient(90deg, ${color.primary} 0%, ${color.secondary} 100%)`,
            borderRadius: '15px',
            padding: '12px',
            marginTop: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              學習進度
            </span>
            <span
              style={{
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {stats.learned}/{stats.total}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${(stats.learned / stats.total) * 100}%`,
                height: '100%',
                background: 'white',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      )}

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

const learningCategories = [
  {
    title: '按屬性分類',
    description: '學習18種寶可夢屬性，了解每種屬性的特色和代表寶可夢',
    icon: '🔥',
    href: '/learning/types',
    comingSoon: true,
    stats: {
      total: 18,
      learned: 5
    },
    color: {
      primary: '#FF5722',
      secondary: '#FF8A65',
      background: '#FFEBEE'
    }
  },
  {
    title: '按世代分類',
    description: '探索不同世代的寶可夢，從關都到帕底亞的精彩旅程',
    icon: '🌍',
    href: '/learning/generations',
    comingSoon: true,
    stats: {
      total: 9,
      learned: 2
    },
    color: {
      primary: '#2196F3',
      secondary: '#64B5F6',
      background: '#E3F2FD'
    }
  },
  {
    title: '學習進度',
    description: '追蹤你的學習進度，查看已掌握的寶可夢知識',
    icon: '📊',
    href: '/learning/progress',
    comingSoon: true,
    stats: {
      total: 1010,
      learned: 234
    },
    color: {
      primary: '#4CAF50',
      secondary: '#81C784',
      background: '#E8F5E8'
    }
  },
  {
    title: '成就系統',
    description: '解鎖各種學習成就，成為真正的寶可夢大師',
    icon: '🏆',
    href: '/learning/achievements',
    comingSoon: true,
    stats: {
      total: 50,
      learned: 12
    },
    color: {
      primary: '#FFD700',
      secondary: '#FFA500',
      background: '#FFFBF0'
    }
  }
];

export default function LearningPage() {
  return (
    <div
      style={{
        fontFamily: "'Arial', sans-serif",
        background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 25%, #A5D6A7 50%, #C8E6C9 75%, #E8F5E8 100%)',
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
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%), linear-gradient(45deg, #4CAF50, #8BC34A, #CDDC39, #FFC107)',
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
          📚
        </div>
        <h1
          style={{
            fontSize: '48px',
            margin: '0 0 16px 0',
            fontWeight: '800',
            background: 'linear-gradient(45deg, #4CAF50, #8BC34A, #CDDC39, #FFC107)',
            backgroundSize: '400% 400%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradientShift 3s ease-in-out infinite',
            letterSpacing: '2px'
          }}
        >
          學習中心
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
          系統化學習寶可夢知識
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
          按照不同分類方式學習寶可夢，追蹤學習進度，解鎖各種成就
        </p>
      </div>

      {/* Learning Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {learningCategories.map((category, index) => (
          <LearningCard key={index} {...category} />
        ))}
      </div>

      {/* Quick Stats Section */}
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
            marginBottom: '24px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}
        >
          🎯 你的學習統計
        </h2>
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '20px',
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          {[
            { label: '已學習寶可夢', value: '234', icon: '📱' },
            { label: '掌握屬性', value: '5/18', icon: '🔥' },
            { label: '解鎖成就', value: '12', icon: '🏆' },
            { label: '學習天數', value: '15', icon: '📅' }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: '15px',
                padding: '20px',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  marginBottom: '8px'
                }}
              >
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '4px'
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginTop: '24px',
            marginBottom: '0',
            lineHeight: '1.6'
          }}
        >
          繼續努力學習，成為寶可夢大師！<br />
          每天學習一點點，知識就會不斷累積。
        </p>
      </div>
    </div>
  );
}