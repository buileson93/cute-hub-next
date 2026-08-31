// ============================================================================
// Chỉ số công việc dự án — tính thuần từ dữ liệu thật, không hard-code.
// Dùng chung cho Kanban, danh sách, lịch và thanh chỉ số tổng quan.
// ============================================================================

export type TaskLike = {
  trang_thai: string;
  ngay_ket_thuc_du_kien: string | null;
  ngay_hoan_thanh_thuc_te?: string | null;
};

export type TaskMetrics = {
  total: number;
  completed: number;
  overdue: number;
  byStatus: Record<string, number>;
  /** completedTasks / totalTasks × 100, làm tròn; 0 khi chưa có công việc. */
  progress: number;
};

const DONE = "hoan_thanh";

/** Công việc quá hạn: có hạn trước hôm nay và chưa hoàn thành. */
export function isOverdue(task: TaskLike, today = new Date()): boolean {
  if (task.trang_thai === DONE) return false;
  if (!task.ngay_ket_thuc_du_kien) return false;
  const due = new Date(`${task.ngay_ket_thuc_du_kien}T00:00:00`).getTime();
  if (Number.isNaN(due)) return false;
  return due < new Date(today).setHours(0, 0, 0, 0);
}

export function computeTaskMetrics(tasks: readonly TaskLike[], today = new Date()): TaskMetrics {
  const byStatus: Record<string, number> = {};
  let completed = 0;
  let overdue = 0;
  for (const t of tasks) {
    byStatus[t.trang_thai] = (byStatus[t.trang_thai] ?? 0) + 1;
    if (t.trang_thai === DONE) completed += 1;
    if (isOverdue(t, today)) overdue += 1;
  }
  const total = tasks.length;
  return {
    total,
    completed,
    overdue,
    byStatus,
    progress: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/** Tiến độ checklist: completedItems / totalItems, tránh chia cho 0. */
export function checklistProgress(items: readonly { hoan_thanh: boolean }[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.hoan_thanh).length / items.length) * 100);
}

/** Sắp xếp theo hạn: không hạn luôn xếp cuối ở cả hai chiều. */
export function compareByDeadline(
  a: { ngay_ket_thuc_du_kien: string | null },
  b: { ngay_ket_thuc_du_kien: string | null },
  dir: "asc" | "desc" = "asc",
): number {
  const av = a.ngay_ket_thuc_du_kien;
  const bv = b.ngay_ket_thuc_du_kien;
  if (!av && !bv) return 0;
  if (!av) return 1;
  if (!bv) return -1;
  return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
}
