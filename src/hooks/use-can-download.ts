// Cho phép tải tệp đính kèm theo vai trò tài khoản.
// Readonly (và người dùng không có vai trò nào) bị chặn tải xuống; chỉ được xem trong app.
import { useSession, type AppRole } from "@/hooks/use-session";

const DOWNLOAD_ROLES: AppRole[] = [
  "admin",
  "phong_kt",
  "phu_trach_dv",
  "ktv",
  "quan_ly_du_an",
  "to_truong",
];

export function useCanDownloadAttachments(): boolean {
  const { roles } = useSession();
  return roles.some((r) => DOWNLOAD_ROLES.includes(r));
}
