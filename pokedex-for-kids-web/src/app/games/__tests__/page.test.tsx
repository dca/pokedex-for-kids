import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GamesPage from '../page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('GamesPage', () => {
  it('renders the main heading', () => {
    render(<GamesPage />);
    
    expect(screen.getByRole('heading', { name: /趣味遊戲/ })).toBeInTheDocument();
  });

  it('renders the subtitle and description', () => {
    render(<GamesPage />);
    
    expect(screen.getByText('透過遊戲學習寶可夢知識')).toBeInTheDocument();
    expect(screen.getByText('選擇適合的遊戲難度，在遊戲中提升記憶力、反應力和學習效果')).toBeInTheDocument();
  });

  it('renders all game cards', () => {
    render(<GamesPage />);
    
    expect(screen.getByText('記憶配對')).toBeInTheDocument();
    expect(screen.getByText('聲音猜謎')).toBeInTheDocument();
    expect(screen.getByText('拼圖遊戲')).toBeInTheDocument();
    expect(screen.getByText('知識測驗')).toBeInTheDocument();
    expect(screen.getByText('屬性配對')).toBeInTheDocument();
    expect(screen.getByText('反應速度')).toBeInTheDocument();
  });

  it('renders game descriptions', () => {
    render(<GamesPage />);
    
    expect(screen.getByText('翻牌找出相同的寶可夢，訓練記憶力和專注力')).toBeInTheDocument();
    expect(screen.getByText('聽聲音猜寶可夢，加強聽力學習和記憶連結')).toBeInTheDocument();
    expect(screen.getByText('拼出寶可夢圖片，提升觀察力和手眼協調')).toBeInTheDocument();
    expect(screen.getByText('回答寶可夢相關問題，測試學習成果')).toBeInTheDocument();
    expect(screen.getByText('學習寶可夢屬性相剋關係，增強策略思考')).toBeInTheDocument();
    expect(screen.getByText('快速點擊指定寶可夢，訓練反應力和注意力')).toBeInTheDocument();
  });

  it('renders game icons', () => {
    render(<GamesPage />);
    
    expect(screen.getByText('🧠')).toBeInTheDocument();
    expect(screen.getByText('🔊')).toBeInTheDocument();
    expect(screen.getByText('🧩')).toBeInTheDocument();
    expect(screen.getByText('❓')).toBeInTheDocument();
    expect(screen.getAllByText('⚡')).toHaveLength(2); // Two games use lightning emoji
  });

  it('shows difficulty levels for games', () => {
    render(<GamesPage />);
    
    expect(screen.getByText('簡單')).toBeInTheDocument();
    expect(screen.getAllByText('中等')).toHaveLength(2);
    expect(screen.getAllByText('困難')).toHaveLength(2);
  });

  it('shows coming soon badges for all games', () => {
    render(<GamesPage />);
    
    const comingSoonBadges = screen.getAllByText('即將推出');
    expect(comingSoonBadges).toHaveLength(6);
  });

  it('renders the main game icon in header', () => {
    render(<GamesPage />);
    
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });

  it('renders the info section', () => {
    render(<GamesPage />);
    
    expect(screen.getByText('🚀 即將推出更多遊戲')).toBeInTheDocument();
    expect(screen.getByText(/我們正在努力開發更多有趣的學習遊戲/)).toBeInTheDocument();
  });

  it('has coming soon games that are not clickable', () => {
    const { container } = render(<GamesPage />);
    
    // Check that coming soon games render as div, not Link
    const gameCards = container.querySelectorAll('[style*="cursor: not-allowed"]');
    expect(gameCards.length).toBeGreaterThan(0);
  });

  it('renders with animated background gradient', () => {
    const { container } = render(<GamesPage />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveStyle({
      background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 25%, #45B7D1 50%, #96CEB4 75%, #FFEAA7 100%)',
      backgroundSize: '400% 400%',
      animation: 'backgroundShift 8s ease-in-out infinite'
    });
  });

  it('has proper accessibility structure', () => {
    render(<GamesPage />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    // Games cards should not be links since they're coming soon
    const gameLinks = screen.queryAllByRole('link');
    const gameSpecificLinks = gameLinks.filter(link => 
      link.getAttribute('href')?.startsWith('/games/')
    );
    expect(gameSpecificLinks).toHaveLength(0);
  });
});