/**
 * PokemonCard 元件測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PokemonCard from '@/components/PokemonCard';
import type { Pokemon } from '@/types';

const mockPokemon: Pokemon = {
  id: 25,
  name: {
    en: 'Pikachu',
    zh: '皮卡丘',
  },
  dexNumber: '025',
  sprites: {
    official: 'https://example.com/pikachu.png',
    icon: 'https://example.com/pikachu-icon.png',
  },
  metadata: {
    generation: 1,
    isSpecialForm: false,
  },
};

describe('PokemonCard', () => {
  it('應該顯示寶可夢圖片', () => {
    render(<PokemonCard pokemon={mockPokemon} onClick={() => {}} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Pikachu');
  });

  it('應該顯示中英文名稱', () => {
    render(<PokemonCard pokemon={mockPokemon} onClick={() => {}} />);

    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByText('皮卡丘')).toBeInTheDocument();
  });

  it('應該顯示圖鑑編號', () => {
    render(<PokemonCard pokemon={mockPokemon} onClick={() => {}} />);

    expect(screen.getByText('#025')).toBeInTheDocument();
  });

  it('點擊時應該呼叫 onClick', () => {
    const handleClick = jest.fn();
    render(<PokemonCard pokemon={mockPokemon} onClick={handleClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledWith(25);
  });

  it('播放中應該顯示播放狀態', () => {
    render(<PokemonCard pokemon={mockPokemon} onClick={() => {}} isPlaying />);

    const card = screen.getByRole('button');
    expect(card).toHaveClass('playing');
  });

  it('應該支援鍵盤操作（Enter）', () => {
    const handleClick = jest.fn();
    render(<PokemonCard pokemon={mockPokemon} onClick={handleClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });

    expect(handleClick).toHaveBeenCalled();
  });

  it('應該支援鍵盤操作（Space）', () => {
    const handleClick = jest.fn();
    render(<PokemonCard pokemon={mockPokemon} onClick={handleClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });

    expect(handleClick).toHaveBeenCalled();
  });
});
