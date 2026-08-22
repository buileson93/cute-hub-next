# Ma trận xác minh MIRATS (Verification Matrix)

Cập nhật: 22/08/2026

## 1. Môi trường & Thiết bị

| Thiết bị | Trình duyệt       | Viewport | Trạng thái | Ghi chú                   |
| :------- | :---------------- | :------- | :--------- | :------------------------ |
| Desktop  | Chrome            | 1440x900 | ✅         | FitViewport hoạt động tốt |
| Tablet   | Chrome (Emulated) | 1024x768 | ✅         | Sidebar thu gọn tự động   |
| Mobile   | Chrome (Emulated) | 390x844  | ✅         | MobileRecordCard hiển thị |

## 2. Tương tác (Interactions)

- [x] **Bàn phím**: Tab qua các nút, Space/Enter để kích hoạt.
- [x] **Focus**: `focus-visible` hiển thị rõ ràng với viền MIRATS Blue.
- [x] **Thoát**: Escape đóng các Dialog/PowerSearch.

## 3. DataTableCore & StandardTable (U9 - U10.2)

| Kịch bản          | Trạng thái | Minh chứng                           |
| :---------------- | :--------- | :----------------------------------- |
| Empty Data        | ✅         | Hiển thị "Không có dữ liệu hiển thị" |
| Loading           | ✅         | Spinner hoạt động                    |
| Long Text         | ✅         | Cắt hoặc xuống dòng theo config      |
| Sticky Header     | ✅         | Không mất border (border-separate)   |
| Sticky Column     | ✅         | Hoạt động mượt mà                    |
| Horizontal Scroll | ✅         | Thanh cuộn mỏng (mirats-scroll)      |
| Virtualization    | ✅         | Render < 100 <tr> cho 1000+ rows    |
| Infinite Scroll   | ✅         | Trigger onLoadMore khi cuộn cuối     |

## 4. Guardrails (U10)

- [x] **ESLint**: Chặn raw `<button>` và `<table>`.
- [x] **Audit**: Phát hiện icon-only button thiếu label.
- [x] **Build**: Mọi quy trình build-dev và production thành công.
