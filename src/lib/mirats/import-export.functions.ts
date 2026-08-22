// ============================================================================
// Server function: Nhập hàng loạt (upsert) cho tài sản / hệ thống / danh mục /
// giấy phép. Có 2 chế độ: xem trước (commit=false, không ghi) và ghi thật
// (commit=true). Chỉ Admin được thực hiện.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import { findEntity, noAccent, type EntityDef, type FieldDef } from "@/lib/mirats/import-config";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: chỉ Admin được nhập liệu hàng loạt");
}

function toISODate(v: string): string | null {
  const t = (v || "").trim();
  if (!t) return null;
  const m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return t;
}

function coerce(field: FieldDef, raw: string): { value: unknown; error?: string } {
  const v = (raw ?? "").trim();
  if (v === "") return { value: null };
  switch (field.kind) {
    case "int": {
      const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
      return Number.isFinite(n)
        ? { value: n }
        : { value: null, error: `"${field.label}" không phải số nguyên` };
    }
    case "num": {
      const n = parseFloat(v.replace(",", "."));
      return Number.isFinite(n)
        ? { value: n }
        : { value: null, error: `"${field.label}" không phải số` };
    }
    case "date":
      return { value: toISODate(v) };
    default:
      return { value: v };
  }
}

interface RefIndex {
  table: string;
  byMa: Map<string, any>;
  byTen: Map<string, any>;
  byTight: Map<string, any>;
  create: boolean;
}

/** Khóa "chặt": bỏ dấu + bỏ mọi ký tự không phải chữ/số → bắt trùng gần đúng. */
function tightKey(s: string): string {
  return noAccent(s).replace(/[^a-z0-9]+/g, "");
}

type PreviewRow = {
  index: number;
  action: "create" | "update" | "error" | "skip";
  key: string;
  messages: string[];
  warnings: string[];
  refCreations: string[];
};

const InputSchema = z.object({
  entity: z.string(),
  catTable: z.string().optional(),
  rows: z.array(z.record(z.string(), z.string())).max(5000),
  commit: z.boolean().default(false),
  /** Vị trí cha mặc định: mọi vị trí (dm_vi_tri) tự tạo trong lần nhập này sẽ nằm dưới cấp này. */
  viTriParentId: z.string().uuid().optional().nullable(),
  /** Giá trị mặc định cho các trường thiếu trong file (key trường → giá trị áp cho mọi dòng bỏ trống). */
  defaults: z.record(z.string(), z.string()).optional(),
  /**
   * CHỈ dùng cho XEM TRƯỚC (commit=false): các bản ghi sẽ được tạo bởi lớp cha
   * trong cùng file all-in-one (table → [{ma, ten}]). Nạp vào chỉ mục tham chiếu
   * dưới dạng "sắp có" để lớp con không báo "Không tìm thấy" oan. Bị bỏ qua khi
   * commit=true (lúc đó cha đã ghi thật nên chỉ mục nạp từ CSDL là đủ).
   */
  extraRefs: z
    .record(
      z.string(),
      z.array(z.object({ ma: z.string().optional(), ten: z.string().optional() })),
    )
    .optional(),
  /**
   * Danh sách bảng "danh mục nền" (vd dm_phan_loai, dm_nhom_he_thong) mà admin
   * ĐÃ XÁC NHẬN cho phép tự tạo mới khi thiếu. Nếu bảng bị "guard" mà KHÔNG nằm
   * trong danh sách này thì lần thiếu sẽ báo lỗi + trả về refConfirm để hỏi admin.
   */
  allowRefCreate: z.array(z.string()).optional(),
  /**
   * Cột kỹ thuật của mẫu All-in-one, KHỚP THEO CHỈ SỐ với `rows`. Dùng để:
   *   * `_record_id`  — nhắm đúng bản ghi (đổi tên mã không nhân bản).
   *   * `_row_version`— phiên bản (updated_at) lúc tải mẫu → phát hiện xung đột.
   *   * `_action`     — create/update/skip/delete (skip/delete = bỏ qua ghi).
   * CSV thường không có meta nên trường này optional.
   */
  meta: z
    .array(
      z.object({
        _record_id: z.string().optional().default(""),
        _row_version: z.string().optional().default(""),
        _action: z.string().optional().default(""),
        _source_row: z.string().optional().default(""),
      }),
    )
    .optional(),
  /**
   * Khi TRUE: vẫn ghi đè các dòng bị phát hiện XUNG ĐỘT (row_version lệch). Mặc
   * định FALSE = bỏ qua dòng xung đột để bảo vệ thay đổi của người khác.
   */
  allowOverwrite: z.boolean().default(false),
});

export const runBulkImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabase = context.supabase as any;
    await assertAdmin(supabase, userId);

    const ent = findEntity(data.entity, data.catTable);
    if (!ent) throw new Error("Không tìm thấy loại dữ liệu để nhập");

    // 1. Nạp bản ghi hiện có theo khóa tự nhiên (+ phiên bản để phát hiện xung đột).
    const existing = new Map<string, string>(); // key(noAccent) -> id
    const versionById = new Map<string, string>(); // id -> updated_at (ISO)
    {
      // Thử kèm updated_at; bảng nào không có cột này thì nạp lại không kèm.
      let rows: any[] | null = null;
      const withVer = await supabase
        .from(ent.table)
        .select(`id, ${ent.naturalKey}, updated_at`)
        .limit(20000);
      if (withVer.error) {
        const noVer = await supabase.from(ent.table).select(`id, ${ent.naturalKey}`).limit(20000);
        if (noVer.error) throw new Error(noVer.error.message);
        rows = noVer.data;
      } else {
        rows = withVer.data;
      }
      for (const r of rows ?? []) {
        const k = noAccent(String((r as any)[ent.naturalKey] ?? ""));
        const id = (r as any).id as string;
        if (k) existing.set(k, id);
        const uv = (r as any).updated_at;
        if (id && uv) versionById.set(id, new Date(uv).toISOString());
      }
    }

    // 1b. Kiểm tra trước khi ghi (Bắt buộc 4): nạp serial hiện có để phát hiện trùng.
    const existingSerials = new Map<string, string>(); // serial(noAccent) -> ma_thiet_bi
    if (ent.table === "thiet_bi") {
      const { data: rows } = await supabase
        .from("thiet_bi")
        .select("ma_thiet_bi, ma_serial")
        .not("ma_serial", "is", null)
        .limit(20000);
      for (const r of rows ?? []) {
        const s = noAccent(String((r as any).ma_serial ?? ""));
        if (s) existingSerials.set(s, String((r as any).ma_thiet_bi ?? ""));
      }
    }
    const batchSerials = new Map<string, number>(); // serial(noAccent) -> dòng đầu tiên gặp

    // 2. Nạp chỉ mục các bảng tham chiếu.
    const refFields = ent.fields.filter((f) => f.kind === "ref" && f.ref);
    const refIdx = new Map<string, RefIndex>();
    // Bảng cha dùng để KẾ THỪA (vd nhóm→hệ thống): cần nạp thêm cột nguồn kế
    // thừa (phan_loai_id, linh_vuc_id…) chứ không chỉ id/ma/tên, nếu không giá
    // trị kế thừa sẽ luôn rỗng.
    let inheritTable = "";
    const inheritCols: string[] = [];
    if (ent.inheritFromRef) {
      const rf = ent.fields.find(
        (f) => f.key === ent.inheritFromRef!.field && f.kind === "ref" && f.ref,
      );
      if (rf?.ref) {
        inheritTable = rf.ref.table;
        inheritCols.push(...Object.values(ent.inheritFromRef.map));
      }
    }
    for (const f of refFields) {
      const table = f.ref!.table;
      if (refIdx.has(table)) continue;
      // Cho phép bảng có khóa/tên KHÔNG phải "ma"/"ten" (vd thiet_bi ->
      // ma_thiet_bi/ma_serial) qua keyCol/nameCol; alias về "ma"/"ten" khi đọc.
      const keyCol = f.ref!.keyCol ?? "ma";
      const nameCol = f.ref!.nameCol ?? "ten";
      const maSel = keyCol === "ma" ? "ma" : `ma:${keyCol}`;
      const tenSel = nameCol === "ten" ? "ten" : `ten:${nameCol}`;
      const cols =
        table === inheritTable ? ["id", maSel, tenSel, ...inheritCols] : ["id", maSel, tenSel];
      const { data: rows, error } = await supabase
        .from(table)
        .select([...new Set(cols)].join(", "))
        .limit(20000);
      if (error) throw new Error(error.message);
      const byMa = new Map<string, any>();
      const byTen = new Map<string, any>();
      const byTight = new Map<string, any>();
      for (const r of rows ?? []) {
        if ((r as any).ma) byMa.set(noAccent(String((r as any).ma)), r);
        if ((r as any).ten) byTen.set(noAccent(String((r as any).ten)), r);
        if ((r as any).ten) byTight.set(tightKey(String((r as any).ten)), r);
        if ((r as any).ma) byTight.set(tightKey(String((r as any).ma)), r);
      }
      refIdx.set(table, { table, byMa, byTen, byTight, create: !!f.ref!.create });
    }

    // 2b. XEM TRƯỚC: coi các bản ghi mà lớp cha (cùng file) sắp tạo là "đã có"
    // để lớp con không báo "Không tìm thấy" oan. Dùng sentinel id="__pending__"
    // (không bao giờ ghi vì chỉ áp dụng khi commit=false).
    if (!data.commit && data.extraRefs) {
      for (const [table, items] of Object.entries(data.extraRefs)) {
        const idx = refIdx.get(table);
        if (!idx) continue; // chỉ quan tâm bảng mà entity này thực sự tham chiếu
        for (const it of items) {
          const sentinel = { id: "__pending__", ma: it.ma ?? "", ten: it.ten ?? "" };
          if (it.ma) {
            const k = noAccent(it.ma);
            if (!idx.byMa.has(k)) idx.byMa.set(k, sentinel);
            if (!idx.byTight.has(tightKey(it.ma))) idx.byTight.set(tightKey(it.ma), sentinel);
          }
          if (it.ten) {
            const k = noAccent(it.ten);
            if (!idx.byTen.has(k)) idx.byTen.set(k, sentinel);
            if (!idx.byTight.has(tightKey(it.ten))) idx.byTight.set(tightKey(it.ten), sentinel);
          }
        }
      }
    }

    // Gom danh mục cần tạo mới (khi tự tạo được).
    const pendingRefCreate = new Map<
      string,
      Map<string, { ma: string; ten: string; extra?: Record<string, unknown> }>
    >();
    // Đếm số ref đã DÙNG LẠI (khớp ma/ten sẵn có) theo bảng — để báo cáo import.
    const refReusedByTable = new Map<string, Set<string>>();
    // Nhãn hiển thị theo bảng ref (lấy từ FieldDef.label lần đầu gặp).
    const refLabelByTable = new Map<string, string>();
    for (const f of refFields)
      if (!refLabelByTable.has(f.ref!.table)) refLabelByTable.set(f.ref!.table, f.label);

    // Danh mục nền "guard" (nhóm phân loại / nhóm hệ thống) đang thiếu và CHƯA
    // được admin xác nhận cho tạo mới → gom lại để hỏi (table|value → {table,label,value}).
    const allowSet = new Set(data.allowRefCreate ?? []);
    const refConfirm = new Map<string, { table: string; label: string; value: string }>();

    // Tự sinh mã khi bản ghi không có mã (insert). Có mã & khớp → update.
    const usedKeys = new Set<string>();
    const autoPrefix =
      ({ thiet_bi: "TB", dm_he_thong: "HT", dm_model: "MDL" } as Record<string, string>)[
        ent.table
      ] ?? "REC";
    const genBase = Date.now().toString(36).toUpperCase();
    let autoSeq = 0;
    const genKey = (prefix: string): string => {
      let k: string;
      do {
        autoSeq++;
        k = `${prefix}-${genBase}-${String(autoSeq).padStart(3, "0")}`;
      } while (existing.has(noAccent(k)) || usedKeys.has(noAccent(k)));
      usedKeys.add(noAccent(k));
      return k;
    };

    // Cột "tên" của entity — dùng để tự sinh mã ỔN ĐỊNH khi bỏ trống mã (nhập
    // lại cùng tên sẽ khớp mã cũ, không nhân bản).
    const nameKey = ent.fields.find((f) => f.key === "ten_thiet_bi" || f.key === "ten")?.key;
    const slugCode = (s: string) =>
      noAccent(s)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 48);

    const preview: PreviewRow[] = [];
    const writes: Array<{ id?: string; payload: Record<string, unknown>; lapViTri?: string }> = [];

    for (let i = 0; i < data.rows.length; i++) {
      const rawFile = data.rows[i];
      // Áp giá trị mặc định: ô nào trống (hoặc file không có cột) thì lấy giá trị admin đã khai chung.
      const raw: Record<string, string> = { ...rawFile };
      if (data.defaults) {
        for (const [k, v] of Object.entries(data.defaults)) {
          if ((v ?? "").trim() !== "" && (raw[k] ?? "").trim() === "") raw[k] = v.trim();
        }
      }
      const messages: string[] = [];
      const warnings: string[] = [];
      const refCreations: string[] = [];
      const payload: Record<string, unknown> = {};

      let keyRaw = (raw[ent.keyHeader] ?? "").trim();
      const keyWasBlank = keyRaw === "";
      let keyNorm = noAccent(keyRaw);

      // Không có mã → TỰ SINH mã: ưu tiên mã ổn định từ TÊN (nhập lại không nhân
      // bản); nếu không có tên thì sinh mã ngẫu nhiên. Có mã & khớp bản ghi cũ →
      // CẬP NHẬT. Có mã & chưa có → tạo mới với mã đó.
      if (keyWasBlank) {
        const nm = nameKey ? (raw[nameKey] ?? "").trim() : "";
        const derived = nm ? slugCode(nm) : "";
        if (derived) {
          keyRaw = derived;
          warnings.push(`Mã tự sinh từ tên: ${keyRaw}`);
        } else {
          keyRaw = genKey(autoPrefix);
          warnings.push(`Mã tự sinh: ${keyRaw}`);
        }
        keyNorm = noAccent(keyRaw);
      }

      // Cột kỹ thuật (meta) khớp theo chỉ số — có thể không có (CSV thường).
      const meta = data.meta?.[i];
      const metaAction = (meta?._action ?? "").trim().toLowerCase();

      // Ngữ cảnh: bản ghi đã tồn tại → CẬP NHẬT. Ưu tiên nhắm theo _record_id (đổi
      // tên mã không nhân bản); nếu không có thì khớp theo mã tự nhiên.
      const existId = (meta?._record_id ?? "").trim() || existing.get(keyNorm);
      const isUpdate = !!existId;

      // Bỏ qua dòng theo yêu cầu (mẫu đánh dấu skip/delete ở cột _action).
      if (metaAction === "skip" || metaAction === "delete") {
        preview.push({
          index: i,
          action: "skip",
          key: keyRaw,
          messages: [],
          warnings: [`Bỏ qua theo _action="${metaAction}"`],
          refCreations: [],
        });
        continue;
      }

      // Phát hiện XUNG ĐỘT: bản ghi đã đổi trong CSDL sau khi tải mẫu.
      if (isUpdate && !data.allowOverwrite) {
        const fileVer = (meta?._row_version ?? "").trim();
        const dbVerRaw = versionById.get(existId);
        if (fileVer && dbVerRaw) {
          const dbVer = new Date(dbVerRaw).toISOString();
          const fileVerIso = (() => {
            const d = new Date(fileVer);
            return isNaN(d.getTime()) ? fileVer : d.toISOString();
          })();
          if (fileVerIso !== dbVer) {
            preview.push({
              index: i,
              action: "skip",
              key: keyRaw,
              messages: [],
              warnings: [
                "Xung đột: bản ghi đã bị sửa trong CSDL sau khi tải mẫu — bỏ qua (bật 'Ghi đè' để vẫn ghi)",
              ],
              refCreations: [],
            });
            continue;
          }
        }
      }

      // Các trường thường + tham chiếu.
      for (const f of ent.fields) {
        if (f.virtual) continue; // trường ảo (vd "Lắp vào vị trí") xử lý sau khi ghi
        const col = f.col ?? f.key;
        if (f.kind === "ref" && f.ref) {
          const val = (raw[f.key] ?? "").trim();
          if (!val) {
            // Chỉ bắt buộc khi TẠO MỚI; cập nhật thì bỏ trống = giữ nguyên.
            if (f.required && !isUpdate) messages.push(`Thiếu "${f.label}"`);
            continue;
          }
          const idx = refIdx.get(f.ref.table)!;
          const norm = noAccent(val);
          let hit: any = null;
          for (const by of f.ref.by)
            hit = hit ?? (by === "ma" ? idx.byMa.get(norm) : idx.byTen.get(norm));
          // Chống trùng: nếu chưa khớp chính xác, thử khớp "gần đúng" (bỏ dấu/khoảng trắng).
          if (!hit) {
            const tightHit = idx.byTight.get(tightKey(val));
            if (tightHit) {
              hit = tightHit;
              warnings.push(
                `${f.label}: dùng danh mục sẵn có "${tightHit.ten ?? tightHit.ma}" (khớp gần đúng với "${val}") — tránh tạo trùng`,
              );
            }
          }
          if (hit) {
            payload[f.ref.idCol] = hit.id;
            // Ghi nhận DÙNG LẠI: khớp theo ma (chính xác) hoặc theo ten (đã bỏ dấu).
            if (hit.id !== "__pending__") {
              let s = refReusedByTable.get(f.ref.table);
              if (!s) {
                s = new Set();
                refReusedByTable.set(f.ref.table, s);
              }
              s.add(String(hit.id));
            }
            // Kế thừa phân lớp từ bản ghi cha (tài sản←hệ thống, hệ thống←nhóm).
            // CHỈ điền khi hàng chưa tự khai — không ghi đè giá trị khai tay.
            if (ent.inheritFromRef && ent.inheritFromRef.field === f.key) {
              for (const [dst, srcCol] of Object.entries(ent.inheritFromRef.map)) {
                if (payload[dst] == null && (hit as any)[srcCol] != null)
                  payload[dst] = (hit as any)[srcCol];
              }
            }
          } else if (idx.create) {
            // DANH MỤC NỀN (nhóm phân loại / nhóm hệ thống) đang thiếu: chỉ CẢNH
            // BÁO để admin biết, nhưng VẪN cho phép tạo mới và ghi bình thường.
            if (f.ref.guard && !allowSet.has(f.ref.table)) {
              refConfirm.set(`${f.ref.table}|${norm}`, {
                table: f.ref.table,
                label: f.label,
                value: val,
              });
              warnings.push(`Sẽ tạo mới ${f.label} "${val}" (chưa có trong CSDL)`);
            }
            // Đăng ký tạo mới danh mục.
            let bucket = pendingRefCreate.get(f.ref.table);
            if (!bucket) {
              bucket = new Map();
              pendingRefCreate.set(f.ref.table, bucket);
            }
            if (!bucket.has(norm)) bucket.set(norm, { ma: val, ten: val });
            // Nếu đây là ref KẾ THỪA (vd Hệ thống → Nhóm hệ thống): gắn phân lớp
            // của dòng con vào danh mục cha SẮP TẠO, để nhóm không bị "chưa phân
            // loại". Chỉ cần điền Phân loại ở sheet Hệ thống là nhóm cũng có.
            if (ent.inheritFromRef && ent.inheritFromRef.field === f.key) {
              const b = bucket.get(norm)!;
              for (const [dst, srcCol] of Object.entries(ent.inheritFromRef.map)) {
                if (payload[dst] != null && b.extra?.[srcCol] == null) {
                  b.extra = { ...(b.extra ?? {}), [srcCol]: payload[dst] };
                }
              }
            }
            refCreations.push(`${f.label}: "${val}"`);
            payload[`__ref__${f.ref.idCol}__${f.ref.table}`] = norm; // giải quyết sau khi tạo
          } else {
            messages.push(`Không tìm thấy ${f.label} "${val}"`);
          }
          continue;
        }

        const { value, error } = coerce(f, raw[f.key] ?? "");
        if (error) messages.push(error);
        // Bỏ qua "thiếu" cho chính cột mã khi mã đã tự sinh (bỏ trống mã = tạo mới).
        const isKeyField = col === ent.naturalKey;
        if (
          f.required &&
          !isUpdate &&
          (value == null || value === "") &&
          !(isKeyField && keyWasBlank)
        ) {
          messages.push(`Thiếu "${f.label}"`);
        }
        if (value != null) payload[col] = value;
      }

      // Cột mở rộng x_* → thuoc_tinh (chỉ với tài sản).
      if (ent.table === "thiet_bi") {
        const thuoc: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw)) {
          if (k.startsWith("x_") && v.trim() !== "") thuoc[k] = v.trim();
        }
        if (Object.keys(thuoc).length) payload.thuoc_tinh = thuoc;

        // Kiểm tra trước khi ghi (Bắt buộc 4).
        // 1) Tài sản không thuộc hệ thống nào.
        if (payload.he_thong_id == null && !("__ref__he_thong_id__dm_he_thong" in payload)) {
          warnings.push("Tài sản chưa gắn hệ thống (he_thong trống)");
        }
        // 2) Serial trùng — trong file và với dữ liệu hiện có.
        const serialNorm = noAccent((raw["ma_serial"] ?? "").trim());
        if (serialNorm) {
          const firstRow = batchSerials.get(serialNorm);
          if (firstRow != null) warnings.push(`Serial trùng với dòng ${firstRow + 1} trong file`);
          else batchSerials.set(serialNorm, i);
          const dbMa = existingSerials.get(serialNorm);
          if (dbMa && noAccent(dbMa) !== keyNorm)
            warnings.push(`Serial đã tồn tại ở tài sản "${dbMa}"`);
        }
        // 3) Mâu thuẫn với mẫu: khai nhà sản xuất/loại nhưng đã chọn mẫu (mẫu sẽ ghi đè).
        const hasModel = payload.model_id != null || "__ref__model_id__dm_model" in payload;
        if (
          hasModel &&
          ((raw["nha_san_xuat"] ?? "").trim() || (raw["loai_thiet_bi"] ?? "").trim())
        ) {
          warnings.push(
            "Đã chọn mẫu — nhà sản xuất/chủng loại sẽ kế thừa từ mẫu, cột khai tay có thể bị bỏ qua",
          );
        }
      }

      // Trường ảo "Lắp vào vị trí (thành phần)": lắp tài sản vào 1 thành phần
      // trong hệ thống sau khi ghi. Cần có hệ thống mới lắp được.
      const lapViTri = ent.table === "thiet_bi" ? (raw["lap_vi_tri"] ?? "").trim() : "";
      if (
        lapViTri &&
        payload.he_thong_id == null &&
        !("__ref__he_thong_id__dm_he_thong" in payload)
      ) {
        warnings.push("Đã điền 'Lắp vào vị trí' nhưng thiếu Hệ thống — bỏ qua lắp đặt");
      }

      // Bảo đảm khóa tự nhiên có trong payload.
      payload[ent.naturalKey] = keyRaw;

      if (messages.length) {
        preview.push({ index: i, action: "error", key: keyRaw, messages, warnings, refCreations });
      } else {
        preview.push({
          index: i,
          action: existId ? "update" : "create",
          key: keyRaw,
          messages: [],
          warnings,
          refCreations,
        });
        writes.push({ id: existId, payload, lapViTri: lapViTri || undefined });
      }
    }

    const confirms = [...refConfirm.values()];
    // Tổng hợp DÙNG LẠI ref theo bảng (kèm nhãn để UI hiển thị).
    const refReusedList = [...refReusedByTable.entries()].map(([table, set]) => ({
      table,
      label: refLabelByTable.get(table) ?? table,
      count: set.size,
    }));
    const summary = {
      total: data.rows.length,
      create: preview.filter((p) => p.action === "create").length,
      update: preview.filter((p) => p.action === "update").length,
      error: preview.filter((p) => p.action === "error").length,
      skip: preview.filter((p) => p.action === "skip").length,
      refCreate: [...pendingRefCreate.values()].reduce((s, m) => s + m.size, 0),
      refConfirm: confirms.length,
      refReused: refReusedList.reduce((s, r) => s + r.count, 0),
    };

    if (!data.commit) {
      return {
        committed: false,
        summary,
        preview,
        confirms,
        refReusedByTable: refReusedList,
        entity: ent.id,
        table: ent.table,
      };
    }

    // 3. GHI THẬT — tạo danh mục thiếu trước, lấy id mới.
    const resolvedRef = new Map<string, Map<string, string>>(); // table -> norm -> id
    // Danh sách các bản ghi ref MỚI TẠO thật sự (để báo cáo cho UI, gồm cả link).
    const refCreatedByTable: Array<{
      table: string;
      label: string;
      items: Array<{ id: string; ma: string | null; ten: string }>;
    }> = [];
    for (const [table, bucket] of pendingRefCreate) {
      // Vị trí tự tạo → gắn vào cấp cha mặc định (nếu admin đã chọn) để không nằm rời.
      const parentId = table === "dm_vi_tri" && data.viTriParentId ? data.viTriParentId : null;
      const inserts = [...bucket.values()].map((x) => {
        const base: Record<string, unknown> = { ma: x.ma, ten: x.ten, ...(x.extra ?? {}) };
        if (parentId) base.parent_id = parentId;
        return base;
      });
      if (!inserts.length) continue;
      const { data: created, error } = await supabase
        .from(table)
        .insert(inserts)
        .select("id, ma, ten");
      if (error) throw new Error(`Tạo danh mục ${table} lỗi: ${error.message}`);
      const map = new Map<string, string>();
      for (const r of created ?? []) {
        map.set(noAccent(String((r as any).ma)), (r as any).id);
        map.set(noAccent(String((r as any).ten)), (r as any).id);
      }
      resolvedRef.set(table, map);
      refCreatedByTable.push({
        table,
        label: refLabelByTable.get(table) ?? table,
        items: ((created ?? []) as any[]).map((r) => ({
          id: String(r.id),
          ma: r.ma ?? null,
          ten: String(r.ten ?? ""),
        })),
      });
    }

    // Thay các placeholder __ref__ bằng id thật.
    for (const w of writes) {
      for (const k of Object.keys(w.payload)) {
        if (!k.startsWith("__ref__")) continue;
        const [realIdCol, realTable] = k.substring("__ref__".length).split("__");
        const norm = String(w.payload[k]);
        const id = resolvedRef.get(realTable)?.get(norm);
        if (id) w.payload[realIdCol] = id;
        delete w.payload[k];
      }
    }

    let created = 0,
      updated = 0,
      lapped = 0;
    const errors: Array<{ key: string; message: string }> = [];
    for (let i = 0; i < writes.length; i++) {
      const w = writes[i];
      let deviceId = w.id;
      try {
        if (w.id) {
          const { error } = await supabase.from(ent.table).update(w.payload).eq("id", w.id);
          if (error) throw new Error(error.message);
          updated++;
        } else {
          const { data: ins, error } = await supabase
            .from(ent.table)
            .insert(w.payload)
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          deviceId = (ins as any)?.id;
          created++;
        }
      } catch (e) {
        errors.push({
          key: String(w.payload[ent.naturalKey] ?? ""),
          message: (e as Error).message,
        });
        continue;
      }

      // Trường ảo "Lắp vào vị trí": tìm/tạo thành phần trong hệ thống rồi lắp tài sản.
      if (ent.table === "thiet_bi" && w.lapViTri && deviceId && w.payload.he_thong_id) {
        try {
          const heThongId = String(w.payload.he_thong_id);
          const tpNorm = noAccent(w.lapViTri);
          // Tìm thành phần đã có trong hệ thống theo tên hoặc mã.
          const { data: tps } = await supabase
            .from("he_thong_thanh_phan")
            .select("id, ten, ma_thanh_phan")
            .eq("he_thong_id", heThongId);
          let tpId: string | undefined = (tps ?? []).find(
            (t: any) =>
              noAccent(String(t.ten)) === tpNorm || noAccent(String(t.ma_thanh_phan)) === tpNorm,
          )?.id;
          // Chưa có → tạo thành phần mới (TPHT_…).
          if (!tpId) {
            const ma = `TPHT_${Date.now().toString(36).toUpperCase()}${String(i + 1).padStart(3, "0")}`;
            const { data: newTp, error: tpErr } = await supabase
              .from("he_thong_thanh_phan")
              .insert({ he_thong_id: heThongId, ten: w.lapViTri, ma_thanh_phan: ma })
              .select("id")
              .single();
            if (tpErr) throw new Error(tpErr.message);
            tpId = (newTp as any)?.id;
          }
          if (tpId) {
            const { error: rpcErr } = await supabase.rpc("lap_thiet_bi", {
              p_thanh_phan_id: tpId,
              p_thiet_bi_id: deviceId,
              p_ghi_chu: "Lắp từ nhập liệu hàng loạt",
            });
            if (rpcErr) throw new Error(rpcErr.message);
            lapped++;
          }
        } catch (e) {
          errors.push({
            key: String(w.payload[ent.naturalKey] ?? ""),
            message: `Lắp vào vị trí lỗi: ${(e as Error).message}`,
          });
        }
      }
    }

    return {
      committed: true,
      summary: { ...summary, created, updated, lapped, writeErrors: errors.length },
      errors,
      confirms,
      refCreatedByTable,
      refReusedByTable: refReusedList,
      entity: ent.id,
      table: ent.table,
    };
  });
