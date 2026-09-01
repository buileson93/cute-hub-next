<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Quy tắc bắt buộc cho thay đổi giao diện

> [!IMPORTANT]
> Mọi thay đổi frontend/UI (route, component, style) **phải đọc và tuân thủ**
> [`docs/UI_GUIDELINES.md`](./docs/UI_GUIDELINES.md) trước khi viết code:
> tái sử dụng component/token có sẵn, dùng khung `PageFrame → PageHeader → PageBody`,
> đủ 4 trạng thái (loading/empty/error/success), responsive, accessibility,
> không hard-code màu/typography/spacing và không thêm dependency UI mới.
> Trước khi mở PR, chạy hết mục "Checklist trước khi merge" trong tài liệu đó.
