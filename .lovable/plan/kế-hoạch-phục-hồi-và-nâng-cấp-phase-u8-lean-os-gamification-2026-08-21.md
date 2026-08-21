# Kế hoạch Phục hồi và Nâng cấp Phase U8: Lean OS, Gamification & Operation Parity

Phase U8 tập trung vào việc hoàn thiện các tính năng "Gamification" (Góp gạch), tích hợp sâu hệ điều hành dự án tinh gọn (Lean OS) và đạt được sự tương đồng 100% (Parity) cho các biểu mẫu vận hành nâng cao.

## 1. Gamification & Chất lượng dữ liệu (U8.1)
- **CompletenessRing Everywhere**: Tích hợp vòng tròn hoàn thiện dữ liệu vào `StandardTable` (dưới dạng cell type) và Header của `ThietBiDetailDrawer`.
- **Nâng cấp Góp gạch**: 
  - Cải thiện UX route `/_app/gop-gach`: thêm hiệu ứng "Streak" (chuỗi hoàn thành) và phân loại độ khó nhiệm vụ.
  - Kết nối điểm thưởng `dong_gop_diem` hiển thị trực tiếp trong `UserMenu` hoặc một Widget trên Dashboard cá nhân.
- **Data Quality Dashboard**: Hoàn thiện các biểu đồ trong `_app.chat-luong-du-lieu.tsx` để hiển thị "Top Đơn vị dẫn đầu" (Leaderboard).

## 2. Advanced Operation Parity (U8.2) - Đạt 100% "chaytot"
- **AI Extraction Parity**: Cổng logic trích xuất thông tin bằng AI (7-point extraction) từ `SuCoMoiForm` sang `BaoTriMoiForm` và `HongHocMoiForm`.
- **Voice-to-Text**: Khôi phục tính năng ghi âm nháp (Voice logging) cho tất cả các form vận hành.
- **Word/PDF Export**: Triển khai xuất văn bản (Word) cho Biên bản Sự cố, Bảo trì và Hỏng hóc dựa trên các mẫu chuẩn của "chaytot".

## 3. Project Lean OS & Dossier (U8.3)
- **Hill Charts**: Kết nối thành phần `HillChart` với trạng thái thực tế của `nhiem_vu_du_an` để theo dõi tiến độ phi tuyến tính.
- **Lean UX Canvas**: Tích hợp công cụ khám phá giải pháp vào luồng quản lý dự án.
- **Technical Dossier**: Kết nối `DossierRegister` với nền tảng OCR để hiển thị các tài liệu kỹ thuật đã được số hóa và trích xuất thông tin tự động.

## 4. Tinh chỉnh UI & Astryx Integration (U8.4)
- **MiratsButton Migration**: Chuyển đổi các nút bấm còn lại sang wrapper `MiratsButton` để đảm bảo nhất quán Hierarchy (Primary/Secondary/Ghost).
- **Phòng chống hồi quy**: Cập nhật `ui-audit` để kiểm tra cả các thành phần mới của Phase U8.

## Chi tiết kỹ thuật
- **Schema**: Sử dụng `dong_gop_diem` và `nhiem_vu_nhap_lieu` cho Gamification.
- **RPC**: Sử dụng `create_change_request` làm cổng duy nhất cho mọi đóng góp từ người dùng không có quyền admin.
- **AI**: Sử dụng Lovable AI Gateway cho việc trích xuất thực thể từ văn bản tự do trong các biểu mẫu.
