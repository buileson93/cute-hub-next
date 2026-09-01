# Kế hoạch chuẩn hóa scroll nội bộ toàn hệ thống

## Mục tiêu
Giữ nguyên kiến trúc Astryx hiện tại, sửa tối thiểu chuỗi chiều cao/overflow để AppShell không cuộn, còn nội dung mỗi route cuộn dọc trong vùng content; public page tiếp tục body-scroll tự nhiên.

## Phạm vi thay đổi
1. **Sửa lỗi biên dịch được báo cáo**
   - Xác minh `Footer.tsx/currentYear` trong cây nguồn và log build; nếu file tồn tại thì khai báo năm theo cách type-safe, nếu không tồn tại thì xác nhận lỗi đến từ cache/stale source và không tạo Footer mới ngoài phạm vi.

2. **Khôi phục chuỗi chiều cao chuẩn dùng chung**
   - `AppShell`: giữ shell ở `h-dvh overflow-hidden`; sửa main thành flex child có `min-h-0 min-w-0 overflow-hidden`, bỏ chiều cao xung đột.
   - `PageTransition`: biến wrapper animation thành flex column `flex-1 min-h-0 min-w-0 overflow-hidden` để không phá chuỗi scroll.
   - `PageFrame`: dùng chiều cao của parent (`h-full flex-1 min-h-0`) thay vì chiếm lại toàn viewport bằng `h-dvh`.
   - `PageBody`: tiếp tục là scroll owner mặc định với `overflow-y-auto`, thêm `min-w-0`/overscroll phù hợp nếu thiếu.
   - Không khóa `html/body` toàn cục để các route public/độc lập vẫn cuộn tự nhiên.

3. **Sửa các ngoại lệ thực tế**
   - Chuẩn hóa những route nội bộ trực tiếp đang thiếu scroll owner hoặc đang dùng `overflow-hidden` mà không có vùng con cuộn.
   - Chỉ chỉnh các route/component được audit xác nhận lỗi; không bọc lại parent route chỉ chứa `<Outlet />`, không tạo framework mới.
   - Với bảng: giữ cuộn ngang trong table container, không chuyển page thành horizontal scroll owner.

4. **Overlay dài**
   - Chuẩn hóa `SheetContent`/`DrawerContent` dùng chiều cao tối đa viewport và flex/min-height đúng; vùng nội dung dài cuộn nội bộ, footer/action không bị che.
   - Giữ nguyên body scroll-lock mặc định của Radix/Vaul và responsive hiện tại.

5. **Kiểm thử hồi quy**
   - Bổ sung kiểm tra runnable cho contract class của `AppShell → PageTransition → PageFrame → PageBody`.
   - Mở rộng Playwright kiểm tra route đại diện: dashboard, table/list, detail/form, settings/profile, tabs/split panel và overlay ở 375/768/1440px.
   - Xác minh: `document.scrollingElement.scrollTop` không đổi trong app shell; content owner cuộn tới cuối; không overflow ngang ở page; header/sidebar giữ vị trí; focus/keyboard và overlay scroll hoạt động.
   - Chạy test liên quan, typecheck, build và đọc bản ghi mới nhất trong `/tmp/observability/build-errors.log`.

## Chi tiết kỹ thuật
```text
viewport (AppShell: overflow hidden)
└── header + main (main: flex-1 min-h-0 overflow-hidden)
    └── transition (flex-1 min-h-0 overflow-hidden)
        └── PageFrame (h-full flex-1 min-h-0 overflow-hidden)
            ├── PageHeader (shrink-0)
            └── PageBody (flex-1 min-h-0 overflow-y-auto)
```

Public/auth/QR routes ngoài AppShell vẫn dùng `min-h-dvh` và body scroll theo thiết kế hiện tại.
