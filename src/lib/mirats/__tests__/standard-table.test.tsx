import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StandardTable } from '../../../components/mirats/StandardTable';

// Mock thongDiepLoi to ensure it is called
vi.mock('../errors', () => ({
  thongDiepLoi: vi.fn((loi, fallback) => loi?.message || fallback)
}));

describe('StandardTable Error Handling', () => {
  it('renders error message and retry button', () => {
    const retry = vi.fn();
    const error = { message: 'Failed to load data', retry };
    
    render(
      <StandardTable 
        rows={[]} 
        columns={[{ key: 'id', header: 'ID' }]} 
        trangThai={{ loi: error }} 
      />
    );
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    const retryBtn = screen.getByText('Thử lại');
    fireEvent.click(retryBtn);
    expect(retry).toHaveBeenCalled();
  });
});
