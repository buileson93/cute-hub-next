// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NotificationBell } from "../NotificationBell";

// Mock router Link so we don't need a full router context.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...p }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...(p as object)}>{children}</a>
  ),
}));

// Mock session + notifications hook to drive badge state.
vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({ user: { id: "u1" } }),
}));

const state = {
  items: [
    {
      id: "1",
      tieu_de: "Sự cố mới",
      noi_dung: "ADS-B mất tín hiệu",
      link: null,
      read_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      tieu_de: "PM đến hạn",
      noi_dung: null,
      link: null,
      read_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      tieu_de: "GP hết hạn",
      noi_dung: null,
      link: null,
      read_at: null,
      created_at: new Date().toISOString(),
    },
  ],
  unread: 3,
  markRead: vi.fn(),
  markAllRead: vi.fn(),
};
vi.mock("@/lib/realtime/useNotifications", () => ({
  useNotifications: () => state,
}));

afterEach(() => cleanup());

describe("NotificationBell", () => {
  it("hiển thị badge đúng số chưa đọc", () => {
    render(<NotificationBell />);
    expect(screen.getByLabelText(/^Thông báo/)).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("badge clamp về 9+ khi > 9", () => {
    state.unread = 12;
    render(<NotificationBell />);
    expect(screen.getByText("9+")).toBeTruthy();
  });
});
