import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PokemonDetailPage from '../[id]/page';

// Mock Next.js components and hooks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock the useAudioPlayer hook
jest.mock('@/hooks/useAudioPlayer', () => ({
  useAudioPlayer: jest.fn(),
}));

// Mock the Pokemon data
jest.mock('@/app/data/base-pokedex.json', () => [
  {
    'index': '#0001',
    'name-tw': '妙蛙種子',
    'name-en': 'Bulbasaur'
  },
  {
    'index': '#0025',
    'name-tw': '皮卡丘',
    'name-en': 'Pikachu'
  }
]);

const mockUseParams = require('next/navigation').useParams;
const mockUseAudioPlayer = require('@/hooks/useAudioPlayer').useAudioPlayer;

describe('PokemonDetailPage', () => {
  const mockAudioPlayer = {
    playAudio: jest.fn(),
    isPlaying: jest.fn(),
    isLoading: false,
    error: null
  };

  beforeEach(() => {
    mockUseAudioPlayer.mockReturnValue(mockAudioPlayer);
    mockAudioPlayer.isPlaying.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Pokemon details when valid ID is provided', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByText('妙蛙種子')).toBeInTheDocument();
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    expect(screen.getByText('#0001')).toBeInTheDocument();
  });

  it('renders Pokemon image with correct src', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    render(<PokemonDetailPage />);
    
    const image = screen.getByAltText('Bulbasaur');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://assets.pokemon.com/assets/cms2/img/pokedex/full/1.png');
  });

  it('renders audio play button', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    render(<PokemonDetailPage />);
    
    const audioButton = screen.getByRole('button', { name: /聽發音/ });
    expect(audioButton).toBeInTheDocument();
  });

  it('calls playAudio when audio button is clicked', async () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    render(<PokemonDetailPage />);
    
    const audioButton = screen.getByRole('button', { name: /聽發音/ });
    fireEvent.click(audioButton);
    
    await waitFor(() => {
      expect(mockAudioPlayer.playAudio).toHaveBeenCalledWith('#0001-Bulbasaur');
    });
  });

  it('shows loading state when audio is loading', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    mockUseAudioPlayer.mockReturnValue({
      ...mockAudioPlayer,
      isLoading: true
    });
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByText(/載入中/)).toBeInTheDocument();
    const audioButton = screen.getByRole('button');
    expect(audioButton).toBeDisabled();
  });

  it('shows playing state when audio is playing', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    mockAudioPlayer.isPlaying.mockReturnValue(true);
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByText(/播放中/)).toBeInTheDocument();
  });

  it('shows error message when audio error occurs', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    mockUseAudioPlayer.mockReturnValue({
      ...mockAudioPlayer,
      error: '無法載入音頻'
    });
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByText('無法載入音頻')).toBeInTheDocument();
  });

  it('renders back button to pokedex', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    render(<PokemonDetailPage />);
    
    const backButton = screen.getByRole('link', { name: /返回圖鑑/ });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', '/pokedex-kids');
  });

  it('renders action buttons for favorites and games', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    render(<PokemonDetailPage />);
    
    const favoritesButton = screen.getByRole('link', { name: /加入收藏/ });
    const gamesButton = screen.getByRole('link', { name: /玩遊戲/ });
    
    expect(favoritesButton).toBeInTheDocument();
    expect(favoritesButton).toHaveAttribute('href', '/favorites');
    
    expect(gamesButton).toBeInTheDocument();
    expect(gamesButton).toHaveAttribute('href', '/games');
  });

  it('renders basic info section', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByText('📋 基本資訊')).toBeInTheDocument();
    expect(screen.getByText(/編號：/)).toBeInTheDocument();
    expect(screen.getByText(/中文名：/)).toBeInTheDocument();
    expect(screen.getByText(/英文名：/)).toBeInTheDocument();
  });

  it('renders coming soon section for additional info', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByText('🔮 更多資訊')).toBeInTheDocument();
    expect(screen.getByText('即將推出')).toBeInTheDocument();
    expect(screen.getByText(/屬性、身高、體重/)).toBeInTheDocument();
  });

  it('renders not found page for invalid Pokemon ID', () => {
    mockUseParams.mockReturnValue({ id: '9999' });
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByText('找不到這隻寶可夢')).toBeInTheDocument();
    expect(screen.getByText(/編號 #9999 的寶可夢不存在/)).toBeInTheDocument();
    
    const backButton = screen.getByRole('link', { name: /返回圖鑑/ });
    expect(backButton).toBeInTheDocument();
  });

  it('applies correct theme colors based on Pokemon index', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    const { container } = render(<PokemonDetailPage />);
    
    const mainDiv = container.firstChild as HTMLElement;
    // Check that it has some green color scheme (grass type for Bulbasaur)
    expect(mainDiv.style.background).toContain('#4CAF50');
  });

  it('works with different Pokemon', () => {
    mockUseParams.mockReturnValue({ id: '0025' });
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByText('皮卡丘')).toBeInTheDocument();
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByText('#0025')).toBeInTheDocument();
  });

  it('handles Pokemon ID without leading zeros', () => {
    mockUseParams.mockReturnValue({ id: '1' });
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByText('妙蛙種子')).toBeInTheDocument();
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    mockUseParams.mockReturnValue({ id: '0001' });
    
    render(<PokemonDetailPage />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument(); // Audio button
    expect(screen.getAllByRole('link')).toHaveLength(3); // Back, favorites, games
  });
});