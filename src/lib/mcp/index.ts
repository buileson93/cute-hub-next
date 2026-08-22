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
import { getSkillCard, listSkillTopics } from "./skills";
import {
  getHeThongLyLich,
  getThanhPhanLyLich,
  listThanhPhanByHeThong,
  listDotBaoDuong,
  getDotBaoDuong,
  listBaoTri,
  listSuCo,
  listHongHoc,
  listVanDe,
  listGiayPhepByHeThong,
  listKhoGiaoDich,
  metricTimeseries,
} from "./tools-domains";
import { createSuCo, createBaoTri, createHongHoc, ghiKiemKe, closeVanDe } from "./tools-write";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "mirats-mcp",
  title: "MIRATS AI",
  version: "0.2.0",
  instructions:
    "Trợ lý MIRATS – quản lý tài sản kỹ thuật VATM. GỌI `get_skill_card` TRƯỚC để hiểu cấu trúc 4 lớp (hệ thống → thành phần → tài sản → linh kiện), enums, luồng bảo dưỡng/sự cố/GPKT và luật cảnh báo. Có bộ tool chuyên dụng cho: sổ lý lịch hệ thống & thành phần, đợt bảo dưỡng lớn, sự cố, hỏng hóc, vấn đề, GPKT, kho, metric_timeseries. Có tool GHI (create_su_co / create_bao_tri / create_hong_hoc / create_kiem_ke_ghi / close_van_de) – LUÔN tóm tắt và xin phép user trước khi gọi. RLS chạy theo quyền user hiện tại. Trả lời tiếng Việt, chỉ dùng dữ liệu tool trả về.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    // Skill cards
    getSkillCard,
    listSkillTopics,
    // Tra cứu / thống kê tổng quát
    searchGlobal,
    describeSchema,
    runSelectQuery,
    listTable,
    getRow,
    countBy,
    dashboardStats,
    // Hệ thống & thành phần
    getHeThongLyLich,
    getThanhPhanLyLich,
    listThanhPhanByHeThong,
    metricTimeseries,
    // Tài sản
    listThietBi,
    getThietBi,
    countThietBiByTrangThai,
    // Giấy phép & biểu mẫu
    listGiayPhepSapHetHan,
    listGiayPhepByHeThong,
    listFormSubmissions,
    // Bảo trì / Đợt / Sự cố / Hỏng hóc / Vấn đề
    listBaoTri,
    listDotBaoDuong,
    getDotBaoDuong,
    listSuCo,
    listHongHoc,
    listVanDe,
    // Kho
    listKhoGiaoDich,
    // Vận hành khác
    listTickets,
    listDuAn,
    listDanhMuc,
    listNotifications,
    // Ghi tác nghiệp (agent cần xin phép user trước)
    createSuCo,
    createBaoTri,
    createHongHoc,
    ghiKiemKe,
    closeVanDe,
  ],
});
