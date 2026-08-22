// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const mockData = { data: undefined as any, isLoading: true };
vi.mock("@/hooks/use-daily-brief", () => ({
  useDailyBrief: () => mockData,
}));

import { DailyBrief } from "@/components/mirats/DailyBrief";

describe("DailyBrief — GĐ2-02", () => {
  it("loading state → skeletons (no text)", () => {
    mockData.data = undefined;
    mockData.isLoading = true;
    const { container } = render(<DailyBrief />);
    expect(
      container.querySelectorAll('[class*="skeleton" i], .animate-pulse').length,
    ).toBeGreaterThan(0);
  });

  it("full data → render các câu tường thuật + link", () => {
    mockData.isLoading = false;
    mockData.data = {
      expiring_gp_7d: 3,
      expiring_gp_30d: 5,
      open_incidents: 2,
      critical_incidents: 1,
      overdue_pm: 4,
      due_pm_7d: 6,
      my_shift_tasks: 7,
      unread_notif: 0,
      generated_at: new Date().toISOString(),
    };
    render(<DailyBrief />);
    expect(screen.getByText(/giấy phép sắp hết hạn trong 7 ngày/)).toBeTruthy();
    expect(screen.getByText(/sự cố đang mở/)).toBeTruthy();
    expect(screen.getByText(/phiếu bảo trì quá hạn/)).toBeTruthy();
    expect(screen.getByText(/Ca của bạn còn/)).toBeTruthy();
    const links = document.querySelectorAll("a");
    const hrefs = Array.from(links).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/giay-phep?filter=expiring7");
    expect(hrefs).toContain("/su-co");
    expect(hrefs).toContain("/bao-tri/pm");
  });

  it("empty → hiện câu chúc, không hiện CTA", () => {
    mockData.isLoading = false;
    mockData.data = {
      expiring_gp_7d: 0,
      expiring_gp_30d: 0,
      open_incidents: 0,
      critical_incidents: 0,
      overdue_pm: 0,
      due_pm_7d: 0,
      my_shift_tasks: 0,
      unread_notif: 0,
      generated_at: new Date().toISOString(),
    };
    const { container } = render(<DailyBrief />);
    expect(screen.getByText(/chúc ngày làm việc suôn sẻ/)).toBeTruthy();
    expect(container.querySelectorAll("a").length).toBe(0);
  });
});
