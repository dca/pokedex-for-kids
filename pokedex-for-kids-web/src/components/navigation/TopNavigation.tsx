'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationItem {
  id: string;
  label: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'home', label: '首頁', path: '/' },
  { id: 'pokedex', label: '圖鑑', path: '/pokedex-kids' },
  { id: 'games', label: '遊戲', path: '/games' },
  { id: 'learning', label: '學習', path: '/learning' }
];

const styles = {
  navbar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    fontFamily: "'Arial', sans-serif"
  },
  navbarTransparent: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
  },
  navbarScrolled: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(15px)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '800' as const,
    color: '#333',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoTransparent: {
    color: '#333',
    textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
  },
  logoScrolled: {
    color: '#333'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    listStyle: 'none',
    margin: 0,
    padding: 0
  },
  navItem: {
    position: 'relative' as const,
    fontSize: '16px',
    fontWeight: '500' as const,
    color: '#333',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: '8px 0'
  },
  navItemScrolled: {
    color: '#333'
  },
  navItemTransparent: {
    color: '#333',
    textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
  },
  navItemActive: {
    color: '#FF6B6B'
  },
  navItemUnderline: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: '#FF6B6B',
    borderRadius: '2px',
    transform: 'scaleX(0)',
    transformOrigin: 'center',
    transition: 'transform 0.3s ease'
  },
  navItemUnderlineActive: {
    transform: 'scaleX(1)'
  },
  favoriteButton: {
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    background: 'transparent',
    border: 'none'
  },
  favoriteButtonHover: {
    background: 'rgba(255, 234, 167, 0.3)',
    transform: 'rotate(15deg) scale(1.1)'
  }
};


export default function TopNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isFavoriteHovered, setIsFavoriteHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <nav style={{
      ...styles.navbar,
      ...(isScrolled ? styles.navbarScrolled : styles.navbarTransparent)
    }}>
      {/* Logo */}
      <div 
        style={{
          ...styles.logo,
          ...(isScrolled ? styles.logoScrolled : styles.logoTransparent)
        }}
        onClick={() => handleNavigation('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNavigation('/');
          }
        }}
        aria-label="回到首頁"
      >
        <span style={{ fontSize: '28px' }}>⚡</span>
        <span>Pokédex</span>
      </div>

      {/* Navigation Links */}
      <ul style={styles.navLinks}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          const isHovered = hoveredItem === item.id;

          return (
            <li key={item.id}>
              <div
                style={{
                  ...styles.navItem,
                  ...(isScrolled ? styles.navItemScrolled : styles.navItemTransparent),
                  ...(isActive && styles.navItemActive),
                  transform: isHovered ? 'translateY(-2px)' : 'none'
                }}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavigation(item.path);
                  }
                }}
                aria-label={`前往${item.label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
                <div 
                  style={{
                    ...styles.navItemUnderline,
                    ...(isActive || isHovered ? styles.navItemUnderlineActive : {})
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Favorite Button */}
      <button
        style={{
          ...styles.favoriteButton,
          ...(isFavoriteHovered ? styles.favoriteButtonHover : {})
        }}
        onClick={() => handleNavigation('/favorites')}
        onMouseEnter={() => setIsFavoriteHovered(true)}
        onMouseLeave={() => setIsFavoriteHovered(false)}
        aria-label="我的收藏"
      >
        ⭐
      </button>
    </nav>
  );
}