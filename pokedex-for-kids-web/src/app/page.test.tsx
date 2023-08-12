import React from 'react';
import { render } from '@testing-library/react';
import Home from './page'; //

// 模擬 next/router 的 useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Home', () => {
  it('should redirect to /pokedex-kids on mount', () => {
    const mockReplace = jest.fn();

    require('next/navigation').useRouter.mockReturnValue({
      replace: mockReplace,
    });

    render(<Home />);

    expect(mockReplace).toHaveBeenCalledWith('/pokedex-kids');
  });
});
