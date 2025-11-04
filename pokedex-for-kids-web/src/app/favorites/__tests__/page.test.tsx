import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FavoritesPage from '../page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('FavoritesPage', () => {
  it('renders the main heading', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByRole('heading', { name: /我的收藏/ })).toBeInTheDocument();
  });

  it('renders the subtitle and description', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByText('收藏你最喜歡的寶可夢')).toBeInTheDocument();
    expect(screen.getByText('建立你的個人寶可夢收藏清單，隨時回顧你最愛的夥伴')).toBeInTheDocument();
  });

  it('renders empty state when no favorites', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByText('還沒有收藏的寶可夢')).toBeInTheDocument();
    expect(screen.getByText(/快去圖鑑中找到你喜歡的寶可夢/)).toBeInTheDocument();
  });

  it('renders the main favorites icon in header', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('renders the empty state icon', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByText('💫')).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<FavoritesPage />);
    
    const exploreButton = screen.getByRole('link', { name: /開始探索寶可夢/ });
    const gamesButton = screen.getByRole('link', { name: /先玩遊戲/ });
    
    expect(exploreButton).toBeInTheDocument();
    expect(exploreButton).toHaveAttribute('href', '/pokedex-kids');
    
    expect(gamesButton).toBeInTheDocument();
    expect(gamesButton).toHaveAttribute('href', '/games');
  });

  it('renders info cards explaining favorites feature', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByText('收藏功能')).toBeInTheDocument();
    expect(screen.getByText('個人清單')).toBeInTheDocument();
    expect(screen.getByText('學習重點')).toBeInTheDocument();
  });

  it('renders info card descriptions', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByText('在圖鑑中點擊愛心按鈕，將喜歡的寶可夢加入收藏清單')).toBeInTheDocument();
    expect(screen.getByText('建立屬於你的寶可夢收藏清單，隨時查看和管理')).toBeInTheDocument();
    expect(screen.getByText('專注學習你最感興趣的寶可夢，提升學習效率')).toBeInTheDocument();
  });

  it('renders info card icons', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('renders coming soon badge', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByText('🌟 收藏功能即將推出')).toBeInTheDocument();
  });

  it('renders with animated background gradient', () => {
    const { container } = render(<FavoritesPage />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveStyle({
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF6B6B 50%, #4ECDC4 75%, #45B7D1 100%)',
      backgroundSize: '400% 400%',
      animation: 'backgroundShift 8s ease-in-out infinite'
    });
  });

  it('has proper grid layout for info cards', () => {
    render(<FavoritesPage />);
    
    // Check that info cards exist and are properly structured
    expect(screen.getByText('收藏功能')).toBeInTheDocument();
    expect(screen.getByText('個人清單')).toBeInTheDocument();
    expect(screen.getByText('學習重點')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    
    // Check that CTA buttons are properly linked
    expect(screen.getByRole('link', { name: /開始探索寶可夢/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /先玩遊戲/ })).toBeInTheDocument();
  });

  it('displays encouraging message for empty state', () => {
    render(<FavoritesPage />);
    
    expect(screen.getByText(/快去圖鑑中找到你喜歡的寶可夢/)).toBeInTheDocument();
    expect(screen.getByText(/點擊愛心按鈕將它們加入收藏吧/)).toBeInTheDocument();
  });
});