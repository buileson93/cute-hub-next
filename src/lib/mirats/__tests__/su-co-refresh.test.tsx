// @vitest-environment jsdom
// ============================================================================
// Kiểm chứng: thêm / cập nhật sự cố thì DANH SÁCH, BADGE và DASHBOARD cập nhật
// NGAY mà KHÔNG cần tải lại trang — nhờ cùng dùng query key ["operations_data"]
// và được invalidate sau mỗi thao tác ghi.
//
// Ba màn (danh sách sự cố, badge/thống kê, Dashboard) đều đọc cùng một nguồn
// `useOperationsData` → chỉ cần mock nguồn đó + invalidate là đủ mô phỏng.
// ============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- Kho dữ liệu giả lập, thay đổi được giữa các lần refetch ---
const store: Record<string, unknown[]> = {
  su_co: [],
  bao_tri: [],
  hong_hoc: [],
  ban_giao: [],
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        order: () => Promise.resolve({ data: store[table] ?? [], error: null }),
      }),
    }),
  },
}));

import { useOperationsData } from "@/lib/mirats/db-operations";
import { countOpenIncidents } from "@/lib/mirats/su-co-state";

function Harness() {
  const { ops, isFetching } = useOperationsData();
  return (
    <div>
      <span data-testid="list-count">{ops.suCo.length}</span>
      <span data-testid="open-badge">{countOpenIncidents(ops.suCo)}</span>
      <span data-testid="fetching">{isFetching ? "1" : "0"}</span>
    </div>
  );
}

function suCoRow(ma: string, trangThai: string) {
  return { ma_su_co: ma, thiet_bi: "TB-1", trang_thai: trangThai, ngay_phat_hien: "2026-07-01" };
}

let qc: QueryClient;

beforeEach(() => {
  store.su_co = [suCoRow("SC-1", "Mới")];
  store.bao_tri = [];
  store.hong_hoc = [];
  store.ban_giao = [];
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});

afterEach(() => {
  cleanup();
  qc.clear();
});

function renderHarness() {
  return render(
    <QueryClientProvider client={qc}>
      <Harness />
    </QueryClientProvider>,
  );
}

describe("Sự cố cập nhật không reload", () => {
  it("THÊM sự cố → danh sách & badge tăng sau khi invalidate (không remount)", async () => {
    const { container } = renderHarness();

    await waitFor(() => expect(screen.getByTestId("list-count").textContent).toBe("1"));
    expect(screen.getByTestId("open-badge").textContent).toBe("1");
    const firstNode = container.firstChild; // giữ tham chiếu để chứng minh không remount

    // Mô phỏng thao tác "thêm" thành công: dữ liệu nguồn đổi + invalidate như onSuccess.
    store.su_co = [suCoRow("SC-1", "Mới"), suCoRow("SC-2", "Đang xử lý")];
    await qc.invalidateQueries({ queryKey: ["operations_data"] });

    await waitFor(() => expect(screen.getByTestId("list-count").textContent).toBe("2"));
    expect(screen.getByTestId("open-badge").textContent).toBe("2");
    // Cùng một cây DOM được cập nhật tại chỗ — không tải lại trang.
    expect(container.firstChild).toBe(firstNode);
  });

  it("CẬP NHẬT trạng thái (đóng) → badge 'đang mở' giảm sau invalidate", async () => {
    store.su_co = [suCoRow("SC-1", "Mới"), suCoRow("SC-2", "Đang xử lý")];
    renderHarness();

    await waitFor(() => expect(screen.getByTestId("open-badge").textContent).toBe("2"));

    // Đóng SC-2 → chuyển sang "Đã khắc phục".
    store.su_co = [suCoRow("SC-1", "Mới"), suCoRow("SC-2", "Đã khắc phục")];
    await qc.invalidateQueries({ queryKey: ["operations_data"] });

    await waitFor(() => expect(screen.getByTestId("open-badge").textContent).toBe("1"));
    // Tổng danh sách không đổi, chỉ badge "đang mở" giảm.
    expect(screen.getByTestId("list-count").textContent).toBe("2");
  });

  it("dùng đúng query key ['operations_data'] để mọi màn cùng làm mới", async () => {
    renderHarness();
    await waitFor(() => expect(screen.getByTestId("list-count").textContent).toBe("1"));
    expect(qc.getQueryData(["operations_data"])).toBeTruthy();
  });
});
