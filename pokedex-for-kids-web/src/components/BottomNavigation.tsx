'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: '首頁',
    icon: '🏠',
    path: '/'
  },
  {
    id: 'pokedex',
    label: '圖鑑',
    icon: '📱',
    path: '/pokedex-kids'
  },
  {
    id: 'games',
    label: '遊戲',
    icon: '🎮',
    path: '/games'
  },
  {
    id: 'learning',
    label: '學習',
    icon: '📚',
    path: '/learning'
  },
  {
    id: 'favorites',
    label: '收藏',
    icon: '⭐',
    path: '/favorites'
  }
];

const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const getNavItemStyle = (isActiveItem: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '8px 4px',
    textDecoration: 'none',
    color: isActiveItem ? '#4ECDC4' : '#666',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '12px',
    position: 'relative',
    transform: isActiveItem ? 'translateY(-4px)' : 'none',
    ...(isActiveItem && {
      background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(69, 183, 209, 0.1) 100%)',
      boxShadow: '0 4px 12px rgba(78, 205, 196, 0.2)',
    })
  });

  const getIconStyle = (isActiveItem: boolean): React.CSSProperties => ({
    fontSize: '20px',
    marginBottom: '4px',
    transition: 'all 0.3s ease',
    transform: isActiveItem ? 'scale(1.2)' : 'scale(1)',
    filter: isActiveItem ? 'drop-shadow(0 0 6px rgba(78, 205, 196, 0.4))' : 'none'
  });

  const getLabelStyle = (isActiveItem: boolean): React.CSSProperties => ({
    fontSize: '11px',
    fontWeight: isActiveItem ? '600' : '500',
    lineHeight: '1.2',
    textAlign: 'center',
    letterSpacing: '0.3px'
  });

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 16px',
        zIndex: 1000,
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px'
      }}
      role="navigation"
      aria-label="主導航"
    >
      {navigationItems.map((item) => {
        const isActiveItem = isActive(item.path);
        return (
          <Link
            key={item.id}
            href={item.path}
            style={getNavItemStyle(isActiveItem)}
            aria-label={`前往${item.label}頁面`}
            aria-current={isActiveItem ? 'page' : undefined}
          >
            <span style={getIconStyle(isActiveItem)} aria-hidden="true">
              {item.icon}
            </span>
            <span style={getLabelStyle(isActiveItem)}>
              {item.label}
            </span>
            {isActiveItem && (
              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                  boxShadow: '0 0 8px rgba(78, 205, 196, 0.6)'
                }}
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;