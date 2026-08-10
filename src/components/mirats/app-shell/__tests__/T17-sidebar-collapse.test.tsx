/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AppShell } from '../AppShell';
import { Sidebar } from '../Sidebar';
import React from 'react';

// Mock các dependencies
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <div>{children}</div>,
  useRouterState: vi.fn((selector?: any) => {
    if (typeof selector === 'function') {
      const mockRouterState = { location: { pathname: '/' } };
      return selector(mockRouterState);
    }
    return '/';
  }),
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  useReducedMotion: vi.fn(() => false),
}));

vi.mock('@/components/mirats/ProductTour', () => ({
  ProductTourProvider: ({ children }: any) => <div>{children}</div>,
  useProductTour: () => ({ start: vi.fn() }),
  TOUR_STEPS: [],
}));

vi.mock('@/components/ui/tooltip', () => {
  const React = require('react');
  return {
    Tooltip: ({ children }: any) => React.createElement('div', null, children),
    TooltipContent: ({ children }: any) => React.createElement('div', null, children),
    TooltipTrigger: ({ children }: any) => React.createElement(React.Fragment, null, children),
    TooltipProvider: ({ children }: any) => React.createElement('div', null, children),
  };
});

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
    roles: ['admin'],
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
    addListener: vi.fn(), 
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('AppShell Sidebar Layout (T17 - Revised)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('Sidebar: ẩn tiêu đề h3 khi collapsed', () => {
    render(<Sidebar collapsed={true} />);
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('AppShell: sub-sidebar phải có class hidden md:flex', () => {
    const { container } = render(<AppShell>Content</AppShell>);
    const subSidebar = container.querySelector('aside.z-20');
    expect(subSidebar).toBeDefined();
    expect(subSidebar?.className).toContain('hidden');
    expect(subSidebar?.className).toContain('md:flex');
  });

  it('AppShell: mặc định sub-sidebar phải thu gọn (w-0)', () => {
    const { container } = render(<AppShell>Content</AppShell>);
    const subSidebar = container.querySelector('aside.z-20');
    expect(subSidebar?.className).toContain('w-0');
  });

  it('AppShell: Rail phải có width w-16 và z-30', () => {
    const { container } = render(<AppShell>Content</AppShell>);
    const rail = container.querySelector('aside.w-16');
    expect(rail).toBeDefined();
    expect(rail?.className).toContain('z-30');
  });
});
