import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/pokedex-kids/[name]/page';

describe('Page Component', () => {
  it('renders the title correctly', () => {
    render(<Page params={{
      name: 'test name'
    }} />);
    expect(screen.getByText('Pokedex!')).toBeInTheDocument();
  });
});

