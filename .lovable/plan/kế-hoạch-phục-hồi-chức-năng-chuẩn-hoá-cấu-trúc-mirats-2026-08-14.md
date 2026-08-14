# Kế hoạch Phục hồi Chức năng & Chuẩn hoá Cấu trúc MIRATS

## 1. Kết nối CayThayDoiPanel (Thay đổi & Hoàn tác)

Phục hồi luồng xử lý từ nút "Lịch sử thay đổi" đến Panel quản lý thay đổi hệ thống.

### Bảng đối soát hành vi & dữ liệu
| Hành vi còn thiếu | File:Dòng | Dữ liệu/Hook | Trạng thái | Giải pháp |
| :--- | :--- | :--- | :--- | :--- |
| **Mở Panel Reorg** | `NodeEditorSheet.tsx:272` | `setReorgOpen(true)` | Đã có | Nối `reorgOpen` vào `CayThayDoiPanel` trong route. |
| **Xem lịch sử** | `CayThayDoiPanel.tsx` | `useCayThayDoi()` | Hiện hữu | Giữ nguyên, đã kết nối `cay_thay_doi`. |
| **Duyệt/Từ chối** | `CayThayDoiPanel.tsx` | `useCayRpc().duyet` | Hiện hữu | Giữ nguyên, gọi RPC `cay_duyet`. |
| **Hoàn tác** | `CayThayDoiPanel.tsx` | `useCayRpc().hoanTac` | Hiện hữu | Giữ nguyên, gọi RPC `cay_hoan_tac`. |
| ** isAdmin ** | `_app.he-thong.cay.tsx` | `useSession().roles` | Cần nối | Truyền `isAdmin` từ session vào Panel. |
| ** htNameMap ** | `_app.he-thong.cay.tsx` | `taxonomy.htNameMap` | Hiện hữu | Truyền từ taxonomy map đã có. |

### Sơ đồ luồng (Button -> Mutation)
```text
[NodeEditorSheet] -> Click "Lịch sử thay đổi" -> setReorgOpen(true) (CayContext)
      |
      V
[CayContext] -> reorgOpen: true
      |
      V
[_app.he-thong.cay.tsx] -> <CayThayDoiPanel open={reorgOpen} ... />
      |
      V
[CayThayDoiPanel] -> mutation: duyet/hoanTac -> RPC: cay_duyet/cay_hoan_tac -> Database
```

## 2. Chuẩn hoá Tab Phân quyền

Loại bỏ tình trạng `TabsContent` lồng nhau gây sai lệch layout.

### Danh sách file loại bỏ TabsContent thừa
| File | Hành động | Ghi chú |
| :--- | :--- | :--- |
| `src/components/mirats/phan-quyen/DistributionStats.tsx` | Xoá `<TabsContent value="phanbo">` | Trả về nội dung Card thuần. |
| `src/components/mirats/phan-quyen/AuditLogViewer.tsx` | Xoá `<TabsContent value="audit">` | Trả về nội dung Card thuần. |
| `src/components/mirats/phan-quyen/SecurityPolicies.tsx` | Xoá `<TabsContent value="policy">` | Trả về nội dung Card thuần. |

**Lưu ý**: File `src/routes/_app.phan-quyen.tsx` sẽ giữ vai trò duy nhất quản lý các wrapper `TabsContent`.

## 3. Nâng cấp Kiểm thử Integrity Guard

Chuyển đổi từ cảnh báo sang cưỡng bức lỗi (Fail CI) để chống hồi quy.

### Các thay đổi trong `structural-integrity.test.ts`
- **Orphan Scan**: Chuyển `console.warn` thành `expect(orphans).toHaveLength(0)`.
- **Tab Validation**: 
    - Kiểm tra đếm số lượng `TabsTrigger` vs `TabsContent`.
    - Regex phát hiện `<TabsContent.*<TabsContent` (lồng nhau).
- **State Consumer Check**: Quét các hàm `setOpen`, `setReorgOpen`... và kiểm tra xem có component nào nhận prop `open={...}` tương ứng không.

## 4. Chi tiết kỹ thuật

### isAdmin source
```typescript
// Trong _app.he-thong.cay.tsx
const { roles } = useSession();
const isAdmin = roles.includes('admin');
```

### htNameMap source
```typescript
// Lấy từ taxonomy đã load
const { data: taxonomy } = useQuery(dbTaxonomyOptions);
const htNameMap = taxonomy?.htNameMap;
```
