# Kế hoạch Phục hồi và Nâng cấp Phase U8: Lean OS, Gamification & UI Refinement

Phase U8 tập trung vào việc hoàn thiện các tính năng "Gamification" (Góp gạch), tích hợp sâu hệ điều hành dự án tinh gọn (Lean OS) và đặc biệt là khắc phục triệt để các vấn đề UI còn tồn đọng trong PowerSearch và nút bấm.

## 1. Khắc phục UI PowerSearch & Nút bấm (Ưu tiên cao)
- **PowerSearch Glass Icon**: Khắc phục lỗi hiển thị icon kính lúp bị chồng lấn hoặc sai vị trí trong `PowerSearch.tsx` và `TopBar.tsx`.
- **Chống chồng lấn (Overlap Protection)**: 
  - Đảm bảo các nút hành động (ví dụ: "KHÔI PHỤC", "CÁ NHÂN HÓA") không đè lên nhau khi ở trạng thái loading hoặc thay đổi mật độ.
  - Sử dụng Flexbox layout thay vì `absolute` cho các thành phần nội dung bên trong nút bấm.
  - Cập nhật `renderContent` trong `Button.tsx` để quản lý không gian an toàn cho icon và text.

## 2. Gamification & Chất lượng dữ liệu (U8.1)
- **CompletenessRing Everywhere**: Tích hợp vòng tròn hoàn thiện dữ liệu vào `StandardTable` và `ThietBiDetailDrawer`.
- **Nâng cấp Góp gạch**: 
  - Cải thiện UX route `/_app/gop-gach`: thêm hiệu ứng "Streak" và phân loại nhiệm vụ.
  - Kết nối điểm thưởng `dong_gop_diem` vào hệ thống thông tin người dùng.

## 3. Advanced Operation Parity (U8.2) - Đạt 100% "chaytot"
- **AI Extraction Parity**: Cổng logic trích xuất thông tin bằng AI sang `BaoTriMoiForm` và `HongHocMoiForm`.
- **Voice-to-Text**: Khôi phục tính năng ghi âm nháp (Voice logging) cho tất cả các form vận hành.

## 4. Project Lean OS & Dossier (U8.3)
- **Hill Charts**: Kết nối thành phần `HillChart` với trạng thái thực tế của nhiệm vụ dự án.
- **Lean UX Canvas**: Tích hợp công cụ khám phá giải pháp vào luồng quản lý dự án.
- **Technical Dossier**: Kết nối `DossierRegister` với nền tảng OCR để số hóa tài liệu kỹ thuật.

## Chi tiết kỹ thuật
- **Layout**: Sử dụng `justify-between` và `gap-x` để ngăn chặn chồng lấn UI.
- **RPC**: Sử dụng `create_change_request` cho mọi đóng góp từ người dùng.
- **AI**: Sử dụng Lovable AI Gateway để trích xuất thực thể.
