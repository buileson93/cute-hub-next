import { auth, defineMcp } from "@lovable.dev/mcp-js";
import {
  searchGlobal,
  listThietBi,
  getThietBi,
  listGiayPhepSapHetHan,
  listFormSubmissions,
  countThietBiByTrangThai,
  describeSchema,
  runSelectQuery,
  listTable,
  getRow,
  countBy,
  dashboardStats,
  listTickets,
  listDuAn,
  listDanhMuc,
  listNotifications,
} from "./tools";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "mirats-mcp",
  title: "MIRATS AI",
  version: "0.2.0",
  instructions:
    "Trợ lý dữ liệu MIRATS. Cung cấp bộ tool chỉ-đọc để tra cứu & thống kê TOÀN BỘ dữ liệu hệ thống: tài sản, giấy phép, biểu mẫu, ticket, dự án, sơ đồ, danh mục, thông báo. Dùng `describe_schema` để hiểu cấu trúc, `run_select_query`/`list_table`/`count_by` cho truy vấn tuỳ ý (RLS áp dụng theo quyền user). Ưu tiên tool chuyên dụng khi phù hợp. Luôn trả lời tiếng Việt và chỉ dùng dữ liệu từ tool, không đoán số liệu.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    // Tra cứu / thống kê tổng quát trên toàn bộ dữ liệu
    searchGlobal,
    describeSchema,
    runSelectQuery,
    listTable,
    getRow,
    countBy,
    dashboardStats,
    // Tài sản
    listThietBi,
    getThietBi,
    countThietBiByTrangThai,
    // Giấy phép & biểu mẫu
    listGiayPhepSapHetHan,
    listFormSubmissions,
    // Vận hành khác
    listTickets,
    listDuAn,
    listDanhMuc,
    listNotifications,
  ],
});
