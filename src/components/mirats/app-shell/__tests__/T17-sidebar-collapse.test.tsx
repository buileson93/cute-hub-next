import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '../AppShell';
import React from 'react';

// Mock các dependencies
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <div>{children}</div>,
  useRouterState: vi.fn(() => ({ location: { pathname: '/' } })),
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

vi.mock('../Sidebar', () => ({
  Sidebar: ({ collapsed }: any) => <div data-testid="sidebar-mock" data-collapsed={collapsed}>Sidebar Content</div>,
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
  });

  it('phải có nút thu gọn với aria-label chính xác', () => {
    render(<AppShell>Content</AppShell>);
    
    // Mặc định là mở rộng
    const button = screen.getByLabelText(/Thu gọn thanh điều hướng/i);
    expect(button).toBeDefined();
  });

  it('bấm nút thu gọn phải đổi trạng thái và lưu localStorage', () => {
    const { rerender } = render(<AppShell>Content</AppShell>);
    
    const button = screen.getByLabelText(/Thu gọn thanh điều hướng/i);
    fireEvent.click(button);

    // Kiểm tra state truyền xuống Sidebar
    const sidebar = screen.getByTestId('sidebar-mock');
    expect(sidebar.getAttribute('data-collapsed')).toBe('true');

    // Kiểm tra localStorage
    expect(localStorage.getItem('mirats-sidebar-collapsed')).toBe('1');

    // Nút phải đổi aria-label
    expect(screen.getByLabelText(/Mở rộng thanh điều hướng/i)).toBeDefined();
  });

  it('phải khôi phục trạng thái từ localStorage khi load', () => {
    localStorage.setItem('mirats-sidebar-collapsed', '1');
    render(<AppShell>Content</AppShell>);

    const sidebar = screen.getByTestId('sidebar-mock');
    expect(sidebar.getAttribute('data-collapsed')).toBe('true');
    expect(screen.getByLabelText(/Mở rộng thanh điều hướng/i)).toBeDefined();
  });
});
