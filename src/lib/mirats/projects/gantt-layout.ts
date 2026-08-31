// ============================================================================
// Gantt layout — logic thuần (không React, không side-effect) để unit-test.
// Chỉ sắp xếp/đo đạc dòng thời gian; KHÔNG suy diễn thêm dữ liệu nghiệp vụ.
// ============================================================================

export type GanttRowKind = "moc" | "task";

export type GanttSource = {
  id: string;
  ten: string;
  ngay_bat_dau: string | null;
  ngay_ket_thuc_du_kien: string | null;
  tien_do: number;
};

export type GanttMocSource = GanttSource;

export type GanttTaskSource = GanttSource & {
  moc_id: string;
  trang_thai: string;
  nguoi_xu_ly_chinh: string | null;
};

export type GanttRow = {
  key: string;
  id: string;
  kind: GanttRowKind;
  name: string;
  start: string;
  end: string;
  /** 0–100, đã kẹp biên. */
  progress: number;
  status: string | null;
  assigneeId: string | null;
  /** true khi ngày bị suy ra từ mốc/dự án vì bản ghi thiếu ngày. */
  inferredDates: boolean;
};

export type GanttRange = {
  start: string;
  end: string;
  /** Số ngày bao trùm (>= 1). */
  totalDays: number;
};

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** Chuẩn hoá về YYYY-MM-DD, trả null nếu không hợp lệ. */
export function toDateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = ISO_DATE.exec(value);
  if (!m) return null;
  const t = Date.parse(`${m[0]}T00:00:00Z`);
  return Number.isNaN(t) ? null : m[0];
}

function utc(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00Z`);
}

export function addDays(dateKey: string, days: number): string {
  return new Date(utc(dateKey) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Số ngày trọn vẹn từ a đến b (b - a). Âm nếu b trước a. */
export function diffDays(a: string, b: string): number {
  return Math.round((utc(b) - utc(a)) / DAY_MS);
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Gom mốc + công việc thành danh sách dòng Gantt theo thứ tự hiển thị.
 * Ngày thiếu được thay bằng ngày của mốc rồi tới `fallbackStart`.
 */
export function buildGanttRows(input: {
  mocs: readonly GanttMocSource[];
  tasks: readonly GanttTaskSource[];
  fallbackStart: string;
}): GanttRow[] {
  const fallback = toDateKey(input.fallbackStart) ?? new Date().toISOString().slice(0, 10);
  const rows: GanttRow[] = [];

  for (const m of input.mocs) {
    const mStart = toDateKey(m.ngay_bat_dau);
    const mEnd = toDateKey(m.ngay_ket_thuc_du_kien);
    const start = mStart ?? mEnd ?? fallback;
    const end = mEnd ?? mStart ?? fallback;
    rows.push({
      key: `m_${m.id}`,
      id: m.id,
      kind: "moc",
      name: m.ten,
      start,
      end: diffDays(start, end) < 0 ? start : end,
      progress: clampProgress(m.tien_do),
      status: null,
      assigneeId: null,
      inferredDates: !mStart && !mEnd,
    });

    for (const t of input.tasks.filter((x) => x.moc_id === m.id)) {
      const tStart = toDateKey(t.ngay_bat_dau);
      const tEnd = toDateKey(t.ngay_ket_thuc_du_kien);
      const start2 = tStart ?? tEnd ?? mStart ?? fallback;
      const end2 = tEnd ?? tStart ?? mEnd ?? start2;
      rows.push({
        key: `t_${t.id}`,
        id: t.id,
        kind: "task",
        name: t.ten,
        start: start2,
        end: diffDays(start2, end2) < 0 ? start2 : end2,
        progress: clampProgress(t.tien_do),
        status: t.trang_thai,
        assigneeId: t.nguoi_xu_ly_chinh,
        inferredDates: !tStart && !tEnd,
      });
    }
  }

  return rows;
}

/** Khoảng thời gian bao trùm mọi dòng, có đệm 2 ngày mỗi bên. Null khi rỗng. */
export function computeGanttRange(rows: readonly GanttRow[], padDays = 2): GanttRange | null {
  if (rows.length === 0) return null;
  let min = rows[0].start;
  let max = rows[0].end;
  for (const r of rows) {
    if (diffDays(min, r.start) < 0) min = r.start;
    if (diffDays(max, r.end) > 0) max = r.end;
  }
  const start = addDays(min, -padDays);
  const end = addDays(max, padDays);
  return { start, end, totalDays: diffDays(start, end) + 1 };
}

/** Vị trí và độ dài thanh (đơn vị ngày), đã kẹp trong khoảng hiển thị. */
export function computeBarSpan(
  row: Pick<GanttRow, "start" | "end">,
  range: GanttRange,
): { offsetDays: number; spanDays: number } {
  const rawOffset = diffDays(range.start, row.start);
  const rawEnd = diffDays(range.start, row.end) + 1;
  const offsetDays = Math.max(0, Math.min(rawOffset, range.totalDays - 1));
  const endDays = Math.max(offsetDays + 1, Math.min(rawEnd, range.totalDays));
  return { offsetDays, spanDays: endDays - offsetDays };
}

/** Chữ viết tắt ổn định cho avatar (tối đa 2 ký tự). */
export function initialsOf(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Chỉ số màu nền avatar ổn định theo khoá (hash đơn giản, không ngẫu nhiên). */
export function avatarToneIndex(seed: string, buckets: number): number {
  if (buckets <= 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % buckets;
}
