/**
 * LoadingSpinner 元件測試
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '@/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('應該渲染載入動畫', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('應該顯示載入訊息', () => {
    render(<LoadingSpinner message="載入中..." />);

    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  it('應該有可訪問性標籤', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });
});
