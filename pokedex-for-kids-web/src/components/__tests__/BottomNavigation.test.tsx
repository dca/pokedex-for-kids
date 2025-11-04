import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BottomNavigation from '../BottomNavigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

const mockUsePathname = require('next/navigation').usePathname;

describe('BottomNavigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('renders all navigation items', () => {
    render(<BottomNavigation />);

    expect(screen.getByText('首頁')).toBeInTheDocument();
    expect(screen.getByText('圖鑑')).toBeInTheDocument();
    expect(screen.getByText('遊戲')).toBeInTheDocument();
    expect(screen.getByText('學習')).toBeInTheDocument();
    expect(screen.getByText('收藏')).toBeInTheDocument();
  });

  it('renders correct icons for each navigation item', () => {
    render(<BottomNavigation />);

    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('📱')).toBeInTheDocument();
    expect(screen.getByText('🎮')).toBeInTheDocument();
    expect(screen.getByText('📚')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('has correct navigation structure', () => {
    render(<BottomNavigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', '主導航');
  });

  it('creates links with correct hrefs', () => {
    render(<BottomNavigation />);

    expect(screen.getByRole('link', { name: /前往首頁頁面/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /前往圖鑑頁面/ })).toHaveAttribute('href', '/pokedex-kids');
    expect(screen.getByRole('link', { name: /前往遊戲頁面/ })).toHaveAttribute('href', '/games');
    expect(screen.getByRole('link', { name: /前往學習頁面/ })).toHaveAttribute('href', '/learning');
    expect(screen.getByRole('link', { name: /前往收藏頁面/ })).toHaveAttribute('href', '/favorites');
  });

  it('marks home as active when on home page', () => {
    mockUsePathname.mockReturnValue('/');
    render(<BottomNavigation />);

    const homeLink = screen.getByRole('link', { name: /前往首頁頁面/ });
    expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks pokedex as active when on pokedex page', () => {
    mockUsePathname.mockReturnValue('/pokedex-kids');
    render(<BottomNavigation />);

    const pokedexLink = screen.getByRole('link', { name: /前往圖鑑頁面/ });
    expect(pokedexLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks games as active when on games page', () => {
    mockUsePathname.mockReturnValue('/games');
    render(<BottomNavigation />);

    const gamesLink = screen.getByRole('link', { name: /前往遊戲頁面/ });
    expect(gamesLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks learning as active when on learning page', () => {
    mockUsePathname.mockReturnValue('/learning');
    render(<BottomNavigation />);

    const learningLink = screen.getByRole('link', { name: /前往學習頁面/ });
    expect(learningLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks favorites as active when on favorites page', () => {
    mockUsePathname.mockReturnValue('/favorites');
    render(<BottomNavigation />);

    const favoritesLink = screen.getByRole('link', { name: /前往收藏頁面/ });
    expect(favoritesLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks games as active when on games sub-page', () => {
    mockUsePathname.mockReturnValue('/games/memory');
    render(<BottomNavigation />);

    const gamesLink = screen.getByRole('link', { name: /前往遊戲頁面/ });
    expect(gamesLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks learning as active when on learning sub-page', () => {
    mockUsePathname.mockReturnValue('/learning/types');
    render(<BottomNavigation />);

    const learningLink = screen.getByRole('link', { name: /前往學習頁面/ });
    expect(learningLink).toHaveAttribute('aria-current', 'page');
  });

  it('only marks home as active for exact root path', () => {
    mockUsePathname.mockReturnValue('/home');
    render(<BottomNavigation />);

    const homeLink = screen.getByRole('link', { name: /前往首頁頁面/ });
    expect(homeLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('has proper styling structure', () => {
    render(<BottomNavigation />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveStyle({
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      height: '80px',
      zIndex: '1000'
    });
  });
});