# GĐ3-04 — QR Scanner In-app

## Goal
Thêm scanner camera trong app để tech quét QR mở landing card ngay, thay vì chuyển sang app camera OS.

## Acceptance
- Nút "Quét QR" trong header + `/q` route index.
- Dùng `@zxing/browser` hoặc `barcode-detector` API (native khi có).
- Preview camera live, decode → điều hướng `/q/$maThietBi`.
- Fallback nếu không cấp quyền: nhập mã thủ công.

## Tests (viết trước)
1. Mock `BarcodeDetector` → phát fake decode → navigate URL đúng.
2. Deny permission → hiện fallback input.
3. Nhập mã thủ công → navigate đúng.
4. Preview camera stream cleanup khi unmount (verify track.stop).

## Steps
1. `bun add @zxing/browser` (fallback) — check kích thước bundle.
2. Component `<QRScanner onDetect />`.
3. Route `/q/index.tsx` với scanner.
4. Nút scanner header (icon camera).

## Definition of Done
- [ ] Test xanh.
- [ ] Manual: mở trên mobile, quét QR test → mở landing.
- [ ] Cleanup camera track khi rời trang.

## Rollback
Ẩn nút scanner; xoá route index; giữ landing `/q/$id` như cũ.
