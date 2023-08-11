import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/pokedex-kids/page';

jest.mock('@/app/data/base-pokedex.json', () => ([
  {
    'index': '#001',
    'name-tw': '妙蛙種子',
    'name-en': 'Bulbasaur'
  },
]));

describe('Page Component', () => {
  it('renders the title correctly', () => {
    render(<Page />);
    expect(screen.getByText('Pokedex!')).toBeInTheDocument();
  });

  it('renders the pokemon list correctly', () => {
    render(<Page />);
    expect(screen.getByText('#001 - 妙蛙種子 - Bulbasaur')).toBeInTheDocument();
  });

  it('plays audio when a pokemon row is clicked', async () => {
    render(<Page />);
    const audioPlaySpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(async () => { });

    const pokemonRow = screen.getByText('#001 - 妙蛙種子 - Bulbasaur').parentElement;
    if (pokemonRow) {
      userEvent.click(pokemonRow);
      fireEvent.touchStart(pokemonRow);
      fireEvent.touchEnd(pokemonRow);
    }

    await waitFor(() => {
      expect(audioPlaySpy).toBeCalledTimes(2);
    });

    audioPlaySpy.mockRestore();
  });
});
