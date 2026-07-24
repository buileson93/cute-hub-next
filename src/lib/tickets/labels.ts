export const TICKET_LOAI = {
  cap_tai_khoan: "Cấp tài khoản",
  doi_quyen: "Đổi quyền",
  reset_mat_khau: "Reset mật khẩu",
  bao_loi: "Báo lỗi",
  khac: "Khác",
} as const;

export const TICKET_TRANG_THAI = {
  moi: "Mới",
  dang_xu_ly: "Đang xử lý",
  cho_phan_hoi: "Chờ phản hồi",
  hoan_thanh: "Hoàn thành",
  tu_choi: "Từ chối",
  dong: "Đóng",
} as const;

export const TICKET_UU_TIEN = {
  thap: "Thấp",
  trung_binh: "Trung bình",
  cao: "Cao",
  khan: "Khẩn",
} as const;

export const TRANG_THAI_COLOR: Record<keyof typeof TICKET_TRANG_THAI, string> = {
  moi: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  dang_xu_ly: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  cho_phan_hoi: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  hoan_thanh: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  tu_choi: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  dong: "bg-muted text-muted-foreground border-border",
};

export const UU_TIEN_COLOR: Record<keyof typeof TICKET_UU_TIEN, string> = {
  thap: "bg-muted text-muted-foreground",
  trung_binh: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  cao: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  khan: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};
