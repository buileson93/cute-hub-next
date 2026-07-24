// ============================================================================
// ImportEngine CHUNG — hợp đồng + bản cài đặt "server" nối vào runBulkImport.
//
// Mục tiêu: gom mọi đường nhập về MỘT hợp đồng thống nhất, để mọi nút "Nhập"
// đều parse → preview (từng dòng: action + cảnh báo) → commit đi qua cùng một
// logic server (runBulkImport). Cùng file + cùng ngữ cảnh ⇒ KẾT QUẢ GIỐNG
// Import Studio (nhập liệu all-in-one).
//   * Đường A — runBulkImport (server): admin Nhập/Xuất hàng loạt + All-in-one.
//   * Đường B — upsert trực tiếp (client): CatalogTools, NhaSanXuatTools.
//   * Đường C — upsert trực tiếp (client): cây Hệ thống (cay_node_edit).
//
// `createServerImportEngine` nhận sẵn hàm gọi runBulkImport (đã bind
// useServerFn) nên FILE NÀY vẫn client-safe (không import module server-only) và
// dễ test bằng mock. Chuyển từng màn hình sang engine được bảo vệ bằng cờ
// `importEngineUnified` + test đặc tả. Xem docs/IMPORT_ENGINE_AUDIT.md.
// ============================================================================

/** Hành động dự kiến cho một dòng sau khi đối chiếu với CSDL sống. */
export type ImportAction = "create" | "update" | "error" | "skip";

/** Kết quả xem trước cho MỘT dòng (đủ để render bảng preview thống nhất). */
export interface ImportRowPreview {
  /** Số thứ tự dòng trong file (0-based). */
  index: number;
  action: ImportAction;
  /** Khóa tự nhiên đã xác định (mã) — tự sinh nếu bỏ trống. */
  key: string;
  /** Lỗi chặn ghi (dòng sẽ bị bỏ khi commit). */
  messages: string[];
  /** Cảnh báo mềm (vẫn ghi): trùng serial, khớp gần đúng, danh mục sắp tạo… */
  warnings: string[];
  /** Danh mục nền sẽ được tạo mới kèm theo dòng này. */
  refCreations: string[];
}

/** Tổng hợp toàn phiên xem trước. */
export interface ImportPreviewResult {
  total: number;
  create: number;
  update: number;
  error: number;
  rows: ImportRowPreview[];
  /** Danh mục nền "guard" đang thiếu, chờ admin xác nhận cho tạo mới. */
  refConfirm?: Array<{ table: string; label: string; value: string }>;
}

/** Tuỳ chọn chung cho một phiên nhập. */
export interface ImportRunOptions {
  /** id entity trong import-config ("thiet_bi" | "dm_he_thong" | "danh_muc"…). */
  entity: string;
  /** Với danh mục nền: bảng cụ thể. */
  catTable?: string;
  /** Dòng thô đã ánh xạ về key trường CSDL. */
  rows: Array<Record<string, string>>;
  /** Giá trị mặc định áp cho ô trống (key trường → giá trị). */
  defaults?: Record<string, string>;
  /** Bản ghi "sắp có" từ lớp cha trong cùng file (chỉ dùng khi preview). */
  extraRefs?: Record<string, Array<{ ma?: string; ten?: string }>>;
  /** Bảng danh mục nền admin đã cho phép tự tạo khi thiếu. */
  allowRefCreate?: string[];
}

/**
 * Hợp đồng CHUNG: mọi đường nhập chỉ cần cài `preview` (không ghi) và `commit`
 * (ghi thật). UI xem trước (ImportPreviewDialog / trang admin) chỉ phụ thuộc
 * vào interface này, không cần biết chạy trên server hay client.
 */
export interface ImportEngine {
  /** Đối chiếu với CSDL sống, KHÔNG ghi. */
  preview(opts: ImportRunOptions): Promise<ImportPreviewResult>;
  /** Ghi thật; trả về tổng hợp đã áp dụng. */
  commit(opts: ImportRunOptions): Promise<ImportPreviewResult>;
}

// ============================================================================
// Bản cài đặt "server": nối ImportEngine vào runBulkImport. Nhận sẵn hàm gọi
// (đã bind useServerFn ở client) để FILE NÀY vẫn client-safe và DỄ TEST (mock).
// ============================================================================

/** Payload đúng theo InputSchema của runBulkImport. */
export interface BulkImportInput {
  entity: string;
  catTable?: string;
  rows: Array<Record<string, string>>;
  commit: boolean;
  viTriParentId?: string | null;
  defaults?: Record<string, string>;
  extraRefs?: Record<string, Array<{ ma?: string; ten?: string }>>;
  allowRefCreate?: string[];
}

/** Một dòng trong `preview` do runBulkImport trả về. */
export interface BulkPreviewRow {
  index: number;
  action: "create" | "update" | "error";
  key: string;
  messages: string[];
  warnings: string[];
  refCreations: string[];
}

/** Kết quả runBulkImport (xem trước hoặc ghi thật). */
export interface BulkImportResult {
  committed: boolean;
  summary: {
    total: number;
    create: number;
    update: number;
    error: number;
    refCreate: number;
    refConfirm: number;
    created?: number;
    updated?: number;
    writeErrors?: number;
  };
  preview?: BulkPreviewRow[];
  errors?: Array<{ key: string; message: string }>;
  confirms?: Array<{ table: string; label: string; value: string }>;
  entity: string;
  table: string;
}

/** Chữ ký của hàm gọi runBulkImport (server fn đã bind bằng useServerFn). */
export type RunBulkImport = (args: { data: BulkImportInput }) => Promise<BulkImportResult>;

/**
 * Ngữ cảnh màn hình → tự điền vào mọi lần nhập (entity, danh mục nền, giá trị
 * mặc định, vị trí cha, danh mục nền được phép tự tạo). Nhờ đó các nút "Nhập"
 * rải rác không cần người dùng chọn lại entity/đơn vị/hệ thống — chúng bám theo
 * đúng màn hình đang mở, giống Import Studio suy ra từ tên sheet.
 */
export interface ImportEngineContext {
  entity: string;
  catTable?: string;
  defaults?: Record<string, string>;
  viTriParentId?: string | null;
  allowRefCreate?: string[];
}

/** Dựng ImportRunOptions từ ngữ cảnh màn hình + các dòng đã ánh xạ field key. */
export function buildRunOptions(
  ctx: ImportEngineContext,
  rows: Array<Record<string, string>>,
  extraRefs?: Record<string, Array<{ ma?: string; ten?: string }>>,
): ImportRunOptions {
  const opts: ImportRunOptions = {
    entity: ctx.entity,
    // catTable chỉ có ý nghĩa với entity "danh_muc" (danh mục nền).
    catTable: ctx.entity === "danh_muc" ? ctx.catTable : undefined,
    rows,
  };
  if (ctx.defaults && Object.keys(ctx.defaults).length) opts.defaults = ctx.defaults;
  if (ctx.allowRefCreate && ctx.allowRefCreate.length) opts.allowRefCreate = ctx.allowRefCreate;
  if (extraRefs) opts.extraRefs = extraRefs;
  return opts;
}

/** Ánh xạ payload gửi lên runBulkImport (đúng shape Import Studio dùng). */
export function toBulkInput(opts: ImportRunOptions, commit: boolean): BulkImportInput {
  const input: BulkImportInput = {
    entity: opts.entity,
    catTable: opts.entity === "danh_muc" ? opts.catTable : undefined,
    rows: opts.rows,
    commit,
  };
  if (opts.defaults && Object.keys(opts.defaults).length) input.defaults = opts.defaults;
  // extraRefs chỉ dùng cho XEM TRƯỚC (commit thật đã ghi cha trước đó).
  if (!commit && opts.extraRefs) input.extraRefs = opts.extraRefs;
  if (opts.allowRefCreate && opts.allowRefCreate.length) input.allowRefCreate = opts.allowRefCreate;
  return input;
}

/** Chuẩn hoá kết quả runBulkImport → ImportPreviewResult (UI chỉ biết interface này). */
export function normalizeResult(res: BulkImportResult): ImportPreviewResult {
  const previewRows: ImportRowPreview[] = (res.preview ?? []).map((p) => ({
    index: p.index,
    action: p.action,
    key: p.key,
    messages: p.messages ?? [],
    warnings: p.warnings ?? [],
    refCreations: p.refCreations ?? [],
  }));
  // Khi ghi thật không có `preview`; suy các dòng lỗi từ `errors`.
  if (previewRows.length === 0 && res.errors?.length) {
    for (const e of res.errors) {
      previewRows.push({ index: -1, action: "error", key: e.key, messages: [e.message], warnings: [], refCreations: [] });
    }
  }
  return {
    total: res.summary.total,
    create: res.summary.created ?? res.summary.create,
    update: res.summary.updated ?? res.summary.update,
    error: (res.summary.writeErrors ?? res.summary.error) || 0,
    rows: previewRows,
    refConfirm: res.confirms,
  };
}

/**
 * Engine "server": preview/commit đều đi qua runBulkImport → cùng một logic
 * đối chiếu, kế thừa, chống trùng, guard danh mục nền như Import Studio.
 */
export function createServerImportEngine(run: RunBulkImport): ImportEngine {
  return {
    async preview(opts) {
      return normalizeResult(await run({ data: toBulkInput(opts, false) }));
    },
    async commit(opts) {
      return normalizeResult(await run({ data: toBulkInput(opts, true) }));
    },
  };
}
