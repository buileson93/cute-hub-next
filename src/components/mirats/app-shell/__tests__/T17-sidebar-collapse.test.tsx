/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppShell } from '../AppShell';
import { Sidebar } from '../Sidebar';
import React from 'react';

// Mock các dependencies
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <div>{children}</div>,
  useRouterState: vi.fn((selector?: any) => {
    const state = { location: { pathname: '/' } };
    // TanStack Router selector pattern
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useReducedMotion: vi.fn(() => false),
}));

vi.mock('@/components/mirats/ProductTour', () => ({
  ProductTourProvider: ({ children }: any) => <div>{children}</div>,
  useProductTour: () => ({ start: vi.fn() }),
  TOUR_STEPS: [],
}));

vi.mock('@/hooks/use-route-tracker', () => ({
  useRouteTracker: vi.fn(),
}));

vi.mock('@/hooks/use-session', () => ({
  useSession: () => ({
    profile: { id: '1', tour_hoan_thanh: true },
    hasRole: () => true,
    loading: false,
    refresh: vi.fn(),
    session: {},
  }),
}));

vi.mock('@/integrations/backend/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock('../TopBar', () => ({
  TopBar: () => <div>TopBar</div>,
}));

vi.mock('../MobileNav', () => ({
  MobileNav: () => <div>MobileNav</div>,
}));

vi.mock('../index', () => ({
  SidebarLogoRail: () => <div>Logo</div>,
  UserMenu: () => <div>User</div>,
  TourButton: () => <div>Tour</div>,
  TOUR_STEPS: [],
}));

vi.mock('@/components/mirats/AiChatButton', () => ({
  AiChatButton: () => <div>AiChat</div>,
}));

vi.mock('@/components/mirats/CommandPalette', () => ({
  CommandPalette: () => <div>CommandPalette</div>,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('AppShell Sidebar Collapse (T17)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('Sidebar: ẩn tiêu đề h3 khi collapsed', () => {
    render(<Sidebar collapsed={true} />);
    // h3 thường được dùng cho group label trong Sidebar.tsx
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('AppShell: phải có nút thu gọn với aria-label chính xác', () => {
    render(<AppShell>Content</AppShell>);
    // Desktop flex aside
    const buttons = screen.getAllByLabelText(/Thu gọn thanh điều hướng/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('bấm nút thu gọn phải đổi aria-label và lưu localStorage', () => {
    render(<AppShell>Content</AppShell>);
    
    const button = screen.getAllByLabelText(/Thu gọn thanh điều hướng/i)[0];
    fireEvent.click(button);

    // Kiểm tra localStorage
    expect(localStorage.getItem('mirats-sidebar-collapsed')).toBe('1');

    // Nút phải đổi aria-label (sau khi re-render)
    expect(screen.getAllByLabelText(/Mở rộng thanh điều hướng/i).length).toBeGreaterThan(0);
  });

  it('phải khôi phục trạng thái từ localStorage khi load', () => {
    localStorage.setItem('mirats-sidebar-collapsed', '1');
    render(<AppShell>Content</AppShell>);

    expect(screen.getAllByLabelText(/Mở rộng thanh điều hướng/i).length).toBeGreaterThan(0);
  });
});
