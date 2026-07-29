// ============================================================================
// Server function: Trung tâm rà soát chất lượng dữ liệu nhập (Data Quality).
//
// Tổng hợp các dòng staging (import_item) của những lô CHƯA xử lý xong, đối
// chiếu với dữ liệu hiện có (resolveEntity) rồi phân nhóm (classifyItem) thành:
// chưa xử lý / có thể trùng / trùng serial / xung đột FK / thiếu dữ liệu /
// danh mục gần trùng. KHÔNG tự sửa — chỉ đọc & phân loại để người dùng rà soát.
//
// Cho lọc theo đơn vị / hệ thống / lô / entity. Chỉ Admin.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import {
  findEntity,
  noAccent,
  fieldMap,
  type EntityDef,
} from "@/lib/mirats/import-config";
import {
  resolveEntity,
  type AliasEntry,
  type Candidate,
} from "@/lib/mirats/entity-resolve";
import {
  classifyItem,
  summarizeReview,
  type Classification,
  type ReviewCategory,
} from "@/lib/mirats/data-quality";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: chỉ Admin được rà soát dữ liệu nhập");
}

const AnalyzeInput = z.object({
  batchId: z.string().uuid().optional(),
  entity: z.string().optional(),
  donVi: z.string().optional(),
  heThong: z.string().optional(),
  limit: z.number().int().positive().max(8000).default(4000),
});

export interface ReviewRowOut {
  itemId: string;
  batchId: string;
  batchName: string;
  sheet: string | null;
  entity: string;
  entityLabel: string;
  rowIndex: number;
  keyValue: string;
  displayName: string;
  donVi: string;
  heThong: string;
  category: ReviewCategory;
  severity: Classification["severity"];
  reason: string;
  candidateId: string | null;
  candidateLabel: string | null;
  candidateCount: number;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = str(row[k]);
    if (v) return v;
  }
  return "";
}

/** Nạp ứng viên (id/ma/ten/serial/model/nsx) cho một bảng đích. */
async function loadCandidates(supabase: any, table: string): Promise<Candidate[]> {
  const cols =
    table === "thiet_bi"
      ? "id, ma:ma_thiet_bi, ten:ten_thiet_bi, ma_serial, model_id, nha_san_xuat_id"
      : "id, ma, ten";
  const { data, error } = await supabase.from(table).select(cols).limit(20000);
  if (error) return [];
  return (data ?? []) as Candidate[];
}

/** Nạp tập {ma,ten} đã chuẩn hóa cho bảng tham chiếu để kiểm tra map FK. */
async function loadRefKeys(supabase: any, table: string): Promise<Set<string>> {
  const set = new Set<string>();
  const { data, error } = await supabase.from(table).select("ma, ten").limit(20000);
  if (error) return set;
  for (const r of data ?? []) {
    const ma = noAccent(str((r as any).ma));
    const ten = noAccent(str((r as any).ten));
    if (ma) set.add(ma);
    if (ten) set.add(ten);
  }
  return set;
}

export const analyzeReviewQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
  .handler(async ({ data, context }) => {
    const started = Date.now();
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);

    // 1) Lô đang mở (chưa commit/discard).
    let bq = supabase
      .from("import_batch")
      .select("id, file_name, status, source")
      .in("status", ["staged", "reviewing"]);
    if (data.batchId) bq = bq.eq("id", data.batchId);
    const { data: batches, error: bErr } = await bq.limit(500);
    if (bErr) throw new Error(bErr.message);
    const batchMap = new Map<string, { name: string }>(
      (batches ?? []).map((b: any) => [b.id, { name: b.file_name }]),
    );
    const batchIds = [...batchMap.keys()];

    // Đếm lô đã rollback (thông tin phụ trợ cho báo cáo).
    const { count: rolledBackCount } = await supabase
      .from("import_batch")
      .select("id", { count: "exact", head: true })
      .in("status", ["rolled_back", "partially_rolled_back"]);

    if (batchIds.length === 0) {
      return {
        rows: [] as ReviewRowOut[],
        metrics: summarizeReview([]),
        elapsedMs: Date.now() - started,
        batchCount: 0,
        rolledBackCount: rolledBackCount ?? 0,
      };
    }

    // 2) Dòng staging của các lô đó.
    let iq = supabase
      .from("import_item")
      .select("id, batch_id, sheet, entity, cat_table, row_index, raw_row, normalized_row, status")
      .in("batch_id", batchIds)
      .not("status", "in", "(committed,skipped)");
    if (data.entity) iq = iq.eq("entity", data.entity);
    const { data: items, error: iErr } = await iq.limit(data.limit);
    if (iErr) throw new Error(iErr.message);
    const rawItems = (items ?? []) as any[];

    // 3) Nạp trước ứng viên theo bảng đích + tập khóa cho các bảng tham chiếu.
    const entityCache = new Map<string, EntityDef | null>();
    const getEntity = (id: string, catTable?: string): EntityDef | null => {
      const key = `${id}::${catTable ?? ""}`;
      if (!entityCache.has(key)) entityCache.set(key, findEntity(id, catTable));
      return entityCache.get(key) ?? null;
    };

    const targetTables = new Set<string>();
    const refTables = new Set<string>();
    for (const it of rawItems) {
      const ent = getEntity(it.entity, it.cat_table);
      if (!ent) continue;
      targetTables.add(ent.table);
      for (const f of ent.fields) {
        if (f.kind === "ref" && f.ref && f.ref.create !== true) refTables.add(f.ref.table);
      }
    }

    const candCache = new Map<string, Candidate[]>();
    await Promise.all(
      [...targetTables].map(async (t) => candCache.set(t, await loadCandidates(supabase, t))),
    );
    const refCache = new Map<string, Set<string>>();
    await Promise.all(
      [...refTables].map(async (t) => refCache.set(t, await loadRefKeys(supabase, t))),
    );

    // Alias đã xác nhận (dùng cho đối chiếu).
    const { data: aliasRows } = await supabase
      .from("import_alias")
      .select("entity, scope, alias_norm, canonical_id")
      .limit(20000);
    const aliasesByEntity = new Map<string, AliasEntry[]>();
    for (const a of aliasRows ?? []) {
      const list = aliasesByEntity.get((a as any).entity) ?? [];
      list.push({
        alias: (a as any).alias_norm,
        canonical_id: (a as any).canonical_id,
        entity: (a as any).entity,
        scope: (a as any).scope,
      });
      aliasesByEntity.set((a as any).entity, list);
    }

    // 4) Phân loại từng dòng + lọc theo đơn vị/hệ thống.
    const donViFilter = noAccent(str(data.donVi));
    const heThongFilter = noAccent(str(data.heThong));
    const rows: ReviewRowOut[] = [];
    const classes: Classification[] = [];

    for (const it of rawItems) {
      const ent = getEntity(it.entity, it.cat_table);
      const row: Record<string, unknown> = (it.normalized_row ?? it.raw_row ?? {}) as any;
      const donVi = pick(row, ["don_vi", "don_vi_ma", "donVi"]);
      const heThong = pick(row, ["he_thong", "he_thong_ma", "heThong"]);

      if (donViFilter && noAccent(donVi) !== donViFilter) continue;
      if (heThongFilter && !noAccent(heThong).includes(heThongFilter)) continue;

      if (!ent) {
        const cls: Classification = {
          category: "fk_conflict",
          severity: "needs_review",
          reason: `Không nhận diện được loại dữ liệu "${it.entity}"`,
        };
        classes.push(cls);
        rows.push(buildRow(it, ent, cls, null, 0, "", "", donVi, heThong));
        continue;
      }

      const fm = fieldMap(ent);
      const keyValue = pick(row, [ent.keyHeader, ent.naturalKey]);
      const displayName = pick(row, ["ten", "ten_thiet_bi", "ten_he_thong", ent.keyHeader]);

      // Thiếu trường bắt buộc.
      const missingRequired = ent.fields
        .filter((f) => f.required && !str(row[f.key]))
        .map((f) => f.key);

      // Tham chiếu không map được (chỉ với ref không tự tạo).
      const unresolvedRefs: string[] = [];
      for (const f of ent.fields) {
        if (f.kind !== "ref" || !f.ref || f.ref.create === true) continue;
        const val = str(row[f.key]);
        if (!val) continue;
        const keys = refCache.get(f.ref.table);
        if (keys && !keys.has(noAccent(val))) unresolvedRefs.push(f.key);
      }

      // Đối chiếu theo khóa tự nhiên.
      const candidates = candCache.get(ent.table) ?? [];
      const isGuard = Object.values(fm).some((f) => f.ref?.guard);
      const matchRes = resolveEntity(
        {
          ma: keyValue || null,
          ten: displayName || null,
          ma_serial: str(row["ma_serial"]) || null,
        },
        candidates,
        aliasesByEntity.get(ent.id) ?? [],
        { entity: ent.id, guard: isGuard },
      );

      const cls = classifyItem({
        missingRequired,
        unresolvedRefs,
        isCatalogGuard: isGuard,
        match: matchRes,
      });
      classes.push(cls);
      rows.push(
        buildRow(
          it,
          ent,
          cls,
          matchRes.candidate?.id ?? null,
          matchRes.candidates.length,
          keyValue,
          displayName,
          donVi,
          heThong,
          matchRes.candidate?.ten ?? matchRes.candidate?.ma ?? null,
        ),
      );
    }

    function buildRow(
      it: any,
      ent: EntityDef | null,
      cls: Classification,
      candidateId: string | null,
      candidateCount: number,
      keyValue: string,
      displayName: string,
      donVi: string,
      heThong: string,
      candidateLabel: string | null = null,
    ): ReviewRowOut {
      return {
        itemId: it.id,
        batchId: it.batch_id,
        batchName: batchMap.get(it.batch_id)?.name ?? "",
        sheet: it.sheet ?? null,
        entity: it.entity,
        entityLabel: ent?.label ?? it.entity,
        rowIndex: it.row_index,
        keyValue,
        displayName,
        donVi,
        heThong,
        category: cls.category,
        severity: cls.severity,
        reason: cls.reason,
        candidateId,
        candidateLabel,
        candidateCount,
      };
    }

    return {
      rows,
      metrics: summarizeReview(classes),
      elapsedMs: Date.now() - started,
      batchCount: batchIds.length,
      rolledBackCount: rolledBackCount ?? 0,
    };
  });
