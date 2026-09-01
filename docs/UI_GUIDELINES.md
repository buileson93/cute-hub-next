# UI_GUIDELINES — Bộ luật giao diện MIRATS

> Tài liệu bắt buộc đọc trước khi viết hoặc sửa bất kỳ mã giao diện nào (route, component, style).
> Mọi quy tắc dưới đây bám sát code thực tế của repository này, không phải lý thuyết chung.

## 1. Mục đích và phạm vi

- Áp dụng cho **toàn bộ code UI mới hoặc được chỉnh sửa** trong `src/routes/**`, `src/components/**`, `src/styles.css`, `src/styles/**`.
- Thứ tự ưu tiên khi cần một mảnh giao diện:
  1. Dùng lại component trong `src/components/mirats/**`.
  2. Nếu không có, dùng primitive shadcn trong `src/components/ui/**`.
  3. Chỉ khi cả hai đều không đáp ứng mới tạo component mới, và đặt đúng thư mục theo miền (`table/`, `form/`, `layout/`, `hierarchy/`…).
- **Không thêm dependency UI mới** (UI kit, icon set, Storybook, visual-regression) — stack hiện tại đã đủ.
- Code legacy chưa tuân thủ **không bắt buộc refactor ngay**; baseline vi phạm được khoá bởi `src/__tests__/u4-visual-contract.test.ts` và `src/__tests__/ui-consistency-guard.test.ts` — chỉ được giảm, không được tăng.

## 2. Nguồn chuẩn (Source of Truth)

| Hạng mục | Vị trí duy nhất |
| --- | --- |
| Theme, CSS variables, Tailwind v4 | `src/styles.css` (`@theme inline`, layer `astryx-brand`) |
| Skin component Astryx | `src/styles/astryx-component-skins.css` |
| Cầu nối màu legacy → token (đảm bảo dark mode) | `src/styles/legacy-palette-bridge.css` |
| Typography (7 bậc) | `src/lib/mirats/ui/typography.ts` (`TYPO`) |
| Mật độ, spacing, chiều cao hàng/ô | `src/lib/mirats/ui/ui-density.ts` (`UI_DENSITY`) |
| Breakpoints dùng trong JS | `src/lib/mirats/ui/responsive-scope.ts` (`BP_PX`, `MOBILE_BREAKPOINT_PX`) |
| Icon dùng chung | `src/lib/mirats/ui/icon-registry.ts` (bọc `lucide-react`) |
| Trạng thái/nhãn nghiệp vụ | `src/lib/mirats/ui/status-registry.ts`, `status-tokens.ts` |
| Hành động dòng bảng | `src/components/mirats/table/RowActions.tsx` |
| Khung trang | `src/components/mirats/layout/PageFrame.tsx`, `src/components/mirats/PageHeader.tsx`, `src/components/mirats/PageBody.tsx` |
| Font | `@fontsource-variable/geist`, `@fontsource/ibm-plex-mono` (import trong `src/styles.css`) |

Cấm hard-code: mã màu (`#0074e2`, `bg-blue-500`), `text-[13px]`, `p-[7px]`, `shadow-[...]`, `rounded-[9px]` khi đã có token/class tương ứng. Dùng `text-primary`, `bg-muted`, `border-border`, `TYPO.BODY`, `UI_DENSITY.*`, `rounded-xl/2xl`.

## 3. Quy tắc thiết kế cơ bản

- **Typography**: chỉ tồn tại 7 bậc `DISPLAY | H1 | H2 | H3 | BODY | LABEL | MONO`. Mỗi trang đúng **một** `TYPO.H1` (thường do `PageHeader` render). Mọi số liệu kỹ thuật (mã, serial, toạ độ, số lượng) dùng `TYPO.MONO` (IBM Plex Mono + `tabular-nums`).
- **Màu**: chỉ dùng token semantic (`background`, `foreground`, `muted`, `primary`, `destructive`, `border`, `popover`). Xanh MIRATS `#0074e2` chỉ đến từ `--primary`, không viết trực tiếp.
- **Tương phản / dark mode**: dự án **có** dark mode (`@custom-variant dark`). Mọi màu mới phải khai báo qua token light-dark trong `src/styles.css`, không viết cặp `dark:bg-...` với màu tuyệt đối. Bề mặt nổi (tooltip, popover, dropdown) dùng `bg-popover` + `border-border`, **không** dùng nền `primary` đặc cho khối chứa chữ dài.
- **Radius/shadow**: container `rounded-2xl`, phần tử `rounded-xl`/`rounded-md`; đổ bóng dùng class skin (`astryx-card`) thay vì `shadow-[...]` tuỳ biến.
- **Mật độ**: layout phải hoạt động ở cả `data-density="compact|comfortable|spacious"`; không đặt chiều cao cứng cho hàng bảng.

## 4. Quy tắc component

- **Khung trang bắt buộc**: `PageFrame` → `PageHeader` → `PageBody`. Không tự dựng `mx-auto max-w-* px-6 py-8`.
- **Một chủ sở hữu cuộn (One Scroll Owner)**: shell và `PageFrame` không cuộn dọc; vùng cuộn nằm trong `PageBody` hoặc container bảng. Hợp đồng này được test bởi `src/__tests__/layout-scroll-contract.test.ts` và `table-scroll-contract.test.ts`.
- **Bảng**: dùng `StandardTable` (`src/components/mirats/StandardTable.tsx`) — đã có sticky header, filter cột, tìm kiếm toàn bộ dữ liệu, export CSV. Bảng nhỏ tĩnh mới được dùng `components/ui/table` và phải bọc `overflow-x-auto`.
- **Hành động trong bảng**: dùng `RowActionBar` + `RowActionButton` (icon-only, `tone: default | warning | destructive`, kích thước 36px mobile / 28px desktop). Không tự viết `<Button size="icon">` rời rạc trong cell.
- **Dialog/Sheet**: dùng `ResponsiveDialog` (tự chuyển Drawer trên mobile), `ConfirmDialog` cho xác nhận, `FormDialog` cho form ngắn. Nội dung dài phải `max-h-[90dvh] overflow-y-auto` để action bar không bị che.
- **Form dài / sheet chỉnh sửa thực thể**: dùng `EntityFormKit` (`EntityFormHeader`, `FormSection`, `FormActionBar`, `FormEmptyState`) và `Combobox` thay cho `Select` danh sách lớn.
- **Tooltip**: dùng `AppTooltip`; gợi ý ngữ cảnh dùng `InfoHint`. Không tự tạo tooltip mới.
- **Props & types**: props phải có type/interface tường minh, không `any`; luôn nhận `className?: string` và hợp nhất bằng `cn()`; `forwardRef` chỉ dùng khi wrap primitive Radix (như trong `src/components/ui/**`).
- **Semantic HTML**: hành vi bấm → `<button>`; điều hướng → `<Link>` của TanStack Router. Không dùng `div` + `onClick`.
- Không tạo component trùng chức năng đã có (kiểm tra bằng `rg` trong `src/components/mirats` trước khi tạo mới).

## 5. Form và validation

- Mỗi input có `<Label htmlFor>` (hoặc `aria-label` khi nhãn nằm ngoài). Trường bắt buộc đánh dấu rõ bằng chữ/dấu `*` **kèm** `aria-required`.
- Lỗi hiển thị bằng **text + icon**, không chỉ bằng màu; gắn `aria-invalid` và `aria-describedby` tới thông báo lỗi.
- Trạng thái gửi: nút submit `disabled` khi đang gửi (chống submit trùng), có nhãn tiến trình; **không** xoá dữ liệu người dùng khi lỗi.
- Đóng form khi có thay đổi chưa lưu phải hỏi xác nhận (mẫu: `NodeEditorSheet`, `FormActionBar`).
- Validate ở cả UI và trust boundary (server function / RLS). UI không được là lớp bảo vệ duy nhất.

## 6. Trạng thái bắt buộc của màn hình

Mọi màn hình đọc dữ liệu phải xử lý đủ **4 trạng thái** qua `DataState` (`src/components/mirats/DataState.tsx`):

| Trạng thái | Chuẩn dùng |
| --- | --- |
| Loading | `DataState state="loading" loadingType="table\|list\|card\|drawer"` (Skeleton) hoặc `LoadingState` |
| Empty | `EmptyState` — nêu nguyên nhân, phân biệt "chưa có dữ liệu" và "không khớp bộ lọc" (`isFiltering`), kèm CTA nếu có |
| Error | `ErrorState` / `DataState onRetry` — thông báo tiếng Việt rõ ràng + nút "Thử lại" |
| Success feedback | `toast` từ `sonner`; hoàn tác dùng `UndoToast` |

- Lỗi runtime cấp cây component bọc bằng `AppErrorBoundary`.
- Không để màn hình trắng, không để text placeholder kiểu "TODO/Coming soon".

## 7. Responsive và mobile-first

- Breakpoints Tailwind mặc định; trong JS **bắt buộc** import từ `responsive-scope.ts`, không viết số 768 rời rạc.
- Không tạo cuộn ngang ngoài ý muốn: vùng cuộn ngang duy nhất là container bảng (`overflow-x-auto`), tránh hai thanh cuộn lồng nhau.
- Mobile: bảng chuyển sang `MobileRecordCard` hoặc cho cuộn ngang có sticky cột đầu; bộ lọc chuyển `MobileListControlsSheet`; dialog chuyển drawer qua `ResponsiveDialog`.
- Action bar/sticky footer trong form phải nằm trong vùng an toàn, không đè nội dung cuối.
- Vùng chạm tối thiểu 36px trên mobile (đã chuẩn hoá trong `ROW_ACTION_BUTTON_CLASS`).
- Hợp đồng mobile được kiểm bằng `src/__tests__/u6-mobile-contract.test.ts`.

## 8. Accessibility

- Semantic HTML trước ARIA; chỉ thêm ARIA khi HTML không diễn đạt được.
- Nút icon-only **bắt buộc** `aria-label` hoặc bọc `AppTooltip` (guard: `u4-visual-contract`).
- Ảnh có nghĩa phải có `alt`; ảnh trang trí `alt=""`.
- Focus: giữ `focus-visible:ring` mặc định, không `outline-none` trần.
- Dialog/Sheet/Popover dùng primitive Radix trong `src/components/ui/**` để có focus trap và ESC; không tự dựng overlay.
- Tương phản: chữ trên bề mặt phải dùng cặp token (`bg-popover`/`text-popover-foreground`, `bg-muted`/`text-muted-foreground`), kiểm cả light lẫn dark.

## 9. Icon, hình ảnh, nội dung

- Icon: chỉ `lucide-react`, ưu tiên qua `icon-registry.ts`. Kích thước chuẩn `h-4 w-4` (mobile row action) / `h-3.5 w-3.5` (desktop row action) / `h-5 w-5` (header).
- **Không dùng emoji làm icon UI** trong sản phẩm (emoji chỉ được xuất hiện trong tài liệu Markdown).
- Ảnh: dùng `loading="lazy"`, có fallback khi lỗi (mẫu: `ZoomableImage`, `PhotoUpload`).
- Ngôn ngữ UI: **tiếng Việt có dấu**, nhãn ngắn gọn, thuật ngữ nghiệp vụ theo `src/lib/mirats/db-taxonomy.ts` — tuyệt đối không lộ mã kỹ thuật/UUID/enum thô (`KHAC`, `N1`) ra giao diện; dùng `displayLabel()`.

## 10. Checklist trước khi merge

- [ ] Đã tái sử dụng component/token có sẵn (`components/mirats/**`, `TYPO`, `UI_DENSITY`) thay vì tự chế?
- [ ] Trang dùng `PageFrame → PageHeader → PageBody` và chỉ có một vùng cuộn?
- [ ] Đủ 4 trạng thái: loading, empty, error (có retry), success/toast?
- [ ] Form: label, required, lỗi có text+icon, chặn submit trùng, hỏi khi đóng lúc dirty?
- [ ] Responsive mobile + desktop, không cuộn ngang ngoài ý muốn, vùng chạm ≥ 36px?
- [ ] Keyboard/focus-visible, `aria-label` cho nút icon-only, semantic HTML?
- [ ] Không hard-code màu/typography/spacing trái token; dark mode vẫn đủ tương phản?
- [ ] Không thêm dependency hoặc component trùng lặp?
- [ ] Đã chạy `bun run typecheck`, `bun run test`, `bun run ui:audit` (không tăng vi phạm baseline)?

## 11. Tài liệu liên quan

- `docs/astryx-ui-standard.md` — tóm tắt kiến trúc design system Astryx.
- `docs/ui-consistency-checklist.md` — cách xử lý khi guard test báo lỗi.
- `docs/handbook/04-quy-uoc/` — quy ước đặt tên, comment, test, grant.
