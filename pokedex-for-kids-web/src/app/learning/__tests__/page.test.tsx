import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LearningPage from '../page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('LearningPage', () => {
  it('renders the main heading', () => {
    render(<LearningPage />);
    
    expect(screen.getByRole('heading', { name: /學習中心/ })).toBeInTheDocument();
  });

  it('renders the subtitle and description', () => {
    render(<LearningPage />);
    
    expect(screen.getByText('系統化學習寶可夢知識')).toBeInTheDocument();
    expect(screen.getByText('按照不同分類方式學習寶可夢，追蹤學習進度，解鎖各種成就')).toBeInTheDocument();
  });

  it('renders all learning category cards', () => {
    render(<LearningPage />);
    
    expect(screen.getByText('按屬性分類')).toBeInTheDocument();
    expect(screen.getByText('按世代分類')).toBeInTheDocument();
    expect(screen.getByText('學習進度')).toBeInTheDocument();
    expect(screen.getByText('成就系統')).toBeInTheDocument();
  });

  it('renders category descriptions', () => {
    render(<LearningPage />);
    
    expect(screen.getByText('學習18種寶可夢屬性，了解每種屬性的特色和代表寶可夢')).toBeInTheDocument();
    expect(screen.getByText('探索不同世代的寶可夢，從關都到帕底亞的精彩旅程')).toBeInTheDocument();
    expect(screen.getByText('追蹤你的學習進度，查看已掌握的寶可夢知識')).toBeInTheDocument();
    expect(screen.getByText('解鎖各種學習成就，成為真正的寶可夢大師')).toBeInTheDocument();
  });

  it('renders category icons', () => {
    render(<LearningPage />);
    
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('🌍')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('shows coming soon badges for all categories', () => {
    render(<LearningPage />);
    
    const comingSoonBadges = screen.getAllByText('即將推出');
    expect(comingSoonBadges).toHaveLength(4);
  });

  it('shows progress stats for categories', () => {
    render(<LearningPage />);
    
    expect(screen.getByText('5/18')).toBeInTheDocument(); // Types progress
    expect(screen.getByText('2/9')).toBeInTheDocument();  // Generations progress
    expect(screen.getByText('234/1010')).toBeInTheDocument(); // Overall progress
    expect(screen.getByText('12/50')).toBeInTheDocument(); // Achievements progress
  });

  it('renders the main learning icon in header', () => {
    render(<LearningPage />);
    
    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  it('renders the learning statistics section', () => {
    render(<LearningPage />);
    
    expect(screen.getByText('🎯 你的學習統計')).toBeInTheDocument();
    expect(screen.getByText('已學習寶可夢')).toBeInTheDocument();
    expect(screen.getByText('掌握屬性')).toBeInTheDocument();
    expect(screen.getByText('解鎖成就')).toBeInTheDocument();
    expect(screen.getByText('學習天數')).toBeInTheDocument();
  });

  it('shows learning statistics values', () => {
    render(<LearningPage />);
    
    expect(screen.getByText('234')).toBeInTheDocument(); // Learned Pokemon
    expect(screen.getByText('5/18')).toBeInTheDocument(); // Mastered types
    expect(screen.getByText('12')).toBeInTheDocument(); // Unlocked achievements
    expect(screen.getByText('15')).toBeInTheDocument(); // Learning days
  });

  it('renders learning statistics icons', () => {
    render(<LearningPage />);
    
    expect(screen.getAllByText('📱')).toHaveLength(1); // Pokemon learned icon
    expect(screen.getAllByText('🔥')).toHaveLength(2); // Types icon (appears twice - in category and stats)
    expect(screen.getAllByText('🏆')).toHaveLength(2); // Achievements icon (appears twice)
    expect(screen.getByText('📅')).toBeInTheDocument(); // Days icon
  });

  it('has coming soon categories that are not clickable', () => {
    const { container } = render(<LearningPage />);
    
    // Check that coming soon categories render as div, not Link
    const categoryCards = container.querySelectorAll('[style*="cursor: not-allowed"]');
    expect(categoryCards.length).toBeGreaterThan(0);
  });

  it('renders with animated background gradient', () => {
    const { container } = render(<LearningPage />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveStyle({
      background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 25%, #A5D6A7 50%, #C8E6C9 75%, #E8F5E8 100%)',
      backgroundSize: '400% 400%',
      animation: 'backgroundShift 8s ease-in-out infinite'
    });
  });

  it('renders progress bars for categories', () => {
    render(<LearningPage />);
    
    // Check that progress text exists (progress bars are styled divs)
    expect(screen.getAllByText('學習進度')).toHaveLength(5); // 4 in cards + 1 in stats section
  });

  it('has proper accessibility structure', () => {
    render(<LearningPage />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});