// ============================================================================
// Báo cáo độ tin cậy — kiểu dữ liệu, hàm định dạng và các mảnh UI dùng chung.
// Tách khỏi route để file route chỉ còn phần bố cục.
// ============================================================================

export type ReliabilityRow = {
  he_thong_id: string;
  ma: string | null;
  ten: string | null;
  so_su_co: number;
  so_dong: number;
  mttr_phut: number | null;
  mtbf_gio: number | null;
};

export type Bucket = "day" | "week" | "month";

export type SavedFilter = {
  id: string;
  name: string;
  from: string;
  to: string;
  bucket: Bucket;
};

export const SAVED_KEY = "mirats:reliability-filters";

export const SEVERITY_COLORS = [
  "hsl(var(--destructive))",
  "hsl(var(--primary))",
  "hsl(var(--chart-3, 32 95% 55%))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--chart-5, 262 60% 60%))",
];

export const DOW_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const DOW_LONG = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function fmtMttr(m: number | null | undefined) {
  if (m == null || !Number.isFinite(m)) return "—";
  if (m < 60) return `${m.toFixed(1)} phút`;
  const h = m / 60;
  if (h < 48) return `${h.toFixed(1)} giờ`;
  return `${(h / 24).toFixed(1)} ngày`;
}

export function fmtMtbf(h: number | null | undefined) {
  if (h == null || !Number.isFinite(h)) return "—";
  if (h < 48) return `${h.toFixed(1)} giờ`;
  return `${(h / 24).toFixed(1)} ngày`;
}

export function computeTotals(rows: ReliabilityRow[]) {
  const totalIncidents = rows.reduce((a, r) => a + (r.so_su_co ?? 0), 0);
  const totalClosed = rows.reduce((a, r) => a + (r.so_dong ?? 0), 0);
  const weightedMttr =
    rows.reduce((a, r) => a + (r.mttr_phut ?? 0) * (r.so_dong ?? 0), 0) / Math.max(totalClosed, 1);
  return { totalIncidents, totalClosed, weightedMttr };
}

export type Delta = { pct: number | null; diff: number } | null;

export function delta(cur: number, prev: number): Delta {
  if (!Number.isFinite(cur) || !Number.isFinite(prev)) return null;
  if (prev === 0) return cur === 0 ? { pct: 0, diff: 0 } : { pct: null, diff: cur };
  return { pct: ((cur - prev) / prev) * 100, diff: cur - prev };
}

/** Sự cố / MTTR: giảm là tốt (xanh). "Đã đóng": tăng là tốt. */
export function DeltaBadge({ d, lowerIsBetter = true }: { d: Delta; lowerIsBetter?: boolean }) {
  if (!d || d.diff === 0) return <span className="text-xs text-muted-foreground">= kỳ trước</span>;
  const up = d.diff > 0;
  const good = lowerIsBetter ? !up : up;
  const cls = good ? "text-emerald-600" : "text-destructive";
  const sign = up ? "▲" : "▼";
  const pct = d.pct == null ? "mới" : `${Math.abs(d.pct).toFixed(1)}%`;
  return (
    <span className={`text-xs font-medium ${cls}`}>
      {sign} {pct} vs kỳ trước
    </span>
  );
}
