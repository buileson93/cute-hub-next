# Runbook: Xoay vòng Khóa ký hệ thống (System Signing Key Rotation)

**Trạng thái**: Khóa cũ (`c14c1ebb-...`) được đánh dấu là **COMPROMISED** do bị lộ trong source tree.

## 1. Tạo Khóa ký mới
Khóa ký mới phải được tạo thông qua logic server-side an toàn, không được tạo thủ công hoặc để lộ ra ngoài.

### Lệnh tạo khóa (Server Function)
Sử dụng hàm `ensureSigningKey()` trong hệ thống (nếu đã có) hoặc chạy script admin:
```bash
# Script này chỉ chạy trên môi trường Server an toàn
node -e "import('./src/lib/security/keys.server').then(m => m.generateNewKey())"
```

## 2. Cập nhật Biến môi trường
Cập nhật các giá trị sau trong Lovable Cloud Console (không commit vào `.env`):
- `SYSTEM_SIGNING_KEY_ID`: ID của khóa mới.
- `SYSTEM_SIGNING_PRIVATE_KEY`: Private key (B64) tương ứng.

## 3. Xử lý Dữ liệu cũ (Legacy Verification)
Các tài liệu, form đã ký bằng khóa cũ cần được xử lý:
- **Revoke**: Đánh dấu tất cả chữ ký cũ là "Legacy" hoặc yêu cầu ký lại nếu cần tính pháp lý cao.
- **Verification**: Logic kiểm tra chữ ký (`verifySignature`) cần hỗ trợ kiểm tra chéo với danh sách các khóa cũ đã bị thu hồi nếu muốn duy trì khả năng đọc tài liệu cũ.

## 4. Xóa dấu vết
- [x] Đã xóa dump data chứa khóa cũ.
- [ ] Yêu cầu quản trị viên DB xóa dòng tương ứng trong bảng `system_signing_key` trên môi trường Production.

## 5. Danh sách Artifacts cần Purge
Cần xóa hoặc ghi đè history cho các tệp sau nếu đã được phát hành (published):
- Các phiên bản build cũ chứa bundle có nhúng tệp dump.
- Cache của các CDN nếu có.
