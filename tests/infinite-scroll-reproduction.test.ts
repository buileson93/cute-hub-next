import { describe, it, expect } from 'vitest';
import { useInfiniteThanhPhanRows, useInfiniteTaiSanRows } from '../src/components/mirats/ThanhPhanTable';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Infinite Scroll Hooks (Phase 10R)', () => {
  it('useInfiniteThanhPhanRows should be defined', () => {
    expect(useInfiniteThanhPhanRows).toBeDefined();
  });

  it('useInfiniteTaiSanRows should be defined', () => {
    expect(useInfiniteTaiSanRows).toBeDefined();
  });
});
