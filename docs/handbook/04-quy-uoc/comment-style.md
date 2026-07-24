# 04 — Comment style

## TypeScript / TSX

**Mọi export** trong `src/lib/mirats/`, `src/hooks/`, `src/lib/*.functions.ts` phải có JSDoc.

Mẫu tối thiểu:

```ts
/**
 * Trả về ma trận quyền GHI của user hiện tại.
 * Cache 60s trong TanStack Query.
 *
 * @param module  Module cần kiểm (vd: 'thiet_bi')
 * @param action  Hành động ('insert' | 'update' | 'delete')
 * @returns boolean — true nếu được phép GHI
 *
 * @remarks
 * - Admin luôn trả true.
 * - Đọc từ RPC `get_my_permissions` (SECURITY DEFINER).
 */
export function useCan(module: string, action: string): boolean { ... }
```

Ba khối bắt buộc: **mục đích 1 dòng**, **tham số/return**, **@remarks** cho side-effect/cache/RLS.

Component:

```ts
/**
 * Dialog khai thêm thành phần hệ thống vào cây.
 *
 * Props:
 * - parentId: id thành phần cha (nullable = gắn vào gốc hệ thống)
 * - onSuccess: callback sau khi RPC thành công
 *
 * Gọi RPC `khai_them_thanh_phan_he_thong` (owner=postgres, SECURITY DEFINER).
 * Không cần refetch — TanStack Query invalidate qua realtime channel `he_thong_thanh_phan`.
 */
export function KhaiThemThanhPhanDialog(props: Props) { ... }
```

## SQL — bảng, cột, function

Mọi migration mới cần `COMMENT ON`:

```sql
COMMENT ON TABLE public.<bang> IS
'<Miền>. <Mục đích 1 dòng>. <Ghi chú quan trọng, vd: kế thừa đơn vị>.';

COMMENT ON COLUMN public.<bang>.<cot> IS
'<Ý nghĩa>. <Đơn vị đo hoặc format nếu có>. <Ràng buộc>.';

COMMENT ON FUNCTION public.<name>(<args>) IS
'<Mục đích>. Owner=postgres, SECURITY DEFINER. Caller: <ai gọi>. '
'Side-effect: <ghi bảng nào, gửi event nào>. GRANT: authenticated, service_role, sandbox_exec, postgres.';
```

## Không làm

- Không viết comment giải thích tên biến hiển nhiên.
- Không copy-paste code vào JSDoc.
- Không dùng emoji trong JSDoc/COMMENT ON.
- Không đưa TODO không có ngày/chủ đề.

## Audit thiếu comment

Script `scripts/docs-audit.mjs` (sẽ viết) quét:
- `rg -n "^export (function|const|class)" src/lib/mirats src/hooks src/lib/*.functions.ts` và so với dòng trên (kiểm `*/`).
- SQL: `SELECT * FROM pg_class WHERE relnamespace='public'::regnamespace AND obj_description(oid,'pg_class') IS NULL`.

Xuất báo cáo `docs/handbook/_audit.md` (không commit nếu quá dài).
