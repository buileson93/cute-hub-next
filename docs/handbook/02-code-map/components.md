# 02 — Code map: Components (`src/components/mirats/`)

212 component nghiệp vụ. shadcn primitives ở `src/components/ui/`.

## Cấu trúc thư mục mới (Đợt tái cấu trúc 8/2026)

- `app-shell/`: Layout chính, navigation, user profile, `MobileNav`.
- `he-thong-cay/`: Logic hiển thị cây kỹ thuật, `TreeView`, `CayMindMap`.
- `thiet-bi-detail/`: Sổ lý lịch tài sản, các tab thông tin chi tiết, `ThietBiDetailDrawer`.
- `phan-quyen/`: Ma trận quyền, logic RBAC, `MultiRoleBadge`.
- `vat-tu/`: Quản lý kho, dự phòng, tương thích vật tư.
- `tuan-thu/`: Quản lý giấy phép (GPKT), kiểm định, cảnh báo.
- `so-ly-lich/`: Các component đặc thù cho việc in ấn và xem lịch sử tài sản.

## Nhóm chính

### Layout & shell
`AppShell`, `PageHeader`, `PageTransition`, `AppErrorBoundary`, `AccessDenied`, `ErrorState`, `EmptyState`, `LoadingState`, `Skeletons`, `SavingIndicator`, `OfflineBanner`, `OfflineBadge`, `NotificationBell`, `TzClock`, `NetworkOverview`.

### Sidebar & nav
`RecentPinnedFlyout`, `RecentPinnedRailButton`, `CommandPalette`, `CommandPaletteButton`, `ContextualToolbar`, `ProductTour`, `HelpDrawer`, `QrScanButton`, `VoiceQuickLog`, `VisionImageHint`, `DailyBrief`.

### Bảng & danh mục
`StandardTable`, `CatalogTable`, `CatalogTools`, `ListToolbar`, `BulkActionBar`, `Combobox`, `ReferenceCell`, `CodeBadge`, `StatusBadge`, `MauChip`, `AnomalyBadge`, `ExpiringBadge`, `ExpiringWidget`, `ReadOnlyBadge`, `UndoToast`, `AutoFilledBadge`.

### Tài sản & hệ thống
`ThanhPhanManager`, `ThanhPhanTable`, `ThanhPhanChiTietDialog`, `ThaoTaiSanDialog`, `KhaiThemDialogs`, `AssignSystemDialog`, `PreviewKhaiDialog`, `LienKetForm`, `HeThongLienKetTab`, `HeThongTruongEditor`, `KheLinhKienPanel`, `ChungChiPanel`, `VongDoiPanel`, `DeviceMovementHistory`, `LyLichThietBiPanel`, `LyLichLayerPanel`, `SystemInternalGraph`, `GraphCanvas`, `NetworkOverview`.

### Tài sản chi tiết
`ThietBiFormDialog`, `ThietBiAllFields`, `ThietBiDetailDrawer`, `ThietBiLifecycleActions`, `ThietBiTepDinhKem`, `DetailDrawer`.

### Ảnh & media
`PhotoUpload`, `ImageCropDialog`, `ZoomableImage`, `ViTriMediaViewer`, `PanoViewer`, `Model3DViewer`, `AtcTowerScene`.

### Forms
`SchemaDialog`, `FormDialog`, `SimpleFormDesigner`, `FormFieldRuntime`, `FormLivePreview`, `FormVersionIncludePanel`, `DynamicFieldsForm`, `CustomFieldsForm`, `CustomFieldsView`, `FieldInspector`, `FieldPreview`, `FieldAttachSlot`, `InlineField`, `ChecklistRenderer`, `SignaturePad`, `SignatureSlotsView`, `MultiSignatureFlow`.

### Import/Export
`AllInOneImport`, `AllInOneExportPanel`, `AllInOneGuide`, `PrepareCatalogs`, `ImportPreviewDialog`, `ImportBatchHistory`.

### Vận hành
`GiayPhepFormDialog`, `KiemKeDialog`, `CapPhatControl`, `VatTuTieuHaoInline`, `VatTuTieuHaoView`, `ResolutionReview`, `ChangeLogPanel`, `ChangeDiffDialog`, `CayThayDoiPanel`, `ModelDacTinhIODialog`, `ModelTaiLieu`.

### Tương tác
`AiChatButton`, `AnnotationManager`, `CenterHoverCard`, `EntityHoverCard`, `AppTooltip`, `InfoGrid`, `InfoHint`, `NodeNoteDrawer`, `SoDoTabs`, `QRScanner`, `CheckinMap`, `DirectMessages`, `UserAvatar`, `PasskeyManager`, `PermGate`, `DensityToggle`, `CollapsibleSection`, `ConfirmDialog`, `ActionBar`.

## Quy ước component

- Component nghiệp vụ đặt trong `src/components/mirats/`.
- shadcn primitive không đụng vào business logic.
- Không hardcode màu — dùng token trong `src/styles.css` (`bg-primary`, `text-foreground`…).
- Dialog dùng `SchemaDialog` (primitive tháng 7/26) thay cho ad-hoc.
