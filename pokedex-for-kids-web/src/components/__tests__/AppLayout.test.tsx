import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppLayout from '../AppLayout';

// Mock the BottomNavigation component
jest.mock('../BottomNavigation', () => {
  return function MockBottomNavigation() {
    return <div data-testid="bottom-navigation">Bottom Navigation</div>;
  };
});

describe('AppLayout', () => {
  it('renders children content correctly', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders BottomNavigation component', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
  });

  it('has correct main element structure', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({
      width: '100%',
      minHeight: 'calc(100vh - 80px)',
      position: 'relative'
    });
  });

  it('has correct container styling for bottom navigation space', () => {
    const { container } = render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const appContainer = container.firstChild as HTMLElement;
    expect(appContainer).toHaveStyle({
      minHeight: '100vh',
      position: 'relative',
      paddingBottom: '80px'
    });
  });

  it('provides correct accessibility attributes', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});